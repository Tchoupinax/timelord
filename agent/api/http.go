package api

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"

	"github.com/rs/zerolog/log"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

// HTTPClient sends requests with OpenTelemetry trace context (traceparent) so the server can continue the trace.
var HTTPClient = &http.Client{
	Transport: otelhttp.NewTransport(http.DefaultTransport),
}

func ApiGet(
	ctx context.Context,
	url string,
) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	for key, value := range ComputeHeaders() {
		req.Header.Set(key, value)
	}

	resp, err := HTTPClient.Do(req)
	if err != nil {
		fmt.Println("Error sending request:", err)
		return []byte{}, err
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("failed to close response body: %v", err)
		}
	}()

	log.Debug().Msg(fmt.Sprintf("Response Status: %s", resp.Status))

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Error reading response body: %s\n", err)
		return []byte{}, err
	}

	return body, nil
}

func ApiPost(
	ctx context.Context,
	url string,
	data []byte,
) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(data))
	if err != nil {
		return nil, err
	}

	for key, value := range ComputeHeaders() {
		req.Header.Set(key, value)
	}

	resp, err := HTTPClient.Do(req)
	if err != nil {
		fmt.Println("Error sending request:", err)
		return []byte{}, err
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("failed to close response body: %v", err)
		}
	}()

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Error reading response body: %s\n", err)
		return []byte{}, err
	}

	return body, nil
}
