package bash

import (
	"sync"
	"time"

	"github.com/Tchoupinax/timelord/agent/api"
	_ "github.com/Tchoupinax/timelord/agent/logger"
	"github.com/rs/zerolog/log"
)

const (
	// How many uploads can sit in the worker queue before the dispatcher waits.
	// The backlog in front of this queue is unbounded: a line is never dropped
	// and the script reader never blocks on an upload.
	logQueueSize = 2048
	// Concurrent uploads. One goroutine per line used to be spawned, which
	// could mean thousands of simultaneous HTTP requests on a verbose job.
	logWorkers = 4
	// Upper bound on waiting for queued uploads when a job ends. Workers keep
	// sending after this; the job teardown does not wait forever.
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
	cond    *sync.Cond
	backlog []logEntry
	index   int
	closed  bool
}

func newLogPusher(apiUrl string, data *api.ResponseData) *logPusher {
	pusher := &logPusher{
		url:   apiUrl + "/logs",
		data:  data,
		queue: make(chan logEntry, logQueueSize),
	}
	pusher.cond = sync.NewCond(&pusher.mu)

	pusher.wg.Add(logWorkers)
	for range logWorkers {
		go pusher.worker()
	}
	go pusher.dispatch()

	return pusher
}

// Push records one log line. Every line is uploaded. Push does not wait for
// the server, so a fast script cannot fill the pipe and stall the agent.
func (p *logPusher) Push(content string, logType string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.closed {
		return
	}

	p.backlog = append(p.backlog, logEntry{
		content:   content,
		createdAt: time.Now().Format(time.RFC3339),
		index:     p.index,
		logType:   logType,
	})
	p.index++
	p.cond.Signal()
}

// Close waits for the queued entries to be sent, then releases the workers.
func (p *logPusher) Close() {
	p.mu.Lock()
	if p.closed {
		p.mu.Unlock()
		return
	}
	p.closed = true
	p.cond.Signal()
	p.mu.Unlock()

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
}

// dispatch moves the backlog onto the worker queue. It is the only sender.
func (p *logPusher) dispatch() {
	defer close(p.queue)

	for {
		p.mu.Lock()
		for len(p.backlog) == 0 && !p.closed {
			p.cond.Wait()
		}
		if len(p.backlog) == 0 {
			p.mu.Unlock()
			return
		}
		entry := p.backlog[0]
		p.backlog[0] = logEntry{}
		p.backlog = p.backlog[1:]
		p.mu.Unlock()

		p.queue <- entry
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
