#!/usr/bin/env bash
set -euo pipefail

LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || true)

if [[ -z "$LATEST_TAG" ]]; then
  NEW_TAG="v0.0.1"
else
  VERSION="${LATEST_TAG#v}"
  if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "error: latest tag '$LATEST_TAG' is not semver (expected major.minor.patch)" >&2
    exit 1
  fi

  IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"
  PATCH=$((PATCH + 1))
  NEW_TAG="v${MAJOR}.${MINOR}.${PATCH}"
fi

echo "Latest tag: ${LATEST_TAG:-<none>} → New tag: $NEW_TAG"

git add . && git commit -m 'update' && git push

git tag "$NEW_TAG"
git push origin "$NEW_TAG"

echo "Published $NEW_TAG! 🎁"
