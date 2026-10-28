import { describe, expect, it } from "vitest";
import { DAY, mastery, newItem, review } from "../core/srs";

const T0 = new Date(2026, 0, 1, 10).getTime();

describe("revisão espaçada", () => {
  it("um acerto não domina a palavra", () => {
    const s = review(newItem("W:dom", T0), "right", "recognize", T0);
    expect(mastery(s)).toBe("aprendendo");
    expect(s.interval).toBe(1);
  });
  it("vários acertos na mesma sessão não aumentam o intervalo", () => {
    let s = review(newItem("W:dom", T0), "right", "recognize", T0);
    s = review(s, "right", "produce", T0 + 60_000);
    s = review(s, "right", "recognize", T0 + 120_000);
    expect(s.interval).toBe(1);
    expect(s.right).toBe(3);
  });
  it("acertos espaçados aumentam o intervalo até dominar (com produção)", () => {
    let s = newItem("W:dom", T0);
    let t = T0;
    for (let i = 0; i < 6; i++) {
      s = review(s, "right", i % 2 ? "produce" : "recognize", t);
      t += s.interval * DAY;
    }
    expect(s.interval).toBeGreaterThanOrEqual(21);
    expect(mastery(s)).toBe("dominado");
  });
  it("sem produção, palavra não fica dominada", () => {
    let s = newItem("W:dom", T0);
    let t = T0;
    for (let i = 0; i < 7; i++) {
      s = review(s, "right", "recognize", t);
      t += s.interval * DAY;
    }
    expect(mastery(s)).toBe("praticando");
  });
  it("erro volta para o começo e reaparece logo", () => {
    let s = review(newItem("W:dom", T0), "right", "recognize", T0);
    s = review(s, "right", "recognize", T0 + 2 * DAY);
    s = review(s, "wrong", "recognize", T0 + 6 * DAY);
    expect(s.interval).toBe(0);
    expect(s.lapses).toBe(1);
    expect(s.due - (T0 + 6 * DAY)).toBeLessThan(DAY);
  });
  it("acerto com dica não avança o intervalo", () => {
    let s = review(newItem("W:dom", T0), "right", "recognize", T0);
    const before = s.interval;
    s = review(s, "hinted", "produce", T0 + 2 * DAY);
    expect(s.interval).toBe(before);
    expect(s.hinted).toBe(1);
  });
});
