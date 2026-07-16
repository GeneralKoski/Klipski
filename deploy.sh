#!/usr/bin/env bash
# Deploy del sito Klipski + rilascio nuova versione dell'app.
#   1) Bump patch della versione (website/package.json)
#   2) Commit + push su main
#   3) Crea e pusha il tag vX.Y.Z  -> fa partire release.yml su GitHub (build DMG macOS)
#   4) Build del sito (Nginx serve website/dist/)
set -eu

# node/npm stanno sotto nvm e non sono nel PATH della shell non interattiva.
export NVM_DIR="${NVM_DIR:-/root/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null

REPO_DIR="/srv/apps/Klipski"
WEB_DIR="$REPO_DIR/website"

cd "$REPO_DIR"

echo "==> git pull"
git pull --ff-only origin main

echo "==> bump versione (patch)"
NEW_VERSION="$(node - <<'NODE'
const fs = require('fs');
const re = /("version"\s*:\s*")([^"]+)(")/;
const txt = fs.readFileSync('website/package.json', 'utf8');
const base = re.exec(txt)[2];
const [maj, min, pat] = base.split('.').map(Number);
const next = `${maj}.${min}.${pat + 1}`;
fs.writeFileSync('website/package.json', txt.replace(re, `$1${next}$3`));
process.stdout.write(next);
NODE
)"
echo "    -> v$NEW_VERSION"

echo "==> commit + push main"
git add website/package.json
git commit -m "Release v$NEW_VERSION"
git push origin main

echo "==> tag v$NEW_VERSION (avvia la release su GitHub)"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
git push origin "v$NEW_VERSION"

echo "==> build sito"
cd "$WEB_DIR"
npm ci
npm run build

echo "==> done."
echo "    Sito:    https://klipski.martin-trajkovski.it"
echo "    Release: build app in corso su GitHub Actions (verrà pubblicata automaticamente)"
