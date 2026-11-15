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

/** Compartilhar (no celular abre "Salvar vídeo", WhatsApp, YouTube…). */
export async function shareFile(blob: Blob, name: string): Promise<boolean> {
  const file = new File([blob], name, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return true;
    } catch {
      return false;
    }
  }
  return false;
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
