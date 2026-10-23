package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"
	"sync/atomic"
	"syscall"
	"time"

	api "github.com/Tchoupinax/timelord/agent/api"
	"github.com/Tchoupinax/timelord/agent/bash"
	"github.com/Tchoupinax/timelord/agent/buildinfo"
	"github.com/Tchoupinax/timelord/agent/file"
	_ "github.com/Tchoupinax/timelord/agent/logger"
	"github.com/Tchoupinax/timelord/agent/updater"
	"github.com/rs/zerolog/log"
)

var runningJobs atomic.Int32

func main() {
	// Check if the version is asked by flag
	cliCommandDisplayVersion(os.Args)

	log.Info().Str("instance", api.GetInstanceID()).Msg("Agent runtime instance")

	apiUrl := os.Getenv("API_URL")
	if apiUrl == "" {
		apiUrl = "http://localhost:9988"
	}

	updater.StartAutoUpdateLoop(updater.Config{
		Version: buildinfo.Version,
		HasRunningJobs: func() bool {
			return runningJobs.Load() > 0
		},
	})

	go processJob(apiUrl)
	go heartbeat(apiUrl)

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig
	log.Info().Msg("Shutting down")
}

func processJob(apiUrl string) {
	log.Debug().Str("version", buildinfo.Version).Msg("Start job processing task in background")

	for {
		// Sleep ~5s with up to 1s of jitter. The jitter spreads the polling of a
		// fleet of agents so a recovering server is not hit by a synchronized
		// thundering herd.
		time.Sleep(pollInterval())

		if runningJobs.Load() > 0 {
			log.Debug().Msg("Agent busy, skipping job poll")
			continue
		}

		log.Debug().Str("url", apiUrl).Str("hostname", api.GetHostname()).Msg("Get job")

		data := getJob(apiUrl + "/job")
		if data != nil {
			runJob(apiUrl, data)
		}

		log.Info().Msg("Waiting for next job")
	}
}

func pollInterval() time.Duration {
	return 5*time.Second + time.Duration(rand.Int63n(int64(time.Second)))
}

func runJob(apiUrl string, data *api.ResponseData) {
	runningJobs.Add(1)
	// The counter gates job polling and the self-update: it must come back down
	// whatever happens, otherwise the agent stays busy forever.
	defer runningJobs.Add(-1)
	defer func() {
		if data.ExtractPath == "" {
			return
		}
		log.Info().Msg("Cleaning")
		if err := os.RemoveAll(data.ExtractPath); err != nil {
			log.Error().Err(err).Msg("Error while removing assets")
		}
	}()
	defer api.SetActiveJobID("")

	defer func() {
		if r := recover(); r != nil {
			log.Error().Any("panic", r).Msg("Job execution panicked")
			api.PushResult(apiUrl+"/job", data, 1, "", "")
		}
	}()

	// A corrupt archive used to be logged and then ignored, so the script ran
	// without the files it expects. A server with no assets is not a failure.
	if data.HasAssets {
		if err := prepareAssets(apiUrl, data); err != nil {
			if errors.Is(err, file.ErrNoAssets) {
				log.Info().Str("job_id", data.Id).Msg("No assets attached to this job")
			} else {
				log.Error().Err(err).Str("job_id", data.Id).Msg("Error preparing job assets")
				api.PushResult(apiUrl+"/job", data, 1, "Error", assetFailureComment(err))
				return
			}
		}
	}

	result := bash.Exec(data.File, apiUrl, data)
	log.Debug().Msg(data.Id)

	statusComment := ""
	if result.Cancelled {
		statusComment = "Cancelled by user"
	}

	api.PushResult(
		apiUrl+"/job",
		data,
		result.Status,
		result.FinalState,
		statusComment,
	)
}

func prepareAssets(apiUrl string, data *api.ResponseData) error {
	folder := "/tmp/timelord"
	if err := os.MkdirAll(folder, os.ModePerm); err != nil {
		return fmt.Errorf("create assets folder: %w", err)
	}

	zipFilePath := filepath.Join(folder, data.Id+".zip")
	extractPath := filepath.Join(folder, data.Id)
	defer func() {
		_ = os.Remove(zipFilePath)
	}()

	assetsURL := apiUrl + "/job/assets?jobId=" + url.QueryEscape(data.Id)
	if err := file.DownloadFile(assetsURL, zipFilePath); err != nil {
		return err
	}
	if err := file.Unzip(zipFilePath, extractPath); err != nil {
		_ = os.RemoveAll(extractPath)
		return fmt.Errorf("extract job assets: %w", err)
	}

	data.ExtractPath = extractPath
	return nil
}

func assetFailureComment(err error) string {
	comment := "Failed to prepare job assets: " + err.Error()
	const max = 500
	if len(comment) > max {
		return comment[:max]
	}
	return comment
}

func getJob(url string) *api.ResponseData {
	body, err := api.ApiGet(url)
	if err != nil {
		// Server or proxy unreachable: ApiGet already logged it, poll again.
		return nil
	}

	// Unmarshal the JSON body into the struct
	var data api.ResponseData
	if err := json.Unmarshal(body, &data); err != nil {
		log.Error().Err(err).Str("body", string(body)).Msg("Error unmarshalling job response")
		return nil
	}

	if data.Message != "" {
		log.Info().Msg(data.Message)
		return nil
	}

	log.Info().Msg("🚀 File received")
	api.SetActiveJobID(data.Id)

	// Decode the Base64 string
	decodedBytes, err := base64.StdEncoding.DecodeString(data.File)
	if err != nil {
		log.Error().Err(err).Msg("Error decoding job script from Base64")
		api.SetActiveJobID("")
		return nil
	}

	data.File = string(decodedBytes)

	return &data
}

func heartbeat(apiUrl string) {
	reportedVersion := buildinfo.Version
	if reportedVersion == "" {
		reportedVersion = "l-01"
	}

	log.Debug().Str("version", reportedVersion).Msg("Start heartbeat")

	// One heartbeat at a time. Overlapping POSTs on a dead keep-alive
	// connection are what surface as "connection reset by peer": net/http
	// replays a GET, but not a POST, so the poll hides the reset and the
	// heartbeat does not. Retry the POST on a fresh connection.
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		payload := map[string]any{
			"version":     reportedVersion,
			"activeJobId": api.GetActiveJobID(),
		}
		jsonData, err := json.Marshal(payload)
		if err != nil {
			log.Warn().Err(err).Msg("heartbeat payload failed")
			continue
		}

		if _, err := api.ApiPostWithRetry(apiUrl+"/heartbeat", jsonData, 3); err != nil {
			log.Warn().Err(err).Msg("heartbeat failed")
		}
	}
}
