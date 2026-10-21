package file

import (
	"archive/zip"
	"bytes"
	"errors"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sync/atomic"
	"testing"
)

func TestDownloadFileSavesZip(t *testing.T) {
	payload := zipBytes(t, "note.txt", "hello")
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/zip")
		_, _ = w.Write(payload)
	}))
	t.Cleanup(server.Close)

	output := filepath.Join(t.TempDir(), "job.zip")
	if err := DownloadFile(server.URL, output); err != nil {
		t.Fatalf("DownloadFile: %v", err)
	}

	if _, err := os.Stat(output); err != nil {
		t.Fatalf("zip file missing: %v", err)
	}
}

func TestDownloadFileRejectsJSONBody(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"error":"No assets found"}`))
	}))
	t.Cleanup(server.Close)

	output := filepath.Join(t.TempDir(), "job.zip")
	err := DownloadFile(server.URL, output)
	if !errors.Is(err, ErrNoAssets) {
		t.Fatalf("DownloadFile error = %v, want ErrNoAssets", err)
	}
	if _, statErr := os.Stat(output); !os.IsNotExist(statErr) {
		t.Fatal("non-zip download was left on disk")
	}
}

func TestDownloadFileRejectsUnexpectedBody(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		_, _ = w.Write([]byte("not a zip"))
	}))
	t.Cleanup(server.Close)

	output := filepath.Join(t.TempDir(), "job.zip")
	err := DownloadFile(server.URL, output)
	if err == nil || errors.Is(err, ErrNoAssets) {
		t.Fatalf("DownloadFile error = %v, want a zip error", err)
	}
}

func TestDownloadFileDoesNotRetryNotFound(t *testing.T) {
	var calls atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		calls.Add(1)
		http.Error(w, "missing", http.StatusNotFound)
	}))
	t.Cleanup(server.Close)

	output := filepath.Join(t.TempDir(), "job.zip")
	if err := DownloadFile(server.URL, output); err == nil {
		t.Fatal("expected download error")
	}
	if got := calls.Load(); got != 1 {
		t.Fatalf("calls = %d, want 1", got)
	}
}

func TestDownloadFileRetriesConnectionReset(t *testing.T) {
	payload := zipBytes(t, "note.txt", "hello")
	var calls atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		if calls.Add(1) == 1 {
			resetConn(t, w)
			return
		}
		w.Header().Set("Content-Type", "application/zip")
		_, _ = w.Write(payload)
	}))
	t.Cleanup(server.Close)

	output := filepath.Join(t.TempDir(), "job.zip")
	if err := DownloadFile(server.URL, output); err != nil {
		t.Fatalf("DownloadFile: %v", err)
	}
	if got := calls.Load(); got < 2 {
		t.Fatalf("calls = %d, want at least 2", got)
	}
}

func resetConn(t *testing.T, w http.ResponseWriter) {
	t.Helper()
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
}

func zipBytes(t *testing.T, name, content string) []byte {
	t.Helper()
	var buf bytes.Buffer
	writer := zip.NewWriter(&buf)
	entry, err := writer.Create(name)
	if err != nil {
		t.Fatalf("create zip entry: %v", err)
	}
	if _, err := entry.Write([]byte(content)); err != nil {
		t.Fatalf("write zip entry: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("close zip: %v", err)
	}
	return buf.Bytes()
}
