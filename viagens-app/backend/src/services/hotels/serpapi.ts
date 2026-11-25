// Google Hotels via SerpApi (https://serpapi.com/google-hotels-api).
// Preços por diária e total encontrados no Google Hotels para as datas pedidas.

import type { HotelOffer, HotelSearchParams, HotelSearchResponse } from "../../../../shared/types.ts";
import { config } from "../../config/env.ts";
import { fetchJson } from "../../utils/http.ts";
import { nightsBetween } from "../../utils/time.ts";

export interface SerpProperty {
  type?: string;
  name: string;
  description?: string;
  link?: string;
  gps_coordinates?: { latitude: number; longitude: number };
  check_in_time?: string;
  check_out_time?: string;
  rate_per_night?: { extracted_lowest?: number; extracted_before_taxes_fees?: number };
  total_rate?: { extracted_lowest?: number };
  prices?: { source: string; rate_per_night?: { extracted_lowest?: number } }[];
  nearby_places?: { name: string; transportations?: { type: string; duration: string }[] }[];
  hotel_class?: string;
  extracted_hotel_class?: number;
  images?: { thumbnail?: string; original_image?: string }[];
  overall_rating?: number;
  reviews?: number;
  location_rating?: number;
  amenities?: string[];
  excluded_amenities?: string[];
  property_token?: string;
}
export interface SerpHotelsResponse {
  search_metadata?: { google_hotels_url?: string };
  properties?: SerpProperty[];
  error?: string;
}

const SORT: Record<HotelSearchParams["sort"], string | undefined> = { relevance: undefined, price: "3", rating: "8", reviews: "13" };
const RATING: Record<string, string> = { "3.5": "7", "4": "8", "4.5": "9" };

export function hotelParams(p: HotelSearchParams): URLSearchParams {
  const q = new URLSearchParams({
    engine: "google_hotels",
    q: p.query,
    check_in_date: p.checkIn,
    check_out_date: p.checkOut,
    adults: String(p.adults),
    children: String(p.children),
    currency: p.currency,
    hl: "pt-BR",
    gl: "br",
  });
  if (p.children && p.childrenAges.length) q.set("children_ages", p.childrenAges.map((a) => Math.max(1, Math.min(17, a))).join(","));
  const sort = SORT[p.sort];
  if (sort) q.set("sort_by", sort);
  if (p.minRating && RATING[String(p.minRating)]) q.set("rating", RATING[String(p.minRating)]);
  if (p.stars?.length) q.set("hotel_class", p.stars.filter((s) => s >= 2 && s <= 5).join(","));
  return q;
}

/** Café da manhã: true se incluso, false se a fonte diz que não, null se não informa. */
export function breakfastOf(p: SerpProperty): boolean | null {
  const has = (list?: string[]) => (list ?? []).some((a) => /caf[eé] da manh[aã]|breakfast/i.test(a));
  if (has(p.amenities)) return true;
  if (has(p.excluded_amenities)) return false;
  return null;
}

export function normalizeHotels(data: SerpHotelsResponse, p: HotelSearchParams, fetchedAt: string): HotelOffer[] {
  const nights = nightsBetween(p.checkIn, p.checkOut);
  return (data.properties ?? []).map((h, i) => {
    const nightly = h.rate_per_night?.extracted_lowest;
    const total = h.total_rate?.extracted_lowest ?? (nightly ? nightly * nights : undefined);
    const links: HotelOffer["links"] = [];
    if (h.link) links.push({ label: "Site do hotel", url: h.link });
    if (data.search_metadata?.google_hotels_url) links.push({ label: "Ver no Google Hotels", url: data.search_metadata.google_hotels_url });
    return {
      id: `serpapi-${h.property_token ?? i}`,
      provider: "serpapi",
      providerLabel: "Google Hotels (via SerpApi)",
      name: h.name,
      type: h.type,
      description: h.description,
      photos: (h.images ?? []).map((im) => im.original_image ?? im.thumbnail).filter((u): u is string => !!u).slice(0, 8),
      stars: h.extracted_hotel_class,
      rating: h.overall_rating,
      reviews: h.reviews,
      locationRating: h.location_rating,
      lat: h.gps_coordinates?.latitude,
      lon: h.gps_coordinates?.longitude,
      nightly,
      total,
      currency: p.currency,
      priceKind: nightly ? "found" : "none",
      amenities: h.amenities ?? [],
      breakfast: breakfastOf(h),
      nearby: (h.nearby_places ?? []).map((n) => ({ name: n.name, transport: (n.transportations ?? []).map((t) => `${t.type}: ${t.duration}`).join(" · ") })),
      checkInTime: h.check_in_time,
      checkOutTime: h.check_out_time,
      links,
      sources: (h.prices ?? []).map((s) => ({ name: s.source, nightly: s.rate_per_night?.extracted_lowest })),
      fetchedAt,
      nights,
      rooms: p.rooms,
      guests: p.adults + p.children,
    };
  });
}

export const serpApiHotels = {
  id: "serpapi",
  label: "Google Hotels (via SerpApi)",
  configured: () => !!config.serpApiKey,
  async search(p: HotelSearchParams): Promise<Omit<HotelSearchResponse, "providers">> {
    const q = hotelParams(p);
    q.set("api_key", config.serpApiKey);
    const data = await fetchJson<SerpHotelsResponse>(`${config.serpApiBase}?${q.toString()}`, { timeoutMs: 60_000 });
    if (data.error) {
      if (/no results|didn't return any results/i.test(data.error)) return { hotels: [], fetchedAt: new Date().toISOString(), notes: ["O Google Hotels não encontrou hospedagens para esta busca."] };
      throw new Error(data.error);
    }
    const fetchedAt = new Date().toISOString();
    const notes = p.rooms > 1 ? [`O Google Hotels mostra o preço de 1 quarto para ${p.adults + p.children} hóspede(s); para ${p.rooms} quartos, confira no site do vendedor.`] : [];
    return { hotels: normalizeHotels(data, p, fetchedAt), fetchedAt, notes, sourceUrl: data.search_metadata?.google_hotels_url };
  },
};
