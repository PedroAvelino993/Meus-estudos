// Google Flights via SerpApi (https://serpapi.com/google-flights-api).
// Preços reais encontrados no Google Flights no momento da busca. A compra acontece nos
// sites da companhia/agência, pelas «booking options» (links do próprio Google Flights).

import type { BookingOption, BookingOptionsResponse, FlightLeg, FlightOffer, FlightSearchParams, FlightSegment, PriceInsights } from "../../../../shared/types.ts";
import { airlineByCode, carrierFromFlightNumber, googleFlightsUrl } from "../../../../shared/airlines.ts";
import { config } from "../../config/env.ts";
import { fetchJson } from "../../utils/http.ts";
import { serpTime } from "../../utils/time.ts";
import type { FlightProviderModule, FlightProviderResult } from "./types.ts";


// ---- Formato da resposta (documentação oficial) ----
export interface SerpAirport {
  name: string;
  id: string;
  time: string;
}
export interface SerpFlight {
  departure_airport: SerpAirport;
  arrival_airport: SerpAirport;
  duration: number;
  airplane?: string;
  airline: string;
  airline_logo?: string;
  travel_class?: string;
  flight_number: string;
  extensions?: string[];
  overnight?: boolean;
}
export interface SerpItinerary {
  flights: SerpFlight[];
  layovers?: { duration: number; name: string; id: string; overnight?: boolean }[];
  total_duration: number;
  carbon_emissions?: { this_flight?: number };
  price?: number;
  type?: string;
  extensions?: string[];
  departure_token?: string;
  booking_token?: string;
}
export interface SerpFlightsResponse {
  search_metadata?: { status?: string; created_at?: string; google_flights_url?: string };
  best_flights?: SerpItinerary[];
  other_flights?: SerpItinerary[];
  price_insights?: { lowest_price?: number; price_level?: string; typical_price_range?: [number, number] };
  error?: string;
}
interface SerpBookingResponse {
  booking_options?: {
    together?: SerpBookingPart;
    separate_tickets?: boolean;
    departing?: SerpBookingPart;
    returning?: SerpBookingPart;
  }[];
  error?: string;
}
interface SerpBookingPart {
  book_with?: string;
  airline?: boolean;
  price?: number;
  option_title?: string;
  extensions?: string[];
  baggage_prices?: string[];
  booking_request?: { url: string; post_data?: string };
}

const CLASS: Record<FlightSearchParams["cabin"], string> = { economy: "1", premium_economy: "2", business: "3", first: "4" };

export function baseParams(p: FlightSearchParams): URLSearchParams {
  const q = new URLSearchParams({
    engine: "google_flights",
    departure_id: p.origin.join(","),
    arrival_id: p.destination.join(","),
    outbound_date: p.departDate,
    type: p.returnDate ? "1" : "2",
    travel_class: CLASS[p.cabin],
    adults: String(p.adults),
    children: String(p.children),
    infants_on_lap: String(p.infants),
    stops: p.directOnly ? "1" : "0",
    currency: p.currency,
    hl: "pt-BR",
    gl: "br",
    sort_by: "2",
  });
  if (p.returnDate) q.set("return_date", p.returnDate);
  return q;
}

function segment(f: SerpFlight): FlightSegment {
  const code = carrierFromFlightNumber(f.flight_number);
  return {
    carrier: f.airline,
    carrierCode: code,
    flightNumber: f.flight_number,
    from: { code: f.departure_airport.id, name: f.departure_airport.name },
    to: { code: f.arrival_airport.id, name: f.arrival_airport.name },
    departure: serpTime(f.departure_airport.time),
    arrival: serpTime(f.arrival_airport.time),
    durationMin: f.duration,
    aircraft: f.airplane,
    overnight: f.overnight,
  };
}

export function legFromItinerary(it: SerpItinerary): FlightLeg {
  const segments = it.flights.map(segment);
  const first = segments[0];
  const last = segments[segments.length - 1];
  return {
    from: first.from,
    to: last.to,
    departure: first.departure,
    arrival: last.arrival,
    durationMin: it.total_duration,
    stops: Math.max(0, segments.length - 1),
    segments,
    layovers: (it.layovers ?? []).map((l) => ({ airport: { code: l.id, name: l.name }, durationMin: l.duration, overnight: l.overnight })),
  };
}

/** Bagagem e regras que o Google Flights já mostra na lista (o detalhe vem nas opções de compra). */
function baggageFromExtensions(ext: string[]): { notes: string[]; rules: string[] } {
  const notes = ext.filter((e) => /bagag|mala|bag|carry/i.test(e));
  const rules = ext.filter((e) => /reembols|refund|alter|chang|assento|seat/i.test(e));
  return { notes, rules };
}

