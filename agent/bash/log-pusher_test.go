package bash

import (
	"sync"
	"testing"
)

func TestPushKeepsEveryLine(t *testing.T) {
	p := &logPusher{}
	p.cond = sync.NewCond(&p.mu)

	lines := []string{
		"starting backup of gitea",
		"dumping repositories",
		"Transferred: 1%",
		"Transferred: 50%",
		"Transferred: 100%",
		"done",
	}
	for _, line := range lines {
		p.Push(line, "STDOUT")
	}

	if len(p.backlog) != len(lines) {
		t.Fatalf("backlog has %d lines, want %d", len(p.backlog), len(lines))
	}
	for i := range lines {
		if p.backlog[i].content != lines[i] {
			t.Errorf("line %d = %q, want %q", i, p.backlog[i].content, lines[i])
		}
		if p.backlog[i].logType != "STDOUT" {
			t.Errorf("line %d type = %q, want STDOUT", i, p.backlog[i].logType)
		}
	}
}

func TestDispatchSendsEveryLine(t *testing.T) {
	p := &logPusher{queue: make(chan logEntry, 2)}
	p.cond = sync.NewCond(&p.mu)
	go p.dispatch()

	lines := []string{
		"starting backup of gitea",
		"dumping repositories",
		"done",
	}
	for _, line := range lines {
		p.Push(line, "STDOUT")
	}

	p.mu.Lock()
	p.closed = true
	p.cond.Signal()
	p.mu.Unlock()

	var got []string
	for entry := range p.queue {
		got = append(got, entry.content)
	}
	if len(got) != len(lines) {
		t.Fatalf("dispatched %q, want %q", got, lines)
	}
	for i := range lines {
		if got[i] != lines[i] {
			t.Errorf("line %d = %q, want %q", i, got[i], lines[i])
		}
	}
}
