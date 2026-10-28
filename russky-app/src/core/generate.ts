// Transforma os passos de uma lição em exercícios variados, com distratores coerentes.
// Também gera revisões, práticas de gramática e testes de unidade.

import type { Exercise, LexEntry, Sentence, Step } from "./types";
import { normalize, seeded, shuffle, stripStress, tokensOf } from "./text";
import type { ItemState } from "./srs";
import {
  ALL_LESSONS,
  ALPHABET,
  LEXICON,
  WORLDS,
  grammar,
  lessonRef,
  letter as letterOf,
  lettersUntil,
  lex,
  text as textOf,
  unitRef,
  wordIdsIn,
  wordsUntil,
} from "../content";

export interface GenOptions {
  seed: number;
  /** Há voz russa disponível? Sem ela, exercícios de áudio viram leitura. */
  audio: boolean;
  /** Itens para revisar no fim da lição (já ordenados por prioridade). */
  review?: ItemState[];
}

export const itemL = (ch: string) => `L:${ch.toLowerCase()}`;
export const itemW = (id: string) => `W:${id}`;
export const itemG = (id: string) => `G:${id}`;

type Rnd = () => number;

function pick<T>(list: T[], n: number, rnd: Rnd): T[] {
  return shuffle(list, rnd).slice(0, n);
}

/** Monta opções embaralhadas e devolve o índice da correta. */
function options(correct: string, wrong: string[], rnd: Rnd, ru = false) {
  const uniq = [...new Set(wrong.filter((w) => normalize(w) !== normalize(correct)))];
  const all = shuffle([correct, ...pick(uniq, 2, rnd)], rnd);
  return { options: all.map((text) => ({ text, ru })), answer: all.indexOf(correct) };
}

const isWorld1 = (lessonId: string) => lessonRef(lessonId)?.world.id === "w1";

/** O texto só usa letras já ensinadas? */
function readable(ru: string, letters: Set<string>): boolean {
  return [...stripStress(ru).toLowerCase()].every((ch) => !/[а-яё]/.test(ch) || letters.has(ch));
}

/** Palavras do mesmo tipo para servir de distratores. */
function distractorPool(entry: LexEntry, lessonId: string): LexEntry[] {
  const known = wordsUntil(lessonId).map(lex);
  const letters = isWorld1(lessonId) ? lettersUntil(lessonId) : null;
  const base = (known.length >= 6 ? known : LEXICON).filter(
    (e) => e.id !== entry.id && normalize(e.pt) !== normalize(entry.pt) && (!letters || readable(e.ru, letters)),
  );
  const samePos = base.filter((e) => (e.pos === "phrase") === (entry.pos === "phrase"));
  return samePos.length >= 3 ? samePos : base;
}

// ---------- Exercícios de palavras ----------

function wordMeaning(entry: LexEntry, lessonId: string, rnd: Rnd, id: string, noTr: boolean): Exercise {
  const pool = distractorPool(entry, lessonId);
  const o = options(entry.pt, pool.map((e) => e.pt), rnd);
  return { kind: "choice", id, skill: "vocabulario", prompt: "O que significa?", ru: entry.ru, noTr, ...o, items: [itemW(entry.id)] };
}

function wordFromPt(entry: LexEntry, lessonId: string, rnd: Rnd, id: string): Exercise {
  const pool = distractorPool(entry, lessonId);
  const o = options(entry.ru, pool.map((e) => e.ru), rnd, true);
  return { kind: "choice", id, skill: "vocabulario", prompt: `Como se diz «${entry.pt}» em russo?`, noTr: true, ...o, items: [itemW(entry.id)] };
}

function wordListen(entry: LexEntry, lessonId: string, rnd: Rnd, id: string): Exercise {
  const pool = distractorPool(entry, lessonId);
  const o = options(entry.pt, pool.map((e) => e.pt), rnd);
  return { kind: "choice", id, skill: "audicao", prompt: "Ouça e escolha o significado", ru: entry.ru, audioOnly: true, ...o, items: [itemW(entry.id)] };
}

function wordType(entry: LexEntry, id: string): Exercise {
  const accept = [entry.ru];
  return {
    kind: "type",
    id,
    skill: "escrita",
    prompt: "Escreva em russo",
    pt: entry.pt,
    accept,
    hint: `Começa com «${stripStress(entry.ru)[0]}» e tem ${stripStress(entry.ru).replace(/[^а-яё]/gi, "").length} letras.`,
    items: [itemW(entry.id)],
  };
}

