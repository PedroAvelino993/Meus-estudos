// Tipos do frontend: os da API (compartilhados com o backend) e os locais.

export type * from "@shared/types.ts";

export type Route =
  | { page: "home" }
  | { page: "voos"; query: URLSearchParams }
  | { page: "hoteis"; query: URLSearchParams }
  | { page: "destinos"; query: URLSearchParams }
  | { page: "viagens" }
  | { page: "viagem"; id: string }
  | { page: "comparar" }
  | { page: "ajustes" };

/** Opção de voo digitada pelo usuário (para comparar com o que achou em outro site). */
export interface ManualOption {
  id: string;
  label: string;
  route: string;
  price: number;
  durationMin: number;
  stops: number;
  baggage: string;
  notes: string;
}
