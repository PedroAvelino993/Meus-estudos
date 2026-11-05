// Apps do celular: Central de Investigação, Loja, Perfil (habilidades, estatísticas, conquistas) e Ajustes.

import { useState } from "react";
import { Briefcase, Check, Coffee, CreditCard, Download, FileText, Flower2, Lock, LogOut, Package, Palette, Save, Shirt, Trash2, Upload, X } from "lucide-react";
import Portrait from "../components/Portrait";
import { BRANCHES, ITEMS, MISSIONS, PERKS, item, mission } from "../content";
import { CASES, CHAPTERS, ENDINGS, SECURITY_TIPS } from "../content/story";
import { ACHIEVEMENTS } from "../core/achievements";
import { buy, caseAvailable, equip, itemLocked, levelOf, missionDone, perkAvailable, perkPoints, repTier, shopPrice, solveCase, takePerk, useConsumable, visibleMessages } from "../core/game";
import { EVENTS } from "../content/story";
import { TACTIC_LABEL, type Tactic } from "../core/types";
import { exportSave, importSave, removeSlot } from "../store";
import { ACH_ICONS, Bar, fmt, sfx, useGame } from "../ui";
import { playerLook } from "../screens/Home";
import { PhoneHeader } from "./Phone";

// ---------- Investigação ----------

