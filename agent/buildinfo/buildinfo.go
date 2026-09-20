package buildinfo

import "fmt"

var (
	Version   string
	BuildDate string
	Commit    string
)

func UserAgent() string {
	v := Version
	if v == "" {
		v = "dev"
	}
	return fmt.Sprintf("Timelord/%s agent", v)
}
