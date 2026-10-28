import { describe, expect, it } from "vitest";
import { conversation } from "../content";
import { expand, matchPattern, nodeOf, understand, type Option } from "../core/convo";

const opts = (convo: string, node: string): Option[] => nodeOf(conversation(convo)!, node).reply!.options;
const fill = (s: string) => s.replace("{player}", "Алекс");

describe("padrões", () => {
  it("opcionais, alternativas e capturas", () => {
    expect(matchPattern("Меня зовут Алекс", "[меня] зовут {name}")).toEqual({ name: "алекс" });
    expect(matchPattern("зовут Алекс", "[меня] зовут {name}")).toEqual({ name: "алекс" });
    expect(matchPattern("Я буду чай, пожалуйста!", "[я] (буду|хочу) чай [пожалуйста]")).not.toBeNull();
    expect(matchPattern("хочу чай", "[я] (буду|хочу) чай [пожалуйста]")).not.toBeNull();
    expect(matchPattern("кофе", "[я] (буду|хочу) чай [пожалуйста]")).toBeNull();
    expect(matchPattern("извините я не понимаю", "[извини|извините] [я] не понимаю")).not.toBeNull();
    expect(matchPattern("Мне двадцать пять лет", "мне * (лет|год|года)")).not.toBeNull();
  });
  it("expande alternativas", () => {
    expect(expand("[я] (буду|хочу) чай").length).toBe(4);
  });
});

describe("compreensão nas conversas", () => {
  it("entende o nome dito de formas diferentes", () => {
    for (const said of ["Меня зовут Алекс.", "Я Алекс", "Алекс меня зовут", "Привет! Меня зовут Алекс"]) {
      const u = understand(said, opts("c-anya-vokzal", "name"), fill);
      expect(u, said).not.toBeNull();
      expect(u!.slots.name).toBe("алекс");
    }
  });
  it("entende com erro de terminação e mostra a correção", () => {
    const u = understand("Я живу в Москва", opts("c-irina-urok", "live"), fill);
    expect(u?.option.id).toBe("moscow");
    expect(u?.exact).toBe(false);
    expect(u?.why).toMatch(/terminação/);
  });
  it("aceita respostas válidas diferentes do modelo", () => {
    expect(understand("Хочу кофе", opts("c-dmitry-kafe", "start"), fill)?.option.id).toBe("coffee");
    expect(understand("Дайте, пожалуйста, чай", opts("c-dmitry-kafe", "start"), fill)?.option.id).toBe("tea");
    expect(understand("Можно меню?", opts("c-dmitry-kafe", "start"), fill)?.option.id).toBe("menu");
    expect(understand("Идите прямо, а потом направо", opts("c-sofiya-doroga", "start"), fill)?.option.id).toBe("right");
  });
  it("tolera erro de digitação", () => {
    const u = understand("Здраствуйте! Меня зовут Алекс", opts("c-irina-urok", "start"), fill);
    expect(u?.option.id).toBe("formal");
  });
  it("registra o registro informal com uma observação", () => {
    const u = understand("Привет! Я Алекс", opts("c-irina-urok", "start"), fill);
    expect(u?.option.id).toBe("informal");
    expect(u?.note).toMatch(/informal/);
  });
  it("não entende frases sem relação nem português", () => {
    expect(understand("Я люблю футбол", opts("c-dmitry-kafe", "start"), fill)).toBeNull();
    expect(understand("quero um chá", opts("c-dmitry-kafe", "start"), fill)).toBeNull();
    expect(understand("", opts("c-dmitry-kafe", "start"), fill)).toBeNull();
  });
});
