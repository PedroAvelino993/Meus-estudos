// Meus projetos: lista e a tela de cada projeto (momentos, clipes, exportação).

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Captions, CheckCircle2, ChevronDown, Download, FileArchive, FileVideo, FolderOpen, Images, Info, Loader2, Pencil, Play, Plus, RefreshCw, Scissors, Share2, Sparkles, Trash2 } from "lucide-react";
import type { Clip, ExportRecord, Moment, Project } from "../core/types";
import { CATEGORIES, category } from "../core/categories";
import { FACTOR_LABEL } from "../core/moments";
import { seg, totalDuration } from "../core/timeline";
import { defaultStyle } from "../core/captions";
import { fmtBytes, fmtDur, fmtTime, safeName, uid } from "../core/format";
import { db, setSessionSource, sourceFor } from "../media/db";
import { SHARE_MESSAGE, canShareFiles, downloadBlob, shareFiles, shareLimit, zipFiles } from "../media/files";
import { isIOS, isMobile } from "../media/device";
import { SaveDialog, ShareDialog, type SaveItem } from "../ui/SaveDialog";
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
  const full = exports.filter((e) => !e.light);
  const lastExport = (c: Clip) => full.find((e) => e.clipId === c.id && e.createdAt >= c.updatedAt) ?? full.find((e) => e.clipId === c.id);
  const lightExport = (c: Clip) => exports.find((e) => e.light && e.clipId === c.id && e.createdAt >= c.updatedAt);
  const exporting = jobs.some((j) => j.projectId === p.id && j.kind === "exportacao" && j.status === "rodando");

  const zipAll = async () => {
    const files: { name: string; blob: Blob }[] = [];
    for (const c of p.clips) {
      const e = lastExport(c);
      if (!e) continue;
      const b = await db.getExportFile(e.id);
      if (b) files.push({ name: `${String(files.length + 1).padStart(2, "0")}-${safeName(c.title)}.${extOf(e)}`, blob: b });
    }
    if (!files.length) return toast("Exporte os clipes primeiro.", true);
    setZipping(true);
    try {
      downloadBlob(await zipFiles(files), `${safeName(p.name)}-clipes.zip`);
    } finally {
      setZipping(false);
    }
  };

  const exportedCount = p.clips.filter((c) => lastExport(c)).length;
  const [saveItems, setSaveItems] = useState<SaveItem[] | null>(null);
  const saveAll = () => {
    const items: SaveItem[] = [];
    for (const c of p.clips) {
      const e = lastExport(c);
      if (e) items.push({ name: `${String(items.length + 1).padStart(2, "0")}-${safeName(c.title)}.${extOf(e)}`, load: () => db.getExportFile(e.id) });
    }
    if (!items.length) return toast("Exporte os clipes primeiro.", true);
    setSaveItems(items);
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
        {!isIOS() && (
          <button className="btn" disabled={!exportedCount} onClick={saveAll}>
            <Images size={16} /> Salvar todos no celular{exportedCount ? ` (${exportedCount})` : ""}
          </button>
        )}
        {saveItems && <SaveDialog items={saveItems} onClose={() => setSaveItems(null)} />}
        {!isMobile() && <button className="btn" disabled={zipping || !p.clips.some((c) => lastExport(c))} onClick={zipAll}>
          <FileArchive size={16} /> {zipping ? "Montando ZIP…" : "Baixar todos em ZIP"}
        </button>}
      </div>
      {!exportedCount && (
        <div className="banner small">
          <Share2 size={16} />
          <span>Exporte primeiro. Depois cada clipe ganha os botões «Salvar no celular» (o vídeo vai para a pasta Download, que aparece na Galeria) e «Compartilhar» (WhatsApp, Telegram, Drive…).</span>
        </div>
      )}
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
              <button className="btn sm" disabled={!hasSource || !!capJob} onClick={() => startCaptions(p, c.id, { target: c.captionLang })}>
                <Captions size={14} /> {c.captions.length ? "Refazer legendas" : "Gerar legendas"}
              </button>
              {e && <ExportButtons rec={e} name={c.title} outdated={!!outdated} light={lightExport(c)} onMakeLight={() => startExport(p, [c.id], { light: true })} onRerecord={() => startExport(p, [c.id])} projectId={p.id} busy={exporting} />}
              <button className="btn sm" disabled={!hasSource || exporting} onClick={() => startExport(p, [c.id])}>
                <Play size={14} /> {e ? (outdated ? "Exportar de novo (clipe mudou)" : "Exportar de novo") : "Exportar MP4"}
              </button>
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

/** Extensão do arquivo exportado (no iPhone pode ser .mov, o formato nativo dele). */
export function extOf(r: ExportRecord) {
  return r.mime === "video/quicktime" ? "mov" : "mp4";
}

/** Abre o menu de compartilhar do aparelho; se não houver, baixa o arquivo. */
export function useShare() {
  const { toast } = useApp();
  return async (items: { name: string; blob: Blob }[], title?: string) => {
    const r = await shareFiles(items, title);
    if (r === "ok" || r === "cancelado") return r;
    if (r === "indisponivel") for (const it of items) downloadBlob(it.blob, it.name);
    toast(SHARE_MESSAGE[r], r === "erro");
    return r;
  };
}

/** Salvar no celular (principal) e Compartilhar; no Android, acima de 50 MB oferece a versão leve. */
export function ExportButtons({ rec, name, outdated, compact, light, onMakeLight, onRerecord, projectId, busy }: { rec: ExportRecord; name: string; outdated: boolean; compact?: boolean; light?: ExportRecord; onMakeLight?: () => void; onRerecord?: () => void; projectId?: string; busy?: boolean }) {
  const { toast } = useApp();
  const file = `${safeName(name)}.${extOf(rec)}`;
  const tooBig = rec.size > shareLimit();
  const ios = isIOS();
  const [dialog, setDialog] = useState<null | { kind: "salvar" } | { kind: "share"; purpose: "fotos" | "compartilhar"; id: string; name: string }>(null);
  const shareMain = () => setDialog({ kind: "share", purpose: "compartilhar", id: rec.id, name: file });
  const canLight = tooBig && !light && !!onMakeLight;
  return (
    <>
      <button
        className="btn sm primary"
        // iPhone: «Salvar vídeo» do menu do sistema manda direto para o app Fotos
        onClick={() => setDialog(ios ? { kind: "share", purpose: "fotos", id: rec.id, name: file } : { kind: "salvar" })}
        title={outdated ? "O clipe mudou depois desta exportação" : ""}
      >
        <Images size={14} /> {compact ? "Salvar" : ios ? `Salvar no Fotos (${fmtBytes(rec.size)})` : `Salvar no celular (${fmtBytes(rec.size)})`}
        {outdated ? " · antigo" : ""}
      </button>
      {dialog?.kind === "salvar" && <SaveDialog items={[{ name: file, load: () => db.getExportFile(rec.id) }]} onClose={() => setDialog(null)} onShare={tooBig ? undefined : shareMain} />}
      {dialog?.kind === "share" && <ShareDialog item={{ name: dialog.name, load: () => db.getExportFile(dialog.id) }} purpose={dialog.purpose} recorded={rec.recorded} onRerecord={busy ? undefined : onRerecord} projectId={projectId} onClose={() => setDialog(null)} />}
      {light ? (
        <button className="btn sm" onClick={() => setDialog({ kind: "share", purpose: "compartilhar", id: light.id, name: `${safeName(name)}-leve.${extOf(light)}` })} title="Versão 720p menor que 50 MB">
          <Share2 size={14} /> Compartilhar (leve, {fmtBytes(light.size)})
        </button>
      ) : canLight ? (
        <button
          className="btn sm"
          disabled={busy}
          onClick={() => {
            toast("Criando uma versão leve (720p, menos de 45 MB) para caber no compartilhamento…");
            onMakeLight!();
          }}
          title="O compartilhamento do navegador aceita no máximo 50 MB"
        >
          <Share2 size={14} /> Compartilhar (criar versão leve)
        </button>
      ) : (
        <button className="btn sm" onClick={shareMain} title={canShareFiles() ? "WhatsApp, Telegram, Instagram…" : "Este navegador não tem menu de compartilhar"}>
          <Share2 size={14} /> Compartilhar
        </button>
      )}
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
  const { regenerate, toast, settings } = useApp();
  // Projetos feitos antes do modo cena contínua começam com os padrões novos (quadrado, cena corrida, legenda básica)
  const [gs, setGs] = useState(p.settings.mode === "cena" ? p.settings : { ...settings.defaults, count: p.settings.count, duration: p.settings.duration });
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
