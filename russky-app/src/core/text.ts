// Ferramentas de texto para russo: acento tônico, normalização, transliteração.

export const STRESS = "́";

/** Tira o acento tônico (а́ → а). */
export function stripStress(s: string): string {
  return s.replace(/́/g, "");
}

/** Letras latinas que parecem cirílicas (para avisar quem digita com o teclado errado). */
export const LATIN_LOOKALIKE: Record<string, string> = {
  a: "а", e: "е", o: "о", p: "р", c: "с", y: "у", x: "х", k: "к", m: "м", t: "т", h: "н", b: "в",
  A: "А", E: "Е", O: "О", P: "Р", C: "С", Y: "У", X: "Х", K: "К", M: "М", T: "Т", H: "Н", B: "В",
};

const CYR = /[Ѐ-ӿ]/;
const LAT = /[a-z]/i;

/** A palavra mistura letras latinas parecidas com cirílicas? Ex.: "привeт" com e latino. */
export function hasMixedScript(word: string): boolean {
  return CYR.test(word) && LAT.test(word);
}

/** Troca as letras latinas parecidas por cirílicas dentro de palavras que já têm cirílico. */
export function fixLookalikes(s: string): string {
  return s.replace(/[\p{L}́-]+/gu, (w) =>
    CYR.test(w) ? w.replace(/[a-zA-Z]/g, (ch) => LATIN_LOOKALIKE[ch] ?? ch) : w,
  );
}

/**
 * Forma de comparação: minúsculas, sem acento tônico, ё = е, sem pontuação
 * e com espaços simples. "Привет, Аня!" → "привет аня".
 */
export function normalize(s: string): string {
  return stripStress(s)
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[«»"“”„'’`.,!?;:()…–—]/g, " ")
    .replace(/(^|\s)-+|-+(\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Palavras de uma frase, sem pontuação (mantém hífen interno: "что-то"). */
export function words(s: string): string[] {
  const n = normalize(s);
  return n ? n.split(" ") : [];
}

/** Separa a frase em pedaços para o banco de palavras, mantendo maiúsculas e acentos. */
export function tokensOf(s: string): string[] {
  return s
    .replace(/[«»"“”„.,!?;:()…]/g, " ")
    .replace(/\s[–—-]\s/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

// ---------- Transliteração de apoio (padrão simples para brasileiros) ----------

const TR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "ie", ё: "io", ж: "j", з: "z", и: "i", й: "i",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "kh", ц: "ts", ч: "tch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "'", э: "e", ю: "iu", я: "ia",
};

/** Transliteração letra a letra (mantém o acento como vogal com acento agudo). */
export function transliterate(s: string): string {
  let out = "";
  const chars = [...s];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === STRESS) {
      out = out.replace(/([aeiouy])([^aeiouy]*)$/i, (_, v: string, rest: string) => accent(v) + rest);
      continue;
    }
    const low = ch.toLowerCase();
    let t = TR[low];
    if (t === undefined) {
      out += ch;
      continue;
    }
    // е/ё/ю/я depois de consoante amolecem a consoante: "ie" → "e" é mais fiel
    const prev = (chars[i - 1] ?? "").toLowerCase();
    if ("еёюя".includes(low) && prev && TR[prev] !== undefined && !"аеёиоуыэюяьъ".includes(prev)) {
      t = { е: "e", ё: "io", ю: "iu", я: "ia" }[low]!;
    }
    out += ch !== low && t ? t[0].toUpperCase() + t.slice(1) : t;
  }
  return out;
}

function accent(v: string): string {
  const map: Record<string, string> = { a: "á", e: "é", i: "í", o: "ó", u: "ú", y: "ý", A: "Á", E: "É", I: "Í", O: "Ó", U: "Ú", Y: "Ý" };
  return map[v] ?? v;
}

/** Índice da vogal tônica (no texto sem acento) ou -1. */
export function stressIndex(s: string): number {
  const i = s.indexOf(STRESS);
  return i < 0 ? -1 : i - 1;
}

export function isCyrillic(s: string): boolean {
  return CYR.test(s);
}

/** Embaralha com um gerador de números dado (para testes reprodutíveis). */
export function shuffle<T>(list: T[], rnd: () => number = Math.random): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Gerador pseudoaleatório com semente (mulberry32). */
export function seeded(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
