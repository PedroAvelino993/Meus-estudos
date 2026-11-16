// Perfil do aparelho, diagnóstico de erros, limites de tempo e detecção de fechamento forçado.

// ---------- Aparelho ----------

export function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** Memória aproximada (GB). O Safari não informa: celulares Apple são tratados como 4 GB. */
export function deviceMemory(): number {
  const dm = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (dm) return dm;
  return isMobile() ? 4 : 8;
}

/** Aparelho com pouca memória para vídeo + IA: usa modelos menores e menos memória. */
export function lowMemory(): boolean {
  return isMobile() || deviceMemory() <= 4 || localStorage.getItem("gca:safe") === "1";
}

export function deviceSummary(): string {
  const n = navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number };
  return `${navigator.userAgent} · memória ${n.deviceMemory ?? "?"} GB · ${n.hardwareConcurrency ?? "?"} núcleos · tela ${screen.width}×${screen.height}`;
}

// ---------- Limites de tempo ----------

export class StallError extends Error {
  constructor(what: string) {
    super(`${what} parou de responder. O aparelho pode estar sem memória ou o formato do vídeo não é bem suportado.`);
    this.name = "StallError";
  }
}

/** Espera uma promessa, mas desiste depois de `ms` (evita travar para sempre). */
export function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    p.finally(() => clearTimeout(timer)),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new StallError(what)), ms);
    }),
  ]);
}

/** Percorre um iterador assíncrono com limite de tempo por item. */
export async function* guarded<T>(it: AsyncIterable<T>, ms: number, what: string): AsyncGenerator<T> {
  const iter = it[Symbol.asyncIterator]();
  try {
    for (;;) {
      const r = await withTimeout(iter.next(), ms, what);
      if (r.done) return;
      yield r.value;
    }
  } finally {
    // Libera o decodificador sem esperar por ele (ele pode estar travado)
    void Promise.resolve(iter.return?.()).catch(() => undefined);
  }
}

/** Devolve o controle ao navegador (a tela não congela durante processamentos longos). */
export function breathe(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

// ---------- Registro de erros ----------

export interface ErrorEntry {
  at: number;
  where: string;
  message: string;
  stack?: string;
}

const LOG = "gca:errors";

export function logError(where: string, err: unknown) {
  try {
    const e = err instanceof Error ? err : new Error(String(err));
    const list: ErrorEntry[] = JSON.parse(localStorage.getItem(LOG) ?? "[]");
    list.unshift({ at: Date.now(), where, message: e.message, stack: e.stack?.split("\n").slice(0, 6).join("\n") });
    localStorage.setItem(LOG, JSON.stringify(list.slice(0, 30)));
  } catch {
    /* sem espaço: ignora */
  }
}

export function errorLog(): ErrorEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOG) ?? "[]");
  } catch {
    return [];
  }
}

export function clearErrorLog() {
  localStorage.removeItem(LOG);
}

// ---------- Fechamento forçado ----------
// Antes de uma tarefa pesada grava um marcador; se a página for fechada pelo navegador
// (falta de memória) o marcador fica, e na próxima abertura o app sabe o que aconteceu.

const BUSY = "gca:busy";

export interface BusyMark {
  kind: "analise" | "exportacao" | "legendas";
  projectId: string;
  label: string;
  at: number;
  detail: Record<string, unknown>;
}

const active = new Map<string, BusyMark>();

function persist() {
  try {
    if (active.size) localStorage.setItem(BUSY, JSON.stringify([...active.values()]));
    else localStorage.removeItem(BUSY);
  } catch {
    /* ignora */
  }
}

export function markBusy(id: string, m: BusyMark) {
  active.set(id, m);
  persist();
}

export function clearBusy(id: string) {
  active.delete(id);
  persist();
}

/** Tarefas que estavam rodando quando a página foi fechada à força (na abertura anterior). */
export function takeCrashed(): BusyMark[] {
  try {
    const raw = localStorage.getItem(BUSY);
    localStorage.removeItem(BUSY);
    return raw ? (JSON.parse(raw) as BusyMark[]) : [];
  } catch {
    return [];
  }
}
