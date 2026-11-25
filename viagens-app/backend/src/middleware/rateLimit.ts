// Limite de buscas por IP (janela de 1 minuto) para proteger as cotas pagas das APIs.

import { HttpError } from "../http/router.ts";

export function createRateLimiter(perMinute: number) {
  const hits = new Map<string, number[]>();
  return function check(ip: string) {
    const now = Date.now();
    const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
    if (list.length >= perMinute) throw new HttpError(429, "rate_limited", "Muitas buscas em pouco tempo. Espere um minuto e tente de novo.");
    list.push(now);
    hits.set(ip, list);
    if (hits.size > 10_000) hits.clear();
  };
}
