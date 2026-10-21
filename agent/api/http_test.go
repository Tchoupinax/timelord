package api

import (
	"net"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
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
