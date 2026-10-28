// Áudio em russo pela síntese de voz do próprio aparelho (Web Speech API).
// Só usamos vozes russas (ru-*). Sem voz russa, o app avisa e troca exercícios de áudio por leitura.
// Reconhecimento de fala: usa o serviço do navegador (Chrome envia o áudio ao Google; Safari usa a Apple),
// quando existe. Sem ele, oferecemos gravar e comparar de ouvido, sem fingir uma avaliação automática.

import { stripStress } from "../core/text";

type Listener = () => void;
const listeners = new Set<Listener>();
let voices: SpeechSynthesisVoice[] = [];
let ready = false;

const synth: SpeechSynthesis | null = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;

function refresh() {
  if (!synth) return;
  voices = synth.getVoices().filter((v) => v.lang.toLowerCase().startsWith("ru"));
  ready = true;
  listeners.forEach((l) => l());
}

if (synth) {
  refresh();
  synth.addEventListener?.("voiceschanged", refresh);
}

/** Espera as vozes carregarem (alguns navegadores demoram). */
export function voicesReady(timeout = 1200): Promise<void> {
  if (!synth) return Promise.resolve();
  if (voices.length) return Promise.resolve();
  return new Promise((resolve) => {
    const t = setTimeout(resolve, timeout);
    const l = () => {
      if (voices.length) {
        clearTimeout(t);
        listeners.delete(l);
        resolve();
      }
    };
    listeners.add(l);
  });
}

export function onVoices(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function russianVoices(): SpeechSynthesisVoice[] {
  return voices;
}

export function hasRussianVoice(): boolean {
  return voices.length > 0;
}

export function voicesChecked(): boolean {
  return ready || !synth;
}

let preferredURI: string | null = null;
let baseRate = 1;

export function configureSpeech(opts: { voiceURI: string | null; rate: number }) {
  preferredURI = opts.voiceURI;
  baseRate = opts.rate;
}

function pickVoice(female?: boolean): SpeechSynthesisVoice | undefined {
  if (preferredURI) {
    const v = voices.find((x) => x.voiceURI === preferredURI);
    if (v) return v;
  }
  // Prefere vozes locais (funcionam offline) e, se pedido, uma voz feminina/masculina conhecida
  const byGender = female === undefined ? voices : voices.filter((v) => (female ? /milena|katya|irina|alena|female|женск/i : /yuri|pavel|dmitri|male|мужск/i).test(v.name));
  const pool = byGender.length ? byGender : voices;
  return pool.find((v) => v.localService) ?? pool[0];
}

export type Speed = "normal" | "slow";

let speakingId = 0;

/** Fala um texto em russo. Devolve uma promessa que termina quando a fala acaba. */
export function speak(text: string, opts: { speed?: Speed; pitch?: number; rate?: number; female?: boolean } = {}): Promise<boolean> {
  if (!synth || !voices.length) return Promise.resolve(false);
  const clean = stripStress(text).replace(/[«»]/g, "").replace(/—/g, ",");
  const id = ++speakingId;
  synth.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(clean);
    const v = pickVoice(opts.female);
    if (v) u.voice = v;
    u.lang = v?.lang ?? "ru-RU";
    const speedRate = opts.speed === "slow" ? 0.6 : 0.95;
    u.rate = Math.max(0.4, Math.min(1.6, speedRate * baseRate * (opts.rate ?? 1)));
    u.pitch = opts.pitch ?? 1;
    u.onend = () => resolve(id === speakingId);
    u.onerror = () => resolve(false);
    synth.speak(u);
    // Safari às vezes não dispara onend
    setTimeout(() => resolve(false), 15000);
  });
}

export function stopSpeaking() {
  speakingId++;
  synth?.cancel();
}

// ---------- Reconhecimento de fala ----------

interface RecognitionResultLike {
  transcript: string;
  confidence: number;
}

type RecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<RecognitionResultLike>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canRecognize(): boolean {
  return !!recognitionCtor();
}

export interface Heard {
  alternatives: string[];
  error?: string;
}

let current: InstanceType<RecognitionCtor> | null = null;

/** Escuta uma fala em russo e devolve as transcrições possíveis. */
export function listen(timeoutMs = 8000): Promise<Heard> {
  const Ctor = recognitionCtor();
  if (!Ctor) return Promise.resolve({ alternatives: [], error: "unsupported" });
  stopSpeaking();
  return new Promise((resolve) => {
    let done = false;
    const finish = (h: Heard) => {
      if (done) return;
      done = true;
      current = null;
      resolve(h);
    };
    try {
      const r = new Ctor();
      current = r;
      r.lang = "ru-RU";
      r.interimResults = false;
      r.maxAlternatives = 4;
      r.continuous = false;
      r.onresult = (e) => {
        const res = e.results[0];
        const alts: string[] = [];
        for (let i = 0; i < res.length; i++) alts.push(res[i].transcript);
        finish({ alternatives: alts });
      };
      r.onerror = (e) => finish({ alternatives: [], error: e.error });
      r.onend = () => finish({ alternatives: [] });
      r.start();
      setTimeout(() => {
        try {
          r.stop();
        } catch {
          /* já parou */
        }
      }, timeoutMs);
    } catch {
      finish({ alternatives: [], error: "start-failed" });
    }
  });
}

export function stopListening() {
  try {
    current?.stop();
  } catch {
    /* nada a parar */
  }
}

// ---------- Gravação (alternativa sem reconhecimento) ----------

export function canRecord(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
}

export interface Recording {
  stop: () => Promise<string | null>;
}

/** Grava a voz do estudante; stop() devolve uma URL para tocar a gravação. */
export async function record(): Promise<Recording | null> {
  if (!canRecord()) return null;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.start();
    return {
      stop: () =>
        new Promise((resolve) => {
          rec.onstop = () => {
            stream.getTracks().forEach((t) => t.stop());
            resolve(chunks.length ? URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })) : null);
          };
          rec.stop();
        }),
    };
  } catch {
    return null;
  }
}
