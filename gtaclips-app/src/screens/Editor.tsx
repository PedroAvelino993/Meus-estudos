// Edição manual: prévia fiel ao arquivo final, linha do tempo e todos os ajustes do clipe.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Captions, ChevronLeft, ChevronRight, Download, FileText, Languages, Pause, Play, Plus, RotateCcw, Scissors, SkipBack, Trash2 } from "lucide-react";
import type { Caption, Clip, Project, Segment } from "../core/types";
import { actionPath, insertSegment, moveSegment, outToSource, removeSegment, segmentOffsets, splitAt, totalDuration, trimSegment, updateSegment } from "../core/timeline";
import { CAPTION_STYLES, FONTS, LANGUAGES, captionText, defaultStyle, languageName, toSrt } from "../core/captions";
import { category } from "../core/categories";
import { fmtDur, fmtTime, safeName, uid } from "../core/format";
import { setSessionSource, sourceFor } from "../media/db";
import { lowMemory } from "../media/device";
import { capabilities, type Capabilities } from "../media/probe";
import { drawFrame, ensureFonts, outputSize, type FrameState } from "../media/compose";
import { effectiveSegments } from "../media/export";
import { downloadBlob } from "../media/files";
import { claudeAvailable, claudeFixAndTranslate } from "../media/claude";
import { translateCaptions } from "../media/speech";
import { updateClip, useApp } from "../ui/store";
import { Bar, Card, Empty, Head, Seg, thumbAt, useThumbs } from "../ui/kit";

export default function Editor() {
  const { projects, projectId, clipId, go } = useApp();
  const project = projects.find((p) => p.id === projectId) ?? projects.find((p) => p.clips.length);
  const clip = project?.clips.find((c) => c.id === clipId) ?? project?.clips[0];
  if (!project || !clip)
    return (
      <div className="stack">
        <Head title="Edição manual" text="Escolha um clipe gerado pela IA para ajustar tudo: cortes, ordem, enquadramento, volume e legendas." />
        <Empty>Nenhum clipe para editar ainda. Crie clipes a partir de um vídeo primeiro.</Empty>
        <button className="btn primary" onClick={() => go("criar")}>
          Criar clipes
        </button>
      </div>
    );
  return <ClipEditor key={clip.id} project={project} clip={clip} />;
}

