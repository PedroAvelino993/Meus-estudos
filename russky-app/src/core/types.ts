// Tipos do conteúdo pedagógico e do estado do estudante.
// O conteúdo (src/content) só usa estes tipos; a interface nunca guarda palavras próprias.

export type Skill = "leitura" | "escrita" | "audicao" | "fala" | "vocabulario" | "gramatica";

export const SKILLS: Skill[] = ["leitura", "escrita", "audicao", "fala", "vocabulario", "gramatica"];

export type Pos = "noun" | "verb" | "adj" | "adv" | "pron" | "phrase" | "num" | "prep" | "conj" | "part" | "name";

/** Uma entrada do dicionário do app. `ru` leva o acento tônico com U+0301 (а́). */
export interface LexEntry {
  id: string;
  ru: string;
  pt: string;
  /** Outras traduções aceitas em português. */
  alt?: string[];
  /** Transliteração de apoio (some com o tempo). */
  tr?: string;
  pos?: Pos;
  gender?: "m" | "f" | "n";
  /** Explicação curta mostrada no card e no dicionário. */
  note?: string;
  /** Formas que aparecem em frases, com o motivo da mudança. */
  forms?: { ru: string; note: string }[];
}

/** Uma frase com todas as formulações aceitas (a primeira é a forma modelo). */
export interface Sentence {
  ru: string[];
  pt: string;
  /** Traduções em português aceitas (para exercícios russo → português). */
  ptAlt?: string[];
  /** Palavras extras (distratoras) para o banco de palavras. */
  extra?: string[];
  /** Explicação de estrutura mostrada depois de responder. */
  explain?: string;
}

export interface Letter {
  upper: string;
  lower: string;
  name: string;
  /** Como se lê o nome da letra (ex.: "bê"). */
  nameTr: string;
  /** Som principal em notação simples (ex.: "v"). */
  sound: string;
  /** Explicação para quem fala português. */
  explain: string;
  /** Dificuldade específica para brasileiros. */
  pitfall?: string;
  /** Letras parecidas (latinas ou cirílicas) para comparar. */
  lookalikes?: { char: string; note: string }[];
  examples: { ru: string; pt: string; tr: string }[];
  kind: "vogal" | "consoante" | "sinal";
  /** Letra que engana quem conhece o alfabeto latino. */
  falseFriend?: boolean;
}

/** Passos de uma lição. Os geradores (core/generate.ts) transformam em exercícios. */
export type Step =
  | { t: "letter"; L: string }
  | { t: "word"; w: string }
  | { t: "tip"; title: string; text: string; ex?: { ru: string; pt: string }[] }
  | { t: "grammar"; g: string }
  | { t: "gap"; ru: string; answer: string[]; options?: string[]; pt: string; explain: string }
  | { t: "fix"; wrong: string; right: string[]; pt: string; explain: string }
  | { t: "text"; text: string }
  | { t: "sentence"; s: Sentence; modes?: ("build" | "type" | "listen" | "read")[] }
  | { t: "syllables"; items: { ru: string; tr: string }[] }
  | { t: "lookalike"; a: string; b: string; question: string; answer: "a" | "b"; explain: string }
  | { t: "speak"; ru: string; pt: string }
  | { t: "choice"; prompt: string; ru?: string; options: string[]; answer: number; explain: string; skill: Skill };

export interface Lesson {
  id: string;
  title: string;
  /** Objetivos de aprendizagem mostrados antes de começar. */
  goals: string[];
  /** Letras novas (alfabeto). */
  letters?: string[];
  /** Palavras novas (ids do dicionário). */
  words?: string[];
  /** Tópicos de gramática trabalhados. */
  grammar?: string[];
  steps: Step[];
  /** Quantos exercícios de revisão misturar no fim. */
  practice?: number;
}

export interface Unit {
  id: string;
  title: string;
  subtitle: string;
  level: string;
  lessons: Lesson[];
  /** Lugar da história desbloqueado ao concluir. */
  place?: string;
}

export interface World {
  id: string;
  n: number;
  title: string;
  ru: string;
  level: string;
  description: string;
  color: string;
  units: Unit[];
  /** Mundo ainda sem conteúdo: aparece no mapa com os tópicos planejados. */
  planned?: string[];
}

export interface GrammarTopic {
  id: string;
  title: string;
  level: string;
  summary: string;
  /** Blocos de explicação (texto simples com **negrito**). */
  body: string[];
  examples: { ru: string; pt: string; note?: string }[];
  compare?: string;
  mistakes: { wrong: string; right: string; why: string }[];
  /** Exercícios do tópico. */
  practice: Step[];
}

export interface ReadingText {
  id: string;
  title: string;
  level: string;
  /** Parágrafos em russo. */
  ru: string[];
  pt: string[];
  question?: { q: string; options: string[]; answer: number; explain: string };
}

// ---------- Exercícios prontos para a tela ----------

export type Exercise =
  | { kind: "teach-letter"; id: string; letter: string; items: string[] }
  | { kind: "teach-word"; id: string; word: string; items: string[] }
  | { kind: "tip"; id: string; title: string; text: string; ex?: { ru: string; pt: string }[]; items: string[] }
  | { kind: "grammar"; id: string; topic: string; items: string[] }
  | {
      kind: "choice";
      id: string;
      skill: Skill;
      prompt: string;
      /** Texto em russo em destaque (com áudio). */
      ru?: string;
      /** Só áudio, sem mostrar o texto. */
      audioOnly?: boolean;
      /** Esconde a transliteração. */
      noTr?: boolean;
      options: { text: string; ru?: boolean }[];
      answer: number;
      explain?: string;
      items: string[];
      big?: boolean;
    }
  | { kind: "build"; id: string; skill: Skill; prompt: string; audio?: string; audioOnly?: boolean; tokens: string[]; accept: string[]; pt: string; explain?: string; items: string[] }
  | { kind: "type"; id: string; skill: Skill; prompt: string; pt?: string; audio?: string; audioOnly?: boolean; accept: string[]; explain?: string; items: string[]; hint?: string }
  | { kind: "gap"; id: string; skill: Skill; ru: string; answer: string[]; options?: string[]; pt: string; explain: string; items: string[] }
  | { kind: "pairs"; id: string; skill: Skill; pairs: { ru: string; pt: string }[]; items: string[] }
  | { kind: "spell"; id: string; skill: Skill; word: string; pt: string; tiles: string[]; items: string[] }
  | { kind: "fix"; id: string; skill: Skill; wrong: string; right: string[]; pt: string; explain: string; items: string[] }
  | { kind: "read"; id: string; text: string; items: string[] }
  | { kind: "speak"; id: string; ru: string; pt: string; items: string[] };

export type ExerciseKind = Exercise["kind"];

/** Resultado de uma correção, com explicação para mostrar ao estudante. */
export interface Verdict {
  ok: boolean;
  /** Aceito, mas com observação (ex.: erro de digitação, letra latina). */
  note?: string;
  /** Forma correta mais próxima do que o estudante escreveu. */
  expected: string;
  /** Explicação do erro, quando houver. */
  why?: string;
  /** Diferenças palavra a palavra. */
  diff?: { word: string; status: "ok" | "typo" | "wrong" | "missing" | "extra"; expected?: string }[];
}
