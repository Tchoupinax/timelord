package updater

import (
	"archive/tar"
	"compress/gzip"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/rs/zerolog/log"
)

const (
	latestReleaseURL         = "https://api.github.com/repos/Tchoupinax/timelord/releases/latest"
	autoUpdateInterval       = time.Hour
	autoUpdateEnabledEnvName = "AGENT_AUTO_UPDATE"
	releaseBinaryName        = "timelord-agent"
)

type githubRelease struct {
	TagName string               `json:"tag_name"`
	Assets  []githubReleaseAsset `json:"assets"`
}

type githubReleaseAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

type Config struct {
	Version        string
	HasRunningJobs func() bool
}

func StartAutoUpdateLoop(config Config) {
	if !isAutoUpdateEnabled() {
		log.Info().Msg("Auto-update disabled")
		return
	}

	if normalizeVersion(config.Version) == "" {
		log.Info().Msg("Auto-update skipped because the current build has no release version")
		return
	}

	go func() {
		runAutoUpdateCheck(config)

		ticker := time.NewTicker(autoUpdateInterval)
		defer ticker.Stop()

		for range ticker.C {
			runAutoUpdateCheck(config)
		}
	}()
}

func runAutoUpdateCheck(config Config) {
	if err := checkForUpdate(config); err != nil {
		log.Warn().Err(err).Msg("Auto-update check failed")
	}
}

func checkForUpdate(config Config) error {
	currentVersion := normalizeVersion(config.Version)
	if currentVersion == "" {
		return nil
	}

	release, err := fetchLatestRelease()
	if err != nil {
		return err
	}

	latestVersion := normalizeVersion(release.TagName)
	if latestVersion == "" {
		return errors.New("latest release does not expose a comparable version")
	}

	isNewer, err := isVersionNewer(latestVersion, currentVersion)
	if err != nil {
		return err
	}
	if !isNewer {
		return nil
	}

	if config.HasRunningJobs != nil && config.HasRunningJobs() {
		log.Info().
			Str("current_version", currentVersion).
			Str("latest_version", latestVersion).
			Msg("Update available but postponed while a job is running")
		return nil
	}

	asset, err := findReleaseAssetForRuntime(release.Assets, runtime.GOOS, runtime.GOARCH)
	if err != nil {
		return err
	}

	executablePath, err := executableTargetPath()
	if err != nil {
		return err
	}

	log.Info().
		Str("current_version", currentVersion).
		Str("latest_version", latestVersion).
		Str("asset", asset.Name).
		Msg("Updating agent")

	if err := downloadAndReplaceExecutable(asset.BrowserDownloadURL, executablePath); err != nil {
		return err
	}

	log.Info().
		Str("version", latestVersion).
		Str("path", executablePath).
		Msg("Agent updated, restarting process")

	return syscall.Exec(executablePath, os.Args, os.Environ())
}

func isAutoUpdateEnabled() bool {
	value := strings.TrimSpace(strings.ToLower(os.Getenv(autoUpdateEnabledEnvName)))
	return value != "false" && value != "0" && value != "no"
}

func fetchLatestRelease() (*githubRelease, error) {
	req, err := http.NewRequest(http.MethodGet, latestReleaseURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "timelord-agent")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected GitHub status: %s", resp.Status)
	}

	var release githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, err
	}

	return &release, nil
}

func findReleaseAssetForRuntime(assets []githubReleaseAsset, goos, goarch string) (*githubReleaseAsset, error) {
	expectedSuffix := releaseArchiveSuffix(goos, goarch)
	for _, asset := range assets {
		if strings.HasSuffix(asset.Name, expectedSuffix) {
			return &asset, nil
		}
	}

	return nil, fmt.Errorf("no release asset found for %s/%s", goos, goarch)
}

func releaseArchiveSuffix(goos, goarch string) string {
	osName := goos
	switch goos {
	case "darwin":
		osName = "Darwin"
	case "linux":
		osName = "Linux"
	case "windows":
		osName = "Windows"
	}

	archName := goarch
	switch goarch {
	case "amd64":
		archName = "x86_64"
	case "386":
		archName = "i386"
	}

	return fmt.Sprintf("_%s_%s.tar.gz", osName, archName)
}

func executableTargetPath() (string, error) {
	executablePath, err := os.Executable()
	if err != nil {
		return "", err
	}

	resolvedPath, err := filepath.EvalSymlinks(executablePath)
	if err == nil {
		return resolvedPath, nil
	}

	return executablePath, nil
}

