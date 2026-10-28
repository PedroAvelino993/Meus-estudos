import { describe, expect, it } from "vitest";
import {
  ALL_LESSONS, ALL_UNITS, ALPHABET, CHAPTERS, CHARACTERS, CONVERSATIONS, GRAMMAR, LEX, LEXICON, PLACES, TEXTS,
  grammar, lettersUntil, lookup, text,
} from "../content";
import { checkBuild, checkRussian } from "../core/evaluate";
import { buildGrammarPractice, buildLesson, buildReview, buildUnitTest } from "../core/generate";
import { normalize, stripStress, tokensOf } from "../core/text";
import type { Exercise, Step } from "../core/types";
import { newItem } from "../core/srs";

const sentenceSteps = (steps: Step[]) => steps.filter((s): s is Extract<Step, { t: "sentence" }> => s.t === "sentence");

describe("alfabeto", () => {
  it("tem as 33 letras, cada uma com exemplos e explicação", () => {
    expect(ALPHABET).toHaveLength(33);
    expect(new Set(ALPHABET.map((l) => l.upper)).size).toBe(33);
    for (const l of ALPHABET) {
      expect(l.lower).toBe(l.upper.toLowerCase());
      expect(l.examples.length).toBeGreaterThanOrEqual(2);
      expect(l.explain.length).toBeGreaterThan(20);
    }
  });
  it("o Mundo 1 ensina as 33 letras, cada uma uma vez", () => {
    const taught = ALL_LESSONS.filter((r) => r.world.id === "w1").flatMap((r) => r.lesson.letters ?? []);
    expect(taught.sort()).toEqual(ALPHABET.map((l) => l.upper).sort());
  });
  it("os falsos amigos В, Н, Р, С, У, Х são marcados", () => {
    for (const L of ["В", "Н", "Р", "С", "У", "Х"]) expect(ALPHABET.find((l) => l.upper === L)?.falseFriend).toBe(true);
  });
  it("cada lição do Mundo 1 só usa letras já ensinadas", () => {
    for (const r of ALL_LESSONS.filter((x) => x.world.id === "w1")) {
      const known = lettersUntil(r.lesson.id);
      const check = (ru: string, where: string) => {
        for (const ch of stripStress(ru).toLowerCase()) {
          if (/[а-яё]/.test(ch)) expect(known.has(ch), `${where}: «${ru}» usa ${ch} antes de ensinar`).toBe(true);
        }
      };
      for (const w of r.lesson.words ?? []) check(LEX.get(w)!.ru, r.lesson.id);
      for (const s of sentenceSteps(r.lesson.steps)) for (const v of s.s.ru) check(v, r.lesson.id);
    }
  });
});

describe("dicionário", () => {
  it("ids únicos e acento convertido", () => {
    expect(new Set(LEXICON.map((e) => e.id)).size).toBe(LEXICON.length);
    for (const e of LEXICON) expect(e.ru.includes("'"), e.id).toBe(false);
  });
  it("palavras de várias sílabas têm acento marcado", () => {
    const vowels = /[аеиоуыэюяё]/g;
    for (const e of LEXICON) {
      for (const word of e.ru.replace(/[…?!.,«»]/g, " ").split(/[\s-]+/).filter(Boolean)) {
        const n = (stripStress(word).toLowerCase().match(vowels) ?? []).length;
        if (n > 1 && !word.includes("ё") && !word.includes("́")) {
          // palavras átonas comuns (preposições, partículas) e compostos são exceção
          expect(["Сан", "до", "по", "не", "за", "что", "нибудь", "де", "Рио"].some((x) => word.startsWith(x)), `${e.id}: «${word}» sem acento`).toBe(true);
        }
      }
    }
  });
  it("todas as palavras usadas nas lições existem", () => {
    for (const r of ALL_LESSONS) {
      for (const w of r.lesson.words ?? []) expect(LEX.has(w), `${r.lesson.id}: ${w}`).toBe(true);
      for (const s of r.lesson.steps) if (s.t === "word") expect(LEX.has(s.w), `${r.lesson.id}: ${s.w}`).toBe(true);
    }
  });
  it("toda palavra ensinada em cartão está na lista da lição", () => {
    for (const r of ALL_LESSONS) {
      for (const s of r.lesson.steps) if (s.t === "word") expect(r.lesson.words ?? [], `${r.lesson.id}: ${s.w}`).toContain(s.w);
    }
  });
});

