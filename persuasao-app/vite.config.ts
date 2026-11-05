/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// O jogo é publicado em /Meus-estudos/persuasao/ (GitHub Pages); caminhos relativos.
export default defineConfig({
  base: "./",
  plugins: [react()],
  worker: { format: "es" },
  build: {
    outDir: "../persuasao",
    emptyOutDir: true,
    target: "es2020",
    chunkSizeWarningLimit: 7000,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
