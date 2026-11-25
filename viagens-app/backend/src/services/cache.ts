// Cache em memória com validade: evita gastar a cota das APIs repetindo a mesma busca.
// O horário original da busca (fetchedAt) é preservado — o usuário vê quando o preço foi obtido.

interface Entry<T> {
  value: T;
  expires: number;
}

export class TtlCache<T> {
  private map = new Map<string, Entry<T>>();
  private ttlMs: number;
  private max: number;
  constructor(ttlMs: number, max = 500) {
    this.ttlMs = ttlMs;
    this.max = max;
  }
  get(key: string): T | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (e.expires < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    return e.value;
  }
  set(key: string, value: T) {
    if (this.map.size >= this.max) {
      const first = this.map.keys().next().value;
      if (first !== undefined) this.map.delete(first);
    }
    this.map.set(key, { value, expires: Date.now() + this.ttlMs });
  }
}
