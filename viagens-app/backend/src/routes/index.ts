// Tabela de rotas da API (todas sob /api).

import type { DatabaseSync } from "node:sqlite";
import { Router } from "../http/router.ts";
import * as flights from "../controllers/flights.controller.ts";
import * as hotels from "../controllers/hotels.controller.ts";
import * as statusCtl from "../controllers/status.controller.ts";
import { accountController } from "../controllers/account.controller.ts";

export function buildRouter(db: DatabaseSync | null): Router {
  const r = new Router()
    .get("/api/status", statusCtl.status)
    .get("/api/deals", statusCtl.deals)
    .post("/api/flights/search", flights.search)
    .post("/api/flights/returns", flights.returns)
    .post("/api/flights/booking", flights.booking)
    .post("/api/hotels/search", hotels.search);
  if (db) {
    const a = accountController(db);
    r.post("/api/auth/register", a.register)
      .post("/api/auth/login", a.login)
      .get("/api/auth/me", a.me)
      .post("/api/auth/logout", a.logout)
      .get("/api/trips", a.trips)
      .put("/api/trips/:id", a.putTrip)
      .delete("/api/trips/:id", a.deleteTrip);
  }
  return r;
}

/** Rotas que consultam APIs pagas: passam pelo limite por IP. */
export const LIMITED = new Set(["/api/flights/search", "/api/flights/returns", "/api/flights/booking", "/api/hotels/search"]);