function ClipEditor({ project, clip: initial }: { project: Project; clip: Clip }) {
  const { projects, go, saveProject, startExport, startCaptions, jobs, toast } = useApp();
  const [clip, setClip] = useState<Clip>(initial);
  const [file, setFile] = useState<Blob | null | undefined>(undefined);
  const [sel, setSel] = useState<string>(initial.segments[0]?.id ?? "");
  const [panel, setPanel] = useState<"trechos" | "formato" | "imagem" | "legendas">("trechos");
  const thumbs = useThumbs(project.id);
  const saveTimer = useRef<number | undefined>(undefined);

  const [caps, setCaps] = useState<Capabilities | null>(null);
  useEffect(() => {
    sourceFor(project.id).then((f) => setFile(f));
    capabilities().then(setCaps);
  }, [project.id]);

  // Salva automaticamente (com pequeno atraso para não gravar a cada movimento do controle)
  const change = useCallback(
    (next: Clip) => {
      setClip(next);
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        const cur = projects.find((p) => p.id === project.id) ?? project;
        saveProject(updateClip(cur, next));
      }, 400);
    },
    [projects, project, saveProject],
  );
  // Atualiza quando legendas chegam do processamento em segundo plano
  useEffect(() => {
    const fresh = projects.find((p) => p.id === project.id)?.clips.find((c) => c.id === clip.id);
    if (fresh && fresh.captions !== clip.captions && fresh.updatedAt > clip.updatedAt) setClip((c) => ({ ...c, captions: fresh.captions, captionLang: fresh.captionLang, captionsOn: fresh.captionsOn, spokenLang: fresh.spokenLang }));
  }, [projects, project.id, clip.id, clip.captions, clip.updatedAt]);

  const segs = useMemo(() => effectiveSegments(clip, project.analysis), [clip, project.analysis]);
  const selected = clip.segments.find((s) => s.id === sel) ?? clip.segments[0];
  const relink = useRef<HTMLInputElement>(null);
  /** Salva a edição na hora (sem esperar o atraso do salvamento automático) e exporta. */
  const exportNow = async () => {
    window.clearTimeout(saveTimer.current);
    const cur = projects.find((p) => p.id === project.id) ?? project;
    const updated = updateClip(cur, clip);
    await saveProject(updated);
    startExport(updated, [clip.id]);
  };
  const capJob = jobs.find((j) => j.clipId === clip.id && j.kind === "legendas" && j.status === "rodando");
  const exporting = jobs.find((j) => j.projectId === project.id && j.kind === "exportacao" && j.status === "rodando");

  return (
    <div className="stack">
      <div className="row wrap between">
        <button className="btn sm ghost" onClick={() => go("projetos", { projectId: project.id })}>
          <ArrowLeft size={15} /> {project.name}
        </button>
        <select className="input" style={{ width: "auto", maxWidth: 360 }} value={clip.id} onChange={(e) => go("editor", { projectId: project.id, clipId: e.target.value })}>
          {project.clips.map((c, i) => (
            <option key={c.id} value={c.id}>
              {c.part ? `Parte ${c.part}` : `Clipe ${i + 1}`}: {c.title}
            </option>
          ))}
        </select>
      </div>
      <div className="row wrap between">
        <input className="input display" style={{ fontSize: 22, maxWidth: 640, background: "transparent", border: "none", padding: 0 }} value={clip.title} onChange={(e) => change({ ...clip, title: e.target.value })} aria-label="Título do clipe" />
        <button className="btn primary lg" disabled={!file || !!exporting} onClick={exportNow}>
          <Download size={18} /> EXPORTAR VÍDEO
        </button>
      </div>
      {exporting && (
        <div className="card hl">
          <div className="small">{exporting.detail}</div>
          <Bar value={exporting.value} anim />
        </div>
      )}
      {caps && project.source.audioCodec && !caps.audioCodec && (
        <div className="banner red small">Este navegador não consegue codificar áudio: o MP4 sairia sem som. Atualize o sistema/navegador (iOS 26 ou mais novo, ou Chrome/Edge atualizado).</div>
      )}
      {file === null && (
        <div className="banner amber small">
          <div className="grow">
            O vídeo original não está aberto nesta sessão (o navegador não guarda acesso a arquivos). Selecione o mesmo arquivo para assistir e exportar.
            <div style={{ marginTop: 8 }}>
              <button className="btn sm primary" onClick={() => relink.current?.click()}>
                Selecionar o vídeo original
              </button>
              <input
                ref={relink}
                type="file"
                accept="video/*,.mkv,.mov"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size !== project.source.size && !confirm("Este arquivo parece diferente do original. Usar mesmo assim?")) return;
                  setSessionSource(project.id, f);
                  setFile(f);
                }}
              />
            </div>
          </div>
        </div>
      )}
      <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.15fr)", alignItems: "start" }} data-editor>
        <Preview clip={clip} segs={segs} file={file ?? null} project={project} />
        <div className="stack">
          <Seg
            value={panel}
            onChange={setPanel}
            options={[
              { id: "trechos", label: "Trechos" },
              { id: "formato", label: "Formato" },
              { id: "imagem", label: "Imagem e áudio" },
              { id: "legendas", label: `Legendas${clip.captions.length ? ` (${clip.captions.length})` : ""}` },
            ]}
          />
          {panel === "trechos" && selected && <SegmentPanel clip={clip} project={project} selected={selected} setSel={setSel} change={change} />}
          {panel === "formato" && <FormatPanel clip={clip} change={change} sourceFps={project.source.fps} selected={selected} />}
          {panel === "imagem" && <ImagePanel clip={clip} change={change} />}
          {panel === "legendas" && <CaptionPanel clip={clip} project={project} change={change} busy={capJob ? `${capJob.detail}` : null} busyValue={capJob?.value ?? 0} onGenerate={(target) => (file ? startCaptions(project, clip.id, { target }) : toast("Selecione o vídeo original primeiro.", true))} />}
        </div>
      </div>
      <Timeline clip={clip} thumbs={thumbs} sel={selected?.id} setSel={setSel} />
      <Card title="História deste clipe" icon={<Scissors size={16} />}>
        <p className="small muted">{clip.story}</p>
        <div className="row wrap tiny" style={{ gap: 6, marginTop: 8 }}>
          {clip.beats.map((b, i) => (
            <span key={i} className="tag">
              {b.label} · {fmtTime(b.t)}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------- Prévia ----------

function Preview({ clip, segs, file, project }: { clip: Clip; segs: Segment[]; file: Blob | null; project: Project }) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [outT, setOutT] = useState(0);
  // Prévia solta durante exportação/análise: o celular tem poucos decodificadores de vídeo
  const [released, setReleased] = useState(false);
  const st = useRef({ seg: 0, outT: 0, playing: false, dirty: true, lastUi: 0 });
  const fast = useMemo(() => lowMemory(), []);
  const path = useMemo(() => (project.analysis ? actionPath(project.analysis.samples) : []), [project.analysis]);
  const total = totalDuration(segs);
  const offsets = useMemo(() => segmentOffsets(segs), [segs]);
  const { width, height } = outputSize(clip.format, 540);

  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    ensureFonts();
    return () => URL.revokeObjectURL(u);
  }, [file]);

  useEffect(() => {
    const free = () => {
      const v = video.current;
      if (v) {
        v.pause();
        v.removeAttribute("src");
        v.load();
      }
      st.current.playing = false;
      setPlaying(false);
      setReleased(true);
    };
    window.addEventListener("gca:free-decoders", free);
    return () => window.removeEventListener("gca:free-decoders", free);
  }, []);

  const draw = useCallback(() => {
    const v = video.current;
    const c = canvas.current;
    if (!v || !c || !v.videoWidth || !segs.length) return;
    const i = Math.min(st.current.seg, segs.length - 1);
    const s = segs[i];
    const fs: FrameState = { outT: st.current.outT, srcT: v.currentTime, seg: s, segOut: offsets[i], segDur: s.end - s.start, isFirst: i === 0, isLast: i === segs.length - 1 };
    drawFrame(c.getContext("2d")!, width, height, v, v.videoWidth, v.videoHeight, { clip, path, fast }, fs);
    st.current.dirty = false;
  }, [segs, offsets, width, height, clip, path, fast]);
  // Qualquer mudança no clipe pede um novo desenho
  useEffect(() => {
    st.current.dirty = true;
  }, [draw]);

  const seek = useCallback(
    (t: number) => {
      const v = video.current;
      const pos = outToSource(segs, Math.max(0, Math.min(total - 0.01, t)));
      if (!v || !pos) return;
      st.current.seg = pos.index;
      st.current.outT = t;
      st.current.dirty = true;
      v.currentTime = pos.src;
      v.volume = Math.min(1, clip.volume * segs[pos.index].volume);
      setOutT(t);
    },
    [segs, total, clip.volume],
  );

  // Laço de reprodução: segue os trechos, pulando entre eles
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = video.current;
      if (v && st.current.playing) {
        const i = st.current.seg;
        const s = segs[i];
        if (s && v.currentTime >= s.end - 0.03) {
          if (i + 1 < segs.length) {
            st.current.seg = i + 1;
            v.currentTime = segs[i + 1].start;
            v.volume = Math.min(1, clip.volume * segs[i + 1].volume);
          } else {
            v.pause();
            st.current.playing = false;
            setPlaying(false);
          }
        }
        if (s) {
          st.current.outT = offsets[st.current.seg] + Math.max(0, v.currentTime - segs[st.current.seg].start);
          // A barra de tempo não precisa de 60 atualizações por segundo
          const now = performance.now();
          if (now - st.current.lastUi > 120) {
            st.current.lastUi = now;
            setOutT(st.current.outT);
          }
        }
      }
      // Parado: só redesenha quando algo mudou (economiza bateria e não trava o celular)
      if (st.current.playing || st.current.dirty) draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [segs, offsets, draw, clip.volume]);


  const toggle = async () => {
    const v = video.current;
    if (!v) return;
    if (st.current.playing) {
      v.pause();
      st.current.playing = false;
      setPlaying(false);
    } else {
      if (st.current.outT >= total - 0.05) seek(0);
      try {
        await v.play();
        st.current.playing = true;
        setPlaying(true);
      } catch {
        /* o navegador pede um toque do usuário */
      }
    }
  };

  return (
    <section className="card" style={{ padding: 10, position: "relative" }}>
      <div className="player" style={{ aspectRatio: `${width}/${height}`, maxHeight: "64vh", margin: "0 auto" }}>
        <canvas ref={canvas} width={width} height={height} style={{ width: "100%", height: "100%" }} onClick={toggle} />
        {!file && <div className="small muted" style={{ position: "absolute" }}>Sem o vídeo original</div>}
        {file && released && (
          <button className="btn sm" style={{ position: "absolute", bottom: 10 }} onClick={() => setReleased(false)}>
            Prévia pausada para liberar o aparelho · Recarregar
          </button>
        )}
      </div>
      {url && !released && <video ref={video} src={url} playsInline preload="auto" muted={false} style={{ position: "absolute", width: 2, height: 2, opacity: 0.01, pointerEvents: "none", left: 0, top: 0 }} onSeeked={() => { st.current.dirty = true; }} onLoadedData={() => { st.current.dirty = true; }} onLoadedMetadata={() => seek(st.current.outT)} />}
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn sm" onClick={() => seek(0)} aria-label="Voltar ao início" disabled={!file}>
          <SkipBack size={15} />
        </button>
        <button className="btn sm primary" onClick={toggle} disabled={!file || released} aria-label={playing ? "Pausar" : "Assistir"}>
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <input type="range" min={0} max={Math.max(0.1, total)} step={0.05} value={outT} onChange={(e) => seek(Number(e.target.value))} className="grow" aria-label="Posição" />
        <span className="tiny num muted">
          {fmtTime(outT)} / {fmtTime(total)}
        </span>
      </div>
      <p className="tiny faint" style={{ marginTop: 6 }}>
        A prévia usa o mesmo desenho do arquivo final (enquadramento, legendas, transições). Volume acima de 100% só é aplicado na exportação.
      </p>
    </section>
  );
}

