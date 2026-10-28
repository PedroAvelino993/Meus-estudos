// Efeitos sonoros curtos sintetizados (sem arquivos). Desligáveis nas Configurações.

let ctx: AudioContext | null = null;
let enabled = true;

export function setSfxEnabled(v: boolean) {
  enabled = v;
}

function ac(): AudioContext | null {
  if (!enabled || typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.12) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  correct() {
    tone(660, 0, 0.12, "triangle");
    tone(990, 0.09, 0.18, "triangle");
  },
  wrong() {
    tone(220, 0, 0.18, "sine", 0.1);
    tone(185, 0.12, 0.22, "sine", 0.08);
  },
  complete() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.22, "triangle", 0.1));
  },
  tap() {
    tone(880, 0, 0.04, "sine", 0.04);
  },
  achievement() {
    [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.25, "triangle", 0.08));
  },
};
