/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Publicado em /Meus-estudos/gtaclips/ (GitHub Pages): caminhos relativos.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { outDir: "../gtaclips", emptyOutDir: true, target: "es2022", chunkSizeWarningLimit: 4000 },
  worker: { format: "es" },
  optimizeDeps: { exclude: ["@huggingface/transformers"] },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
