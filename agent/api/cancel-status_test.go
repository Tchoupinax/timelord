package api

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestIsCancelRequested(t *testing.T) {
	t.Run("returns true when the server reports cancellation", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path != "/job/cancel" {
				t.Fatalf("unexpected path: %s", r.URL.Path)
			}
			if got := r.URL.Query().Get("jobId"); got != "job-123" {
				t.Fatalf("unexpected jobId: %s", got)
			}

			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"cancelRequested":true}`))
		}))
		defer server.Close()

		if !IsCancelRequested(server.URL, "job-123") {
			t.Fatal("IsCancelRequested() = false, want true")
		}
	})

	t.Run("returns false when the server reports no cancellation", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"cancelRequested":false}`))
		}))
		defer server.Close()

		if IsCancelRequested(server.URL, "job-123") {
			t.Fatal("IsCancelRequested() = true, want false")
		}
	})

	t.Run("returns false when the request fails", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusInternalServerError)
		}))
		defer server.Close()

		if IsCancelRequested(server.URL, "job-123") {
			t.Fatal("IsCancelRequested() = true, want false on server error")
		}
	})

	t.Run("returns false when the response is invalid JSON", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte(`not-json`))
		}))
		defer server.Close()

		if IsCancelRequested(server.URL, "job-123") {
			t.Fatal("IsCancelRequested() = true, want false on invalid JSON")
		}
	})
}
