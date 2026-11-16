// Banco de dados local (IndexedDB): projetos, miniaturas, vídeos originais guardados e exportações.
// Nada sai do aparelho.

import type { ExportRecord, Project } from "../core/types";

const DB = "gta-clips-ai";
const VERSION = 2;

let dbp: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("projects")) db.createObjectStore("projects", { keyPath: "id" });
      if (!db.objectStoreNames.contains("thumbs")) db.createObjectStore("thumbs");
      if (!db.objectStoreNames.contains("sources")) db.createObjectStore("sources");
      if (!db.objectStoreNames.contains("exports")) db.createObjectStore("exports", { keyPath: "id" });
      if (!db.objectStoreNames.contains("exportFiles")) db.createObjectStore("exportFiles");
      // Blocos de uma exportação em andamento (gravados no disco, não na memória)
      if (!db.objectStoreNames.contains("chunks")) db.createObjectStore("chunks");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.onerror = () => reject(t.error);
      }),
  );
}

export const db = {
  listProjects: () => tx<Project[]>("projects", "readonly", (s) => s.getAll() as IDBRequest<Project[]>).then((l) => l.sort((a, b) => b.updatedAt - a.updatedAt)),
  getProject: (id: string) => tx<Project | undefined>("projects", "readonly", (s) => s.get(id)),
  putProject: (p: Project) => tx("projects", "readwrite", (s) => s.put({ ...p, updatedAt: Date.now() })),
  deleteProject: async (id: string) => {
    await tx("projects", "readwrite", (s) => s.delete(id));
    await tx("thumbs", "readwrite", (s) => s.delete(id));
    await tx("sources", "readwrite", (s) => s.delete(id));
    const exps = await db.listExports();
    for (const e of exps.filter((x) => x.projectId === id)) await db.deleteExport(e.id);
  },
  putThumbs: (projectId: string, thumbs: { t: number; blob: Blob }[]) => tx("thumbs", "readwrite", (s) => s.put(thumbs, projectId)),
  getThumbs: (projectId: string) => tx<{ t: number; blob: Blob }[] | undefined>("thumbs", "readonly", (s) => s.get(projectId)),
  putSource: (projectId: string, file: Blob) => tx("sources", "readwrite", (s) => s.put(file, projectId)),
  getSource: (projectId: string) => tx<Blob | undefined>("sources", "readonly", (s) => s.get(projectId)),
  deleteSource: (projectId: string) => tx("sources", "readwrite", (s) => s.delete(projectId)),
  listExports: () => tx<ExportRecord[]>("exports", "readonly", (s) => s.getAll() as IDBRequest<ExportRecord[]>).then((l) => l.sort((a, b) => b.createdAt - a.createdAt)),
  putExport: async (rec: ExportRecord, blob: Blob) => {
    await tx("exportFiles", "readwrite", (s) => s.put(blob, rec.id));
    await tx("exports", "readwrite", (s) => s.put(rec));
  },
  putChunk: (job: string, idx: number, blob: Blob) => tx("chunks", "readwrite", (s) => s.put(blob, `${job}:${String(idx).padStart(6, "0")}`)),
  getChunks: (job: string) => tx<Blob[]>("chunks", "readonly", (s) => s.getAll(IDBKeyRange.bound(`${job}:`, `${job}:\uffff`)) as IDBRequest<Blob[]>),
  deleteChunks: (job: string) => tx("chunks", "readwrite", (s) => s.delete(IDBKeyRange.bound(`${job}:`, `${job}:\uffff`))),
  clearChunks: () => tx("chunks", "readwrite", (s) => s.clear()),
  getExportFile: (id: string) => tx<Blob | undefined>("exportFiles", "readonly", (s) => s.get(id)),
  deleteExport: async (id: string) => {
    await tx("exportFiles", "readwrite", (s) => s.delete(id));
    await tx("exports", "readwrite", (s) => s.delete(id));
  },
};

export async function storageEstimate(): Promise<{ usage: number; quota: number; persisted: boolean }> {
  try {
    const e = await navigator.storage.estimate();
    const persisted = (await navigator.storage.persisted?.()) ?? false;
    return { usage: e.usage ?? 0, quota: e.quota ?? 0, persisted };
  } catch {
    return { usage: 0, quota: 0, persisted: false };
  }
}

/** Pede ao navegador para não apagar os dados do app quando faltar espaço. */
export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage.persist?.()) ?? false;
  } catch {
    return false;
  }
}

/** Arquivos de vídeo abertos nesta sessão (o original fica com o usuário, não é copiado). */
const session = new Map<string, Blob>();

export function setSessionSource(projectId: string, file: Blob) {
  session.set(projectId, file);
}

/** Vídeo original de um projeto: da sessão atual ou da cópia guardada no aparelho. */
export async function sourceFor(projectId: string): Promise<Blob | null> {
  const s = session.get(projectId);
  if (s) return s;
  const stored = await db.getSource(projectId).catch(() => undefined);
  if (stored) {
    session.set(projectId, stored);
    return stored;
  }
  return null;
}
