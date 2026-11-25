// Duffel (https://duffel.com) — ofertas ao vivo das companhias aéreas (NDC/GDS).
// Formato conferido nos tipos do SDK oficial @duffel/api (v2).
// Só tokens do modo «live» devolvem preços reais: ofertas de teste são descartadas
// (ou aparecem marcadas como teste, se DUFFEL_ALLOW_TEST=true).

import type { FlightLeg, FlightOffer, FlightSearchParams } from "../../../../shared/types.ts";
import { airlineByCode, googleFlightsUrl } from "../../../../shared/airlines.ts";
import { config } from "../../config/env.ts";
import { fetchJson } from "../../utils/http.ts";
import { isoDurationToMinutes, localIso, minutesBetween } from "../../utils/time.ts";
import type { FlightProviderModule } from "./types.ts";

const ENDPOINT = "https://api.duffel.com/air/offer_requests?return_offers=true&supplier_timeout=20000";

interface DuffelAirline {
  name: string;
  iata_code: string | null;
  logo_symbol_url?: string | null;
}
interface DuffelAirport {
  iata_code: string | null;
  name: string;
  city_name?: string;
}
interface DuffelCondition {
  allowed: boolean;
  penalty_amount?: string | null;
  penalty_currency?: string | null;
}
export interface DuffelOffer {
  id: string;
  total_amount: string;
  total_currency: string;
  expires_at: string;
  live_mode: boolean;
  owner: DuffelAirline;
  total_emissions_kg?: string | null;
  conditions?: { refund_before_departure?: DuffelCondition | null; change_before_departure?: DuffelCondition | null };
  passengers: { id: string; type?: string; age?: number }[];
  slices: {
    origin: DuffelAirport;
    destination: DuffelAirport;
    duration: string | null;
    fare_brand_name?: string | null;
    segments: {
      departing_at: string;
      arriving_at: string;
      origin: DuffelAirport;
      destination: DuffelAirport;
      duration: string | null;
      marketing_carrier: DuffelAirline;
      marketing_carrier_flight_number: string;
      operating_carrier: DuffelAirline;
      aircraft?: { name?: string } | null;
      passengers: { baggages: { type: "carry_on" | "checked"; quantity: number }[]; cabin_class_marketing_name?: string }[];
    }[];
  }[];
}
interface DuffelResponse {
  data: { offers: DuffelOffer[]; live_mode: boolean };
}

const ref = (a: DuffelAirport) => ({ code: a.iata_code ?? "?", name: a.name });

function condition(label: string, c: DuffelCondition | null | undefined): string | null {
  if (c === undefined) return null;
  if (c === null) return `${label}: a companhia não informou`;
  if (!c.allowed) return `${label}: não permitido`;
  const fee = c.penalty_amount && Number(c.penalty_amount) > 0 ? ` com multa de ${c.penalty_currency ?? ""} ${c.penalty_amount}` : " sem multa";
  return `${label}: permitido${fee}`;
}

