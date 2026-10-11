package api

import (
	"bytes"
	"io"
	"math"
	"net"
	"net/http"
	"time"

	_ "github.com/Tchoupinax/timelord/agent/logger"
	"github.com/rs/zerolog/log"
)

// Without a timeout, a single unanswered request hangs its caller forever,
// which is enough to freeze the polling loop or leak a log upload per line.
var httpClient = &http.Client{
	Timeout: 30 * time.Second,
	Transport: &http.Transport{
		DialContext:           (&net.Dialer{Timeout: 10 * time.Second}).DialContext,
		TLSHandshakeTimeout:   10 * time.Second,
		ResponseHeaderTimeout: 30 * time.Second,
		MaxIdleConnsPerHost:   8,
	},
}

func ApiGet(
	url string,
) ([]byte, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	for key, value := range ComputeHeaders() {
		req.Header.Set(key, value)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		log.Error().Err(err).Str("url", url).Msg("Error sending GET request")
		return []byte{}, err
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Warn().Err(err).Msg("failed to close GET response body")
		}
	}()

	log.Debug().Str("status", resp.Status).Msg("GET response received")

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Error().Err(err).Str("url", url).Msg("Error reading GET response body")
		return []byte{}, err
	}

	return body, nil
}

func ApiPost(
	url string,
	data []byte,
) ([]byte, error) {
	body, _, err := doPost(url, data)
	return body, err
}

// ApiPostWithRetry retries transient failures (network errors and 5xx
// responses) with exponential backoff. It is meant for calls we cannot afford
// to lose, such as reporting a finished job's result. maxAttempts must be >= 1.
func ApiPostWithRetry(
	url string,
	data []byte,
	maxAttempts int,
) ([]byte, error) {
	if maxAttempts < 1 {
		maxAttempts = 1
	}

	var lastErr error
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		body, status, err := doPost(url, data)
		if err == nil && status < 500 {
			return body, nil
		}

		if err != nil {
			lastErr = err
		} else {
			lastErr = &httpStatusError{status: status}
		}

		if attempt == maxAttempts {
			break
		}

		backoff := backoffDuration(attempt)
		log.Warn().
			Err(lastErr).
			Str("url", url).
			Int("attempt", attempt).
			Int("max_attempts", maxAttempts).
			Dur("backoff", backoff).
			Msg("POST failed, retrying")
		time.Sleep(backoff)
	}

	return []byte{}, lastErr
}

func doPost(
	url string,
	data []byte,
) ([]byte, int, error) {
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(data))
	if err != nil {
		return nil, 0, err
	}

	for key, value := range ComputeHeaders() {
		req.Header.Set(key, value)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		log.Error().Err(err).Str("url", url).Msg("Error sending POST request")
		return []byte{}, 0, err
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Warn().Err(err).Msg("failed to close POST response body")
		}
	}()

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Error().Err(err).Str("url", url).Msg("Error reading POST response body")
		return []byte{}, resp.StatusCode, err
	}

	return body, resp.StatusCode, nil
}

type httpStatusError struct {
	status int
}

func (e *httpStatusError) Error() string {
	return "unexpected HTTP status " + http.StatusText(e.status)
}

// backoffDuration returns an exponential backoff capped at 30s for the given
// 1-based attempt number: 1s, 2s, 4s, 8s, ...
func backoffDuration(attempt int) time.Duration {
	const base = time.Second
	const max = 30 * time.Second

	d := time.Duration(math.Pow(2, float64(attempt-1))) * base
	if d > max || d <= 0 {
		return max
	}
	return d
}
