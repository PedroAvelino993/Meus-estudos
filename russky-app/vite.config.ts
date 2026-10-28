/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// O app é publicado em /Meus-estudos/russky/ (GitHub Pages); caminhos relativos.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "../russky",
    emptyOutDir: true,
    target: "es2020",
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
