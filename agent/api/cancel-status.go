package api

import (
	"encoding/json"

	_ "github.com/Tchoupinax/timelord/agent/logger"
	"github.com/rs/zerolog/log"
)

type cancelStatusResponse struct {
	CancelRequested bool `json:"cancelRequested"`
}

func IsCancelRequested(apiUrl, jobId string) bool {
	body, err := ApiGet(apiUrl + "/job/cancel?jobId=" + jobId)
	if err != nil {
		return false
	}

	var resp cancelStatusResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		log.Warn().Err(err).Str("job_id", jobId).Msg("Failed to parse cancel status response")
		return false
	}

	return resp.CancelRequested
}