// ---------- Linha do tempo ----------

function Timeline({ clip, thumbs, sel, setSel }: { clip: Clip; thumbs: { t: number; url: string }[]; sel?: string; setSel: (id: string) => void }) {
  const [pps, setPps] = useState(14);
  return (
    <Card title={`Linha do tempo · ${fmtDur(totalDuration(clip.segments))} · ${clip.segments.length} trecho(s)`} right={<Seg value={pps} onChange={setPps} options={[{ id: 7, label: "−" }, { id: 14, label: "1×" }, { id: 28, label: "+" }]} />}>
      <div className="timeline">
        {clip.segments.map((s, i) => (
          <button key={s.id} className={`tl-seg ${s.id === sel ? "on" : ""}`} style={{ width: Math.max(44, (s.end - s.start) * pps), backgroundImage: `url(${thumbAt(thumbs, (s.start + s.end) / 2) ?? ""})` }} onClick={() => setSel(s.id)} title={`Trecho ${i + 1}: ${fmtTime(s.start)}–${fmtTime(s.end)}`}>
            <span>
              {i + 1} · {fmtDur(s.end - s.start)}
            </span>
          </button>
        ))}
      </div>
      <p className="tiny faint">Cada bloco é um trecho do vídeo original, na ordem em que aparece no clipe. Toque para editar.</p>
    </Card>
  );
}

