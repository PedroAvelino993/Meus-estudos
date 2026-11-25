// CORS: só os endereços do frontend configurados em ALLOWED_ORIGINS podem chamar a API.

import type { IncomingMessage, ServerResponse } from "node:http";

export function applyCors(req: IncomingMessage, res: ServerResponse, allowed: string[]): boolean {
  const origin = req.headers.origin;
  if (origin && (allowed.includes(origin) || allowed.includes("*"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Max-Age", "600");
  }
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
}