export function normalizeDuffel(offers: DuffelOffer[], p: FlightSearchParams, fetchedAt: string, allowTest: boolean): FlightOffer[] {
  const pax = p.adults + p.children + p.infants;
  return offers
    .filter((o) => o.live_mode || allowTest)
    .map((o) => {
      const legs: FlightLeg[] = o.slices.map((s) => {
        const segments = s.segments.map((g) => ({
          carrier: g.marketing_carrier.name,
          carrierCode: g.marketing_carrier.iata_code ?? undefined,
          flightNumber: `${g.marketing_carrier.iata_code ?? ""} ${g.marketing_carrier_flight_number}`.trim(),
          from: ref(g.origin),
          to: ref(g.destination),
          departure: localIso(g.departing_at),
          arrival: localIso(g.arriving_at),
          durationMin: isoDurationToMinutes(g.duration),
          aircraft: g.aircraft?.name,
        }));
        const layovers = segments.slice(1).map((g, i) => ({ airport: segments[i].to, durationMin: Math.max(0, minutesBetween(segments[i].arrival, g.departure)) }));
        return {
          from: ref(s.origin),
          to: ref(s.destination),
          departure: segments[0]?.departure ?? "",
          arrival: segments[segments.length - 1]?.arrival ?? "",
          durationMin: isoDurationToMinutes(s.duration) || segments.reduce((a, g) => a + g.durationMin, 0) + layovers.reduce((a, l) => a + l.durationMin, 0),
          stops: Math.max(0, segments.length - 1),
          segments,
          layovers,
        };
      });
      const bags = o.slices[0]?.segments[0]?.passengers[0]?.baggages ?? [];
      const carryOn = bags.filter((b) => b.type === "carry_on").reduce((a, b) => a + b.quantity, 0);
      const checked = bags.filter((b) => b.type === "checked").reduce((a, b) => a + b.quantity, 0);
      const total = Number(o.total_amount);
      const site = airlineByCode(o.owner.iata_code);
      const rules = [condition("Reembolso antes do voo", o.conditions?.refund_before_departure), condition("Alteração antes do voo", o.conditions?.change_before_departure)].filter((x): x is string => !!x);
      const test = !o.live_mode;
      return {
        id: `duffel-${o.id}`,
        provider: "duffel" as const,
        providerLabel: test ? "Duffel (MODO TESTE — preço fictício)" : "Duffel (oferta da companhia)",
        legs,
        tripType: p.returnDate ? ("round_trip" as const) : ("one_way" as const),
        price: {
          total,
          perPassenger: Math.round((total / Math.max(1, pax)) * 100) / 100,
          currency: o.total_currency,
          kind: test ? ("estimated" as const) : ("found" as const),
          basis: `${p.returnDate ? "ida e volta" : "só ida"}, ${pax} passageiro(s), total da oferta com taxas`,
        },
        passengers: pax,
        airlines: [...new Set(legs.flatMap((l) => l.segments.map((g) => g.carrier)))],
        baggage: { carryOn, checked, notes: [] },
        fareRules: rules,
        fareName: o.slices[0]?.fare_brand_name ?? o.slices[0]?.segments[0]?.passengers[0]?.cabin_class_marketing_name,
        fetchedAt,
        availability: test ? ("unconfirmed" as const) : ("confirmed" as const),
        availabilityNote: test ? "Dados de TESTE do Duffel: não são preços nem voos reais." : `Oferta confirmada pela companhia, válida até ${new Date(o.expires_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (horário de Brasília). No site da companhia o valor pode variar.`,
        booking: site
          ? { kind: "link" as const, url: site.site, label: `Comprar no site da ${site.name}` }
          : { kind: "link" as const, url: googleFlightsUrl({ origin: legs[0].from.code, destination: legs[0].to.code, departDate: p.departDate, returnDate: p.returnDate, adults: p.adults }), label: "Ver no Google Flights" },
        checkUrl: googleFlightsUrl({ origin: legs[0].from.code, destination: legs[0].to.code, departDate: p.departDate, returnDate: p.returnDate, adults: p.adults }),
        emissionsKg: o.total_emissions_kg ? Number(o.total_emissions_kg) : undefined,
        departDate: p.departDate,
        returnDate: p.returnDate,
      };
    });
}

export function duffelBody(p: FlightSearchParams) {
  const passengers = [
    ...Array.from({ length: p.adults }, () => ({ type: "adult" })),
    // A Duffel identifica crianças e bebês pela idade
    ...Array.from({ length: p.children }, () => ({ age: 8 })),
    ...Array.from({ length: p.infants }, () => ({ age: 1 })),
  ];
  const slices = [{ origin: p.origin[0], destination: p.destination[0], departure_date: p.departDate, departure_time: null, arrival_time: null }];
  if (p.returnDate) slices.push({ origin: p.destination[0], destination: p.origin[0], departure_date: p.returnDate, departure_time: null, arrival_time: null });
  return { data: { slices, passengers, cabin_class: p.cabin, ...(p.directOnly ? { max_connections: 0 } : {}) } };
}

export const duffelFlights: FlightProviderModule = {
  id: "duffel",
  label: "Duffel",
  configured: () => !!config.duffelToken,
  async search(p) {
    const res = await fetchJson<DuffelResponse>(ENDPOINT, {
      method: "POST",
      timeoutMs: 45_000,
      headers: {
        Authorization: `Bearer ${config.duffelToken}`,
        "Duffel-Version": "v2",
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(duffelBody(p)),
    });
    const offers = res.data?.offers ?? [];
    const notes: string[] = [];
    if (p.origin.length > 1 || p.destination.length > 1) notes.push(`Duffel: consultado só ${p.origin[0]} → ${p.destination[0]} (um aeroporto de cada cidade).`);
    if (!res.data?.live_mode && !config.duffelAllowTest) notes.push("Duffel está com token de TESTE: as ofertas fictícias foram descartadas. Ative a conta Duffel para ter preços reais.");
    return { offers: normalizeDuffel(offers, p, new Date().toISOString(), config.duffelAllowTest), notes };
  },
};
