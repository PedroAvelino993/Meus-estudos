// Viagens salvas: passagens, hotel, passeios, restaurantes, endereços e gastos.

import type { Expense, FlightOffer, HotelOffer, SavedPlace, Trip } from "../types";
import { CURRENCY } from "../config";
import { uid } from "../utils/text";
import { read, write } from "./store";

const KEY = "trips";

export const listTrips = (): Trip[] => read<Trip[]>(KEY, []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
export const getTrip = (id: string): Trip | undefined => listTrips().find((t) => t.id === id);

export function newTrip(partial: Partial<Trip> = {}): Trip {
  const now = new Date().toISOString();
  return { id: uid("v_"), name: partial.destination?.name ? `Viagem para ${partial.destination.name}` : "Nova viagem", travelers: 1, currency: CURRENCY, activities: [], restaurants: [], addresses: [], expenses: [], notes: "", createdAt: now, updatedAt: now, ...partial };
}

export function saveTrip(t: Trip, touch = true): Trip {
  const next = touch ? { ...t, updatedAt: new Date().toISOString() } : t;
  write(KEY, [next, ...read<Trip[]>(KEY, []).filter((x) => x.id !== t.id)]);
  return next;
}

export function deleteTrip(id: string) {
  write(KEY, read<Trip[]>(KEY, []).filter((x) => x.id !== id));
  const gone = read<string[]>("trips:deleted", []);
  write("trips:deleted", [...new Set([...gone, id])]);
}

export function setFlight(t: Trip, which: "outbound" | "inbound", offer: FlightOffer | undefined): Trip {
  return saveTrip({ ...t, [which]: offer });
}

export function setHotel(t: Trip, hotel: HotelOffer | undefined): Trip {
  return saveTrip({ ...t, hotel });
}

export function addPlace(t: Trip, list: "activities" | "restaurants", place: Omit<SavedPlace, "id"> & { id?: string }): Trip {
  if (t[list].some((p) => p.name === place.name && p.lat === place.lat)) return t;
  return saveTrip({ ...t, [list]: [...t[list], { ...place, id: place.id ?? uid("p_") }] });
}

export function removePlace(t: Trip, list: "activities" | "restaurants", id: string): Trip {
  return saveTrip({ ...t, [list]: t[list].filter((p) => p.id !== id) });
}

export const EXPENSE_LABEL: Record<Expense["category"], string> = {
  passagens: "Passagens",
  hospedagem: "Hospedagem",
  transporte: "Transporte",
  alimentacao: "Alimentação",
  passeios: "Passeios",
  outros: "Outros gastos",
};

/** Resumo financeiro: passagens e hotel salvos entram sozinhos; o resto vem dos gastos lançados. */
export function budgetSummary(t: Trip): { rows: { category: Expense["category"]; label: string; amount: number; auto: number }[]; total: number } {
  const auto: Record<Expense["category"], number> = { passagens: 0, hospedagem: 0, transporte: 0, alimentacao: 0, passeios: 0, outros: 0 };
  // Ida e volta numa oferta só: o preço já é o total
  if (t.outbound) auto.passagens += t.outbound.price.total;
  if (t.inbound && t.inbound.id !== t.outbound?.id) auto.passagens += t.inbound.price.total;
  if (t.hotel?.total) auto.hospedagem += t.hotel.total;
  auto.passeios += t.activities.reduce((a, p) => a + (p.price ?? 0), 0);
  const rows = (Object.keys(EXPENSE_LABEL) as Expense["category"][]).map((category) => {
    const manual = t.expenses.filter((e) => e.category === category).reduce((a, e) => a + e.amount, 0);
    return { category, label: EXPENSE_LABEL[category], amount: manual + auto[category], auto: auto[category] };
  });
  return { rows, total: rows.reduce((a, r) => a + r.amount, 0) };
}
