// Lê o token «Authorization: Bearer …» e identifica a conta.

import type { DatabaseSync } from "node:sqlite";
import { HttpError, type Req } from "../http/router.ts";
import { userForToken, type User } from "../models/users.ts";

export function bearer(req: Req): string | null {
  const h = req.headers.authorization;
  return h?.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

export function requireUser(db: DatabaseSync, req: Req): User {
  const token = bearer(req);
  const user = token ? userForToken(db, token) : undefined;
  if (!user) throw new HttpError(401, "unauthorized", "Entre na sua conta para continuar.");
  return user;
}