describe("lições", () => {
  it("ids únicos, objetivos e passos", () => {
    expect(new Set(ALL_LESSONS.map((r) => r.lesson.id)).size).toBe(ALL_LESSONS.length);
    expect(ALL_LESSONS.length).toBeGreaterThanOrEqual(60);
    for (const r of ALL_LESSONS) {
      expect(r.lesson.goals.length, r.lesson.id).toBeGreaterThan(0);
      expect(r.lesson.steps.length, r.lesson.id).toBeGreaterThan(2);
    }
  });
  it("tópicos de gramática citados existem e têm prática", () => {
    for (const r of ALL_LESSONS) {
      for (const g of [...(r.lesson.grammar ?? []), ...r.lesson.steps.filter((s) => s.t === "grammar").map((s) => (s as { g: string }).g)]) {
        expect(grammar(g), `${r.lesson.id}: ${g}`).toBeTruthy();
      }
    }
    for (const g of GRAMMAR) {
      expect(g.practice.length, g.id).toBeGreaterThanOrEqual(3);
      expect(g.mistakes.length, g.id).toBeGreaterThan(0);
    }
  });
  it("cada frase aceita a si mesma e o banco de palavras tem as peças certas", () => {
    for (const r of ALL_LESSONS) {
      for (const { s } of sentenceSteps(r.lesson.steps)) {
        for (const v of s.ru) expect(checkRussian(v, s.ru).ok, `${r.lesson.id}: ${v}`).toBe(true);
        const tokens = tokensOf(s.ru[0]);
        expect(checkBuild(tokens, s.ru).ok, `${r.lesson.id}: ${s.ru[0]}`).toBe(true);
        for (const x of s.extra ?? []) {
          // uma peça extra não pode completar outra resposta aceita sozinha
          expect(tokens.map(normalize)).not.toContain(normalize(x));
        }
      }
    }
  });
  it("lacunas: a resposta está entre as opções", () => {
    const all = [...ALL_LESSONS.flatMap((r) => r.lesson.steps), ...GRAMMAR.flatMap((g) => g.practice)];
    for (const s of all) {
      if (s.t === "gap") {
        expect(s.ru).toContain("___");
        if (s.options) expect(s.options.map(normalize), s.ru).toContain(normalize(s.answer[0]));
      }
      if (s.t === "choice") expect(s.answer).toBeLessThan(s.options.length);
      if (s.t === "fix") expect(checkRussian(s.wrong, s.right).ok, s.wrong).toBe(false);
    }
  });
  it("textos citados existem; cada palavra dos textos pode ser tocada e traduzida", () => {
    for (const r of ALL_LESSONS) for (const s of r.lesson.steps) if (s.t === "text") expect(text(s.text), s.text).toBeTruthy();
    for (const t of TEXTS) {
      expect(t.ru.length).toBe(t.pt.length);
      for (const line of t.ru) {
        const body = line.replace(/^[^:]+:\s*/, "");
        for (const w of tokensOf(body)) expect(lookup(w).length, `${t.id}: «${w}»`).toBeGreaterThan(0);
      }
    }
  });
});

