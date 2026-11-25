// Configurações do app: endereço da API (backend) e preferências.
// As chaves das APIs ficam SÓ no backend; o app guarda apenas o endereço do servidor.

const API_KEY = "rota:api";

export const APP_NAME = "Rota";
export const CURRENCY = "BRL";
export const LOCALE = "pt-BR";

/** Endereço da API: o salvo em Ajustes, ou o definido na compilação (VITE_API_URL). */
export function apiUrl(): string {
  const saved = localStorage.getItem(API_KEY);
  const env = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
  return (saved ?? env).trim().replace(/\/+$/, "");
}

export function setApiUrl(url: string) {
  const u = url.trim().replace(/\/+$/, "");
  if (u) localStorage.setItem(API_KEY, u);
  else localStorage.removeItem(API_KEY);
}

/** Fontes públicas e gratuitas usadas direto do navegador (sem chave). */
export const PUBLIC_SOURCES = {
  nominatim: "https://nominatim.openstreetmap.org",
  overpass: "https://overpass-api.de/api/interpreter",
  openMeteo: "https://api.open-meteo.com/v1/forecast",
  wikipedia: (lang: string) => `https://${lang}.wikipedia.org`,
  wikivoyage: (lang: string) => `https://${lang}.wikivoyage.org`,
};
