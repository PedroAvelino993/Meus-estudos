// Composição de cada quadro do clipe: formato, reenquadramento inteligente, zoom, ajustes de
// imagem, transições e legendas. A MESMA função desenha a prévia do editor e o vídeo exportado,
// então o que você vê é o que vai para o MP4.

import type { AspectFormat, Caption, Clip, Segment } from "../core/types";
import { captionAt, captionWords } from "../core/captions";
import { pathAt } from "../core/timeline";

export function outputSize(format: AspectFormat, short = 1080): { width: number; height: number } {
  if (format === "9:16") return { width: short, height: Math.round((short * 16) / 9) };
  if (format === "16:9") return { width: Math.round((short * 16) / 9), height: short };
  return { width: short, height: short };
}

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

let blurCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
function tinyCanvas(): OffscreenCanvas | HTMLCanvasElement {
  if (!blurCanvas) blurCanvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(18, 32) : Object.assign(document.createElement("canvas"), { width: 18, height: 32 });
  return blurCanvas;
}

let mid: OffscreenCanvas | HTMLCanvasElement | null = null;
function midCanvas(): OffscreenCanvas | HTMLCanvasElement {
  if (!mid) mid = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(144, 256) : Object.assign(document.createElement("canvas"), { width: 144, height: 256 });
  return mid;
}

const filterSupported = (() => {
  try {
    const c = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(1, 1).getContext("2d") : document.createElement("canvas").getContext("2d");
    return !!c && "filter" in c;
  } catch {
    return false;
  }
})();

