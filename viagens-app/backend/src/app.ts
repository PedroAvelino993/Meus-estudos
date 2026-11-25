// Monta o servidor HTTP: CORS, limite de buscas, rotas da API e (opcional) o site compilado.

import { createServer, type Server } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import type { Config } from "./config/env.ts";
import { HttpError, clientIp, readBody, send } from "./http/router.ts";
import { applyCors } from "./middleware/cors.ts";
import { createRateLimiter } from "./middleware/rateLimit.ts";
import { openDb } from "./models/db.ts";
import { LIMITED, buildRouter } from "./routes/index.ts";

const MIME: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json", ".ico": "image/x-icon" };

export function createApp(cfg: Config): Server {
  const db = cfg.accountsEnabled ? openDb(cfg.databaseFile) : null;
  const router = buildRouter(db);
  const limit = createRateLimiter(cfg.rateLimitPerMinute);

  return createServer(async (req, res) => {
    try {
      if (applyCors(req, res, cfg.allowedOrigins)) return;
      const url = new URL(req.url ?? "/", "http://local");
      if (url.pathname.startsWith("/api/")) {
        const m = router.match(req.method ?? "GET", url.pathname);
        if (!m) throw new HttpError(404, "not_found", "Rota não encontrada.");
        const ip = clientIp(req);
        if (LIMITED.has(url.pathname)) limit(ip);
        const body = await readBody(req);
        const reply = await m.handler({ method: req.method ?? "GET", path: url.pathname, query: url.searchParams, params: m.params, headers: req.headers, ip, body });
        send(res, reply.status ?? 200, reply.json ?? null, reply.headers);
        return;
      }
      if (cfg.staticDir) return await serveStatic(cfg.staticDir, url.pathname, res);
      send(res, 404, { error: "Não encontrado.", code: "not_found" });
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: e.message, code: e.code });
      console.error("[erro]", e);
      send(res, 502, { error: (e as Error).message || "Erro no servidor.", code: "provider_error" });
    }
  });
}

async function serveStatic(dir: string, path: string, res: import("node:http").ServerResponse) {
  const safe = normalize(decodeURIComponent(path)).replace(/^(\.\.[/\\])+/, "");
  let file = join(dir, safe);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
  } catch {
    file = join(dir, "index.html");
  }
  try {
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream" });
    res.end(data);
  } catch {
    send(res, 404, { error: "Não encontrado.", code: "not_found" });
  }
}
