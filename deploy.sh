#!/usr/bin/env bash
# Deploy del sito Klipski su klipski.martin-trajkovski.it
# Pull da GitHub, build della website e pubblicazione (Nginx serve website/dist/).
set -euo pipefail

REPO_DIR="/srv/apps/Klipski"
WEB_DIR="$REPO_DIR/website"

echo "==> git pull"
cd "$REPO_DIR"
git pull --ff-only origin main

echo "==> npm ci"
cd "$WEB_DIR"
npm ci

echo "==> build"
npm run build

echo "==> done. Live: https://klipski.martin-trajkovski.it"
