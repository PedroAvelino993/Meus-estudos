// YouTube e monetização: curso, requisitos atuais, políticas, análise do canal e publicação.

import { useMemo, useState } from "react";
import { AlertTriangle, BarChart3, BookOpen, CheckCircle2, Copy, ExternalLink, GraduationCap, Link2, RefreshCw, Scale, Send, Sparkles } from "lucide-react";
import { COURSE, POLICY_SECTIONS, VERIFIED_AT, YT } from "../content/course";
import { analyzePerformance, weightsFrom, type VideoStats } from "../core/learning";
import { category } from "../core/categories";
import { fmtDur } from "../core/format";
import { ytChannel, ytClientId, ytConnect, ytConnected, ytDisconnect, ytRetention, ytVideos, isShort, type ChannelInfo } from "../media/youtube";
import { claudeAvailable, claudeMonetizationUpdate, claudePublishKit } from "../media/claude";
import { useApp } from "../ui/store";
import { Bar, Card, Empty, Head, Seg, Stat } from "../ui/kit";

type Tab = "curso" | "requisitos" | "politicas" | "analise" | "publicar";

export default function YouTube() {
  const [tab, setTab] = useState<Tab>("curso");
  return (
    <div className="stack">
      <Head title="YouTube e monetização" text="Um curso prático para montar o canal do zero, as regras oficiais de monetização (sem promessas), as políticas de direitos autorais e a análise do seu canal com dados reais." />
      <Seg
        value={tab}
        onChange={setTab}
        options={[
          { id: "curso", label: "Curso" },
          { id: "requisitos", label: "Requisitos atuais" },
          { id: "politicas", label: "Direitos e políticas" },
          { id: "analise", label: "Análise do canal" },
          { id: "publicar", label: "Publicar" },
        ]}
      />
      {tab === "curso" && <Course />}
      {tab === "requisitos" && <Requirements />}
      {tab === "politicas" && <Policies />}
      {tab === "analise" && <Analytics />}
      {tab === "publicar" && <Publish />}
    </div>
  );
}

