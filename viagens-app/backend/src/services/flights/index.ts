// Busca de voos em todos os fornecedores configurados, em paralelo.
// Junta os resultados, remove repetidos (mesmos voos) e ordena pelo menor preço.

import type { FlightOffer, FlightSearchParams, FlightSearchResponse, ProviderResult } from "../../../../shared/types.ts";
import { TtlCache } from "../cache.ts";
import { duffelFlights } from "./duffel.ts";
import { serpApiFlights } from "./serpapi.ts";
import type { FlightProviderModule } from "./types.ts";

export const FLIGHT_PROVIDERS: FlightProviderModule[] = [serpApiFlights, duffelFlights];

const cache = new TtlCache<FlightSearchResponse>(30 * 60_000);

/** Chave que identifica o mesmo itinerário em fornecedores diferentes. */
export function itineraryKey(o: FlightOffer): string {
  return o.legs.map((l) => l.segments.map((s) => `${s.flightNumber.replace(/\s/g, "")}@${s.departure}`).join("+")).join("|");
}

export function mergeOffers(lists: FlightOffer[][]): FlightOffer[] {
  const best = new Map<string, FlightOffer>();
  for (const o of lists.flat()) {
    const k = itineraryKey(o);
    const cur = best.get(k);
    // Mesmo voo em duas fontes: fica o preço confirmado, depois o menor
    if (!cur || (o.availability === "confirmed" && cur.availability !== "confirmed") || (o.availability === cur.availability && o.price.total < cur.price.total)) best.set(k, o);
  }
  return [...best.values()].sort((a, b) => a.price.total - b.price.total);
}

export async function searchFlights(p: FlightSearchParams, providers = FLIGHT_PROVIDERS): Promise<FlightSearchResponse> {
  const key = JSON.stringify(p);
  const hit = cache.get(key);
  if (hit) return { ...hit, notes: [...hit.notes, "Resultado guardado de uma busca feita há menos de 30 min (veja o horário em cada preço)."] };

  const active = providers.filter((m) => m.configured());
  const statuses: ProviderResult[] = providers.filter((m) => !m.configured()).map((m) => ({ provider: m.id, label: m.label, ok: false, count: 0, notConfigured: true }));
  const settled = await Promise.allSettled(active.map((m) => m.search(p)));
  const lists: FlightOffer[][] = [];
  const notes: string[] = [];
  let insights: FlightSearchResponse["insights"];
  settled.forEach((r, i) => {
    const m = active[i];
    if (r.status === "fulfilled") {
      lists.push(r.value.offers);
      notes.push(...r.value.notes);
      insights ??= r.value.insights;
      statuses.push({ provider: m.id, label: m.label, ok: true, count: r.value.offers.length });
    } else {
      statuses.push({ provider: m.id, label: m.label, ok: false, count: 0, error: (r.reason as Error)?.message ?? String(r.reason) });
    }
  });
  const res: FlightSearchResponse = { offers: mergeOffers(lists), providers: statuses, fetchedAt: new Date().toISOString(), insights, notes };
  // Só guarda quando pelo menos um fornecedor respondeu
  if (statuses.some((s) => s.ok)) cache.set(key, res);
  return res;
}
