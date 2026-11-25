// Voos: busca, voos de volta (ida e volta) e opções de compra.

import type { FlightLeg } from "../../../shared/types.ts";
import { HttpError, type Req, type Reply } from "../http/router.ts";
import { FLIGHT_PROVIDERS, searchFlights } from "../services/flights/index.ts";
import { serpApiFlights } from "../services/flights/serpapi.ts";
import { parseFlightSearch } from "../utils/validate.ts";

const notConfigured = () => new HttpError(503, "not_configured", "Nenhum fornecedor de voos está configurado no servidor (SERPAPI_KEY ou DUFFEL_TOKEN).");

export async function search(req: Req): Promise<Reply> {
  if (!FLIGHT_PROVIDERS.some((p) => p.configured())) throw notConfigured();
  const params = parseFlightSearch((req.body ?? {}) as Record<string, unknown>);
  return { json: await searchFlights(params) };
}

export async function returns(req: Req): Promise<Reply> {
  if (!serpApiFlights.configured()) throw notConfigured();
  const b = (req.body ?? {}) as Record<string, unknown>;
  const params = parseFlightSearch((b.search ?? {}) as Record<string, unknown>);
  if (typeof b.token !== "string" || !b.token) throw new HttpError(400, "bad_request", "Token da ida ausente.");
  const outbound = b.outbound as FlightLeg;
  if (!outbound?.segments?.length) throw new HttpError(400, "bad_request", "Voo de ida ausente.");
  const r = await serpApiFlights.returnFlights(params, b.token, outbound);
  return { json: { offers: r.offers, providers: [{ provider: "serpapi", label: serpApiFlights.label, ok: true, count: r.offers.length }], fetchedAt: new Date().toISOString(), notes: r.notes } };
}

export async function booking(req: Req): Promise<Reply> {
  if (!serpApiFlights.configured()) throw notConfigured();
  const b = (req.body ?? {}) as Record<string, unknown>;
  const params = parseFlightSearch((b.search ?? {}) as Record<string, unknown>);
  if (typeof b.token !== "string" || !b.token) throw new HttpError(400, "bad_request", "Token da oferta ausente.");
  return { json: await serpApiFlights.bookingOptions(params, b.token) };
}
