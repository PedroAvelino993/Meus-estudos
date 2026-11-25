// Lugares do destino (OpenStreetMap via Overpass, gratuito): pontos turísticos, museus,
// parques, praias, restaurantes, vida noturna, programas para a família e cultura.
// Os dados são reais e colaborativos; preço só aparece quando o mapa informa (ex.: entrada grátis).

import { PUBLIC_SOURCES } from "../../config";
import { km, type LatLon } from "../maps/geo";

export type PoiCategory = "atracoes" | "museus" | "parques" | "praias" | "restaurantes" | "noite" | "familia" | "cultura";

export const CATEGORY_LABEL: Record<PoiCategory, string> = {
  atracoes: "Pontos turísticos",
  museus: "Museus",
  parques: "Parques",
  praias: "Praias",
  restaurantes: "Restaurantes",
  noite: "Vida noturna",
  familia: "Para a família",
  cultura: "Experiências e cultura",
};

/** Seletores do Overpass por categoria e quantos trazer de cada. */
const QUERIES: Record<PoiCategory, { sel: string[]; limit: number }> = {
  atracoes: { sel: ['nwr["tourism"~"^(attraction|viewpoint)$"]["name"]', 'nwr["historic"~"^(monument|castle|fort|ruins|memorial)$"]["name"]["wikidata"]'], limit: 80 },
  museus: { sel: ['nwr["tourism"~"^(museum|gallery)$"]["name"]'], limit: 40 },
  parques: { sel: ['nwr["leisure"~"^(park|garden|nature_reserve)$"]["name"]'], limit: 40 },
  praias: { sel: ['nwr["natural"="beach"]["name"]'], limit: 30 },
  restaurantes: { sel: ['nwr["amenity"="restaurant"]["name"]'], limit: 80 },
  noite: { sel: ['nwr["amenity"~"^(bar|pub|nightclub)$"]["name"]'], limit: 40 },
  familia: { sel: ['nwr["tourism"~"^(zoo|theme_park|aquarium)$"]["name"]', 'nwr["leisure"="water_park"]["name"]'], limit: 25 },
  cultura: { sel: ['nwr["amenity"~"^(theatre|arts_centre|marketplace)$"]["name"]'], limit: 30 },
};

export interface Poi extends LatLon {
  id: string;
  name: string;
  category: PoiCategory;
  kind: string;
  /** Tem página na Wikipédia/Wikidata: costuma ser mais conhecido. */
  notable: boolean;
  website?: string;
  wikipedia?: string;
  openingHours?: string;
  fee?: "gratuita" | "paga";
  cuisine?: string;
  address?: string;
  phone?: string;
  distanceKm: number;
}

interface OverpassEl {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const KIND: Record<string, string> = {
  attraction: "Atração", viewpoint: "Mirante", monument: "Monumento", castle: "Castelo", fort: "Forte", ruins: "Ruínas", memorial: "Memorial",
  museum: "Museu", gallery: "Galeria", park: "Parque", garden: "Jardim", nature_reserve: "Reserva natural", beach: "Praia", restaurant: "Restaurante",
  bar: "Bar", pub: "Pub", nightclub: "Balada", zoo: "Zoológico", theme_park: "Parque temático", aquarium: "Aquário", water_park: "Parque aquático",
  theatre: "Teatro", arts_centre: "Centro cultural", marketplace: "Mercado",
};

export function buildQuery(center: LatLon, radiusM: number, cats: PoiCategory[]): string {
  const around = `(around:${Math.round(radiusM)},${center.lat},${center.lon})`;
  const parts = cats.map((c, i) => `(${QUERIES[c].sel.map((s) => `${s}${around};`).join("")})->.c${i};.c${i} out tags center ${QUERIES[c].limit};`);
  return `[out:json][timeout:25];${parts.join("")}`;
}

export function toPoi(el: OverpassEl, category: PoiCategory, center: LatLon): Poi | null {
  const t = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (!t.name || lat === undefined || lon === undefined) return null;
  const kindKey = t.tourism ?? t.historic ?? t.leisure ?? t.natural ?? t.amenity ?? "";
  const addr = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", ");
  return {
    id: `${el.type}/${el.id}`,
    name: t["name:pt"] ?? t.name,
    category,
    kind: KIND[kindKey] ?? "Lugar",
    notable: !!(t.wikidata || t.wikipedia),
    website: t.website ?? t["contact:website"],
    wikipedia: t.wikipedia,
    openingHours: t.opening_hours,
    fee: t.fee === "no" ? "gratuita" : t.fee === "yes" ? "paga" : undefined,
    cuisine: t.cuisine?.split(";").slice(0, 3).join(", ").replace(/_/g, " "),
    address: addr || undefined,
    phone: t.phone ?? t["contact:phone"],
    lat,
    lon,
    distanceKm: km(center, { lat, lon }),
  };
}

/** Ordena: conhecidos primeiro, depois os mais completos e mais perto do centro. */
export function rankPois(list: Poi[]): Poi[] {
  const score = (p: Poi) => (p.notable ? 10 : 0) + (p.website ? 2 : 0) + (p.openingHours ? 1 : 0) - p.distanceKm * 0.3;
  const seen = new Set<string>();
  return [...list].sort((a, b) => score(b) - score(a)).filter((p) => {
    const k = p.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export async function fetchPois(center: LatLon, radiusKm: number, cats: PoiCategory[] = Object.keys(QUERIES) as PoiCategory[], signal?: AbortSignal): Promise<Record<PoiCategory, Poi[]>> {
  const res = await fetch(PUBLIC_SOURCES.overpass, { method: "POST", body: new URLSearchParams({ data: buildQuery(center, radiusKm * 1000, cats) }), signal });
  if (!res.ok) throw new Error(res.status === 429 || res.status === 504 ? "O OpenStreetMap está sobrecarregado agora. Tente de novo em alguns segundos." : `O OpenStreetMap não respondeu (${res.status}).`);
  const data = (await res.json()) as { elements: OverpassEl[] };
  const out = Object.fromEntries(cats.map((c) => [c, [] as Poi[]])) as Record<PoiCategory, Poi[]>;
  // As saídas vêm na ordem das categorias; cada elemento é classificado pelas etiquetas
  for (const el of data.elements) {
    const c = categorize(el.tags ?? {});
    if (!c || !cats.includes(c)) continue;
    const p = toPoi(el, c, center);
    if (p) out[c].push(p);
  }
  for (const c of cats) out[c] = rankPois(out[c]);
  return out;
}

export function categorize(t: Record<string, string>): PoiCategory | null {
  if (t.tourism === "museum" || t.tourism === "gallery") return "museus";
  if (["zoo", "theme_park", "aquarium"].includes(t.tourism) || t.leisure === "water_park") return "familia";
  if (t.natural === "beach") return "praias";
  if (["park", "garden", "nature_reserve"].includes(t.leisure)) return "parques";
  if (t.amenity === "restaurant") return "restaurantes";
  if (["bar", "pub", "nightclub"].includes(t.amenity)) return "noite";
  if (["theatre", "arts_centre", "marketplace"].includes(t.amenity)) return "cultura";
  if (t.tourism === "attraction" || t.tourism === "viewpoint" || t.historic) return "atracoes";
  return null;
}

/** Raio de busca a partir do tamanho da cidade (limites do Nominatim). */
export function radiusFor(bbox?: [number, number, number, number]): number {
  if (!bbox) return 5;
  const diag = km({ lat: bbox[0], lon: bbox[2] }, { lat: bbox[1], lon: bbox[3] });
  return Math.max(2, Math.min(12, diag / 3));
}