function Course() {
  const { settings, setSettings } = useApp();
  const [mod, setMod] = useState(COURSE[0].id);
  const [lesson, setLesson] = useState(COURSE[0].lessons[0].id);
  const m = COURSE.find((x) => x.id === mod)!;
  const l = m.lessons.find((x) => x.id === lesson) ?? m.lessons[0];
  const done = settings.course;
  const total = COURSE.reduce((a, x) => a + x.lessons.length, 0);
  const doneCount = Object.values(done).filter(Boolean).length;
  const toggle = (id: string) => setSettings({ course: { ...done, [id]: !done[id] } });
  const idx = m.lessons.indexOf(l);
  return (
    <div className="grid" style={{ gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 2fr)", alignItems: "start" }} data-course>
      <div className="stack">
        <Card title="Seu progresso" icon={<GraduationCap size={16} />}>
          <div className="small muted" style={{ marginBottom: 6 }}>
            {doneCount} de {total} lições concluídas
          </div>
          <Bar value={doneCount / total} tone="green" />
        </Card>
        {COURSE.map((x) => {
          const d = x.lessons.filter((y) => done[y.id]).length;
          return (
            <div key={x.id} className={`item click ${x.id === mod ? "on" : ""}`} onClick={() => { setMod(x.id); setLesson(x.lessons[0].id); }}>
              <b className="small">{x.title}</b>
              <div className="tiny muted">{x.goal}</div>
              <div className="tiny" style={{ marginTop: 4 }}>
                {d}/{x.lessons.length} lições
              </div>
            </div>
          );
        })}
      </div>
      <Card title={m.title} icon={<BookOpen size={16} />}>
        <div className="chips" style={{ marginBottom: 12 }}>
          {m.lessons.map((y, i) => (
            <button key={y.id} className={`chip ${y.id === l.id ? "on" : ""}`} onClick={() => setLesson(y.id)}>
              {done[y.id] ? "✓ " : ""}
              {i + 1}. {y.title}
            </button>
          ))}
        </div>
        <div className="lesson">
          <h2>{l.title}</h2>
          {l.body.map((p, i) => (
            <p key={i} style={{ marginTop: 8 }}>
              {p}
            </p>
          ))}
          {l.steps && (
            <>
              <h4>Passo a passo</h4>
              <ol>
                {l.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </>
          )}
          {l.links && (
            <div className="row wrap" style={{ marginTop: 10 }}>
              {l.links.map((k) => (
                <a key={k.url} className="btn sm" href={k.url} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} /> {k.label}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="row wrap between" style={{ marginTop: 16 }}>
          <button className={`btn ${done[l.id] ? "" : "primary"}`} onClick={() => toggle(l.id)}>
            <CheckCircle2 size={16} /> {done[l.id] ? "Concluída" : "Marcar como concluída"}
          </button>
          <div className="row">
            <button className="btn sm" disabled={idx === 0} onClick={() => setLesson(m.lessons[idx - 1].id)}>
              Anterior
            </button>
            <button className="btn sm" disabled={idx === m.lessons.length - 1} onClick={() => setLesson(m.lessons[idx + 1].id)}>
              Próxima
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Requirements() {
  const lesson = COURSE.find((m) => m.id === "m4")!.lessons[0];
  const [update, setUpdate] = useState<{ at: string; text: string } | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("gca:yppUpdate") ?? "null");
    } catch {
      return null;
    }
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = async () => {
    setBusy(true);
    setErr(null);
    try {
      const text = await claudeMonetizationUpdate();
      const u = { at: new Date().toLocaleString("pt-BR"), text };
      localStorage.setItem("gca:yppUpdate", JSON.stringify(u));
      setUpdate(u);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="stack">
      <div className="banner amber">
        <AlertTriangle size={18} />
        <span>
          <b>Monetização não é garantida.</b> Atingir os números só permite pedir a entrada; o YouTube revisa o canal inteiro. As regras mudam — confira sempre os links oficiais abaixo.
        </span>
      </div>
      <Card title={`Requisitos (verificados em ${VERIFIED_AT})`} icon={<Scale size={16} />}>
        <div className="lesson">
          {lesson.body.map((p, i) => (
            <p key={i} style={{ marginTop: i ? 8 : 0 }}>
              {p}
            </p>
          ))}
        </div>
        <div className="row wrap" style={{ marginTop: 12 }}>
          <a className="btn sm" href={YT.ypp} target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> Requisitos oficiais
          </a>
          <a className="btn sm" href={YT.changes} target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> Mudanças anunciadas
          </a>
          <a className="btn sm" href={YT.policies} target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> Políticas de monetização
          </a>
        </div>
      </Card>
      <Card title="Atualizar agora pelas fontes oficiais" icon={<RefreshCw size={16} />}>
        <p className="small muted">O navegador não consegue ler as páginas de ajuda do Google diretamente (elas bloqueiam esse acesso). Com uma chave do Claude configurada, o app pede ao Claude para pesquisar nas páginas oficiais do YouTube e resumir os requisitos atuais com os links.</p>
        <button className="btn primary" style={{ marginTop: 10 }} disabled={busy || !claudeAvailable()} onClick={run}>
          <RefreshCw size={15} /> {busy ? "Pesquisando nas páginas oficiais…" : claudeAvailable() ? "Consultar requisitos atuais" : "Configure a chave do Claude em Configurações"}
        </button>
        {err && <div className="banner red small" style={{ marginTop: 10 }}>{err}</div>}
        {update && (
          <div className="item" style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
            <div className="tiny muted">Consulta de {update.at}</div>
            <div className="small" style={{ marginTop: 6 }}>
              {update.text}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Policies() {
  return (
    <div className="stack">
      {POLICY_SECTIONS.map((s) => (
        <Card key={s.title} title={s.title} icon={<Scale size={16} />}>
          <div className="lesson">
            {s.body.map((p, i) => (
              <p key={i} style={{ marginTop: i ? 8 : 0 }}>
                {p}
              </p>
            ))}
          </div>
          {s.link && (
            <a className="btn sm" style={{ marginTop: 10 }} href={s.link.url} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> {s.link.label}
            </a>
          )}
        </Card>
      ))}
    </div>
  );
}

function Analytics() {
  const { settings, setSettings, go, toast } = useApp();
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [videos, setVideos] = useState<VideoStats[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [retention, setRetention] = useState<{ id: string; points: { x: number; ratio: number }[] } | null>(null);
  const perf = useMemo(() => analyzePerformance(videos), [videos]);

  const connect = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (!ytConnected()) await ytConnect();
      const ch = await ytChannel();
      setChannel(ch);
      setVideos(await ytVideos(ch));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!ytClientId())
    return (
      <Card title="Conectar o canal" icon={<Link2 size={16} />}>
        <p className="small">Para ler os dados do seu canal, o app usa a API oficial do YouTube com o login do Google, só com permissão de leitura. Antes, é preciso criar uma credencial gratuita no Google Cloud (passo a passo em Configurações).</p>
        <button className="btn primary" style={{ marginTop: 10 }} onClick={() => go("config")}>
          Configurar o Client ID do Google
        </button>
        <p className="tiny faint" style={{ marginTop: 10 }}>Nenhum dado é inventado ou simulado: sem conexão, esta área fica vazia.</p>
      </Card>
    );

  return (
    <div className="stack">
      {!channel ? (
        <Card title="Conectar o canal" icon={<Link2 size={16} />}>
          <p className="small muted">Você vai entrar com a sua conta Google numa janela do Google e autorizar a leitura (sem poder publicar ou apagar nada).</p>
          <button className="btn primary" style={{ marginTop: 10 }} disabled={busy} onClick={connect}>
            {busy ? "Conectando…" : "Entrar com o Google"}
          </button>
          {err && <div className="banner red small" style={{ marginTop: 10 }}>{err}</div>}
        </Card>
      ) : (
        <>
          <div className="row between wrap">
            <div className="row">
              {channel.thumbnail && <img src={channel.thumbnail} alt="" style={{ width: 44, height: 44, borderRadius: 22 }} />}
              <div>
                <h2>{channel.title}</h2>
                <div className="tiny muted">Dados reais da API do YouTube</div>
              </div>
            </div>
            <div className="row">
              <button className="btn sm" disabled={busy} onClick={connect}>
                <RefreshCw size={14} /> Atualizar
              </button>
              <button className="btn sm ghost" onClick={async () => { await ytDisconnect(); setChannel(null); setVideos([]); }}>
                Desconectar
              </button>
            </div>
          </div>
          <div className="grid g4">
            <Stat label="Inscritos" value={channel.subscribers === null ? "oculto" : channel.subscribers.toLocaleString("pt-BR")} />
            <Stat label="Visualizações totais" value={channel.views.toLocaleString("pt-BR")} />
            <Stat label="Vídeos" value={channel.videos.toLocaleString("pt-BR")} />
            <Stat label="Shorts (até 3 min) nos últimos" value={videos.filter(isShort).length} sub={`de ${videos.length} vídeos lidos`} />
          </div>
          <Card title="O que funciona melhor no seu canal" icon={<BarChart3 size={16} />}>
            {perf.length ? (
              <>
                <div className="scroll-x">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Tipo de clipe</th>
                        <th>Vídeos</th>
                        <th>Mediana de views</th>
                        <th>% assistida</th>
                        <th>Comparado ao canal</th>
                        <th>Peso na nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perf.map((p) => (
                        <tr key={p.category}>
                          <td>{category(p.category).name}</td>
                          <td>{p.videos}</td>
                          <td>{Math.round(p.medianViews).toLocaleString("pt-BR")}</td>
                          <td>{p.avgViewPct === null ? "—" : `${Math.round(p.avgViewPct)}%`}</td>
                          <td className={p.relative >= 1 ? "pos" : "neg"}>{Math.round(p.relative * 100)}%</td>
                          <td>{p.weight === 1 ? (p.videos < 3 ? "poucos vídeos" : "neutro") : `${p.weight > 1 ? "+" : ""}${Math.round((p.weight - 1) * 100)}%`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="row wrap" style={{ marginTop: 12 }}>
                  <button
                    className="btn primary sm"
                    onClick={() => {
                      setSettings({ learned: weightsFrom(perf), useLearned: true });
                      toast("Pesos aplicados: as próximas análises e gerações vão considerar o que funciona no seu canal.");
                    }}
                  >
                    <Sparkles size={14} /> Usar isso nas próximas edições
                  </button>
                  <label className="row small">
                    <input type="checkbox" checked={settings.useLearned} onChange={(e) => setSettings({ useLearned: e.target.checked })} /> Considerar o desempenho do canal na nota
                  </label>
                </div>
                <p className="tiny faint" style={{ marginTop: 8 }}>O tipo de cada vídeo é deduzido do título, das tags e da descrição. Um tipo só muda a nota com 3 vídeos ou mais, e no máximo ±20%.</p>
              </>
            ) : (
              <Empty>Não foi possível agrupar os vídeos por tipo (títulos sem palavras como perseguição, explosão, polícia…).</Empty>
            )}
          </Card>
          <Card title="Vídeos recentes" icon={<BarChart3 size={16} />}>
            <div className="scroll-x">
              <table className="table">
                <thead>
                  <tr>
                    <th>Vídeo</th>
                    <th>Duração</th>
                    <th>Views</th>
                    <th>Curtidas</th>
                    <th>Coment.</th>
                    <th>% assistida</th>
                    <th>Inscritos</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {videos.map((v) => (
                    <tr key={v.id}>
                      <td style={{ maxWidth: 260 }}>
                        {isShort(v) && <span className="tag red">Short</span>} {v.title}
                      </td>
                      <td>{fmtDur(v.durationSec)}</td>
                      <td>{v.views.toLocaleString("pt-BR")}</td>
                      <td>{v.likes.toLocaleString("pt-BR")}</td>
                      <td>{v.comments.toLocaleString("pt-BR")}</td>
                      <td>{v.avgViewPct === null ? "—" : `${Math.round(v.avgViewPct)}%`}</td>
                      <td>{v.subscribersGained ?? "—"}</td>
                      <td>
                        <button
                          className="btn sm"
                          onClick={async () => {
                            try {
                              setRetention({ id: v.id, points: await ytRetention(v.id) });
                            } catch (e) {
                              toast(e instanceof Error ? e.message : String(e), true);
                            }
                          }}
                        >
                          Retenção
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {retention && (
              <div className="item" style={{ marginTop: 12 }}>
                <b className="small">Retenção: {videos.find((v) => v.id === retention.id)?.title}</b>
                {retention.points.length ? (
                  <svg viewBox="0 0 400 120" width="100%" style={{ marginTop: 8 }}>
                    <polyline fill="none" stroke="#ef233c" strokeWidth="2" points={retention.points.map((p) => `${p.x * 400},${120 - Math.min(1.2, p.ratio) * 95}`).join(" ")} />
                    <line x1="0" x2="400" y1={120 - 95} y2={120 - 95} stroke="#3a3a46" strokeDasharray="4 4" />
                  </svg>
                ) : (
                  <p className="tiny muted">O YouTube ainda não tem dados de retenção para este vídeo.</p>
                )}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Publish() {
  const { exports, projects, settings, setSettings, toast } = useApp();
  const [sel, setSel] = useState(exports[0]?.id ?? "");
  const [kit, setKit] = useState<{ title: string; description: string; hashtags: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const rec = exports.find((e) => e.id === sel);
  const clip = rec ? projects.find((p) => p.id === rec.projectId)?.clips.find((c) => c.id === rec.clipId) : undefined;
  const local = () => {
    if (!rec) return;
    const cat = clip ? category(clip.category).name : "Gameplay";
    const tags = ["#GTA6", "#GTA", rec.height > rec.width ? "#Shorts" : "#Gameplay", `#${cat.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "")}`];
    setKit({
      title: rec.title.slice(0, 90),
      description: `${clip?.story ?? rec.title}\n\nGameplay gravada e editada por mim. Qual foi o momento mais absurdo? Comenta aí!\n\n${tags.join(" ")}`,
      hashtags: tags,
    });
  };
  const withClaude = async () => {
    if (!rec) return;
    setBusy(true);
    try {
      setKit(await claudePublishKit({ title: rec.title, story: clip?.story ?? "", categories: clip ? [category(clip.category).name] : [], shorts: rec.height > rec.width, channelNiche: settings.niche }));
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), true);
    } finally {
      setBusy(false);
    }
  };
  const copy = (t: string) => navigator.clipboard?.writeText(t).then(() => toast("Copiado."));
  if (!exports.length) return <Empty>Exporte um clipe primeiro. Depois, aqui você prepara título, descrição e hashtags para publicar.</Empty>;
  return (
    <Card title="Preparar publicação" icon={<Send size={16} />}>
      <div className="grid g2">
        <label className="field">
          Clipe exportado
          <select className="input" value={sel} onChange={(e) => { setSel(e.target.value); setKit(null); }}>
            {exports.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} · {e.width}×{e.height}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Nicho do canal
          <input className="input" value={settings.niche} onChange={(e) => setSettings({ niche: e.target.value })} />
        </label>
      </div>
      <div className="row wrap" style={{ marginTop: 12 }}>
        <button className="btn" onClick={local}>
          Gerar sugestão
        </button>
        <button className="btn primary" disabled={busy || !claudeAvailable()} onClick={withClaude}>
          <Sparkles size={15} /> {busy ? "Escrevendo…" : claudeAvailable() ? "Escrever com Claude" : "Claude não configurado"}
        </button>
      </div>
      {kit && (
        <div className="stack" style={{ marginTop: 14 }}>
          <label className="field">
            Título ({kit.title.length} caracteres)
            <div className="row">
              <input className="input" value={kit.title} onChange={(e) => setKit({ ...kit, title: e.target.value })} />
              <button className="btn sm" onClick={() => copy(kit.title)} aria-label="Copiar título">
                <Copy size={14} />
              </button>
            </div>
          </label>
          <label className="field">
            Descrição
            <textarea className="input" rows={6} value={kit.description} onChange={(e) => setKit({ ...kit, description: e.target.value })} />
          </label>
          <div className="row wrap">
            <button className="btn sm" onClick={() => copy(kit.description)}>
              <Copy size={14} /> Copiar descrição
            </button>
            <span className="small muted">{kit.hashtags.join(" ")}</span>
          </div>
          <p className="tiny faint">Revise antes de publicar: título e descrição precisam corresponder ao que acontece no vídeo.</p>
        </div>
      )}
    </Card>
  );
}
