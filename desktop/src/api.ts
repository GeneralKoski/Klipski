import { invoke } from "@tauri-apps/api/core";

export interface HistoryItem {
  id: string;
  kind: "text" | "image";
  text?: string | null;
  imagePath?: string | null;
  createdAt: number;
}

export interface Snippet {
  id: string;
  title: string;
  content: string;
}

export interface SnippetFolder {
  id: string;
  name: string;
  snippets: Snippet[];
}

export interface Settings {
  textLimit: number;
  imageLimit: number;
  hotkey: string;
  autoPaste: boolean;
  launchAtLogin: boolean;
}

export const api = {
  getHistory: () => invoke<HistoryItem[]>("get_history"),
  getSnippets: () => invoke<SnippetFolder[]>("get_snippets"),
  getSettings: () => invoke<Settings>("get_settings"),
  saveSettings: (settings: Settings) => invoke<void>("save_settings", { settings }),
  saveSnippets: (folders: SnippetFolder[]) => invoke<void>("save_snippets", { folders }),
  clearHistory: () => invoke<void>("clear_history"),
  deleteItem: (id: string) => invoke<void>("delete_item", { id }),
  applyItem: (id: string) => invoke<void>("apply_item", { id }),
  applySnippet: (content: string) => invoke<void>("apply_snippet", { content }),
  importClipy: (path: string) => invoke<number>("import_clipy", { path }),
  imageDataUrl: (path: string) => invoke<string | null>("image_data_url", { path }),
  hideHistory: () => invoke<void>("hide_history"),
  showSettings: () => invoke<void>("show_settings"),
};

export function uid(): string {
  return crypto.randomUUID();
}
