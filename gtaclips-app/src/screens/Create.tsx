// Criar clipes: escolher o vídeo, conferir as informações e iniciar a análise.

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Brain, FileVideo, HardDrive, Info, Sparkles, Upload } from "lucide-react";
import type { GenerateSettings, SourceInfo } from "../core/types";
import { capabilities, describeSource, heavyForPhone, probe, type Capabilities } from "../media/probe";
import { CONVERT_TIP, MODE_LABEL, decodeCheck, type DecodeCheck } from "../media/frames";
import { isMobile } from "../media/device";
import { requestPersistence } from "../media/db";
import { fmtBytes, fmtDur } from "../core/format";
import { newProject, useApp } from "../ui/store";
import { Card, Head } from "../ui/kit";
import { GenerateForm } from "./GenerateForm";

export default function Create() {
  const { settings, setSettings, saveProject, startAnalysis, go, toast } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<SourceInfo | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [reading, setReading] = useState(false);
  const [gen, setGen] = useState<GenerateSettings>(settings.defaults);
  const [caps, setCaps] = useState<Capabilities | null>(null);
  // Teste rápido de leitura neste aparelho (começo, meio e fim do vídeo)
  const [check, setCheck] = useState<DecodeCheck | "testando" | null>(null);
  const checking = useRef<Promise<unknown> | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    capabilities().then(setCaps);
  }, []);

  const pick = async (f: File) => {
    setFile(f);
    setInfo(null);
    setErr(null);
    setCheck(null);
    setReading(true);
    try {
      const i = await probe(f);
      setInfo(i);
      if (i.fps < 50 && gen.fps === 60) setGen({ ...gen, fps: 30 });
      setCheck("testando");
      const job = decodeCheck(f, i).then((r) => setCheck(r));
      checking.current = job;
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setReading(false);
    }
  };

  const start = async () => {
    if (!file || !info) return;
    // Não disputa o decodificador com o teste de leitura
    if (checking.current) await checking.current;
    setSettings({ defaults: gen });
    if (settings.storeSource) await requestPersistence();
    const p = newProject(file.name, info, gen);
    await saveProject(p);
    startAnalysis(p, file);
    toast("Análise iniciada. Você pode navegar pelo app enquanto ela roda.");
    go("projetos", { projectId: p.id });
  };

  return (
    <div className="stack">
      <Head title="Criar clipes" text="Envie uma gravação longa de gameplay (ex.: 40 minutos de GTA). A IA analisa o vídeo inteiro no seu aparelho, encontra os acontecimentos que prendem a atenção, corta o tempo morto e monta histórias curtas." />
      {caps && !caps.webcodecs && (
        <div className="banner red">
          <AlertTriangle size={18} />
          <span>Este navegador não suporta processamento de vídeo (WebCodecs). Use Chrome, Edge ou Safari atualizados.</span>
        </div>
      )}
      <div
        className={`drop ${over ? "over" : ""}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files[0];
          if (f) pick(f);
        }}
        role="button"
        tabIndex={0}
      >
        <Upload size={38} color="#ef233c" />
        <h2 style={{ marginTop: 10 }}>{file ? file.name : "Toque para escolher o vídeo ou arraste aqui"}</h2>
        <p className="muted small" style={{ marginTop: 6 }}>
          MP4, MOV, MKV ou WebM (H.264, HEVC, VP9 ou AV1, conforme o navegador). O arquivo não sai do seu aparelho.
        </p>
        <input ref={input} type="file" accept="video/*,.mkv,.mov,.mp4,.webm" hidden onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
      </div>
      {reading && <div className="banner small">Lendo as informações do vídeo…</div>}
      {err && (
        <div className="banner red">
          <AlertTriangle size={18} />
          <span>{err}</span>
        </div>
      )}
      {info && (
        <>
          <Card title="Vídeo selecionado" icon={<FileVideo size={16} />}>
            <div className="grid g4" style={{ gap: 8 }}>
              <div className="item small">
                <div className="muted tiny">Duração</div>
                <b>{fmtDur(info.duration)}</b>
              </div>
              <div className="item small">
                <div className="muted tiny">Resolução</div>
                <b>
                  {info.width}×{info.height} · {info.fps} FPS
                </b>
              </div>
              <div className="item small">
                <div className="muted tiny">Formato</div>
                <b>
                  {info.container} · {info.videoCodec.toUpperCase()}
                  {info.audioCodec ? ` + ${info.audioCodec.toUpperCase()}` : " (sem áudio)"}
                </b>
              </div>
              <div className="item small">
                <div className="muted tiny">Tamanho</div>
                <b>{fmtBytes(info.size)}</b>
              </div>
            </div>
            {!info.audioCodec && <p className="tiny muted" style={{ marginTop: 8 }}>Sem áudio decodificável: a análise usa só a imagem e as legendas ficam indisponíveis.</p>}
            <p className="tiny muted" style={{ marginTop: 8 }}>Vídeo: {describeSource(info)}</p>
            {check === "testando" && <div className="banner small" style={{ marginTop: 8 }}>Testando se este aparelho consegue ler o vídeo…</div>}
            {check && check !== "testando" && check.ok && check.mode === "hardware" && <div className="banner small" style={{ marginTop: 8 }}>✓ Este aparelho lê o vídeo normalmente.</div>}
            {check && check !== "testando" && check.ok && check.mode !== "hardware" && (
              <div className="banner amber" style={{ marginTop: 8 }}>
                <AlertTriangle size={18} />
                <span>
                  O decodificador rápido deste aparelho não lê este vídeo; vou usar {MODE_LABEL[check.mode]}. Funciona, mas {check.mode === "element" ? "a exportação fica bem mais lenta (perto do tempo real)" : "fica mais lento"}.
                  {heavyForPhone(info).length > 0 && ` Motivo provável: ${heavyForPhone(info).join(", ")}.`}
                </span>
              </div>
            )}
            {check && check !== "testando" && !check.ok && (
              <div className="banner red" style={{ marginTop: 8 }}>
                <AlertTriangle size={18} />
                <span>{check.error}</span>
              </div>
            )}
            {!check && isMobile() && heavyForPhone(info).length > 0 && (
              <div className="banner amber" style={{ marginTop: 8 }}>
                <AlertTriangle size={18} />
                <span>
                  Vídeo pesado para celular ({heavyForPhone(info).join(", ")}). {CONVERT_TIP}
                </span>
              </div>
            )}
          </Card>
          <Card title="Como dividir o vídeo" icon={<Sparkles size={16} />}>
            <GenerateForm value={gen} onChange={setGen} sourceFps={info.fps} sourceDuration={info.duration} />
            <p className="tiny muted" style={{ marginTop: 10 }}>
              Dá para mudar tudo isso depois da análise sem analisar de novo.
            </p>
          </Card>
          <Card title="Análise" icon={<Brain size={16} />}>
            <div className="col small">
              <label className="row">
                <input type="checkbox" checked={settings.useVision} onChange={(e) => setSettings({ useVision: e.target.checked })} />
                <span>
                  <b>IA de visão (CLIP)</b> — reconhece perseguições, explosões, tiroteios, menus e telas de carregamento em cada quadro. Baixa ~150 MB na primeira vez{caps?.webgpu ? " e usa a placa de vídeo." : "; sem WebGPU fica mais lenta."}
                </span>
              </label>
              <label className="row">
                <input type="checkbox" checked={settings.storeSource} onChange={(e) => setSettings({ storeSource: e.target.checked })} />
                <span>
                  <HardDrive size={13} /> Guardar uma cópia do vídeo neste aparelho ({fmtBytes(info.size)}) para continuar editando depois sem escolher o arquivo de novo.
                </span>
              </label>
              <div className="banner small">
                <Info size={16} />
                <span>Sem a IA de visão, a análise usa só medidas de imagem e som (movimento, fogo, sirenes, volume, telas paradas) — funciona, mas entende menos o contexto.</span>
              </div>
            </div>
            <button className="btn primary lg block" style={{ marginTop: 14 }} onClick={start}>
              <Sparkles size={18} /> {check && check !== "testando" && !check.ok ? "Tentar analisar mesmo assim" : "Analisar e criar clipes"}
            </button>
          </Card>
        </>
      )}
    </div>
  );
}
