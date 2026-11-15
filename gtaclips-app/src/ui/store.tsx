// Estado do app: projetos, processamentos em segundo plano, configurações, navegação e avisos.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Category, Clip, ExportRecord, GenerateSettings, Project } from "../core/types";
import { buildMoments, buildTimeline, deadSeconds } from "../core/moments";
import { generate } from "../core/stories";
import { uid } from "../core/format";
import { db, setSessionSource, sourceFor } from "../media/db";
import { analyzeVideo } from "../media/analyze";
import { exportClip } from "../media/export";
import { generateCaptions } from "../media/speech";

// ---------- Configurações ----------

export interface Settings {
  useVision: boolean;
  whisperModel: string;
  spoken: string;
  storeSource: boolean;
  learned: Partial<Record<Category, number>>;
  useLearned: boolean;
  defaults: GenerateSettings;
  course: Record<string, boolean>;
  niche: string;
}

export const DEFAULT_GEN: GenerateSettings = { mode: "historias", count: 3, duration: 60, format: "9:16", reframe: "acao", fps: 30, captions: true, captionLang: "pt", captionStyle: "viral", removeSilence: false, context: 3 };

const DEFAULT_SETTINGS: Settings = { useVision: true, whisperModel: "onnx-community/whisper-base", spoken: "auto", storeSource: false, learned: {}, useLearned: true, defaults: DEFAULT_GEN, course: {}, niche: "Gameplay de GTA" };

function loadSettings(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem("gca:settings") ?? "{}");
    return { ...DEFAULT_SETTINGS, ...raw, defaults: { ...DEFAULT_GEN, ...(raw.defaults ?? {}) } };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// ---------- Processamentos ----------

export interface Job {
  id: string;
  kind: "analise" | "exportacao" | "legendas";
  projectId: string;
  clipId?: string;
  label: string;
  value: number;
  detail: string;
  status: "rodando" | "ok" | "erro" | "cancelado";
  error?: string;
  startedAt: number;
}

export type Tab = "dashboard" | "criar" | "projetos" | "editor" | "youtube" | "config";

interface Ctx {
  tab: Tab;
  go: (tab: Tab, params?: { projectId?: string; clipId?: string }) => void;
  projectId: string | null;
  clipId: string | null;
  projects: Project[];
  exports: ExportRecord[];
  reload: () => Promise<void>;
  saveProject: (p: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  settings: Settings;
  setSettings: (s: Partial<Settings>) => void;
  jobs: Job[];
  cancelJob: (id: string) => void;
  dismissJob: (id: string) => void;
  startAnalysis: (project: Project, file: Blob) => string;
  regenerate: (project: Project, settings: GenerateSettings) => Promise<Project>;
  startExport: (project: Project, clipIds: string[]) => string;
  startCaptions: (project: Project, clipId: string, opts: { target: string }) => string;
  toast: (text: string, bad?: boolean) => void;
  toasts: { id: number; text: string; bad?: boolean }[];
}

const AppCtx = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error("fora do provedor");
  return c;
}

