// Cliente da API do backend. Erros chegam com um código estável (ex.: not_configured)
// para a interface explicar o que falta, sem fingir que funcionou.

import type { ApiError, ServerStatus } from "../types";
import { apiUrl } from "../config";
import { getSession } from "../database/session";

export class ApiRequestError extends Error {
  code: ApiError["code"] | "no_server" | "offline";
  status: number;
  constructor(message: string, code: ApiRequestError["code"], status = 0) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function hasServer(): boolean {
  return !!apiUrl();
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean; signal?: AbortSignal } = {}): Promise<T> {
  const base = apiUrl();
  if (!base) throw new ApiRequestError("O servidor do app ainda não foi configurado (Ajustes → Servidor).", "no_server");
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  const session = getSession();
  if (init.auth && session) headers.Authorization = `Bearer ${session.token}`;
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, { method: init.method ?? (init.body !== undefined ? "POST" : "GET"), headers, body: init.body !== undefined ? JSON.stringify(init.body) : undefined, signal: init.signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiRequestError(navigator.onLine ? `Não foi possível falar com o servidor (${base}). Confira o endereço em Ajustes.` : "Você está sem internet.", navigator.onLine ? "no_server" : "offline");
  }
  const data = (await res.json().catch(() => null)) as (T & Partial<ApiError>) | null;
  if (!res.ok) throw new ApiRequestError(data?.error ?? `Erro ${res.status} no servidor.`, (data?.code as ApiError["code"]) ?? "server_error", res.status);
  return data as T;
}

/**
 * Por que o servidor não respondeu? Se uma chamada sem CORS chega, o servidor está no ar mas
 * não autoriza este site (ALLOWED_ORIGINS); se nem ela chega, está fora do ar ou dormindo.
 */
export async function diagnoseServer(): Promise<"cors" | "down"> {
  const base = apiUrl();
  try {
    await fetch(`${base}/api/status`, { mode: "no-cors" });
    return "cors";
  } catch {
    return "down";
  }
}

let statusCache: { at: number; value: ServerStatus | null; url: string } | null = null;

/** O que o servidor tem configurado (fornecedores, contas). null = sem servidor. */
export async function serverStatus(force = false): Promise<ServerStatus | null> {
  const url = apiUrl();
  if (!url) return null;
  if (!force && statusCache && statusCache.url === url && Date.now() - statusCache.at < 60_000) return statusCache.value;
  try {
    const value = await api<ServerStatus>("/api/status");
    statusCache = { at: Date.now(), value, url };
    return value;
  } catch {
    statusCache = { at: Date.now(), value: null, url };
    return null;
  }
}
