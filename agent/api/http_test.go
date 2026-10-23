package api

import (
	"net"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"
)

func TestApiPostWithRetryRecoversFromConnectionReset(t *testing.T) {
	var calls atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		if calls.Add(1) == 1 {
			hijacker, ok := w.(http.Hijacker)
			if !ok {
				t.Fatal("response cannot be hijacked")
			}
			conn, _, err := hijacker.Hijack()
			if err != nil {
				t.Fatalf("hijack: %v", err)
			}
			if tcp, ok := conn.(*net.TCPConn); ok {
				_ = tcp.SetLinger(0)
			}
			_ = conn.Close()
			return
		}

		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("OK"))
	}))
	t.Cleanup(server.Close)

	body, err := ApiPostWithRetry(server.URL, []byte(`{"version":"t"}`), 3)
	if err != nil {
		t.Fatalf("ApiPostWithRetry: %v", err)
	}
	if string(body) != "OK" {
		t.Fatalf("body = %q", body)
	}
	if got := calls.Load(); got < 2 {
		t.Fatalf("calls = %d, want at least 2", got)
	}
}

func withFastRetries(t *testing.T) {
	t.Helper()
	retryBaseBackoff = time.Millisecond
	t.Cleanup(func() { retryBaseBackoff = time.Second })
}

func TestApiPostWithRetryRidesOutProxyRestart(t *testing.T) {
	withFastRetries(t)
	var calls atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		switch calls.Add(1) {
		case 1:
			http.Error(w, "Bad Gateway", http.StatusBadGateway)
		case 2:
			http.Error(w, "Service Unavailable", http.StatusServiceUnavailable)
		case 3:
			// Traefik before its routes are loaded.
			http.Error(w, "404 page not found", http.StatusNotFound)
		default:
			_, _ = w.Write([]byte("OK"))
		}
	}))
	t.Cleanup(server.Close)

	body, err := ApiPostWithRetry(server.URL, []byte(`{}`), 5)
	if err != nil {
		t.Fatalf("ApiPostWithRetry: %v", err)
	}
	if string(body) != "OK" {
		t.Fatalf("body = %q", body)
	}
	if got := calls.Load(); got != 4 {
		t.Fatalf("calls = %d, want 4", got)
	}
}

func TestApiPostWithRetryRidesOutRefusedConnections(t *testing.T) {
	withFastRetries(t)
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	addr := listener.Addr().String()
	_ = listener.Close() // nothing listens: connection refused, like a rebooting proxy

	server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("OK"))
	}))
	go func() {
		time.Sleep(20 * time.Millisecond)
		l, err := net.Listen("tcp", addr)
		if err != nil {
			return
		}
		server.Listener = l
		server.Start()
	}()
	t.Cleanup(server.Close)

	body, err := ApiPostWithRetry("http://"+addr, []byte(`{}`), 10)
	if err != nil {
		t.Fatalf("ApiPostWithRetry: %v", err)
	}
	if string(body) != "OK" {
		t.Fatalf("body = %q", body)
	}
}

func TestApiPostWithRetryDoesNotRetryServerAnswers(t *testing.T) {
	withFastRetries(t)
	var calls atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		calls.Add(1)
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte(`{"message":"Job not found"}`))
	}))
	t.Cleanup(server.Close)

	if _, err := ApiPostWithRetry(server.URL, []byte(`{}`), 5); err != nil {
		t.Fatalf("ApiPostWithRetry: %v", err)
	}
	if got := calls.Load(); got != 1 {
		t.Fatalf("calls = %d, want 1", got)
	}
}

func TestApiGetFailsOnProxyError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "Bad Gateway", http.StatusBadGateway)
	}))
	t.Cleanup(server.Close)

	if _, err := ApiGet(server.URL); err == nil {
		t.Fatal("expected an error on 502")
	}
}

func TestBackoffDurationStaysWithinJitterAndCap(t *testing.T) {
	for attempt := 1; attempt <= 10; attempt++ {
		base := time.Duration(1<<(attempt-1)) * time.Second
		if base > 30*time.Second {
			base = 30 * time.Second
		}
		for range 50 {
			d := backoffDuration(attempt)
			if d < base*8/10 || d > base*12/10 {
				t.Fatalf("attempt %d: backoff %v outside [%v, %v]", attempt, d, base*8/10, base*12/10)
			}
		}
	}
}
