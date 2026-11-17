// Continuidade narrativa: transforma os momentos em histórias curtas com começo,
// desenvolvimento e conclusão, na ordem em que aconteceram, ou em episódios sequenciais.

import type { AudioEnvelope, Category, Clip, GenerateSettings, Moment, Segment } from "./types";
import { category, linked } from "./categories";
import { mergeContiguous, seg, totalDuration } from "./timeline";
import { defaultStyle } from "./captions";
import { uid } from "./format";

/** Uma "linha" de acontecimentos relacionados (ex.: crime → polícia → fuga → batida). */
export interface Thread {
  moments: Moment[];
  start: number;
  end: number;
  score: number;
  climax: Moment;
}

/** Tempo morto curto entre acontecimentos ligados ainda pertence à mesma história. */
const MAX_GAP = 20;

export function buildThreads(moments: Moment[]): Thread[] {
  const live = moments.filter((m) => !m.dead && m.score >= 18);
  const threads: Thread[] = [];
  let cur: Moment[] = [];
  const flush = () => {
    if (!cur.length) return;
    const climax = cur.reduce((a, b) => (b.score > a.score ? b : a));
    const top3 = [...cur].sort((a, b) => b.score - a.score).slice(0, 3);
    const score = climax.score * 0.6 + (top3.reduce((a, m) => a + m.score, 0) / top3.length) * 0.4;
    threads.push({ moments: cur, start: cur[0].start, end: cur[cur.length - 1].end, score, climax });
    cur = [];
  };
  for (const m of live) {
    const last = cur[cur.length - 1];
    if (last) {
      const gap = m.start - last.end;
      const related = linked(last.category, m.category) || (category(last.category).action && category(m.category).action);
      if (gap > MAX_GAP || (!related && gap > 4) || m.end - cur[0].start > 240) flush();
    }
    cur.push(m);
  }
  flush();
  return threads;
}

/** Divide uma linha longa em duas no ponto mais calmo (para gerar mais histórias diferentes). */
function splitThread(t: Thread): Thread[] | null {
  if (t.moments.length < 4) return null;
  let best = -1;
  let low = Infinity;
  for (let i = 2; i < t.moments.length - 1; i++) {
    const v = t.moments[i].score;
    if (v < low) ((low = v), (best = i));
  }
  if (best < 0) return null;
  const parts = [t.moments.slice(0, best), t.moments.slice(best)];
  return parts.map((ms) => {
    const climax = ms.reduce((a, b) => (b.score > a.score ? b : a));
    return { moments: ms, start: ms[0].start, end: ms[ms.length - 1].end, score: climax.score * 0.6 + (ms.reduce((a, m) => a + m.score, 0) / ms.length) * 0.4, climax };
  });
}

