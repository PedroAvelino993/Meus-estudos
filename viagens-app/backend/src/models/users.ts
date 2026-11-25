// Contas: senha com scrypt (sal aleatório) e sessões com token aleatório (só o hash fica no banco).

import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

export interface User {
  id: string;
  email: string;
  name: string;
}

const SESSION_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [alg, saltHex, hashHex] = stored.split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const got = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, got);
}

const sha = (t: string) => createHash("sha256").update(t).digest("hex");

export function createUser(db: DatabaseSync, email: string, name: string, password: string): User {
  const id = randomUUID();
  db.prepare("INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)").run(id, email.toLowerCase(), name, hashPassword(password), new Date().toISOString());
  return { id, email: email.toLowerCase(), name };
}

export function findUserByEmail(db: DatabaseSync, email: string): (User & { password_hash: string }) | undefined {
  return db.prepare("SELECT id, email, name, password_hash FROM users WHERE email = ?").get(email.toLowerCase()) as (User & { password_hash: string }) | undefined;
}

export function createSession(db: DatabaseSync, userId: string): string {
  const token = randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(sha(token), userId, Date.now() + SESSION_DAYS * 86_400_000);
  return token;
}

export function userForToken(db: DatabaseSync, token: string): User | undefined {
  const row = db.prepare("SELECT u.id, u.email, u.name, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?").get(sha(token)) as (User & { expires_at: number }) | undefined;
  if (!row || row.expires_at < Date.now()) return undefined;
  return { id: row.id, email: row.email, name: row.name };
}

export function deleteSession(db: DatabaseSync, token: string) {
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha(token));
}
