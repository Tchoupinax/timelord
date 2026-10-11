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
	// A couple of quick retries smooth over transient blips without blocking the
	// log workers for long; a definitively lost line is acceptable.
	_, err := ApiPostWithRetry(url, jsonData, 3)
	if err != nil {
		log.Error().Err(err).Str("job_id", res.Id).Msg("Failed to push log entry after retries")
	}
}
