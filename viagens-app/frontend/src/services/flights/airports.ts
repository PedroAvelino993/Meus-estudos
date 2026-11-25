// Aeroportos (base pública OurAirports): sugestões por cidade, aeroporto ou código.
// Uma cidade com vários aeroportos vira uma opção «todos os aeroportos» (ex.: São Paulo = GRU, CGH, VCP).

import raw from "../../data/airports.json";
import { fold } from "../../utils/text";

type Row = [string, string, string, string, number, number, number, string];
const ROWS = raw as Row[];

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  large: boolean;
}

export interface PlaceOption {
  /** Códigos IATA (vários = cidade inteira). */
  codes: string[];
  label: string;
  detail: string;
  kind: "city" | "airport";
}

/** Nomes em português das cidades mais buscadas (a base usa o nome local/inglês). */
const PT_ALIASES: Record<string, string> = {
  lisbon: "Lisboa", london: "Londres", "new york": "Nova York", rome: "Roma", milan: "Milão", munich: "Munique", "mexico city": "Cidade do México",
  geneva: "Genebra", florence: "Florença", venice: "Veneza", naples: "Nápoles", seville: "Sevilha", cologne: "Colônia", vienna: "Viena",
  prague: "Praga", warsaw: "Varsóvia", athens: "Atenas", brussels: "Bruxelas", copenhagen: "Copenhague", stockholm: "Estocolmo", moscow: "Moscou",
  cairo: "Cairo", tokyo: "Tóquio", beijing: "Pequim", "cape town": "Cidade do Cabo", "new orleans": "Nova Orleans", edinburgh: "Edimburgo",
  barcelona: "Barcelona", porto: "Porto", "buenos aires": "Buenos Aires", santiago: "Santiago", montevideo: "Montevidéu", lima: "Lima",
};

const cityName = (c: string) => c.replace(/\s*\(.*\)\s*$/, "").replace(/\bDe\b/g, "de").trim();

export const AIRPORTS: Airport[] = ROWS.map((r) => ({ code: r[0], name: r[1], city: cityName(r[2]), country: r[3], lat: r[4], lon: r[5], large: r[6] === 1 }));
const byCode = new Map(AIRPORTS.map((a) => [a.code, a]));

const regionNames = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["pt-BR"], { type: "region" }) : null;
export const countryName = (cc: string) => regionNames?.of(cc) ?? cc;

export const airportByCode = (code: string) => byCode.get(code.toUpperCase());

function displayCity(a: Airport): string {
  return PT_ALIASES[fold(a.city)] ?? a.city;
}

const INDEX = AIRPORTS.map((a, i) => ({ a, hay: fold(`${a.code} ${a.city} ${displayCity(a)} ${a.name} ${ROWS[i][7]}`) }));

/** Sugestões para o campo de origem/destino. */
export function suggest(query: string, limit = 8): PlaceOption[] {
  const q = fold(query);
  if (q.length < 2) return [];
  const exact = q.length === 3 ? byCode.get(q.toUpperCase()) : undefined;
  const hits = INDEX.filter((x) => x.hay.includes(q)).map((x) => x.a);
  // Pontuação: código exato, depois cidade começando com o texto, aeroportos grandes primeiro
  hits.sort((a, b) => Number(b === exact) - Number(a === exact) || Number(fold(displayCity(b)).startsWith(q)) - Number(fold(displayCity(a)).startsWith(q)) || Number(b.large) - Number(a.large));
  const out: PlaceOption[] = [];
  const cities = new Map<string, Airport[]>();
  for (const a of hits) {
    const k = `${fold(a.city)}|${a.country}`;
    cities.set(k, [...(cities.get(k) ?? []), a]);
  }
  const seenCity = new Set<string>();
  for (const a of hits) {
    const k = `${fold(a.city)}|${a.country}`;
    const group = cities.get(k)!;
    if (group.length > 1 && !seenCity.has(k) && fold(displayCity(a)).includes(q)) {
      seenCity.add(k);
      // A base pode ter outros aeroportos da cidade que não bateram com o texto
      const all = AIRPORTS.filter((x) => fold(x.city) === fold(a.city) && x.country === a.country);
      out.push({ codes: all.map((x) => x.code).slice(0, 6), label: `${displayCity(a)} (todos os aeroportos)`, detail: `${all.map((x) => x.code).join(", ")} · ${countryName(a.country)}`, kind: "city" });
    }
    out.push({ codes: [a.code], label: `${displayCity(a)} (${a.code})`, detail: `${a.name} · ${countryName(a.country)}`, kind: "airport" });
    if (out.length >= limit) break;
  }
  return out.slice(0, limit);
}

/** Rótulo curto para códigos já escolhidos (ex.: na URL). */
export function labelFor(codes: string[]): string {
  if (!codes.length) return "";
  const first = byCode.get(codes[0]);
  if (!first) return codes.join(", ");
  return codes.length > 1 ? `${displayCity(first)} (todos os aeroportos)` : `${displayCity(first)} (${first.code})`;
}

export function cityOf(code: string): string {
  const a = byCode.get(code);
  return a ? displayCity(a) : code;
}

/** Aeroportos mais próximos de um ponto (para «buscar voos para cá»). */
export function nearestAirports(lat: number, lon: number, maxKm = 120): Airport[] {
  const d = (a: Airport) => {
    const dLat = ((a.lat - lat) * Math.PI) / 180;
    const dLon = ((a.lon - lon) * Math.PI) / 180;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((a.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(s));
  };
  return AIRPORTS.map((a) => ({ a, km: d(a) }))
    .filter((x) => x.km <= maxKm)
    .sort((x, y) => Number(y.a.large) - Number(x.a.large) || x.km - y.km)
    .slice(0, 3)
    .map((x) => x.a);
}
