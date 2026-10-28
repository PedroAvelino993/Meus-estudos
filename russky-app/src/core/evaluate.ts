// Correção de respostas digitadas ou montadas em russo.
// Regras: ignora maiúsculas, acento tônico, pontuação e espaços extras; aceita е no lugar de ё;
// aceita pequenos erros de digitação no meio da palavra, mas nunca uma terminação errada
// (em russo a terminação muda o sentido: Москва ≠ Москве).

import type { Verdict } from "./types";
import { fixLookalikes, hasMixedScript, isCyrillic, levenshtein, normalize, words } from "./text";

type Status = "ok" | "typo" | "wrong";

/** Compara duas palavras já normalizadas. */
export function compareWord(got: string, want: string): Status {
  if (got === want) return "ok";
  const len = want.length;
  const limit = len >= 9 ? 2 : len >= 5 ? 1 : 0;
  if (limit === 0 || levenshtein(got, want) > limit) return "wrong";
  // Diferença na terminação é erro de gramática, não de digitação.
  if (got.slice(-2) !== want.slice(-2)) return "wrong";
  return "typo";
}

interface Cell {
  cost: number;
  op: "match" | "del" | "ins";
}

/** Alinha as palavras digitadas com as esperadas (programação dinâmica). */
export function alignWords(got: string[], want: string[]): Verdict["diff"] {
  const n = got.length;
  const m = want.length;
  const dp: Cell[][] = Array.from({ length: n + 1 }, () => Array.from({ length: m + 1 }, () => ({ cost: 0, op: "match" as const })));
  for (let i = 1; i <= n; i++) dp[i][0] = { cost: i, op: "del" };
  for (let j = 1; j <= m; j++) dp[0][j] = { cost: j, op: "ins" };
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const s = compareWord(got[i - 1], want[j - 1]);
      const sub = dp[i - 1][j - 1].cost + (s === "ok" ? 0 : s === "typo" ? 0.4 : 1.1);
      const del = dp[i - 1][j].cost + 1;
      const ins = dp[i][j - 1].cost + 1;
      dp[i][j] = sub <= del && sub <= ins ? { cost: sub, op: "match" } : del <= ins ? { cost: del, op: "del" } : { cost: ins, op: "ins" };
    }
  }
  const out: NonNullable<Verdict["diff"]> = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const c = dp[i][j];
    if (i > 0 && j > 0 && c.op === "match") {
      const s = compareWord(got[i - 1], want[j - 1]);
      out.unshift({ word: got[i - 1], status: s, expected: want[j - 1] });
      i--;
      j--;
    } else if (i > 0 && (j === 0 || c.op === "del")) {
      out.unshift({ word: got[i - 1], status: "extra" });
      i--;
    } else {
      out.unshift({ word: "", status: "missing", expected: want[j - 1] });
      j--;
    }
  }
  return out;
}

function costOf(diff: NonNullable<Verdict["diff"]>): number {
  return diff.reduce((s, d) => s + (d.status === "ok" ? 0 : d.status === "typo" ? 0.4 : 1), 0);
}

function sameWordsOtherOrder(a: string[], b: string[]): boolean {
  return a.length === b.length && [...a].sort().join(" ") === [...b].sort().join(" ") && a.join(" ") !== b.join(" ");
}

/**
 * Corrige uma resposta em russo contra todas as formas aceitas.
 * `accept[0]` é a forma modelo mostrada quando não houver uma mais próxima.
 */
export function checkRussian(input: string, accept: string[]): Verdict {
  const model = accept[0];
  const raw = input.trim();
  if (!raw) return { ok: false, expected: model, why: "Escreva sua resposta antes de verificar." };

  if (!isCyrillic(raw) && /[a-z]/i.test(raw)) {
    return {
      ok: false,
      expected: model,
      why: "Você escreveu com letras latinas. Em russo, a resposta precisa estar em cirílico — use o teclado russo do app.",
    };
  }

  let note: string | undefined;
  let text = raw;
  if (raw.split(/\s+/).some(hasMixedScript)) {
    text = fixLookalikes(raw);
    note = "Algumas letras foram digitadas no alfabeto latino (parecem iguais, mas são outras letras no computador). Corrigimos para você.";
  }

  const got = words(text);
  let best: { diff: NonNullable<Verdict["diff"]>; target: string; cost: number } | null = null;
  for (const a of accept) {
    const want = words(a);
    if (got.join(" ") === want.join(" ")) return { ok: true, expected: a, note };
    const diff = alignWords(got, want)!;
    const cost = costOf(diff);
    if (!best || cost < best.cost) best = { diff, target: a, cost };
  }
  const { diff, target } = best!;
  const allFine = diff.every((d) => d.status === "ok" || d.status === "typo");
  if (allFine) {
    const typos = diff.filter((d) => d.status === "typo");
    return {
      ok: true,
      expected: target,
      diff,
      note: [note, `Pequeno erro de digitação: ${typos.map((t) => `«${t.word}» → «${t.expected}»`).join(", ")}.`].filter(Boolean).join(" "),
    };
  }
  return { ok: false, expected: target, diff, why: explainDiff(got, words(target), diff), note };
}

/** Explicação em português para as diferenças encontradas. */
export function explainDiff(got: string[], want: string[], diff: NonNullable<Verdict["diff"]>): string {
  if (sameWordsOtherOrder(got, want)) {
    return "As palavras estão certas, mas a ordem ficou diferente. Aqui a ordem natural é a da resposta correta.";
  }
  const parts: string[] = [];
  for (const d of diff) {
    if (d.status === "wrong" && d.expected) {
      const w = d.word;
      const e = d.expected;
      const shared = commonPrefix(w, e);
      if (shared >= 3 && shared >= Math.min(w.length, e.length) - 3) {
        parts.push(`«${w}» está com a terminação errada: o certo aqui é «${e}». Em russo, a terminação mostra a função da palavra na frase.`);
      } else {
        parts.push(`No lugar de «${w}», o esperado era «${e}».`);
      }
    } else if (d.status === "missing" && d.expected) {
      parts.push(`Faltou a palavra «${d.expected}».`);
    } else if (d.status === "extra") {
      parts.push(`A palavra «${d.word}» sobrou.`);
    }
  }
  return parts.join(" ") || "A resposta não corresponde à frase pedida.";
}

function commonPrefix(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/** Correção para o banco de palavras (as peças já são palavras inteiras). */
export function checkBuild(picked: string[], accept: string[]): Verdict {
  const got = normalize(picked.join(" "));
  for (const a of accept) if (normalize(a) === got) return { ok: true, expected: a };
  const v = checkRussian(picked.join(" "), accept);
  // No banco de palavras não existe "erro de digitação": ou a peça é a certa ou não é.
  if (v.ok) return { ok: false, expected: v.expected, diff: v.diff, why: "Uma das peças escolhidas não é a forma certa." };
  return v;
}

/** Lacuna: a resposta é uma palavra (ou mais) e aceita as variantes listadas. */
export function checkGap(input: string, answers: string[]): Verdict {
  const v = checkRussian(input, answers);
  return v;
}
