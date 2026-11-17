// Configurações: IA, chaves de API (com instruções), armazenamento e compatibilidade.

import { useEffect, useState } from "react";
import { Brain, Bug, Copy, Cpu, ExternalLink, Feather, HardDrive, KeyRound, Trash2, Youtube } from "lucide-react";
import { clearErrorLog, deviceSummary, errorLog, lowMemory } from "../media/device";
import { MODE_LABEL, preferredDecode, resetDecodePreference } from "../media/frames";
import { CANDIDATES, forgetPlan, storedPlanInfo } from "../media/compat";
import { WHISPER_MODELS } from "../media/ai";
import { capabilities, type Capabilities } from "../media/probe";
import { claudeAvailable, claudeKey, setClaudeKey, testClaude } from "../media/claude";
import { setYtClientId, ytClientId } from "../media/youtube";
import { db, requestPersistence, storageEstimate } from "../media/db";
import { LANGUAGES } from "../core/captions";
import { fmtBytes } from "../core/format";
import { useApp } from "../ui/store";
import { Bar, Card, Head } from "../ui/kit";

export default function Settings() {
  const { settings, setSettings, exports, projects, reload, toast } = useApp();
  const [caps, setCaps] = useState<Capabilities | null>(null);
  const [key, setKey] = useState(claudeKey());
  const [clientId, setClientId] = useState(ytClientId());
  const [testing, setTesting] = useState(false);
  const [storage, setStorage] = useState<{ usage: number; quota: number; persisted: boolean } | null>(null);
  const [device, setDevice] = useState(localStorage.getItem("gca:device") ?? "auto");
  const [safe, setSafe] = useState(localStorage.getItem("gca:safe") === "1");
  const [errors, setErrors] = useState(errorLog);
  const [decodeMode, setDecodeMode] = useState(preferredDecode);
  const [planInfo, setPlanInfo] = useState(storedPlanInfo);
  useEffect(() => {
    capabilities().then(setCaps);
    storageEstimate().then(setStorage);
  }, [exports.length]);
  const origin = typeof location !== "undefined" ? location.origin : "";

  return (
    <div className="stack">
      <Head title="Configurações" text="Tudo fica salvo só neste navegador. Chaves de API nunca são enviadas para outro lugar além do serviço correspondente." />
      <div className="grid g2">
        <Card title="Inteligência artificial no aparelho" icon={<Brain size={16} />}>
          <div className="stack small">
            <label className="row">
              <input type="checkbox" checked={settings.useVision} onChange={(e) => setSettings({ useVision: e.target.checked })} /> Usar a IA de visão (CLIP) na análise
            </label>
            <label className="field">
              Processador da IA
              <select
                className="input"
                value={device}
                onChange={(e) => {
                  setDevice(e.target.value);
                  if (e.target.value === "auto") localStorage.removeItem("gca:device");
                  else localStorage.setItem("gca:device", e.target.value);
                  toast("Vale a partir da próxima vez que o app abrir.");
                }}
              >
                <option value="auto">Automático (placa de vídeo no computador, processador no celular)</option>
                <option value="webgpu">Placa de vídeo sempre que houver (mais rápido, mais memória)</option>
                <option value="wasm">Sempre o processador (mais compatível, menos memória)</option>
              </select>
            </label>
            <label className="row small">
              <input type="checkbox" checked={settings.autoCaptions} onChange={(e) => setSettings({ autoCaptions: e.target.checked })} /> Criar as legendas sozinho ao exportar (quando o clipe ainda não tem)
            </label>
            <label className="field">
              Modelo de fala (legendas)
              <select className="input" value={settings.whisperModel} onChange={(e) => setSettings({ whisperModel: e.target.value })}>
                {WHISPER_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Idioma falado nas gravações
              <select className="input" value={settings.spoken} onChange={(e) => setSettings({ spoken: e.target.value })}>
                <option value="auto">Detectar automaticamente</option>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="tiny faint">Os modelos (Transformers.js) são baixados do Hugging Face na primeira vez e ficam no cache do navegador. Tradução local: NLLB-200 (~600 MB, baixa só se usar).</p>
          </div>
        </Card>

        <Card title="Claude (opcional)" icon={<KeyRound size={16} />}>
          <div className="stack small">
            <p className="muted">Com uma chave da API da Anthropic, o app usa o Claude para corrigir e traduzir legendas com mais qualidade, escrever títulos e descrições e consultar os requisitos atuais do YouTube. É pago por uso, direto na sua conta da Anthropic; sem chave, tudo continua funcionando com a IA local.</p>
            <ol className="tiny muted" style={{ paddingLeft: 18, margin: 0 }}>
              <li>
                Crie uma conta em{" "}
                <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">
                  console.anthropic.com
                </a>
                .
              </li>
              <li>Em Billing, adicione créditos.</li>
              <li>Em API Keys, crie uma chave e cole aqui.</li>
            </ol>
            <input className="input" type="password" placeholder="sk-ant-…" value={key} onChange={(e) => setKey(e.target.value)} />
            <div className="row wrap">
              <button
                className="btn primary sm"
                onClick={() => {
                  setClaudeKey(key);
                  toast(key ? "Chave salva neste navegador." : "Chave removida.");
                }}
              >
                Salvar
              </button>
              <button
                className="btn sm"
                disabled={!claudeAvailable() || testing}
                onClick={async () => {
                  setTesting(true);
                  try {
                    await testClaude();
                    toast("Claude respondeu: a chave funciona.");
                  } catch (e) {
                    toast(`A chave não funcionou: ${e instanceof Error ? e.message : e}`, true);
                  } finally {
                    setTesting(false);
                  }
                }}
              >
                {testing ? "Testando…" : "Testar"}
              </button>
            </div>
            <p className="tiny faint">A chave fica só neste navegador. Não use em computadores compartilhados.</p>
          </div>
        </Card>

        <Card title="API do YouTube (análise do canal)" icon={<Youtube size={16} />}>
          <div className="stack small">
            <p className="muted">Para ler as estatísticas do seu canal, crie uma credencial gratuita do Google (só leitura):</p>
            <ol className="tiny muted" style={{ paddingLeft: 18, margin: 0 }}>
              <li>
                Abra o{" "}
                <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer">
                  Google Cloud Console
                </a>{" "}
                e crie um projeto.
              </li>
              <li>Em «APIs e serviços → Biblioteca», ative a YouTube Data API v3 e a YouTube Analytics API.</li>
              <li>Em «Tela de consentimento OAuth», escolha Externo e adicione o seu e-mail como usuário de teste.</li>
              <li>
                Em «Credenciais → Criar credenciais → ID do cliente OAuth», escolha Aplicativo da Web e adicione a origem JavaScript autorizada: <code>{origin}</code>
              </li>
              <li>Copie o «ID do cliente» e cole abaixo.</li>
            </ol>
            <input className="input" placeholder="xxxxxxxx.apps.googleusercontent.com" value={clientId} onChange={(e) => setClientId(e.target.value)} />
            <button
              className="btn primary sm"
              onClick={() => {
                setYtClientId(clientId);
                toast(clientId ? "Client ID salvo. Conecte o canal em YouTube → Análise do canal." : "Client ID removido.");
              }}
            >
              Salvar
            </button>
            <a className="tiny" href="https://developers.google.com/youtube/v3/getting-started" target="_blank" rel="noreferrer">
              <ExternalLink size={12} /> Documentação oficial da API
            </a>
          </div>
        </Card>

        <Card title="Armazenamento" icon={<HardDrive size={16} />}>
          <div className="stack small">
            {storage && (
              <>
                <div className="row between">
                  <span>
                    {fmtBytes(storage.usage)} de {fmtBytes(storage.quota)}
                  </span>
                  <span className={storage.persisted ? "pos" : "muted"}>{storage.persisted ? "Protegido contra limpeza" : "Pode ser limpo se faltar espaço"}</span>
                </div>
                <Bar value={storage.quota ? storage.usage / storage.quota : 0} />
              </>
            )}
            <label className="row">
              <input type="checkbox" checked={settings.storeSource} onChange={(e) => setSettings({ storeSource: e.target.checked })} /> Guardar cópia dos vídeos originais (para editar depois sem escolher o arquivo de novo)
            </label>
            <div className="row wrap">
              <button
                className="btn sm"
                onClick={async () => {
                  const ok = await requestPersistence();
                  toast(ok ? "O navegador vai proteger os dados do app." : "O navegador não liberou a proteção agora (tente depois de usar mais o app).");
                  setStorage(await storageEstimate());
                }}
              >
                Proteger os dados
              </button>
              <button
                className="btn sm"
                onClick={async () => {
                  if (!confirm("Apagar todos os arquivos MP4 exportados deste aparelho? Os projetos continuam.")) return;
                  for (const e of exports) await db.deleteExport(e.id);
                  await reload();
                  setStorage(await storageEstimate());
                  toast("Exportações apagadas.");
                }}
              >
                <Trash2 size={14} /> Apagar exportações
              </button>
              <button
                className="btn sm"
                onClick={async () => {
                  if (!confirm("Apagar as cópias dos vídeos originais guardadas? Você precisará selecionar os arquivos de novo para exportar.")) return;
                  for (const p of projects) await db.deleteSource(p.id);
                  setStorage(await storageEstimate());
                  toast("Cópias apagadas.");
                }}
              >
                <Trash2 size={14} /> Apagar cópias dos originais
              </button>
            </div>
          </div>
        </Card>

        <Card title="Desempenho e memória" icon={<Feather size={16} />}>
          <div className="stack small">
            <div>
              <div className="muted" style={{ marginBottom: 6 }}>
                Qualidade da exportação
              </div>
              <div className="seg">
                {([1080, 720] as const).map((q) => (
                  <button key={q} className={settings.exportQuality === q ? "on" : ""} onClick={() => setSettings({ exportQuality: q })}>
                    {q === 1080 ? "1080p (recomendado)" : "720p (menos memória)"}
                  </button>
                ))}
              </div>
            </div>
            <label className="row">
              <input
                type="checkbox"
                checked={safe}
                onChange={(e) => {
                  setSafe(e.target.checked);
                  if (e.target.checked) localStorage.setItem("gca:safe", "1");
                  else localStorage.removeItem("gca:safe");
                  toast("Vale a partir da próxima vez que o app abrir.");
                }}
              />
              Modo leve: modelos de IA menores, no processador, e prévia mais simples (para celulares e aparelhos com pouca memória)
            </label>
            <p className="tiny faint">{lowMemory() ? "Este aparelho está usando o modo leve." : "Este aparelho está usando o modo completo."} O app liga o modo leve sozinho se o navegador fechar a página por falta de memória.</p>
          </div>
        </Card>

        <Card title="Diagnóstico" icon={<Bug size={16} />}>
          <div className="stack small">
            <p className="muted">Se algo der errado, os erros ficam registrados aqui (só neste aparelho). Copie e mande para quem dá suporte ao app.</p>
            <div className="row between wrap">
              <span>
                Leitura de vídeo: <b>{MODE_LABEL[decodeMode]}</b>
                {decodeMode !== "hardware" && <span className="tiny muted"> (escolhida depois de uma falha do decodificador)</span>}
              </span>
              {decodeMode !== "hardware" && (
                <button
                  className="btn sm ghost"
                  onClick={() => {
                    resetDecodePreference();
                    setDecodeMode("hardware");
                    toast("Na próxima tarefa o app tenta de novo o decodificador mais rápido.");
                  }}
                >
                  Voltar ao mais rápido
                </button>
              )}
            </div>
            {planInfo && (
              <div className="row between wrap">
                <span>
                  Formato de exportação deste aparelho: <b>{CANDIDATES.find((c) => c.id === planInfo.id)?.label ?? "a definir"}</b>
                </span>
                <button
                  className="btn sm ghost"
                  onClick={() => {
                    forgetPlan();
                    setPlanInfo(null);
                    toast("Na próxima exportação o app testa de novo qual formato este aparelho abre.");
                  }}
                >
                  Testar de novo
                </button>
              </div>
            )}
            {errors.length ? (
              <div className="list" style={{ maxHeight: 240, overflowY: "auto" }}>
                {errors.map((e, i) => (
                  <div key={i} className="item tiny">
                    <b>{new Date(e.at).toLocaleString("pt-BR")} · {e.where}</b>
                    <div>{e.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="tiny faint">Nenhum erro registrado.</p>
            )}
            <div className="row wrap">
              <button
                className="btn sm"
                onClick={() => {
                  const txt = [`GTA Clips AI — diagnóstico (${new Date().toLocaleString("pt-BR")})`, deviceSummary(), `Formato: ${JSON.stringify(planInfo ?? "padrão")} · Leitura de vídeo: ${decodeMode} · Modo leve: ${lowMemory() ? "sim" : "não"} · IA de visão: ${settings.useVision ? "sim" : "não"} · exportação ${settings.exportQuality}p`, caps ? `WebCodecs ${caps.webcodecs} · vídeo ${caps.videoCodec} · áudio ${caps.audioCodec} · WebGPU ${caps.webgpu}` : "", ...errors.map((e) => `${new Date(e.at).toISOString()} [${e.where}] ${e.message}\n${e.stack ?? ""}`)].join("\n");
                  navigator.clipboard?.writeText(txt).then(
                    () => toast("Diagnóstico copiado."),
                    () => toast("Não foi possível copiar.", true),
                  );
                }}
              >
                <Copy size={14} /> Copiar diagnóstico
              </button>
              <button
                className="btn sm ghost"
                onClick={() => {
                  clearErrorLog();
                  setErrors([]);
                }}
              >
                Limpar
              </button>
            </div>
          </div>
        </Card>

        <Card title="Compatibilidade deste navegador" icon={<Cpu size={16} />}>
          {caps ? (
            <div className="list small">
              <div className="row between">
                <span>Processamento de vídeo (WebCodecs)</span>
                <b className={caps.webcodecs ? "pos" : "neg"}>{caps.webcodecs ? "Sim" : "Não"}</b>
              </div>
              <div className="row between">
                <span>Codificador de vídeo para exportar</span>
                <b className={caps.videoCodec ? "pos" : "neg"}>{caps.videoCodec ? caps.videoCodec.toUpperCase() + (caps.videoCodec === "avc" ? " (H.264)" : "") : "Nenhum"}</b>
              </div>
              <div className="row between">
                <span>Codificador de áudio</span>
                <b className={caps.audioCodec ? "pos" : "neg"}>{caps.audioCodec ? caps.audioCodec.toUpperCase() : "Nenhum (MP4 sem som)"}</b>
              </div>
              <div className="row between">
                <span>Placa de vídeo para IA (WebGPU)</span>
                <b className={caps.webgpu ? "pos" : "muted"}>{caps.webgpu ? "Sim" : "Não (usa o processador)"}</b>
              </div>
              <p className="tiny faint">MP4 com H.264 + AAC é o mais compatível com o YouTube; o app usa o melhor que o navegador oferece.</p>
            </div>
          ) : (
            <p className="small muted">Verificando…</p>
          )}
        </Card>
      </div>
    </div>
  );
}
