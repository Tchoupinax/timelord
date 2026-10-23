package api

import (
	"encoding/json"

	_ "github.com/Tchoupinax/timelord/agent/logger"
	"github.com/rs/zerolog/log"
)

func PushLog(
	url string,
	res *ResponseData,
	content string,
	createdAt string,
	logIndex int,
	logType string,
) {
	payload := map[string]any{
		"content":   content,
		"createdAt": createdAt,
		"index":     logIndex,
		"jobId":     res.Id,
		"type":      logType,
	}

	jsonData, _ := json.Marshal(payload)
	// ~15s of retries covers a reverse proxy restart without blocking the log
	// workers for long; a definitively lost line is acceptable.
	_, err := ApiPostWithRetry(url, jsonData, 5)
	if err != nil {
		log.Error().Err(err).Str("job_id", res.Id).Msg("Failed to push log entry after retries")
	}
}