// ---------- Painéis ----------

function SegmentPanel({ clip, project, selected, setSel, change }: { clip: Clip; project: Project; selected: Segment; setSel: (id: string) => void; change: (c: Clip) => void }) {
  const dur = project.source.duration;
  const idx = clip.segments.findIndex((s) => s.id === selected.id);
  const set = (segments: Segment[]) => change({ ...clip, segments });
  const [addFrom, setAddFrom] = useState("");
  const outStart = segmentOffsets(clip.segments)[idx] ?? 0;
  const candidates = (project.analysis?.moments ?? []).filter((m) => !m.dead && !clip.segments.some((s) => s.start < m.end && s.end > m.start)).sort((a, b) => b.score - a.score).slice(0, 15);
  const nudge = (field: "start" | "end", d: number) => set(trimSegment(clip.segments, selected.id, field === "start" ? selected.start + d : selected.start, field === "end" ? selected.end + d : selected.end, dur));
  return (
    <Card title={`Trecho ${idx + 1} de ${clip.segments.length}`} icon={<Scissors size={16} />}>
      <div className="small muted" style={{ marginBottom: 8 }}>
        Do original: {fmtTime(selected.start)} → {fmtTime(selected.end)} ({fmtDur(selected.end - selected.start)}) · no clipe a partir de {fmtTime(outStart)}
      </div>
      <div className="grid g2">
        <label className="field">
          Início (s)
          <div className="row">
            <button className="btn sm" onClick={() => nudge("start", -0.5)}>
              −0,5
            </button>
            <input className="input num" type="number" step={0.1} value={selected.start} onChange={(e) => set(trimSegment(clip.segments, selected.id, Number(e.target.value), selected.end, dur))} />
            <button className="btn sm" onClick={() => nudge("start", 0.5)}>
              +0,5
            </button>
          </div>
        </label>
        <label className="field">
          Fim (s)
          <div className="row">
            <button className="btn sm" onClick={() => nudge("end", -0.5)}>
              −0,5
            </button>
            <input className="input num" type="number" step={0.1} value={selected.end} onChange={(e) => set(trimSegment(clip.segments, selected.id, selected.start, Number(e.target.value), dur))} />
            <button className="btn sm" onClick={() => nudge("end", 0.5)}>
              +0,5
            </button>
          </div>
        </label>
        <label className="field">
          Volume do trecho: {Math.round(selected.volume * 100)}%
          <input type="range" min={0} max={2} step={0.05} value={selected.volume} onChange={(e) => set(updateSegment(clip.segments, selected.id, { volume: Number(e.target.value) }))} />
        </label>
        <label className="field">
          Zoom do trecho: {Math.round((selected.zoom ?? 1) * 100)}%
          <input type="range" min={1} max={2} step={0.05} value={selected.zoom ?? 1} onChange={(e) => set(updateSegment(clip.segments, selected.id, { zoom: Number(e.target.value) }))} />
        </label>
        {clip.reframe === "manual" && (
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Posição do recorte: {Math.round((selected.cropX ?? 0.5) * 100)}% (esquerda → direita)
            <input type="range" min={0} max={1} step={0.01} value={selected.cropX ?? 0.5} onChange={(e) => set(updateSegment(clip.segments, selected.id, { cropX: Number(e.target.value) }))} />
          </label>
        )}
      </div>
      <div className="row wrap" style={{ marginTop: 12 }}>
        <button className="btn sm" disabled={idx === 0} onClick={() => set(moveSegment(clip.segments, selected.id, -1))}>
          <ChevronLeft size={14} /> Mover antes
        </button>
        <button className="btn sm" disabled={idx === clip.segments.length - 1} onClick={() => set(moveSegment(clip.segments, selected.id, 1))}>
          Mover depois <ChevronRight size={14} />
        </button>
        <button
          className="btn sm"
          onClick={() => {
            const mid = outStart + (selected.end - selected.start) / 2;
            const next = splitAt(clip.segments, mid);
            set(next);
          }}
        >
          <Scissors size={14} /> Dividir ao meio
        </button>
        <button
          className="btn sm"
          disabled={clip.segments.length <= 1}
          onClick={() => {
            const next = removeSegment(clip.segments, selected.id);
            set(next);
            setSel(next[Math.max(0, idx - 1)].id);
          }}
        >
          <Trash2 size={14} /> Excluir trecho
        </button>
      </div>
      <div className="sep" />
      <h4 style={{ marginBottom: 8 }}>Adicionar trecho depois deste</h4>
      <div className="row wrap">
        <select className="input grow" value={addFrom} onChange={(e) => setAddFrom(e.target.value)}>
          <option value="">Escolha um momento fora do clipe…</option>
          {candidates.map((m) => (
            <option key={m.id} value={m.id}>
              {fmtTime(m.start)} · {category(m.category).name} · nota {m.score}
            </option>
          ))}
        </select>
        <button
          className="btn sm"
          disabled={!addFrom}
          onClick={() => {
            const m = candidates.find((x) => x.id === addFrom);
            if (!m) return;
            const next = insertSegment(clip.segments, m.start, m.end, selected.id);
            set(next);
            setSel(next[idx + 1].id);
            setAddFrom("");
          }}
        >
          <Plus size={14} /> Adicionar
        </button>
        <button
          className="btn sm"
          onClick={() => {
            const s = Math.min(dur - 1, selected.end);
            const next = insertSegment(clip.segments, s, Math.min(dur, s + 3), selected.id);
            set(next);
            setSel(next[idx + 1].id);
          }}
        >
          <ArrowRight size={14} /> +3 s seguintes
        </button>
      </div>
    </Card>
  );
}

