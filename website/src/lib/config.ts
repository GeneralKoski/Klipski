// Configurazione centrale del sito. I link di download sono placeholder:
// sostituiscili con gli URL reali (GitHub Releases, CDN, ecc.) o passali
// via variabili d'ambiente VITE_DL_* in fase di build.
const env = import.meta.env;

export const SITE = {
  name: "Klipski",
  tagline: "Il gestore di appunti che mancava al tuo computer",
  description:
    "Klipski è un clipboard manager leggero e nativo: cronologia di testi e immagini, snippet a cartelle, hotkey globale e incolla automatico. Gratis e open source per macOS, Windows e Linux.",
  url: "https://klipski.app",
  repo: "https://github.com/GeneralKoski/Klipski",
  version: env.VITE_APP_VERSION ?? "1.0.0",
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
    url: env.VITE_DL_MACOS || "https://github.com/GeneralKoski/Klipski/releases/latest/download/Klipski-macos.dmg",
    requirement: "macOS 14 (Sonoma) o superiore",
    available: true,
  },
  windows: {
    id: "windows",
    label: "Windows",
    format: ".msi",
    url: env.VITE_DL_WINDOWS || "#download-windows",
    requirement: "Windows 10 / 11 (64-bit)",
    available: false,
  },
  linux: {
    id: "linux",
    label: "Linux",
    format: ".AppImage",
    url: env.VITE_DL_LINUX || "#download-linux",
    requirement: "AppImage · distribuzioni glibc recenti",
    available: false,
  },
};

export const OS_ORDER: OSId[] = ["macos", "windows", "linux"];
