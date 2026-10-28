// Motor de conversas ramificadas. Cada fala do estudante é comparada com as intenções
// esperadas por padrões flexíveis, que aceitam várias formulações válidas.
//
// Sintaxe dos padrões (sobre o texto normalizado, sem acento nem pontuação):
//   palavra         precisa aparecer
//   (a|b c)         uma das alternativas
//   [a b]           opcional
//   {nome}          captura uma ou duas palavras (o nome do estudante, por exemplo)
//   *               qualquer sequência de palavras (inclusive nenhuma)

import { compareWord, explainDiff } from "./evaluate";
import { fixLookalikes, hasMixedScript, isCyrillic, levenshtein, normalize, words } from "./text";
import type { Mood } from "../content/characters";

export type Flags = Record<string, string | boolean | number>;

export interface Cond {
  flag: string;
  eq?: string | boolean | number;
  not?: boolean;
}

export interface Line {
  ru: string;
  pt: string;
  mood?: Mood;
  if?: Cond;
  /** Outras formas de dizer a mesma coisa (sorteadas para a conversa não ficar repetitiva). */
  alts?: { ru: string; pt: string }[];
}

export interface Option {
  id: string;
  /** Resposta modelo. Pode ter {name} (nome do estudante). */
  ru: string;
  pt: string;
  patterns: string[];
  next: string;
  set?: Flags;
  /** Observação mostrada no retorno (ex.: registro informal demais). */
  note?: string;
  if?: Cond;
  /** Se o modelo não aparece entre as opções no modo fácil (ex.: resposta de brincadeira). */
  hiddenInEasy?: boolean;
}

export interface Node {
  id: string;
  say: Line[];
  /** Dica de cena em português (ex.: o que mostra o mapa). */
  hint?: string;
  reply?: { options: Option[]; retry: Line };
  next?: string;
  end?: boolean;
}

export interface Conversation {
  id: string;
  character: string;
  title: string;
  place: string;
  level: string;
  goal: string;
  requires: string[];
  skills: string[];
  vocabulary: string[];
  start: string;
  nodes: Node[];
}

// ---------- Padrões ----------

type Elem =
  | { k: "word"; w: string }
  | { k: "alt"; seqs: Elem[][] }
  | { k: "opt"; seq: Elem[] }
  | { k: "slot"; name: string }
  | { k: "any" };

function parse(pattern: string): Elem[] {
  const src = pattern.trim();
  let i = 0;
  function seq(stop: string[]): Elem[] {
    const out: Elem[] = [];
    while (i < src.length) {
      const c = src[i];
      if (stop.includes(c)) break;
      if (c === " ") {
        i++;
        continue;
      }
      if (c === "(") {
        i++;
        const seqs: Elem[][] = [seq(["|", ")"])];
        while (src[i] === "|") {
          i++;
          seqs.push(seq(["|", ")"]));
        }
        i++; // )
        out.push({ k: "alt", seqs });
      } else if (c === "[") {
        i++;
        const seqs: Elem[][] = [seq(["|", "]"])];
        while (src[i] === "|") {
          i++;
          seqs.push(seq(["|", "]"]));
        }
        i++; // ]
        out.push({ k: "opt", seq: seqs.length === 1 ? seqs[0] : [{ k: "alt", seqs }] });
      } else if (c === "{") {
        const end = src.indexOf("}", i);
        out.push({ k: "slot", name: src.slice(i + 1, end) });
        i = end + 1;
      } else if (c === "*") {
        i++;
        out.push({ k: "any" });
      } else {
        let j = i;
        while (j < src.length && !" ()[]{}|*".includes(src[j])) j++;
        const w = normalize(src.slice(i, j));
        if (w) out.push({ k: "word", w });
        i = j === i ? i + 1 : j;
      }
    }
    return out;
  }
  return seq([]);
}

