import { describe, expect, it } from "vitest";
import { addXp, claimMission, currentStreak, finishConvo, finishLesson, finishTest, initialState, levelOf, migrate, missionsFor, recordAnswer, touchStreak, dayKey } from "../core/state";
import { SKIP_PASS, lessonUnlocked, nextStep, unitTestKind, unitUnlocked, chapterAvailable, convoAvailable } from "../core/progress";
import { checkAchievements } from "../core/achievements";

const D = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h).getTime();

describe("progressão", () => {
  it("começa pela primeira lição; o resto está bloqueado", () => {
    const s = initialState();
    expect(nextStep(s)).toEqual({ kind: "lesson", lessonId: "l1-1-1" });
    expect(lessonUnlocked(s, "l1-1-1")).toBe(true);
    expect(lessonUnlocked(s, "l1-1-2")).toBe(false);
    expect(unitUnlocked(s, "u1-2")).toBe(false);
  });
  it("concluir não basta: abaixo de 70% a próxima lição não abre", () => {
    let s = finishLesson(initialState(), "l1-1-1", 0.5, Date.now()).state;
    expect(lessonUnlocked(s, "l1-1-2")).toBe(false);
    s = finishLesson(s, "l1-1-1", 0.75, Date.now()).state;
    expect(lessonUnlocked(s, "l1-1-2")).toBe(true);
  });
  it("a próxima unidade exige o teste de domínio", () => {
    let s = initialState();
    for (const l of ["l1-1-1", "l1-1-2", "l1-1-3"]) s = finishLesson(s, l, 0.9, Date.now()).state;
    expect(nextStep(s)).toEqual({ kind: "test", unitId: "u1-1" });
    expect(unitUnlocked(s, "u1-2")).toBe(false);
    s = finishTest(s, "u1-1", 0.7, [], Date.now()).state;
    expect(unitUnlocked(s, "u1-2")).toBe(false);
    s = finishTest(s, "u1-1", 0.85, [], Date.now()).state;
    expect(unitUnlocked(s, "u1-2")).toBe(true);
  });
  it("teste para pular exige 90% e mantém os pré-requisitos", () => {
    const s = initialState();
    expect(unitTestKind(s, "u1-1")).toBe("skip");
    expect(unitTestKind(s, "u1-2")).toBeNull();
    const ok = finishTest(s, "u1-1", 0.85, [], Date.now(), SKIP_PASS);
    expect(ok.passed).toBe(false);
    const s2 = finishTest(s, "u1-1", 0.95, [], Date.now(), SKIP_PASS).state;
    expect(lessonUnlocked(s2, "l1-2-1")).toBe(true);
    expect(lessonUnlocked(s2, "l1-3-1")).toBe(false);
  });
  it("conversas e capítulos dependem das unidades", () => {
    const s = initialState();
    expect(chapterAvailable(s, "ch0")).toBe(true);
    expect(chapterAvailable(s, "ch1")).toBe(false);
    expect(convoAvailable(s, "c-anya-vokzal")).toBe(false);
  });
});

describe("XP e motivação", () => {
  it("acerto de primeira vale mais que correção, e dica vale menos", () => {
    const base = { items: ["W:dom"], mode: "recognize" as const, skill: "vocabulario" as const };
    const s = initialState();
    expect(recordAnswer(s, { ...base, quality: "right", firstTry: true }, Date.now()).xp).toBe(10);
    expect(recordAnswer(s, { ...base, quality: "hinted", firstTry: true }, Date.now()).xp).toBe(5);
    expect(recordAnswer(s, { ...base, quality: "right", firstTry: false }, Date.now()).xp).toBe(2);
    expect(recordAnswer(s, { ...base, quality: "wrong", firstTry: true }, Date.now()).xp).toBe(0);
  });
  it("repetir lição dominada ou conversa rende metade", () => {
    let s = finishLesson(initialState(), "l1-1-1", 1, Date.now()).state;
    expect(finishLesson(s, "l1-1-1", 1, Date.now()).xp).toBe(10);
    s = finishConvo(s, "c-anya-vokzal", { at: 0, turns: [] }, 4, 4, {}, Date.now()).state;
    expect(finishConvo(s, "c-anya-vokzal", { at: 0, turns: [] }, 4, 4, {}, Date.now()).xp).toBe(16);
  });
  it("níveis crescem", () => {
    expect(levelOf(0).level).toBe(1);
    expect(levelOf(100).level).toBe(2);
    expect(levelOf(300).level).toBe(3);
  });
  it("missões são as mesmas no mesmo dia e só pagam quando cumpridas", () => {
    expect(missionsFor("2026-10-28").map((m) => m.id)).toEqual(missionsFor("2026-10-28").map((m) => m.id));
    expect(missionsFor("2026-10-28")).toHaveLength(3);
    const now = D(2026, 10, 28);
    const m = missionsFor(dayKey(now)).find((x) => x.id === "xp");
    let s = initialState();
    if (m) {
      expect(claimMission(s, "xp", now).xp).toBe(0);
      s = addXp(s, 50, now);
      expect(claimMission(s, "xp", now).xp).toBe(m.xp);
    }
  });
});

describe("sequência de dias", () => {
  it("conta dias seguidos e zera depois de falhar sem proteção", () => {
    let s = touchStreak(initialState(), D(2026, 1, 1));
    s = touchStreak(s, D(2026, 1, 2));
    expect(s.streak.count).toBe(2);
    expect(currentStreak(s, D(2026, 1, 3))).toBe(2);
    expect(currentStreak(s, D(2026, 1, 5))).toBe(0);
    s = touchStreak(s, D(2026, 1, 6));
    expect(s.streak.count).toBe(1);
  });
  it("7 dias seguidos dão uma proteção que cobre um dia perdido", () => {
    let s = initialState();
    for (let d = 1; d <= 7; d++) s = touchStreak(s, D(2026, 1, d));
    expect(s.streak.freezes).toBe(1);
    s = touchStreak(s, D(2026, 1, 9));
    expect(s.streak.count).toBe(8);
    expect(s.streak.freezes).toBe(0);
  });
});

describe("persistência", () => {
  it("migração preenche campos novos sem perder os antigos", () => {
    const s = migrate({ xp: 120, lessons: { "l1-1-1": { best: 1, runs: 1, passed: true, gold: true, last: 1 } }, settings: { name: "Ana" } });
    expect(s.xp).toBe(120);
    expect(s.lessons["l1-1-1"].passed).toBe(true);
    expect(s.settings.name).toBe("Ana");
    expect(s.settings.dailyGoal).toBe(30);
    expect(s.skills.fala).toEqual({ right: 0, wrong: 0 });
  });
  it("dados inválidos viram estado novo", () => {
    expect(migrate("lixo").xp).toBe(0);
    expect(migrate(null).onboarded).toBe(false);
  });
  it("conquistas aparecem uma vez", () => {
    const s = finishLesson(initialState(), "l1-1-1", 1, Date.now()).state;
    const a = checkAchievements(s, 1);
    expect(a.unlocked.map((x) => x.id)).toContain("primeira-licao");
    expect(checkAchievements(a.state, 2).unlocked).toHaveLength(0);
  });
});
