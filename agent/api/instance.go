package api

import "github.com/google/uuid"

// New UUID on each process start; sent to the server as a restart fingerprint.
var agentInstanceID = uuid.New().String()

func GetInstanceID() string {
	return agentInstanceID
}
