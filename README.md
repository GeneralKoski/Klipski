# Klipski

Clipboard manager multipiattaforma (sostituto di Clipy): cronologia di testi e immagini, snippet a cartelle, hotkey globale e incolla automatico.

- **macOS** - app nativa in Swift (AppKit/Carbon/ServiceManagement), nessuna dipendenza esterna.
- **Windows / Linux** - client [Tauri](https://tauri.app) (Rust + UI web React) con la stessa esperienza e le stesse impostazioni.
- **Sito web** - landing page React + Vite in `website/` per la promozione e il download.

## Struttura del progetto

```
.                 app macOS (Swift) - Sources/, Package.swift, build.sh
desktop/          client Windows/Linux (Tauri): src/ (UI React) + src-tauri/ (Rust)
website/          sito vetrina (React + Vite) con rilevamento OS, SEO, sitemap
deploy.sh         deploy del sito sul server (pull + build, servito da Nginx)
.github/workflows release.yml (build dei binari su tag)
```

I tre progetti sono indipendenti: l'app macOS resta invariata, gli altri si aggiungono senza toccarla.

## Funzioni

- **Cronologia appunti**: monitora gli appunti (testo e immagini), con deduplica e persistenza in `~/Library/Application Support/Klipski/`. Limiti separati e configurabili: di default **50 testi** e **10 immagini**.
- **Menu nella barra di stato**: due cartelle **Testi** e **Immagini** con gli elementi recenti (testo troncato a ~50 caratteri). Click su un elemento → lo rimette negli appunti.
- **Incolla automaticamente**: dopo la copia simula `Cmd+V` (richiede permesso Accessibilità). Attivo di default; la spunta riflette lo stato effettivo (off se manca il permesso).
- **Hotkey globale personalizzabile**: default `Cmd+Shift+V`, modificabile dalla dashboard *Personalizza…*.
- **Snippet a cartelle**: cartelle di testi fissi (es. "Mails", "Firme") mostrate come voci dirette del menu. Gestione completa (crea/rinomina/elimina cartelle e snippet) dalla dashboard.
- **Import da Clipy**: importa le cartelle di snippet da un file XML esportato da Clipy (*Snippets → Export Snippets…*).
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

> Nota: ad ogni ricompilazione la firma ad-hoc cambia, quindi macOS **resetta il permesso Accessibilità**. Va riconcesso e l'app riavviata (vedi sotto).

## Dashboard "Personalizza…"

Dal menu della barra di stato → *Personalizza…* apri la finestra di gestione, dove puoi:

- impostare la **scorciatoia globale** di apertura;
- scegliere quanti **testi/immagini** mostrare;
- creare/rinominare/eliminare **cartelle** e **snippet** (titolo + contenuto multiriga);
- **importare** gli snippet da Clipy (Export XML).

## Permesso Accessibilità (auto-incolla)

L'opzione "Incolla automaticamente" simula `Cmd+V` e richiede il permesso Accessibilità:

**Impostazioni di Sistema → Privacy e sicurezza → Accessibilità → abilita Klipski**

Alla prima attivazione l'app mostra il prompt di sistema. Dopo aver concesso il permesso **riavvia Klipski** perché diventi effettivo. Senza il permesso l'elemento viene comunque copiato negli appunti (nessun crash).

## Importare gli snippet da Clipy

1. In Clipy: icona nella barra → *Edit Snippets…* → menu *Snippets* → *Export Snippets…* e salva il file `.xml` (consigliato: sul Desktop).
2. In Klipski: *Personalizza…* → *Importa da Clipy…* → seleziona l'XML. Le cartelle vengono aggiunte a quelle esistenti.

> Clipy salva gli snippet in un database Realm (binario): l'import passa dall'export XML perché leggere il Realm richiederebbe una dipendenza esterna.

## Dati salvati

`~/Library/Application Support/Klipski/`
- `history.json` - cronologia (le immagini sono file PNG referenziati in `images/`)
- `snippets.json` - cartelle e snippet

Le preferenze (limiti, auto-incolla, scorciatoia) sono in `UserDefaults` (dominio `com.klipski.app`). Tutti questi dati **sopravvivono alla reinstallazione** (`build.sh` sostituisce solo l'app in `/Applications`).

## Client Windows / Linux (Tauri)

Stessa UI e stesse impostazioni del Mac, ma con backend Rust e UI web. Requisiti: [Rust](https://rustup.rs), Node 20+ e le [dipendenze di sistema Tauri](https://tauri.app/start/prerequisites/).

```bash
cd desktop
npm install
npm run tauri dev      # avvio in sviluppo
npm run tauri build    # genera .msi/.exe (Windows) o .AppImage/.deb (Linux)
```

Dati salvati nella cartella dati applicazione del sistema (`history.json`, `snippets.json`, `settings.json`, `images/`). L'incolla automatico su Linux richiede `libxdo`; il monitor degli appunti, la hotkey globale e l'avvio al login usano i plugin Tauri corrispondenti.

## Sito web

Landing page in `website/` (React + Vite) che rileva l'OS del visitatore e propone il download giusto. SEO, Open Graph, `robots.txt` e `sitemap.xml` inclusi.

```bash
cd website
npm install
npm run dev      # sviluppo
npm run build    # output statico in website/dist
```

I link di download sono configurabili: copia `.env.example` in `.env` e imposta `VITE_DL_MACOS`, `VITE_DL_WINDOWS`, `VITE_DL_LINUX` con gli URL reali (es. asset delle GitHub Releases). Senza valori restano dei placeholder.

## Release & deploy (CI)

- **`.github/workflows/release.yml`** - al push di un tag `v*` compila i binari Tauri per Windows/Linux (`tauri-action`) e il DMG macOS (`INSTALL=0 ./build.sh`), caricandoli in una GitHub Release in bozza.
- **Sito**: deploy manuale via `deploy.sh` (pull + build, servito da Nginx sul server). GitHub Pages dismesso.
