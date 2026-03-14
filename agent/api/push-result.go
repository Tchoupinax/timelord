package api

import (
	"context"
	"encoding/json"
	"fmt"
)

func PushResult(
	ctx context.Context,
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
	_, err := ApiPost(ctx, url, jsonData)
	if err != nil {
		fmt.Println(err)
	}
}