function FormatPanel({ clip, change, sourceFps, selected }: { clip: Clip; change: (c: Clip) => void; sourceFps: number; selected?: Segment }) {
  return (
    <Card title="Formato e enquadramento">
      <div className="stack">
        <div>
          <h4 style={{ marginBottom: 8 }}>Formato</h4>
          <Seg value={clip.format} onChange={(format) => change({ ...clip, format, captionStyle: { ...clip.captionStyle, position: defaultStyle(clip.captionStyle.id, format).position, size: defaultStyle(clip.captionStyle.id, format).size } })} options={[{ id: "9:16", label: "9:16 Shorts" }, { id: "16:9", label: "16:9 YouTube" }, { id: "1:1", label: "1:1 Quadrado" }]} />
        </div>
        <div>
          <h4 style={{ marginBottom: 8 }}>Enquadramento</h4>
          <Seg value={clip.reframe} onChange={(reframe) => change({ ...clip, reframe })} options={[{ id: "acao", label: "Seguir a ação" }, { id: "desfocado", label: "Fundo desfocado" }, { id: "centro", label: "Centro" }, { id: "manual", label: "Manual" }]} />
          <p className="tiny muted" style={{ marginTop: 6 }}>
            {clip.reframe === "acao" && "O recorte acompanha onde a ação acontece (movimento na tela), com transições suaves e sem trancos."}
            {clip.reframe === "desfocado" && "Mostra o quadro inteiro, sem cortar nada, com a própria cena desfocada no fundo."}
            {clip.reframe === "centro" && "Recorte fixo no centro (o personagem costuma ficar no meio em jogos de terceira pessoa)."}
            {clip.reframe === "manual" && `Você escolhe a posição do recorte em cada trecho, na aba Trechos${selected ? "" : ""}.`}
          </p>
        </div>
        <label className="field">
          Zoom geral: {Math.round(clip.zoom * 100)}%
          <input type="range" min={1} max={1.8} step={0.02} value={clip.zoom} onChange={(e) => change({ ...clip, zoom: Number(e.target.value) })} />
        </label>
        <div className="grid g2">
          <div>
            <h4 style={{ marginBottom: 8 }}>Quadros por segundo</h4>
            <Seg value={clip.fps} onChange={(fps) => change({ ...clip, fps })} options={[{ id: 30, label: "30" }, { id: 60, label: sourceFps < 50 ? "60 (original é 30)" : "60" }]} />
          </div>
          <div>
            <h4 style={{ marginBottom: 8 }}>Transições</h4>
            <Seg value={clip.transition} onChange={(transition) => change({ ...clip, transition })} options={[{ id: "fade", label: "Fade discreto" }, { id: "corte", label: "Corte seco" }]} />
          </div>
        </div>
        <label className="row small">
          <input type="checkbox" checked={clip.removeSilence} onChange={(e) => change({ ...clip, removeSilence: e.target.checked })} /> Remover silêncios longos (som baixo e imagem parada)
        </label>
      </div>
    </Card>
  );
}

