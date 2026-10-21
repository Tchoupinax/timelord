package file

import (
	"archive/zip"
	"bytes"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/Tchoupinax/timelord/agent/api"
	_ "github.com/Tchoupinax/timelord/agent/logger"
	"github.com/rs/zerolog/log"
)

// ErrNoAssets means the server has no asset archive for this job. Older
// servers report that as a JSON body with HTTP 200, which is not a zip.
var ErrNoAssets = errors.New("no job assets")

// Asset archives can be large, so this client waits longer than the API client.
// The header timeout still fails fast when the server never answers.
var downloadClient = &http.Client{
	Timeout: 5 * time.Minute,
	Transport: &http.Transport{
		DialContext: (&net.Dialer{
			Timeout:   10 * time.Second,
			KeepAlive: 15 * time.Second,
		}).DialContext,
		TLSHandshakeTimeout:   10 * time.Second,
		ResponseHeaderTimeout: 30 * time.Second,
		IdleConnTimeout:       15 * time.Second,
		MaxIdleConnsPerHost:   2,
	},
}

func DownloadFile(url, outputPath string) error {
	var lastErr error
	for attempt := 1; attempt <= 3; attempt++ {
		lastErr = downloadFileOnce(url, outputPath)
		if lastErr == nil {
			return nil
		}
		_ = os.Remove(outputPath)
		if attempt == 3 || !api.IsTransientNetworkError(lastErr) {
			break
		}
		downloadClient.CloseIdleConnections()
		time.Sleep(time.Duration(attempt) * 200 * time.Millisecond)
	}
	return lastErr
}

func downloadFileOnce(url, outputPath string) error {
	outFile, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	defer func() {
		_ = outFile.Close()
	}()

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	for key, value := range api.ComputeHeaders() {
		req.Header.Set(key, value)
	}

	resp, err := downloadClient.Do(req)
	if err != nil {
		return err
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Warn().Err(err).Msg("failed to close download response body")
		}
	}()

	log.Debug().Str("status", resp.Status).Msg("asset download response received")

	if resp.StatusCode != http.StatusOK {
		snippet, _ := io.ReadAll(io.LimitReader(resp.Body, 300))
		msg := strings.TrimSpace(string(snippet))
		if msg == "" {
			return fmt.Errorf("asset download failed: %s", resp.Status)
		}
		return fmt.Errorf("asset download failed: %s: %s", resp.Status, msg)
	}

	if _, err := io.Copy(outFile, resp.Body); err != nil {
		return fmt.Errorf("read asset download: %w", err)
	}
	if err := outFile.Close(); err != nil {
		return err
	}
	if err := ensureZip(outputPath); err != nil {
		if fileSaysNoAssets(outputPath) {
			return ErrNoAssets
		}
		return err
	}
	return nil
}

func fileSaysNoAssets(path string) bool {
	file, err := os.Open(path)
	if err != nil {
		return false
	}
	defer func() {
		_ = file.Close()
	}()

	buf := make([]byte, 512)
	n, _ := file.Read(buf)
	return strings.Contains(strings.ToLower(string(buf[:n])), "no assets found")
}

func ensureZip(path string) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer func() {
		_ = file.Close()
	}()

	buf := make([]byte, 120)
	n, err := file.Read(buf)
	if n >= 2 && buf[0] == 'P' && buf[1] == 'K' {
		return nil
	}
	if n == 0 && err != nil {
		return fmt.Errorf("downloaded asset is not a zip file: %w", err)
	}
	if snippet := printableSnippet(buf[:n]); snippet != "" {
		return fmt.Errorf("downloaded asset is not a zip file: %s", snippet)
	}
	return fmt.Errorf("downloaded asset is not a zip file")
}

func printableSnippet(raw []byte) string {
	raw = bytes.TrimSpace(raw)
	if len(raw) == 0 {
		return ""
	}
	for _, c := range raw {
		if c < 0x20 || c > 0x7e {
			return ""
		}
	}
	return string(raw)
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
