package bash

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/Tchoupinax/timelord/agent/api"
	_ "github.com/Tchoupinax/timelord/agent/logger"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
)

const (
	// A job which never returns locks the agent forever: it stops polling for
	// new jobs. The server flags unfinished jobs after 30 minutes, the agent
	// stays aligned with it.
	defaultJobTimeout = 30 * time.Minute
	// Exit code used by GNU timeout, reused here for a job killed on deadline.
	timeoutExitCode = 124
	// Lines longer than this are split into several log entries. Tools such as
	// terraform or rclone can emit megabytes without a single line break.
	maxLogLineLength = 8000
	// Size of the read buffer, must stay above maxLogLineLength.
	readBufferSize = 1 << 20
	// Delay left to a killed process group before giving up on it.
	killGrace = 10 * time.Second
	// Delay left to orphan children still holding stdout/stderr once the script
	// itself has exited.
	orphanOutputGrace = 5 * time.Second
)

type ExecResult struct {
	Status     int
	FinalState string // Success, Warning, or Error from TIMELORD_STATE
	TimedOut   bool
}

var allowedFinalStates = map[string]bool{
	"Success": true,
	"Warning": true,
	"Error":   true,
}

func Exec(bashScript string, apiUrl string, data *api.ResponseData) ExecResult {
	log.Info().Msg("🦫  Executing script")

	executionPath := "/tmp/timelord/" + data.Id

	if err := os.MkdirAll(executionPath, os.ModePerm); err != nil {
		log.Error().Err(err).Msg("Failed to create the execution directory")
	}

	stateFilePath := executionPath + "/" + "timelord-state-" + uuid.New().String() + ".txt"

	timeout := jobTimeout()
	ctx := context.Background()
	cancel := context.CancelFunc(func() {})
	if timeout > 0 {
		ctx, cancel = context.WithTimeout(ctx, timeout)
	}
	defer cancel()

	cmd := exec.CommandContext(ctx, "/bin/bash", "-c", bashScript)
	cmd.Env = []string{fmt.Sprintf("TIMELORD_STATE=%s", stateFilePath)}
	cmd.Dir = executionPath
	// Own process group, so background children are killed with the script.
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	cmd.Cancel = func() error { return signalGroup(cmd, syscall.SIGTERM) }
	cmd.WaitDelay = killGrace

	// Pipes are created here instead of using cmd.StdoutPipe() so that the
	// agent keeps ownership of the read ends: orphan children inheriting the
	// write end can no longer keep the reader (and the agent) blocked forever.
	stdoutReader, stdoutWriter, err := os.Pipe()
	if err != nil {
		log.Error().Err(err).Msg("Failed to create the stdout pipe")
		return ExecResult{Status: 1}
	}
	stderrReader, stderrWriter, err := os.Pipe()
	if err != nil {
		closeAll(stdoutReader, stdoutWriter)
		log.Error().Err(err).Msg("Failed to create the stderr pipe")
		return ExecResult{Status: 1}
	}
	cmd.Stdout = stdoutWriter
	cmd.Stderr = stderrWriter

	if err := cmd.Start(); err != nil {
		closeAll(stdoutReader, stdoutWriter, stderrReader, stderrWriter)
		log.Error().Err(err).Msg("Error starting command")
		return ExecResult{Status: 1}
	}

	// Only the children keep the write ends open from now on, otherwise the
	// readers would never see EOF.
	closeAll(stdoutWriter, stderrWriter)

	pusher := newLogPusher(apiUrl, data)

	var wg sync.WaitGroup
	wg.Add(2)
	go streamOutput(stdoutReader, &wg, "STDOUT", pusher)
	go streamOutput(stderrReader, &wg, "STDERR", pusher)

	waitErr := cmd.Wait()
	timedOut := errors.Is(ctx.Err(), context.DeadlineExceeded)

	if timedOut {
		// The script is gone but its background children may not be.
		_ = signalGroup(cmd, syscall.SIGKILL)
	}

	// The script exited: give the remaining output a short window to be read,
	// then close the read ends so a leaked child cannot hold the agent hostage.
	if !waitWithTimeout(&wg, orphanOutputGrace) {
		log.Warn().Msg("Output still held by a background process, closing pipes")
		closeAll(stdoutReader, stderrReader)
		wg.Wait()
	}
	closeAll(stdoutReader, stderrReader)

	if timedOut {
		pusher.Push(
			fmt.Sprintf("Job killed by timelord after %s (job timeout reached)", timeout),
			"STDERR",
		)
	}
	pusher.Close()

	finalState := readFinalState(stateFilePath)

	if timedOut {
		log.Error().Dur("timeout", timeout).Msg("⏱️  Script timed out and was killed")
		return ExecResult{Status: timeoutExitCode, FinalState: finalState, TimedOut: true}
	}

	if waitErr != nil {
		var exitError *exec.ExitError
		if errors.As(waitErr, &exitError) {
			log.Error().Int("code", exitError.ExitCode()).Msg("Script exited with a non-zero code")

			status := exitError.ExitCode()
			if status <= 0 {
				// Killed by a signal, no exit code available.
				status = 1
			}

			return ExecResult{Status: status, FinalState: finalState}
		}

		log.Error().Err(waitErr).Msg("Error waiting for script")
		return ExecResult{Status: 1, FinalState: finalState}
	}

	log.Info().Msg("✅ Script executed with success")
	return ExecResult{Status: 0, FinalState: finalState}
}

