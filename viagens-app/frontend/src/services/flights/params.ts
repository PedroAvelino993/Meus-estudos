// Parâmetros da busca de voos ⇄ endereço da página (para compartilhar e voltar).

import type { CabinClass, FlightSearchParams } from "../../types";
import { CURRENCY } from "../../config";
import { addDays, isValidDate, today } from "../../utils/dates";

export const CABIN_LABEL: Record<CabinClass, string> = { economy: "Econômica", premium_economy: "Premium economy", business: "Executiva", first: "Primeira classe" };

export function defaultFlightParams(): FlightSearchParams {
  const d = addDays(today(), 30);
  return { origin: [], destination: [], departDate: d, returnDate: addDays(d, 7), adults: 1, children: 0, infants: 0, cabin: "economy", directOnly: false, currency: CURRENCY };
}

export function paramsToQuery(p: FlightSearchParams): Record<string, string | number | boolean | undefined> {
  return { de: p.origin.join(","), para: p.destination.join(","), ida: p.departDate, volta: p.returnDate, adultos: p.adults, criancas: p.children || undefined, bebes: p.infants || undefined, classe: p.cabin === "economy" ? undefined : p.cabin, direto: p.directOnly || undefined };
}

export function queryToParams(q: URLSearchParams): FlightSearchParams | null {
  const origin = (q.get("de") ?? "").split(",").filter((c) => /^[A-Z]{3}$/.test(c));
  const destination = (q.get("para") ?? "").split(",").filter((c) => /^[A-Z]{3}$/.test(c));
  const departDate = q.get("ida") ?? "";
  if (!origin.length || !destination.length || !isValidDate(departDate)) return null;
  const volta = q.get("volta");
  const cabin = (["economy", "premium_economy", "business", "first"] as CabinClass[]).find((c) => c === q.get("classe")) ?? "economy";
  const n = (k: string, def: number, max: number) => Math.max(0, Math.min(max, Number(q.get(k) ?? def) || 0));
  return { origin, destination, departDate, returnDate: isValidDate(volta) ? volta : undefined, adults: Math.max(1, n("adultos", 1, 9)), children: n("criancas", 0, 8), infants: n("bebes", 0, 4), cabin, directOnly: q.get("direto") === "true", currency: CURRENCY };
}

export function passengersLabel(p: Pick<FlightSearchParams, "adults" | "children" | "infants">): string {
  const parts = [`${p.adults} adulto${p.adults > 1 ? "s" : ""}`];
  if (p.children) parts.push(`${p.children} criança${p.children > 1 ? "s" : ""}`);
  if (p.infants) parts.push(`${p.infants} bebê${p.infants > 1 ? "s" : ""}`);
  return parts.join(", ");
}

/** Busca incompleta vinda de outro lugar do app (ex.: só o destino): preenche o que der. */
export function partialParams(q: URLSearchParams): FlightSearchParams {
  const d = defaultFlightParams();
  const codes = (k: string) => (q.get(k) ?? "").split(",").filter((c) => /^[A-Z]{3}$/.test(c));
  const ida = q.get("ida");
  const volta = q.get("volta");
  return { ...d, origin: codes("de"), destination: codes("para"), departDate: isValidDate(ida) && ida >= today() ? ida : d.departDate, returnDate: isValidDate(volta) ? volta : d.returnDate };
}
