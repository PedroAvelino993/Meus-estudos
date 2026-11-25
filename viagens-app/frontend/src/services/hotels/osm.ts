// Hospedagens cadastradas no OpenStreetMap perto do destino (sem preço: o mapa não tem preços).
// Usado quando a busca com preços não está configurada, para o usuário já ver opções reais.

import { PUBLIC_SOURCES } from "../../config";
import { km, type LatLon } from "../maps/geo";

export interface OsmHotel extends LatLon {
  id: string;
  name: string;
  kind: string;
  stars?: number;
  website?: string;
  address?: string;
  distanceKm: number;
}

const KIND: Record<string, string> = { hotel: "Hotel", hostel: "Hostel", guest_house: "Pousada", apartment: "Apartamento", motel: "Motel" };

export async function osmHotels(center: LatLon, radiusKm: number, signal?: AbortSignal): Promise<OsmHotel[]> {
  const q = `[out:json][timeout:25];nwr["tourism"~"^(hotel|hostel|guest_house|apartment)$"]["name"](around:${Math.round(radiusKm * 1000)},${center.lat},${center.lon});out tags center 60;`;
  const res = await fetch(PUBLIC_SOURCES.overpass, { method: "POST", body: new URLSearchParams({ data: q }), signal });
  if (!res.ok) throw new Error("O OpenStreetMap não respondeu agora.");
  const data = (await res.json()) as { elements: { type: string; id: number; lat?: number; lon?: number; center?: LatLon; tags?: Record<string, string> }[] };
  return data.elements
    .map((e): OsmHotel | null => {
      const t = e.tags ?? {};
      const lat = e.lat ?? e.center?.lat;
      const lon = e.lon ?? e.center?.lon;
      if (!t.name || lat === undefined || lon === undefined) return null;
      const stars = Number(t.stars);
      return { id: `${e.type}/${e.id}`, name: t.name, kind: KIND[t.tourism] ?? "Hospedagem", stars: stars >= 1 && stars <= 5 ? stars : undefined, website: t.website ?? t["contact:website"], address: [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", ") || undefined, lat, lon, distanceKm: km(center, { lat, lon }) };
    })
    .filter((h): h is OsmHotel => h !== null)
    .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0) || a.distanceKm - b.distanceKm);
}
