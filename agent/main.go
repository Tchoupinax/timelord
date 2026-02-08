package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	api "github.com/Tchoupinax/timelord/agent/api"
	"github.com/Tchoupinax/timelord/agent/bash"
	"github.com/Tchoupinax/timelord/agent/file"
	"github.com/rs/zerolog/log"
)

func main() {
	// Check if the version is asked by flag
	cliCommandDisplayVersion(os.Args)

	apiUrl := os.Getenv("API_URL")
	if apiUrl == "" {
		apiUrl = "http://localhost:9988"
	}

	go heartbeat(apiUrl)
	go processJob(apiUrl)

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig
	log.Info().Msg("Shutting down")
}

func processJob(apiUrl string) {
	log.Debug().Str("version", version).Msg("Start job processing task in background")

	for range time.Tick(time.Second * time.Duration(10)) {
		go func() {
			log.Debug().Str("url", apiUrl).Str("hostname", api.GetHostname()).Msg("Get job")

			data := getJob(apiUrl + "/job")
			if data != nil {
				result := bash.Exec(data.File, apiUrl, data)
				log.Debug().Msg(data.Id)

				api.PushResult(
					apiUrl+"/job",
					data,
					result.Status,
				)

				// At the end of the process, clean assets
				log.Info().Msg("Cleaning")
				err := os.RemoveAll(data.ExtractPath)
				if err != nil {
					log.Error().Msg("Error while removing assets")
					fmt.Println(err)
				}
			}

			log.Info().Msg("Waiting for next job")
		}()
	}
}

func getJob(url string) *api.ResponseData {
	body, _ := api.ApiGet(url)

	// Unmarshal the JSON body into the struct
	var data api.ResponseData
	if err := json.Unmarshal(body, &data); err != nil {
		fmt.Println(string(body))
		fmt.Printf("Error unmarshalling JSON: %s\n", err)
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
		fmt.Printf("Error decoding Base64: %s\n", err)
		return nil
	}

	data.File = string(decodedBytes)

	// 🚀 Download assets if attached to this cron job
	if data.HasAssets {
		folder := "/tmp/timelord/"
		err := os.MkdirAll(folder, os.ModePerm)
		if err != nil {
			fmt.Println(err)
		}

		zipFilePath := folder + data.Id + ".zip"
		extractPath := folder + data.Id

		assetsUrl := url + "/assets?jobId=" + data.Id
		if err := file.DownloadFile(assetsUrl, zipFilePath); err != nil {
			fmt.Println("Error downloading file:", err)
		}

		if err := file.Unzip(zipFilePath, extractPath); err != nil {
			fmt.Println("Error extracting file:", err)
		}

		err = os.Remove(zipFilePath)
		if err != nil {
			fmt.Println(err)
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
				log.Printf("heartbeat failed: %v", err)
			}
		}()
	}
}
