// Hotéis: busca com preço pelo backend e links de reserva nos fornecedores.

import type { HotelSearchParams, HotelSearchResponse } from "../../types";
import { api } from "../../api/client";
import { CURRENCY } from "../../config";
import { addDays, isValidDate, today } from "../../utils/dates";

export const searchHotels = (p: HotelSearchParams, signal?: AbortSignal) => api<HotelSearchResponse>("/api/hotels/search", { body: p, signal });

export function defaultHotelParams(query = ""): HotelSearchParams {
  const ci = addDays(today(), 30);
  return { query, checkIn: ci, checkOut: addDays(ci, 5), adults: 2, children: 0, childrenAges: [], rooms: 1, currency: CURRENCY, sort: "relevance" };
}

export function hotelParamsToQuery(p: HotelSearchParams): Record<string, string | number | undefined> {
  return { onde: p.query, entrada: p.checkIn, saida: p.checkOut, adultos: p.adults, criancas: p.children || undefined, idades: p.childrenAges.join(",") || undefined, quartos: p.rooms > 1 ? p.rooms : undefined, ordem: p.sort === "relevance" ? undefined : p.sort };
}

export function queryToHotelParams(q: URLSearchParams): HotelSearchParams | null {
  const query = q.get("onde") ?? "";
  const checkIn = q.get("entrada") ?? "";
  const checkOut = q.get("saida") ?? "";
  if (query.length < 2 || !isValidDate(checkIn) || !isValidDate(checkOut)) return null;
  const children = Math.max(0, Math.min(8, Number(q.get("criancas") ?? 0) || 0));
  const ages = (q.get("idades") ?? "").split(",").map(Number).filter((n) => Number.isFinite(n) && n >= 0 && n <= 17);
  const sort = (["relevance", "price", "rating", "reviews"] as const).find((s) => s === q.get("ordem")) ?? "relevance";
  return { query, checkIn, checkOut, adults: Math.max(1, Math.min(12, Number(q.get("adultos") ?? 2) || 2)), children, childrenAges: [...ages, ...Array(Math.max(0, children - ages.length)).fill(8)].slice(0, children), rooms: Math.max(1, Math.min(8, Number(q.get("quartos") ?? 1) || 1)), currency: CURRENCY, sort };
}

/** A mesma busca nos sites de reserva (preço e disponibilidade são os do site). */
export function hotelProviderLinks(p: HotelSearchParams, hotelName?: string): { label: string; url: string }[] {
  const ss = encodeURIComponent(hotelName ? `${hotelName}, ${p.query}` : p.query);
  const ages = p.childrenAges.map((a) => `&age=${a}`).join("");
  const booking = `https://www.booking.com/searchresults.pt-br.html?ss=${ss}&checkin=${p.checkIn}&checkout=${p.checkOut}&group_adults=${p.adults}&group_children=${p.children}${ages}&no_rooms=${p.rooms}&selected_currency=BRL`;
  const google = `https://www.google.com/travel/search?q=${ss}&hl=pt-BR&gl=br&curr=BRL`;
  const airbnb = `https://www.airbnb.com.br/s/${encodeURIComponent(p.query)}/homes?checkin=${p.checkIn}&checkout=${p.checkOut}&adults=${p.adults}&children=${p.children}`;
  const links = [
    { label: "Booking.com", url: booking },
    { label: "Google Hotels", url: google },
  ];
  if (!hotelName) links.push({ label: "Airbnb", url: airbnb });
  return links;
}
