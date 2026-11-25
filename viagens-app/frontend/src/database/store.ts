// Armazenamento local (no aparelho) com aviso de mudança para a interface.
// Tudo funciona sem conta; com conta, as viagens também vão para o servidor (sync.ts).

type Listener = () => void;
const listeners = new Set<Listener>();
const PREFIX = "rota:";

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Sem espaço: o navegador recusou; a interface continua com o que já tinha
  }
  for (const l of listeners) l();
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

// Outra aba mudou os dados
if (typeof window !== "undefined") window.addEventListener("storage", (e) => e.key?.startsWith(PREFIX) && listeners.forEach((l) => l()));
