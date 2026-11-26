import { test } from "node:test";
import assert from "node:assert/strict";
import type { FlightSearchParams, HotelSearchParams } from "../../shared/types.ts";
import { baseParams, normalizeFlights } from "../src/services/flights/serpapi.ts";
import { duffelBody, normalizeDuffel, type DuffelOffer } from "../src/services/flights/duffel.ts";
import { mergeOffers } from "../src/services/flights/index.ts";
import { hotelParams, normalizeHotels } from "../src/services/hotels/serpapi.ts";
import { isoDurationToMinutes } from "../src/utils/time.ts";
import { duffelOffer, serpFlights, serpHotels } from "./fixtures.ts";

const p: FlightSearchParams = { origin: ["FOR"], destination: ["GRU", "CGH"], departDate: "2026-12-10", returnDate: "2026-12-17", adults: 2, children: 0, infants: 0, cabin: "economy", directOnly: false, currency: "BRL" };

test("SerpApi: parâmetros seguem a documentação", () => {
  const q = baseParams(p);
  assert.equal(q.get("engine"), "google_flights");
  assert.equal(q.get("arrival_id"), "GRU,CGH");
  assert.equal(q.get("type"), "1");
  assert.equal(q.get("travel_class"), "1");
  assert.equal(q.get("stops"), "0");
  assert.equal(q.get("sort_by"), "2");
  assert.equal(baseParams({ ...p, returnDate: undefined, directOnly: true, cabin: "business" }).get("type"), "2");
  assert.equal(baseParams({ ...p, directOnly: true }).get("stops"), "1");
  assert.equal(baseParams({ ...p, cabin: "first" }).get("travel_class"), "4");
});

test("SerpApi: voos normalizados com escalas, conexões, preço por passageiro e horário", () => {
  const offers = normalizeFlights(serpFlights as never, p, "2026-11-25T10:00:00.000Z");
  assert.equal(offers.length, 2);
  const conn = offers.find((o) => o.legs[0].stops === 1)!;
  assert.equal(conn.legs[0].layovers[0].airport.code, "BSB");
  assert.equal(conn.legs[0].layovers[0].durationMin, 90);
  assert.equal(conn.legs[0].departure, "2026-12-10T05:00");
  assert.equal(conn.price.total, 1100);
  assert.equal(conn.price.perPassenger, 550);
  assert.equal(conn.price.kind, "found");
  assert.equal(conn.availability, "unconfirmed");
  assert.equal(conn.fetchedAt, "2026-11-25T10:00:00.000Z");
  assert.equal(conn.booking.kind, "serpapi_return");
  assert.equal(offers[0].legs[0].segments[0].carrierCode, "LA");
  assert.equal(offers[0].emissionsKg, 152);
});

test("Duffel: só ofertas reais (live) por padrão; regras e bagagem", () => {
  const offers = [duffelOffer(true), duffelOffer(false)] as unknown as DuffelOffer[];
  const live = normalizeDuffel(offers, p, "t", false);
  assert.equal(live.length, 1);
  const o = live[0];
  assert.equal(o.availability, "confirmed");
  assert.equal(o.price.total, 1234.5);
  assert.equal(o.legs[0].durationMin, 355);
  assert.equal(o.legs[0].layovers[0].durationMin, 90);
  assert.deepEqual([o.baggage.carryOn, o.baggage.checked], [1, 1]);
  assert.ok(o.fareRules.some((r) => r.includes("Reembolso antes do voo: não permitido")));
  assert.ok(o.fareRules.some((r) => r.includes("multa de BRL 200.00")));
  assert.equal(o.booking.kind, "link");
  assert.match((o.booking as { url: string }).url, /latamairlines/);
  const withTest = normalizeDuffel(offers, p, "t", true);
  assert.equal(withTest.length, 2);
  assert.equal(withTest[1].price.kind, "estimated");
  assert.match(withTest[1].providerLabel, /TESTE/);
});

test("Duffel: corpo da busca com passageiros e voo direto", () => {
  const b = duffelBody({ ...p, children: 1, infants: 1, directOnly: true });
  assert.equal(b.data.slices.length, 2);
  assert.equal(b.data.slices[1].origin, "GRU");
  assert.deepEqual(b.data.passengers, [{ type: "adult" }, { type: "adult" }, { age: 8 }, { age: 1 }]);
  assert.equal((b.data as { max_connections?: number }).max_connections, 0);
});

test("Junção de fornecedores: mesmo voo vira um só, ordenado pelo menor preço", () => {
  const a = normalizeFlights(serpFlights as never, p, "t");
  const dup = { ...a[0], id: "x", price: { ...a[0].price, total: 9999 } };
  const merged = mergeOffers([a, [dup]]);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].price.total, 1100);
});

test("ISO 8601 de duração", () => {
  assert.equal(isoDurationToMinutes("PT2H30M"), 150);
  assert.equal(isoDurationToMinutes("P1DT1H"), 1500);
  assert.equal(isoDurationToMinutes(null), 0);
});

test("Hotéis: parâmetros e normalização (preço, café, fotos, distâncias)", () => {
  const hp: HotelSearchParams = { query: "Paris", checkIn: "2026-12-10", checkOut: "2026-12-15", adults: 2, children: 1, childrenAges: [5], rooms: 1, currency: "BRL", sort: "price", minRating: 4, stars: [4, 5] };
  const q = hotelParams(hp);
  assert.equal(q.get("engine"), "google_hotels");
  assert.equal(q.get("sort_by"), "3");
  assert.equal(q.get("rating"), "8");
  assert.equal(q.get("hotel_class"), "4,5");
  assert.equal(q.get("children_ages"), "5");
  const hotels = normalizeHotels(serpHotels as never, hp, "t");
  assert.equal(hotels[0].nightly, 800);
  assert.equal(hotels[0].total, 4000);
  assert.equal(hotels[0].nights, 5);
  assert.equal(hotels[0].breakfast, true);
  assert.equal(hotels[0].photos[0], "https://exemplo/o.jpg");
  assert.equal(hotels[0].nearby[0].transport, "A pé: 8 min");
  assert.equal(hotels[1].priceKind, "none");
  assert.equal(hotels[1].breakfast, false);
});

test("ALLOWED_ORIGINS aceita o endereço escrito de vários jeitos", async () => {
  const { normalizeOrigin } = await import("../src/config/env.ts");
  for (const v of ["https://PedroAvelino993.github.io", "https://pedroavelino993.github.io/", "https://pedroavelino993.github.io/Meus-estudos/viagens/", "pedroavelino993.github.io", " 'https://pedroavelino993.github.io' "]) {
    assert.equal(normalizeOrigin(v), "https://pedroavelino993.github.io", v);
  }
  assert.equal(normalizeOrigin("http://localhost:5173/"), "http://localhost:5173");
  assert.equal(normalizeOrigin("*"), "*");
});
