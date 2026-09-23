#!/usr/bin/env bash
# Deploy del sito Klipski: pull di main + build (Nginx serve website/dist/).
# Bump di versione, tag e release dell'app li gestisce release.yml al push su main.
set -eu

# node/npm stanno sotto nvm e non sono nel PATH della shell non interattiva.
export NVM_DIR="${NVM_DIR:-/root/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null

REPO_DIR="/srv/apps/Klipski"
WEB_DIR="$REPO_DIR/website"

cd "$REPO_DIR"

echo "==> git pull"
git pull --ff-only origin main

echo "==> build sito"
cd "$WEB_DIR"
npm ci
npm run build

echo "==> done."
echo "    Sito: https://klipski.martin-trajkovski.it (versione $(node -p "require('./package.json').version"))"
