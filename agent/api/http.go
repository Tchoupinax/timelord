package api

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"math"
	"math/rand"
	"net"
	"net/http"
	"strings"
	"syscall"
	"time"

	_ "github.com/Tchoupinax/timelord/agent/logger"
	"github.com/rs/zerolog/log"
)

// Without a timeout, a single unanswered request hangs its caller forever,
// which is enough to freeze the polling loop or leak a log upload per line.
var httpClient = &http.Client{
	Timeout: 30 * time.Second,
	Transport: &http.Transport{
		DialContext: (&net.Dialer{
			Timeout:   10 * time.Second,
			KeepAlive: 15 * time.Second,
		}).DialContext,
		TLSHandshakeTimeout:   10 * time.Second,
		ResponseHeaderTimeout: 30 * time.Second,
		// Drop idle connections before a proxy or the server resets them.
		// Kept well below common reverse proxy idle timeouts (Traefik, LBs):
		// a POST sent on a socket the proxy already closed fails with
		// "connection reset by peer" and net/http does not replay it.
		IdleConnTimeout:     5 * time.Second,
		MaxIdleConnsPerHost: 8,
	},
}

func ApiGet(
	url string,
) ([]byte, error) {
	resp, err := do(http.MethodGet, url, nil)
	if err != nil {
		log.Warn().Err(err).Str("url", url).Msg("GET request failed")
		return []byte{}, err
	}
	if resp.status >= 400 {
		err := &httpStatusError{status: resp.status}
		log.Warn().Err(err).Str("url", url).Str("body", snippet(resp.body)).Msg("GET request rejected")
		return []byte{}, err
	}

	return resp.body, nil
}

func ApiPost(
	url string,
	data []byte,
) ([]byte, error) {
	resp, err := do(http.MethodPost, url, data)
	if err != nil {
		return []byte{}, err
	}
	return resp.body, nil
}

// ApiPostWithRetry retries failures caused by the path to the server rather
// than by the server itself: network errors, 5xx, and the plain-text 404 a
// reverse proxy (Traefik) answers while it restarts and before its routes are
// loaded. Backoff is exponential with jitter, capped at 30s. It is meant for
// calls we cannot afford to lose. maxAttempts must be >= 1.
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
		resp, err := do(http.MethodPost, url, data)
		if err == nil && !IsRetryableStatus(resp.status, resp.contentType) {
			return resp.body, nil
		}

		if err != nil {
			lastErr = err
			// The pooled connection was reset. Drop the rest of the pool so
			// the next attempt dials instead of reusing another dead socket.
			if IsTransientNetworkError(err) {
				httpClient.CloseIdleConnections()
			}
		} else {
			lastErr = &httpStatusError{status: resp.status}
		}

		if attempt == maxAttempts {
			break
		}

		backoff := backoffDuration(attempt)
		// A single failure is usually a stale pooled connection and the retry
		// on a fresh one succeeds, so only surface repeated failures. Callers
		// log the final error once all attempts are exhausted.
		event := log.Warn()
		if attempt == 1 {
			event = log.Debug()
		}
		event.
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

type response struct {
	status      int
	contentType string
	body        []byte
}

func do(method, url string, data []byte) (*response, error) {
	var reqBody io.Reader
	if data != nil {
		reqBody = bytes.NewReader(data)
	}
	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, err
	}

	for key, value := range ComputeHeaders() {
		req.Header.Set(key, value)
	}

	// Callers decide how loud a failure is: a single reset during a proxy
	// restart is expected and retried.
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Warn().Err(err).Msg("failed to close response body")
		}
	}()

	log.Debug().Str("method", method).Str("status", resp.Status).Msg("response received")

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return &response{
		status:      resp.StatusCode,
		contentType: resp.Header.Get("Content-Type"),
		body:        body,
	}, nil
}

// IsRetryableStatus reports HTTP answers that come from the infrastructure in
// front of the server rather than from its business logic. While Traefik
// restarts it answers 502/503/504, and a plain-text "404 page not found" until
// its routes are loaded. The Timelord server always answers 404 with JSON, so
// that one is final.
func IsRetryableStatus(status int, contentType string) bool {
	switch {
	case status >= 500, status == http.StatusRequestTimeout, status == http.StatusTooManyRequests:
		return true
	case status == http.StatusNotFound:
		return !strings.Contains(contentType, "application/json")
	}
	return false
}

func snippet(body []byte) string {
	const max = 200
	if len(body) > max {
		return string(body[:max])
	}
	return string(body)
}

type httpStatusError struct {
	status int
}

func (e *httpStatusError) Error() string {
	return fmt.Sprintf("unexpected HTTP status %d %s", e.status, http.StatusText(e.status))
}

// IsTransientNetworkError reports connection failures worth retrying, such as
// "connection reset by peer" on a keep-alive socket the peer already closed.
func IsTransientNetworkError(err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, io.EOF) ||
		errors.Is(err, io.ErrUnexpectedEOF) ||
		errors.Is(err, syscall.ECONNRESET) ||
		errors.Is(err, syscall.ECONNABORTED) ||
		errors.Is(err, syscall.EPIPE) ||
		errors.Is(err, syscall.ECONNREFUSED) {
		return true
	}

	var netErr net.Error
	return errors.As(err, &netErr) && netErr.Timeout()
}

// retryBaseBackoff is a variable so tests can shorten it.
var retryBaseBackoff = time.Second

// SetRetryBaseBackoff overrides the first retry delay and returns the previous
// value. Only meant for tests of packages that hit an unreachable API.
func SetRetryBaseBackoff(d time.Duration) time.Duration {
	previous := retryBaseBackoff
	retryBaseBackoff = d
	return previous
}

// backoffDuration returns an exponential backoff with +/-20% jitter, capped at
// 30s, for the given 1-based attempt number: ~1s, 2s, 4s, 8s, 16s, 30s, ...
// The jitter keeps a fleet of agents from hammering a recovering proxy in sync.
func backoffDuration(attempt int) time.Duration {
	const max = 30 * time.Second

	d := time.Duration(math.Pow(2, float64(attempt-1))) * retryBaseBackoff
	if d > max || d <= 0 {
		d = max
	}
	jitter := time.Duration(rand.Int63n(int64(d)/5*2+1)) - d/5
	return d + jitter
}
