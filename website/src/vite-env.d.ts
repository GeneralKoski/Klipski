/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_DL_MACOS?: string;
  readonly VITE_DL_WINDOWS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
