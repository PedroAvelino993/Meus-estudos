import { describe, expect, it } from "vitest";
import type { AudioEnvelope, GenerateSettings, Sample } from "./types";
import { buildMoments, buildTimeline } from "./moments";
import { buildThreads, generate } from "./stories";
import { insertSegment, moveSegment, outToSource, removeSegment, removeSilences, seg, sourceToOut, splitAt, totalDuration, trimSegment } from "./timeline";
import { chunksToCaptions, cleanChunks, detectLanguage, toSrt } from "./captions";
import { analyzePerformance, isoDuration } from "./learning";
import { frameStats } from "./features";

/** Roteiro de uma gameplay sintética: [início, fim, tipo]. */
const SCRIPT: [number, number, string][] = [
  [0, 60, "andando"],
  [60, 80, "menu"],
  [80, 140, "dirigindo"],
  [140, 200, "perseguicao"],
  [200, 206, "batida"],
  [206, 214, "explosao"],
  [214, 260, "dirigindo"],
  [260, 285, "carregamento"],
  [285, 400, "andando"],
  [400, 440, "tiroteio"],
  [440, 480, "perseguicao"],
  [480, 600, "dirigindo"],
];

function kindAt(t: number) {
  return SCRIPT.find(([a, b]) => t >= a && t < b)?.[2] ?? "andando";
}

function synth(): { samples: Sample[]; audio: AudioEnvelope; duration: number } {
  const samples: Sample[] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let t = 0; t < 600; t += 1.5) {
    const k = kindAt(t);
    const base: Sample = { t, motion: 0.06, brightness: 0.45, saturation: 0.4, fire: 0, siren: 0, detail: 0.25, variance: 0.3, cut: false, cx: 0.5 };
    if (k === "menu") Object.assign(base, { motion: 0.005, saturation: 0.1, detail: 0.3, brightness: 0.3 });
    if (k === "carregamento") Object.assign(base, { motion: 0.002, brightness: 0.03, detail: 0.01, variance: 0.02 });
    if (k === "dirigindo") Object.assign(base, { motion: 0.18 });
    if (k === "perseguicao") Object.assign(base, { motion: 0.4 + rnd() * 0.2, siren: 0.015 });
    if (k === "batida") Object.assign(base, { motion: 0.7 });
    if (k === "explosao") Object.assign(base, { motion: 0.5, fire: 0.15, brightness: 0.7 });
    if (k === "tiroteio") Object.assign(base, { motion: 0.3 });
    samples.push(base);
  }
  const rms: number[] = [];
  for (let i = 0; i < 600 * 4; i++) {
    const k = kindAt(i / 4);
    let v = 0.2 + rnd() * 0.05;
    if (k === "menu" || k === "carregamento") v = 0.01;
    if (k === "perseguicao") v = 0.6 + rnd() * 0.2;
    if (k === "batida" || k === "explosao") v = 0.98;
    if (k === "tiroteio") v = 0.9 * (i % 3 === 0 ? 1 : 0.6);
    rms.push(v);
  }
  return { samples, audio: { rate: 4, rms }, duration: 600 };
}

const settings = (p: Partial<GenerateSettings> = {}): GenerateSettings => ({ mode: "historias", count: 3, duration: 30, format: "9:16", reframe: "acao", fps: 30, captions: false, captionLang: "pt", captionStyle: "viral", removeSilence: false, context: 3, ...p });

