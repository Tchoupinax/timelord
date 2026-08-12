package logger

import (
	"bytes"
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func TestSetupOutputsVictoriaLogsJSON(t *testing.T) {
	var buf bytes.Buffer

	zerolog.TimestampFieldName = "_time"
	zerolog.MessageFieldName = "_msg"
	zerolog.TimeFieldFormat = time.RFC3339Nano

	log.Logger = zerolog.New(&buf).
		Level(zerolog.InfoLevel).
		With().
		Timestamp().
		Str("service", serviceName).
		Logger()

	log.Info().Str("job_id", "abc").Msg("job received")

	line := strings.TrimSpace(buf.String())
	if line == "" {
		t.Fatal("expected a JSON log line")
	}

	var entry map[string]any
	if err := json.Unmarshal([]byte(line), &entry); err != nil {
		t.Fatalf("log line is not valid JSON: %v\nline: %s", err, line)
	}

	for _, field := range []string{"_msg", "_time", "level", "service"} {
		if _, ok := entry[field]; !ok {
			t.Errorf("missing field %q in %v", field, entry)
		}
	}

	if entry["_msg"] != "job received" {
		t.Errorf("_msg = %v, want %q", entry["_msg"], "job received")
	}
	if entry["level"] != "info" {
		t.Errorf("level = %v, want %q", entry["level"], "info")
	}
	if entry["service"] != serviceName {
		t.Errorf("service = %v, want %q", entry["service"], serviceName)
	}
	if entry["job_id"] != "abc" {
		t.Errorf("job_id = %v, want %q", entry["job_id"], "abc")
	}

	if _, err := time.Parse(time.RFC3339Nano, entry["_time"].(string)); err != nil {
		t.Errorf("_time is not RFC3339: %v", err)
	}
}

func TestParseLevel(t *testing.T) {
	tests := []struct {
		raw  string
		want zerolog.Level
	}{
		{"", zerolog.InfoLevel},
		{"info", zerolog.InfoLevel},
		{"DEBUG", zerolog.DebugLevel},
		{"warn", zerolog.WarnLevel},
		{"error", zerolog.ErrorLevel},
		{"unknown", zerolog.InfoLevel},
	}
	for _, tt := range tests {
		if got := parseLevel(tt.raw); got != tt.want {
			t.Errorf("parseLevel(%q) = %v, want %v", tt.raw, got, tt.want)
		}
	}
}
