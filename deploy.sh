#!/usr/bin/env bash
# Deploy del sito Klipski + rilascio nuova versione dell'app.
#   1) Bump patch della versione (website/package.json, desktop/package.json, tauri.conf.json)
#   2) Commit + push su main
#   3) Crea e pusha il tag vX.Y.Z  -> fa partire release.yml su GitHub (build app Win/Linux/macOS)
#   4) Build del sito (Nginx serve website/dist/)
set -eu

REPO_DIR="/srv/apps/Klipski"
WEB_DIR="$REPO_DIR/website"

cd "$REPO_DIR"

echo "==> git pull"
git pull --ff-only origin main

echo "==> bump versione (patch)"
NEW_VERSION="$(node - <<'NODE'
const fs = require('fs');
const files = [
  'website/package.json',
  'desktop/package.json',
  'desktop/src-tauri/tauri.conf.json',
];
const re = /("version"\s*:\s*")([^"]+)(")/;
const base = re.exec(fs.readFileSync('website/package.json', 'utf8'))[2];
const [maj, min, pat] = base.split('.').map(Number);
const next = `${maj}.${min}.${pat + 1}`;
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, txt.replace(re, `$1${next}$3`));
}
process.stdout.write(next);
NODE
)"
echo "    -> v$NEW_VERSION"

echo "==> commit + push main"
git add website/package.json desktop/package.json desktop/src-tauri/tauri.conf.json
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
