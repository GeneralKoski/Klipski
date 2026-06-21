# Klipski

Clipboard manager. Tre componenti nello stesso repo:

- `Sources/Klipski/` - app macOS nativa (Swift/AppKit), build con `./build.sh`.
- `desktop/` - client Windows/Linux (Tauri + React).
- `website/` - sito di presentazione (Vite + React), dominio `klipski.martin-trajkovski.it`.

## Release (importante)

Il rilascio è **automatico al bump di versione**, gestito da `.github/workflows/release.yml`.

Flusso per pubblicare una nuova versione:

1. Fai le modifiche.
2. **Bump della versione** in tutti e tre i file (tenerli allineati):
   - `desktop/src-tauri/tauri.conf.json`
   - `desktop/package.json`
   - `website/package.json`
3. Committa includendo il bump.
4. L'utente fa `git push origin main` (il push lo fa sempre l'utente: a Claude i `git push` sono bloccati dai permessi).

Il workflow legge la versione da `tauri.conf.json` e, se il tag `vX.Y.Z` non esiste
ancora, lo crea da solo e pubblica la GitHub Release con DMG macOS + binari
Windows/Linux. **Non creare il tag a mano.**

- Push su `main` **senza** bump di versione → nessuna release (il job `check` esce con `release=false`).
- Il push di un tag `v*` a mano resta supportato come prima.
- `build.sh` ricava la versione del bundle macOS da `GITHUB_REF_NAME` in CI; in locale usa il default hardcoded (va aggiornato col bump).

## Note app macOS

- Menu nativo (`NSMenu`) gestito in `AppDelegate.swift`; viste custom del menu in `MenuViews.swift`.
- Il wrap su/giù del menu principale usa un campo invisibile first-responder
  (`MenuArrowWrapField`) perché `NSMenu` non inoltra i tasti agli event monitor
  durante il tracking. Stessa tecnica del campo di ricerca in `MenuSearchField`.