function wordSpell(entry: LexEntry, rnd: Rnd, id: string, extraLetters: string[]): Exercise | null {
  const word = stripStress(entry.ru).toLowerCase();
  if (word.includes(" ") || word.length < 2 || word.length > 9 || /[^а-яё-]/.test(word)) return null;
  const letters = [...word];
  const extras = pick(
    extraLetters.filter((l) => !letters.includes(l)),
    Math.min(3, Math.max(1, 8 - letters.length)),
    rnd,
  );
  return { kind: "spell", id, skill: "escrita", word: entry.ru, pt: entry.pt, tiles: shuffle([...letters, ...extras], rnd), items: [itemW(entry.id)] };
}

// ---------- Exercícios de letras ----------

function letterToSound(L: string, known: string[], rnd: Rnd, id: string): Exercise {
  const l = letterOf(L)!;
  const others = ALPHABET.filter((x) => x.upper !== l.upper && x.sound !== l.sound);
  // Prefere distratores que confundem: o som da letra latina parecida, depois letras conhecidas
  const tricky = l.falseFriend ? latinSound(l.upper) : [];
  const knownSounds = others.filter((x) => known.includes(x.lower)).map((x) => x.sound);
  const pool = [...tricky, ...knownSounds, ...others.map((x) => x.sound)];
  const o = options(l.sound, [...tricky, ...pick(pool.filter((s) => !tricky.includes(s)), 4, rnd)].slice(0, 6), rnd);
  return { kind: "choice", id, skill: "leitura", prompt: "Qual é o som desta letra?", ru: `${l.upper} ${l.lower}`, big: true, noTr: true, ...o, explain: l.explain, items: [itemL(l.lower)] };
}

function latinSound(upper: string): string[] {
  return ({ В: ["b"], Н: ["h"], Р: ["p"], С: ["k"], У: ["y (i)"], Х: ["ks"], Е: ["é"] } as Record<string, string[]>)[upper] ?? [];
}

function soundToLetter(L: string, known: string[], rnd: Rnd, id: string, audio: boolean): Exercise {
  const l = letterOf(L)!;
  const pool = ALPHABET.filter((x) => x.upper !== l.upper && x.sound !== l.sound);
  const knownPool = pool.filter((x) => known.includes(x.lower));
  const lookalike = (l.lookalikes ?? []).map((x) => x.char).filter((c) => ALPHABET.some((a) => a.upper === c));
  const wrong = [...lookalike, ...pick((knownPool.length >= 2 ? knownPool : pool).map((x) => x.upper), 3, rnd)];
  const o = options(l.upper, wrong, rnd, true);
  return audio
    ? { kind: "choice", id, skill: "audicao", prompt: "Ouça e escolha a letra", ru: l.name, audioOnly: true, ...o, big: true, explain: `${l.upper} se chama «${l.nameTr}» e soa «${l.sound}».`, items: [itemL(l.lower)] }
    : { kind: "choice", id, skill: "leitura", prompt: `Qual letra tem o som «${l.sound}»?`, ...o, big: true, explain: l.explain, items: [itemL(l.lower)] };
}

function findLetter(L: string, lessonId: string, rnd: Rnd, id: string): Exercise | null {
  const l = letterOf(L)!;
  const letters = lettersUntil(lessonId);
  const known = wordsUntil(lessonId).map(lex).filter((e) => readable(e.ru, letters) && !e.ru.includes(" "));
  const withL = known.filter((e) => stripStress(e.ru).toLowerCase().includes(l.lower));
  const without = known.filter((e) => !stripStress(e.ru).toLowerCase().includes(l.lower));
  if (!withL.length || without.length < 2) return null;
  const target = pick(withL, 1, rnd)[0];
  const o = options(target.ru, without.map((e) => e.ru), rnd, true);
  return { kind: "choice", id, skill: "leitura", prompt: `Em qual palavra aparece a letra ${l.upper}?`, noTr: true, ...o, items: [itemL(l.lower)] };
}

// ---------- Frases ----------

