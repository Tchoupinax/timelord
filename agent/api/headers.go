package api

import (
	"os"
)

func ComputeHeaders() map[string]string {
	hostname := GetHostname()

	// We check if AGENT_MASTER_TOKEN is provided. If it's the case, this agent
	// is identified by its Hostname. So the authentication is the master token.
	masterToken := os.Getenv("AGENT_MASTER_TOKEN")
	if masterToken != "" {
		return map[string]string{
			"X-Timelord-Hostname":    hostname,
			"X-Timelord-Agent-Token": masterToken,
			"Content-Type":           "application/json",
			"User-Agent":             "timelord agent",
		}
	}

	return map[string]string{
		"X-Timelord-Hostname":    hostname,
		"X-Timelord-Agent-Token": os.Getenv("AGENT_TOKEN"),
		"Content-Type":           "application/json",
		"User-Agent":             "timelord agent",
	}
}

func GetHostname() string {
	hostnameDefinedByUser := os.Getenv("AGENT_HOSTNAME")
	if hostnameDefinedByUser != "" {
		return hostnameDefinedByUser
	}

	hostname, _ := os.Hostname()
	return hostname
}
