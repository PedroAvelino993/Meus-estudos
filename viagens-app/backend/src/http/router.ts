// Roteador HTTP mínimo (sem dependências): rotas com parâmetros (:id), JSON e erros padronizados.

import type { IncomingMessage, ServerResponse } from "node:http";
import type { ApiError } from "../../../shared/types.ts";

export interface Req {
  method: string;
  path: string;
  query: URLSearchParams;
  params: Record<string, string>;
  headers: IncomingMessage["headers"];
  ip: string;
  body: unknown;
  /** Preenchido pelo middleware de autenticação. */
  userId?: string;
}

export type Handler = (req: Req) => Promise<Reply> | Reply;
export interface Reply {
  status?: number;
  json?: unknown;
  headers?: Record<string, string>;
}

export class HttpError extends Error {
  status: number;
  code: ApiError["code"];
  constructor(status: number, code: ApiError["code"], message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface Route {
  method: string;
  parts: string[];
  handler: Handler;
}

export class Router {
  private routes: Route[] = [];

  add(method: string, pattern: string, handler: Handler) {
    this.routes.push({ method, parts: pattern.split("/").filter(Boolean), handler });
    return this;
  }
  get(p: string, h: Handler) {
    return this.add("GET", p, h);
  }
  post(p: string, h: Handler) {
    return this.add("POST", p, h);
  }
  put(p: string, h: Handler) {
    return this.add("PUT", p, h);
  }
  delete(p: string, h: Handler) {
    return this.add("DELETE", p, h);
  }

  match(method: string, path: string): { handler: Handler; params: Record<string, string> } | null {
    const parts = path.split("/").filter(Boolean);
    for (const r of this.routes) {
      if (r.method !== method || r.parts.length !== parts.length) continue;
      const params: Record<string, string> = {};
      let ok = true;
      for (let i = 0; i < parts.length; i++) {
        const p = r.parts[i];
        if (p.startsWith(":")) params[p.slice(1)] = decodeURIComponent(parts[i]);
        else if (p !== parts[i]) {
          ok = false;
          break;
        }
      }
      if (ok) return { handler: r.handler, params };
    }
    return null;
  }
}

export async function readBody(req: IncomingMessage, limit = 1_000_000): Promise<unknown> {
  if (req.method === "GET" || req.method === "HEAD") return null;
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > limit) throw new HttpError(413, "bad_request", "Corpo da requisição grande demais.");
    chunks.push(c as Buffer);
  }
  if (!chunks.length) return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "bad_request", "JSON inválido.");
  }
}

export function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  const data = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
  res.end(data);
}

export function clientIp(req: IncomingMessage): string {
  const fwd = req.headers["x-forwarded-for"];
  const first = Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0];
  return (first ?? req.socket.remoteAddress ?? "desconhecido").trim();
}
