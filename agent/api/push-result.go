package api

import (
	"encoding/json"
	"fmt"
)

func PushResult(
	url string,
	res *ResponseData,
	status int,
) {
	payload := map[string]any{
		"id":         res.Id,
		"statusCode": status,
	}

	jsonData, _ := json.Marshal(payload)
	_, err := ApiPost(url, jsonData)
	if err != nil {
		fmt.Println(err)
	}
}