function toRegex(elems: Elem[]): string {
  return elems
    .map((e) => {
      switch (e.k) {
        case "word":
          return `${escape(e.w)} `;
        case "alt":
          return `(?:${e.seqs.map(toRegex).join("|")})`;
        case "opt":
          return `(?:${toRegex(e.seq)})?`;
        case "slot":
          return `(?<${e.name}>\\S+(?: \\S+)?) `;
        case "any":
          return `(?:\\S+ )*`;
      }
    })
    .join("");
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const cache = new Map<string, { re: RegExp; elems: Elem[] }>();

function compiled(pattern: string) {
  let c = cache.get(pattern);
  if (!c) {
    const elems = parse(pattern);
    c = { re: new RegExp(`^${toRegex(elems)}$`), elems };
    cache.set(pattern, c);
  }
  return c;
}

/** O texto corresponde exatamente ao padrão? Devolve as capturas. */
export function matchPattern(input: string, pattern: string): Record<string, string> | null {
  const text = normalize(input);
  if (!text) return null;
  const m = compiled(pattern).re.exec(text + " ");
  if (!m) return null;
  return { ...(m.groups ?? {}) };
}

/** Todas as sequências concretas de palavras que o padrão aceita (limitadas). */
export function expand(pattern: string, limit = 64): string[][] {
  const { elems } = compiled(pattern);
  let out: string[][] = [[]];
  const go = (list: Elem[], acc: string[][]): string[][] => {
    let cur = acc;
    for (const e of list) {
      if (e.k === "word") cur = cur.map((s) => [...s, e.w]);
      else if (e.k === "slot") cur = cur.map((s) => [...s, `{${e.name}}`]);
      else if (e.k === "any") cur = cur.map((s) => [...s, "*"]);
      else if (e.k === "opt") cur = [...cur, ...go(e.seq, cur)];
      else if (e.k === "alt") cur = e.seqs.flatMap((sq) => go(sq, cur));
      if (cur.length > limit) cur = cur.slice(0, limit);
    }
    return cur;
  };
  out = go(elems, out);
  return out;
}

export interface Understanding {
  option: Option;
  /** Nome capturado, se houver. */
  slots: Record<string, string>;
  /** Exato (true) ou entendido com correções. */
  exact: boolean;
  /** Forma corrigida para mostrar ao estudante. */
  corrected: string;
  why?: string;
  note?: string;
}

/**
 * Tenta entender a resposta do estudante entre as opções do nó.
 * Aceita formulações diferentes do modelo (padrões) e pequenos erros:
 * erros de digitação e uma terminação errada ainda são compreendidos,
 * mas aparecem no retorno com a forma correta.
 */
export function understand(input: string, options: Option[], fill: (s: string) => string): Understanding | null {
  let raw = input.trim();
  if (!raw) return null;
  let note: string | undefined;
  if (!isCyrillic(raw)) return null;
  if (raw.split(/\s+/).some(hasMixedScript)) {
    raw = fixLookalikes(raw);
    note = "Algumas letras estavam no alfabeto latino; corrigimos.";
  }

  for (const option of options) {
    for (const p of option.patterns) {
      const slots = matchPattern(raw, p);
      if (slots) return { option, slots, exact: true, corrected: fill(option.ru), note: joinNotes(note, option.note) };
    }
  }

  // Aproximado: compara com cada forma concreta dos padrões
  const got = words(raw);
  let best: { option: Option; cost: number; diff: ReturnType<typeof alignWithSlots>; seq: string[] } | null = null;
  for (const option of options) {
    for (const p of option.patterns) {
      for (const seq of expand(p)) {
        const diff = alignWithSlots(got, seq);
        // Palavra errada mas parecida custa menos (desempata «Москва» → «Москве» de outras opções)
        const cost = diff.reduce(
          (s, d) =>
            s +
            (d.status === "ok" || d.status === "slot"
              ? 0
              : d.status === "typo"
                ? 0.3
                : d.status === "wrong" && d.expected
                  ? 1 + (0.5 * levenshtein(d.word, d.expected)) / Math.max(d.word.length, d.expected.length)
                  : 1),
          0,
        );
        if (!best || cost < best.cost) best = { option, cost, diff, seq };
      }
    }
  }
  if (!best) return null;
  const wrong = best.diff.filter((d) => d.status !== "ok" && d.status !== "typo" && d.status !== "slot");
  const contentWords = best.seq.filter((w) => !w.startsWith("{") && w !== "*").length;
  // Entende se só houve erros de digitação, ou uma única terminação errada numa frase de 2+ palavras
  const endingSlip =
    wrong.length === 1 &&
    wrong[0].status === "wrong" &&
    contentWords >= 2 &&
    !!wrong[0].expected &&
    sharedStem(wrong[0].word, wrong[0].expected) >= 3;
  if (wrong.length > 0 && !endingSlip) return null;
  const slots: Record<string, string> = {};
  for (const d of best.diff) if (d.slot) slots[d.slot] = (slots[d.slot] ? slots[d.slot] + " " : "") + d.word;
  const plainWant = best.seq.filter((w) => w !== "*").map((w) => (w.startsWith("{") ? slots[w.slice(1, -1)] ?? "" : w));
  const why = endingSlip
    ? explainDiff(got, plainWant, best.diff.map((d) => ({ word: d.word, status: d.status === "slot" ? "ok" : d.status, expected: d.expected })))
    : `Pequeno erro de digitação: ${best.diff
        .filter((d) => d.status === "typo")
        .map((d) => `«${d.word}» → «${d.expected}»`)
        .join(", ")}.`;
  return { option: best.option, slots, exact: false, corrected: fill(best.option.ru), why, note: joinNotes(note, best.option.note) };
}

function joinNotes(a?: string, b?: string): string | undefined {
  const s = [a, b].filter(Boolean).join(" ");
  return s || undefined;
}

function sharedStem(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

type SlotDiff = { word: string; status: "ok" | "typo" | "wrong" | "missing" | "extra" | "slot"; expected?: string; slot?: string };

/** Alinha palavras com uma sequência que pode ter {slots} (uma palavra qualquer) e * (qualquer coisa). */
function alignWithSlots(got: string[], want: string[]): SlotDiff[] {
  const n = got.length;
  const m = want.length;
  const INF = 1e9;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(INF));
  const from: string[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(""));
  dp[0][0] = 0;
  const subCost = (g: string, w: string) => {
    if (w.startsWith("{")) return 0;
    const s = compareWord(g, w);
    return s === "ok" ? 0 : s === "typo" ? 0.3 : 1.1;
  };
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      if (dp[i][j] >= INF) continue;
      const c = dp[i][j];
      if (j < m && want[j] === "*") {
        // * consome zero palavras…
        if (c < dp[i][j + 1]) {
          dp[i][j + 1] = c;
          from[i][j + 1] = "skip*";
        }
        // …ou uma (e continua no mesmo *)
        if (i < n && c < dp[i + 1][j]) {
          dp[i + 1][j] = c;
          from[i + 1][j] = "eat*";
        }
        continue;
      }
      if (i < n && j < m) {
        const v = c + subCost(got[i], want[j]);
        if (v < dp[i + 1][j + 1]) {
          dp[i + 1][j + 1] = v;
          from[i + 1][j + 1] = "sub";
        }
      }
      if (i < n && c + 1 < dp[i + 1][j]) {
        dp[i + 1][j] = c + 1;
        from[i + 1][j] = "del";
      }
      if (j < m && c + 1 < dp[i][j + 1]) {
        dp[i][j + 1] = c + 1;
        from[i][j + 1] = "ins";
      }
    }
  }
  const out: SlotDiff[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const f = from[i][j];
    if (f === "sub") {
      const w = want[j - 1];
      if (w.startsWith("{")) out.unshift({ word: got[i - 1], status: "slot", slot: w.slice(1, -1) });
      else out.unshift({ word: got[i - 1], status: compareWord(got[i - 1], w), expected: w });
      i--;
      j--;
    } else if (f === "eat*") {
      out.unshift({ word: got[i - 1], status: "ok" });
      i--;
    } else if (f === "skip*") {
      j--;
    } else if (f === "del") {
      out.unshift({ word: got[i - 1], status: "extra" });
      i--;
    } else if (f === "ins") {
      out.unshift({ word: "", status: "missing", expected: want[j - 1] });
      j--;
    } else break;
  }
  return out;
}

