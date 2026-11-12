/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// O jogo é publicado em /Meus-estudos/colosseum/ (GitHub Pages); caminhos relativos.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { outDir: "../colosseum", emptyOutDir: true, target: "es2020", chunkSizeWarningLimit: 1500 },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