function sentenceExercises(s: Sentence, modes: string[], lessonId: string, rnd: Rnd, nextId: () => string, audio: boolean): Exercise[] {
  const model = s.ru[0];
  const items = wordIdsIn(model);
  const out: Exercise[] = [];
  for (const mode of modes) {
    if (mode === "build" || (mode === "listen" && audio)) {
      const tokens = shuffle([...tokensOf(model), ...(s.extra ?? [])], rnd);
      out.push({
        kind: "build",
        id: nextId(),
        skill: mode === "listen" ? "audicao" : "gramatica",
        prompt: mode === "listen" ? "Ouça e monte a frase" : "Monte a frase em russo",
        audio: model,
        audioOnly: mode === "listen",
        tokens,
        accept: s.ru,
        pt: s.pt,
        explain: s.explain,
        items,
      });
    } else if (mode === "type") {
      out.push({ kind: "type", id: nextId(), skill: "escrita", prompt: "Escreva em russo", pt: s.pt, accept: s.ru, explain: s.explain, items });
    } else {
      // leitura: entender a frase em russo
      const others = lessonSentences(lessonId).filter((x) => x.pt !== s.pt).map((x) => x.pt);
      const o = options(s.pt, others, rnd);
      out.push({ kind: "choice", id: nextId(), skill: "leitura", prompt: "O que significa esta frase?", ru: model, noTr: true, ...o, items });
    }
  }
  return out;
}

/** Frases da lição e das lições vizinhas (para distratores de tradução). */
function lessonSentences(lessonId: string): Sentence[] {
  const ref = lessonRef(lessonId);
  const lessons = ref ? ALL_LESSONS.filter((r) => r.world.id === ref.world.id) : ALL_LESSONS;
  return lessons.flatMap((r) => r.lesson.steps.filter((s): s is Extract<Step, { t: "sentence" }> => s.t === "sentence").map((s) => s.s));
}

/** Todas as frases do curso, para revisão em contexto. */
export const ALL_SENTENCES: { s: Sentence; lessonId: string; ids: string[] }[] = ALL_LESSONS.flatMap((r) =>
  r.lesson.steps
    .filter((s): s is Extract<Step, { t: "sentence" }> => s.t === "sentence")
    .map((s) => ({ s: s.s, lessonId: r.lesson.id, ids: wordIdsIn(s.s.ru[0]) })),
);

// ---------- Passos simples ----------

function stepExercise(step: Step, _lessonId: string, rnd: Rnd, nextId: () => string, audio: boolean): Exercise[] {
  switch (step.t) {
    case "tip":
      return [{ kind: "tip", id: nextId(), title: step.title, text: step.text, ex: step.ex, items: [] }];
    case "grammar":
      return [{ kind: "grammar", id: nextId(), topic: step.g, items: [itemG(step.g)] }];
    case "gap":
      return [{ kind: "gap", id: nextId(), skill: "gramatica", ru: step.ru, answer: step.answer, options: step.options ? shuffle(step.options, rnd) : undefined, pt: step.pt, explain: step.explain, items: wordIdsIn(step.ru.replace("___", step.answer[0])).map(itemW) }];
    case "fix":
      return [{ kind: "fix", id: nextId(), skill: "gramatica", wrong: step.wrong, right: step.right, pt: step.pt, explain: step.explain, items: wordIdsIn(step.right[0]).map(itemW) }];
    case "text":
      return [{ kind: "read", id: nextId(), text: step.text, items: [] }];
    case "speak":
      return [{ kind: "speak", id: nextId(), ru: step.ru, pt: step.pt, items: wordIdsIn(step.ru).map(itemW) }];
    case "lookalike": {
      const opts = shuffle([step.a, step.b], rnd);
      const correct = step.answer === "a" ? step.a : step.b;
      return [{ kind: "choice", id: nextId(), skill: "leitura", prompt: step.question, options: opts.map((t) => ({ text: t, ru: true })), answer: opts.indexOf(correct), explain: step.explain, big: true, items: [itemL(correct)].filter((x) => /[а-яё]/.test(x)) }];
    }
    case "choice": {
      const order = shuffle(step.options.map((_, i) => i), rnd);
      return [
        {
          kind: "choice",
          id: nextId(),
          skill: step.skill,
          prompt: step.prompt,
          ru: step.ru,
          audioOnly: step.skill === "audicao" && audio,
          noTr: true,
          options: order.map((i) => ({ text: step.options[i], ru: /[а-яё]/i.test(step.options[i]) })),
          answer: order.indexOf(step.answer),
          explain: step.explain,
          items: step.ru ? wordIdsIn(step.ru).map(itemW) : [],
        },
      ];
    }
    case "syllables": {
      const out: Exercise[] = [];
      const all = step.items;
      for (const it of pick(all, Math.min(3, all.length), rnd)) {
        const o = options(it.tr, all.map((x) => x.tr), rnd);
        out.push({ kind: "choice", id: nextId(), skill: "leitura", prompt: "Como se lê?", ru: it.ru, noTr: true, big: true, ...o, items: [] });
      }
      if (audio) {
        const it = pick(all, 1, rnd)[0];
        const o = options(it.ru, all.map((x) => x.ru), rnd, true);
        out.push({ kind: "choice", id: nextId(), skill: "audicao", prompt: "Ouça e escolha o que foi dito", ru: it.ru, audioOnly: true, big: true, ...o, items: [] });
      }
      return out;
    }
    default:
      return [];
  }
}