function ImagePanel({ clip, change }: { clip: Clip; change: (c: Clip) => void }) {
  const a = clip.adjust;
  const set = (p: Partial<Clip["adjust"]>) => change({ ...clip, adjust: { ...a, ...p } });
  return (
    <Card title="Imagem e áudio">
      <div className="stack">
        <label className="field">
          Brilho: {Math.round(a.brightness * 100)}%
          <input type="range" min={0.6} max={1.5} step={0.02} value={a.brightness} onChange={(e) => set({ brightness: Number(e.target.value) })} />
        </label>
        <label className="field">
          Contraste: {Math.round(a.contrast * 100)}%
          <input type="range" min={0.6} max={1.6} step={0.02} value={a.contrast} onChange={(e) => set({ contrast: Number(e.target.value) })} />
        </label>
        <label className="field">
          Saturação: {Math.round(a.saturation * 100)}%
          <input type="range" min={0} max={2} step={0.02} value={a.saturation} onChange={(e) => set({ saturation: Number(e.target.value) })} />
        </label>
        <button className="btn sm" onClick={() => set({ brightness: 1, contrast: 1, saturation: 1 })}>
          <RotateCcw size={14} /> Restaurar imagem
        </button>
        <div className="sep" />
        <label className="field">
          Volume geral: {Math.round(clip.volume * 100)}%
          <input type="range" min={0} max={2} step={0.05} value={clip.volume} onChange={(e) => change({ ...clip, volume: Number(e.target.value) })} />
        </label>
        <label className="row small">
          <input type="checkbox" checked={clip.normalize} onChange={(e) => change({ ...clip, normalize: e.target.checked })} /> Normalizar o volume (deixa o áudio no nível certo para celular, com limitador contra estouro)
        </label>
        <p className="tiny faint">O app não adiciona músicas nem efeitos sonoros: só o áudio da sua gravação, evitando problemas de direitos autorais.</p>
      </div>
    </Card>
  );
}

