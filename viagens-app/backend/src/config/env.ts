// Configuração lida das variáveis de ambiente (arquivo .env opcional).
// As chaves ficam só no servidor: o frontend nunca recebe nenhuma delas.

import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envFile = resolve(process.cwd(), ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const str = (name: string, fallback = ""): string => (process.env[name] ?? fallback).trim();
const num = (name: string, fallback: number): number => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};
const bool = (name: string, fallback: boolean): boolean => {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  return v === "true" || v === "1";
};
const list = (name: string): string[] =>
  str(name)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const config = {
  port: num("PORT", 8787),
  allowedOrigins: list("ALLOWED_ORIGINS"),
  serpApiKey: str("SERPAPI_KEY"),
  /** Endereço da SerpApi (troque só para testes ou proxy). */
  serpApiBase: str("SERPAPI_BASE_URL", "https://serpapi.com/search"),
  duffelToken: str("DUFFEL_TOKEN"),
  duffelAllowTest: bool("DUFFEL_ALLOW_TEST", false),
  deals: {
    origin: str("DEALS_ORIGIN").toUpperCase(),
    destinations: list("DEALS_DESTINATIONS").map((d) => d.toUpperCase()),
    daysAhead: num("DEALS_DAYS_AHEAD", 30),
    refreshHours: num("DEALS_REFRESH_HOURS", 12),
  },
  databaseFile: str("DATABASE_FILE", "./data/viagens.db"),
  accountsEnabled: bool("ACCOUNTS_ENABLED", true),
  rateLimitPerMinute: num("RATE_LIMIT_PER_MINUTE", 20),
  /** Pasta com o frontend compilado (opcional: o servidor também entrega o site). */
  staticDir: str("STATIC_DIR"),
  version: "1.0.0",
};

export type Config = typeof config;