func downloadAndReplaceExecutable(downloadURL, executablePath string) error {
	tempDir := filepath.Dir(executablePath)

	archiveFile, err := os.CreateTemp(tempDir, "timelord-update-*.tar.gz")
	if err != nil {
		return err
	}
	archivePath := archiveFile.Name()
	if err := archiveFile.Close(); err != nil {
		return err
	}
	defer func() {
		_ = os.Remove(archivePath)
	}()

	replacementFile, err := os.CreateTemp(tempDir, "timelord-update-*")
	if err != nil {
		return err
	}
	replacementPath := replacementFile.Name()
	if err := replacementFile.Close(); err != nil {
		return err
	}
	defer func() {
		_ = os.Remove(replacementPath)
	}()

	if err := downloadFile(downloadURL, archivePath); err != nil {
		return err
	}

	if err := extractBinaryFromArchive(archivePath, replacementPath, releaseBinaryName); err != nil {
		return err
	}

	return os.Rename(replacementPath, executablePath)
}

func downloadFile(downloadURL, destinationPath string) error {
	req, err := http.NewRequest(http.MethodGet, downloadURL, nil)
	if err != nil {
		return err
	}

	req.Header.Set("User-Agent", "timelord-agent")

	client := &http.Client{Timeout: 2 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected download status: %s", resp.Status)
	}

	file, err := os.Create(destinationPath)
	if err != nil {
		return err
	}
	defer func() {
		_ = file.Close()
	}()

	_, err = io.Copy(file, resp.Body)
	return err
}

func extractBinaryFromArchive(archivePath, destinationPath, binaryName string) error {
	file, err := os.Open(archivePath)
	if err != nil {
		return err
	}
	defer func() {
		_ = file.Close()
	}()

	gzipReader, err := gzip.NewReader(file)
	if err != nil {
		return err
	}
	defer func() {
		_ = gzipReader.Close()
	}()

	tarReader := tar.NewReader(gzipReader)
	for {
		header, err := tarReader.Next()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return err
		}

		if filepath.Base(header.Name) != binaryName {
			continue
		}

		destinationFile, err := os.OpenFile(destinationPath, os.O_WRONLY|os.O_TRUNC, 0o755)
		if err != nil {
			return err
		}

		_, copyErr := io.Copy(destinationFile, tarReader)
		closeErr := destinationFile.Close()
		if copyErr != nil {
			return copyErr
		}
		if closeErr != nil {
			return closeErr
		}

		return os.Chmod(destinationPath, 0o755)
	}

	return fmt.Errorf("binary %q not found in release archive", binaryName)
}

func isVersionNewer(candidateVersion, currentVersion string) (bool, error) {
	candidateParts, err := parseVersionParts(candidateVersion)
	if err != nil {
		return false, err
	}

	currentParts, err := parseVersionParts(currentVersion)
	if err != nil {
		return false, err
	}

	for idx := range max(len(candidateParts), len(currentParts)) {
		candidatePart := versionPartAt(candidateParts, idx)
		currentPart := versionPartAt(currentParts, idx)

		if candidatePart > currentPart {
			return true, nil
		}
		if candidatePart < currentPart {
			return false, nil
		}
	}

	return false, nil
}

func parseVersionParts(rawVersion string) ([]int, error) {
	normalized := normalizeVersion(rawVersion)
	if normalized == "" {
		return nil, fmt.Errorf("invalid version %q", rawVersion)
	}

	parts := strings.Split(normalized, ".")
	versionParts := make([]int, 0, len(parts))
	for _, part := range parts {
		value, err := strconv.Atoi(part)
		if err != nil {
			return nil, fmt.Errorf("invalid version part %q", part)
		}
		versionParts = append(versionParts, value)
	}

	return versionParts, nil
}

func normalizeVersion(rawVersion string) string {
	normalized := strings.TrimSpace(rawVersion)
	normalized = strings.TrimPrefix(normalized, "v")
	normalized = strings.TrimPrefix(normalized, "V")

	if idx := strings.IndexAny(normalized, "-+"); idx >= 0 {
		normalized = normalized[:idx]
	}

	if normalized == "" {
		return ""
	}

	for _, part := range strings.Split(normalized, ".") {
		if part == "" {
			return ""
		}

		for _, char := range part {
			if char < '0' || char > '9' {
				return ""
			}
		}
	}

	return normalized
}

func versionPartAt(parts []int, idx int) int {
	if idx >= len(parts) {
		return 0
	}

	return parts[idx]
}