// ---------- Lição ----------

export function buildLesson(lessonId: string, opts: GenOptions): Exercise[] {
  const ref = lessonRef(lessonId);
  if (!ref) throw new Error(`Lição desconhecida: ${lessonId}`);
  const rnd = seeded(opts.seed);
  let n = 0;
  const nextId = () => `${lessonId}#${n++}`;
  const lesson = ref.lesson;
  const w1 = ref.world.id === "w1";
  const knownLetters = [...lettersUntil(lessonId)];
  const out: Exercise[] = [];
  const deferred: Exercise[] = [];
  let rot = Math.floor(rnd() * 4);

  for (const step of lesson.steps) {
    if (step.t === "letter") {
      out.push({ kind: "teach-letter", id: nextId(), letter: step.L, items: [itemL(step.L)] });
      out.push(letterToSound(step.L, knownLetters, rnd, nextId()));
      deferred.push(soundToLetter(step.L, knownLetters, rnd, nextId(), opts.audio));
      const f = findLetter(step.L, lessonId, rnd, nextId());
      if (f) deferred.push(f);
    } else if (step.t === "word") {
      const e = lex(step.w);
      out.push({ kind: "teach-word", id: nextId(), word: e.id, items: [itemW(e.id)] });
      out.push(wordMeaning(e, lessonId, rnd, nextId(), w1));
      const kinds = w1 ? ["spell", "listen", "read"] : ["type", "listen", "fromPt", "spell"];
      const kind = kinds[rot++ % kinds.length];
      let ex: Exercise | null = null;
      if (kind === "spell") ex = wordSpell(e, rnd, nextId(), knownLetters);
      else if (kind === "listen" && opts.audio) ex = wordListen(e, lessonId, rnd, nextId());
      else if (kind === "type") ex = wordType(e, nextId());
      else if (kind === "fromPt") ex = wordFromPt(e, lessonId, rnd, nextId());
      if (!ex) ex = w1 ? wordMeaning(e, lessonId, rnd, nextId(), true) : wordFromPt(e, lessonId, rnd, nextId());
      deferred.push(ex);
    } else if (step.t === "sentence") {
      out.push(...sentenceExercises(step.s, step.modes ?? ["build"], lessonId, rnd, nextId, opts.audio));
    } else {
      out.push(...stepExercise(step, lessonId, rnd, nextId, opts.audio));
    }
  }

  // Pares para recapitular as palavras da lição
  // Sem significados repetidos (в e на são ambos «em»): cada par precisa ter uma só resposta
  const words: LexEntry[] = [];
  for (const e of shuffle((lesson.words ?? []).map(lex), rnd)) {
    if (e.pos === "phrase" && e.ru.length >= 24) continue;
    if (words.some((x) => normalize(x.pt) === normalize(e.pt) || normalize(x.ru) === normalize(e.ru))) continue;
    words.push(e);
  }
  if (words.length >= 4) {
    const chosen = words.slice(0, 5);
    deferred.push({ kind: "pairs", id: nextId(), skill: "vocabulario", pairs: chosen.map((e) => ({ ru: e.ru, pt: e.pt })), items: chosen.map((e) => itemW(e.id)) });
  }

  // Lições curtas: no máximo ~24 telas; o que sobrar fica para a revisão espaçada
  const room = Math.max(4, 24 - out.length);
  out.push(...shuffle(deferred, rnd).slice(0, room));

  const review = (opts.review ?? []).slice(0, lesson.practice ?? 2);
  for (const it of review) {
    const ex = reviewExercise(it, rnd, nextId(), opts.audio, lessonId);
    if (ex) out.push(ex);
  }
  return out;
}

