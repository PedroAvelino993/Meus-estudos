import { describe, expect, it } from "vitest";
import type { FlightOffer, Trip } from "../types";
import { applyFilters, NO_FILTERS, sortOffers, valueScores } from "./flights/sort";
import { labelFor, nearestAirports, suggest } from "./flights/airports";
import { paramsToQuery, queryToParams, partialParams } from "./flights/params";
import { providerLinks } from "./flights/links";
import { fromManual, summarize } from "./flights/compare";
import { buildItinerary, nearestOrder } from "./destinations/itinerary";
import { buildQuery, categorize, rankPois, toPoi, type Poi } from "./destinations/pois";
import { km } from "./maps/geo";
import { budgetSummary } from "../database/trips";

function offer(id: string, price: number, dur: number, stops: number, airline = "LATAM", dep = "2026-12-10T08:00", checked: number | null = null, confirmed = false): FlightOffer {
  const seg = { carrier: airline, flightNumber: "LA 1", from: { code: "FOR", name: "" }, to: { code: "GRU", name: "" }, departure: dep, arrival: dep, durationMin: dur };
  return {
    id,
    provider: "serpapi",
    providerLabel: "teste",
    legs: [{ from: seg.from, to: seg.to, departure: dep, arrival: dep, durationMin: dur, stops, segments: Array(stops + 1).fill(seg), layovers: [] }],
    tripType: "one_way",
    price: { total: price, perPassenger: price, currency: "BRL", kind: "found", basis: "" },
    passengers: 1,
    airlines: [airline],
    baggage: { carryOn: 1, checked, notes: [] },
    fareRules: [],
    fetchedAt: "2026-11-25T10:00:00Z",
    availability: confirmed ? "confirmed" : "unconfirmed",
    availabilityNote: "",
    booking: { kind: "link", url: "https://x", label: "x" },
    departDate: "2026-12-10",
  };
}

describe("ordenação e filtros de voos", () => {
  const list = [offer("a", 800, 210, 0, "LATAM", "2026-12-10T06:00", 1, true), offer("b", 550, 360, 1, "GOL", "2026-12-10T14:00"), offer("c", 600, 230, 0, "Azul", "2026-12-10T21:00")];
  it("ordena por preço, duração, escalas e custo-benefício", () => {
    expect(sortOffers(list, "price").map((o) => o.id)).toEqual(["b", "c", "a"]);
    expect(sortOffers(list, "duration").map((o) => o.id)).toEqual(["a", "c", "b"]);
    expect(sortOffers(list, "stops")[2].id).toBe("b");
    // c: um pouco mais caro que b e bem mais rápido → melhor custo-benefício
    expect(sortOffers(list, "value")[0].id).toBe("c");
    expect(valueScores(list).get("b")).toBeGreaterThan(valueScores(list).get("c")!);
  });
  it("filtra por escalas, companhia, preço, horário, mala e confirmação", () => {
    expect(applyFilters(list, { ...NO_FILTERS, maxStops: 0 }).map((o) => o.id)).toEqual(["a", "c"]);
    expect(applyFilters(list, { ...NO_FILTERS, airlines: ["GOL"] }).map((o) => o.id)).toEqual(["b"]);
    expect(applyFilters(list, { ...NO_FILTERS, maxPrice: 600 }).length).toBe(2);
    expect(applyFilters(list, { ...NO_FILTERS, departFrom: 18, departTo: 24 }).map((o) => o.id)).toEqual(["c"]);
    expect(applyFilters(list, { ...NO_FILTERS, checkedBag: true }).map((o) => o.id)).toEqual(["a"]);
    expect(applyFilters(list, { ...NO_FILTERS, confirmedOnly: true }).map((o) => o.id)).toEqual(["a"]);
    expect(applyFilters(list, { ...NO_FILTERS, maxDurationH: 4 }).length).toBe(2);
  });
});

describe("aeroportos", () => {
  it("acha cidade com todos os aeroportos e aeroporto por código", () => {
    const sp = suggest("são paulo");
    expect(sp[0].kind).toBe("city");
    expect(sp[0].codes).toEqual(expect.arrayContaining(["GRU", "CGH"]));
    expect(suggest("FOR")[0].codes).toEqual(["FOR"]);
    expect(suggest("lisboa")[0].codes).toContain("LIS");
    expect(suggest("x")).toEqual([]);
    expect(labelFor(["FOR"])).toBe("Fortaleza (FOR)");
  });
  it("aeroportos perto de um destino", () => {
    expect(nearestAirports(-22.9, -43.2).map((a) => a.code)).toContain("GIG");
  });
});

