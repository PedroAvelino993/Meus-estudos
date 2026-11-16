// Downloads, compartilhamento e ZIP com todos os clipes.

import { Zip, ZipPassThrough } from "fflate";

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export type ShareResult = "ok" | "cancelado" | "indisponivel" | "toque-de-novo" | "grande-demais" | "erro";

type Nav = Navigator & { canShare?: (d: ShareData) => boolean };

/** O navegador consegue abrir o menu de compartilhar com arquivos (celulares, Safari, Chrome/Edge no Windows)? */
export function canShareFiles(): boolean {
  try {
    const nav = navigator as Nav;
    return typeof nav.share === "function" && !!nav.canShare?.({ files: [new File([new Uint8Array(1)], "teste.mp4", { type: "video/mp4" })] });
  } catch {
    return false;
  }
}

/**
 * Abre o menu de compartilhar do aparelho com os vídeos (WhatsApp, Telegram, Drive, Galeria, «Salvar vídeo»…).
 * Precisa ser chamado logo depois de um toque do usuário.
 */
export async function shareFiles(items: { blob: Blob; name: string }[], title?: string): Promise<ShareResult> {
  const nav = navigator as Nav;
  if (typeof nav.share !== "function") return "indisponivel";
  const files = items.map((it) => new File([it.blob], it.name, { type: it.blob.type || "video/mp4" }));
  if (!nav.canShare?.({ files })) return files.length > 1 ? "grande-demais" : "indisponivel";
  try {
    await nav.share({ files, title: title ?? files[0].name });
    return "ok";
  } catch (e) {
    const name = e instanceof DOMException ? e.name : "";
    if (name === "AbortError") return "cancelado";
    // Passou tempo demais desde o toque (ex.: arquivo grande demorou para carregar)
    if (name === "NotAllowedError") return "toque-de-novo";
    return "erro";
  }
}

export const SHARE_MESSAGE: Record<Exclude<ShareResult, "ok" | "cancelado">, string> = {
  indisponivel: "Este navegador não abre o menu de compartilhar com arquivos. O vídeo foi baixado; compartilhe pela galeria ou pelos arquivos do aparelho.",
  "toque-de-novo": "O arquivo terminou de carregar. Toque em Compartilhar de novo.",
  "grande-demais": "O aparelho não aceitou tantos vídeos de uma vez. Compartilhe um por um (botão Compartilhar de cada clipe).",
  erro: "Não foi possível compartilhar agora. Tente de novo ou use Baixar.",
};

/** Compatibilidade com o código antigo. */
export async function shareFile(blob: Blob, name: string): Promise<boolean> {
  return (await shareFiles([{ blob, name }])) === "ok";
}

/** Junta vários arquivos num ZIP (sem recompressão: vídeos já são comprimidos). */
export async function zipFiles(files: { name: string; blob: Blob }[], onProgress?: (v: number) => void): Promise<Blob> {
  const chunks: Uint8Array[] = [];
  let done = false;
  let fail: Error | null = null;
  const zip = new Zip((err, data, final) => {
    if (err) fail = err;
    else {
      chunks.push(data);
      if (final) done = true;
    }
  });
  const total = files.reduce((a, f) => a + f.blob.size, 0) || 1;
  let sent = 0;
  for (const f of files) {
    const entry = new ZipPassThrough(f.name);
    zip.add(entry);
    const reader = f.blob.stream().getReader();
    for (;;) {
      const { value, done: end } = await reader.read();
      if (end) break;
      entry.push(value);
      sent += value.length;
      onProgress?.(sent / total);
    }
    entry.push(new Uint8Array(0), true);
  }
  zip.end();
  if (fail) throw fail;
  if (!done) throw new Error("Falha ao montar o ZIP");
  return new Blob(chunks as BlobPart[], { type: "application/zip" });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