describe("identificação de momentos", () => {
  const { samples, audio, duration } = synth();
  const tl = buildTimeline(samples, audio, duration);
  const moments = buildMoments(tl);

  it("marca menus, carregamento e esperas como tempo morto", () => {
    const at = (t: number) => moments.find((m) => t >= m.start && t < m.end)!;
    expect(at(70).dead).toBe(true);
    expect(at(270).dead).toBe(true);
    expect(at(70).score).toBeLessThanOrEqual(12);
  });

  it("dá notas altas para perseguição, batida e explosão", () => {
    const action = moments.filter((m) => m.start >= 140 && m.end <= 215 && !m.dead);
    const calm = moments.filter((m) => m.start >= 285 && m.end <= 400);
    expect(Math.max(...action.map((m) => m.score))).toBeGreaterThan(55);
    expect(Math.max(...action.map((m) => m.score))).toBeGreaterThan(Math.max(...calm.map((m) => m.score)) + 15);
    expect(moments.every((m) => m.score >= 0 && m.score <= 100)).toBe(true);
    expect(moments.some((m) => m.category === "explosao")).toBe(true);
  });

  it("cada momento tem descrição, duração e miniatura dentro do trecho", () => {
    for (const m of moments) {
      expect(m.description.length).toBeGreaterThan(5);
      expect(m.thumbT).toBeGreaterThanOrEqual(m.start);
      expect(m.thumbT).toBeLessThanOrEqual(m.end);
    }
  });

  it("agrupa acontecimentos relacionados numa mesma história", () => {
    const threads = buildThreads(moments);
    const chase = threads.find((t) => t.start <= 160 && t.end >= 205);
    expect(chase).toBeTruthy();
  });

  describe("criação dos clipes", () => {
    it("modo histórias: clipes com a duração pedida, em ordem e sem repetir trechos", () => {
      const { clips } = generate(moments, tl.intensity, settings({ count: 2, duration: 30 }), duration);
      expect(clips.length).toBe(2);
      const all: [number, number][] = [];
      for (const c of clips) {
        const d = totalDuration(c.segments);
        expect(d).toBeGreaterThan(15);
        expect(d).toBeLessThanOrEqual(36);
        for (let i = 1; i < c.segments.length; i++) expect(c.segments[i].start).toBeGreaterThanOrEqual(c.segments[i - 1].end);
        all.push(...c.segments.map((s) => [s.start, s.end] as [number, number]));
        expect(c.beats.length).toBeGreaterThan(1);
      }
      all.sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < all.length; i++) expect(all[i][0]).toBeGreaterThanOrEqual(all[i - 1][1] - 0.001);
    });

    it("a história principal mantém contexto antes e o clímax (explosão)", () => {
      const { clips } = generate(moments, tl.intensity, settings({ count: 1, duration: 45 }), duration);
      const c = clips[0];
      expect(c.segments[0].start).toBeLessThan(150);
      expect(c.segments.some((s) => s.start <= 210 && s.end >= 207)).toBe(true);
    });

    it("pedido maior que o material: avisa em vez de inventar clipes", () => {
      const { clips, notes } = generate(moments, tl.intensity, settings({ count: 10, duration: 60 }), duration);
      expect(clips.length).toBeLessThan(10);
      expect(notes.join(" ")).toMatch(/material/);
    });

    it("modo história contínua: partes em sequência, sem tempo morto longo", () => {
      const { clips } = generate(moments, tl.intensity, settings({ mode: "continua", count: 4, duration: 60 }), duration);
      expect(clips.length).toBe(4);
      let last = -1;
      for (const c of clips) {
        expect(c.part).toBeDefined();
        expect(c.segments[0].start).toBeGreaterThanOrEqual(last);
        last = c.segments[c.segments.length - 1].end;
        for (const s of c.segments) expect(s.start >= 60 && s.end <= 80).toBe(false);
      }
      expect(clips[0].story).toMatch(/continua na parte 2/);
    });
  });
});

describe("linha do tempo", () => {
  const base = [seg(10, 20), seg(50, 55), seg(100, 110)];
  it("mapeia tempo do clipe ↔ original", () => {
    expect(totalDuration(base)).toBe(25);
    expect(outToSource(base, 12)).toEqual({ index: 1, src: 52 });
    expect(sourceToOut(base, 105)).toBe(20);
    expect(sourceToOut(base, 30)).toBeNull();
  });
  it("corta, exclui, reordena, ajusta e adiciona trechos", () => {
    let s = splitAt(base, 5);
    expect(s.length).toBe(4);
    expect(totalDuration(s)).toBe(25);
    s = removeSegment(s, s[0].id);
    expect(totalDuration(s)).toBe(20);
    s = moveSegment(s, s[s.length - 1].id, -1);
    expect(s[s.length - 1].start).toBe(50);
    s = trimSegment(s, s[0].id, 14, 30, 600);
    expect(s[0].start).toBe(14);
    s = insertSegment(s, 300, 304);
    expect(s[s.length - 1].start).toBe(300);
  });
  it("remoção de silêncios corta só trechos mudos e parados", () => {
    const audio = { rate: 4, rms: Array.from({ length: 400 }, (_, i) => (i >= 40 && i < 60 ? 0.01 : 0.5)) };
    const samples: Sample[] = Array.from({ length: 100 }, (_, i) => ({ t: i, motion: i >= 10 && i < 15 ? 0.01 : 0.3, brightness: 0.5, saturation: 0.4, fire: 0, siren: 0, detail: 0.2, variance: 0.3, cut: false, cx: 0.5 }));
    const out = removeSilences([seg(0, 30)], audio, samples);
    expect(out.length).toBe(2);
    expect(totalDuration(out)).toBeLessThan(27);
  });
});

