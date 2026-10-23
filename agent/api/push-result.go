package api

import (
	"encoding/json"

	_ "github.com/Tchoupinax/timelord/agent/logger"
	"github.com/rs/zerolog/log"
)

// 1+2+4+8+16 then 30s per attempt: about 10 minutes before giving up.
const pushResultMaxAttempts = 25

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
	// hard before giving up: ~10 minutes of backoff rides out a reverse proxy
	// (Traefik) or server restart. The server update is idempotent.
	_, err := ApiPostWithRetry(url, jsonData, pushResultMaxAttempts)
	if err != nil {
		log.Error().Err(err).Str("job_id", res.Id).Int("status", status).Msg("Failed to push job result after retries")
	}
}
