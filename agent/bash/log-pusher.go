package bash

import (
	"strings"
	"sync"
	"time"

	"github.com/Tchoupinax/timelord/agent/api"
	_ "github.com/Tchoupinax/timelord/agent/logger"
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
	// Carriage-return progress lines (rclone, curl) are coalesced and flushed
	// at this interval so the UI updates without one HTTP request per redraw.
	progressFlushInterval = 500 * time.Millisecond
	// Lines longer than this are never coalesced (see maxLogLineLength chunks).
	maxCoalesceLineLength = 512
	// Upper bound on waiting for queued uploads when a job ends.
	logDrainTimeout = 15 * time.Second
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

	pending   map[string]*logEntry
	lastFlush map[string]time.Time
}

func newLogPusher(apiUrl string, data *api.ResponseData) *logPusher {
	pusher := &logPusher{
		url:       apiUrl + "/logs",
		data:      data,
		queue:     make(chan logEntry, logQueueSize),
		pending:   make(map[string]*logEntry),
		lastFlush: make(map[string]time.Time),
	}

	pusher.wg.Add(logWorkers)
	for range logWorkers {
		go pusher.worker()
	}

	return pusher
}

func coalesceable(content string) bool {
	return len(content) <= maxCoalesceLineLength && !strings.Contains(content, "\n")
}

func (p *logPusher) Push(content string, logType string) {
	p.mu.Lock()
	if p.closed {
		p.mu.Unlock()
		return
	}

	now := time.Now()

	if !coalesceable(content) {
		p.flushPendingLocked(logType)
		entry := logEntry{
			content:   content,
			createdAt: now.Format(time.RFC3339),
			index:     p.index,
			logType:   logType,
		}
		p.index++
		p.mu.Unlock()
		p.tryEnqueue(entry)
		return
	}

	if pending, ok := p.pending[logType]; ok {
		pending.content = content
		pending.createdAt = now.Format(time.RFC3339)
		if now.Sub(p.lastFlush[logType]) >= progressFlushInterval {
			p.flushPendingLocked(logType)
		}
		p.mu.Unlock()
		return
	}

	p.pending[logType] = &logEntry{
		content:   content,
		createdAt: now.Format(time.RFC3339),
		index:     p.index,
		logType:   logType,
	}
	p.index++
	p.lastFlush[logType] = now
	p.mu.Unlock()
}

// Close waits for the queued entries to be sent, then releases the workers.
func (p *logPusher) Close() {
	p.mu.Lock()
	if p.closed {
		p.mu.Unlock()
		return
	}
	p.closed = true
	for logType := range p.pending {
		p.flushPendingLocked(logType)
	}
	p.mu.Unlock()

	close(p.queue)

	done := make(chan struct{})
	go func() {
		p.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(logDrainTimeout):
		log.Warn().Msg("Log upload drain timed out, continuing job teardown")
	}

	p.mu.Lock()
	dropped := p.dropped
	p.mu.Unlock()

	if dropped > 0 {
		log.Warn().Int("count", dropped).Msg("Log entries dropped, the server could not keep up")
	}
}

func (p *logPusher) flushPendingLocked(logType string) {
	pending, ok := p.pending[logType]
	if !ok {
		return
	}
	delete(p.pending, logType)
	entry := *pending
	p.mu.Unlock()
	p.tryEnqueue(entry)
	p.mu.Lock()
	p.lastFlush[logType] = time.Now()
}

func (p *logPusher) tryEnqueue(entry logEntry) {
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
