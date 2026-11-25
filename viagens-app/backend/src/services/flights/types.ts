// Contrato de um fornecedor de voos (cada API fica no seu módulo, com a mesma interface).

import type { BookingOptionsResponse, FlightOffer, FlightSearchParams, PriceInsights } from "../../../../shared/types.ts";

export interface FlightProviderResult {
  offers: FlightOffer[];
  insights?: PriceInsights;
  notes: string[];
}

export interface FlightProviderModule {
  id: string;
  label: string;
  configured(): boolean;
  search(params: FlightSearchParams): Promise<FlightProviderResult>;
}

export type { BookingOptionsResponse };
