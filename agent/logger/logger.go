package logger

import (
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

const serviceName = "timelord-agent"

func init() {
	Setup()
}

// Setup configures the global zerolog logger for JSON output compatible with
// Victoria Logs (_msg, _time, level).
func Setup() {
	zerolog.TimestampFieldName = "_time"
	zerolog.MessageFieldName = "_msg"
	zerolog.TimeFieldFormat = time.RFC3339Nano

	level := parseLevel(os.Getenv("LOG_LEVEL"))

	log.Logger = zerolog.New(os.Stderr).
		Level(level).
		With().
		Timestamp().
		Str("service", serviceName).
		Logger()

	zerolog.SetGlobalLevel(level)
}

func parseLevel(raw string) zerolog.Level {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "trace":
		return zerolog.TraceLevel
	case "debug":
		return zerolog.DebugLevel
	case "warn", "warning":
		return zerolog.WarnLevel
	case "error":
		return zerolog.ErrorLevel
	case "fatal":
		return zerolog.FatalLevel
	case "panic":
		return zerolog.PanicLevel
	case "", "info":
		return zerolog.InfoLevel
	default:
		return zerolog.InfoLevel
	}
}
