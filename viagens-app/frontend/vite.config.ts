/// <reference types="vitest" />
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";

// O site compilado vai para /viagens na raiz do repositório (GitHub Pages).
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: { alias: { "@shared": fileURLToPath(new URL("../shared", import.meta.url)) } },
  server: { port: 5173, fs: { allow: [".."] } },
  build: { outDir: "../../viagens", emptyOutDir: true, chunkSizeWarningLimit: 900 },
  test: { environment: "node" },
});
