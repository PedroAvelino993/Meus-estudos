// CENTRAL IMPERIAL: autoridade, Decreto Imperial, direção dramática, jogos internacionais,
// controles do Arena Bets e delegação.

import { useState } from "react";
import { Bot, Crown, Drama, Globe2, HeartHandshake, Settings2, Swords } from "lucide-react";
import { authority } from "../core/events";
import { authorityName, authorityProgress } from "../core/progression";
import { arcIssue, promoteRelation, setArc } from "../core/plans";
import { setChampion } from "../core/rival";
import { improveRules, publishReport, setBetsControls, betsOpen } from "../core/bets";
import { power } from "../core/gladiators";
import { AUTHORITY, MANAGERS, modality } from "../content/world";
import { useGame } from "../ui/game";
import { Bar, Card, Head, Stat, fmt, pct } from "../ui/kit";

export default function Imperial() {
  const { s, act, go } = useGame();
  const auth = authority(s);
  const ap = authorityProgress(s);
  const [hero, setHero] = useState(s.gladiators[0]?.id ?? "");
  const [villain, setVillain] = useState(s.gladiators[1]?.id ?? "");
  const [ra, setRa] = useState(s.gladiators[0]?.id ?? "");
  const [rb, setRb] = useState(s.gladiators[1]?.id ?? "");
  const name = (id: string) => s.gladiators.find((g) => g.id === id)?.name ?? "—";
  const scriptedShare = s.stats.events ? s.stats.scripted / s.stats.events : 0;

  return (
    <div className="stack">
      <Head title="Central Imperial" text="O centro de comando do seu império do entretenimento. Quanto maior a sua autoridade, mais ferramentas: roteiros, arcos de temporada, delegação e controle do mercado de previsões." right={<span className="tag">{authorityName(s)}</span>} />

      <Card title="Níveis de autoridade" icon={<Crown size={16} />}>
        <div className="small" style={{ marginBottom: 8 }}>
          Pontuação {ap.score} (fama + 3× prestígio){ap.next ? ` · próximo nível em ${ap.next}` : " · nível máximo"}
          {ap.next && <Bar value={ap.score} max={ap.next} tone="blue" />}
        </div>
        <div className="grid g3" style={{ gap: 8 }}>
          {AUTHORITY.map((a) => (
            <div key={a.level} className={`item ${auth >= a.level ? "on" : "locked"}`}>
              <b className="small">
                {a.level}. {a.name}
              </b>
              <div className="tiny muted">{a.unlocks}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid g2">
        <Card title="Decreto Imperial — espetáculos roteirizados" icon={<Drama size={16} />}>
          <div className="small col">
            <p className="muted">No planejamento de eventos, escolha «Decreto Imperial» para definir vencedor, reviravolta, atuação surpreendente e a história. O público sabe que é encenação, como um teatro.</p>
            <div className="grid g3" style={{ gap: 8 }}>
              <Stat label="Roteirizados" value={s.stats.scripted} />
              <Stat label="Livres" value={s.stats.free} />
              <Stat label="Autenticidade" value={Math.round(s.authenticity)} />
            </div>
            <div className="faint">
              {pct(scriptedShare)} dos eventos foram roteirizados. Acima de 40%, o público começa a cansar das histórias; competições livres aumentam a autenticidade e o prestígio.
            </div>
            <button className="btn sm" onClick={() => go("eventos")} disabled={auth < 2}>
              {auth < 2 ? "Exige Magnata dos Espetáculos" : "Planejar um espetáculo roteirizado"}
            </button>
          </div>
          <div className="sep" />
          <h4>Arco de temporada</h4>
          {s.arc ? (
            <p className="small" style={{ marginTop: 6 }}>
              Em andamento até a semana {s.arc.until}: <b>{name(s.arc.hero)}</b> (herói) contra <b>{name(s.arc.villain)}</b> (vilão). Roteiros com o herói vencendo ou com o vilão em cena rendem mais satisfação.
            </p>
          ) : (
            <div className="grid g2" style={{ marginTop: 6 }}>
              <label className="field">
                Herói
                <select className="input" value={hero} onChange={(e) => setHero(e.target.value)}>
                  {s.gladiators.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Vilão
                <select className="input" value={villain} onChange={(e) => setVillain(e.target.value)}>
                  {s.gladiators.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn gold span2" disabled={!!arcIssue(s, hero, villain)} onClick={() => act((x) => setArc(x, hero, villain), "Arco de temporada anunciado.")}>
                {arcIssue(s, hero, villain) ?? "Anunciar arco (1.500)"}
              </button>
            </div>
          )}
        </Card>

        <Card title="Direção dramática" icon={<Swords size={16} />}>
          <p className="small muted" style={{ marginBottom: 8 }}>
            Anuncie rivalidades e amizades entre seus gladiadores (800 denários). Nas competições livres o resultado continua sendo decidido na arena — a direção cria a história, não o placar.
          </p>
          <div className="grid g2">
            <label className="field">
              Gladiador A
              <select className="input" value={ra} onChange={(e) => setRa(e.target.value)}>
                {s.gladiators.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Gladiador B
              <select className="input" value={rb} onChange={(e) => setRb(e.target.value)}>
                {s.gladiators.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="row wrap" style={{ marginTop: 10 }}>
            <button className="btn sm gold" disabled={auth < 2 || ra === rb || s.money < 800} onClick={() => act((x) => promoteRelation(x, ra, rb, "rivalidade"), "Rivalidade anunciada.")}>
              <Swords size={14} /> Anunciar rivalidade
            </button>
            <button className="btn sm" disabled={auth < 2 || ra === rb || s.money < 800} onClick={() => act((x) => promoteRelation(x, ra, rb, "amizade"), "Dupla anunciada.")}>
              <HeartHandshake size={14} /> Anunciar amizade
            </button>
          </div>
          {auth < 2 && <p className="tiny faint" style={{ marginTop: 6 }}>Disponível a partir de Magnata dos Espetáculos.</p>}
        </Card>
      </div>

      <div className="grid g2">
        <Card title="Jogos internacionais" icon={<Globe2 size={16} />}>
          {s.international ? (
            <div className="stack small">
              <div>
                <b>{s.international.city}</b>, semana {s.international.week} — {modality(s.international.modality).name}. A Dominus e campeões estrangeiros também competem.
              </div>
              <label className="field">
                Seu campeão
                <select className="input" value={s.international.champion ?? ""} onChange={(e) => act((x) => setChampion(x, e.target.value))}>
                  <option value="">Escolher automaticamente (o mais forte)</option>
                  {s.gladiators.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} — força {power(g, modality(s.international!.modality))}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <p className="small muted">{s.nodes.includes("pre-internacional") ? "Os próximos jogos serão anunciados em breve (a cada 10 semanas)." : "Desbloqueie «Festivais internacionais» na árvore de Prestígio para disputar jogos em outras cidades."}</p>
          )}
          <div className="small faint" style={{ marginTop: 8 }}>
            Histórico: {s.stats.internationalWins} vitória(s) em {s.stats.internationals} participação(ões).
          </div>
        </Card>

        <Card title="Controles do Arena Bets" icon={<Settings2 size={16} />}>
          {!betsOpen(s) ? (
            <p className="small muted">O Arena Bets abre no nível Magnata dos Espetáculos.</p>
          ) : (
            <div className="stack small">
              <label className="field">
                Fichas gratuitas distribuídas por semana: {fmt(s.bets.weeklyChips)}
                <input type="range" min={500} max={20000} step={500} value={s.bets.weeklyChips} onChange={(e) => act((x) => setBetsControls(x, { weeklyChips: Number(e.target.value) }))} />
              </label>
              <label className="field">
                Limite de fichas por previsão: {s.bets.maxChipsPerPick}
                <input type="range" min={10} max={500} step={10} value={s.bets.maxChipsPerPick} onChange={(e) => act((x) => setBetsControls(x, { maxChipsPerPick: Number(e.target.value) }))} />
              </label>
              <div className="row wrap">
                <button className="btn sm" disabled={s.money < 600} onClick={() => act((x) => improveRules(x), "Regras mais claras.")}>
                  Reescrever regras (600) — clareza {Math.round(s.bets.ruleClarity)}
                </button>
                <button className="btn sm" disabled={s.money < 400} onClick={() => act((x) => publishReport(x), "Relatório publicado.")}>
                  Publicar relatório (400) — transparência {Math.round(s.bets.transparency)}
                </button>
              </div>
              <button className="btn sm ghost" onClick={() => go("bets")}>
                Abrir o Painel do Mercado
              </button>
            </div>
          )}
        </Card>
      </div>

      <Card title="Delegação" icon={<Bot size={16} />}>
        <div className="grid g4" style={{ gap: 8 }}>
          {MANAGERS.map((m) => (
            <div key={m.id} className={`item ${s.managers.includes(m.id) ? "on" : "locked"}`}>
              <b className="small">{m.name}</b>
              <div className="tiny muted">{s.managers.includes(m.id) ? (s.automation[m.id] !== false ? "Ativo" : "Pausado") : `Não contratado (autoridade ${m.authority})`}</div>
            </div>
          ))}
        </div>
        <button className="btn sm" style={{ marginTop: 10 }} onClick={() => go("construcao")}>
          Gerenciar em Construção → Pessoal
        </button>
      </Card>
    </div>
  );
}