export function Investigation({ back }: { back: () => void }) {
  const { s, act, toast, prefs } = useGame();
  const [tab, setTab] = useState<"casos" | "alertas" | "cartoes">("casos");
  const [open, setOpen] = useState<string | null>(null);
  const [marked, setMarked] = useState<string[]>([]);
  const [ans, setAns] = useState<number | null>(null);
  const [checked, setChecked] = useState<null | { score: number; passed: boolean }>(null);

  if (open) {
    const c = CASES.find((x) => x.id === open)!;
    const done = s.cases[c.id]?.done;
    const reveal = !!checked || done;
    return (
      <div>
        <PhoneHeader
          title={c.title}
          back={() => {
            setOpen(null);
            setChecked(null);
          }}
        />
        <p className="small muted">{c.summary}</p>
        <p className="tiny gold" style={{ margin: "8px 0" }}>
          {c.instructions}
        </p>
        <div className="col">
          {c.items.map((it) => {
            const on = marked.includes(it.id);
            const right = on === it.suspicious;
            return (
              <button
                key={it.id}
                className={`case-item ${on ? "marked" : ""} ${reveal ? (right ? "right" : "wrong") : ""}`}
                disabled={reveal}
                onClick={() => setMarked((m) => (on ? m.filter((x) => x !== it.id) : [...m, it.id]))}
                aria-pressed={on}
              >
                <span className="checkbox">{on && <X size={13} />}</span>
                <span className="grow">
                  <b className="small">{it.title}</b>
                  <span className="tiny muted" style={{ display: "block" }}>
                    {it.detail}
                  </span>
                  {reveal && (
                    <span className={`tiny ${right ? "green" : "red"}`} style={{ display: "block", marginTop: 4 }}>
                      {it.suspicious ? "Suspeito. " : "Normal. "}
                      {it.why}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <b className="small" style={{ display: "block", margin: "14px 0 8px" }}>
          {c.question.q}
        </b>
        <div className="col">
          {c.question.options.map((o, i) => (
            <button key={i} className={`radio-opt ${ans === i ? "on" : ""}`} disabled={reveal} onClick={() => setAns(i)}>
              <span className="checkbox">{ans === i && <Check size={13} />}</span>
              <span className="small">{o}</span>
            </button>
          ))}
        </div>
        {reveal && <p className="small muted" style={{ marginTop: 10 }}>{c.question.explain}</p>}
        {checked && !checked.passed && (
          <>
            <p className="small red" style={{ marginTop: 8 }}>
              Ainda não fecha: {Math.round(checked.score * 100)}% das marcações corretas{ans !== c.question.answer ? " e a conclusão não é essa" : ""}. Revise e tente de novo.
            </p>
            <button
              className="btn block"
              style={{ marginTop: 8 }}
              onClick={() => {
                setChecked(null);
              }}
            >
              Revisar
            </button>
          </>
        )}
        {checked?.passed && <p className="small green" style={{ marginTop: 8 }}>Caso resolvido! +{c.reward.xp} XP, +{c.reward.rep} de reputação.</p>}
        {!reveal && (
          <button
            className="btn primary block"
            style={{ marginTop: 14 }}
            disabled={ans === null}
            onClick={() => {
              let res = { score: 0, passed: false };
              act((g) => {
                const r = solveCase(g, c.id, marked, ans ?? -1);
                res = { score: r.score, passed: r.passed };
                return r.state;
              });
              setChecked(res);
              sfx(res.passed ? "level" : "bad", prefs.sound);
              if (res.passed) toast({ text: `Caso resolvido: ${c.title}`, tone: "gold" });
            }}
          >
            Concluir análise
          </button>
        )}
      </div>
    );
  }

  const alerts = visibleMessages(s).filter((m) => m.kind === "alert");
  const zenite = [
    { f: "padrao-zenite", t: "Padrão da pirâmide identificado" },
    { f: "cartas-analisadas", t: "Cartas falsas desmontadas" },
    { f: "mensagens-analisadas", t: "Mensagens falsas catalogadas" },
    { f: "rede-mapeada", t: "Empresas de fachada mapeadas" },
    { f: "contrato-analisado", t: "Contrato da Câmara revisado" },
    { f: "plano-aprovado", t: "Plano Áurea aprovado" },
  ];
  return (
    <div>
      <PhoneHeader title="Central de Investigação" back={back} />
      <div className="tabs">
        <button className={`tab ${tab === "casos" ? "on" : ""}`} onClick={() => setTab("casos")}>
          Casos
        </button>
        <button className={`tab ${tab === "alertas" ? "on" : ""}`} onClick={() => setTab("alertas")}>
          Alertas
        </button>
        <button className={`tab ${tab === "cartoes" ? "on" : ""}`} onClick={() => setTab("cartoes")}>
          Cartões
        </button>
      </div>
      {tab === "casos" && (
        <>
          <div className="card tight" style={{ marginBottom: 10 }}>
            <b className="small">Dossiê Zênite</b>
            {zenite.map((z) => (
              <div key={z.f} className="goal-line tiny">
                <Check size={14} className={s.flags.includes(z.f) ? "green" : "muted"} /> {z.t}
              </div>
            ))}
          </div>
          <div className="list">
            {CASES.map((c) => {
              const ok = caseAvailable(s, c.id);
              const rec = s.cases[c.id];
              return (
                <button
                  key={c.id}
                  className={`list-item ${ok ? "" : "locked"}`}
                  disabled={!ok}
                  onClick={() => {
                    setOpen(c.id);
                    setMarked([]);
                    setAns(null);
                    setChecked(null);
                  }}
                >
                  <FileText size={20} className={rec?.done ? "green" : "gold"} />
                  <div className="grow">
                    <b className="small">{c.title}</b>
                    <div className="tiny muted">{ok ? (rec?.done ? "Resolvido" : rec ? `Tentativa anterior: ${Math.round(rec.score * 100)}%` : "Novo caso") : `Depois de: ${c.requires.map((m) => mission(m).title).join(", ")}`}</div>
                  </div>
                  {!ok && <Lock size={15} className="muted" />}
                  {rec?.done && <Check size={16} className="green" />}
                </button>
              );
            })}
          </div>
        </>
      )}
      {tab === "alertas" && (
        <div className="col">
          {alerts.map((m) => (
            <div key={m.id} className="card tight small">
              <span className="tiny muted">Dia {m.day}</span>
              <p>{m.text}</p>
            </div>
          ))}
          <div className="card tight">
            <b className="small">Guia de segurança</b>
            <ul className="tiny muted" style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {SECURITY_TIPS.map((t) => (
                <li key={t} style={{ marginBottom: 4 }}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {tab === "cartoes" && (
        <div className="col">
          <p className="tiny muted">Cartões e contas citados nas investigações. Todos são fictícios e mascarados: o jogo nunca pede, guarda ou usa dados reais.</p>
          {[
            { n: "•••• 0000", who: "Zênite Serviços Ltda.", f: "padrao-zenite" },
            { n: "•••• 0000", who: "«Agente pessoal» das cartas", f: "cartas-analisadas" },
            { n: "•••• 0000", who: "Central falsa das mensagens", f: "mensagens-analisadas" },
            { n: "•••• 0000", who: "Áurea Consultoria Estratégica", f: "rede-mapeada" },
          ].map((c, i) => (
            <div key={i} className="shop-item">
              <div className="shop-ico">
                <CreditCard size={20} />
              </div>
              <div className="grow">
                <b className="small fake-card-number">{c.n}</b>
                <div className="tiny muted">{c.who}</div>
              </div>
              <span className={`chip ${s.flags.includes(c.f) ? "red" : ""}`}>{s.flags.includes(c.f) ? "Denunciado" : "Sob análise"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Loja ----------

const KIND_TABS = [
  { k: "outfit", label: "Roupas", icon: Shirt },
  { k: "tool", label: "Ferramentas", icon: Briefcase },
  { k: "consumable", label: "Consumíveis", icon: Coffee },
  { k: "theme", label: "Temas", icon: Palette },
  { k: "mochila", label: "Mochila", icon: Package },
] as const;

function effectText(id: string): string {
  const it = item(id)!;
  const parts: string[] = [];
  const fmtE = (e?: Partial<Record<string, number>>) =>
    Object.entries(e ?? {})
      .map(([k, v]) => `${({ trust: "confiança", interest: "interesse", patience: "paciência", suspicion: "desconfiança", mood: "humor", credibility: "credibilidade", affinity: "afinidade" } as Record<string, string>)[k]} ${(v as number) > 0 ? "+" : ""}${v}`)
      .join(", ");
  if (it.start) parts.push(`Sempre: ${fmtE(it.start)}`);
  if (it.formal) parts.push(`Com gente formal: ${fmtE(it.formal)}`);
  if (it.casual) parts.push(`Com gente informal: ${fmtE(it.casual)}`);
  return parts.join(" · ");
}

export function Shop({ back }: { back: () => void }) {
  const { s, act, toast, prefs } = useGame();
  const [tab, setTab] = useState<(typeof KIND_TABS)[number]["k"]>("outfit");
  const ev = EVENTS.find((e) => e.id === s.event);
  const list = ITEMS.filter((i) => (tab === "tool" ? i.kind === "tool" || i.kind === "pass" : i.kind === tab) && i.price > 0);
  return (
    <div>
      <PhoneHeader title="Loja" back={back} />
      <div className="row between small" style={{ marginBottom: 8 }}>
        <span className="muted">Saldo</span>
        <b className="gold">{fmt(s.money)}</b>
      </div>
      {ev?.shopDiscount ? <p className="tiny green" style={{ marginBottom: 8 }}>{ev.title}: {Math.round(ev.shopDiscount * 100)}% de desconto hoje!</p> : null}
      <div className="tabs">
        {KIND_TABS.map((t) => (
          <button key={t.k} className={`tab ${tab === t.k ? "on" : ""}`} onClick={() => setTab(t.k)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab !== "mochila" ? (
        <div className="col">
          {list.map((it) => {
            const owned = it.kind !== "consumable" && s.items.includes(it.id);
            const lock = itemLocked(s, it.id);
            const price = shopPrice(s, it.id);
            const equipped = s.outfit === it.id || s.theme === it.id;
            const Icon = KIND_TABS.find((k) => k.k === it.kind)?.icon ?? Briefcase;
            return (
              <div key={it.id} className="shop-item">
                {it.theme ? <span className="swatch" style={{ background: `linear-gradient(135deg, ${it.theme.accent}, ${it.theme.bg})` }} /> : <div className="shop-ico">{it.id === "flores" ? <Flower2 size={20} /> : it.id === "dossie" ? <FileText size={20} /> : <Icon size={20} />}</div>}
                <div className="grow">
                  <b className="small">{it.name}</b>
                  <div className="tiny muted">{it.description}</div>
                  {effectText(it.id) && <div className="tiny gold">{effectText(it.id)}</div>}
                  {it.kind === "consumable" && (s.consumables[it.id] ?? 0) > 0 && <div className="tiny green">Você tem {s.consumables[it.id]}</div>}
                </div>
                {lock ? (
                  <span className="chip">
                    <Lock size={11} /> {lock}
                  </span>
                ) : owned ? (
                  it.kind === "outfit" || it.kind === "theme" ? (
                    <button className="btn sm" disabled={equipped} onClick={() => act((g) => equip(g, it.id))}>
                      {equipped ? "Em uso" : "Usar"}
                    </button>
                  ) : (
                    <span className="chip green">
                      <Check size={11} /> Seu
                    </span>
                  )
                ) : (
                  <button
                    className="btn sm primary"
                    disabled={s.money < price}
                    onClick={() => {
                      act((g) => {
                        const n = buy(g, it.id);
                        return it.kind === "outfit" || it.kind === "theme" ? equip(n, it.id) : n;
                      });
                      sfx("coin", prefs.sound);
                      toast({ text: `Comprou: ${it.name}`, tone: "gold" });
                    }}
                  >
                    {fmt(price)}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="col">
          <b className="small">Consumíveis</b>
          {ITEMS.filter((i) => i.kind === "consumable").map((it) => (
            <div key={it.id} className="shop-item">
              <div className="shop-ico">{it.id === "flores" ? <Flower2 size={20} /> : it.id === "dossie" ? <FileText size={20} /> : <Coffee size={20} />}</div>
              <div className="grow">
                <b className="small">
                  {it.name} ×{s.consumables[it.id] ?? 0}
                </b>
                <div className="tiny muted">{it.description}</div>
                {it.id === "dossie" && s.dossie && <div className="tiny green">Ativo para a próxima conversa</div>}
                {it.id === "flores" && s.flowers && <div className="tiny green">Você está levando flores</div>}
              </div>
              <button
                className="btn sm"
                disabled={!(s.consumables[it.id] > 0) || (it.id === "dossie" && s.dossie) || (it.id === "flores" && s.flowers) || (it.id === "cafe" && s.energy >= 100)}
                onClick={() => {
                  act((g) => useConsumable(g, it.id));
                  toast({ text: it.id === "cafe" ? "+30 de energia" : it.id === "dossie" ? "Dossiê pronto para a próxima conversa" : "Flores para a próxima conversa", tone: "green" });
                }}
              >
                Usar
              </button>
            </div>
          ))}
          <b className="small" style={{ marginTop: 8 }}>
            Itens
          </b>
          {s.items.map((id) => {
            const it = item(id);
            return it ? (
              <div key={id} className="list-item small">
                <span className="grow">{it.name}</span>
                {(s.outfit === id || s.theme === id) && <span className="chip gold">Em uso</span>}
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Perfil ----------

const INTEGRITY = (v: number) => (v >= 15 ? "Íntegro" : v >= 5 ? "Confiável" : v > -5 ? "Pragmático" : v > -15 ? "Escorregadio" : "Manipulador");

export function Profile({ back }: { back: () => void }) {
  const { s, act, toast, prefs } = useGame();
  const [tab, setTab] = useState<"skills" | "stats" | "ach" | "story">("skills");
  const lv = levelOf(s.xp);
  const pts = perkPoints(s);
  const tactics = (Object.entries(s.stats.tactics) as [Tactic, number][]).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const tMax = Math.max(1, ...tactics.map((t) => t[1]));
  const doneMissions = MISSIONS.filter((m) => missionDone(s, m.id)).length;
  return (
    <div>
      <PhoneHeader title="Perfil" back={back} />
      <div className="row" style={{ gap: 12 }}>
        <div style={{ width: 70 }}>
          <Portrait look={playerLook(s)} mood="happy" bg="#2a2412" />
        </div>
        <div className="grow">
          <b>{s.player.name}</b>
          <div className="tiny muted">
            Nível {lv.level} · {repTier(s.rep).name}
          </div>
          <Bar value={lv.into} max={lv.need} label="XP" />
          <div className="tiny muted" style={{ marginTop: 3 }}>
            Reputação {s.rep} · Integridade: <span className={s.integrity >= 0 ? "green" : "red"}>{INTEGRITY(s.integrity)}</span>
          </div>
        </div>
      </div>
      <div className="tabs" style={{ marginTop: 12 }}>
        <button className={`tab ${tab === "skills" ? "on" : ""}`} onClick={() => setTab("skills")}>
          Habilidades{pts > 0 ? ` (${pts})` : ""}
        </button>
        <button className={`tab ${tab === "stats" ? "on" : ""}`} onClick={() => setTab("stats")}>
          Números
        </button>
        <button className={`tab ${tab === "ach" ? "on" : ""}`} onClick={() => setTab("ach")}>
          Conquistas
        </button>
        <button className={`tab ${tab === "story" ? "on" : ""}`} onClick={() => setTab("story")}>
          História
        </button>
      </div>

      {tab === "skills" && (
        <div className="perk-tree">
          <p className="tiny muted">
            {pts > 0 ? `Você tem ${pts} ponto(s) para gastar.` : "Ganhe um ponto a cada nível."} Cada ramo tem habilidades que exigem a anterior.
          </p>
          {(Object.keys(BRANCHES) as (keyof typeof BRANCHES)[]).map((b) => (
            <div key={b} className="branch" style={{ ["--bc" as string]: BRANCHES[b].color }}>
              <b className="small" style={{ color: BRANCHES[b].color }}>
                {BRANCHES[b].name}
              </b>
              <div className="tiny muted">{BRANCHES[b].description}</div>
              {PERKS.filter((p) => p.branch === b).map((p) => {
                const owned = s.perks.includes(p.id);
                const can = perkAvailable(s, p.id);
                return (
                  <button
                    key={p.id}
                    className={`perk ${owned ? "owned" : can ? "can" : ""}`}
                    disabled={!can}
                    onClick={() => {
                      act((g) => takePerk(g, p.id));
                      sfx("level", prefs.sound);
                      toast({ text: `Nova habilidade: ${p.name}`, tone: "gold" });
                    }}
                  >
                    <span className="perk-ico">{owned ? <Check size={15} /> : can ? "+" : <Lock size={13} />}</span>
                    <span className="grow">
                      <b className="small">{p.name}</b> <span className="tiny muted">· nível {p.level}</span>
                      <span className="tiny muted" style={{ display: "block" }}>
                        {p.description}
                      </span>
                      {!owned && p.requires && !s.perks.includes(p.requires) && <span className="tiny gold">Requer {PERKS.find((x) => x.id === p.requires)?.name}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {tab === "stats" && (
        <div className="col">
          <div className="stat-row">
            {[
              ["Dias", s.day],
              ["Conversas", s.stats.conversations],
              ["Acordos", s.stats.deals],
              ["Sucessos totais", s.stats.great],
              ["Missões", `${doneMissions}/${MISSIONS.length}`],
              ["Necessidades", s.stats.needsFound],
              ["Pessoas", s.met.length],
              ["Foram embora", s.stats.walkouts],
              ["Blefes", s.stats.liesTold],
              ["Pego mentindo", s.stats.liesCaught],
              ["Km rodados", s.stats.kmTravelled],
              ["Habilidades", s.perks.length],
            ].map(([k, v]) => (
              <div key={k as string} className="stat">
                <span>{k}</span>
                <b>{v}</b>
              </div>
            ))}
          </div>
          <div className="card tight">
            <b className="small">Abordagens que você mais usa</b>
            {tactics.map(([t, n]) => (
              <div key={t} style={{ marginTop: 6 }}>
                <div className="row between tiny">
                  <span>{TACTIC_LABEL[t]}</span>
                  <span>{n}</span>
                </div>
                <Bar value={n} max={tMax} label={TACTIC_LABEL[t]} />
              </div>
            ))}
            {!tactics.length && <p className="tiny muted">Ainda nenhuma conversa.</p>}
          </div>
          <div className="card tight">
            <b className="small">Integridade</b>
            <p className="tiny muted" style={{ marginTop: 4 }}>
              Franqueza e escuta aumentam; blefes, bajulação e pressão diminuem. Ela decide o final da história. Hoje você é visto como <b className={s.integrity >= 0 ? "green" : "red"}>{INTEGRITY(s.integrity)}</b> ({s.integrity}).
            </p>
          </div>
        </div>
      )}

      {tab === "ach" && (
        <div>
          <p className="tiny muted">
            {Object.keys(s.achievements).length} de {ACHIEVEMENTS.length} conquistas
          </p>
          {ACHIEVEMENTS.map((a) => {
            const on = !!s.achievements[a.id];
            const Icon = ACH_ICONS[a.icon] ?? ACH_ICONS.star;
            return (
              <div key={a.id} className={`ach ${on ? "on" : ""}`}>
                <span className="ach-ico">
                  <Icon size={18} />
                </span>
                <div className="grow">
                  <b className="small">{a.secret && !on ? "Conquista secreta" : a.title}</b>
                  <div className="tiny muted">{a.secret && !on ? "Continue jogando para descobrir." : a.description}</div>
                </div>
                {on && <span className="tiny gold">dia {s.achievements[a.id]}</span>}
              </div>
            );
          })}
        </div>
      )}

      {tab === "story" && (
        <div className="col">
          {CHAPTERS.map((c) => (
            <div key={c.n} className={`card tight ${c.n > s.chapter ? "locked" : ""}`} style={{ opacity: c.n > s.chapter ? 0.5 : 1 }}>
              <div className="row between">
                <b className="small">
                  {c.n}. {c.title}
                </b>
                {c.n < s.chapter || (c.n === s.chapter && s.ending) ? <Check size={15} className="green" /> : c.n === s.chapter ? <span className="chip gold">Atual</span> : <Lock size={14} />}
              </div>
              <div className="tiny gold">{c.subtitle}</div>
              {c.n <= s.chapter && <p className="tiny muted" style={{ marginTop: 4 }}>{c.intro}</p>}
            </div>
          ))}
          {s.ending && (
            <div className="card tight gold-edge">
              <b className="small">Final: {ENDINGS.find((e) => e.id === s.ending!.id)?.title}</b>
              <p className="tiny muted" style={{ marginTop: 4 }}>
                {ENDINGS.find((e) => e.id === s.ending!.id)?.text}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Ajustes ----------

export function SettingsApp({ back }: { back: () => void }) {
  const { s, prefs, setPrefs, slot, quit, replaceGame, toast } = useGame();
  const [imp, setImp] = useState("");
  const [msg, setMsg] = useState("");
  const data = exportSave(s);
  return (
    <div>
      <PhoneHeader title="Ajustes" back={back} />
      <div className="card tight">
        <b className="small">Partida</b>
        <p className="tiny muted" style={{ marginTop: 4 }}>
          {s.player.name} · espaço {slot} · dia {s.day}. O jogo salva sozinho a cada ação.
        </p>
        <div className="row wrap" style={{ marginTop: 10 }}>
          <button
            className="btn sm"
            onClick={() => {
              const blob = new Blob([data], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `persuasion-${s.player.name.toLowerCase().replace(/\W+/g, "-")}-dia${s.day}.json`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            <Download size={14} /> Baixar salvamento
          </button>
          <button
            className="btn sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(data);
                toast({ text: "Salvamento copiado", tone: "green" });
              } catch {
                setMsg("Não consegui copiar. Use o botão de baixar.");
              }
            }}
          >
            <Save size={14} /> Copiar texto
          </button>
        </div>
      </div>
      <div className="card tight" style={{ marginTop: 10 }}>
        <b className="small">Importar para este espaço</b>
        <textarea className="input" style={{ width: "100%", marginTop: 6, height: 70 }} value={imp} onChange={(e) => setImp(e.target.value)} placeholder="Cole aqui o texto exportado" aria-label="Salvamento para importar" />
        <button
          className="btn sm"
          style={{ marginTop: 6 }}
          disabled={!imp.trim()}
          onClick={() => {
            const g = importSave(imp.trim());
            if (!g) return setMsg("Esse texto não é um salvamento válido.");
            if (confirm("Substituir a partida atual por esta?")) {
              replaceGame(g);
              setImp("");
              setMsg("Partida importada.");
            }
          }}
        >
          <Upload size={14} /> Importar
        </button>
        {msg && <p className="tiny gold" style={{ marginTop: 6 }}>{msg}</p>}
      </div>
      <div className="card tight" style={{ marginTop: 10 }}>
        <b className="small">Preferências</b>
        {(
          [
            ["sound", "Efeitos sonoros"],
            ["reducedMotion", "Reduzir animações"],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="row between small" style={{ marginTop: 10 }}>
            {label}
            <input type="checkbox" checked={prefs[k]} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} />
          </label>
        ))}
        <label className="row between small" style={{ marginTop: 10 }}>
          Velocidade das falas
          <select className="input" style={{ height: 34 }} value={prefs.textSpeed} onChange={(e) => setPrefs({ ...prefs, textSpeed: e.target.value as "normal" | "rapido" })}>
            <option value="normal">Natural</option>
            <option value="rapido">Instantânea</option>
          </select>
        </label>
      </div>
      <div className="col" style={{ marginTop: 12 }}>
        <button className="btn block" onClick={quit}>
          <LogOut size={16} /> Voltar ao título
        </button>
        <button
          className="btn danger block"
          onClick={() => {
            if (confirm(`Apagar a partida de ${s.player.name}? Isso não pode ser desfeito.`)) {
              removeSlot(slot);
              quit();
            }
          }}
        >
          <Trash2 size={16} /> Apagar esta partida
        </button>
      </div>
      <p className="tiny muted center" style={{ marginTop: 14 }}>
        The Art of Persuasion · economia 100% fictícia
      </p>
    </div>
  );
}
