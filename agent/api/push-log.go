package api

import (
	"encoding/json"
	"fmt"
)

func PushLog(
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
	_, err := ApiPost(url, jsonData)
	if err != nil {
		fmt.Println(err)
	}
}