describe("legendas", () => {
  it("limpa alucinações e repetições do reconhecimento de fala", () => {
    const out = cleanChunks([
      { text: " Corre, corre que a polícia tá vindo!", start: 1, end: 3 },
      { text: "Thank you for watching!", start: 3, end: 5 },
      { text: "Corre, corre que a polícia tá vindo!", start: 5, end: 6 },
      { text: "no no no no no no no", start: 6, end: 8 },
    ]);
    expect(out.length).toBe(1);
    expect(out[0].end).toBe(6);
  });
  it("detecta o idioma falado", () => {
    expect(detectLanguage("mano você viu isso? a polícia tá vindo aqui agora")).toBe("pt");
    expect(detectLanguage("oh man, what are you doing? get in the car")).toBe("en");
    expect(detectLanguage("¿qué haces? vamos, la policía está aquí")).toBe("es");
  });
  it("quebra frases longas e gera SRT no tempo do clipe", () => {
    const caps = chunksToCaptions([{ text: "a polícia tá chegando então acelera agora mesmo antes que seja tarde demais", start: 100, end: 106 }]);
    expect(caps.length).toBeGreaterThan(1);
    expect(caps.every((c) => c.text.split(" ").length <= 7)).toBe(true);
    const srt = toSrt(caps, [seg(98, 110)], "orig");
    expect(srt).toMatch(/00:00:02,000 -->/);
  });
});

describe("aprendizado com o canal", () => {
  it("só ajusta pesos com amostra real suficiente e no máximo ±20%", () => {
    const v = (title: string, views: number) => ({ id: title, title, description: "", tags: [], publishedAt: "", durationSec: 40, views, likes: 0, comments: 0, avgViewPct: null, minutesWatched: null, subscribersGained: null });
    const perf = analyzePerformance([v("Fuga da polícia #1", 9000), v("Perseguição insana", 12000), v("fuga absurda", 8000), v("Passeio de barco", 500), v("Explorando o mapa", 400), v("Explosão", 1000)]);
    const chase = perf.find((p) => p.category === "perseguicao")!;
    expect(chase.weight).toBeGreaterThan(1);
    expect(chase.weight).toBeLessThanOrEqual(1.2);
    expect(perf.find((p) => p.category === "explosao")?.weight).toBe(1);
    expect(isoDuration("PT1M5S")).toBe(65);
  });
});

describe("medidas de imagem", () => {
  it("detecta fogo, sirene, tela preta e movimento", () => {
    const w = 8;
    const h = 8;
    const fill = (r: number, g: number, b: number) => {
      const a = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < w * h; i++) a.set([r, g, b, 255], i * 4);
      return a;
    };
    const fire = frameStats(fill(250, 140, 40), w, h, null, null);
    expect(fire.fire).toBeGreaterThan(0.9);
    const black = frameStats(fill(2, 2, 2), w, h, null, null);
    expect(black.brightness).toBeLessThan(0.05);
    const blue = frameStats(fill(20, 40, 230), w, h, fill(2, 2, 2), black.hist);
    expect(blue.siren).toBeGreaterThan(0.9);
    expect(blue.motion).toBeGreaterThan(0.2);
  });
});

describe("modo partes sem cortes", () => {
  const settings: GenerateSettings = { mode: "cena", count: 5, duration: 60, format: "1:1", reframe: "desfocado", fps: 30, captions: true, captionLang: "orig", captionStyle: "basica", removeSilence: false, context: 3 };
  const mk = (id: string, start: number, end: number, score: number, dead = false) => ({ id, start, end, category: dead ? "carregamento" : "perseguicao", score, factors: {} as never, description: "", thumbT: start, dead, peakT: (start + end) / 2 }) as never;
  const moments = [mk("a", 0, 30, 5, true), mk("b", 30, 160, 80), mk("c", 160, 200, 5, true), mk("d", 200, 400, 60)];
  // Fala com pausas (silêncio) em instantes conhecidos
  const gaps = [[37, 38.5], [96, 97.5], [150, 151.2], [208, 209.5], [266, 267.5], [330, 331.5], [385, 386]];
  const inGap = (t: number) => gaps.some(([a, b]) => t >= a - 0.01 && t <= b + 0.01);
  const rms = Array.from({ length: 400 * 4 }, (_, i) => (gaps.some(([a, b]) => i / 4 >= a && i / 4 < b) ? 0.02 : 0.55 + 0.08 * Math.sin(i)));
  const audio = { rate: 4, rms };
  const intensity = Array.from({ length: 400 }, (_, t) => (t < 30 || (t >= 160 && t < 200) ? 0.05 : 0.6));
  const r = generate(moments, intensity, settings, 400, { audio, cuts: [] });

  it("gera Parte 1, 2, 3… em ordem, cada uma com um único trecho corrido", () => {
    expect(r.clips.length).toBeGreaterThanOrEqual(4);
    r.clips.forEach((c, i) => {
      expect(c.part).toBe(i + 1);
      expect(c.title.startsWith(`Parte ${i + 1}`)).toBe(true);
      expect(c.segments.length).toBe(1);
      expect(c.segments[0].end - c.segments[0].start).toBeGreaterThanOrEqual(20);
      expect(c.segments[0].end - c.segments[0].start).toBeLessThanOrEqual(80);
    });
  });

  it("uma parte continua de onde a outra parou (sem pular cena) e nunca corta alguém falando", () => {
    for (let i = 1; i < r.clips.length; i++) {
      const prev = r.clips[i - 1].segments[0];
      const cur = r.clips[i].segments[0];
      expect(cur.start).toBeGreaterThanOrEqual(prev.end - 0.01);
      // Ou continua na mesma pausa, ou pulou um tempo morto (carregamento)
      const sameScene = cur.start - prev.end < 2;
      if (sameScene) {
        expect(inGap(prev.end)).toBe(true);
        expect(inGap(cur.start)).toBe(true);
      } else expect(inGap(prev.end) || Math.abs(prev.end - 160) < 0.6).toBe(true);
    }
  });

  it("fica fora dos menus/carregamentos", () => {
    for (const c of r.clips) {
      const s = c.segments[0];
      expect(s.start).toBeGreaterThanOrEqual(30);
      expect(s.start >= 200 || s.end <= 160).toBe(true);
    }
  });
});

