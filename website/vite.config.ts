import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

declare const process: { env: Record<string, string | undefined> };

const version = process.env.npm_package_version ?? "1.0.0";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "html-app-version",
      transformIndexHtml: (html) => html.split("__APP_VERSION__").join(version),
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