export function normalizeFlights(data: SerpFlightsResponse, p: FlightSearchParams, fetchedAt: string, returnLegOf?: FlightLeg): FlightOffer[] {
  const all = [...(data.best_flights ?? []), ...(data.other_flights ?? [])];
  const pax = p.adults + p.children + p.infants;
  const roundTrip = !!p.returnDate;
  return all
    .filter((it) => it.flights?.length && typeof it.price === "number")
    .map((it, i) => {
      const leg = legFromItinerary(it);
      const legs = returnLegOf ? [returnLegOf, leg] : [leg];
      const airlines = [...new Set(legs.flatMap((l) => l.segments.map((s) => s.carrier)))];
      const ext = [...(it.extensions ?? []), ...it.flights.flatMap((f) => f.extensions ?? [])];
      const bag = baggageFromExtensions(ext);
      const total = it.price!;
      const booking: FlightOffer["booking"] = it.booking_token
        ? { kind: "serpapi_booking", token: it.booking_token }
        : it.departure_token
          ? { kind: "serpapi_return", token: it.departure_token }
          : { kind: "link", url: googleFlightsUrl({ origin: p.origin[0], destination: p.destination[0], departDate: p.departDate, returnDate: p.returnDate, adults: p.adults }), label: "Ver no Google Flights" };
      const offer: FlightOffer = {
        id: `serpapi-${it.booking_token ?? it.departure_token ?? i}`.slice(0, 120) + `-${i}`,
        provider: "serpapi",
        providerLabel: "Google Flights (via SerpApi)",
        legs,
        tripType: roundTrip ? "round_trip" : "one_way",
        price: {
          total,
          perPassenger: Math.round((total / Math.max(1, pax)) * 100) / 100,
          currency: p.currency,
          kind: "found",
          basis: `${roundTrip ? "ida e volta" : "só ida"}, ${pax} passageiro(s), como informado pelo Google Flights`,
        },
        passengers: pax,
        airlines,
        baggage: { carryOn: null, checked: null, notes: bag.notes.length ? bag.notes : ["Bagagem detalhada nas opções de compra"] },
        fareRules: bag.rules,
        fetchedAt,
        availability: "unconfirmed",
        availabilityNote: "Preço encontrado no Google Flights; lugares e valor final são confirmados no site do vendedor.",
        booking,
        checkUrl: data.search_metadata?.google_flights_url,
        emissionsKg: it.carbon_emissions?.this_flight ? Math.round(it.carbon_emissions.this_flight / 1000) : undefined,
        departDate: p.departDate,
        returnDate: p.returnDate,
      };
      return offer;
    });
}

function insights(data: SerpFlightsResponse, currency: string): PriceInsights | undefined {
  const pi = data.price_insights;
  if (!pi) return undefined;
  return { lowest: pi.lowest_price, level: pi.price_level, typicalRange: pi.typical_price_range, currency };
}

async function call<T>(q: URLSearchParams): Promise<T> {
  q.set("api_key", config.serpApiKey);
  return fetchJson<T>(`${config.serpApiBase}?${q.toString()}`, { timeoutMs: 60_000 });
}

export const serpApiFlights: FlightProviderModule & {
  returnFlights(p: FlightSearchParams, departureToken: string, outbound: FlightLeg): Promise<FlightProviderResult>;
  bookingOptions(p: FlightSearchParams, bookingToken: string): Promise<BookingOptionsResponse>;
} = {
  id: "serpapi",
  label: "Google Flights (via SerpApi)",
  configured: () => !!config.serpApiKey,

  async search(p) {
    const data = await call<SerpFlightsResponse>(baseParams(p));
    if (data.error) {
      // «Sem resultados» não é falha do fornecedor
      if (/no results|didn't return any results/i.test(data.error)) return { offers: [], notes: ["O Google Flights não encontrou voos para esta busca."] };
      throw new Error(data.error);
    }
    const fetchedAt = new Date().toISOString();
    return { offers: normalizeFlights(data, p, fetchedAt), insights: insights(data, p.currency), notes: [] };
  },

  /** Ida e volta: voos de volta para a ida escolhida (preço = total ida + volta). */
  async returnFlights(p, departureToken, outbound) {
    const q = baseParams(p);
    q.set("departure_token", departureToken);
    const data = await call<SerpFlightsResponse>(q);
    if (data.error) throw new Error(data.error);
    return { offers: normalizeFlights(data, p, new Date().toISOString(), outbound), notes: [] };
  },

  /** Onde comprar: companhia aérea e agências, com preço e link de cada uma. */
  async bookingOptions(p, bookingToken) {
    const q = baseParams(p);
    q.set("booking_token", bookingToken);
    const data = await call<SerpBookingResponse>(q);
    if (data.error) throw new Error(data.error);
    const options: BookingOption[] = [];
    for (const o of data.booking_options ?? []) {
      const parts = o.together ? [o.together] : [o.departing, o.returning].filter((x): x is SerpBookingPart => !!x);
      for (const part of parts) {
        if (!part.booking_request?.url) continue;
        options.push({
          seller: part.book_with ?? "Vendedor",
          isAirline: !!part.airline,
          price: typeof part.price === "number" ? part.price : null,
          currency: p.currency,
          title: [part.option_title, o.separate_tickets ? "bilhetes separados" : ""].filter(Boolean).join(" · ") || undefined,
          features: part.extensions ?? [],
          baggage: part.baggage_prices ?? [],
          request: { url: part.booking_request.url, postData: part.booking_request.post_data },
        });
      }
    }
    // Companhia aérea primeiro (comprar direto), depois o menor preço
    options.sort((a, b) => Number(b.isAirline) - Number(a.isAirline) || (a.price ?? Infinity) - (b.price ?? Infinity));
    return { options, fetchedAt: new Date().toISOString(), provider: "serpapi" };
  },
};

export { airlineByCode };
