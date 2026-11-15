// Meus projetos: lista e a tela de cada projeto (momentos, clipes, exportação).

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Captions, CheckCircle2, ChevronDown, Download, FileArchive, FileVideo, FolderOpen, Info, Loader2, Pencil, Play, Plus, RefreshCw, Scissors, Share2, Sparkles, Trash2 } from "lucide-react";
import type { Clip, Moment, Project } from "../core/types";
import { CATEGORIES, category } from "../core/categories";
import { FACTOR_LABEL } from "../core/moments";
import { seg, totalDuration } from "../core/timeline";
import { defaultStyle } from "../core/captions";
import { fmtBytes, fmtDur, fmtTime, safeName, uid } from "../core/format";
import { db, setSessionSource, sourceFor } from "../media/db";
import { downloadBlob, shareFile, zipFiles } from "../media/files";
import { useApp, updateClip } from "../ui/store";
import { Bar, Card, Empty, Head, ScoreBadge, Seg, thumbAt, useThumbs } from "../ui/kit";
import { Jobs, statusTag } from "./Dashboard";
import { GenerateForm } from "./GenerateForm";

export default function Projects() {
  const { projects, projectId, go, deleteProject, toast } = useApp();
  const current = projects.find((p) => p.id === projectId);
  if (current) return <ProjectView p={current} />;
  return (
    <div className="stack">
      <Head title="Meus projetos" text="Cada vídeo enviado vira um projeto, salvo neste aparelho, com a análise, os clipes e as exportações." right={<button className="btn primary" onClick={() => go("criar")}><Plus size={16} /> Novo projeto</button>} />
      {projects.length === 0 ? (
        <Empty>Nenhum projeto ainda.</Empty>
      ) : (
        <div className="grid g2">
          {projects.map((p) => (
            <ProjectCard key={p.id} p={p} onOpen={() => go("projetos", { projectId: p.id })} onDelete={async () => {
              if (!confirm(`Excluir o projeto «${p.name}» com os clipes e exportações?`)) return;
              await deleteProject(p.id);
              toast("Projeto excluído.");
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ p, onOpen, onDelete }: { p: Project; onOpen: () => void; onDelete: () => void }) {
  const thumbs = useThumbs(p.analysis ? p.id : null);
  const best = p.analysis?.moments.length ? p.analysis.moments.reduce((a, m) => (m.score > a.score ? m : a)) : null;
  return (
    <div className="card">
      <div className="row" style={{ alignItems: "flex-start" }}>
        {thumbs.length ? <img className="thumb" src={thumbAt(thumbs, best?.thumbT ?? 0)} alt="" /> : <div className="thumb" />}
        <div className="grow">
          <div className="row between">
            <b>{p.name}</b>
            {statusTag(p)}
          </div>
          <div className="tiny muted">
            {fmtDur(p.source.duration)} · {p.source.width}×{p.source.height} · {fmtBytes(p.source.size)}
          </div>
          <div className="tiny muted">
            {p.analysis ? `${p.analysis.moments.filter((m) => !m.dead).length} momentos · ` : ""}
            {p.clips.length} clipe(s) · atualizado {new Date(p.updatedAt).toLocaleDateString("pt-BR")}
          </div>
        </div>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn sm primary" onClick={onOpen}>
          <FolderOpen size={14} /> Abrir
        </button>
        <button className="btn sm ghost" onClick={onDelete} aria-label="Excluir">
          <Trash2 size={14} /> Excluir
        </button>
      </div>
    </div>
  );
}

function ProjectView({ p }: { p: Project }) {
  const { go, jobs, cancelJob, dismissJob, saveProject, startAnalysis, toast } = useApp();
  const [tab, setTab] = useState<"clipes" | "momentos" | "gerar">("clipes");
  const [hasSource, setHasSource] = useState<boolean | null>(null);
  const relink = useRef<HTMLInputElement>(null);
  useEffect(() => {
    sourceFor(p.id).then((f) => setHasSource(!!f));
  }, [p.id]);
  const myJobs = jobs.filter((j) => j.projectId === p.id);
  const analysing = myJobs.find((j) => j.kind === "analise" && j.status === "rodando");

  const onRelink = async (f: File) => {
    if (f.size !== p.source.size) {
      if (!confirm(`Este arquivo (${fmtBytes(f.size)}) parece diferente do original (${fmtBytes(p.source.size)}). Usar mesmo assim?`)) return;
    }
    setSessionSource(p.id, f);
    setHasSource(true);
    toast("Vídeo original conectado.");
    if (!p.analysis) startAnalysis(p, f);
  };

  return (
    <div className="stack">
      <div className="row wrap">
        <button className="btn sm ghost" onClick={() => go("projetos", { projectId: "" })}>
          <ArrowLeft size={15} /> Projetos
        </button>
      </div>
      <Head
        title={p.name}
        text={`${fmtDur(p.source.duration)} · ${p.source.width}×${p.source.height} · ${p.source.fps} FPS · ${p.source.videoCodec.toUpperCase()}${p.analysis ? ` · análise ${p.analysis.mode === "ia" ? "com IA de visão" : "básica (imagem e som)"} em ${fmtDur(p.analysis.elapsedMs / 1000)}` : ""}`}
        right={statusTag(p)}
      />
      {hasSource === false && (
        <div className="banner amber">
          <AlertTriangle size={18} />
          <div className="grow small">
            O vídeo original não está aberto nesta sessão (por segurança, o navegador não guarda acesso a arquivos). Para editar a prévia e exportar, selecione o mesmo arquivo de novo{p.source.name ? ` («${p.source.name}»)` : ""}.
            <div style={{ marginTop: 8 }}>
              <button className="btn sm primary" onClick={() => relink.current?.click()}>
                <FileVideo size={14} /> Selecionar o vídeo original
              </button>
              <input ref={relink} type="file" accept="video/*,.mkv,.mov" hidden onChange={(e) => e.target.files?.[0] && onRelink(e.target.files[0])} />
            </div>
          </div>
        </div>
      )}
      {analysing && <AnalysisSteps value={analysing.value} detail={analysing.detail} />}
      <Jobs jobs={myJobs.filter((j) => j.kind !== "analise" || j.status !== "rodando")} onCancel={cancelJob} onDismiss={dismissJob} />
      {analysing && (
        <button className="btn" onClick={() => cancelJob(analysing.id)}>
          Cancelar análise
        </button>
      )}
      {p.status === "erro" && !analysing && (
        <div className="banner red">
          <AlertTriangle size={18} />
          <div className="grow small">
            A análise falhou: {p.error}
            {hasSource && (
              <div style={{ marginTop: 8 }}>
                <button className="btn sm" onClick={async () => { const f = await sourceFor(p.id); if (f) startAnalysis(p, f); }}>
                  <RefreshCw size={14} /> Tentar de novo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {p.analysis && (
        <>
          <Overview p={p} />
          <Seg
            value={tab}
            onChange={setTab}
            options={[
              { id: "clipes", label: `Clipes (${p.clips.length})` },
              { id: "momentos", label: `Momentos (${p.analysis.moments.filter((m) => !m.dead).length})` },
              { id: "gerar", label: "Gerar de novo" },
            ]}
          />
          {tab === "clipes" && <ClipsList p={p} hasSource={!!hasSource} />}
          {tab === "momentos" && <MomentsList p={p} onAddClip={async (m) => {
            const start = Math.max(0, m.start - p.settings.context);
            const end = Math.min(p.source.duration, m.end + 2);
            const clip: Clip = { ...(p.clips[0] ?? baseFromSettings(p)), id: uid("c"), title: `${category(m.category).name} aos ${fmtTime(m.peakT)}`, story: m.description, beats: [{ t: m.start, label: category(m.category).name }], category: m.category, score: m.score, part: undefined, segments: [seg(start, end)], captions: [], updatedAt: Date.now() };
            await saveProject({ ...p, clips: [...p.clips, clip] });
            toast("Clipe criado a partir do momento.");
          }} />}
          {tab === "gerar" && <Regenerate p={p} />}
        </>
      )}
    </div>
  );
}

function baseFromSettings(p: Project): Clip {
  const s = p.settings;
  return { id: "", title: "", story: "", beats: [], category: "conducao", score: 0, segments: [], format: s.format, reframe: s.reframe, zoom: 1, fps: s.fps, captions: [], captionLang: s.captionLang, captionsOn: s.captions, captionStyle: defaultStyle(s.captionStyle, s.format), adjust: { brightness: 1, contrast: 1, saturation: 1 }, volume: 1, normalize: true, transition: "fade", removeSilence: s.removeSilence, updatedAt: Date.now() };
}

const STEPS = [
  { at: 0, label: "Vídeo sendo lido" },
  { at: 0.1, label: "Vídeo sendo analisado" },
  { at: 0.75, label: "Áudio sendo analisado" },
  { at: 0.95, label: "Momentos interessantes sendo identificados" },
  { at: 0.99, label: "Clipes sendo montados" },
];

function AnalysisSteps({ value, detail }: { value: number; detail: string }) {
  return (
    <Card title="Processando" icon={<Loader2 size={16} className="spin" />} className="hl">
      <div className="col">
        {STEPS.map((s, i) => {
          const next = STEPS[i + 1]?.at ?? 1.01;
          const done = value >= next;
          const active = value >= s.at && !done;
          return (
            <div key={s.label} className="row small" style={{ opacity: done || active ? 1 : 0.45 }}>
              {done ? <CheckCircle2 size={16} color="#22c55e" /> : active ? <Loader2 size={16} className="spin" color="#ef233c" /> : <span style={{ width: 16 }} />}
              {s.label}
            </div>
          );
        })}
        <div className="tiny muted">{detail}</div>
        <Bar value={value} anim />
        <div className="tiny faint">Pode navegar pelo app; o processamento continua. No celular, mantenha esta aba aberta.</div>
      </div>
    </Card>
  );
}

/** Mapa de calor do vídeo inteiro: cor = tipo de acontecimento, intensidade = nota. */
function Overview({ p }: { p: Project }) {
  const a = p.analysis!;
  const live = a.moments.filter((m) => !m.dead);
  const counts = new Map<string, number>();
  for (const m of live) counts.set(m.category, (counts.get(m.category) ?? 0) + (m.end - m.start));
  return (
    <Card title="Mapa do vídeo" icon={<Sparkles size={16} />}>
      <div className="heat" title="Cada faixa é um momento; mais forte = nota maior">
        {a.moments.map((m) => (
          <i key={m.id} style={{ width: `${((m.end - m.start) / p.source.duration) * 100}%`, background: m.dead ? "#1a1a1f" : category(m.category).color, opacity: m.dead ? 1 : 0.25 + (m.score / 100) * 0.75 }} title={`${fmtTime(m.start)} ${category(m.category).name} — ${m.score}`} />
        ))}
      </div>
      <div className="row wrap tiny muted" style={{ marginTop: 8, gap: 12 }}>
        <span>0:00</span>
        <span className="grow" />
        <span>{fmtTime(p.source.duration)}</span>
      </div>
      <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
        {[...counts.entries()]
          .sort((x, y) => y[1] - x[1])
          .map(([c, s]) => (
            <span key={c} className="tag" style={{ background: `${category(c as never).color}26`, color: category(c as never).color }}>
              {category(c as never).name}: {fmtDur(s)}
            </span>
          ))}
        <span className="tag">Tempo morto cortado: {fmtDur(a.deadSeconds)}</span>
      </div>
    </Card>
  );
}

function ClipsList({ p, hasSource }: { p: Project; hasSource: boolean }) {
  const { go, exports, startExport, startCaptions, saveProject, toast, jobs } = useApp();
  const thumbs = useThumbs(p.id);
  const [zipping, setZipping] = useState(false);
  const lastExport = (c: Clip) => exports.find((e) => e.clipId === c.id && e.createdAt >= c.updatedAt) ?? exports.find((e) => e.clipId === c.id);
  const exporting = jobs.some((j) => j.projectId === p.id && j.kind === "exportacao" && j.status === "rodando");

  const zipAll = async () => {
    const files: { name: string; blob: Blob }[] = [];
    for (const c of p.clips) {
      const e = lastExport(c);
      if (!e) continue;
      const b = await db.getExportFile(e.id);
      if (b) files.push({ name: `${String(files.length + 1).padStart(2, "0")}-${safeName(c.title)}.mp4`, blob: b });
    }
    if (!files.length) return toast("Exporte os clipes primeiro.", true);
    setZipping(true);
    try {
      downloadBlob(await zipFiles(files), `${safeName(p.name)}-clipes.zip`);
    } finally {
      setZipping(false);
    }
  };

  if (!p.clips.length) return <Empty>Nenhum clipe. Use «Gerar de novo» ou crie a partir de um momento.</Empty>;
  return (
    <div className="stack">
      {p.notes.map((n, i) => (
        <div key={i} className="banner amber small">
          <Info size={16} />
          <span>{n}</span>
        </div>
      ))}
      <div className="row wrap">
        <button className="btn primary" disabled={!hasSource || exporting} onClick={() => startExport(p, p.clips.map((c) => c.id))}>
          <Download size={16} /> EXPORTAR VÍDEOS ({p.clips.length})
        </button>
        <button className="btn" disabled={zipping || !p.clips.some((c) => lastExport(c))} onClick={zipAll}>
          <FileArchive size={16} /> {zipping ? "Montando ZIP…" : "Baixar todos (ZIP)"}
        </button>
      </div>
      {p.clips.map((c, i) => {
        const d = totalDuration(c.segments);
        const e = lastExport(c);
        const outdated = e && e.createdAt < c.updatedAt;
        const capJob = jobs.find((j) => j.clipId === c.id && j.kind === "legendas" && j.status === "rodando");
        return (
          <div key={c.id} className="card">
            <div className="row between wrap" style={{ alignItems: "flex-start" }}>
              <div className="grow">
                <div className="row wrap" style={{ gap: 6 }}>
                  <span className="tag red">{c.part ? `Parte ${c.part}` : `Clipe ${i + 1}`}</span>
                  <span className="tag" style={{ color: category(c.category).color }}>
                    {category(c.category).name}
                  </span>
                  <span className="tag">{fmtDur(d)}</span>
                  <span className="tag">{c.format}</span>
                  <span className="tag">{c.segments.length} trecho(s)</span>
                  {c.captions.length > 0 && <span className="tag blue">{c.captions.length} legendas</span>}
                </div>
                <h3 style={{ marginTop: 6 }}>{c.title}</h3>
                <p className="small muted">{c.story}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="tiny muted">Nota</div>
                <ScoreBadge score={c.score} />
              </div>
            </div>
            <div className="row" style={{ gap: 4, overflowX: "auto", margin: "10px 0" }}>
              {c.segments.map((s) => (
                <img key={s.id} src={thumbAt(thumbs, (s.start + s.end) / 2)} alt="" style={{ height: 52, aspectRatio: "16/9", objectFit: "cover", borderRadius: 6, background: "#000" }} title={`${fmtTime(s.start)}–${fmtTime(s.end)}`} />
              ))}
            </div>
            {c.beats.length > 0 && (
              <div className="row wrap tiny muted" style={{ gap: 6, marginBottom: 10 }}>
                {c.beats.map((b, k) => (
                  <span key={k}>
                    {k > 0 && "→ "}
                    <b style={{ color: "#ddd" }}>{b.label}</b> ({fmtTime(b.t)})
                  </span>
                ))}
              </div>
            )}
            {capJob && (
              <div style={{ marginBottom: 8 }}>
                <div className="tiny muted">{capJob.detail}</div>
                <Bar value={capJob.value} anim />
              </div>
            )}
            <div className="row wrap">
              <button className="btn sm primary" onClick={() => go("editor", { projectId: p.id, clipId: c.id })}>
                <Scissors size={14} /> Editar e assistir
              </button>
              <button className="btn sm" disabled={!hasSource || !!capJob || !p.source.audioCodec} onClick={() => startCaptions(p, c.id, { target: c.captionLang })}>
                <Captions size={14} /> {c.captions.length ? "Refazer legendas" : "Gerar legendas"}
              </button>
              <button className="btn sm" disabled={!hasSource || exporting} onClick={() => startExport(p, [c.id])}>
                <Play size={14} /> Exportar MP4
              </button>
              {e && <ExportButtons id={e.id} name={c.title} size={e.size} outdated={!!outdated} />}
              <button
                className="btn sm ghost"
                onClick={async () => {
                  if (!confirm(`Excluir o clipe «${c.title}»?`)) return;
                  await saveProject({ ...p, clips: p.clips.filter((x) => x.id !== c.id) });
                }}
              >
                <Trash2 size={14} />
              </button>
              <button className="btn sm ghost" onClick={async () => {
                const t = prompt("Novo título do clipe", c.title);
                if (t?.trim()) await saveProject(updateClip(p, { ...c, title: t.trim() }));
              }}>
                <Pencil size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExportButtons({ id, name, size, outdated }: { id: string; name: string; size: number; outdated: boolean }) {
  const { toast } = useApp();
  const get = async () => {
    const b = await db.getExportFile(id);
    if (!b) toast("Arquivo não encontrado.", true);
    return b;
  };
  return (
    <>
      <button
        className="btn sm"
        onClick={async () => {
          const b = await get();
          if (b) downloadBlob(b, `${safeName(name)}.mp4`);
        }}
        title={outdated ? "O clipe mudou depois desta exportação" : ""}
      >
        <Download size={14} /> Baixar MP4 ({fmtBytes(size)}){outdated ? " · antigo" : ""}
      </button>
      <button
        className="btn sm"
        onClick={async () => {
          const b = await get();
          if (b && !(await shareFile(b, `${safeName(name)}.mp4`))) toast("Compartilhar não está disponível neste navegador; use Baixar.");
        }}
      >
        <Share2 size={14} />
      </button>
    </>
  );
}

function MomentsList({ p, onAddClip }: { p: Project; onAddClip: (m: Moment) => void }) {
  const thumbs = useThumbs(p.id);
  const [filter, setFilter] = useState<"bons" | "todos" | "mortos">("bons");
  const [sort, setSort] = useState<"tempo" | "nota">("nota");
  const [open, setOpen] = useState<string | null>(null);
  const list = p.analysis!.moments.filter((m) => (filter === "todos" ? true : filter === "mortos" ? m.dead : !m.dead)).sort((a, b) => (sort === "tempo" ? a.start - b.start : b.score - a.score));
  return (
    <div className="stack">
      <div className="banner small">
        <Info size={16} />
        <span>
          A nota (0–100) combina intensidade, surpresa, humor, importância na história, qualidade visual, ritmo, clareza e um <b>potencial de retenção estimado</b>. Não são visualizações nem retenção reais: esses números só aparecem quando você conecta o seu canal na aba YouTube.
        </span>
      </div>
      <div className="row wrap">
        <Seg value={filter} onChange={setFilter} options={[{ id: "bons", label: "Interessantes" }, { id: "todos", label: "Todos" }, { id: "mortos", label: "Tempo morto" }]} />
        <Seg value={sort} onChange={setSort} options={[{ id: "nota", label: "Maior nota" }, { id: "tempo", label: "Ordem do vídeo" }]} />
      </div>
      <div className="list">
        {list.map((m) => (
          <div key={m.id} className="item">
            <div className="moment">
              <img className="thumb" src={thumbAt(thumbs, m.thumbT)} alt="" />
              <div>
                <div className="row between">
                  <div className="row wrap" style={{ gap: 6 }}>
                    <span className="tag" style={{ color: category(m.category).color, background: `${category(m.category).color}22` }}>
                      {category(m.category).name}
                    </span>
                    <span className="tag">
                      {fmtTime(m.start)} · {fmtDur(m.end - m.start)}
                    </span>
                    {m.dead && <span className="tag">Tempo morto</span>}
                  </div>
                  <ScoreBadge score={m.score} />
                </div>
                <p className="small" style={{ marginTop: 6 }}>
                  {m.description}
                </p>
                <div className="row wrap" style={{ marginTop: 8 }}>
                  <button className="btn sm ghost" onClick={() => setOpen(open === m.id ? null : m.id)}>
                    <ChevronDown size={14} /> Detalhes da nota
                  </button>
                  {!m.dead && (
                    <button className="btn sm" onClick={() => onAddClip(m)}>
                      <Plus size={14} /> Criar clipe com este momento
                    </button>
                  )}
                </div>
                {open === m.id && (
                  <div className="grid g2" style={{ gap: 6, marginTop: 8 }}>
                    {Object.entries(m.factors).map(([k, v]) => (
                      <div key={k} className="tiny">
                        <div className="row between">
                          <span className="muted">{FACTOR_LABEL[k as keyof typeof FACTOR_LABEL]}</span>
                          <b>{v}</b>
                        </div>
                        <Bar value={v / 100} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="tiny faint">Categorias reconhecidas: {CATEGORIES.map((c) => c.name).join(", ")}.</p>
    </div>
  );
}

function Regenerate({ p }: { p: Project }) {
  const { regenerate, toast } = useApp();
  const [gs, setGs] = useState(p.settings);
  const [busy, setBusy] = useState(false);
  return (
    <Card title="Gerar os clipes de novo" icon={<RefreshCw size={16} />}>
      <GenerateForm value={gs} onChange={setGs} sourceFps={p.source.fps} sourceDuration={p.source.duration} />
      <div className="banner amber small" style={{ marginTop: 12 }}>
        <AlertTriangle size={16} />
        <span>Os clipes atuais (e as edições feitas neles) serão substituídos. As exportações já feitas continuam no histórico.</span>
      </div>
      <button
        className="btn primary"
        style={{ marginTop: 12 }}
        disabled={busy}
        onClick={async () => {
          if (p.clips.length && !confirm("Substituir os clipes atuais?")) return;
          setBusy(true);
          const np = await regenerate(p, gs);
          setBusy(false);
          toast(`${np.clips.length} clipe(s) gerado(s).`);
        }}
      >
        <Sparkles size={16} /> Gerar clipes
      </button>
    </Card>
  );
}