/** Mantém a tela acesa durante processamentos longos (celulares desligam a tela). */
async function keepAwake(): Promise<() => void> {
  try {
    const lock = await (navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request("screen");
    return () => void lock?.release().catch(() => undefined);
  } catch {
    return () => undefined;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [clipId, setClipId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [settings, setSettingsState] = useState<Settings>(loadSettings);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [toasts, setToasts] = useState<{ id: number; text: string; bad?: boolean }[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  const tid = useRef(1);

  const toast = useCallback((text: string, bad = false) => {
    const id = tid.current++;
    setToasts((t) => [...t.slice(-3), { id, text, bad }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const reload = useCallback(async () => {
    const [p, e] = await Promise.all([db.listProjects(), db.listExports()]);
    setProjects(p);
    setExports(e);
  }, []);

  useEffect(() => {
    reload().catch(() => toast("Não foi possível abrir o banco de dados do navegador.", true));
  }, [reload, toast]);

  const saveProject = useCallback(
    async (p: Project) => {
      await db.putProject(p);
      setProjects((list) => [{ ...p, updatedAt: Date.now() }, ...list.filter((x) => x.id !== p.id)]);
    },
    [],
  );

  const deleteProject = useCallback(
    async (id: string) => {
      await db.deleteProject(id);
      await reload();
    },
    [reload],
  );

  const setSettings = useCallback((s: Partial<Settings>) => {
    setSettingsState((cur) => {
      const next = { ...cur, ...s };
      localStorage.setItem("gca:settings", JSON.stringify(next));
      return next;
    });
  }, []);

  const go = useCallback((t: Tab, params?: { projectId?: string; clipId?: string }) => {
    setTab(t);
    if (params?.projectId !== undefined) setProjectId(params.projectId);
    if (params?.clipId !== undefined) setClipId(params.clipId);
    window.scrollTo({ top: 0 });
  }, []);

  const updateJob = useCallback((id: string, patch: Partial<Job>) => setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...patch } : j))), []);

  const newJob = useCallback((job: Omit<Job, "id" | "value" | "detail" | "status" | "startedAt">): [string, AbortController] => {
    const id = uid("job");
    const ctrl = new AbortController();
    controllers.current.set(id, ctrl);
    setJobs((js) => [...js.filter((j) => j.status === "rodando" || Date.now() - j.startedAt < 600000), { ...job, id, value: 0, detail: "Começando…", status: "rodando", startedAt: Date.now() }]);
    return [id, ctrl];
  }, []);

  const finishJob = useCallback(
    (id: string, err?: unknown) => {
      controllers.current.delete(id);
      if (!err) updateJob(id, { status: "ok", value: 1 });
      else if (err instanceof DOMException && err.name === "AbortError") updateJob(id, { status: "cancelado", detail: "Cancelado" });
      else updateJob(id, { status: "erro", error: err instanceof Error ? err.message : String(err), detail: err instanceof Error ? err.message : String(err) });
    },
    [updateJob],
  );

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const startAnalysis = useCallback(
    (project: Project, file: Blob) => {
      const [id, ctrl] = newJob({ kind: "analise", projectId: project.id, label: `Analisando «${project.name}»` });
      setSessionSource(project.id, file);
      (async () => {
        const release = await keepAwake();
        try {
          let p: Project = { ...project, status: "analisando" };
          await saveProject(p);
          if (settingsRef.current.storeSource) {
            updateJob(id, { detail: "Guardando uma cópia do vídeo no aparelho…" });
            await db.putSource(project.id, file);
            p = { ...p, source: { ...p.source, stored: true } };
          }
          const s = settingsRef.current;
          const { analysis, thumbs } = await analyzeVideo(file, project.source.duration, {
            useVision: s.useVision,
            learned: s.useLearned ? s.learned : {},
            signal: ctrl.signal,
            onProgress: (pr) => {
              const base = { modelo: 0, preparando: 0.05, imagens: 0.1, som: 0.75, momentos: 0.95 }[pr.phase];
              const span = { modelo: 0.05, preparando: 0.05, imagens: 0.65, som: 0.2, momentos: 0.05 }[pr.phase];
              updateJob(id, { value: base + span * pr.value, detail: pr.detail });
            },
          });
          await db.putThumbs(project.id, thumbs);
          const gen = generate(analysis.moments, buildTimeline(analysis.samples, analysis.audio, project.source.duration).intensity, p.settings, project.source.duration);
          p = { ...p, status: "analisado", analysis, clips: gen.clips, notes: gen.notes };
          await saveProject(p);
          finishJob(id);
          toast(`Análise concluída: ${analysis.moments.filter((m) => !m.dead).length} momentos e ${gen.clips.length} clipe(s) prontos para revisar.`);
        } catch (e) {
          finishJob(id, e);
          const cur = await db.getProject(project.id);
          if (cur) await saveProject({ ...cur, status: e instanceof DOMException && e.name === "AbortError" ? "novo" : "erro", error: e instanceof Error ? e.message : String(e) });
          if (!(e instanceof DOMException && e.name === "AbortError")) toast(`Falha na análise: ${e instanceof Error ? e.message : e}`, true);
        } finally {
          release();
        }
      })();
      return id;
    },
    [newJob, saveProject, updateJob, finishJob, toast],
  );

  /** Recalcula os momentos (com pesos aprendidos atuais) e gera novos clipes. */
  const regenerate = useCallback(
    async (project: Project, gs: GenerateSettings) => {
      if (!project.analysis) return project;
      const s = settingsRef.current;
      const tl = buildTimeline(project.analysis.samples, project.analysis.audio, project.source.duration);
      const moments = buildMoments(tl, s.useLearned ? s.learned : {});
      const gen = generate(moments, tl.intensity, gs, project.source.duration);
      const p: Project = { ...project, settings: gs, analysis: { ...project.analysis, moments, deadSeconds: deadSeconds(moments) }, clips: gen.clips, notes: gen.notes };
      await saveProject(p);
      return p;
    },
    [saveProject],
  );

  const startExport = useCallback(
    (project: Project, clipIds: string[]) => {
      const [id, ctrl] = newJob({ kind: "exportacao", projectId: project.id, label: clipIds.length > 1 ? `Exportando ${clipIds.length} clipes` : `Exportando «${project.clips.find((c) => c.id === clipIds[0])?.title}»` });
      (async () => {
        const release = await keepAwake();
        try {
          const file = await sourceFor(project.id);
          if (!file) throw new Error("O vídeo original não está disponível nesta sessão. Abra o projeto e selecione o arquivo de novo.");
          for (let i = 0; i < clipIds.length; i++) {
            const clip = project.clips.find((c) => c.id === clipIds[i]);
            if (!clip) continue;
            const { blob, record } = await exportClip(file, clip, project.analysis, project.id, project.source.fps, {
              signal: ctrl.signal,
              onProgress: (p) => updateJob(id, { value: (i + p.value) / clipIds.length, detail: `${clipIds.length > 1 ? `Clipe ${i + 1} de ${clipIds.length}: ` : ""}${p.detail}` }),
            });
            await db.putExport(record, blob);
          }
          setExports(await db.listExports());
          finishJob(id);
          toast(clipIds.length > 1 ? "Exportação concluída! Os arquivos estão no histórico." : "Exportação concluída! O MP4 está pronto para baixar.");
        } catch (e) {
          finishJob(id, e);
          if (!(e instanceof DOMException && e.name === "AbortError")) toast(`Falha na exportação: ${e instanceof Error ? e.message : e}`, true);
        } finally {
          release();
        }
      })();
      return id;
    },
    [newJob, updateJob, finishJob, toast],
  );

  const startCaptions = useCallback(
    (project: Project, cid: string, opts: { target: string }) => {
      const clip = project.clips.find((c) => c.id === cid)!;
      const [id] = newJob({ kind: "legendas", projectId: project.id, clipId: cid, label: `Legendas de «${clip.title}»` });
      (async () => {
        const release = await keepAwake();
        try {
          const file = await sourceFor(project.id);
          if (!file) throw new Error("O vídeo original não está disponível nesta sessão. Abra o projeto e selecione o arquivo de novo.");
          const s = settingsRef.current;
          const res = await generateCaptions(file, clip.segments, { model: s.whisperModel, spoken: s.spoken, target: opts.target, onProgress: (p) => updateJob(id, { value: p.value, detail: p.detail }) });
          const cur = (await db.getProject(project.id)) ?? project;
          const next: Project = { ...cur, clips: cur.clips.map((c) => (c.id === cid ? { ...c, captions: res.captions, captionLang: opts.target, captionsOn: true, spokenLang: res.spokenLang ?? undefined, updatedAt: Date.now() } : c)) };
          await saveProject(next);
          finishJob(id);
          toast(res.captions.length ? `${res.captions.length} legendas criadas${res.spokenLang ? ` (fala em ${res.spokenLang.toUpperCase()})` : ""}.` : res.notes[0] ?? "Nenhuma fala encontrada.");
          for (const n of res.notes.slice(1)) toast(n);
        } catch (e) {
          finishJob(id, e);
          toast(`Falha nas legendas: ${e instanceof Error ? e.message : e}`, true);
        } finally {
          release();
        }
      })();
      return id;
    },
    [newJob, updateJob, finishJob, saveProject, toast],
  );

  const cancelJob = useCallback((id: string) => controllers.current.get(id)?.abort(), []);
  const dismissJob = useCallback((id: string) => setJobs((js) => js.filter((j) => j.id !== id)), []);

  const value = useMemo<Ctx>(
    () => ({ tab, go, projectId, clipId, projects, exports, reload, saveProject, deleteProject, settings, setSettings, jobs, cancelJob, dismissJob, startAnalysis, regenerate, startExport, startCaptions, toast, toasts }),
    [tab, go, projectId, clipId, projects, exports, reload, saveProject, deleteProject, settings, setSettings, jobs, cancelJob, dismissJob, startAnalysis, regenerate, startExport, startCaptions, toast, toasts],
  );
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function newProject(name: string, source: Project["source"], gs: GenerateSettings): Project {
  return { id: uid("p"), name: name.replace(/\.[^.]+$/, ""), createdAt: Date.now(), updatedAt: Date.now(), source, status: "novo", settings: gs, clips: [], notes: [] };
}

export function updateClip(p: Project, clip: Clip): Project {
  return { ...p, clips: p.clips.map((c) => (c.id === clip.id ? { ...clip, updatedAt: Date.now() } : c)) };
}
