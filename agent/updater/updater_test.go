package updater

import "testing"

func TestNormalizeVersion(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name     string
		input    string
		expected string
	}{
		{name: "plain version", input: "1.2.3", expected: "1.2.3"},
		{name: "v prefix", input: "v1.2.3", expected: "1.2.3"},
		{name: "uppercase v prefix", input: "V2.0.0", expected: "2.0.0"},
		{name: "prerelease", input: "v1.2.3-beta.1", expected: "1.2.3"},
		{name: "build metadata", input: "1.2.3+build.9", expected: "1.2.3"},
		{name: "invalid version", input: "dev", expected: ""},
	}

	for _, testCase := range testCases {
		testCase := testCase
		t.Run(testCase.name, func(t *testing.T) {
			t.Parallel()

			actual := normalizeVersion(testCase.input)
			if actual != testCase.expected {
				t.Fatalf("expected %q, got %q", testCase.expected, actual)
			}
		})
	}
}

func TestIsVersionNewer(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name         string
		candidate    string
		current      string
		expected     bool
		expectingErr bool
	}{
		{name: "patch upgrade", candidate: "1.2.4", current: "1.2.3", expected: true},
		{name: "same version", candidate: "1.2.3", current: "1.2.3", expected: false},
		{name: "candidate older", candidate: "1.2.2", current: "1.2.3", expected: false},
		{name: "missing patch still compares", candidate: "1.3", current: "1.2.9", expected: true},
		{name: "invalid version", candidate: "dev", current: "1.2.3", expectingErr: true},
	}

	for _, testCase := range testCases {
		testCase := testCase
		t.Run(testCase.name, func(t *testing.T) {
			t.Parallel()

			actual, err := isVersionNewer(testCase.candidate, testCase.current)
			if testCase.expectingErr {
				if err == nil {
					t.Fatal("expected an error")
				}
				return
			}

			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if actual != testCase.expected {
				t.Fatalf("expected %t, got %t", testCase.expected, actual)
			}
		})
	}
}

func TestFindReleaseAssetForRuntime(t *testing.T) {
	t.Parallel()

	assets := []githubReleaseAsset{
		{Name: "timelord_Darwin_arm64.tar.gz", BrowserDownloadURL: "darwin"},
		{Name: "timelord_Linux_x86_64.tar.gz", BrowserDownloadURL: "linux"},
	}

	asset, err := findReleaseAssetForRuntime(assets, "linux", "amd64")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if asset.BrowserDownloadURL != "linux" {
		t.Fatalf("expected linux asset, got %q", asset.BrowserDownloadURL)
	}
}
