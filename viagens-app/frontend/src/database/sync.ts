// Sincronização das viagens com a conta no servidor: vale a versão editada por último.

import type { Trip } from "../types";
import { api } from "../api/client";
import { read, write } from "./store";
import { getSession } from "./session";

export async function syncTrips(): Promise<{ sent: number; received: number }> {
  if (!getSession()) return { sent: 0, received: 0 };
  const remote = (await api<{ trips: Trip[] }>("/api/trips", { auth: true })).trips;
  const local = read<Trip[]>("trips", []);
  const deleted = new Set(read<string[]>("trips:deleted", []));
  const byId = new Map<string, Trip>();
  let received = 0;
  let sent = 0;
  for (const t of local) byId.set(t.id, t);
  for (const r of remote) {
    if (deleted.has(r.id)) {
      await api(`/api/trips/${encodeURIComponent(r.id)}`, { method: "DELETE", auth: true }).catch(() => undefined);
      continue;
    }
    const l = byId.get(r.id);
    if (!l || r.updatedAt > l.updatedAt) {
      byId.set(r.id, r);
      received++;
    }
  }
  for (const t of byId.values()) {
    const r = remote.find((x) => x.id === t.id);
    if (!r || t.updatedAt > r.updatedAt) {
      await api(`/api/trips/${encodeURIComponent(t.id)}`, { method: "PUT", body: t, auth: true });
      sent++;
    }
  }
  write("trips", [...byId.values()]);
  write("trips:deleted", []);
  return { sent, received };
}
