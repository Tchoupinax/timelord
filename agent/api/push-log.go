package api

import (
	"context"
	"encoding/json"
	"fmt"
)

func PushLog(
	ctx context.Context,
	url string,
	res *ResponseData,
	log string,
	createdAt string,
	logIndex int,
	logType string,
) {
	payload := map[string]any{
		"content":   log,
		"createdAt": createdAt,
		"index":     logIndex,
		"jobId":     res.Id,
		"type":      logType,
	}

	jsonData, _ := json.Marshal(payload)
	_, err := ApiPost(ctx, url, jsonData)
	if err != nil {
		fmt.Println(err)
	}
}
