// Downloads, compartilhamento e ZIP com todos os clipes.

import { Zip, ZipPassThrough } from "fflate";
import { isIOS } from "./device";

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Vídeos grandes demoram para começar a gravar no celular: o endereço fica válido por 5 min
  setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
}

export type ShareResult = "ok" | "cancelado" | "indisponivel" | "toque-de-novo" | "grande-demais" | "muitos" | "erro";

/** Limite do menu de compartilhar do Chrome (Android, Windows, ChromeOS): 50 MB somando os arquivos. */
export const SHARE_LIMIT = 50 * 1024 * 1024;

/** O limite de 50 MB vale para o Chrome e derivados; o Safari do iPhone não tem esse limite. */
export function shareLimit(): number {
  return isIOS() ? Infinity : SHARE_LIMIT;
}

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
  if (items.reduce((a, it) => a + it.blob.size, 0) > shareLimit()) return "grande-demais";
  const files = items.map((it) => new File([it.blob], it.name, { type: it.blob.type || "video/mp4" }));
  if (!nav.canShare?.({ files })) return files.length > 1 ? "muitos" : "indisponivel";
  try {
    await nav.share({ files, title: title ?? files[0].name });
    return "ok";
  } catch (e) {
    const name = e instanceof DOMException ? e.name : "";
    if (name === "AbortError") return "cancelado";
    // Recusado: arquivo grande demais para o aparelho, ou passou tempo demais desde o toque
    if (name === "NotAllowedError") return items.reduce((a, it) => a + it.blob.size, 0) > 20 * 1024 * 1024 ? "grande-demais" : "toque-de-novo";
    return "erro";
  }
}

export const SHARE_MESSAGE: Record<Exclude<ShareResult, "ok" | "cancelado">, string> = {
  indisponivel: "Este navegador não abre o menu de compartilhar com arquivos. O vídeo foi baixado; compartilhe pela galeria ou pelos arquivos do aparelho.",
  "toque-de-novo": "O arquivo terminou de carregar. Toque em Compartilhar de novo.",
  "grande-demais": "O vídeo passa do limite de 50 MB do compartilhamento do navegador. Use «Salvar na galeria» e compartilhe pela galeria, ou crie a versão leve.",
  muitos: "O aparelho não aceitou tantos vídeos de uma vez. Use «Salvar todos na galeria».",
  erro: "Não foi possível compartilhar agora. Tente de novo ou use Baixar.",
};

/**
 * Salva o vídeo no aparelho para aparecer na galeria.
 * Android/computador: baixa o MP4 (vai para Downloads, que a Galeria e o Google Fotos mostram).
 * iPhone: abre o menu do sistema, onde «Salvar vídeo» manda direto para o app Fotos.
 */
export async function saveToGallery(blob: Blob, name: string): Promise<"baixado" | "menu" | "cancelado"> {
  if (isIOS()) {
    const r = await shareFiles([{ blob, name }]);
    if (r === "ok") return "menu";
    if (r === "cancelado") return "cancelado";
  }
  downloadBlob(blob, name);
  return "baixado";
}

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
