// Links para a mesma busca nos sites dos fornecedores (sem preço inventado: o preço é o do site).

import type { FlightSearchParams } from "../../types";
import { googleFlightsUrl } from "@shared/airlines.ts";

const CABIN_SKY: Record<FlightSearchParams["cabin"], string> = { economy: "economy", premium_economy: "premiumeconomy", business: "business", first: "first" };
const CABIN_KAYAK: Record<FlightSearchParams["cabin"], string> = { economy: "", premium_economy: "/premium", business: "/business", first: "/first" };

const yymmdd = (d: string) => d.slice(2).replace(/-/g, "");

export function providerLinks(p: FlightSearchParams): { label: string; url: string; note: string }[] {
  const o = p.origin[0];
  const d = p.destination[0];
  const pax = p.adults + p.children + p.infants;
  const sky = `https://www.skyscanner.com.br/transporte/passagens-aereas/${o.toLowerCase()}/${d.toLowerCase()}/${yymmdd(p.departDate)}/${p.returnDate ? `${yymmdd(p.returnDate)}/` : ""}?adultsv2=${p.adults}&cabinclass=${CABIN_SKY[p.cabin]}${p.children + p.infants ? `&childrenv2=${[...Array(p.children).fill(8), ...Array(p.infants).fill(1)].join("|")}` : ""}${p.directOnly ? "&preferdirects=true" : ""}`;
  const kayak = `https://www.kayak.com.br/flights/${o}-${d}/${p.departDate}${p.returnDate ? `/${p.returnDate}` : ""}${CABIN_KAYAK[p.cabin]}/${p.adults}adults${p.children ? `/children${"-11".repeat(p.children)}` : ""}?sort=price_a${p.directOnly ? "&fs=stops=0" : ""}`;
  return [
    { label: "Google Flights", url: googleFlightsUrl({ origin: o, destination: d, departDate: p.departDate, returnDate: p.returnDate, adults: p.adults }), note: "compara companhias e agências" },
    { label: "Skyscanner", url: sky, note: `${pax} passageiro(s)` },
    { label: "Kayak", url: kayak, note: "ordenado pelo menor preço" },
  ];
}