describe("gerador de exercícios", () => {
  const validate = (ex: Exercise, where: string) => {
    if (ex.kind === "choice") {
      expect(ex.options.length, where).toBeGreaterThanOrEqual(2);
      expect(ex.answer, where).toBeGreaterThanOrEqual(0);
      expect(ex.answer, where).toBeLessThan(ex.options.length);
      expect(new Set(ex.options.map((o) => normalize(o.text))).size, `${where}: opções repetidas ${ex.options.map((o) => o.text)}`).toBe(ex.options.length);
    }
    if (ex.kind === "build") expect(checkBuild(tokensOf(ex.accept[0]), ex.accept).ok, where).toBe(true);
    if (ex.kind === "pairs") {
      expect(new Set(ex.pairs.map((x) => normalize(x.pt))).size, `${where}: pares com mesmo significado`).toBe(ex.pairs.length);
      expect(new Set(ex.pairs.map((x) => normalize(x.ru))).size, where).toBe(ex.pairs.length);
    }
    if (ex.kind === "spell") expect([...stripStress(ex.word).toLowerCase()].every((c) => ex.tiles.includes(c)), where).toBe(true);
    if (ex.kind === "type") expect(checkRussian(ex.accept[0], ex.accept).ok, where).toBe(true);
  };
  it("gera exercícios válidos para todas as lições, com e sem áudio", () => {
    for (const r of ALL_LESSONS) {
      for (const seed of [1, 2, 3]) {
        for (const audio of [true, false]) {
          const exs = buildLesson(r.lesson.id, { seed, audio });
          expect(exs.length, r.lesson.id).toBeGreaterThan(3);
          for (const ex of exs) {
            validate(ex, `${r.lesson.id}/${ex.id}`);
            if (!audio) expect("audioOnly" in ex && ex.audioOnly, `${r.lesson.id}: áudio sem voz`).toBeFalsy();
          }
        }
      }
    }
  });
  it("gera testes de unidade sem cartões de ensino", () => {
    for (const { unit } of ALL_UNITS) {
      const exs = buildUnitTest(unit.id, 7, true);
      expect(exs.length, unit.id).toBeGreaterThanOrEqual(6);
      for (const ex of exs) {
        expect(["teach-letter", "teach-word", "tip", "grammar"]).not.toContain(ex.kind);
        validate(ex, `${unit.id}/${ex.id}`);
      }
    }
  });
  it("gera revisões para letras, palavras e gramática", () => {
    const items = [newItem("L:ж", 0), newItem("W:moskva", 0), newItem("G:prepositivo", 0), newItem("W:khorosho", 0)].map((s) => ({ ...s, seen: 1 }));
    const exs = buildReview(items, 3, true);
    expect(exs).toHaveLength(4);
    exs.forEach((e) => validate(e, e.id));
  });
  it("prática de cada tópico de gramática", () => {
    for (const g of GRAMMAR) {
      const exs = buildGrammarPractice(g.id, 1, true);
      expect(exs.length, g.id).toBeGreaterThanOrEqual(3);
      exs.forEach((e) => validate(e, `${g.id}/${e.id}`));
    }
  });
});

describe("história e conversas", () => {
  it("conversas: nós existem, finais alcançáveis, personagens e unidades válidos", () => {
    const unitIds = new Set(ALL_UNITS.map((u) => u.unit.id));
    for (const c of CONVERSATIONS) {
      expect(CHARACTERS.some((x) => x.id === c.character), c.id).toBe(true);
      for (const u of c.requires) expect(unitIds.has(u), `${c.id}: ${u}`).toBe(true);
      const ids = new Set(c.nodes.map((n) => n.id));
      expect(ids.has(c.start)).toBe(true);
      for (const n of c.nodes) {
        if (n.next) expect(ids.has(n.next), `${c.id}/${n.id} → ${n.next}`).toBe(true);
        for (const o of n.reply?.options ?? []) expect(ids.has(o.next), `${c.id}/${n.id}/${o.id} → ${o.next}`).toBe(true);
        expect(!!n.end || !!n.next || !!n.reply, `${c.id}/${n.id} sem saída`).toBe(true);
      }
      expect(c.nodes.some((n) => n.end), c.id).toBe(true);
      for (const v of c.vocabulary) expect(LEX.has(v), `${c.id}: ${v}`).toBe(true);
    }
  });
  it("capítulos: missões e lugares existem", () => {
    for (const ch of CHAPTERS) {
      expect(PLACES.some((p) => p.id === ch.place), ch.id).toBe(true);
      for (const p of ch.panels) {
        if (p.k === "mission") expect(CONVERSATIONS.some((c) => c.id === p.convo), p.convo).toBe(true);
        if (p.k === "say") expect(CHARACTERS.some((c) => c.id === p.who)).toBe(true);
        if (p.k === "sign") expect(p.answer).toBeLessThan(p.options.length);
      }
    }
  });
});