// jobTimeout returns the maximum duration of a job. TIMELORD_JOB_TIMEOUT
// accepts a Go duration ("45m", "2h"); "0" or a negative value disables it.
func jobTimeout() time.Duration {
	raw := os.Getenv("TIMELORD_JOB_TIMEOUT")
	if raw == "" {
		return defaultJobTimeout
	}

	timeout, err := time.ParseDuration(raw)
	if err != nil {
		log.Warn().Str("value", raw).Msg("Invalid TIMELORD_JOB_TIMEOUT, falling back to the default")
		return defaultJobTimeout
	}
	if timeout < 0 {
		return 0
	}

	return timeout
}

func signalGroup(cmd *exec.Cmd, sig syscall.Signal) error {
	if cmd.Process == nil {
		return nil
	}
	// Negative pid targets the whole process group created with Setpgid.
	return syscall.Kill(-cmd.Process.Pid, sig)
}

func waitWithTimeout(wg *sync.WaitGroup, timeout time.Duration) bool {
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		return true
	case <-time.After(timeout):
		return false
	}
}

func closeAll(files ...*os.File) {
	for _, f := range files {
		_ = f.Close()
	}
}

func readFinalState(path string) string {
	b, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	s := strings.NewReplacer("\n", "", "\t", "").Replace(strings.TrimSpace(string(b)))
	if allowedFinalStates[s] {
		return s
	}
	return ""
}

func streamOutput(pipe io.Reader, wg *sync.WaitGroup, prefix string, pusher *logPusher) {
	defer wg.Done()

	scanner := bufio.NewScanner(pipe)
	scanner.Buffer(make([]byte, 0, 64*1024), readBufferSize)
	scanner.Split(splitLogLines)

	for scanner.Scan() {
		pusher.Push(scanner.Text(), prefix)
	}

	// Reading must never stop before EOF: an unread pipe blocks the script on
	// its next write, which used to freeze the agent for good.
	if err := scanner.Err(); err != nil && !errors.Is(err, os.ErrClosed) {
		log.Warn().Err(err).Str("stream", prefix).Msg("Stopped reading script output")
		_, _ = io.Copy(io.Discard, pipe)
	}
}

// splitLogLines splits on \n and on \r (progress bars from rclone, curl or
// docker) and emits a chunk whenever a line grows past maxLogLineLength, so an
// endless line can never overflow the buffer and abort the reader.
func splitLogLines(data []byte, atEOF bool) (int, []byte, error) {
	if atEOF && len(data) == 0 {
		return 0, nil, nil
	}

	if i := bytes.IndexAny(data, "\n\r"); i >= 0 {
		advance := i + 1
		if data[i] == '\r' {
			if advance == len(data) && !atEOF {
				// Wait to know whether a \n follows, to not split \r\n in two.
				return 0, nil, nil
			}
			if advance < len(data) && data[advance] == '\n' {
				advance++
			}
		}
		return advance, data[:i], nil
	}

	if len(data) >= maxLogLineLength {
		return maxLogLineLength, data[:maxLogLineLength], nil
	}

	if atEOF {
		return len(data), data, nil
	}

	return 0, nil, nil
}
