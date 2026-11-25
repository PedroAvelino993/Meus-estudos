// Pesquisas recentes e o menor preço real encontrado em cada uma (com a hora).

import type { FlightSearchParams } from "../types";
import { read, write } from "./store";

export interface RecentSearch {
  params: FlightSearchParams;
  labels: { origin: string; destination: string };
  lowest?: { price: number; currency: string; fetchedAt: string; provider: string };
  at: string;
}

export const recentSearches = (): RecentSearch[] => read<RecentSearch[]>("recent", []);

export function rememberSearch(r: RecentSearch) {
  const key = (x: RecentSearch) => `${x.params.origin.join()}>${x.params.destination.join()}@${x.params.departDate}/${x.params.returnDate ?? ""}`;
  write("recent", [r, ...recentSearches().filter((x) => key(x) !== key(r))].slice(0, 8));
}
