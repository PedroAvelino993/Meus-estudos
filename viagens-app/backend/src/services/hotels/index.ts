// Busca de hotéis nos fornecedores configurados.

import type { HotelSearchParams, HotelSearchResponse, ProviderResult } from "../../../../shared/types.ts";
import { TtlCache } from "../cache.ts";
import { serpApiHotels } from "./serpapi.ts";

const cache = new TtlCache<HotelSearchResponse>(60 * 60_000);

export async function searchHotels(p: HotelSearchParams): Promise<HotelSearchResponse> {
  const key = JSON.stringify(p);
  const hit = cache.get(key);
  if (hit) return hit;
  const providers: ProviderResult[] = [];
  if (!serpApiHotels.configured()) {
    providers.push({ provider: serpApiHotels.id, label: serpApiHotels.label, ok: false, count: 0, notConfigured: true });
    return { hotels: [], providers, fetchedAt: new Date().toISOString(), notes: [] };
  }
  try {
    const r = await serpApiHotels.search(p);
    providers.push({ provider: serpApiHotels.id, label: serpApiHotels.label, ok: true, count: r.hotels.length });
    const res: HotelSearchResponse = { ...r, providers };
    cache.set(key, res);
    return res;
  } catch (e) {
    providers.push({ provider: serpApiHotels.id, label: serpApiHotels.label, ok: false, count: 0, error: (e as Error).message });
    return { hotels: [], providers, fetchedAt: new Date().toISOString(), notes: [] };
  }
}
