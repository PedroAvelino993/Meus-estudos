// Contas e viagens salvas na nuvem.

import type { DatabaseSync } from "node:sqlite";
import type { Trip } from "../../../shared/types.ts";
import { HttpError, type Req, type Reply } from "../http/router.ts";
import { bearer, requireUser } from "../middleware/auth.ts";
import { deleteTrip, listTrips, saveTrip } from "../models/trips.ts";
import { createSession, createUser, deleteSession, findUserByEmail, verifyPassword } from "../models/users.ts";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function accountController(db: DatabaseSync) {
  return {
    register(req: Req): Reply {
      const b = (req.body ?? {}) as Record<string, unknown>;
      const email = String(b.email ?? "").trim();
      const name = String(b.name ?? "").trim().slice(0, 80) || email.split("@")[0];
      const password = String(b.password ?? "");
      if (!EMAIL.test(email)) throw new HttpError(400, "bad_request", "E-mail inválido.");
      if (password.length < 8) throw new HttpError(400, "bad_request", "A senha precisa ter pelo menos 8 caracteres.");
      if (findUserByEmail(db, email)) throw new HttpError(400, "bad_request", "Já existe uma conta com este e-mail.");
      const user = createUser(db, email, name, password);
      return { status: 201, json: { user, token: createSession(db, user.id) } };
    },
    login(req: Req): Reply {
      const b = (req.body ?? {}) as Record<string, unknown>;
      const u = findUserByEmail(db, String(b.email ?? "").trim());
      if (!u || !verifyPassword(String(b.password ?? ""), u.password_hash)) throw new HttpError(401, "unauthorized", "E-mail ou senha incorretos.");
      return { json: { user: { id: u.id, email: u.email, name: u.name }, token: createSession(db, u.id) } };
    },
    me(req: Req): Reply {
      return { json: { user: requireUser(db, req) } };
    },
    logout(req: Req): Reply {
      const t = bearer(req);
      if (t) deleteSession(db, t);
      return { json: { ok: true } };
    },
    trips(req: Req): Reply {
      const u = requireUser(db, req);
      return { json: { trips: listTrips(db, u.id) } };
    },
    putTrip(req: Req): Reply {
      const u = requireUser(db, req);
      const trip = req.body as Trip;
      if (!trip || trip.id !== req.params.id || typeof trip.name !== "string" || typeof trip.updatedAt !== "string") throw new HttpError(400, "bad_request", "Viagem inválida.");
      saveTrip(db, u.id, trip);
      return { json: { ok: true } };
    },
    deleteTrip(req: Req): Reply {
      const u = requireUser(db, req);
      if (!deleteTrip(db, u.id, req.params.id)) throw new HttpError(404, "not_found", "Viagem não encontrada.");
      return { json: { ok: true } };
    },
  };
}
