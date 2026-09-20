package main

import (
	"fmt"
	"os"
	"slices"

	"github.com/Tchoupinax/timelord/agent/buildinfo"
	"github.com/fatih/color"
)

func cliCommandDisplayVersion(args []string) {
	displayVersion := slices.Contains(args[1:], "-v") || slices.Contains(args[1:], "--version")

	if displayVersion {
		bold := color.New(color.Bold).SprintFunc()

		fmt.Println()
		fmt.Println(bold("⚡️ Timelord Agent"))
		fmt.Println()
		fmt.Println("build date: ", bold(buildinfo.BuildDate))
		fmt.Println("version:    ", bold(buildinfo.Version))
		fmt.Println("commit:     ", bold(buildinfo.Commit))
		fmt.Println()
		os.Exit(0)
	}
}