function CaptionPanel({ clip, project, change, busy, busyValue, onGenerate }: { clip: Clip; project: Project; change: (c: Clip) => void; busy: string | null; busyValue: number; onGenerate: (target: string) => void }) {
  const { toast } = useApp();
  const st = clip.captionStyle;
  const setStyle = (p: Partial<typeof st>) => change({ ...clip, captionStyle: { ...st, ...p } });
  const [translating, setTranslating] = useState<string | null>(null);
  const langs = ["orig", ...LANGUAGES.map((l) => l.code)];
  const hasLang = (code: string) => code === "orig" || clip.captions.every((c) => c.translations[code] !== undefined);

  const translateTo = async (code: string) => {
    setTranslating("Traduzindo…");
    try {
      let caps: Caption[];
      if (claudeAvailable()) caps = await claudeFixAndTranslate(clip.captions, clip.spokenLang ?? null, code);
      else caps = await translateCaptions(clip.captions, clip.spokenLang ?? "en", code, (p) => setTranslating(p.detail));
      change({ ...clip, captions: caps, captionLang: code });
      toast(`Legendas traduzidas para ${languageName(code)}.`);
    } catch (e) {
      toast(`Falha na tradução: ${e instanceof Error ? e.message : e}`, true);
    } finally {
      setTranslating(null);
    }
  };

  const editCaption = (id: string, text: string) =>
    change({
      ...clip,
      captions: clip.captions.map((c) => {
        if (c.id !== id) return c;
        if (clip.captionLang === "orig") return { ...c, text, words: [] };
        return { ...c, translations: { ...c.translations, [clip.captionLang]: text } };
      }),
    });

  return (
    <Card title="Legendas" icon={<Captions size={16} />}>
      <div className="stack">
        {busy && (
          <div>
            <div className="tiny muted">{busy}</div>
            <Bar value={busyValue} anim />
          </div>
        )}
        {!project.source.audioCodec && <div className="banner small">Este vídeo não tem áudio decodificável.</div>}
        <div className="row wrap">
          <button className="btn sm primary" disabled={!!busy || !project.source.audioCodec} onClick={() => onGenerate(clip.captionLang)}>
            <Captions size={14} /> {clip.captions.length ? "Refazer legendas" : "Gerar legendas automáticas"}
          </button>
          <label className="row small">
            <input type="checkbox" checked={clip.captionsOn} onChange={(e) => change({ ...clip, captionsOn: e.target.checked })} /> Mostrar no vídeo
          </label>
          {clip.spokenLang && <span className="tag blue">Falado: {languageName(clip.spokenLang)}</span>}
        </div>
        <p className="tiny muted">Reconhecimento de fala no aparelho (Whisper). O idioma falado é detectado automaticamente; a tradução usa o tradutor local (NLLB) ou o Claude, se configurado.</p>
        <label className="field">
          Idioma exibido
          <div className="row">
            <select className="input" value={clip.captionLang} onChange={(e) => change({ ...clip, captionLang: e.target.value })}>
              {langs.map((code) => (
                <option key={code} value={code}>
                  {languageName(code)}
                  {hasLang(code) ? "" : " (traduzir)"}
                </option>
              ))}
            </select>
            {!hasLang(clip.captionLang) && clip.captions.length > 0 && (
              <button className="btn sm" disabled={!!translating} onClick={() => translateTo(clip.captionLang)}>
                <Languages size={14} /> {translating ?? "Traduzir"}
              </button>
            )}
          </div>
        </label>
        <div>
          <h4 style={{ marginBottom: 8 }}>Estilo</h4>
          <div className="chips">
            {CAPTION_STYLES.map((s) => (
              <button key={s.id} className={`chip ${st.id === s.id ? "on" : ""}`} title={s.description} onClick={() => change({ ...clip, captionStyle: defaultStyle(s.id, clip.format) })}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
        <div className="grid g2">
          <label className="field">
            Fonte
            <select className="input" value={st.font} onChange={(e) => setStyle({ font: e.target.value })}>
              {FONTS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Animação
            <select className="input" value={st.animation} onChange={(e) => setStyle({ animation: e.target.value as typeof st.animation })}>
              <option value="nenhuma">Nenhuma</option>
              <option value="pop">Pop</option>
              <option value="subir">Subir</option>
              <option value="palavra">Palavra por palavra</option>
            </select>
          </label>
          <label className="field">
            Tamanho: {st.size.toFixed(1)}%
            <input type="range" min={2} max={9} step={0.1} value={st.size} onChange={(e) => setStyle({ size: Number(e.target.value) })} />
          </label>
          <label className="field">
            Posição: {Math.round(st.position * 100)}% da altura
            <input type="range" min={0.1} max={0.95} step={0.01} value={st.position} onChange={(e) => setStyle({ position: Number(e.target.value) })} />
          </label>
          <label className="row small">
            Cor <input type="color" value={st.color} onChange={(e) => setStyle({ color: e.target.value })} /> Destaque <input type="color" value={st.highlight} onChange={(e) => setStyle({ highlight: e.target.value })} />
          </label>
          <div className="row wrap small">
            <label className="row">
              <input type="checkbox" checked={st.uppercase} onChange={(e) => setStyle({ uppercase: e.target.checked })} /> Maiúsculas
            </label>
            <label className="row">
              <input type="checkbox" checked={st.outline} onChange={(e) => setStyle({ outline: e.target.checked })} /> Contorno
            </label>
            <label className="row">
              <input type="checkbox" checked={st.background} onChange={(e) => setStyle({ background: e.target.checked })} /> Fundo
            </label>
          </div>
        </div>
        {clip.captions.length > 0 && (
          <>
            <div className="row between">
              <h4>Textos ({languageName(clip.captionLang)})</h4>
              <button className="btn sm" onClick={() => downloadBlob(new Blob([toSrt(clip.captions, clip.segments, clip.captionLang)], { type: "text/plain" }), `${safeName(clip.title)}.srt`)}>
                <FileText size={14} /> Baixar .srt
              </button>
            </div>
            <div className="list" style={{ maxHeight: 340, overflowY: "auto" }}>
              {clip.captions.map((c) => (
                <div key={c.id} className="row" style={{ alignItems: "flex-start" }}>
                  <span className="tag" title="Tempo no vídeo original">
                    {fmtTime(c.start)}
                    {c.speaker ? ` · voz ${c.speaker}` : ""}
                  </span>
                  <textarea className="input" rows={1} value={captionText(c, clip.captionLang)} onChange={(e) => editCaption(c.id, e.target.value)} />
                  <button className="btn sm ghost" aria-label="Excluir legenda" onClick={() => change({ ...clip, captions: clip.captions.filter((x) => x.id !== c.id) })}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button className="btn sm" onClick={() => {
              const s = clip.segments[0];
              change({ ...clip, captions: [...clip.captions, { id: uid("cap"), start: s.start, end: Math.min(s.end, s.start + 2), text: "Nova legenda", words: [], translations: {} }].sort((a, b) => a.start - b.start) });
            }}>
              <Plus size={14} /> Adicionar legenda no início
            </button>
            <p className="tiny faint">A identificação de vozes (voz 1, voz 2) é uma estimativa pela altura da voz.</p>
          </>
        )}
      </div>
    </Card>
  );
}
