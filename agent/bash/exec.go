package bash

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"os/exec"
	"sync"
	"syscall"
	"time"

	"github.com/Tchoupinax/timelord/agent/api"
	"github.com/rs/zerolog/log"
)

func check(e error) {
	if e != nil {
		panic(e)
	}
}

type ExecResult struct {
	Status int
}

func Exec(bashScript string, apiUrl string, data *api.ResponseData) ExecResult {
	log.Info().Msg("🦫  Executing script")

	executionPath := "/tmp/timelord/" + data.Id

	err := os.MkdirAll(executionPath, os.ModePerm)
	if err != nil {
		fmt.Println(err)
	}

	cmd := exec.Command("/bin/bash", "-c", bashScript)
	cmd.Dir = executionPath
	stdout, err := cmd.StdoutPipe()
	check(err)
	stderr, err := cmd.StderrPipe()
	check(err)

	if err := cmd.Start(); err != nil {
		fmt.Printf("Error starting command: %v\n", err)
	}

	var logIndex int
	var wg sync.WaitGroup
	wg.Add(2)

	go streamOutputToWebSocket(stdout, &wg, "STDOUT", apiUrl, data, &logIndex)
	go streamOutputToWebSocket(stderr, &wg, "STDERR", apiUrl, data, &logIndex)

	wg.Wait()

	// Wait for the command to finish
	err = cmd.Wait()
	if err != nil {
		// Check if it's an ExitError (non-zero exit code)
		if exitError, ok := err.(*exec.ExitError); ok {
			// Extract and print the exit code
			if status, ok := exitError.Sys().(syscall.WaitStatus); ok {
				fmt.Printf("Script exited with code: %d\n", status.ExitStatus())

				return ExecResult{
					Status: status.ExitStatus(),
				}
			}

			return ExecResult{
				Status: 1,
			}
		} else {
			fmt.Printf("Error waiting for script: %v\n", err)
			return ExecResult{
				Status: 1,
			}
		}
	} else {
		log.Info().Msg("✅ Script executed with success")
		return ExecResult{
			Status: 0,
		}
	}
}

func streamOutputToWebSocket(pipe io.ReadCloser, wg *sync.WaitGroup, prefix string, apiUrl string, data *api.ResponseData, logIndex *int) {
	var mu sync.Mutex

	defer wg.Done()

	scanner := bufio.NewScanner(pipe)
	for scanner.Scan() {
		line := scanner.Text()
		createdAt := time.Now().Format(time.RFC3339)

		mu.Lock()
		currentLogIndex := *logIndex
		*logIndex++
		mu.Unlock()

		go func() {
			api.PushLog(
				apiUrl+"/logs",
				data,
				line,
				createdAt,
				currentLogIndex,
				prefix,
			)
		}()
	}
}
