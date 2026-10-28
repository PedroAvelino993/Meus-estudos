import { describe, expect, it } from "vitest";
import { checkBuild, checkRussian, compareWord } from "../core/evaluate";
import { normalize, transliterate } from "../core/text";

describe("normalização", () => {
  it("ignora acento tônico, maiúsculas, pontuação e espaços; ё = е", () => {
    expect(normalize("  Приве́т,   А́ня!  ")).toBe("привет аня");
    expect(normalize("Ёлка")).toBe("елка");
    expect(normalize("«Самовар»")).toBe("самовар");
    expect(normalize("Я — Аня.")).toBe("я аня");
  });
  it("mantém hífen interno", () => {
    expect(normalize("по-русски")).toBe("по-русски");
  });
  it("transliteração de apoio", () => {
    expect(transliterate("ма́ма")).toBe("máma");
  });
});

describe("correção de respostas digitadas", () => {
  it("aceita a forma exata e variações de pontuação/acento", () => {
    expect(checkRussian("я живу в москве", ["Я живу́ в Москве́."]).ok).toBe(true);
    expect(checkRussian("Я живу в Москве!!", ["Я живу́ в Москве́."]).ok).toBe(true);
  });
  it("aceita formulações alternativas válidas", () => {
    const accept = ["Хорошо́, спаси́бо. А у тебя́?", "Спаси́бо, хорошо́. А у тебя́?"];
    expect(checkRussian("Спасибо, хорошо. А у тебя?", accept).ok).toBe(true);
  });
  it("terminação errada é erro de gramática, não de digitação", () => {
    const v = checkRussian("Я живу в Москва", ["Я живу́ в Москве́."]);
    expect(v.ok).toBe(false);
    expect(v.why).toMatch(/terminação/);
    expect(v.expected).toBe("Я живу́ в Москве́.");
  });
  it("erro de digitação no meio de palavra longa é aceito com aviso", () => {
    const v = checkRussian("спосибо", ["Спаси́бо"]);
    expect(v.ok).toBe(true);
    expect(v.note).toMatch(/digitação/);
  });
  it("palavras curtas não têm tolerância", () => {
    expect(checkRussian("тот", ["кот"]).ok).toBe(false);
  });
  it("recusa resposta em letras latinas e explica", () => {
    const v = checkRussian("privet", ["Приве́т"]);
    expect(v.ok).toBe(false);
    expect(v.why).toMatch(/cirílico/);
  });
  it("corrige letras latinas parecidas misturadas", () => {
    const v = checkRussian("кoт", ["кот"]); // o latino
    expect(v.ok).toBe(true);
    expect(v.note).toMatch(/latino/);
  });
  it("aponta palavra faltando e sobrando", () => {
    expect(checkRussian("Я живу Москве", ["Я живу́ в Москве́."]).why).toMatch(/Faltou/);
    expect(checkRussian("Я есть студент", ["Я студе́нт."]).why).toMatch(/sobrou/);
  });
  it("detecta ordem trocada", () => {
    const v = checkRussian("студент я", ["Я студе́нт."]);
    expect(v.ok).toBe(false);
    expect(v.why).toMatch(/ordem/);
  });
  it("não aceita qualquer coisa", () => {
    expect(checkRussian("да", ["Нет"]).ok).toBe(false);
    expect(checkRussian("", ["Нет"]).ok).toBe(false);
  });
});

describe("banco de palavras", () => {
  it("aceita a ordem certa e alternativas", () => {
    expect(checkBuild(["Я", "живу́", "в", "Москве́"], ["Я живу́ в Москве́."]).ok).toBe(true);
    expect(checkBuild(["Ты", "отку́да"], ["Отку́да ты?", "Ты отку́да?"]).ok).toBe(true);
  });
  it("recusa peça errada", () => {
    expect(checkBuild(["Я", "живу́", "в", "Москва́"], ["Я живу́ в Москве́."]).ok).toBe(false);
  });
});

describe("comparação de palavras", () => {
  it("classifica", () => {
    expect(compareWord("москве", "москве")).toBe("ok");
    expect(compareWord("москва", "москве")).toBe("wrong");
    expect(compareWord("здраствуйте", "здравствуйте")).toBe("typo");
  });
});
