package api

import (
	"encoding/json"

	_ "github.com/Tchoupinax/timelord/agent/logger"
	"github.com/rs/zerolog/log"
)

func PushResult(
	url string,
	res *ResponseData,
	status int,
	finalState string,
) {
	payload := map[string]any{
		"id":         res.Id,
		"statusCode": status,
	}
	if finalState != "" {
		payload["finalState"] = finalState
	}

	jsonData, _ := json.Marshal(payload)
	_, err := ApiPost(url, jsonData)
	if err != nil {
		log.Error().Err(err).Str("job_id", res.Id).Int("status", status).Msg("Failed to push job result")
	}
}
