// Tipos compartilhados entre o backend e o frontend (contrato da API).
// Regra do projeto: todo preço vem com a fonte, a hora em que foi encontrado e se a
// disponibilidade foi confirmada. Nada aqui é preenchido com dados inventados.

export type CabinClass = "economy" | "premium_economy" | "business" | "first";

export interface FlightSearchParams {
  /** Códigos IATA de origem (vários = todos os aeroportos da cidade). */
  origin: string[];
  destination: string[];
  /** AAAA-MM-DD */
  departDate: string;
  /** AAAA-MM-DD; ausente = só ida */
  returnDate?: string;
  adults: number;
  children: number;
  /** Bebês no colo (até 2 anos). */
  infants: number;
  cabin: CabinClass;
  /** Só voos diretos. */
  directOnly: boolean;
  currency: string;
}

export interface AirportRef {
  code: string;
  name: string;
}

export interface FlightSegment {
  carrier: string;
  carrierCode?: string;
  flightNumber: string;
  from: AirportRef;
  to: AirportRef;
  /** Hora local do aeroporto, "AAAA-MM-DDTHH:mm". */
  departure: string;
  arrival: string;
  durationMin: number;
  aircraft?: string;
  overnight?: boolean;
}

export interface Layover {
  airport: AirportRef;
  durationMin: number;
  overnight?: boolean;
}

export interface FlightLeg {
  from: AirportRef;
  to: AirportRef;
  departure: string;
  arrival: string;
  durationMin: number;
  stops: number;
  segments: FlightSegment[];
  layovers: Layover[];
}

/** found = preço devolvido pela fonte agora; estimated = calculado/aproximado. */
export type PriceKind = "found" | "estimated";

export interface Price {
  total: number;
  perPassenger: number;
  currency: string;
  kind: PriceKind;
  /** Explica o que o preço inclui (ex.: "ida e volta, 2 passageiros"). */
  basis: string;
}

export interface Baggage {
  /** Peças de bagagem de mão por passageiro (null = a fonte não informou). */
  carryOn: number | null;
  /** Malas despachadas por passageiro (null = a fonte não informou). */
  checked: number | null;
  notes: string[];
}

export type FlightProvider = "serpapi" | "duffel";

export type BookingRef =
  /** SerpApi: pedir as opções de compra (links do Google Flights para a companhia/agência). */
  | { kind: "serpapi_booking"; token: string }
  /** SerpApi ida e volta: escolher a volta antes de comprar. */
  | { kind: "serpapi_return"; token: string }
  /** Link direto para o site da companhia ou do fornecedor. */
  | { kind: "link"; url: string; label: string };

export interface FlightOffer {
  id: string;
  provider: FlightProvider;
  providerLabel: string;
  /** Ida (e volta, quando a fonte já informa). */
  legs: FlightLeg[];
  tripType: "one_way" | "round_trip";
  price: Price;
  passengers: number;
  airlines: string[];
  baggage: Baggage;
  fareRules: string[];
  fareName?: string;
  /** ISO 8601 (UTC) — hora em que o preço foi obtido da fonte. */
  fetchedAt: string;
  availability: "confirmed" | "unconfirmed";
  availabilityNote: string;
  booking: BookingRef;
  /** Link alternativo para conferir a mesma busca no site do fornecedor. */
  checkUrl?: string;
  emissionsKg?: number;
  departDate: string;
  returnDate?: string;
}

export interface ProviderResult {
  provider: string;
  label: string;
  ok: boolean;
  count: number;
  error?: string;
  /** O fornecedor não está configurado (falta chave). */
  notConfigured?: boolean;
}

export interface PriceInsights {
  lowest?: number;
  level?: string;
  typicalRange?: [number, number];
  currency: string;
}

export interface FlightSearchResponse {
  offers: FlightOffer[];
  providers: ProviderResult[];
  fetchedAt: string;
  insights?: PriceInsights;
  notes: string[];
}

export interface BookingOption {
  seller: string;
  isAirline: boolean;
  price: number | null;
  currency: string;
  title?: string;
  features: string[];
  baggage: string[];
  /** Abrir com POST (post_data) ou GET. */
  request: { url: string; postData?: string };
}

export interface BookingOptionsResponse {
  options: BookingOption[];
  fetchedAt: string;
  provider: string;
}

// ---------- Hotéis ----------

export type HotelSort = "relevance" | "price" | "rating" | "reviews";

export interface HotelSearchParams {
  /** Cidade, bairro ou nome do hotel. */
  query: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childrenAges: number[];
  rooms: number;
  currency: string;
  sort: HotelSort;
  /** Nota mínima (3.5, 4, 4.5). */
  minRating?: number;
  /** Estrelas aceitas (2 a 5). */
  stars?: number[];
}

export interface HotelOffer {
  id: string;
  provider: string;
  providerLabel: string;
  name: string;
  type?: string;
  description?: string;
  photos: string[];
  stars?: number;
  rating?: number;
  reviews?: number;
  locationRating?: number;
  lat?: number;
  lon?: number;
  nightly?: number;
  total?: number;
  currency: string;
  /** "found" quando a fonte devolveu preço para as datas; "none" sem preço. */
  priceKind: "found" | "none";
  amenities: string[];
  /** true/false quando a fonte informa; null = não informado. */
  breakfast: boolean | null;
  nearby: { name: string; transport: string }[];
  checkInTime?: string;
  checkOutTime?: string;
  links: { label: string; url: string }[];
  sources: { name: string; nightly?: number }[];
  fetchedAt: string;
  nights: number;
  rooms: number;
  guests: number;
}

export interface HotelSearchResponse {
  hotels: HotelOffer[];
  providers: ProviderResult[];
  fetchedAt: string;
  notes: string[];
  /** Link para a mesma busca na fonte, quando houver. */
  sourceUrl?: string;
}

// ---------- Ofertas ----------

export interface Deal {
  origin: string;
  destination: string;
  departDate: string;
  price: number;
  currency: string;
  airline?: string;
  stops?: number;
  durationMin?: number;
  fetchedAt: string;
  provider: string;
}

export interface DealsResponse {
  deals: Deal[];
  configured: boolean;
  fetchedAt?: string;
  notes: string[];
}

// ---------- Situação do servidor ----------

export interface ServerStatus {
  version: string;
  flights: { serpapi: boolean; duffel: boolean };
  hotels: { serpapi: boolean };
  deals: boolean;
  accounts: boolean;
}

// ---------- Viagens (salvas no aparelho e, com conta, no servidor) ----------

export interface SavedPlace {
  id: string;
  name: string;
  kind: string;
  address?: string;
  lat?: number;
  lon?: number;
  url?: string;
  note?: string;
  /** Dia do roteiro (1 = primeiro dia). */
  day?: number;
  price?: number;
}

export interface Expense {
  id: string;
  category: "passagens" | "hospedagem" | "transporte" | "alimentacao" | "passeios" | "outros";
  label: string;
  amount: number;
}

export interface Trip {
  id: string;
  name: string;
  destination?: { name: string; lat?: number; lon?: number; country?: string };
  startDate?: string;
  endDate?: string;
  travelers: number;
  currency: string;
  outbound?: FlightOffer;
  inbound?: FlightOffer;
  hotel?: HotelOffer;
  activities: SavedPlace[];
  restaurants: SavedPlace[];
  addresses: { id: string; label: string; address: string }[];
  expenses: Expense[];
  budget?: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  error: string;
  /** Código estável para a interface decidir o que mostrar. */
  code: "not_configured" | "bad_request" | "provider_error" | "unauthorized" | "rate_limited" | "not_found" | "server_error";
}
