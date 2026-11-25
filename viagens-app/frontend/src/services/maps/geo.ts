// Distâncias e links de mapa (OpenStreetMap e Google Maps).

export interface LatLon {
  lat: number;
  lon: number;
}

/** Distância em km (fórmula de haversine). */
export function km(a: LatLon, b: LatLon): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function distanceLabel(k: number): string {
  return k < 1 ? `${Math.round(k * 1000)} m` : `${k.toFixed(k < 10 ? 1 : 0).replace(".", ",")} km`;
}

export function googleMapsUrl(p: { lat?: number; lon?: number; name?: string }): string {
  if (p.lat !== undefined && p.lon !== undefined) return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name ?? "")}`;
}

/** Rota entre vários pontos no Google Maps (até 10). */
export function googleRouteUrl(points: LatLon[]): string {
  return `https://www.google.com/maps/dir/${points.slice(0, 10).map((p) => `${p.lat},${p.lon}`).join("/")}`;
}

export function osmUrl(p: LatLon): string {
  return `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=16/${p.lat}/${p.lon}`;
}

/** Mapa embutido do OpenStreetMap (sem chave). */
export function osmEmbedUrl(center: LatLon, marker?: LatLon, spanKm = 6): string {
  const d = spanKm / 111;
  const dLon = d / Math.max(0.2, Math.cos((center.lat * Math.PI) / 180));
  const bbox = [center.lon - dLon, center.lat - d, center.lon + dLon, center.lat + d].map((x) => x.toFixed(5)).join(",");
  const m = marker ?? center;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${m.lat},${m.lon}`;
}
