// Localização de destinos (Nominatim / OpenStreetMap, gratuito, sem chave).
// Política de uso do Nominatim: no máximo 1 busca por segundo — o app só busca ao confirmar.

import { PUBLIC_SOURCES } from "../../config";

export interface Place {
  name: string;
  displayName: string;
  lat: number;
  lon: number;
  country?: string;
  countryCode?: string;
  /** Limites (sul, norte, oeste, leste). */
  bbox?: [number, number, number, number];
  type: string;
}

interface NominatimItem {
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: [string, string, string, string];
  addresstype?: string;
  address?: { country?: string; country_code?: string; city?: string; town?: string; state?: string };
}

let last = 0;
async function politeDelay() {
  const wait = 1100 - (Date.now() - last);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  last = Date.now();
}

export async function geocode(query: string, signal?: AbortSignal): Promise<Place[]> {
  await politeDelay();
  const url = `${PUBLIC_SOURCES.nominatim}/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&limit=5&accept-language=pt-BR`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`O serviço de mapas não respondeu (${res.status}).`);
  const items = (await res.json()) as NominatimItem[];
  return items.map((i) => ({
    name: i.name || i.display_name.split(",")[0],
    displayName: i.display_name,
    lat: Number(i.lat),
    lon: Number(i.lon),
    country: i.address?.country,
    countryCode: i.address?.country_code?.toUpperCase(),
    bbox: i.boundingbox?.map(Number) as Place["bbox"],
    type: i.addresstype ?? "",
  }));
}
