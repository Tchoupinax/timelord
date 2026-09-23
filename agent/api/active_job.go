package api

import "sync"

var (
	activeJobMu sync.RWMutex
	activeJobID string
)

func SetActiveJobID(id string) {
	activeJobMu.Lock()
	activeJobID = id
	activeJobMu.Unlock()
}

func GetActiveJobID() string {
	activeJobMu.RLock()
	defer activeJobMu.RUnlock()
	return activeJobID
}
