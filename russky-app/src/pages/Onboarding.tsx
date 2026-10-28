// Primeira abertura: apresentação, nome (com versão em cirílico), meta diária e teste de áudio.

import { useEffect, useState } from "react";
import { ArrowRight, BookA, Check, MessagesSquare, RotateCcw, Volume2 } from "lucide-react";
import { update } from "../store";
import { Logo } from "../components/ui";
import { Portrait } from "../components/Portrait";
import { Ru, useVoice } from "../components/ru";
import { Keyboard } from "../components/Keyboard";
import { speak } from "../audio/speech";
import { nameToCyrillic } from "./Settings";

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [goal, setGoal] = useState(30);
  const [kb, setKb] = useState(false);
  const voice = useVoice();

  useEffect(() => {
    if (name && !kb) setNameRu(nameToCyrillic(name));
  }, [name]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = () => {
    update((s) => ({ ...s, onboarded: true, settings: { ...s.settings, name: name.trim(), nameRu: nameRu.trim(), dailyGoal: goal } }));
    window.location.hash = "/licao/l1-1-1";
  };

  return (
    <div className="lesson">
      <div className="lesson-top" style={{ justifyContent: "center" }}>
        <div className="row" style={{ gap: 6 }}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{ width: 28, height: 6, borderRadius: 3, background: i <= step ? "var(--red)" : "var(--border)" }} />
          ))}
        </div>
      </div>
      <div className="lesson-body">
        <div className="lesson-inner stack lg" key={step} style={{ alignItems: "center", textAlign: "center", paddingTop: 20 }}>
          {step === 0 && (
            <>
              <Logo size={84} />
              <h1>
                Russ<span style={{ color: "var(--red)" }}>ky</span>
              </h1>
              <p className="muted" style={{ maxWidth: 520, fontSize: "1.1rem" }}>
                Russo do zero, em português. Primeiro o alfabeto, depois conversas de verdade com gente de uma cidade russa (fictícia) — e uma revisão que lembra você do que está esquecendo.
              </p>
              <div className="grid three" style={{ width: "100%", textAlign: "left" }}>
                <div className="card tight row">
                  <BookA color="var(--red)" /> <span className="small">33 letras, com sons e armadilhas para brasileiros</span>
                </div>
                <div className="card tight row">
                  <MessagesSquare color="var(--blue)" /> <span className="small">Conversas que entendem respostas diferentes</span>
                </div>
                <div className="card tight row">
                  <RotateCcw color="var(--teal)" /> <span className="small">Revisão espaçada: visto ≠ dominado</span>
                </div>
              </div>
              <div className="row" style={{ gap: 4 }}>
                {["anya", "maksim", "irina", "dmitry", "sofiya"].map((id) => (
                  <Portrait key={id} id={id} size={52} mood="happy" />
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <Portrait id="anya" size={96} mood="happy" bob />
              <h2>Como você se chama?</h2>
              <p className="muted">Os personagens vão chamar você pelo nome — escrito em cirílico.</p>
              <input className="input" style={{ fontSize: "1.2rem", width: "100%", maxWidth: 360 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" aria-label="Seu nome" autoFocus />
              <div className="stack" style={{ width: "100%", maxWidth: 420, alignItems: "center" }}>
                <div className="small muted">Em cirílico:</div>
                <input className="input ru" style={{ fontSize: "1.5rem", width: "100%", maxWidth: 360, textAlign: "center" }} lang="ru" value={nameRu} inputMode={kb ? "none" : "text"} onChange={(e) => setNameRu(e.target.value)} aria-label="Seu nome em cirílico" />
                <button className="btn ghost sm" onClick={() => setKb((v) => !v)}>
                  {kb ? "Fechar teclado russo" : "Ajustar com o teclado russo"}
                </button>
                {kb && <Keyboard value={nameRu} onChange={setNameRu} />}
                {nameRu && (
                  <div className="card tight">
                    <Ru text={`Приве́т, ${nameRu}!`} className="teach-word" />
                  </div>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Quanto tempo por dia?</h2>
              <p className="muted">Pouco todo dia vale mais que muito de vez em quando. Dá para mudar depois.</p>
              <div className="options" style={{ width: "100%", maxWidth: 420 }}>
                {[
                  [10, "Leve", "uns 5 minutos"],
                  [30, "Regular", "uns 10–15 minutos"],
                  [50, "Sério", "uns 20 minutos"],
                  [100, "Intenso", "30 minutos ou mais"],
                ].map(([v, l, d]) => (
                  <button key={v} className={`option ${goal === v ? "selected" : ""}`} onClick={() => setGoal(v as number)}>
                    <div style={{ textAlign: "left", flex: 1 }}>
                      <b>{l}</b> <span className="muted small">· {v} XP por dia · {d}</span>
                    </div>
                    {goal === v && <Check size={18} />}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="stat-icon" style={{ width: 80, height: 80, borderRadius: 24, background: "var(--teal-soft)", color: "var(--teal)" }}>
                <Volume2 size={40} />
              </div>
              <h2>Vamos testar o áudio</h2>
              {voice ? (
                <>
                  <p className="muted">O app usa a voz russa instalada no seu aparelho.</p>
                  <button className="btn lg" onClick={() => speak("Приве́т! Добро́ пожа́ловать!")}>
                    <Volume2 size={20} /> Ouvir «Привет!»
                  </button>
                </>
              ) : (
                <p className="muted" style={{ maxWidth: 480 }}>
                  Não encontramos uma voz russa neste aparelho. Tudo funciona mesmo assim — os exercícios de áudio viram leitura. Em Configurações › Áudio há instruções para instalar a voz.
                </p>
              )}
            </>
          )}
        </div>
      </div>
      <div className="lesson-foot">
        <div className="foot-inner">
          {step > 0 && (
            <button className="btn ghost" onClick={() => setStep(step - 1)}>
              Voltar
            </button>
          )}
          <div className="foot-actions">
            {step < 3 ? (
              <button className="btn lg primary" onClick={() => setStep(step + 1)} disabled={step === 1 && !nameRu.trim()}>
                {step === 0 ? "Começar" : "Continuar"} <ArrowRight size={18} />
              </button>
            ) : (
              <button className="btn lg primary" onClick={finish}>
                Ir para a primeira lição <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
