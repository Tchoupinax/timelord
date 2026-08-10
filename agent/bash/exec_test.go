package bash

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/Tchoupinax/timelord/agent/api"
)

// execWithDeadline fails the test instead of hanging it when Exec never returns.
func execWithDeadline(t *testing.T, script string, deadline time.Duration) ExecResult {
	t.Helper()

	done := make(chan ExecResult, 1)
	go func() {
		done <- Exec(script, "http://invalid.test", &api.ResponseData{Id: uniqueID(t)})
	}()

	select {
	case result := <-done:
		return result
	case <-time.After(deadline):
		t.Fatalf("Exec() did not return within %s, the agent would be locked", deadline)
		return ExecResult{}
	}
}

// uniqueID returns a filesystem-safe test ID from t.Name() to avoid /tmp/timelord collisions.
func uniqueID(t *testing.T) string {
	return strings.ReplaceAll(t.Name(), "/", "-")
}

func TestExec_Success(t *testing.T) {
	data := &api.ResponseData{Id: uniqueID(t)}
	script := `echo "ok"`
	apiUrl := "http://invalid.test"

	result := Exec(script, apiUrl, data)

	if result.Status != 0 {
		t.Errorf("Exec() Status = %d, want 0", result.Status)
	}
}

func TestExec_ExitInSubshell(t *testing.T) {
	data := &api.ResponseData{Id: uniqueID(t)}
	script := `exit 1`
	apiUrl := "http://invalid.test"

	result := Exec(script, apiUrl, data)

	if result.Status != 1 {
		t.Errorf("Exec() Status = %d, want 0 (wrapper runs script in subshell)", result.Status)
	}
}

func TestExec_NoFinalState(t *testing.T) {
	data := &api.ResponseData{Id: uniqueID(t)}
	script := `echo "no state set"`
	apiUrl := "http://invalid.test"

	result := Exec(script, apiUrl, data)

	if result.Status != 0 {
		t.Errorf("Exec() Status = %d, want 0", result.Status)
	}
	if result.FinalState != "" {
		t.Errorf("Exec() FinalState = %q, want empty", result.FinalState)
	}
}

func TestExec_FinalStateWarning(t *testing.T) {
	data := &api.ResponseData{Id: uniqueID(t)}
	script := `echo "done"; echo $TIMELORD_STATE;echo Warning >> $TIMELORD_STATE`
	apiUrl := "http://invalid.test"

	result := Exec(script, apiUrl, data)

	if result.Status != 0 {
		t.Errorf("Exec() Status = %d, want 0", result.Status)
	}
	if result.FinalState != "Warning" {
		t.Errorf("Exec() FinalState = %q, want %q", result.FinalState, "Warning")
	}
}

func TestExec_HugeLineDoesNotBlock(t *testing.T) {
	// A line bigger than the pipe buffer used to stop the output reader, which
	// then blocked the script on its next write and locked the agent for good.
	script := `printf 'x%.0s' $(seq 1 200000); echo; echo done`

	result := execWithDeadline(t, script, 30*time.Second)

	if result.Status != 0 {
		t.Errorf("Exec() Status = %d, want 0", result.Status)
	}
}

func TestExec_ProgressOutputDoesNotBlock(t *testing.T) {
	// Progress bars (rclone, curl, docker) redraw with \r and never emit a
	// newline.
	script := `for i in $(seq 1 20000); do printf 'Transferred: %d bytes\r' "$i"; done; echo`

	result := execWithDeadline(t, script, 30*time.Second)

	if result.Status != 0 {
		t.Errorf("Exec() Status = %d, want 0", result.Status)
	}
}

func TestExec_BackgroundChildDoesNotBlock(t *testing.T) {
	// The child inherits stdout, so the pipe stays open after the script exits.
	script := `sleep 60 & echo "started"`

	result := execWithDeadline(t, script, 30*time.Second)

	if result.Status != 0 {
		t.Errorf("Exec() Status = %d, want 0", result.Status)
	}
}

func TestExec_TimeoutKillsTheScriptAndItsChildren(t *testing.T) {
	t.Setenv("TIMELORD_JOB_TIMEOUT", "2s")

	witness := filepath.Join(t.TempDir(), "child-survived")
	script := `(sleep 6; touch ` + witness + `) & echo "start"; sleep 120`

	result := execWithDeadline(t, script, 40*time.Second)

	if !result.TimedOut {
		t.Error("Exec() TimedOut = false, want true")
	}
	if result.Status != timeoutExitCode {
		t.Errorf("Exec() Status = %d, want %d", result.Status, timeoutExitCode)
	}

	time.Sleep(8 * time.Second)
	if _, err := os.Stat(witness); err == nil {
		t.Error("a background child survived the timeout, the process group was not killed")
	}
}

func TestJobTimeout(t *testing.T) {
	tests := []struct {
		name  string
		value string
		want  time.Duration
	}{
		{"default when unset", "", defaultJobTimeout},
		{"custom duration", "45m", 45 * time.Minute},
		{"disabled", "-1s", 0},
		{"invalid falls back", "not-a-duration", defaultJobTimeout},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("TIMELORD_JOB_TIMEOUT", tt.value)
			if got := jobTimeout(); got != tt.want {
				t.Errorf("jobTimeout() = %s, want %s", got, tt.want)
			}
		})
	}
}

func TestSplitLogLines(t *testing.T) {
	tests := []struct {
		name    string
		data    string
		atEOF   bool
		advance int
		token   string
	}{
		{"newline", "hello\nworld", false, 6, "hello"},
		{"carriage return", "hello\rworld", false, 6, "hello"},
		{"windows break", "hello\r\nworld", false, 7, "hello"},
		{"pending carriage return", "hello\r", false, 0, ""},
		{"remainder at EOF", "hello", true, 5, "hello"},
		{"incomplete line", "hello", false, 0, ""},
		{
			"oversized line is chunked",
			strings.Repeat("x", maxLogLineLength+10),
			false,
			maxLogLineLength,
			strings.Repeat("x", maxLogLineLength),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			advance, token, err := splitLogLines([]byte(tt.data), tt.atEOF)
			if err != nil {
				t.Fatalf("splitLogLines() error = %v", err)
			}
			if advance != tt.advance {
				t.Errorf("splitLogLines() advance = %d, want %d", advance, tt.advance)
			}
			if string(token) != tt.token {
				t.Errorf("splitLogLines() token = %q, want %q", string(token), tt.token)
			}
		})
	}
}

func TestReadFinalState(t *testing.T) {
	dir := t.TempDir()

	tests := []struct {
		name string
		path string
		body string
		want string
	}{
		{"allowed Success", filepath.Join(dir, "success"), "Success", "Success"},
		{"allowed Warning", filepath.Join(dir, "warning"), "Warning", "Warning"},
		{"allowed Error", filepath.Join(dir, "error"), "Error", "Error"},
		{"missing file", filepath.Join(dir, "nonexistent"), "", ""},
		{"disallowed value", filepath.Join(dir, "invalid"), "Invalid", ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.body != "" || tt.name == "disallowed value" {
				if err := os.WriteFile(tt.path, []byte(tt.body), 0644); err != nil {
					t.Fatal(err)
				}
			}
			got := readFinalState(tt.path)
			if got != tt.want {
				t.Errorf("readFinalState() = %q, want %q", got, tt.want)
			}
		})
	}
}
