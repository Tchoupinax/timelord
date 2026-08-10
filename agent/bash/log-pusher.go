package bash

import (
	"sync"
	"time"

	"github.com/Tchoupinax/timelord/agent/api"
	"github.com/rs/zerolog/log"
)

const (
	// Number of log entries buffered before the readers slow down.
	logQueueSize = 2048
	// Concurrent uploads. One goroutine per line used to be spawned, which
	// could mean thousands of simultaneous HTTP requests on a verbose job.
	logWorkers = 4
	// How long a reader accepts to wait for room in the queue. Beyond that the
	// entry is dropped: keeping the pipe drained matters more than a log line.
	logEnqueueTimeout = 5 * time.Second
)

type logEntry struct {
	content   string
	createdAt string
	index     int
	logType   string
}

type logPusher struct {
	url     string
	data    *api.ResponseData
	queue   chan logEntry
	wg      sync.WaitGroup
	mu      sync.Mutex
	index   int
	dropped int
	closed  bool
}

func newLogPusher(apiUrl string, data *api.ResponseData) *logPusher {
	pusher := &logPusher{
		url:   apiUrl + "/logs",
		data:  data,
		queue: make(chan logEntry, logQueueSize),
	}

	pusher.wg.Add(logWorkers)
	for range logWorkers {
		go pusher.worker()
	}

	return pusher
}

func (p *logPusher) Push(content string, logType string) {
	p.mu.Lock()
	if p.closed {
		p.mu.Unlock()
		return
	}
	entry := logEntry{
		content:   content,
		createdAt: time.Now().Format(time.RFC3339),
		index:     p.index,
		logType:   logType,
	}
	p.index++
	p.mu.Unlock()

	timer := time.NewTimer(logEnqueueTimeout)
	defer timer.Stop()

	select {
	case p.queue <- entry:
	case <-timer.C:
		p.mu.Lock()
		p.dropped++
		p.mu.Unlock()
	}
}

// Close waits for the queued entries to be sent, then releases the workers.
func (p *logPusher) Close() {
	p.mu.Lock()
	if p.closed {
		p.mu.Unlock()
		return
	}
	p.closed = true
	p.mu.Unlock()

	close(p.queue)
	p.wg.Wait()

	p.mu.Lock()
	dropped := p.dropped
	p.mu.Unlock()

	if dropped > 0 {
		log.Warn().Int("count", dropped).Msg("Log entries dropped, the server could not keep up")
	}
}

func (p *logPusher) worker() {
	defer p.wg.Done()

	for entry := range p.queue {
		api.PushLog(
			p.url,
			p.data,
			entry.content,
			entry.createdAt,
			entry.index,
			entry.logType,
		)
	}
}
