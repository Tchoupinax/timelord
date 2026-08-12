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
	_, err := ApiPost(url, jsonData)
	if err != nil {
		log.Error().Err(err).Str("job_id", res.Id).Msg("Failed to push log entry")
	}
}
