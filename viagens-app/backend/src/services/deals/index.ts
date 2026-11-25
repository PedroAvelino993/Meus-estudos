// Ofertas da página inicial: menor preço real encontrado (Google Flights via SerpApi) para as
// rotas configuradas em DEALS_ORIGIN / DEALS_DESTINATIONS. Atualiza no máximo a cada
// DEALS_REFRESH_HOURS para não gastar a cota; cada preço mostra quando foi encontrado.

import type { Deal, DealsResponse, FlightSearchParams } from "../../../../shared/types.ts";
import { config } from "../../config/env.ts";
import { addDays, todayUtc } from "../../utils/time.ts";
import { serpApiFlights } from "../flights/serpapi.ts";

let state: { deals: Deal[]; fetchedAt: string; at: number } | null = null;
let running: Promise<void> | null = null;

export function dealsConfigured(): boolean {
  return !!(config.serpApiKey && config.deals.origin && config.deals.destinations.length);
}

async function refresh() {
  const date = addDays(todayUtc(), config.deals.daysAhead);
  const deals: Deal[] = [];
  for (const dest of config.deals.destinations.slice(0, 8)) {
    const p: FlightSearchParams = { origin: [config.deals.origin], destination: [dest], departDate: date, adults: 1, children: 0, infants: 0, cabin: "economy", directOnly: false, currency: "BRL" };
    try {
      const r = await serpApiFlights.search(p);
      const best = r.offers.sort((a, b) => a.price.total - b.price.total)[0];
      if (best) deals.push({ origin: config.deals.origin, destination: dest, departDate: date, price: best.price.total, currency: best.price.currency, airline: best.airlines.join(", "), stops: best.legs[0].stops, durationMin: best.legs[0].durationMin, fetchedAt: best.fetchedAt, provider: best.providerLabel });
    } catch {
      /* rota sem resultado agora: fica de fora */
    }
  }
  state = { deals: deals.sort((a, b) => a.price - b.price), fetchedAt: new Date().toISOString(), at: Date.now() };
}

export async function getDeals(): Promise<DealsResponse> {
  if (!dealsConfigured()) return { deals: [], configured: false, notes: ["Ofertas não configuradas no servidor (DEALS_ORIGIN e DEALS_DESTINATIONS)."] };
  const stale = !state || Date.now() - state.at > config.deals.refreshHours * 3_600_000;
  if (stale) {
    running ??= refresh().finally(() => (running = null));
    await running;
  }
  return { deals: state!.deals, configured: true, fetchedAt: state!.fetchedAt, notes: [`Menor preço só de ida para ${addDays(todayUtc(), config.deals.daysAhead)}, encontrado no Google Flights. Pode ter mudado desde então.`] };
}
