// Dashboard: números reais do aparelho, projetos recentes, processamentos e exportações.

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clapperboard, Download, Film, GraduationCap, HardDrive, Loader2, Scissors, Sparkles, Upload, X } from "lucide-react";
import { useApp, type Job } from "../ui/store";
import { Bar, Card, Empty, Head, Stat, useThumbs, thumbAt } from "../ui/kit";
import { storageEstimate } from "../media/db";
import { capabilities, type Capabilities } from "../media/probe";
import { ExportButtons } from "./Projects";
import { fmtBytes, fmtDur } from "../core/format";
import type { Project } from "../core/types";

export default function Dashboard() {
  const { projects, exports, jobs, go, cancelJob, dismissJob } = useApp();
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [caps, setCaps] = useState<Capabilities | null>(null);
  useEffect(() => {
    storageEstimate().then(setStorage);
    capabilities().then(setCaps);
  }, [exports.length, projects.length]);
  const analyzed = projects.filter((p) => p.analysis).length;
  const clips = projects.reduce((a, p) => a + p.clips.length, 0);
  const recent = projects.slice(0, 4);
  const lastClip = projects.find((p) => p.clips.length);

  return (
    <div className="stack">
      <Head
        title="Dashboard"
        text="Transforme gameplays longas em clipes curtos com começo, meio e fim. A IA encontra os melhores acontecimentos, corta o tempo morto e monta as histórias — você revisa, edita e exporta em MP4."
        right={
          <button className="btn primary lg" onClick={() => go("criar")}>
            <Upload size={18} /> Enviar novo vídeo
          </button>
        }
      />
      {caps && (!caps.webcodecs || !caps.videoCodec) && (
        <div className="banner red">
          <AlertTriangle size={18} />
          <span>Este navegador não tem os recursos de vídeo necessários (WebCodecs). Use o Chrome, o Edge ou o Safari atualizados para analisar e exportar.</span>
        </div>
      )}
      <div className="grid g4">
        <Stat icon={<Film size={14} />} label="Vídeos processados" value={analyzed} sub={`${projects.length} projeto(s) no total`} />
        <Stat icon={<Scissors size={14} />} label="Clipes criados" value={clips} sub="Somando todos os projetos" />
        <Stat icon={<Download size={14} />} label="Exportações" value={exports.length} sub={exports.length ? `${fmtBytes(exports.reduce((a, e) => a + e.size, 0))} em MP4` : "Nenhuma ainda"} />
        <Stat icon={<HardDrive size={14} />} label="Armazenamento usado" value={storage ? fmtBytes(storage.usage) : "…"} sub={storage?.quota ? `de ${fmtBytes(storage.quota)} disponíveis no navegador` : "Neste aparelho"} />
      </div>

      <Jobs jobs={jobs} onCancel={cancelJob} onDismiss={dismissJob} />

      <div className="grid g2">
        <Card title="Projetos recentes" icon={<Clapperboard size={16} />} right={<button className="btn sm ghost" onClick={() => go("projetos")}>Ver todos</button>}>
          {recent.length ? (
            <div className="list">
              {recent.map((p) => (
                <RecentProject key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <Empty>Nenhum projeto ainda. Envie uma gravação de gameplay para começar.</Empty>
          )}
        </Card>
        <div className="stack">
          <Card title="Atalhos" icon={<Sparkles size={16} />}>
            <div className="grid g2" style={{ gap: 8 }}>
              <button className="btn" onClick={() => go("criar")}>
                <Upload size={15} /> Criar clipes
              </button>
              <button className="btn" disabled={!lastClip} onClick={() => lastClip && go("editor", { projectId: lastClip.id, clipId: lastClip.clips[0].id })}>
                <Scissors size={15} /> Editar último clipe
              </button>
              <button className="btn" onClick={() => go("projetos")}>
                <Film size={15} /> Meus projetos
              </button>
              <button className="btn" onClick={() => go("youtube")}>
                <GraduationCap size={15} /> Curso do YouTube
              </button>
            </div>
          </Card>
          <ExportHistory />
        </div>
      </div>
    </div>
  );
}

function RecentProject({ p }: { p: Project }) {
  const { go } = useApp();
  const thumbs = useThumbs(p.analysis ? p.id : null);
  const best = p.analysis?.moments.reduce((a, m) => (m.score > a.score ? m : a), p.analysis.moments[0]);
  return (
    <div className="item click row" onClick={() => go("projetos", { projectId: p.id })}>
      {thumbs.length ? <img className="thumb" src={thumbAt(thumbs, best?.thumbT ?? 0)} alt="" /> : <div className="thumb" />}
      <div className="grow">
        <b className="small">{p.name}</b>
        <div className="tiny muted">
          {fmtDur(p.source.duration)} · {p.clips.length} clipe(s) · {new Date(p.updatedAt).toLocaleDateString("pt-BR")}
        </div>
        <div style={{ marginTop: 4 }}>{statusTag(p)}</div>
      </div>
    </div>
  );
}

export function statusTag(p: Project) {
  if (p.status === "analisado") return <span className="tag green">Analisado</span>;
  if (p.status === "analisando") return <span className="tag amber">Analisando</span>;
  if (p.status === "erro") return <span className="tag red">Erro</span>;
  return <span className="tag">Novo</span>;
}

export function Jobs({ jobs, onCancel, onDismiss }: { jobs: Job[]; onCancel: (id: string) => void; onDismiss: (id: string) => void }) {
  if (!jobs.length) return null;
  return (
    <Card title="Processamentos" icon={<Loader2 size={16} />}>
      <div className="list">
        {[...jobs].reverse().map((j) => (
          <div key={j.id} className="item">
            <div className="row between">
              <div className="row small">
                {j.status === "rodando" ? <Loader2 size={15} className="spin" /> : j.status === "ok" ? <CheckCircle2 size={15} color="#22c55e" /> : <AlertTriangle size={15} color="#ef233c" />}
                <b>{j.label}</b>
              </div>
              {j.status === "rodando" ? (
                <button className="btn sm" onClick={() => onCancel(j.id)}>
                  Cancelar
                </button>
              ) : (
                <button className="btn sm ghost" onClick={() => onDismiss(j.id)} aria-label="Fechar">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="tiny muted" style={{ margin: "6px 0" }}>
              {j.detail}
            </div>
            <Bar value={j.value} anim={j.status === "rodando"} tone={j.status === "ok" ? "green" : undefined} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function ExportHistory() {
  const { exports } = useApp();
  return (
    <Card title="Histórico de exportações" icon={<Download size={16} />}>
      {exports.length ? (
        <div className="list">
          {exports.slice(0, 6).map((e) => (
            <div key={e.id} className="row between small">
              <div className="grow">
                <b>{e.title}</b>
                <div className="tiny muted">
                  {e.width}×{e.height} · {e.fps} FPS · {fmtDur(e.duration)} · {fmtBytes(e.size)} · {new Date(e.createdAt).toLocaleString("pt-BR")}
                </div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <ExportButtons rec={e} name={e.title} outdated={false} compact />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty>As exportações aparecem aqui, prontas para compartilhar ou baixar de novo.</Empty>
      )}
    </Card>
  );
}
