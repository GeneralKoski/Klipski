# Klipski

Clipboard manager nativo per macOS, app menu bar (sostituto di Clipy). Scritto in Swift, senza dipendenze esterne (solo AppKit, Carbon, ServiceManagement).

## Funzioni

- **Cronologia appunti**: monitora gli appunti (testo e immagini), salva gli ultimi 30 elementi (configurabile). Persistenza in `~/Library/Application Support/Klipski/`.
- **Menu nella barra di stato**: mostra gli elementi recenti (testo troncato, immagini con anteprima). Click → rimette negli appunti.
- **Incolla automaticamente**: opzione che, dopo la copia, simula `Cmd+V` (richiede permesso Accessibilità).
- **Hotkey globale**: `Cmd+Shift+V` apre il menu della cronologia.
- **Snippet**: testi predefiniti in `~/Library/Application Support/Klipski/snippets.json`, mostrati in un sottomenu.
- **Avvia al login**: tramite `SMAppService` (API moderna, niente notifiche cicliche).

## Requisiti

- macOS 14 o superiore
- Command Line Tools di Xcode (`xcode-select --install`) - **non serve Xcode**

## Installazione

```bash
git clone <url-repo> Klipski
cd Klipski
./build.sh
```

Lo script compila in release, assembla `Klipski.app`, la firma ad-hoc, la copia in `/Applications` e la avvia. L'icona compare nella barra di stato (nessuna icona nel Dock).

Compilando in locale l'app non ha quarantena, quindi **niente avvisi Gatekeeper**.

## Permesso Accessibilità (auto-incolla)

L'opzione "Incolla automaticamente" simula `Cmd+V` e richiede il permesso Accessibilità:

**Impostazioni di Sistema → Privacy e sicurezza → Accessibilità → abilita Klipski**

Alla prima attivazione l'app mostra il prompt di sistema. Senza il permesso l'elemento viene comunque copiato negli appunti (nessun crash).

## Dati salvati

`~/Library/Application Support/Klipski/`
- `history.json` - cronologia (le immagini sono file PNG referenziati in `images/`)
- `snippets.json` - snippet personalizzabili
