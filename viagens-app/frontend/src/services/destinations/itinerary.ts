// Roteiro dia a dia: agrupa os lugares por proximidade (k-means) para evitar deslocamentos,
// ordena cada dia pelo caminho mais curto e sugere um restaurante perto de cada grupo.

import { km, type LatLon } from "../maps/geo";
import type { Poi } from "./pois";

export interface ItineraryDay {
  day: number;
  items: { poi: Poi; period: "Manhã" | "Tarde"; legKm: number | null }[];
  lunch?: Poi;
  totalKm: number;
  center: LatLon;
}

function kmeans(points: Poi[], k: number): number[] {
  // Início determinístico: o ponto mais famoso e depois sempre o mais distante dos já escolhidos
  const centers: LatLon[] = [points[0]];
  while (centers.length < k) {
    let best = points[0];
    let bestD = -1;
    for (const p of points) {
      const d = Math.min(...centers.map((c) => km(c, p)));
      if (d > bestD) {
        bestD = d;
        best = p;
      }
    }
    centers.push(best);
  }
  let assign = points.map(() => 0);
  for (let iter = 0; iter < 25; iter++) {
    const next = points.map((p) => centers.reduce((bi, c, i) => (km(p, c) < km(p, centers[bi]) ? i : bi), 0));
    for (let i = 0; i < k; i++) {
      const members = points.filter((_, j) => next[j] === i);
      if (members.length) centers[i] = { lat: members.reduce((a, m) => a + m.lat, 0) / members.length, lon: members.reduce((a, m) => a + m.lon, 0) / members.length };
    }
    if (next.every((v, i) => v === assign[i])) break;
    assign = next;
  }
  return assign;
}

/** Ordem do vizinho mais próximo começando pelo ponto mais perto de `start`. */
export function nearestOrder(points: Poi[], start: LatLon): Poi[] {
  const left = [...points];
  const out: Poi[] = [];
  let cur = start;
  while (left.length) {
    let bi = 0;
    for (let i = 1; i < left.length; i++) if (km(cur, left[i]) < km(cur, left[bi])) bi = i;
    cur = left[bi];
    out.push(left.splice(bi, 1)[0]);
  }
  return out;
}

export function buildItinerary(places: Poi[], restaurants: Poi[], days: number, start: LatLon, perDay = 3): ItineraryDay[] {
  const n = Math.max(1, Math.min(14, days));
  const chosen = places.slice(0, Math.min(places.length, n * perDay));
  if (!chosen.length) return [];
  const k = Math.min(n, chosen.length);
  const assign = kmeans(chosen, k);
  let groups = Array.from({ length: k }, (_, i) => chosen.filter((_, j) => assign[j] === i));
  // Equilibra: nenhum dia com mais que a média arredondada para cima; o lugar que sobra vai para o
  // dia com espaço cujo centro fica mais perto dele (assim a proximidade se mantém)
  const cap = Math.max(1, Math.ceil(chosen.length / k));
  const centerOf = (g: Poi[]): LatLon => (g.length ? { lat: g.reduce((a, p) => a + p.lat, 0) / g.length, lon: g.reduce((a, p) => a + p.lon, 0) / g.length } : chosen[0]);
  for (let guard = 0; guard < chosen.length * 2; guard++) {
    const big = groups.find((g) => g.length > cap);
    if (!big) break;
    const c = centerOf(big);
    // Sai o lugar mais distante do centro do próprio dia
    big.sort((x, y) => km(c, x) - km(c, y));
    const extra = big.pop()!;
    const target = groups.filter((g) => g !== big && g.length < cap).sort((x, y) => km(extra, centerOf(x)) - km(extra, centerOf(y)))[0];
    if (!target) {
      big.push(extra);
      break;
    }
    target.push(extra);
  }
  groups = groups.filter((g) => g.length);
  // Dias em ordem de distância do ponto de partida (hotel ou centro)
  const center = (g: Poi[]): LatLon => ({ lat: g.reduce((a, p) => a + p.lat, 0) / g.length, lon: g.reduce((a, p) => a + p.lon, 0) / g.length });
  groups.sort((a, b) => km(start, center(a)) - km(start, center(b)));
  const usedLunch = new Set<string>();
  return groups.map((g, i) => {
    const ordered = nearestOrder(g, start);
    const items = ordered.map((poi, j) => ({ poi, period: (j < Math.ceil(ordered.length / 2) ? "Manhã" : "Tarde") as "Manhã" | "Tarde", legKm: j === 0 ? null : km(ordered[j - 1], poi) }));
    const c = center(g);
    const lunch = restaurants.filter((r) => !usedLunch.has(r.id)).sort((a, b) => km(c, a) - km(c, b))[0];
    if (lunch) usedLunch.add(lunch.id);
    return { day: i + 1, items, lunch, totalKm: items.reduce((a, it) => a + (it.legKm ?? 0), 0), center: c };
  });
}
