// Chamadas HTTP para fornecedores externos, com limite de tempo e erros legíveis.

export class ProviderError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ProviderError";
    this.status = status;
  }
}

export async function fetchJson<T>(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const { timeoutMs = 45_000, ...rest } = init;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...rest, signal: ctrl.signal });
    const text = await res.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    if (!res.ok) {
      const msg = extractError(body) ?? `HTTP ${res.status}`;
      throw new ProviderError(msg, res.status);
    }
    return body as T;
  } catch (e) {
    if (e instanceof ProviderError) throw e;
    if ((e as Error).name === "AbortError") throw new ProviderError(`O fornecedor não respondeu em ${Math.round(timeoutMs / 1000)} s`);
    throw new ProviderError(`Falha de conexão com o fornecedor: ${(e as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}

function extractError(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.error === "string") return b.error;
  // Duffel: { errors: [{ message, title }] }
  if (Array.isArray(b.errors) && b.errors.length) {
    const e = b.errors[0] as Record<string, unknown>;
    return String(e.message ?? e.title ?? "erro do fornecedor");
  }
  return null;
}
