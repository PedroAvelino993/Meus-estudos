// Janela de «Salvar no celular»: mostra o progresso dentro do app, sem abrir outra página,
// e explica onde o vídeo foi parar.

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Share2 } from "lucide-react";
import { Bar, Modal } from "./kit";
import { downloadBlob, readWithProgress } from "../media/files";
import { inAppBrowser, isIOS, logError, openInChromeUrl } from "../media/device";

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
          <>
            <p>
              Você abriu o site pelo navegador de dentro do <b>{phase.name}</b>. Ele não deixa salvar nem compartilhar vídeos — é por isso que abre outra página e nada acontece.
            </p>
            <p className="muted">Abra no Chrome (ou no navegador do celular): toque nos três pontinhos ⋮ do {phase.name} e escolha «Abrir no navegador», ou use o botão abaixo.</p>
            <div className="row wrap">
              {/Android/i.test(navigator.userAgent) && (
                <a className="btn primary" href={openInChromeUrl()}>
                  <ExternalLink size={15} /> Abrir no Chrome
                </a>
              )}
              <button
                className="btn"
                onClick={() => {
                  navigator.clipboard?.writeText(location.href).catch(() => undefined);
                }}
              >
                Copiar endereço do site
              </button>
              <button
                className="btn ghost"
                onClick={() => {
                  setPhase({ kind: "salvando", index: 0, value: 0 });
                  void run(0);
                }}
              >
                Tentar mesmo assim
              </button>
            </div>
            <p className="tiny faint">Atenção: projetos e vídeos ficam guardados em cada navegador separadamente. No Chrome, selecione o vídeo e exporte de novo.</p>
          </>
        )}
      </div>
    </Modal>
  );
}