// ---------- Revisão ----------

/** Cria um exercício para recuperar um item, priorizando a habilidade mais fraca. */
export function reviewExercise(state: ItemState, rnd: Rnd, id: string, audio: boolean, context?: string): Exercise | null {
  const [kind, key] = [state.id.slice(0, 1), state.id.slice(2)];
  if (kind === "L") {
    const l = letterOf(key);
    if (!l) return null;
    const known = ALPHABET.map((x) => x.lower);
    return (state.modes.listen ?? 0) <= (state.modes.read ?? 0) && rnd() < 0.5
      ? soundToLetter(l.upper, known, rnd, id, audio)
      : letterToSound(l.upper, known, rnd, id);
  }
  if (kind === "G") {
    const g = grammar(key);
    if (!g?.practice.length) return null;
    const step = pick(g.practice, 1, rnd)[0];
    const [ex] =
      step.t === "sentence"
        ? sentenceExercises(step.s, step.modes ?? ["build"], context ?? "", rnd, () => id, audio)
        : stepExercise(step, context ?? "", rnd, () => id, audio);
    return ex ? { ...ex, items: [...ex.items, state.id] } : null;
  }
  if (kind === "W") {
    let entry: LexEntry;
    try {
      entry = lex(key);
    } catch {
      return null;
    }
    const ctx = context ?? lastLessonWith(entry.id) ?? ALL_LESSONS[0].lesson.id;
    // Às vezes revisa a palavra dentro de uma frase já estudada
    const sentences = ALL_SENTENCES.filter((x) => x.ids.includes(entry.id));
    if (sentences.length && rnd() < 0.3) {
      const s = pick(sentences, 1, rnd)[0];
      const mode = rnd() < 0.5 ? "type" : audio && rnd() < 0.5 ? "listen" : "build";
      const [ex] = sentenceExercises(s.s, [mode], s.lessonId, rnd, () => id, audio);
      return { ...ex, items: [...new Set([...ex.items, entry.id])] };
    }
    const m = state.modes;
    const scores: [string, number][] = [
      ["recognize", m.recognize ?? 0],
      ["produce", (m.produce ?? 0) - 0.5],
      ...(audio ? ([["listen", (m.listen ?? 0) - 0.25]] as [string, number][]) : []),
    ];
    scores.sort((a, b) => a[1] - b[1] || rnd() - 0.5);
    const mode = scores[0][0];
    if (mode === "listen") return wordListen(entry, ctx, rnd, id);
    if (mode === "produce") {
      if (isWorld1(ctx)) return wordSpell(entry, rnd, id, ALPHABET.map((x) => x.lower)) ?? wordFromPt(entry, ctx, rnd, id);
      return rnd() < 0.7 ? wordType(entry, id) : wordFromPt(entry, ctx, rnd, id);
    }
    return wordMeaning(entry, ctx, rnd, id, true);
  }
  return null;
}

function lastLessonWith(wordId: string): string | undefined {
  for (let i = ALL_LESSONS.length - 1; i >= 0; i--) if (ALL_LESSONS[i].lesson.words?.includes(wordId)) return ALL_LESSONS[i].lesson.id;
  return undefined;
}

/** Sessão de revisão a partir de itens (Revisão diária ou recuperação). */
export function buildReview(items: ItemState[], seed: number, audio: boolean): Exercise[] {
  const rnd = seeded(seed);
  const out: Exercise[] = [];
  items.forEach((it, i) => {
    const ex = reviewExercise(it, rnd, `review#${i}`, audio);
    if (ex) out.push(ex);
  });
  return out;
}

/** Prática de um tópico de gramática (seção Gramática). */
export function buildGrammarPractice(topicId: string, seed: number, audio: boolean): Exercise[] {
  const g = grammar(topicId);
  if (!g) return [];
  const rnd = seeded(seed);
  let n = 0;
  const nextId = () => `g-${topicId}#${n++}`;
  const firstLesson = ALL_LESSONS.find((r) => r.lesson.grammar?.includes(topicId))?.lesson.id ?? "";
  const out = g.practice.flatMap((step) =>
    step.t === "sentence" ? sentenceExercises(step.s, step.modes ?? ["build"], firstLesson, rnd, nextId, audio) : stepExercise(step, firstLesson, rnd, nextId, audio),
  );
  return out.map((e) => ({ ...e, items: [...new Set([...e.items, itemG(topicId)])] }));
}

