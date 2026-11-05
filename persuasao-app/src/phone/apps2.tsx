// Apps do celular: Central de Investigação, Loja, Perfil (habilidades, estatísticas, conquistas) e Ajustes.

import { useState } from "react";
import { Briefcase, Check, Coffee, CreditCard, Download, FileText, Flower2, KeyRound, Lock, LogOut, Moon, Package, Palette, Save, Shirt, Trash2, Upload } from "lucide-react";
import Portrait from "../components/Portrait";
import { BRANCHES, ITEMS, MISSIONS, PERKS, item } from "../content";
import { CHAPTERS, ENDINGS } from "../content/story";
import { ACHIEVEMENTS } from "../core/achievements";
import { buy, cashOut, equip, heatFactor, itemLocked, levelOf, lootOptions, missionDone, perkAvailable, perkPoints, shopPrice, takePerk, useConsumable, visibleMessages } from "../core/game";
import { EVENTS } from "../content/story";
import { LOOT_LABEL, TACTIC_LABEL, type Tactic } from "../core/types";
import { exportSave, importSave, removeSlot } from "../store";
import { AI_MODELS, type AiSettings, aiActive, loadAi, saveAi, testKey } from "../ai";
import { ACH_ICONS, Bar, fmt, sfx, useGame } from "../ui";
import { playerLook } from "../screens/Home";
import { PhoneHeader } from "./Phone";

// ---------- Central (butim e radar da polícia) ----------

export function heatLabel(h: number) {
  return h >= 85 ? "A polícia está na porta" : h >= 65 ? "Investigação aberta" : h >= 40 ? "Nome circulando" : h >= 15 ? "Alguns boatos" : "Ninguém sabe de você";
}