export interface FrameState {
  /** Tempo no clipe (s). */
  outT: number;
  /** Tempo no vídeo original (s). */
  srcT: number;
  seg: Segment;
  /** Início do trecho no tempo do clipe e duração do trecho. */
  segOut: number;
  segDur: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface ComposeContext {
  clip: Clip;
  path: { t: number; x: number }[];
  /** Prévia leve (celulares): desfoque barato em vez do filtro, que pesa muito. */
  fast?: boolean;
}

/** Retângulo do original que vai para a tela (recorte), conforme o modo de enquadramento. */
export function cropRect(sw: number, sh: number, W: number, H: number, clip: Clip, st: FrameState, path: { t: number; x: number }[]) {
  const aspect = W / H;
  const zoom = Math.max(1, (clip.zoom || 1) * (st.seg.zoom || 1));
  let cw: number;
  let ch: number;
  if (sw / sh > aspect) {
    ch = sh / zoom;
    cw = ch * aspect;
  } else {
    cw = sw / zoom;
    ch = cw / aspect;
  }
  let cx = 0.5;
  if (clip.reframe === "acao") cx = pathAt(path, st.srcT);
  else if (clip.reframe === "manual") cx = st.seg.cropX ?? 0.5;
  const x = Math.max(0, Math.min(sw - cw, cx * sw - cw / 2));
  const y = Math.max(0, Math.min(sh - ch, sh / 2 - ch / 2));
  return { x, y, w: cw, h: ch };
}

export function drawFrame(ctx: Ctx2D, W: number, H: number, source: CanvasImageSource, sw: number, sh: number, c: ComposeContext, st: FrameState) {
  const { clip } = c;
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  const adj = clip.adjust;
  const filter = adj.brightness !== 1 || adj.contrast !== 1 || adj.saturation !== 1 ? `brightness(${adj.brightness}) contrast(${adj.contrast}) saturate(${adj.saturation})` : "none";
  if (clip.reframe === "desfocado") {
    // Fundo: a própria cena ampliada, desfocada e escurecida
    const cover = Math.max(W / sw, H / sh);
    const bw = sw * cover;
    const bh = sh * cover;
    if (filterSupported && !c.fast) {
      ctx.filter = "blur(28px) brightness(0.55)";
      ctx.drawImage(source, (W - bw) / 2, (H - bh) / 2, bw, bh);
      ctx.filter = "none";
    } else {
      // Sem filtro (alguns Safari): reduz e amplia em duas etapas = desfoque suave
      const tiny = tinyCanvas();
      const tctx = tiny.getContext("2d") as Ctx2D;
      tctx.drawImage(source, 0, 0, tiny.width, tiny.height);
      const mid = midCanvas();
      const mctx = mid.getContext("2d") as Ctx2D;
      mctx.imageSmoothingEnabled = true;
      mctx.drawImage(tiny, 0, 0, mid.width, mid.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(mid, 0, 0, W, H);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, W, H);
    }
    // Frente: o quadro inteiro, sem cortar nada
    const zoom = Math.max(1, (clip.zoom || 1) * (st.seg.zoom || 1));
    const scale = Math.min(W / sw, H / sh) * zoom;
    const dw = sw * scale;
    const dh = sh * scale;
    if (filterSupported) ctx.filter = filter;
    ctx.drawImage(source, (W - dw) / 2, (H - dh) / 2 - H * 0.04, dw, dh);
  } else {
    const r = cropRect(sw, sh, W, H, clip, st, c.path);
    if (filterSupported) ctx.filter = filter;
    ctx.drawImage(source, r.x, r.y, r.w, r.h, 0, 0, W, H);
  }
  if (filterSupported) ctx.filter = "none";
  // Transição discreta: fade curto nas emendas entre trechos
  if (clip.transition === "fade") {
    const fromStart = st.outT - st.segOut;
    const toEnd = st.segOut + st.segDur - st.outT;
    const d = 0.18;
    let a = 0;
    if (!st.isFirst && fromStart < d) a = Math.max(a, 1 - fromStart / d);
    if (!st.isLast && toEnd < d) a = Math.max(a, 1 - toEnd / d);
    if (a > 0) {
      ctx.fillStyle = `rgba(0,0,0,${Math.min(0.85, a)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
  if (clip.captionsOn && clip.captions.length) drawCaption(ctx, W, H, clip, st.srcT);
  ctx.restore();
}

function wrap(ctx: Ctx2D, words: string[], maxW: number): string[][] {
  const lines: string[][] = [];
  let cur: string[] = [];
  for (const w of words) {
    const test = [...cur, w].join(" ");
    if (cur.length && ctx.measureText(test).width > maxW) {
      lines.push(cur);
      cur = [w];
    } else cur.push(w);
  }
  if (cur.length) lines.push(cur);
  return lines;
}

export function drawCaption(ctx: Ctx2D, W: number, H: number, clip: Clip, srcT: number) {
  const cap: Caption | null = captionAt(clip.captions, srcT);
  if (!cap) return;
  const st = clip.captionStyle;
  let words = captionWords(cap, clip.captionLang);
  if (!words.length) return;
  const active = Math.max(0, words.findIndex((w) => srcT >= w.s && srcT < w.e));
  // Estilos de poucas palavras por vez mostram só o grupo atual
  const groupSize = st.id === "viral" ? 3 : st.id === "destaque" ? 4 : 0;
  if (groupSize) {
    const g = Math.floor(active / groupSize) * groupSize;
    words = words.slice(g, g + groupSize);
  }
  const activeInGroup = groupSize ? active % groupSize : active;
  const size = Math.round((H * st.size) / 100);
  ctx.font = `${st.font === "Anton" ? 400 : 800} ${size}px "${st.font}", Inter, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const text = (w: string) => (st.uppercase ? w.toLocaleUpperCase("pt-BR") : w);
  const lines = wrap(ctx, words.map((w) => text(w.w)), W * 0.86);
  const lineH = size * 1.18;
  const startT = groupSize ? words[0].s : cap.start;
  let scale = 1;
  let dy = 0;
  const age = srcT - startT;
  if (st.animation === "pop" || st.animation === "palavra") scale = age < 0.12 ? 0.82 + (age / 0.12) * 0.18 : 1;
  if (st.animation === "subir") dy = age < 0.18 ? (1 - age / 0.18) * size * 0.6 : 0;
  const cy = H * st.position + dy;
  ctx.save();
  ctx.translate(W / 2, cy);
  ctx.scale(scale, scale);
  const top = -((lines.length - 1) * lineH) / 2;
  if (st.background) {
    const maxW = Math.max(...lines.map((l) => ctx.measureText(l.join(" ")).width));
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    const pad = size * 0.35;
    roundRect(ctx, -maxW / 2 - pad, top - lineH / 2 - pad * 0.4, maxW + pad * 2, lines.length * lineH + pad * 0.8, size * 0.3);
    ctx.fill();
  }
  let wi = 0;
  lines.forEach((line, li) => {
    const y = top + li * lineH;
    const full = line.join(" ");
    let x = -ctx.measureText(full).width / 2;
    ctx.textAlign = "left";
    for (const w of line) {
      const isActive = wi === activeInGroup && (st.animation === "palavra" || st.id === "destaque" || st.id === "viral");
      const ww = ctx.measureText(w).width;
      if (st.outline) {
        ctx.lineJoin = "round";
        ctx.lineWidth = Math.max(2, size * 0.16);
        ctx.strokeStyle = "rgba(0,0,0,0.92)";
        ctx.strokeText(w, x, y);
      }
      ctx.fillStyle = isActive ? st.highlight : cap.speaker === 2 && !isActive ? "#ffe2b8" : st.color;
      ctx.fillText(w, x, y);
      x += ww + ctx.measureText(" ").width;
      wi++;
    }
  });
  ctx.restore();
}

function roundRect(ctx: Ctx2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Garante que as fontes das legendas estejam carregadas antes de desenhar/exportar. */
export async function ensureFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all(["400 48px Anton", "800 48px Inter"].map((f) => document.fonts.load(f).catch(() => undefined)));
}