// ---------- Execução ----------

export function test(cond: Cond | undefined, flags: Flags): boolean {
  if (!cond) return true;
  const v = flags[cond.flag];
  const ok = cond.eq === undefined ? !!v : v === cond.eq;
  return cond.not ? !ok : ok;
}

/** Falas do nó que valem com as flags atuais, com uma variação sorteada. */
export function linesOf(node: Node, flags: Flags, rnd: () => number = Math.random): Line[] {
  return node.say
    .filter((l) => test(l.if, flags))
    .map((l) => {
      if (!l.alts?.length) return l;
      const pick = Math.floor(rnd() * (l.alts.length + 1));
      return pick === 0 ? l : { ...l, ...l.alts[pick - 1] };
    });
}

export function optionsOf(node: Node, flags: Flags): Option[] {
  return node.reply ? node.reply.options.filter((o) => test(o.if, flags)) : [];
}

/** Substitui {name} e outras flags de texto nas falas: «Приве'т, {name}!» */
export function fillText(s: string, vars: Record<string, string>): string {
  return s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
}

export function nodeOf(c: Conversation, id: string): Node {
  const n = c.nodes.find((x) => x.id === id);
  if (!n) throw new Error(`Nó ${id} não existe na conversa ${c.id}`);
  return n;
}

export const normalizeForConvo = normalize;
