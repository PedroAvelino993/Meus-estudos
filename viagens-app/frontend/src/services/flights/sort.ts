// Ordenação e filtros dos resultados de voos (tudo calculado sobre os dados reais da busca).

import type { FlightOffer } from "../../types";

export type FlightSort = "price" | "duration" | "stops" | "value";

export const SORT_LABEL: Record<FlightSort, string> = { price: "Menor preço", duration: "Menor duração", stops: "Menos escalas", value: "Melhor custo-benefício" };

const totalDuration = (o: FlightOffer) => o.legs.reduce((a, l) => a + l.durationMin, 0);
const maxStops = (o: FlightOffer) => Math.max(...o.legs.map((l) => l.stops));

/**
 * Custo-benefício: preço relativo ao mais barato + tempo relativo ao mais rápido (peso 0,5)
 * + 0,1 por escala. Menor é melhor. Assim um voo um pouco mais caro e bem mais rápido ganha.
 */
export function valueScores(offers: FlightOffer[]): Map<string, number> {
  const minP = Math.min(...offers.map((o) => o.price.total)) || 1;
  const minD = Math.min(...offers.map(totalDuration)) || 1;
  return new Map(offers.map((o) => [o.id, o.price.total / minP + 0.5 * (totalDuration(o) / minD) + 0.1 * maxStops(o)]));
}

export function sortOffers(offers: FlightOffer[], by: FlightSort): FlightOffer[] {
  const list = [...offers];
  if (by === "price") return list.sort((a, b) => a.price.total - b.price.total);
  if (by === "duration") return list.sort((a, b) => totalDuration(a) - totalDuration(b) || a.price.total - b.price.total);
  if (by === "stops") return list.sort((a, b) => maxStops(a) - maxStops(b) || a.price.total - b.price.total);
  const s = valueScores(list);
  return list.sort((a, b) => s.get(a.id)! - s.get(b.id)!);
}

export interface FlightFilters {
  maxStops: number | null;
  airlines: string[];
  maxPrice: number | null;
  /** Faixa de horário de partida da ida (horas, 0–24). */
  departFrom: number;
  departTo: number;
  maxDurationH: number | null;
  /** Só ofertas com mala despachada informada como incluída. */
  checkedBag: boolean;
  /** Só preços confirmados com a companhia. */
  confirmedOnly: boolean;
}

export const NO_FILTERS: FlightFilters = { maxStops: null, airlines: [], maxPrice: null, departFrom: 0, departTo: 24, maxDurationH: null, checkedBag: false, confirmedOnly: false };

export function applyFilters(offers: FlightOffer[], f: FlightFilters): FlightOffer[] {
  return offers.filter((o) => {
    if (f.maxStops !== null && maxStops(o) > f.maxStops) return false;
    if (f.airlines.length && !o.airlines.some((a) => f.airlines.includes(a))) return false;
    if (f.maxPrice !== null && o.price.total > f.maxPrice) return false;
    const h = Number(o.legs[0].departure.slice(11, 13));
    if (h < f.departFrom || h >= f.departTo) return false;
    if (f.maxDurationH !== null && o.legs[0].durationMin > f.maxDurationH * 60) return false;
    if (f.checkedBag && !(o.baggage.checked && o.baggage.checked > 0)) return false;
    if (f.confirmedOnly && o.availability !== "confirmed") return false;
    return true;
  });
}

export const allAirlines = (offers: FlightOffer[]) => [...new Set(offers.flatMap((o) => o.airlines))].sort();
export { totalDuration, maxStops };
