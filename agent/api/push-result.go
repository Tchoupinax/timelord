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
	statusComment string,
) {
	payload := map[string]any{
		"id":         res.Id,
		"statusCode": status,
	}
	if finalState != "" {
		payload["finalState"] = finalState
	}
	if statusComment != "" {
		payload["statusComment"] = statusComment
	}

	jsonData, _ := json.Marshal(payload)
	// Losing a result means the server never learns the job finished, so retry
	// hard before giving up.
	_, err := ApiPostWithRetry(url, jsonData, 5)
	if err != nil {
		log.Error().Err(err).Str("job_id", res.Id).Int("status", status).Msg("Failed to push job result after retries")
	}
}
