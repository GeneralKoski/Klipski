// Configurazione centrale del sito. I link di download sono placeholder:
// sostituiscili con gli URL reali (GitHub Releases, CDN, ecc.) o passali
// via variabili d'ambiente VITE_DL_* in fase di build.
const env = import.meta.env;

// Iniettata da Vite (define) a partire da npm_package_version (package.json).
declare const __APP_VERSION__: string;
const VERSION = __APP_VERSION__;

// URL di un asset della release corrispondente alla versione del sito.
const ghAsset = (file: string) =>
  `https://github.com/GeneralKoski/Klipski/releases/download/v${VERSION}/${file}`;

export const SITE = {
  name: "Klipski",
  tagline: "Il gestore di appunti che mancava al tuo computer",
  description:
    "Klipski è un clipboard manager leggero e nativo: cronologia di testi e immagini, snippet a cartelle, hotkey globale e incolla automatico. Gratis e open source per macOS, Windows e Linux.",
  url: "https://klipski.martin-trajkovski.it",
  repo: "https://github.com/GeneralKoski/Klipski",
  version: VERSION,
  author: "Klipski",
};

export type OSId = "macos" | "windows" | "linux";

export interface DownloadTarget {
  id: OSId;
  label: string;
  // Estensione/formato mostrato all'utente.
  format: string;
  // URL del file da scaricare. Placeholder finché i binari non sono pronti.
  url: string;
  // Requisiti minimi mostrati sotto al bottone.
  requirement: string;
  // false = build non ancora disponibile ("Coming soon").
  available: boolean;
}

export const DOWNLOADS: Record<OSId, DownloadTarget> = {
  macos: {
    id: "macos",
    label: "macOS",
    format: ".dmg",
    url: env.VITE_DL_MACOS || ghAsset(`Klipski_${VERSION}.dmg`),
    requirement: "macOS 14 (Sonoma) o superiore",
    available: true,
  },
  windows: {
    id: "windows",
    label: "Windows",
    format: ".msi",
    url: env.VITE_DL_WINDOWS || ghAsset(`Klipski_${VERSION}_x64_en-US.msi`),
    requirement: "Windows 10 / 11 (64-bit)",
    available: true,
  },
  linux: {
    id: "linux",
    label: "Linux",
    format: ".AppImage",
    url: env.VITE_DL_LINUX || ghAsset(`Klipski_${VERSION}_amd64.AppImage`),
    requirement: "AppImage · distribuzioni glibc recenti",
    available: true,
  },
};

export const OS_ORDER: OSId[] = ["macos", "windows", "linux"];
