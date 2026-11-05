// Tela de título, escolha de espaço de salvamento e criação de personagem.

import { useState } from "react";
import { ArrowLeft, Play, Plus, Trash2, Upload } from "lucide-react";
import Portrait from "../components/Portrait";
import { CITY, DISTRICTS } from "../content";
import { type GameState, newGame } from "../core/game";
import { SLOTS, importSave, removeSlot, slotInfo } from "../store";
import { PLAYER_LOOKS, fmt } from "../ui";

interface Props {
  onStart: (s: GameState, slot: number) => void;
  onLoad: (slot: number) => void;
  lastSlot: number | null;
}

function CityBackdrop() {
  return (
    <svg className="title-bg" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {DISTRICTS.map((d) => (
        <path key={d.id} d={d.path} fill={d.color} fillOpacity="0.12" stroke={d.color} strokeOpacity="0.5" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

export default function Title({ onStart, onLoad, lastSlot }: Props) {
  const [mode, setMode] = useState<"menu" | "slots" | "new" | "import">("menu");
  const [slot, setSlot] = useState(1);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(0);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [, refresh] = useState(0);
  const infos = Array.from({ length: SLOTS }, (_, i) => slotInfo(i + 1));
  const firstFree = infos.findIndex((x) => !x) + 1 || 1;

  return (
    <div className="title-screen">
      <CityBackdrop />
      <div className="title-card">
        {mode === "menu" && (
          <>
            <div className="eyebrow">Um jogo de lábia e golpes</div>
            <h1 className="title-logo" style={{ marginTop: 14 }}>
              <em>The Art of</em>Persuasion
            </h1>
            <div className="title-rule" />
            <p className="muted" style={{ maxWidth: 420, margin: "0 auto" }}>
              Você chega a {CITY} com uma mala, {fmt(50)} e uma dívida com um agiota. Sua única ferramenta é a lábia: descubra o ponto fraco de cada pessoa, arranque dados, cartões e dinheiro, compre equipamento melhor e suba até os alvos mais poderosos da cidade — sem deixar a polícia chegar até você.
            </p>
            <div className="title-actions">
              {lastSlot && (
                <button className="btn primary block" onClick={() => onLoad(lastSlot)}>
                  <Play size={18} /> Continuar — {infos[lastSlot - 1]?.name}, dia {infos[lastSlot - 1]?.day}
                </button>
              )}
              <button
                className={`btn block ${lastSlot ? "" : "primary"}`}
                onClick={() => {
                  setSlot(firstFree);
                  setMode("new");
                }}
              >
                <Plus size={18} /> Novo jogo
              </button>
              {infos.some(Boolean) && (
                <button className="btn block" onClick={() => setMode("slots")}>
                  Carregar partida
                </button>
              )}
              <button className="btn ghost block" onClick={() => setMode("import")}>
                <Upload size={16} /> Importar salvamento
              </button>
            </div>
            <p className="tiny muted" style={{ marginTop: 22 }}>
              Ficção: pessoas, empresas, contas e cartões são inventados e aparecem mascarados. O jogo não ensina técnicas reais e não pede nem guarda nenhum dado real.
            </p>
          </>
        )}

        {mode === "slots" && (
          <div className="card" style={{ textAlign: "left" }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <h2>Partidas salvas</h2>
              <button className="icon-btn" onClick={() => setMode("menu")} aria-label="Voltar">
                <ArrowLeft size={18} />
              </button>
            </div>
            <div className="list">
              {infos.map((info, i) => (
                <div key={i} className="list-item slot">
                  <div className="grow">
                    <b>Espaço {i + 1}</b>
                    <div className="small muted">{info ? `${info.name} · dia ${info.day} · capítulo ${info.chapter} · ${fmt(info.money)}` : "Vazio"}</div>
                  </div>
                  {info ? (
                    <>
                      <button className="btn sm primary" onClick={() => onLoad(i + 1)}>
                        Jogar
                      </button>
                      <button
                        className="icon-btn"
                        aria-label={`Apagar espaço ${i + 1}`}
                        onClick={() => {
                          if (confirm(`Apagar a partida de ${info.name}? Isso não pode ser desfeito.`)) {
                            removeSlot(i + 1);
                            refresh((x) => x + 1);
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn sm"
                      onClick={() => {
                        setSlot(i + 1);
                        setMode("new");
                      }}
                    >
                      Novo
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === "new" && (
          <div className="card" style={{ textAlign: "left" }}>
            <div className="row between" style={{ marginBottom: 14 }}>
              <h2>Quem é você?</h2>
              <button className="icon-btn" onClick={() => setMode("menu")} aria-label="Voltar">
                <ArrowLeft size={18} />
              </button>
            </div>
            <div className="field">
              <label htmlFor="nome">Seu nome</label>
              <input id="nome" className="input" maxLength={18} value={name} placeholder="Como as pessoas vão te chamar" onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div className="field" style={{ marginTop: 14 }}>
              <label>Aparência</label>
              <div className="avatar-pick">
                {PLAYER_LOOKS.map((l, i) => (
                  <button key={i} className={`avatar-opt ${avatar === i ? "on" : ""}`} onClick={() => setAvatar(i)} aria-label={`Aparência ${i + 1}`} aria-pressed={avatar === i}>
                    <Portrait look={l} mood={avatar === i ? "happy" : "neutral"} bg="#232b37" />
                  </button>
                ))}
              </div>
            </div>
            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="espaco">Salvar no espaço</label>
              <select id="espaco" className="input" value={slot} onChange={(e) => setSlot(Number(e.target.value))}>
                {infos.map((info, i) => (
                  <option key={i} value={i + 1}>
                    Espaço {i + 1} {info ? `(substitui ${info.name}, dia ${info.day})` : "(vazio)"}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn primary block"
              style={{ marginTop: 18 }}
              disabled={!name.trim()}
              onClick={() => {
                const info = infos[slot - 1];
                if (info && !confirm(`O espaço ${slot} já tem a partida de ${info.name}. Substituir?`)) return;
                onStart(newGame(name, avatar), slot);
              }}
            >
              Chegar a {CITY}
            </button>
          </div>
        )}

        {mode === "import" && (
          <div className="card" style={{ textAlign: "left" }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <h2>Importar salvamento</h2>
              <button className="icon-btn" onClick={() => setMode("menu")} aria-label="Voltar">
                <ArrowLeft size={18} />
              </button>
            </div>
            <p className="small muted" style={{ marginBottom: 10 }}>
              Cole o texto exportado em Ajustes → Exportar, ou escolha o arquivo.
            </p>
            <input
              type="file"
              accept=".json,application/json,text/plain"
              className="small"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setText(await f.text());
              }}
            />
            <textarea className="input" style={{ width: "100%", marginTop: 10 }} value={text} onChange={(e) => setText(e.target.value)} aria-label="Texto do salvamento" />
            {err && <p className="small red" style={{ marginTop: 6 }}>{err}</p>}
            <div className="field" style={{ marginTop: 10 }}>
              <label htmlFor="espaco2">Espaço</label>
              <select id="espaco2" className="input" value={slot} onChange={(e) => setSlot(Number(e.target.value))}>
                {infos.map((info, i) => (
                  <option key={i} value={i + 1}>
                    Espaço {i + 1} {info ? `(substitui ${info.name})` : "(vazio)"}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn primary block"
              style={{ marginTop: 12 }}
              onClick={() => {
                const s = importSave(text.trim());
                if (!s) return setErr("Não reconheci esse salvamento. Confira se copiou o texto inteiro.");
                onStart(s, slot);
              }}
            >
              Importar e jogar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
