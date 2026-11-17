// Formulário de geração: quantidade, duração, formato, modo, legendas e enquadramento.

import type { GenerateSettings } from "../core/types";
import { CAPTION_STYLES, LANGUAGES } from "../core/captions";
import { Seg } from "../ui/kit";

const COUNTS = [1, 3, 5, 10];
const DURATIONS = [15, 30, 45, 60, 120, 300];

export function GenerateForm({ value, onChange, sourceFps, sourceDuration }: { value: GenerateSettings; onChange: (v: GenerateSettings) => void; sourceFps?: number; sourceDuration?: number }) {
  const set = (p: Partial<GenerateSettings>) => onChange({ ...value, ...p });
  const fmtD = (d: number) => (d < 60 ? `${d}s` : d % 60 ? `${Math.floor(d / 60)}min ${d % 60}s` : `${d / 60} min`);
  const tooMuch = sourceDuration && value.count * value.duration > sourceDuration * 0.9;
  return (
    <div className="stack">
      <div>
        <h4 style={{ marginBottom: 8 }}>Modo</h4>
        <Seg
          value={value.mode}
          onChange={(mode) => set({ mode })}
          options={[
            { id: "cena", label: "Cena contínua (recomendado)" },
            { id: "historias", label: "Melhores momentos" },
            { id: "continua", label: "Parte 1, 2, 3…" },
          ]}
        />
        <p className="tiny muted" style={{ marginTop: 6 }}>
          {value.mode === "cena"
            ? "Cada clipe é um trecho corrido da cena (sem cortes no meio), começando e terminando em pausas naturais da fala — nunca começa no meio de uma resposta. Os cortes ficam só entre um clipe e outro."
            : value.mode === "historias"
              ? "Junta os melhores acontecimentos de uma mesma história (começo, desenvolvimento e conclusão), cortando o tempo morto no meio."
              : "A gravação vira episódios em sequência. Cada parte termina num momento de tensão real, para o público querer ver a próxima."}
        </p>
      </div>
      <div className="grid g2">
        <div>
          <h4 style={{ marginBottom: 8 }}>{value.mode === "continua" ? "Quantidade de partes" : "Quantidade de clipes"}</h4>
          <div className="chips">
            {COUNTS.map((c) => (
              <button key={c} className={`chip ${value.count === c ? "on" : ""}`} onClick={() => set({ count: c })}>
                {c}
              </button>
            ))}
            <input className="input" style={{ width: 90 }} type="number" min={1} max={50} value={value.count} onChange={(e) => set({ count: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })} aria-label="Quantidade personalizada" />
          </div>
        </div>
        <div>
          <h4 style={{ marginBottom: 8 }}>Duração de cada um</h4>
          <div className="chips">
            {DURATIONS.map((d) => (
              <button key={d} className={`chip ${value.duration === d ? "on" : ""}`} onClick={() => set({ duration: d })}>
                {fmtD(d)}
              </button>
            ))}
            <input className="input" style={{ width: 100 }} type="number" min={5} max={900} value={value.duration} onChange={(e) => set({ duration: Math.max(5, Math.min(900, Number(e.target.value) || 30)) })} aria-label="Duração personalizada em segundos" />
            <span className="tiny muted" style={{ alignSelf: "center" }}>
              segundos
            </span>
          </div>
        </div>
      </div>
      {tooMuch && <div className="banner amber small">Você pediu {value.count} × {fmtD(value.duration)} de um vídeo de {fmtD(Math.round(sourceDuration!))}. Sem repetir trechos e cortando o tempo morto, pode não haver material para tudo — o app avisa quantos clipes conseguiu montar.</div>}
      <div className="grid g3">
        <div>
          <h4 style={{ marginBottom: 8 }}>Formato</h4>
          <Seg
            value={value.format}
            onChange={(format) => set({ format })}
            options={[
              { id: "1:1", label: "1:1 Quadrado" },
              { id: "9:16", label: "9:16 Shorts" },
              { id: "16:9", label: "16:9" },
            ]}
          />
        </div>
        <div>
          <h4 style={{ marginBottom: 8 }}>Enquadramento</h4>
          <select className="input" value={value.reframe} onChange={(e) => set({ reframe: e.target.value as GenerateSettings["reframe"] })}>
            <option value="desfocado">Imagem quase inteira, fundo desfocado (recomendado)</option>
            <option value="acao">Acompanhar a ação (recorte mais fechado)</option>
            <option value="centro">Recorte no centro</option>
          </select>
        </div>
        <div>
          <h4 style={{ marginBottom: 8 }}>Quadros por segundo</h4>
          <Seg
            value={value.fps}
            onChange={(fps) => set({ fps })}
            options={[
              { id: 30, label: "30 FPS" },
              { id: 60, label: sourceFps && sourceFps < 50 ? "60 (vídeo é 30)" : "60 FPS" },
            ]}
          />
        </div>
      </div>
      <div className="grid g3">
        <label className="row small">
          <input type="checkbox" checked={value.captions} onChange={(e) => set({ captions: e.target.checked })} /> Legendas automáticas
        </label>
        <label className="field">
          Idioma das legendas
          <select className="input" value={value.captionLang} onChange={(e) => set({ captionLang: e.target.value })}>
            <option value="orig">Idioma original (o que foi falado)</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Estilo das legendas
          <select className="input" value={value.captionStyle} onChange={(e) => set({ captionStyle: e.target.value as GenerateSettings["captionStyle"] })}>
            {CAPTION_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid g2">
        <label className="row small">
          <input type="checkbox" checked={value.removeSilence} onChange={(e) => set({ removeSilence: e.target.checked })} /> Remover silêncios longos com a imagem parada
        </label>
        <label className="field">
          Contexto antes do acontecimento principal: {value.context}s
          <input type="range" min={0} max={10} value={value.context} onChange={(e) => set({ context: Number(e.target.value) })} />
        </label>
      </div>
    </div>
  );
}
