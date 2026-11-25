// Comparação lado a lado: diferenças de preço, duração, escalas e condições.

import type { FlightOffer, ManualOption } from "../../types";
import { cityOf } from "./airports";

export interface CompareItem {
  id: string;
  label: string;
  route: string;
  price: number;
  currency: string;
  durationMin: number;
  stops: number;
  baggage: string;
  conditions: string;
  source: string;
  /** Preço de uma busca real ou digitado pelo usuário. */
  origin: "busca" | "manual";
  fetchedAt?: string;
}

export function fromOffer(o: FlightOffer, baggage: string): CompareItem {
  const leg = o.legs[0];
  return {
    id: o.id,
    label: o.airlines.join(" + "),
    route: `${cityOf(leg.from.code)} (${leg.from.code}) → ${cityOf(leg.to.code)} (${leg.to.code})${o.legs.length > 1 || o.tripType === "round_trip" ? " · ida e volta" : ""}`,
    price: o.price.total,
    currency: o.price.currency,
    durationMin: leg.durationMin,
    stops: leg.stops,
    baggage,
    conditions: o.fareRules.join(" · ") || "—",
    source: o.providerLabel,
    origin: "busca",
    fetchedAt: o.fetchedAt,
  };
}

export function fromManual(m: ManualOption): CompareItem {
  return { id: m.id, label: m.label, route: m.route, price: m.price, currency: "BRL", durationMin: m.durationMin, stops: m.stops, baggage: m.baggage || "—", conditions: m.notes || "—", source: "Informado por você", origin: "manual" };
}

export interface CompareSummary {
  cheapestId: string;
  fastestId: string;
  fewestStopsIds: string[];
  /** Quanto custa cada hora economizada ao escolher o mais rápido em vez do mais barato. */
  pricePerHourSaved: number | null;
  insight: string;
}

export function summarize(items: CompareItem[], fmtMoney: (n: number) => string, fmtDur: (m: number) => string): CompareSummary | null {
  if (items.length < 2) return null;
  const cheapest = items.reduce((a, b) => (b.price < a.price ? b : a));
  const fastest = items.reduce((a, b) => (b.durationMin < a.durationMin ? b : a));
  const minStops = Math.min(...items.map((i) => i.stops));
  const saved = cheapest.durationMin - fastest.durationMin;
  const extra = fastest.price - cheapest.price;
  let pricePerHourSaved: number | null = null;
  let insight: string;
  if (cheapest.id === fastest.id) insight = `«${cheapest.label}» é ao mesmo tempo a opção mais barata e a mais rápida.`;
  else if (saved > 0 && extra > 0) {
    pricePerHourSaved = extra / (saved / 60);
    insight = `A opção mais rápida («${fastest.label}») custa ${fmtMoney(extra)} a mais e economiza ${fmtDur(saved)} — cerca de ${fmtMoney(pricePerHourSaved)} por hora economizada.`;
  } else insight = `A mais barata é «${cheapest.label}»; a mais rápida é «${fastest.label}».`;
  return { cheapestId: cheapest.id, fastestId: fastest.id, fewestStopsIds: items.filter((i) => i.stops === minStops).map((i) => i.id), pricePerHourSaved, insight };
}
