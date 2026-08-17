package main

import (
	"encoding/base64"
	"encoding/json"
	"os"
	"os/signal"
	"sync/atomic"
	"syscall"
	"time"

	api "github.com/Tchoupinax/timelord/agent/api"
	"github.com/Tchoupinax/timelord/agent/bash"
	"github.com/Tchoupinax/timelord/agent/file"
	_ "github.com/Tchoupinax/timelord/agent/logger"
	"github.com/Tchoupinax/timelord/agent/updater"
	"github.com/rs/zerolog/log"
)

var runningJobs atomic.Int32

func main() {
	// Check if the version is asked by flag
	cliCommandDisplayVersion(os.Args)

	apiUrl := os.Getenv("API_URL")
	if apiUrl == "" {
		apiUrl = "http://localhost:9988"
	}

	updater.StartAutoUpdateLoop(updater.Config{
		Version: version,
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
	log.Debug().Str("version", version).Msg("Start job processing task in background")

	for range time.Tick(time.Second * time.Duration(5)) {
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

func runJob(apiUrl string, data *api.ResponseData) {
	runningJobs.Add(1)
	// The counter gates job polling and the self-update: it must come back down
	// whatever happens, otherwise the agent stays busy forever.
	defer runningJobs.Add(-1)

	defer func() {
		if r := recover(); r != nil {
			log.Error().Any("panic", r).Msg("Job execution panicked")
			api.PushResult(apiUrl+"/job", data, 1, "", "")
		}
	}()

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

	// At the end of the process, clean assets
	log.Info().Msg("Cleaning")
	if err := os.RemoveAll(data.ExtractPath); err != nil {
		log.Error().Err(err).Msg("Error while removing assets")
	}
}

func getJob(url string) *api.ResponseData {
	body, _ := api.ApiGet(url)

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

	// Decode the Base64 string
	decodedBytes, err := base64.StdEncoding.DecodeString(data.File)
	if err != nil {
		log.Error().Err(err).Msg("Error decoding job script from Base64")
		return nil
	}

	data.File = string(decodedBytes)

	// 🚀 Download assets if attached to this cron job
	if data.HasAssets {
		folder := "/tmp/timelord/"
		if err := os.MkdirAll(folder, os.ModePerm); err != nil {
			log.Error().Err(err).Str("folder", folder).Msg("Failed to create assets folder")
		}

		zipFilePath := folder + data.Id + ".zip"
		extractPath := folder + data.Id

		assetsUrl := url + "/assets?jobId=" + data.Id
		if err := file.DownloadFile(assetsUrl, zipFilePath); err != nil {
			log.Error().Err(err).Str("url", assetsUrl).Msg("Error downloading job assets")
		}

		if err := file.Unzip(zipFilePath, extractPath); err != nil {
			log.Error().Err(err).Str("archive", zipFilePath).Msg("Error extracting job assets")
		}

		if err := os.Remove(zipFilePath); err != nil {
			log.Error().Err(err).Str("path", zipFilePath).Msg("Failed to remove assets archive")
		}

		data.ExtractPath = extractPath
	}

	return &data
}

func heartbeat(apiUrl string) {
	log.Debug().Str("version", version).Msg("Start heartbeat")

	if version == "" {
		version = "l-01"
	}

	for range time.Tick(time.Second * time.Duration(10)) {
		payload := map[string]any{
			"version": version,
		}
		jsonData, _ := json.Marshal(payload)

		go func() {
			if _, err := api.ApiPost(apiUrl+"/heartbeat", jsonData); err != nil {
				log.Warn().Err(err).Msg("heartbeat failed")
			}
		}()
	}
}