export function Investigation({ back }: { back: () => void }) {
  const { s, act, toast, prefs } = useGame();
  const [tab, setTab] = useState<"butim" | "radar" | "esquema">("butim");
  const alerts = visibleMessages(s).filter((m) => m.from === "policia" || m.kind === "alert");
  const esquema = [
    { f: "esquema-zenite", t: "Entrou no esquema do Zênite (Valdir)" },
    { f: "sentinela-cego", t: "Sentinela cego: −10% de calor" },
    { f: "clara-despistada", t: "Jornalista despistada: −10% de calor" },
    { f: "heranca-albernaz", t: "Herança Albernaz no bolso" },
    { f: "diego-derrubado", t: "Diego fora do caminho" },
    { f: "contrato-validado", t: "Papelada da fachada validada" },
    { f: "pagamento-liberado", t: "Primeira assinatura do Fundo (Celina)" },
    { f: "otavio-assinou", t: "Segunda assinatura do Fundo (Otávio)" },
  ];
  return (
    <div>
      <PhoneHeader title="Central" back={back} />
      <div className="card tight" style={{ marginBottom: 10 }}>
        <div className="row between small">
          <b>Calor policial</b>
          <span className={s.heat >= 65 ? "red" : s.heat >= 40 ? "gold" : "green"}>{s.heat}/100</span>
        </div>
        <Bar value={s.heat} tone={s.heat >= 65 ? "red" : s.heat >= 40 ? undefined : "green"} label="Calor policial" />
        <div className="tiny muted" style={{ marginTop: 4 }}>
          {heatLabel(s.heat)} · baixa 12 por noite · prisões: {s.arrests}/3 · cada golpe gera {Math.round(heatFactor(s) * 100)}% do calor normal
        </div>
      </div>
      <div className="tabs">
        <button className={`tab ${tab === "butim" ? "on" : ""}`} onClick={() => setTab("butim")}>
          Butim ({s.loot.length})
        </button>
        <button className={`tab ${tab === "radar" ? "on" : ""}`} onClick={() => setTab("radar")}>
          Radar
        </button>
        <button className={`tab ${tab === "esquema" ? "on" : ""}`} onClick={() => setTab("esquema")}>
          Esquema
        </button>
      </div>
      {tab === "butim" && (
        <div className="col">
          <p className="tiny muted">O que as vítimas entregaram. Tudo fictício: cartões aparecem mascarados e nenhum dado real existe no jogo. Venda ao receptador ou use com a ferramenta certa (rende mais, mas esquenta).</p>
          {s.loot.map((l) => {
            const o = lootOptions(s, l);
            return (
              <div key={l.id} className="shop-item" style={{ alignItems: "flex-start" }}>
                <div className="shop-ico">{l.kind === "cartao" ? <CreditCard size={20} /> : l.kind === "documento" ? <FileText size={20} /> : <KeyRound size={20} />}</div>
                <div className="grow">
                  <b className="small">{LOOT_LABEL[l.kind]}</b>
                  {l.last4 && <span className="fake-card-number tiny"> •••• {l.last4}</span>}
                  <div className="tiny muted">
                    {l.label} · dia {l.day}
                  </div>
                  <div className="tiny gold">Valor de referência: {fmt(l.value)}</div>
                  <div className="row wrap" style={{ marginTop: 6, gap: 6 }}>
                    <button
                      className="btn sm"
                      onClick={() => {
                        act((g) => cashOut(g, l.id, "vender"));
                        sfx("coin", prefs.sound);
                        toast({ text: `Receptador pagou ${fmt(o.sell)}`, tone: "gold" });
                      }}
                    >
                      Vender · {fmt(o.sell)}
                    </button>
                    {o.use && (
                      <button
                        className="btn sm primary"
                        disabled={!o.use.ok}
                        onClick={() => {
                          act((g) => cashOut(g, l.id, "usar"));
                          sfx("coin", prefs.sound);
                          toast({ text: `+${fmt(o.use!.value)} · o calor subiu`, tone: "gold" });
                        }}
                      >
                        {l.kind === "cartao" ? "Clonar e usar" : "Usar acesso"} · {fmt(o.use.value)}
                      </button>
                    )}
                  </div>
                  {o.use && !o.use.ok && <div className="tiny muted" style={{ marginTop: 4 }}>Para usar: {item(o.use.need!)?.name} (Mercado)</div>}
                </div>
              </div>
            );
          })}
          {!s.loot.length && <div className="empty">Nada no butim. Golpes que arrancam dados, cartões e senhas aparecem aqui.</div>}
        </div>
      )}
      {tab === "radar" && (
        <div className="col">
          {alerts.map((m) => (
            <div key={m.id} className="card tight small">
              <span className="tiny muted">Dia {m.day}</span>
              <p>{m.text}</p>
            </div>
          ))}
          {!alerts.length && <div className="empty">Rádio da polícia em silêncio. Por enquanto.</div>}
          <div className="card tight">
            <b className="small">Como esfriar</b>
            <ul className="tiny muted" style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              <li>Cada noite o calor cai 12 pontos.</li>
              <li>«Sumir por um dia» (Mercado) tira 30 de uma vez.</li>
              <li>Chip pré-pago, notebook blindado e rede de laranjas cortam o calor de cada golpe.</li>
              <li>Contradições percebidas e vítimas que vão embora desconfiadas esquentam muito.</li>
              <li>Em 100, a polícia te pega: fiança, butim apreendido e, sem advogado, uma ferramenta perdida. Na terceira vez, é o fim.</li>
            </ul>
          </div>
        </div>
      )}
      {tab === "esquema" && (
        <div className="card tight">
          <b className="small">O caminho até o Fundo Áurea</b>
          {esquema.map((z) => (
            <div key={z.f} className="goal-line tiny">
              <Check size={14} className={s.flags.includes(z.f) ? "green" : "muted"} /> {z.t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Loja ----------

const KIND_TABS = [
  { k: "outfit", label: "Disfarces", icon: Shirt },
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
      <PhoneHeader title="Mercado clandestino" back={back} />
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
                {it.theme ? <span className="swatch" style={{ background: `linear-gradient(135deg, ${it.theme.accent}, ${it.theme.bg})` }} /> : <div className="shop-ico">{it.id === "flores" ? <Flower2 size={20} /> : it.id === "dossie" ? <FileText size={20} /> : it.id === "sumico" ? <Moon size={20} /> : <Icon size={20} />}</div>}
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
              <div className="shop-ico">{it.id === "flores" ? <Flower2 size={20} /> : it.id === "dossie" ? <FileText size={20} /> : it.id === "sumico" ? <Moon size={20} /> : <Coffee size={20} />}</div>
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
                disabled={!(s.consumables[it.id] > 0) || (it.id === "dossie" && s.dossie) || (it.id === "flores" && s.flowers) || (it.id === "cafe" && s.energy >= 100) || (it.id === "sumico" && s.heat === 0)}
                onClick={() => {
                  act((g) => useConsumable(g, it.id));
                  toast({ text: it.id === "cafe" ? "+30 de energia" : it.id === "dossie" ? "Dossiê pronto para a próxima conversa" : it.id === "sumico" ? "−30 de calor" : "Flores para a próxima conversa", tone: "green" });
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
            Nível {lv.level}
          </div>
          <Bar value={lv.into} max={lv.need} label="XP" />
          <div className="tiny muted" style={{ marginTop: 3 }}>
            Fama no submundo {s.rep} · Calor <span className={s.heat >= 65 ? "red" : "green"}>{s.heat}</span> · Prisões {s.arrests}/3
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
              ["Golpes", s.stats.deals],
              ["Perfeitos", s.stats.great],
              ["Alvos", `${doneMissions}/${MISSIONS.length}`],
              ["Pontos fracos", s.stats.needsFound],
              ["Pessoas", s.met.length],
              ["Desconfiaram", s.stats.walkouts],
              ["Blefes", s.stats.liesTold],
              ["Contradições", s.stats.liesCaught],
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
            <b className="small">Ficha policial</b>
            <p className="tiny muted" style={{ marginTop: 4 }}>
              Calor atual {s.heat}/100 · prisões {s.arrests}/3 · {s.stats.liesCaught} contradições percebidas por vítimas.
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
      <AiSettingsCard />
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
        The Art of Persuasion · golpes, contas e cartões 100% fictícios
      </p>
    </div>
  );
}

function AiSettingsCard() {
  const [a, setA] = useState<AiSettings>(loadAi);
  const [status, setStatus] = useState("");
  const [testing, setTesting] = useState(false);
  const update = (n: AiSettings) => {
    setA(n);
    saveAi(n);
  };
  return (
    <div className="card tight" style={{ marginTop: 10 }}>
      <div className="row between">
        <b className="small">IA dos personagens</b>
        <span className={`chip ${aiActive(a) ? "green" : ""}`}>{aiActive(a) ? "ligada" : "desligada"}</span>
      </div>
      <p className="tiny muted" style={{ marginTop: 4 }}>
        Com uma chave da API da Anthropic, cada fala dos personagens é escrita na hora por Claude, reagindo ao que você digitou. Sem chave, o jogo usa as falas prontas. Crie a chave em console.anthropic.com (é cobrada na sua conta por uso). Ela fica salva só neste navegador e não entra no salvamento exportado.
      </p>
      <input
        className="input"
        type="password"
        autoComplete="off"
        style={{ width: "100%", marginTop: 8, height: 40 }}
        placeholder="Chave da API (começa com sk-ant-)"
        value={a.apiKey}
        onChange={(e) => update({ ...a, apiKey: e.target.value })}
        aria-label="Chave da API da Anthropic"
      />
      <label className="row between small" style={{ marginTop: 8 }}>
        Modelo
        <select className="input" style={{ height: 34 }} value={a.model} onChange={(e) => update({ ...a, model: e.target.value })}>
          {AI_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} — {m.note}
            </option>
          ))}
        </select>
      </label>
      <label className="row between small" style={{ marginTop: 8 }}>
        Usar a IA nas conversas
        <input type="checkbox" checked={a.enabled} onChange={(e) => update({ ...a, enabled: e.target.checked })} />
      </label>
      <div className="row wrap" style={{ marginTop: 8 }}>
        <button
          className="btn sm"
          disabled={!a.apiKey.trim() || testing}
          onClick={async () => {
            setTesting(true);
            setStatus("Testando…");
            try {
              const r = await testKey(a);
              setStatus(`Funcionando: «${r}»`);
            } catch (err) {
              setStatus(err instanceof Error ? err.message : "Falhou.");
            } finally {
              setTesting(false);
            }
          }}
        >
          Testar chave
        </button>
        {a.apiKey && (
          <button
            className="btn sm danger"
            onClick={() => {
              update({ ...a, apiKey: "" });
              setStatus("Chave apagada deste navegador.");
            }}
          >
            Apagar chave
          </button>
        )}
      </div>
      {status && <p className="tiny gold" style={{ marginTop: 6 }}>{status}</p>}
    </div>
  );
}
