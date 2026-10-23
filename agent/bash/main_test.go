package bash

import (
	"os"
	"testing"
	"time"

	"github.com/Tchoupinax/timelord/agent/api"
)

// The tests run jobs against an unreachable API. Keep the log upload retries
// short so each test does not wait out the production backoff.
func TestMain(m *testing.M) {
	api.SetRetryBaseBackoff(time.Millisecond)
	os.Exit(m.Run())
}
