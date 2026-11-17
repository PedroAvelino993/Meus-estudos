// Leitura do áudio sem o decodificador do navegador (WebCodecs), que falha em vários iPhones.
//
// Os pacotes de áudio de um intervalo são copiados (sem decodificar) para um arquivo pequeno de
// áudio (.m4a) e o próprio aparelho decodifica com o decodificador nativo (Web Audio:
// decodeAudioData) — o mesmo que toca músicas. Funciona por pedaços, para gastar pouca memória.

import { BufferTarget, EncodedAudioPacketSource, Mp4OutputFormat, Output, type InputAudioTrack } from "mediabunny";
import { openInput } from "./probe";

/** Codecs que o decodificador nativo lê dentro de um .m4a. */
const NATIVE_OK = new Set(["aac", "mp3", "alac", "flac", "opus"]);

let offline: OfflineAudioContext | null = null;
function ctx(): OfflineAudioContext {
  const OAC = window.OfflineAudioContext ?? (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  if (!offline) offline = new OAC(1, 1, 44100);
  return offline;
}

/** Decodifica [start, end) do áudio pelo decodificador nativo. */
export async function decodeRangeNative(track: InputAudioTrack, start: number, end: number): Promise<{ data: Float32Array[]; rate: number; t0: number } | null> {
  const codec = track.codec;
  if (!codec || !NATIVE_OK.has(codec)) throw new Error(`o áudio deste vídeo (${codec ?? "desconhecido"}) não pode ser lido pelo decodificador nativo`);
  const { EncodedPacketSink } = await import("mediabunny");
  const sink = new EncodedPacketSink(track);
  let p = (await sink.getPacket(Math.max(0, start))) ?? (await sink.getFirstPacket());
  if (!p) return null;
  const t0 = p.timestamp;
  const cfg = await track.getDecoderConfig();
  if (!cfg) throw new Error("configuração do áudio ausente");
  const target = new BufferTarget();
  const out = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target });
  const src = new EncodedAudioPacketSource(codec as "aac");
  out.addAudioTrack(src);
  await out.start();
  let first = true;
  let n = 0;
  while (p && p.timestamp < end) {
    await src.add(p.clone({ timestamp: p.timestamp - t0 }), first ? { decoderConfig: cfg } : undefined);
    first = false;
    n++;
    p = await sink.getNextPacket(p);
  }
  if (!n) return null;
  src.close();
  await out.finalize();
  const buf = target.buffer;
  if (!buf) return null;
  const audio = await new Promise<AudioBuffer>((resolve, reject) => {
    // Forma com callbacks: funciona também nos Safari mais antigos
    const r = ctx().decodeAudioData(buf, resolve, (e) => reject(e ?? new Error("o aparelho não decodificou o áudio")));
    if (r && typeof (r as Promise<AudioBuffer>).then === "function") (r as Promise<AudioBuffer>).then(resolve, reject);
  });
  return { data: Array.from({ length: audio.numberOfChannels }, (_, c) => audio.getChannelData(c)), rate: audio.sampleRate, t0 };
}

/** Mono, intervalo exato [start, end), pela via nativa (em pedaços de 60 s). */
export async function monoRangeNative(track: InputAudioTrack, start: number, end: number): Promise<{ mono: Float32Array; rate: number }> {
  let rate = 0;
  let mono = new Float32Array(0);
  for (let a = start; a < end; a += 60) {
    const b = Math.min(end, a + 60);
    const r = await decodeRangeNative(track, a, b);
    if (!r) continue;
    if (!rate) {
      rate = r.rate;
      mono = new Float32Array(Math.max(1, Math.round((end - start) * rate)));
    }
    const off = Math.round((r.t0 - start) * rate);
    const len = r.data[0].length;
    for (let i = 0; i < len; i++) {
      const j = off + i;
      if (j < 0 || j >= mono.length) continue;
      let v = 0;
      for (const ch of r.data) v += ch[i];
      mono[j] = v / r.data.length;
    }
  }
  return { mono, rate: rate || 48000 };
}

/** O vídeo tem faixa de áudio (mesmo que o decodificador do navegador não leia)? */
export async function hasAudioTrack(file: Blob): Promise<boolean> {
  const input = openInput(file);
  try {
    return !!(await input.getPrimaryAudioTrack());
  } finally {
    input.dispose();
  }
}
