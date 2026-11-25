// Teste do servidor inteiro: rotas, validação, contas, viagens e busca com o fornecedor simulado.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { config } from "../src/config/env.ts";
import { createApp } from "../src/app.ts";
import { closeDb } from "../src/models/db.ts";
import { serpBooking, serpFlights, serpReturn } from "./fixtures.ts";

let server: Server;
let base = "";
const realFetch = globalThis.fetch;

before(async () => {
  Object.assign(config, { accountsEnabled: true, databaseFile: ":memory:", allowedOrigins: ["http://app.local"], serpApiKey: "", duffelToken: "", rateLimitPerMinute: 100 });
  server = createApp(config);
  await new Promise<void>((r) => server.listen(0, r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => {
  globalThis.fetch = realFetch;
  server.close();
  closeDb();
});

const call = (path: string, init: RequestInit = {}) => realFetch(base + path, { ...init, headers: { "Content-Type": "application/json", Origin: "http://app.local", ...(init.headers ?? {}) } });
const future = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10);
const search = { origin: ["FOR"], destination: ["GRU"], departDate: future(30), returnDate: future(37), adults: 2, children: 0, infants: 0, cabin: "economy", directOnly: false, currency: "BRL" };

test("status e CORS só para origens permitidas", async () => {
  const r = await call("/api/status");
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("access-control-allow-origin"), "http://app.local");
  const s = await r.json();
  assert.equal(s.flights.serpapi, false);
  const other = await realFetch(base + "/api/status", { headers: { Origin: "http://malicioso.local" } });
  assert.equal(other.headers.get("access-control-allow-origin"), null);
});

test("sem chave: a busca diz que não está configurada (não inventa resultados)", async () => {
  const r = await call("/api/flights/search", { method: "POST", body: JSON.stringify(search) });
  assert.equal(r.status, 503);
  assert.equal((await r.json()).code, "not_configured");
  const h = await call("/api/hotels/search", { method: "POST", body: JSON.stringify({ query: "Paris", checkIn: future(30), checkOut: future(33) }) });
  assert.equal((await h.json()).code, "not_configured");
});

test("validação da busca", async () => {
  config.serpApiKey = "chave-teste";
  const r = await call("/api/flights/search", { method: "POST", body: JSON.stringify({ ...search, departDate: "2020-01-01" }) });
  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /já passou/);
  const r2 = await call("/api/flights/search", { method: "POST", body: JSON.stringify({ ...search, destination: ["FOR"] }) });
  assert.match((await r2.json()).error, /diferentes/);
  config.serpApiKey = "";
});

test("busca completa com o fornecedor simulado: ida, volta e opções de compra", async () => {
  config.serpApiKey = "chave-teste";
  const seen: string[] = [];
  globalThis.fetch = (async (url: string | URL | Request) => {
    const u = String(url);
    seen.push(u);
    const q = new URL(u).searchParams;
    const body = q.get("booking_token") ? serpBooking : q.get("departure_token") ? serpReturn : serpFlights;
    return new Response(JSON.stringify(body), { status: 200 });
  }) as typeof fetch;
  try {
    const r = await call("/api/flights/search", { method: "POST", body: JSON.stringify(search) });
    assert.equal(r.status, 200);
    const data = await r.json();
    assert.equal(data.offers.length, 2);
    assert.equal(data.offers[0].price.total, 1100, "ordenado pelo menor preço");
    assert.ok(data.providers.find((p: { provider: string; ok: boolean }) => p.provider === "serpapi").ok);
    assert.ok(data.providers.find((p: { provider: string; notConfigured: boolean }) => p.provider === "duffel").notConfigured);
    assert.ok(!seen.some((u) => u.includes("chave-teste") === false), "a chave vai só para o fornecedor");

    const first = data.offers.find((o: { booking: { kind: string } }) => o.booking.kind === "serpapi_return");
    const rr = await call("/api/flights/returns", { method: "POST", body: JSON.stringify({ search, token: first.booking.token, outbound: first.legs[0] }) });
    const ret = await rr.json();
    assert.equal(ret.offers[0].legs.length, 2, "ida + volta");
    assert.equal(ret.offers[0].booking.kind, "serpapi_booking");

    const br = await call("/api/flights/booking", { method: "POST", body: JSON.stringify({ search, token: ret.offers[0].booking.token }) });
    const book = await br.json();
    assert.equal(book.options[0].seller, "LATAM", "companhia aérea primeiro");
    assert.equal(book.options[0].request.postData, "u=def");
    assert.ok(book.options[0].baggage.includes("1ª mala despachada: 150"));
  } finally {
    globalThis.fetch = realFetch;
    config.serpApiKey = "";
  }
});

test("contas e viagens salvas", async () => {
  const reg = await call("/api/auth/register", { method: "POST", body: JSON.stringify({ email: "ana@exemplo.com", password: "senha-forte-1", name: "Ana" }) });
  assert.equal(reg.status, 201);
  const { token } = await reg.json();
  const dupe = await call("/api/auth/register", { method: "POST", body: JSON.stringify({ email: "ANA@exemplo.com", password: "outra-senha-1" }) });
  assert.equal(dupe.status, 400);
  const wrong = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "ana@exemplo.com", password: "errada" }) });
  assert.equal(wrong.status, 401);
  const auth = { Authorization: `Bearer ${token}` };
  const trip = { id: "t1", name: "Paris", travelers: 2, currency: "BRL", activities: [], restaurants: [], addresses: [], expenses: [], notes: "", createdAt: "x", updatedAt: "2026-11-25T10:00:00Z" };
  assert.equal((await call("/api/trips/t1", { method: "PUT", headers: auth, body: JSON.stringify(trip) })).status, 200);
  const list = await (await call("/api/trips", { headers: auth })).json();
  assert.equal(list.trips[0].name, "Paris");
  assert.equal((await call("/api/trips")).status, 401);
  assert.equal((await call("/api/trips/t1", { method: "DELETE", headers: auth })).status, 200);
  await call("/api/auth/logout", { method: "POST", headers: auth });
  assert.equal((await call("/api/auth/me", { headers: auth })).status, 401);
});
