/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_DL_MACOS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
