// Janela de «Salvar no celular»: mostra o progresso dentro do app, sem abrir outra página,
// e explica onde o vídeo foi parar.

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Share2 } from "lucide-react";
import { Bar, Modal } from "./kit";
import { downloadBlob, readWithProgress } from "../media/files";
import { inAppBrowser, isIOS, logError, openInChromeUrl } from "../media/device";
import { checkPlayback } from "../media/compat";

export interface SaveItem {
  name: string;
  load: () => Promise<Blob | undefined>;
}

type Phase = { kind: "salvando"; index: number; value: number } | { kind: "pronto"; count: number } | { kind: "toque"; index: number } | { kind: "erro"; message: string } | { kind: "app"; name: string };

/** Onde os vídeos baixados aparecem. */
function whereText() {
  if (isIOS()) return "No iPhone, o arquivo vai para o app Arquivos → Downloads. Para mandar ao app Fotos, use «Compartilhar» → «Salvar vídeo».";
  return "Ele está na pasta Download do celular. Na Galeria, abra o álbum «Download» (no Google Fotos: Biblioteca → Download). O aviso de download do navegador também aparece no topo da tela.";
}

export function SaveDialog({ items, onClose, onShare }: { items: SaveItem[]; onClose: () => void; onShare?: () => void }) {
  const app = inAppBrowser();
  const [phase, setPhase] = useState<Phase>(app ? { kind: "app", name: app } : { kind: "salvando", index: 0, value: 0 });
  const blobs = useRef<(Blob | undefined)[]>([]);
  const started = useRef(false);

  const run = async (from: number) => {
    for (let i = from; i < items.length; i++) {
      try {
        const t0 = performance.now();
        setPhase({ kind: "salvando", index: i, value: 0 });
        const b = blobs.current[i] ?? (await items[i].load());
        if (!b) throw new Error("Arquivo não encontrado. Exporte o clipe de novo.");
        blobs.current[i] = b;
        await readWithProgress(b, (v) => setPhase({ kind: "salvando", index: i, value: v }));
        // O navegador só deixa baixar logo depois de um toque: se demorou, pede mais um toque
        if (performance.now() - t0 > 4000 && i === from) {
          setPhase({ kind: "toque", index: i });
          return;
        }
        downloadBlob(b, items[i].name);
        // Um de cada vez: o celular não se perde com vários downloads juntos
        if (i < items.length - 1) await new Promise((r) => setTimeout(r, 1200));
      } catch (e) {
        logError("salvar no celular", e);
        setPhase({ kind: "erro", message: e instanceof Error ? e.message : String(e) });
        return;
      }
    }
    setPhase({ kind: "pronto", count: items.length });
  };

  useEffect(() => {
    if (app || started.current) return;
    started.current = true;
    void run(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = phase.kind === "pronto" ? "Salvo no celular" : phase.kind === "app" ? "Abra no Chrome para salvar" : items.length > 1 ? `Salvando ${items.length} vídeos` : "Salvando o vídeo";
  return (
    <Modal title={title} onClose={onClose}>
      <div className="stack small">
        {phase.kind === "salvando" && (
          <>
            <div className="row between">
              <span>{items.length > 1 ? `Vídeo ${phase.index + 1} de ${items.length}` : items[0]?.name}</span>
              <b className="num">{Math.round(phase.value * 100)}%</b>
            </div>
            <Bar value={(phase.index + phase.value) / items.length} anim />
            <p className="tiny muted">Não feche o app até terminar.</p>
          </>
        )}
        {phase.kind === "toque" && (
          <>
            <p>O vídeo está pronto. Toque no botão para gravar no celular.</p>
            <button
              className="btn primary block lg"
              onClick={() => {
                const b = blobs.current[phase.index];
                if (b) downloadBlob(b, items[phase.index].name);
                void (async () => {
                  if (phase.index + 1 < items.length) await run(phase.index + 1);
                  else setPhase({ kind: "pronto", count: items.length });
                })();
              }}
            >
              Salvar agora
            </button>
          </>
        )}
        {phase.kind === "pronto" && (
          <>
            <div className="row" style={{ gap: 8 }}>
              <CheckCircle2 size={22} color="#22c55e" />
              <b>{phase.count > 1 ? `${phase.count} vídeos salvos.` : "Vídeo salvo."}</b>
            </div>
            <p className="muted">{whereText()}</p>
            <p className="tiny faint">Se o navegador perguntar se pode baixar vários arquivos, toque em «Permitir». Se o vídeo não aparecer, olhe no app Arquivos/Meus arquivos → Downloads.</p>
            <div className="row wrap">
              {onShare && (
                <button className="btn" onClick={onShare}>
                  <Share2 size={15} /> Compartilhar
                </button>
              )}
              <button className="btn primary" onClick={onClose}>
                Concluir
              </button>
            </div>
          </>
        )}
        {phase.kind === "erro" && (
          <>
            <div className="banner red">{phase.message}</div>
            <button className="btn" onClick={onClose}>
              Fechar
            </button>
          </>
        )}
        {phase.kind === "app" && (
          <InAppHelp
            name={phase.name}
            onTry={() => {
              setPhase({ kind: "salvando", index: 0, value: 0 });
              void run(0);
            }}
          />
        )}
      </div>
    </Modal>
  );
}

// ---------- Compartilhar / Salvar no Fotos (iPhone) ----------
// O iPhone só abre o menu de compartilhar se ele for chamado no mesmo instante do toque, e trava
// (fica girando) ao entregar arquivos guardados no banco do navegador. Por isso: 1) o app prepara
// o vídeo na memória mostrando a porcentagem; 2) o toque no botão abre o menu na hora.

type SharePhase = { kind: "preparando"; value: number } | { kind: "pronto" } | { kind: "abrindo" } | { kind: "feito" } | { kind: "erro"; message: string } | { kind: "app"; name: string };

export function ShareDialog({ item, purpose, onClose }: { item: SaveItem; purpose: "fotos" | "compartilhar"; onClose: () => void }) {
  const app = inAppBrowser();
  const [phase, setPhase] = useState<SharePhase>(app ? { kind: "app", name: app } : { kind: "preparando", value: 0 });
  const file = useRef<File | null>(null);
  const started = useRef(false);

  const prepare = async () => {
    try {
      setPhase({ kind: "preparando", value: 0 });
      const b = await item.load();
      if (!b) throw new Error("Arquivo não encontrado. Exporte o clipe de novo.");
      const parts: Uint8Array[] = [];
      const total = b.size || 1;
      let got = 0;
      const reader = b.stream().getReader();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        parts.push(value);
        got += value.length;
        setPhase({ kind: "preparando", value: Math.min(1, got / total) });
      }
      // Arquivo na memória: o menu do sistema recebe na hora, sem ficar girando
      file.current = new File(parts as BlobPart[], item.name, { type: b.type || "video/mp4" });
      // iPhone: confere se o próprio iPhone consegue abrir o vídeo (senão o menu trava girando)
      if (isIOS() && (await checkPlayback(file.current)) === "ruim") {
        throw new Error("O iPhone não consegue abrir este arquivo (ele foi exportado por uma versão antiga do app). Toque em «Exportar de novo» neste clipe: agora o app testa antes qual formato o seu iPhone abre.");
      }
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (typeof nav.share !== "function" || (nav.canShare && !nav.canShare({ files: [file.current] }))) {
        throw new Error("Este navegador não tem o menu de compartilhar arquivos. Abra o site no Safari (iPhone) ou no Chrome (Android).");
      }
      setPhase({ kind: "pronto" });
    } catch (e) {
      logError("preparar compartilhamento", e);
      setPhase({ kind: "erro", message: e instanceof Error ? e.message : String(e) });
    }
  };

  useEffect(() => {
    if (app || started.current) return;
    started.current = true;
    void prepare();
    return () => {
      file.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = () => {
    const f = file.current;
    if (!f) return;
    if (shareBusy) {
      setPhase({ kind: "erro", message: "O menu de compartilhar anterior ainda está aberto ou travou. Feche o app (ou recarregue a página) e tente de novo." });
      return;
    }
    shareBusy = true;
    setPhase({ kind: "abrindo" });
    // Chamado direto no toque (sem esperar nada antes), como o iPhone exige
    navigator
      .share({ files: [f] })
      .then(() => setPhase({ kind: "feito" }))
      .finally(() => {
        shareBusy = false;
      })
      .catch((e) => {
        const n = e instanceof DOMException ? e.name : "";
        if (n === "AbortError") setPhase({ kind: "pronto" });
        else if (n === "InvalidStateError") setPhase({ kind: "erro", message: "O menu de compartilhar anterior ainda está aberto ou travou. Feche o app (ou recarregue a página) e tente de novo." });
        else {
          logError("compartilhar", e);
          setPhase({ kind: "erro", message: n === "NotAllowedError" ? "O aparelho recusou o arquivo (pode ser grande demais para este app). Tente «Salvar» e compartilhe pela galeria." : `Não foi possível compartilhar (${e instanceof Error ? e.message : e}).` });
        }
      });
  };

  const fotos = purpose === "fotos";
  const title = phase.kind === "app" ? "Abra no navegador para salvar" : fotos ? "Salvar no app Fotos" : "Compartilhar o vídeo";
  return (
    <Modal title={title} onClose={onClose}>
      <div className="stack small">
        {phase.kind === "preparando" && (
          <>
            <div className="row between">
              <span>Preparando o vídeo…</span>
              <b className="num">{Math.round(phase.value * 100)}%</b>
            </div>
            <Bar value={phase.value} anim />
            <p className="tiny muted">{item.name}</p>
          </>
        )}
        {(phase.kind === "pronto" || phase.kind === "abrindo") && (
          <>
            <div className="row" style={{ gap: 8 }}>
              <CheckCircle2 size={20} color="#22c55e" />
              <b>Vídeo pronto (100%).</b>
            </div>
            <button className="btn primary block lg" onClick={open} disabled={phase.kind === "abrindo"}>
              <Share2 size={18} /> {fotos ? "Salvar no Fotos" : "Compartilhar agora"}
            </button>
            <p className="muted">{fotos ? "No menu que abrir, toque em «Salvar vídeo». O vídeo vai para o app Fotos (galeria)." : "No menu que abrir, escolha WhatsApp, Telegram, Instagram ou «Salvar vídeo»."}</p>
          </>
        )}
        {phase.kind === "feito" && (
          <>
            <div className="row" style={{ gap: 8 }}>
              <CheckCircle2 size={22} color="#22c55e" />
              <b>{fotos ? "Pronto! Confira no app Fotos." : "Enviado!"}</b>
            </div>
            <div className="row wrap">
              <button className="btn" onClick={() => setPhase({ kind: "pronto" })}>
                <Share2 size={15} /> {fotos ? "Compartilhar também" : "Compartilhar de novo"}
              </button>
              <button className="btn primary" onClick={onClose}>
                Concluir
              </button>
            </div>
          </>
        )}
        {phase.kind === "erro" && (
          <>
            <div className="banner red">{phase.message}</div>
            <div className="row wrap">
              {file.current && (
                <button className="btn" onClick={() => setPhase({ kind: "pronto" })}>
                  Tentar de novo
                </button>
              )}
              <button className="btn" onClick={onClose}>
                Fechar
              </button>
            </div>
          </>
        )}
        {phase.kind === "app" && <InAppHelp name={phase.name} onTry={() => void prepare()} />}
      </div>
    </Modal>
  );
}

let shareBusy = false;

function InAppHelp({ name, onTry }: { name: string; onTry: () => void }) {
  const android = /Android/i.test(navigator.userAgent);
  return (
    <>
      <p>
        Você abriu o site pelo navegador de dentro do <b>{name}</b>. Ele não deixa salvar nem compartilhar vídeos — é por isso que abre outra página e nada acontece.
      </p>
      <p className="muted">{android ? `Abra no Chrome: toque nos três pontinhos ⋮ do ${name} e escolha «Abrir no navegador», ou use o botão abaixo.` : `Abra no Safari: toque no ícone da bússola ou em ⋯ e escolha «Abrir no Safari».`}</p>
      <div className="row wrap">
        {android && (
          <a className="btn primary" href={openInChromeUrl()}>
            <ExternalLink size={15} /> Abrir no Chrome
          </a>
        )}
        <button className="btn" onClick={() => navigator.clipboard?.writeText(location.href).catch(() => undefined)}>
          Copiar endereço do site
        </button>
        <button className="btn ghost" onClick={onTry}>
          Tentar mesmo assim
        </button>
      </div>
      <p className="tiny faint">Atenção: projetos e vídeos ficam guardados em cada navegador separadamente. No outro navegador, selecione o vídeo e exporte de novo.</p>
    </>
  );
}
