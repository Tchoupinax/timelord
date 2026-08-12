package file

import (
	"archive/zip"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/Tchoupinax/timelord/agent/api"
	_ "github.com/Tchoupinax/timelord/agent/logger"
	"github.com/rs/zerolog/log"
)

func DownloadFile(url, outputPath string) error {
	outFile, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	defer func() {
		if err := outFile.Close(); err != nil {
			log.Warn().Err(err).Msg("failed to close downloaded file")
		}
	}()

	req, _ := http.NewRequest("GET", url, nil)
	for key, value := range api.ComputeHeaders() {
		req.Header.Set(key, value)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Warn().Err(err).Msg("failed to close download response body")
		}
	}()

	log.Debug().Str("status", resp.Status).Msg("asset download response received")

	_, err = io.Copy(outFile, resp.Body)
	return err
}

func Unzip(source, destination string) error {
	r, err := zip.OpenReader(source)
	if err != nil {
		return err
	}
	defer func() {
		if err := r.Close(); err != nil {
			log.Warn().Err(err).Msg("failed to close zip archive")
		}
	}()

	for _, file := range r.File {
		filePath := filepath.Join(destination, file.Name)

		if file.FileInfo().IsDir() {
			if err := os.MkdirAll(filePath, os.ModePerm); err != nil {
				return err
			}
		} else {
			if err := os.MkdirAll(filepath.Dir(filePath), os.ModePerm); err != nil {
				return err
			}

			outFile, err := os.Create(filePath)
			if err != nil {
				return err
			}
			defer func() {
				if err := outFile.Close(); err != nil {
					log.Warn().Err(err).Msg("failed to close extracted file")
				}
			}()

			rc, err := file.Open()
			if err != nil {
				return err
			}
			defer func() {
				if err := rc.Close(); err != nil {
					log.Warn().Err(err).Msg("failed to close zip entry reader")
				}
			}()

			_, err = io.Copy(outFile, rc)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
