package main

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	"github.com/Tchoupinax/timelord/agent/api"
)

func TestRunJobStopsWhenAssetsAreNotAZip(t *testing.T) {
	var (
		mu      sync.Mutex
		results []map[string]any
	)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodGet && r.URL.Path == "/job/assets":
			w.Header().Set("Content-Type", "text/plain")
			_, _ = w.Write([]byte("this is not a zip"))
		case r.Method == http.MethodPost && r.URL.Path == "/job":
			body, _ := io.ReadAll(r.Body)
			var payload map[string]any
			if err := json.Unmarshal(body, &payload); err != nil {
				t.Errorf("result json: %v", err)
			}
			mu.Lock()
			results = append(results, payload)
			mu.Unlock()
			_, _ = w.Write([]byte("OK"))
		default:
			http.NotFound(w, r)
		}
	}))
	t.Cleanup(server.Close)
	api.SetActiveJobID("job-assets")
	t.Cleanup(func() { api.SetActiveJobID("") })

	runJob(server.URL, &api.ResponseData{
		Id:        "job-assets",
		File:      "echo should-not-run",
		HasAssets: true,
	})

	mu.Lock()
	defer mu.Unlock()
	if len(results) != 1 {
		t.Fatalf("results = %d, want 1", len(results))
	}
	if results[0]["statusCode"] != float64(1) {
		t.Fatalf("statusCode = %v, want 1", results[0]["statusCode"])
	}
	if results[0]["finalState"] != "Error" {
		t.Fatalf("finalState = %v, want Error", results[0]["finalState"])
	}
	if api.GetActiveJobID() != "" {
		t.Fatal("active job id was not cleared")
	}
}

func TestRunJobContinuesWhenServerHasNoAssets(t *testing.T) {
	results := serveJob(t, func(w http.ResponseWriter) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"msg":"No assets found"}`))
	})

	runJob(results.server.URL, &api.ResponseData{
		Id:        "job-no-assets",
		File:      "true",
		HasAssets: true,
	})

	got := results.status()
	if got != 0 {
		t.Fatalf("statusCode = %v, want 0", got)
	}
}

func TestRunJobExtractsAssetsBeforeRunning(t *testing.T) {
	payload := zipWithNote(t)
	results := serveJob(t, func(w http.ResponseWriter) {
		w.Header().Set("Content-Type", "application/zip")
		_, _ = w.Write(payload)
	})

	runJob(results.server.URL, &api.ResponseData{
		Id:        "job-with-assets",
		File:      "test -f note.txt",
		HasAssets: true,
	})

	got := results.status()
	if got != 0 {
		t.Fatalf("statusCode = %v, want 0", got)
	}
}

type jobServer struct {
	server *httptest.Server
	mu     sync.Mutex
	codes  []float64
}

func (s *jobServer) status() float64 {
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.codes) == 0 {
		return -1
	}
	return s.codes[len(s.codes)-1]
}

func serveJob(t *testing.T, assets func(http.ResponseWriter)) *jobServer {
	t.Helper()
	js := &jobServer{}
	js.server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodGet && r.URL.Path == "/job/assets":
			assets(w)
		case r.Method == http.MethodPost && r.URL.Path == "/job":
			body, _ := io.ReadAll(r.Body)
			var payload map[string]any
			_ = json.Unmarshal(body, &payload)
			if code, ok := payload["statusCode"].(float64); ok {
				js.mu.Lock()
				js.codes = append(js.codes, code)
				js.mu.Unlock()
			}
			_, _ = w.Write([]byte("OK"))
		default:
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"cancelRequested":false}`))
		}
	}))
	t.Cleanup(js.server.Close)
	t.Cleanup(func() { api.SetActiveJobID("") })
	return js
}

func zipWithNote(t *testing.T) []byte {
	t.Helper()
	var buf bytes.Buffer
	writer := zip.NewWriter(&buf)
	entry, err := writer.Create("note.txt")
	if err != nil {
		t.Fatalf("create zip entry: %v", err)
	}
	if _, err := entry.Write([]byte("hello")); err != nil {
		t.Fatalf("write zip entry: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("close zip: %v", err)
	}
	return buf.Bytes()
}