describe("parâmetros da busca", () => {
  it("vão e voltam pela URL", () => {
    const p = { origin: ["FOR"], destination: ["GRU", "CGH"], departDate: "2026-12-10", returnDate: "2026-12-17", adults: 2, children: 1, infants: 1, cabin: "business" as const, directOnly: true, currency: "BRL" };
    const q = new URLSearchParams(Object.entries(paramsToQuery(p)).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]));
    expect(queryToParams(q)).toEqual(p);
    expect(queryToParams(new URLSearchParams("de=FOR"))).toBeNull();
    expect(partialParams(new URLSearchParams("para=GIG,SDU")).destination).toEqual(["GIG", "SDU"]);
  });
  it("links dos fornecedores levam a busca certa", () => {
    const links = providerLinks({ origin: ["FOR"], destination: ["GRU"], departDate: "2026-12-10", returnDate: "2026-12-17", adults: 2, children: 0, infants: 0, cabin: "economy", directOnly: false, currency: "BRL" });
    expect(links.map((l) => l.label)).toEqual(["Google Flights", "Skyscanner", "Kayak"]);
    expect(links[1].url).toContain("/for/gru/261210/261217/");
    expect(links[2].url).toContain("FOR-GRU/2026-12-10/2026-12-17");
  });
});

describe("comparador", () => {
  it("mostra quanto custa cada hora economizada", () => {
    const a = fromManual({ id: "A", label: "Viagem A", route: "", price: 800, durationMin: 210, stops: 0, baggage: "", notes: "" });
    const b = fromManual({ id: "B", label: "Viagem B", route: "", price: 550, durationMin: 360, stops: 1, baggage: "", notes: "" });
    const s = summarize([a, b], (n) => `R$ ${n}`, (m) => `${m}min`)!;
    expect(s.cheapestId).toBe("B");
    expect(s.fastestId).toBe("A");
    expect(s.pricePerHourSaved).toBe(100);
    expect(s.insight).toContain("R$ 250");
  });
});

describe("lugares e roteiro", () => {
  const center = { lat: 48.8566, lon: 2.3522 };
  it("classifica etiquetas do OpenStreetMap", () => {
    expect(categorize({ tourism: "museum" })).toBe("museus");
    expect(categorize({ amenity: "bar" })).toBe("noite");
    expect(categorize({ natural: "beach" })).toBe("praias");
    expect(categorize({ shop: "bakery" })).toBeNull();
    const p = toPoi({ type: "node", id: 1, lat: 48.86, lon: 2.34, tags: { name: "Louvre", tourism: "museum", wikidata: "Q19675", fee: "yes" } }, "museus", center)!;
    expect(p.notable).toBe(true);
    expect(p.fee).toBe("paga");
    expect(buildQuery(center, 3000, ["museus"])).toContain("out tags center 40");
  });
  it("monta dias com lugares próximos entre si", () => {
    const mk = (id: string, lat: number, lon: number): Poi => ({ id, name: id, category: "atracoes", kind: "Atração", notable: true, lat, lon, distanceKm: km(center, { lat, lon }) });
    // Dois grupos distantes: norte e sul
    const places = [mk("N1", 48.89, 2.34), mk("S1", 48.82, 2.35), mk("N2", 48.891, 2.342), mk("S2", 48.821, 2.352), mk("N3", 48.889, 2.345), mk("S3", 48.819, 2.349)];
    const days = buildItinerary(places, [mk("R", 48.89, 2.343)], 2, center);
    expect(days.length).toBe(2);
    const groups = days.map((d) => d.items.map((i) => i.poi.id[0]));
    expect(groups.every((g) => new Set(g).size === 1)).toBe(true);
    expect(days.some((d) => d.lunch?.id === "R")).toBe(true);
    expect(nearestOrder(places.slice(0, 3), places[0])[0].id).toBe("N1");
    // 7 lugares em 3 dias: nenhum dia com mais de 3
    const seven = [...places, mk("N4", 48.888, 2.341)];
    const three = buildItinerary(seven, [], 3, center);
    expect(Math.max(...three.map((d) => d.items.length))).toBeLessThanOrEqual(3);
    expect(three.reduce((a, d) => a + d.items.length, 0)).toBe(7);
    expect(rankPois([{ ...places[0], notable: false }, places[1]])[0].id).toBe("S1");
  });
});

describe("resumo financeiro da viagem", () => {
  it("soma passagens, hotel, passeios e gastos lançados", () => {
    const t: Trip = { id: "t", name: "T", travelers: 2, currency: "BRL", activities: [{ id: "a", name: "Museu", kind: "Museu", price: 120 }], restaurants: [], addresses: [], expenses: [{ id: "e", category: "alimentacao", label: "Jantar", amount: 300 }], notes: "", createdAt: "", updatedAt: "", outbound: offer("o", 1500, 200, 0), hotel: { total: 2000 } as Trip["hotel"] };
    const b = budgetSummary(t);
    expect(b.total).toBe(1500 + 2000 + 120 + 300);
    expect(b.rows.find((r) => r.category === "passagens")!.amount).toBe(1500);
  });
});
