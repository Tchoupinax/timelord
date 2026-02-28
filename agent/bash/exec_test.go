package bash

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/Tchoupinax/timelord/agent/api"
)

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
