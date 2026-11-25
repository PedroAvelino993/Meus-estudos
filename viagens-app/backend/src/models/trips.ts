// Viagens salvas por conta (o conteúdo é o objeto Trip em JSON).

import type { DatabaseSync } from "node:sqlite";
import type { Trip } from "../../../shared/types.ts";

export function listTrips(db: DatabaseSync, userId: string): Trip[] {
  const rows = db.prepare("SELECT data FROM trips WHERE user_id = ? ORDER BY updated_at DESC").all(userId) as { data: string }[];
  return rows.map((r) => JSON.parse(r.data) as Trip);
}

export function saveTrip(db: DatabaseSync, userId: string, trip: Trip) {
  db.prepare("INSERT INTO trips (id, user_id, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at").run(trip.id, userId, JSON.stringify(trip), trip.updatedAt);
}

export function deleteTrip(db: DatabaseSync, userId: string, id: string): boolean {
  return db.prepare("DELETE FROM trips WHERE user_id = ? AND id = ?").run(userId, id).changes > 0;
}
