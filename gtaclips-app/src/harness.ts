// Página de teste do pipeline (não faz parte do app publicado).
import { probe, capabilities } from "./media/probe";
import { analyzeVideo, intensityOf } from "./media/analyze";
import { generate } from "./core/stories";
import { exportClip } from "./media/export";
import { blobToBase64 } from "./media/files";
import type { GenerateSettings } from "./core/types";

const w = window as unknown as Record<string, unknown>;
w.runPipeline = async (format: "9:16" | "16:9", reframe: "acao" | "desfocado") => {
  const file = (document.getElementById("f") as HTMLInputElement).files![0];
  const log: string[] = [];
  const caps = await capabilities();
  const info = await probe(file);
  const t0 = performance.now();
  const { analysis, thumbs } = await analyzeVideo(file, info.duration, { useVision: false, onProgress: (p) => log.push(`${p.phase} ${Math.round(p.value * 100)} ${p.detail}`) });
  const tAnalyze = performance.now() - t0;
  const settings: GenerateSettings = { mode: "historias", count: 2, duration: 15, format, reframe, fps: 30, captions: false, captionLang: "pt", captionStyle: "viral", removeSilence: false, context: 3 };
  const gen = generate(analysis.moments, intensityOf(analysis, info.duration), settings, info.duration);
  const clip = { ...gen.clips[0], captions: [{ id: "c1", start: gen.clips[0].segments[0].start, end: gen.clips[0].segments[0].start + 3, text: "Teste de legenda viral", words: [], translations: {} }], captionsOn: true };
  const t1 = performance.now();
  const { blob, record } = await exportClip(file, clip, analysis, "p1", info.fps, { onProgress: (p) => log.push(`export ${Math.round(p.value * 100)}`) });
  const tExport = performance.now() - t1;
  return { caps, info, samples: analysis.samples.length, thumbs: thumbs.length, audio: analysis.audio?.rms.length, moments: analysis.moments.map((m) => `${m.start}-${m.end} ${m.category} ${m.score} ${m.dead ? "morto" : ""}`), clips: gen.clips.map((c) => `${c.title}: ${c.segments.map((s) => `${s.start}-${s.end}`).join(" ")}`), notes: gen.notes, record, tAnalyze, tExport, mp4: await blobToBase64(blob), log: log.slice(-6) };
};

import { analyzeVideo as analyzeV } from "./media/analyze";
import { generateCaptions } from "./media/speech";
import { seg as mkSeg } from "./core/timeline";
w.runAI = async () => {
  const file = (document.getElementById("f") as HTMLInputElement).files![0];
  const info = await probe(file);
  const log: string[] = [];
  const t0 = performance.now();
  const { analysis } = await analyzeV(file, info.duration, { useVision: true, onProgress: (p) => { if (log[log.length - 1] !== p.detail) log.push(p.detail); } });
  const tVision = performance.now() - t0;
  const t1 = performance.now();
  const cap = await generateCaptions(file, [mkSeg(0, info.duration)], { model: "onnx-community/whisper-base", spoken: "auto", target: "pt", onProgress: (p) => { if (log[log.length - 1] !== p.detail) log.push(p.detail); } });
  return { mode: analysis.mode, labels: analysis.samples.slice(0, 3).map((s) => Object.entries(s.labels ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 3)), tVision, tSpeech: performance.now() - t1, spoken: cap.spokenLang, notes: cap.notes, captions: cap.captions.map((c) => `${c.start.toFixed(1)}-${c.end.toFixed(1)} [${c.speaker ?? "-"}] ${c.text} => ${c.translations.pt ?? ""}`), log: log.slice(-12) };
};
