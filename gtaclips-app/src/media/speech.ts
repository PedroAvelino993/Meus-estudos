// Legendas automáticas: extrai o áudio dos trechos do clipe, transcreve com o Whisper no
// aparelho, limpa erros comuns, separa vozes (estimativa) e traduz.

import { readAudio } from "./frames";
import type { Caption, Segment } from "../core/types";
import { assignSpeakers, chunksToCaptions, cleanChunks, detectLanguage, estimatePitch, LANGUAGES, type RawChunk } from "../core/captions";
import { openInput } from "./probe";
import { transcribe, translateLocal, WHISPER_LANG, type ModelProgress } from "./ai";
import { claudeAvailable, claudeFixAndTranslate } from "./claude";

/** Junta trechos próximos para transcrever menos vezes (e com mais contexto). */
function ranges(segments: Segment[]): [number, number][] {
  const sorted = [...segments].sort((a, b) => a.start - b.start).map((s) => [Math.max(0, s.start - 0.5), s.end + 0.5] as [number, number]);
  const out: [number, number][] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1] + 3) last[1] = Math.max(last[1], r[1]);
    else out.push([...r]);
  }
  return out;
}

/** Decodifica um intervalo do áudio original em mono 16 kHz (formato do Whisper). */
export async function audio16k(file: Blob, start: number, end: number): Promise<Float32Array> {
  const input = openInput(file);
  try {
    const at = await input.getPrimaryAudioTrack();
    if (!at) return new Float32Array(0);
    const rate = at.sampleRate;
    const len = Math.max(1, Math.round((end - start) * rate));
    const mono = new Float32Array(len);
    for await (const { buffer, timestamp } of readAudio(at, start, end)) {
      const off = Math.round((timestamp - start) * rate);
      const chans = Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c));
      for (let i = 0; i < buffer.length; i++) {
        const j = off + i;
        if (j < 0 || j >= len) continue;
        let v = 0;
        for (const ch of chans) v += ch[i];
        mono[j] = v / chans.length;
      }
    }
    if (rate === 16000) return mono;
    const outLen = Math.round((end - start) * 16000);
    const off = new OfflineAudioContext(1, outLen, 16000);
    const src = off.createBufferSource();
    const buf = off.createBuffer(1, len, rate);
    buf.copyToChannel(mono, 0);
    src.buffer = buf;
    src.connect(off.destination);
    src.start();
    const res = await off.startRendering();
    return res.getChannelData(0).slice();
  } finally {
    input.dispose();
  }
}

export interface CaptionJobProgress {
  value: number;
  detail: string;
}

export interface CaptionOptions {
  model: string;
  /** Idioma falado, se o usuário souber ("auto" = detectar). */
  spoken: string;
  /** Idioma de destino das legendas ("orig" = o falado). */
  target: string;
  onProgress?: (p: CaptionJobProgress) => void;
}