// ---------- Teste de unidade ----------

/**
 * Teste de domínio de uma unidade: mistura produção, áudio, leitura de palavras novas,
 * correção de erros e frases. Sem cartões de ensino.
 */
export function buildUnitTest(unitId: string, seed: number, audio: boolean): Exercise[] {
  const ref = unitRef(unitId);
  if (!ref) throw new Error(`Unidade desconhecida: ${unitId}`);
  const rnd = seeded(seed);
  let n = 0;
  const nextId = () => `${unitId}-test#${n++}`;
  const lastId = ref.unit.lessons[ref.unit.lessons.length - 1].id;
  const w1 = ref.world.id === "w1";
  const out: Exercise[] = [];
  const knownLetters = [...lettersUntil(lastId)];

  const letters = ref.unit.lessons.flatMap((l) => l.letters ?? []);
  for (const L of pick(letters, Math.min(4, letters.length), rnd)) {
    out.push(rnd() < 0.5 ? letterToSound(L, knownLetters, rnd, nextId()) : soundToLetter(L, knownLetters, rnd, nextId(), audio));
  }

  // Ler palavras nunca vistas, formadas só com letras conhecidas
  if (w1) {
    const seen = new Set(wordsUntil(lastId));
    const fresh = LEXICON.filter((e) => !seen.has(e.id) && e.tr && !e.ru.includes(" ") && readable(e.ru, new Set(knownLetters)));
    for (const e of pick(fresh, 2, rnd)) {
      const others = fresh.filter((x) => x.id !== e.id).map((x) => x.tr!);
      const o = options(e.tr!, others.length >= 2 ? others : LEXICON.filter((x) => x.tr && x.id !== e.id).map((x) => x.tr!), rnd);
      out.push({ kind: "choice", id: nextId(), skill: "leitura", prompt: "Palavra nova! Como se lê?", ru: e.ru, noTr: true, big: true, ...o, explain: `${e.ru} = «${e.tr}» (${e.pt}).`, items: [] });
    }
  }

  const words = ref.unit.lessons.flatMap((l) => l.words ?? []).map(lex);
  for (const e of pick(words, Math.min(6, words.length), rnd)) {
    const r = rnd();
    if (w1) out.push(r < 0.4 ? wordMeaning(e, lastId, rnd, nextId(), true) : r < 0.7 && audio ? wordListen(e, lastId, rnd, nextId()) : wordSpell(e, rnd, nextId(), knownLetters) ?? wordMeaning(e, lastId, rnd, nextId(), true));
    else out.push(r < 0.45 ? wordType(e, nextId()) : r < 0.75 && audio ? wordListen(e, lastId, rnd, nextId()) : wordFromPt(e, lastId, rnd, nextId()));
  }

  const steps = ref.unit.lessons.flatMap((l) => l.steps);
  const checks = steps.filter((s) => s.t === "gap" || s.t === "fix" || s.t === "choice");
  for (const s of pick(checks, Math.min(4, checks.length), rnd)) out.push(...stepExercise(s, lastId, rnd, nextId, audio));

  const sentences = steps.filter((s): s is Extract<Step, { t: "sentence" }> => s.t === "sentence");
  for (const s of pick(sentences, Math.min(4, sentences.length), rnd)) {
    const mode = audio && rnd() < 0.3 ? "listen" : rnd() < 0.5 ? "type" : "build";
    out.push(...sentenceExercises(s.s, [mode], lastId, rnd, nextId, audio));
  }

  const textStep = steps.find((s): s is Extract<Step, { t: "text" }> => s.t === "text");
  const t = textStep ? textOf(textStep.text) : undefined;
  if (t?.question) {
    const order = shuffle(t.question.options.map((_, i) => i), rnd);
    out.push({
      kind: "choice",
      id: nextId(),
      skill: "leitura",
      prompt: t.question.q,
      ru: t.ru.join("\n"),
      noTr: true,
      options: order.map((i) => ({ text: t.question!.options[i] })),
      answer: order.indexOf(t.question.answer),
      explain: t.question.explain,
      items: [],
    });
  }
  return shuffle(out, rnd);
}

/** Quantos mundos têm conteúdo (para a tela de progresso). */
export const CONTENT_WORLDS = WORLDS.filter((w) => w.units.length > 0);