describe("partes com cenas de caminhada/espera no meio", () => {
  it("não quebra a parte quando o personagem só está andando ou parado (só menu/carregamento separam)", () => {
    const settings: GenerateSettings = { mode: "cena", count: 4, duration: 60, format: "1:1", reframe: "desfocado", fps: 30, captions: true, captionLang: "orig", captionStyle: "basica", removeSilence: false, context: 3 };
    const mk = (id: string, start: number, end: number, cat: string, dead: boolean) => ({ id, start, end, category: cat, score: dead ? 8 : 70, factors: {} as never, description: "", thumbT: start, dead, peakT: (start + end) / 2 }) as never;
    // Alterna ação e caminhada/espera a cada 20 s (como num gameplay real)
    const moments = Array.from({ length: 15 }, (_, i) => mk(`m${i}`, i * 20, i * 20 + 20, i % 2 ? (i % 4 === 1 ? "andando" : "parado") : "perseguicao", i % 2 === 1));
    const gaps = Array.from({ length: 30 }, (_, i) => [i * 10 + 6, i * 10 + 7.2]);
    const rms = Array.from({ length: 300 * 4 }, (_, i) => (gaps.some(([a, b]) => i / 4 >= a && i / 4 < b) ? 0.02 : 0.55));
    const intensity = Array.from({ length: 300 }, () => 0.4);
    const r = generate(moments, intensity, settings, 300, { audio: { rate: 4, rms }, cuts: [] });
    expect(r.clips.length).toBe(4);
    for (const c of r.clips) {
      const len = c.segments[0].end - c.segments[0].start;
      expect(len).toBeGreaterThanOrEqual(48);
      expect(len).toBeLessThanOrEqual(84);
    }
    for (let i = 1; i < r.clips.length; i++) expect(r.clips[i].segments[0].start - r.clips[i - 1].segments[0].end).toBeLessThan(1.5);
  });
});

describe("cena escura com conversa marcada como carregamento", () => {
  it("não quebra a parte nem cria parte curtinha", () => {
    const settings: GenerateSettings = { mode: "cena", count: 3, duration: 60, format: "1:1", reframe: "desfocado", fps: 30, captions: true, captionLang: "orig", captionStyle: "basica", removeSilence: false, context: 3 };
    const mk = (id: string, start: number, end: number, cat: string, dead: boolean) => ({ id, start, end, category: cat, score: dead ? 8 : 70, factors: {} as never, description: "", thumbT: start, dead, peakT: (start + end) / 2 }) as never;
    // 0–50 ação, 50–70 «carregamento» (na verdade noite com conversa), 70–175 ação, 175–180 ação curta
    const moments = [mk("a", 0, 50, "perseguicao", false), mk("b", 50, 70, "carregamento", true), mk("c", 70, 180, "perseguicao", false)];
    const gaps = Array.from({ length: 18 }, (_, i) => [i * 10 + 6, i * 10 + 7.2]);
    const rms = Array.from({ length: 180 * 4 }, (_, i) => (gaps.some(([a, b]) => i / 4 >= a && i / 4 < b) ? 0.02 : 0.55));
    const r = generate(moments, Array(180).fill(0.4), settings, 180, { audio: { rate: 4, rms }, cuts: [] });
    expect(r.clips.length).toBe(3);
    for (const c of r.clips) expect(c.segments[0].end - c.segments[0].start).toBeGreaterThanOrEqual(45);
  });
});
