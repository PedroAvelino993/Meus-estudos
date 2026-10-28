// Configurações: perfil, meta, aparência, transliteração, áudio, dados e limitações declaradas.

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bell, Database, Download, Info, Mic, Moon, Trash2, Upload, Volume2 } from "lucide-react";
import { exportJson, importJson, resetAll, update, useStudent } from "../store";
import { Modal, Seg, Switch, toast } from "../components/ui";
import { Ru } from "../components/ru";
import { canRecognize, canRecord, onVoices, russianVoices, speak } from "../audio/speech";
import type { Settings } from "../core/state";
import { ALL_LESSONS, ALPHABET, CONVERSATIONS, GRAMMAR, LEXICON } from "../content";
import { normalize } from "../core/text";

/** Sugestão de nome em cirílico a partir do nome latino (o estudante pode editar). */
export function nameToCyrillic(name: string): string {
  const s = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const pairs: [string, string][] = [["shch", "щ"], ["sh", "ш"], ["ch", "ч"], ["zh", "ж"], ["kh", "х"], ["ts", "ц"], ["ya", "я"], ["yu", "ю"], ["yo", "ё"], ["lh", "ль"], ["nh", "нь"], ["ph", "ф"], ["qu", "к"], ["gu", "г"], ["x", "кс"]];
  const one: Record<string, string> = { a: "а", b: "б", c: "к", d: "д", e: "е", f: "ф", g: "г", h: "", i: "и", j: "ж", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", q: "к", r: "р", s: "с", t: "т", u: "у", v: "в", w: "в", y: "и", z: "з" };
  let out = "";
  let i = 0;
  outer: while (i < s.length) {
    for (const [k, v] of pairs) {
      if (s.startsWith(k, i)) {
        out += v;
        i += k.length;
        continue outer;
      }
    }
    const ch = s[i];
    out += one[ch] ?? (/\s|-/.test(ch) ? ch : "");
    i++;
  }
  return out.replace(/(^|\s|-)(\S)/g, (_, a: string, b: string) => a + b.toUpperCase());
}

function useVoices() {
  const [list, setList] = useState(russianVoices());
  useEffect(() => onVoices(() => setList(russianVoices())), []);
  return list;
}

export function SettingsPage() {
  const s = useStudent();
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => update((st) => ({ ...st, settings: { ...st.settings, [k]: v } }));
  const voices = useVoices();
  const [confirmReset, setConfirmReset] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const download = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `russky-progresso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="page narrow stack lg">
      <h1>Configurações</h1>

      <section className="card stack">
        <h3>Perfil</h3>
        <div className="field">
          <label htmlFor="nm">Seu nome</label>
          <input id="nm" className="input" value={s.settings.name} onChange={(e) => set("name", e.target.value)} placeholder="Como você se chama?" />
        </div>
        <div className="field">
          <label htmlFor="nmru">Seu nome em cirílico (usado nas conversas)</label>
          <div className="row">
            <input id="nmru" className="input ru" style={{ flex: 1 }} lang="ru" value={s.settings.nameRu} onChange={(e) => set("nameRu", e.target.value)} placeholder="Ex.: Педро" />
            {s.settings.name && normalize(nameToCyrillic(s.settings.name)) !== normalize(s.settings.nameRu) && (
              <button className="btn sm" onClick={() => set("nameRu", nameToCyrillic(s.settings.name))}>
                Sugerir: <Ru text={nameToCyrillic(s.settings.name)} />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="card stack">
        <h3>Meta diária</h3>
        <Seg<string>
          label="Meta diária de XP"
          value={String(s.settings.dailyGoal)}
          onChange={(v) => set("dailyGoal", Number(v))}
          options={[
            { value: "10", label: "10 XP · leve" },
            { value: "30", label: "30 XP · regular" },
            { value: "50", label: "50 XP · sério" },
            { value: "100", label: "100 XP · intenso" },
          ]}
        />
        <p className="small muted" style={{ margin: 0 }}>
          Uma lição curta rende cerca de 80–150 XP. A sequência de dias conta qualquer dia com estudo; a cada 7 dias seguidos você ganha uma proteção que cobre um dia perdido.
        </p>
      </section>

      <section className="card stack">
        <h3>
          <Moon size={18} style={{ verticalAlign: "-3px" }} /> Aparência
        </h3>
        <div className="row between wrap">
          <span>Tema</span>
          <Seg<Settings["theme"]>
            label="Tema"
            value={s.settings.theme}
            onChange={(v) => set("theme", v)}
            options={[
              { value: "system", label: "Sistema" },
              { value: "light", label: "Claro" },
              { value: "dark", label: "Escuro" },
            ]}
          />
        </div>
        <div className="row between wrap">
          <span>Animações</span>
          <Seg<Settings["motion"]>
            label="Animações"
            value={s.settings.motion}
            onChange={(v) => set("motion", v)}
            options={[
              { value: "system", label: "Sistema" },
              { value: "reduce", label: "Reduzidas" },
              { value: "full", label: "Completas" },
            ]}
          />
        </div>
        <div className="row between wrap">
          <div>
            <div>Transliteração</div>
            <div className="xs muted">No automático, ela some quando você termina o alfabeto.</div>
          </div>
          <Seg<Settings["translit"]>
            label="Transliteração"
            value={s.settings.translit}
            onChange={(v) => set("translit", v)}
            options={[
              { value: "auto", label: "Automática" },
              { value: "always", label: "Sempre" },
              { value: "never", label: "Nunca" },
            ]}
          />
        </div>
      </section>

      <section className="card stack">
        <h3>
          <Volume2 size={18} style={{ verticalAlign: "-3px" }} /> Áudio e fala
        </h3>
        {voices.length ? (
          <>
            <div className="notice">
              <Info size={16} />
              <div>
                O áudio usa a síntese de voz do seu aparelho, com {voices.length} voz{voices.length > 1 ? "es" : ""} russa{voices.length > 1 ? "s" : ""}. É uma voz sintética: boa para começar, mas não tem a naturalidade de um falante nativo gravado.
              </div>
            </div>
            <div className="field">
              <label htmlFor="voice">Voz</label>
              <select id="voice" className="input" value={s.settings.voiceURI ?? ""} onChange={(e) => set("voiceURI", e.target.value || null)}>
                <option value="">Automática</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang}){v.localService ? "" : " · online"}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="rate">Velocidade: {Math.round(s.settings.rate * 100)}%</label>
              <input id="rate" type="range" min={0.6} max={1.3} step={0.05} value={s.settings.rate} onChange={(e) => set("rate", Number(e.target.value))} />
            </div>
            <button className="btn" style={{ alignSelf: "flex-start" }} onClick={() => speak("Приве́т! Меня́ зову́т А́ня. Как дела́?")}>
              <Volume2 size={16} /> Testar voz
            </button>
          </>
        ) : (
          <div className="notice warn">
            <AlertTriangle size={16} />
            <div>
              <b>Nenhuma voz russa encontrada neste aparelho.</b> Os exercícios de áudio viram exercícios de leitura até você instalar uma. Como instalar: <b>iPhone</b> — Ajustes › Acessibilidade › Conteúdo Falado › Vozes › Russo; <b>Android</b> — Configurações › Idioma › Saída de texto para fala › instalar dados de voz em russo; <b>Windows</b> — Configurações › Hora e idioma › Fala › Adicionar vozes › Russo; <b>Chrome</b> no computador costuma ter a voz «Google русский» quando está online.
            </div>
          </div>
        )}
        <div className="notice">
          <Mic size={16} />
          <div>
            {canRecognize()
              ? "Reconhecimento de fala disponível: o navegador transcreve o que você diz (no Chrome o áudio é processado pelo Google; no Safari, pela Apple). O app compara a transcrição com a frase esperada — não avalia sotaque em detalhe."
              : canRecord()
                ? "Este navegador não reconhece fala. Nos exercícios de pronúncia você grava a voz e compara de ouvido com o modelo (autoavaliação)."
                : "Este navegador não permite gravar nem reconhecer fala. Os exercícios de pronúncia podem ser pulados sem perder pontos."}
          </div>
        </div>
        <div className="row between">
          <span>Sons de acerto e erro</span>
          <Switch checked={s.settings.sound} onChange={(v) => set("sound", v)} label="Sons de acerto e erro" />
        </div>
      </section>

      <section className="card stack">
        <h3>
          <Bell size={18} style={{ verticalAlign: "-3px" }} /> Lembretes
        </h3>
        <p className="small muted" style={{ margin: 0 }}>
          Lembretes diários por notificação precisam de um servidor de envio, que esta versão não tem — por isso não oferecemos um botão que não funcionaria. Uma alternativa simples: crie um alarme diário no celular com o nome «Russky» e instale o app na tela inicial (Compartilhar › Adicionar à Tela de Início).
        </p>
      </section>

      <section className="card stack">
        <h3>
          <Database size={18} style={{ verticalAlign: "-3px" }} /> Seus dados
        </h3>
        <p className="small muted" style={{ margin: 0 }}>
          O progresso fica salvo só neste navegador, neste aparelho. Não existe sincronização na nuvem nesta versão. Para levar para outro aparelho, exporte e importe o arquivo.
        </p>
        <div className="row wrap">
          <button className="btn" onClick={download}>
            <Download size={16} /> Exportar progresso
          </button>
          <button className="btn" onClick={() => file.current?.click()}>
            <Upload size={16} /> Importar
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const ok = importJson(await f.text());
              toast({ title: ok ? "Progresso importado" : "Arquivo inválido", tone: ok ? "green" : "red", body: ok ? undefined : "Use um arquivo exportado pelo Russky." });
              e.target.value = "";
            }}
          />
          <button className="btn bad" onClick={() => setConfirmReset(true)}>
            <Trash2 size={16} /> Apagar tudo
          </button>
        </div>
      </section>

      <section className="card small muted">
        <b style={{ color: "var(--text)" }}>Sobre o Russky</b>
        <p style={{ margin: "6px 0 0" }}>
          {ALPHABET.length} letras · {ALL_LESSONS.length} lições · {LEXICON.length} palavras e expressões · {GRAMMAR.length} tópicos de gramática · {CONVERSATIONS.length} conversas. Fontes Manrope e PT Serif (licença OFL). Funciona offline depois da primeira visita.
        </p>
      </section>

      {confirmReset && (
        <Modal
          title="Apagar todo o progresso?"
          onClose={() => setConfirmReset(false)}
          footer={
            <>
              <button className="btn" onClick={() => setConfirmReset(false)}>
                Cancelar
              </button>
              <button
                className="btn bad"
                onClick={() => {
                  resetAll();
                  setConfirmReset(false);
                  window.location.hash = "/";
                }}
              >
                Apagar
              </button>
            </>
          }
        >
          <p>Lições, palavras, revisões, conquistas e conversas serão apagadas deste aparelho. Isso não pode ser desfeito — exporte antes, se quiser guardar.</p>
        </Modal>
      )}
    </div>
  );
}