export async function generateCaptions(file: Blob, segments: Segment[], opts: CaptionOptions): Promise<{ captions: Caption[]; spokenLang: string | null; notes: string[] }> {
  const notes: string[] = [];
  const rs = ranges(segments);
  const totalLen = rs.reduce((a, r) => a + (r[1] - r[0]), 0);
  let done = 0;
  const raw: RawChunk[] = [];
  const pitches = new Map<string, number | null>();
  const audios: { start: number; pcm: Float32Array }[] = [];
  const modelFiles = new Map<string, ModelProgress>();
  let detected: string | null = opts.spoken !== "auto" ? opts.spoken : null;
  for (const [a, b] of rs) {
    opts.onProgress?.({ value: (done / totalLen) * 0.7, detail: "Extraindo o áudio do trecho…" });
    const pcm = await audio16k(file, a, b);
    audios.push({ start: a, pcm: pcm.slice() });
    const res = await transcribe(pcm, { model: opts.model, language: detected ? WHISPER_LANG[detected] : undefined }, (p) => {
      if (p.file) modelFiles.set(p.file, p);
      const tot = [...modelFiles.values()].reduce((x, f) => x + (f.total || 0), 0);
      const got = [...modelFiles.values()].reduce((x, f) => x + (f.loaded || 0), 0);
      if (tot && got < tot) opts.onProgress?.({ value: 0.05, detail: `Baixando o modelo de fala: ${Math.round(got / 1e6)} de ${Math.round(tot / 1e6)} MB (uma vez só)` });
    });
    // O idioma detectado no primeiro trecho vale para os seguintes (mais rápido e consistente)
    if (!detected && res.detected) detected = res.detected;
    for (const c of res.chunks) raw.push({ text: c.text, start: a + c.start, end: a + Math.max(c.end, c.start + 0.4) });
    done += b - a;
    opts.onProgress?.({ value: (done / totalLen) * 0.7, detail: `Transcrevendo as falas: ${Math.round((done / totalLen) * 100)}%` });
  }
  const energyAt = (t: number) => {
    const a = audios.find((x) => t >= x.start && t < x.start + x.pcm.length / 16000);
    if (!a) return 1;
    const i = Math.floor((t - a.start) * 16000);
    let s = 0;
    const n = Math.min(a.pcm.length, i + 1600);
    for (let k = Math.max(0, i - 1600); k < n; k++) s += a.pcm[k] * a.pcm[k];
    return Math.sqrt(s / 3200);
  };
  const cleaned = cleanChunks(raw, energyAt);
  let captions = chunksToCaptions(cleaned);
  if (!captions.length) {
    notes.push("Nenhuma fala reconhecida nos trechos deste clipe.");
    return { captions: [], spokenLang: null, notes };
  }
  // Vozes diferentes (estimativa pela altura da voz)
  for (const c of captions) {
    const a = audios.find((x) => c.start >= x.start && c.end <= x.start + x.pcm.length / 16000);
    pitches.set(c.id, a ? estimatePitch(a.pcm.subarray(Math.floor((c.start - a.start) * 16000), Math.floor((c.end - a.start) * 16000))) : null);
  }
  captions = assignSpeakers(captions, (c) => pitches.get(c.id) ?? null);
  const spokenLang = detected ?? detectLanguage(captions.map((c) => c.text).join(" "));

  // Correção e tradução
  const target = opts.target === "orig" ? null : opts.target;
  if (claudeAvailable()) {
    opts.onProgress?.({ value: 0.8, detail: "Corrigindo e traduzindo as legendas com Claude…" });
    try {
      captions = await claudeFixAndTranslate(captions, spokenLang, target);
    } catch (e) {
      notes.push(`Claude não respondeu (${e instanceof Error ? e.message : e}); usando o tradutor local.`);
      if (target && target !== spokenLang) captions = await translateCaptions(captions, spokenLang ?? "en", target, opts.onProgress);
    }
  } else if (target && target !== spokenLang) {
    captions = await translateCaptions(captions, spokenLang ?? "en", target, opts.onProgress);
  }
  opts.onProgress?.({ value: 1, detail: `${captions.length} legendas criadas` });
  return { captions, spokenLang, notes };
}

/** Tradução local (NLLB, no aparelho). */
export async function translateCaptions(captions: Caption[], from: string, to: string, onProgress?: (p: CaptionJobProgress) => void): Promise<Caption[]> {
  const src = LANGUAGES.find((l) => l.code === from)?.nllb ?? "eng_Latn";
  const tgt = LANGUAGES.find((l) => l.code === to)?.nllb;
  if (!tgt) return captions;
  onProgress?.({ value: 0.75, detail: "Carregando o tradutor (uma vez só, ~600 MB)…" });
  const out = await translateLocal(
    captions.map((c) => c.text),
    src,
    tgt,
    (p) => {
      if (p.status === "translating") onProgress?.({ value: 0.75 + (p.loaded / Math.max(1, p.total)) * 0.24, detail: `Traduzindo: ${p.loaded} de ${p.total}` });
      else if (p.total) onProgress?.({ value: 0.75, detail: `Baixando o tradutor: ${Math.round(p.loaded / 1e6)} de ${Math.round(p.total / 1e6)} MB` });
    },
  );
  return captions.map((c, i) => ({ ...c, translations: { ...c.translations, [to]: out[i] ?? c.text } }));
}
