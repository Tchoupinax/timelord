package main

import (
	"fmt"
	"os"
	"slices"

	"github.com/fatih/color"
)

var (
	version   string
	buildDate string
	commit    string
)

func cliCommandDisplayVersion(args []string) {
	displayVersion := slices.Contains(args[1:], "-v") || slices.Contains(args[1:], "--version")

	if displayVersion {
		bold := color.New(color.Bold).SprintFunc()

		fmt.Println()
		fmt.Println(bold("⚡️ Timelord Agent"))
		fmt.Println()
		fmt.Println("build date: ", bold(buildDate))
		fmt.Println("version:    ", bold(version))
		fmt.Println("commit:     ", bold(commit))
		fmt.Println()
		os.Exit(0)
	}
}