/** Recorta a linha nas pontas: fica do primeiro ao último acontecimento forte, com um vizinho de cada lado. */
export function trimThread(t: Thread): Thread {
  const strongMin = Math.max(45, t.climax.score * 0.75);
  const idx = t.moments.map((m, i) => (m.score >= strongMin ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) return t;
  const a = Math.max(0, idx[0] - 1);
  const b = Math.min(t.moments.length - 1, idx[idx.length - 1] + 1);
  const ms = t.moments.slice(a, b + 1);
  return { ...t, moments: ms, start: ms[0].start, end: ms[ms.length - 1].end };
}

interface Piece {
  start: number;
  end: number;
  score: number;
}

/**
 * Escolhe os trechos de uma história para caber em `target` segundos:
 * mantém contexto antes do primeiro acontecimento, um bloco contínuo em volta do clímax e um
 * desfecho, e completa com os melhores trechos vizinhos — sempre em ordem cronológica.
 */
export function pickStoryBlocks(t0: Thread, all: Moment[], target: number, context: number, duration: number): Segment[] {
  const t = trimThread(t0);
  const first = t.moments.find((m) => m.score >= Math.max(45, t.climax.score * 0.75)) ?? t.moments[0];
  const peak = t.climax.peakT;
  // Linha do tempo por segundo da história: nota de cada segundo
  const lo = Math.max(0, first.start - context);
  const hi = Math.min(duration, t.end);
  const secScore = (sec: number) => {
    const m = t.moments.find((x) => sec >= x.start && sec < x.end) ?? all.find((x) => sec >= x.start && sec < x.end);
    if (!m) return 0;
    if (m.dead) return sec >= first.start - context && sec < first.start ? 8 : -50;
    return m.score + (Math.abs(sec - m.peakT) < 2.5 ? 20 : 0);
  };
  const usable: number[] = [];
  for (let sec = Math.floor(lo); sec < Math.ceil(hi); sec++) if (secScore(sec) > 0) usable.push(sec);
  const picked = new Set<number>();
  const add = (a: number, b: number) => {
    for (let sec = Math.floor(a); sec < Math.ceil(b); sec++) if (usable.includes(sec)) picked.add(sec);
  };
  if (usable.length <= target * 1.08) usable.forEach((x) => picked.add(x));
  else {
    // 1) Contexto antes do primeiro acontecimento (encolhe em clipes muito curtos)
    const ctx = Math.min(context, Math.max(1.5, target * 0.1));
    add(first.start - ctx, first.start);
    // 2) Começo do primeiro acontecimento
    add(first.start, first.start + Math.min(4, target * 0.12));
    // 3) Clímax contínuo (antes e depois do pico)
    add(peak - target * 0.22, peak + target * 0.13);
    // 4) Desfecho: os segundos finais da história, se não forem tempo morto
    const lastLive = [...usable].reverse()[0];
    if (lastLive > peak + 3) add(lastLive - Math.min(3, target * 0.1), lastLive + 1);
    // 5) Completa com os melhores segundos, preferindo os vizinhos do que já entrou
    const rank = (sec: number) => secScore(sec) + (picked.has(sec - 1) || picked.has(sec + 1) ? 25 : 0);
    while (picked.size < target) {
      const cands = usable.filter((x) => !picked.has(x));
      if (!cands.length) break;
      let best = cands[0];
      let bv = -Infinity;
      for (const c of cands) {
        const v = rank(c);
        if (v > bv) ((bv = v), (best = c));
      }
      picked.add(best);
      // Ganha blocos de pelo menos 2 s para não picotar
      if (!picked.has(best + 1) && usable.includes(best + 1) && picked.size < target) picked.add(best + 1);
    }
    // Remove ilhas de 1 s isoladas (picotam o vídeo) se sobrar tempo
    for (const sec of [...picked]) if (!picked.has(sec - 1) && !picked.has(sec + 1) && picked.size > target * 0.9) picked.delete(sec);
  }
  const secs = [...picked].sort((a, b) => a - b);
  const pieces: Piece[] = [];
  for (const sec of secs) {
    const last = pieces[pieces.length - 1];
    if (last && sec === last.end) last.end = sec + 1;
    else pieces.push({ start: sec, end: sec + 1, score: 0 });
  }
  return mergeContiguous(pieces.map((p) => seg(Math.max(0, p.start), Math.min(duration, p.end))), 0.6);
}

const ARC_LABEL = ["Começo", "Desenvolvimento", "Clímax", "Desfecho"] as const;

/** Rótulos da história (começo, desenvolvimento, clímax, desfecho) com o tempo original. */
export function storyBeats(t0: Thread, segments: Segment[]): { t: number; label: string }[] {
  const t = trimThread(t0);
  const beats: { t: number; label: string }[] = [];
  const kept = t.moments.filter((m) => segments.some((s) => s.start < m.end && s.end > m.start));
  if (!kept.length) return beats;
  beats.push({ t: kept[0].start, label: `${ARC_LABEL[0]}: ${category(kept[0].category).name.toLowerCase()}` });
  for (const m of kept.slice(1)) {
    if (m === t.climax) beats.push({ t: m.peakT, label: `${ARC_LABEL[2]}: ${category(m.category).name.toLowerCase()}` });
    else if (m.start < t.climax.start) beats.push({ t: m.start, label: `${ARC_LABEL[1]}: ${category(m.category).name.toLowerCase()}` });
  }
  if (kept[0] === t.climax) beats.push({ t: t.climax.peakT, label: `${ARC_LABEL[2]}: ${category(t.climax.category).name.toLowerCase()}` });
  const last = segments[segments.length - 1];
  beats.push({ t: last.end - 1, label: `${ARC_LABEL[3]}` });
  return beats;
}

const TITLE_BY_PAIR: Partial<Record<string, string>> = {
  "perseguicao>acidente": "A fuga terminou numa batida",
  "perseguicao>explosao": "A perseguição acabou em explosão",
  "policia>perseguicao": "A polícia não deu trégua",
  "tiroteio>policia": "O tiroteio chamou a polícia",
  "acidente>explosao": "Bateu… e explodiu",
  "queda>engracado": "A queda mais absurda",
  "aereo>queda": "Do céu direto para o chão",
  "briga>policia": "A briga que virou caso de polícia",
};

const TITLE_BY_CAT: Record<Category, string> = {
  perseguicao: "Fuga alucinante da polícia",
  policia: "Cercado pela polícia",
  explosao: "Que explosão foi essa?",
  acidente: "A batida que ninguém esperava",
  tiroteio: "Troca de tiros no meio da cidade",
  briga: "A briga saiu do controle",
  engracado: "Isso só acontece no GTA",
  queda: "Que queda!",
  aereo: "Voo arriscado",
  aquatico: "Fuga pela água",
  cinematico: "Cena de cinema",
  cutscene: "Momento da história",
  conducao: "Pé na estrada",
  andando: "Passeio",
  menu: "Menu",
  carregamento: "Carregando",
  mapa: "Mapa",
  parado: "Espera",
};

export function storyTitle(t: Thread): string {
  const cats = t.moments.map((m) => m.category);
  for (let i = 0; i < cats.length; i++) {
    for (let j = i + 1; j < cats.length; j++) {
      const key = `${cats[i]}>${cats[j]}`;
      if (TITLE_BY_PAIR[key]) return TITLE_BY_PAIR[key]!;
    }
  }
  return TITLE_BY_CAT[t.climax.category];
}

export function storySummary(t: Thread): string {
  const names = [...new Set(t.moments.map((m) => category(m.category).name.toLowerCase()))];
  if (names.length === 1) return `Trecho de ${names[0]}, com o melhor momento aos ${Math.floor(t.climax.peakT / 60)}:${String(Math.floor(t.climax.peakT % 60)).padStart(2, "0")}.`;
  return `Começa com ${names[0]}, passa por ${names.slice(1, -1).join(", ") || names[1]} e termina com ${names[names.length - 1]}.`;
}

function baseClip(settings: GenerateSettings, partial: Pick<Clip, "title" | "story" | "beats" | "category" | "score" | "segments"> & { part?: number }): Clip {
  return {
    id: uid("c"),
    ...partial,
    format: settings.format,
    reframe: settings.reframe,
    // Quadrado com fundo desfocado: aproxima um pouco (mostra ~75% da largura, quase nada fica de fora)
    zoom: settings.reframe === "desfocado" && settings.format === "1:1" ? 1.3 : 1,
    fps: settings.fps,
    captions: [],
    captionLang: settings.captionLang,
    captionsOn: settings.captions,
    captionStyle: defaultStyle(settings.captionStyle, settings.format),
    adjust: { brightness: 1, contrast: 1, saturation: 1 },
    volume: 1,
    normalize: true,
    transition: "fade",
    removeSilence: settings.removeSilence,
    updatedAt: Date.now(),
  };
}

export interface GenerateResult {
  clips: Clip[];
  notes: string[];
}

/** Modo histórias: cada clipe conta uma história diferente, sem repetir trechos. */
export function generateStories(moments: Moment[], settings: GenerateSettings, duration: number): GenerateResult {
  const notes: string[] = [];
  let threads = buildThreads(moments).sort((a, b) => b.score - a.score);
  // Sem material suficiente: divide as linhas mais longas em histórias menores
  let guard = 0;
  while (threads.length < settings.count && guard++ < 20) {
    const longest = [...threads].sort((a, b) => b.end - b.start - (a.end - a.start))[0];
    if (!longest || longest.end - longest.start < settings.duration * 0.9) break;
    const parts = splitThread(longest);
    if (!parts) break;
    threads = [...threads.filter((t) => t !== longest), ...parts].sort((a, b) => b.score - a.score);
  }
  const chosen = threads.slice(0, settings.count);
  if (chosen.length < settings.count) notes.push(`O vídeo tem material para ${chosen.length} história(s) diferente(s) sem repetir trechos; foram criados ${chosen.length} clipe(s) em vez de ${settings.count}.`);
  const clips = chosen
    .sort((a, b) => a.start - b.start)
    .map((t) => {
      const segments = pickStoryBlocks(t, moments, settings.duration, settings.context, duration);
      const len = totalDuration(segments);
      if (t.score < 45) notes.push(`«${storyTitle(t)}» tem pouca ação: é o melhor material que sobrou, mas pode render menos.`);
      if (len < settings.duration * 0.6) notes.push(`«${storyTitle(t)}» ficou com ${Math.round(len)}s: não havia mais acontecimentos relevantes nessa história para chegar a ${Math.round(settings.duration)}s.`);
      return baseClip(settings, { title: storyTitle(t), story: storySummary(t), beats: storyBeats(t, segments), category: t.climax.category, score: Math.round(t.score), segments });
    });
  return { clips, notes };
}

/**
 * Modo história contínua: divide a gravação em episódios sequenciais. Corta o tempo morto,
 * mantém a ordem e encerra cada parte num momento de tensão (gancho real para a próxima).
 */
export function generateContinuous(moments: Moment[], intensity: number[], settings: GenerateSettings): GenerateResult {
  const notes: string[] = [];
  // Tempo útil: tudo que não é tempo morto (pausas curtas de até 2 s ficam, para não picotar)
  const useful: Moment[] = moments.filter((m) => !m.dead || m.end - m.start <= 2);
  let blocks: { start: number; end: number; score: number }[] = useful.map((m) => ({ start: m.start, end: m.end, score: m.dead ? 0 : m.score }));
  const capacity = settings.count * settings.duration;
  const total = blocks.reduce((a, b) => a + (b.end - b.start), 0);
  if (total > capacity) {
    // Comprime cada momento em vez de pular momentos inteiros: a continuidade fica preservada.
    // Momentos fracos encolhem mais; cada um mantém a janela em volta do seu pico.
    // Sem picotar demais: cada momento precisa de pelo menos ~6 s; se nem assim couber,
    // os momentos mais fracos saem primeiro.
    const minKeep = (b: { start: number; end: number }) => Math.min(b.end - b.start, 6);
    let dropped = 0;
    while (blocks.reduce((a, b) => a + minKeep(b), 0) > capacity * 0.85 && blocks.length > 1) {
      const weakest = blocks.reduce((a, b) => (b.score < a.score ? b : a));
      blocks = blocks.filter((b) => b !== weakest);
      dropped++;
    }
    if (dropped) notes.push(`${dropped} trecho(s) fraco(s) ficaram de fora para não picotar os episódios.`);
    const weight = (b: { score: number }) => 0.25 + b.score / 100;
    let r = 1;
    for (let it = 0; it < 30; it++) {
      const sum = blocks.reduce((a, b) => a + Math.min(b.end - b.start, (b.end - b.start) * r * weight(b)), 0);
      r *= capacity / Math.max(1, sum);
    }
    const peakOf = (b: { start: number; end: number }) => moments.find((m) => m.start === b.start)?.peakT ?? (b.start + b.end) / 2;
    blocks = blocks
      .map((b) => {
        const len = b.end - b.start;
        const keep = Math.round(Math.min(len, len * r * weight(b)));
        if (keep < 2) return null;
        const p = peakOf(b);
        const start = Math.max(b.start, Math.min(b.end - keep, Math.round(p - keep * 0.6)));
        return { start, end: start + keep, score: b.score };
      })
      .filter((b): b is { start: number; end: number; score: number } => b !== null);
    notes.push(`A gravação tem mais acontecimentos do que cabe em ${settings.count} parte(s) de ${Math.round(settings.duration)}s: cada momento foi encurtado (os mais fracos, mais), sem pular a sequência.`);
  }
  // Linha contínua com o tempo útil
  const flat: { src: number; out: number }[] = [];
  let out = 0;
  for (const b of blocks) {
    for (let s = b.start; s < b.end; s++) {
      flat.push({ src: s, out });
      out++;
    }
  }
  const parts = Math.min(settings.count, Math.max(1, Math.ceil(flat.length / Math.max(5, settings.duration * 0.5))));
  if (parts < settings.count) notes.push(`Só há material útil para ${parts} parte(s).`);
  const per = flat.length / parts;
  const cuts: number[] = [0];
  for (let p = 1; p < parts; p++) {
    // Procura um gancho entre 80% e 100% da parte: intensidade alta e subindo
    const ideal = Math.round(p * per);
    let best = ideal;
    let bestV = -Infinity;
    for (let k = Math.max(cuts[cuts.length - 1] + 5, Math.round(ideal - per * 0.2)); k <= Math.min(flat.length - 5, ideal); k++) {
      const src = flat[k].src;
      const v = (intensity[src] ?? 0) + Math.max(0, (intensity[src] ?? 0) - (intensity[src - 2] ?? 0)) * 1.5 - (intensity[src + 2] ?? 0) * 0.3;
      if (v > bestV) ((bestV = v), (best = k));
    }
    cuts.push(best);
  }
  cuts.push(flat.length);
  const clips: Clip[] = [];
  for (let p = 0; p < parts; p++) {
    const range = flat.slice(cuts[p], cuts[p + 1]);
    if (!range.length) continue;
    const segments = mergeContiguous(range.map((r) => seg(r.src, r.src + 1)), 0.6);
    const inPart = moments.filter((m) => !m.dead && segments.some((s) => s.start < m.end && s.end > m.start));
    const best = inPart.reduce<Moment | null>((a, b) => (!a || b.score > a.score ? b : a), null);
    const lastM = inPart[inPart.length - 1];
    const cliff = p < parts - 1 && lastM ? ` Termina em ${category(lastM.category).name.toLowerCase()} — continua na parte ${p + 2}.` : "";
    clips.push(
      baseClip(settings, {
        title: `Parte ${p + 1}${best ? ` — ${TITLE_BY_CAT[best.category]}` : ""}`,
        story: `Episódio ${p + 1} de ${parts}, em ordem cronológica.${cliff}`,
        beats: inPart.slice(0, 6).map((m) => ({ t: m.start, label: category(m.category).name })),
        category: best?.category ?? "conducao",
        score: best?.score ?? 0,
        segments,
        part: p + 1,
      }),
    );
  }
  return { clips, notes };
}

export interface SceneSignals {
  /** Volume do áudio 4×/s (para achar as pausas da fala). */
  audio?: AudioEnvelope | null;
  /** Corte de cena em cada segundo. */
  cuts?: boolean[];
}

export function generate(moments: Moment[], intensity: number[], settings: GenerateSettings, duration: number, signals: SceneSignals = {}): GenerateResult {
  if (settings.mode === "continua") return generateContinuous(moments, intensity, settings);
  if (settings.mode === "historias") return generateStories(moments, settings, duration);
  return generateScenes(moments, intensity, settings, duration, signals);
}

// ---------- Modo cena contínua ----------

/** Pausa na fala/som: candidata a começo ou fim natural de um clipe. */
export interface Pause {
  a: number;
  b: number;
  /** Força da pausa (0–1): pausas longas e cortes de cena valem mais. */
  w: number;
}

/** Acha as pausas do áudio (trechos baixos de pelo menos 0,5 s) e os cortes de cena. */
export function findPauses(audio: AudioEnvelope | null | undefined, cuts: boolean[] = []): Pause[] {
  const out: Pause[] = [];
  if (audio && audio.rms.length > 4) {
    const sorted = [...audio.rms].sort((x, y) => x - y);
    const p30 = sorted[Math.floor(sorted.length * 0.3)];
    const p90 = sorted[Math.floor(sorted.length * 0.9)] || 1;
    // Baixo = perto do fundo do áudio (o jogo nunca fica mudo: o limite é relativo)
    const med = sorted[Math.floor(sorted.length * 0.5)];
    // Precisa ser bem mais baixo que o normal (som contínuo sem pausa real não vira «pausa»)
    const thr = Math.min(p30 + (p90 - p30) * 0.18, med * 0.6);
    let start = -1;
    for (let i = 0; i <= audio.rms.length; i++) {
      const quiet = i < audio.rms.length && audio.rms[i] <= thr;
      if (quiet && start < 0) start = i;
      if (!quiet && start >= 0) {
        const a = start / audio.rate;
        const b = i / audio.rate;
        // Pausa de verdade: pelo menos ~0,75 s (as sílabas da fala têm quedas menores)
        if (b - a >= 0.74) {
          const cut = cuts.some((c, t) => c && t >= a - 0.6 && t <= b + 0.6);
          out.push({ a, b, w: Math.min(1, (b - a) / 1.5) * 0.75 + (cut ? 0.25 : 0) });
        }
        start = -1;
      }
    }
  }
  // Sem áudio útil: os cortes de cena servem de fronteira
  if (!out.length) cuts.forEach((c, t) => c && out.push({ a: t, b: t + 0.5, w: 0.6 }));
  return out;
}

/** Ponto mais silencioso (média de ~0,75 s) entre dois instantes: o lugar menos provável de cortar uma fala. */
export function quietestPoint(audio: AudioEnvelope | null | undefined, from: number, to: number): number | null {
  if (!audio || !audio.rms.length || to - from < 1) return null;
  const w = Math.max(1, Math.round(audio.rate * 0.75));
  const i0 = Math.max(0, Math.floor(from * audio.rate));
  const i1 = Math.min(audio.rms.length - w, Math.floor(to * audio.rate) - w);
  let best = -1;
  let bestV = Infinity;
  let sum = 0;
  for (let k = i0; k < i0 + w && k < audio.rms.length; k++) sum += audio.rms[k];
  for (let i = i0; i <= i1; i++) {
    if (sum < bestV) {
      bestV = sum;
      best = i;
    }
    sum += (audio.rms[i + w] ?? 0) - audio.rms[i];
  }
  return best < 0 ? null : (best + w / 2) / audio.rate;
}

/**
 * Ajusta o começo e o fim do trecho para pausas naturais: começa logo antes de alguém começar a
 * falar (nunca no meio de uma frase ou já na resposta) e termina depois que a frase acaba.
 */
export function snapWindow(s: number, e: number, pauses: Pause[], duration: number, minL: number, maxL: number, lo = 0, hi = duration): { start: number; end: number } {
  let best = { start: s, score: -Infinity };
  for (const p of pauses) {
    const t = Math.max(p.a, p.b - 0.3);
    if (t < lo || t >= hi || t < s - 12 || p.a > s + 8) continue;
    const sc = p.w - Math.abs(t - s) * 0.03;
    if (sc > best.score) best = { start: t, score: sc };
  }
  const start = Math.max(lo, best.score > -Infinity ? best.start : s);
  let bestE = { end: Math.min(hi, start + (e - s)), score: -Infinity };
  for (const p of pauses) {
    const t = Math.min(p.b, p.a + 0.4);
    const len = t - start;
    if (t > hi || len < minL || len > maxL) continue;
    const sc = p.w - Math.abs(t - e) * 0.03;
    if (sc > bestE.score) bestE = { end: t, score: sc };
  }
  const end = Math.min(hi, duration, bestE.end);
  return { start: Math.round(start * 100) / 100, end: Math.round(end * 100) / 100 };
}

/**
 * Modo partes sem cortes (padrão): a gravação vira Parte 1, 2, 3… em sequência — cada parte é UM
 * trecho corrido (nenhum corte dentro dela) e a divisão entre as partes cai sempre numa pausa da
 * fala, nunca com alguém falando. Telas de menu/carregamento longas ficam de fora (entre as partes).
 * Se o vídeo tem mais material que o pedido, as partes saem do trecho seguido com mais ação.
 */
export function generateScenes(moments: Moment[], intensity: number[], settings: GenerateSettings, duration: number, signals: SceneSignals = {}): GenerateResult {
  const notes: string[] = [];
  if (!moments.length) return { clips: [], notes: ["A análise não encontrou momentos neste vídeo."] };
  const n = Math.max(1, Math.ceil(duration));
  const L = Math.min(settings.duration, duration);
  // Duração flexível: perto da pedida, um pouco menos ou um pouco mais para fechar a fala
  const minL = Math.max(5, L * 0.8);
  const maxL = L * 1.25;
  const pauses = findPauses(signals.audio, signals.cuts);

  // Só telas que não são jogo separam as partes (menu, mapa, carregamento). Andar, conversar ou
  // ficar parado fazem parte da cena e continuam dentro da parte.
  const HARD = new Set(["menu", "carregamento", "mapa"]);
  const deadRuns: [number, number][] = [];
  for (const m of [...moments].filter((x) => x.dead && HARD.has(x.category)).sort((x, y) => x.start - y.start)) {
    const last = deadRuns[deadRuns.length - 1];
    if (last && m.start <= last[1] + 0.5) last[1] = Math.max(last[1], m.end);
    else deadRuns.push([m.start, m.end]);
  }
  const longDead = deadRuns.filter(([a0, b0]) => b0 - a0 >= 4);
  const spans: [number, number][] = [];
  let cur = 0;
  for (const [a0, b0] of longDead) {
    if (a0 - cur >= 5) spans.push([cur, a0]);
    cur = Math.max(cur, b0);
  }
  if (duration - cur >= 5) spans.push([cur, duration]);
  if (!spans.length) return { clips: [], notes: ["O vídeo é quase todo tempo morto (menus, carregamentos); não há trecho para virar clipe."] };

  // Interesse por segundo (para escolher onde começar quando sobra material)
  const val = new Float32Array(n);
  for (let i = 0; i < n; i++) val[i] = intensity[i] ?? 0;
  for (const m of moments) for (let t = Math.max(0, Math.floor(m.start)); t < Math.min(n, Math.ceil(m.end)); t++) val[t] = m.dead ? 0 : val[t] + (m.score / 100) * 0.8;
  const usable: number[] = [];
  for (const [a0, b0] of spans) for (let t = Math.ceil(a0); t < Math.floor(b0); t++) usable.push(t);
  const need = Math.round(settings.count * L);
  let startIdx = 0;
  if (usable.length > need * 1.05) {
    let sum = 0;
    for (let i = 0; i < need; i++) sum += val[usable[i]];
    let best = sum;
    for (let i = 1; i + need <= usable.length; i++) {
      sum += val[usable[i + need - 1]] - val[usable[i - 1]];
      if (sum > best) {
        best = sum;
        startIdx = i;
      }
    }
  }
  let si = spans.findIndex(([a0, b0]) => usable[startIdx] >= a0 && usable[startIdx] < b0);
  if (si < 0) si = 0;
  // Começo da Parte 1: logo antes de uma fala começar (pausa perto do ponto escolhido)
  let cursor = startIdx === 0 ? spans[si][0] : snapWindow(usable[startIdx], usable[startIdx] + L, pauses, duration, minL, maxL, spans[si][0], spans[si][1]).start;

  const parts: { start: number; end: number }[] = [];
  while (parts.length < settings.count && si < spans.length) {
    const limit = spans[si][1];
    if (limit - cursor < 5) {
      si++;
      if (si < spans.length) cursor = spans[si][0];
      continue;
    }
    let end: number;
    let next: number;
    const rem = limit - cursor;
    // Sobra pouco depois desta parte? Então esta parte vai até o fim do trecho (um pouco mais longa)
    // ou o resto vira duas partes parecidas — nunca uma parte curtinha no final.
    const target = rem <= L * 1.4 ? rem : rem < L + minL ? rem / 2 : L;
    const lo = Math.min(minL, target * 0.85);
    if (rem <= L * 1.4 || target < 5) {
      // O trecho acaba antes de um tempo morto: a parte vai até ele (sem cortar no meio)
      end = limit;
      next = limit;
    } else {
      // Divide numa pausa perto da duração pedida (melhor pausa = mais longa / com corte de cena)
      let best: { end: number; next: number; score: number } | null = null;
      for (const p of pauses) {
        const e0 = Math.min(p.b, p.a + 0.4);
        const len = e0 - cursor;
        if (len < lo || len > maxL || e0 > limit - 5) continue;
        const sc = p.w - (Math.abs(len - target) / L) * 0.9;
        if (!best || sc > best.score) best = { end: e0, next: Math.max(e0, p.b - 0.3), score: sc };
      }
      // Sem pausa clara (música/barulho contínuo): corta no ponto mais silencioso da faixa permitida
      const q = best ? null : quietestPoint(signals.audio, cursor + Math.max(lo, target * 0.85), Math.min(limit - 5, cursor + Math.min(maxL, target * 1.15)));
      end = best ? best.end : q ?? Math.min(limit, cursor + target);
      next = best ? best.next : end;
    }
    parts.push({ start: Math.round(cursor * 100) / 100, end: Math.round(end * 100) / 100 });
    cursor = next;
    if (limit - cursor < 5) {
      si++;
      if (si < spans.length) cursor = spans[si][0];
    }
  }
  if (parts.length < settings.count) notes.push(`O vídeo tem material para ${parts.length} parte(s) de ~${Math.round(L)}s; foram criadas ${parts.length} em vez de ${settings.count}.`);
  const clips = parts.map((w, k) => {
    const inside = moments.filter((m) => !m.dead && m.end > w.start && m.start < w.end);
    const climax = inside.length ? inside.reduce((a0, b0) => (b0.score > a0.score ? b0 : a0)) : moments.find((m) => m.end > w.start && m.start < w.end) ?? moments[0];
    const thread: Thread = { moments: inside.length ? inside : [climax], start: w.start, end: w.end, score: climax.score, climax };
    const score = inside.length ? Math.round(climax.score * 0.6 + (inside.reduce((a0, m) => a0 + m.score, 0) / inside.length) * 0.4) : Math.round(climax.score);
    const beats = [
      { t: w.start, label: `Começo: ${category(thread.moments[0].category).name.toLowerCase()}` },
      ...(climax.peakT > w.start + 3 && climax.peakT < w.end - 3 ? [{ t: climax.peakT, label: `Clímax: ${category(climax.category).name.toLowerCase()}` }] : []),
      { t: Math.max(w.start, w.end - 1), label: k < parts.length - 1 ? "Continua na próxima parte" : "Fim" },
    ];
    return {
      ...baseClip(settings, { title: `Parte ${k + 1} — ${storyTitle(thread)}`, story: `${storySummary(thread)} Trecho corrido, sem cortes no meio${k < parts.length - 1 ? "; a Parte " + (k + 2) + " continua daqui" : ""}.`, beats, category: climax.category, score, segments: [seg(w.start, w.end)], part: k + 1 }),
      removeSilence: false,
    };
  });
  return { clips, notes };
}
