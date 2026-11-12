// Ajustes: salvamentos, exportar/importar, tutorial e sobre o jogo.

import { useState } from "react";
import { Download, Info, LogOut, Save, Upload } from "lucide-react";
import { erase, exportSave, importSave, save, slots } from "../core/store";
import { useGame } from "../ui/game";
import { Card, Head, money } from "../ui/kit";
import { ERAS } from "../content/world";

export default function Settings() {
  const { s, slot, act, replace, toast, exit } = useGame();
  const [code, setCode] = useState("");
  const [, bump] = useState(0);
  const list = slots();
  return (
    <div className="stack">
      <Head title="Ajustes" text="O jogo salva sozinho a cada ação. Use os espaços para manter campanhas diferentes ou leve a partida para outro aparelho com o código de exportação." />
      <div className="grid g2">
        <Card title="Espaços de salvamento" icon={<Save size={16} />}>
          <div className="list">
            {list.map((x, i) => (
              <div key={i} className={`item ${slot === i + 1 ? "on" : ""}`}>
                <div className="row between wrap">
                  <div>
                    <b>Espaço {i + 1}</b> {slot === i + 1 && <span className="tag">em uso</span>}
                    <div className="small muted">{x ? `${x.name} · semana ${x.week} · Era ${x.era} (${ERAS[x.era - 1]?.name}) · ${money(x.money)}` : "Vazio"}</div>
                  </div>
                  <div className="row">
                    {slot !== i + 1 && (
                      <button
                        className="btn sm"
                        onClick={() => {
                          if (x && !confirm("Substituir a campanha deste espaço por uma cópia da atual?")) return;
                          save(i + 1, s);
                          replace(s, i + 1);
                          toast(`Campanha copiada para o espaço ${i + 1}; agora você joga nele.`);
                        }}
                      >
                        Usar este espaço
                      </button>
                    )}
                    {x && slot !== i + 1 && (
                      <button
                        className="btn sm ghost"
                        onClick={() => {
                          if (!confirm("Apagar este salvamento?")) return;
                          erase(i + 1);
                          bump((n) => n + 1);
                        }}
                      >
                        Apagar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn" style={{ marginTop: 12 }} onClick={exit}>
            <LogOut size={15} /> Voltar ao menu inicial
          </button>
        </Card>
        <Card title="Exportar / importar" icon={<Download size={16} />}>
          <button
            className="btn block"
            onClick={() => {
              const c = exportSave(s);
              setCode(c);
              navigator.clipboard?.writeText(c).then(
                () => toast("Código copiado."),
                () => toast("Copie o código abaixo."),
              );
            }}
          >
            <Download size={15} /> Gerar código da campanha
          </button>
          <textarea className="input" style={{ marginTop: 10, minHeight: 110, fontSize: 11 }} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Cole aqui um código para importar" />
          <button
            className="btn gold block"
            style={{ marginTop: 10 }}
            onClick={() => {
              const imp = importSave(code);
              if (!imp) return toast("Código inválido.", true);
              if (!confirm("Importar substitui a campanha deste espaço. Continuar?")) return;
              replace(imp);
              toast("Campanha importada.");
            }}
          >
            <Upload size={15} /> Importar
          </button>
        </Card>
      </div>
      <Card title="Jogo" icon={<Info size={16} />}>
        <label className="row small">
          <input type="checkbox" checked={!s.tutorialOff} onChange={(e) => act((x) => ({ ...x, tutorialOff: !e.target.checked }))} /> Mostrar o tutorial
        </label>
        <div className="sep" />
        <div className="small muted col">
          <p>COLOSSEUM INC. é uma obra de ficção ambientada numa Roma Antiga imaginária. Combates são esportivos e coreografados; criaturas e casas comerciais são fictícias.</p>
          <p>O Arena Bets usa apenas fichas fictícias e gratuitas. Não existe depósito, saque, pagamento nem conversão em dinheiro. Espetáculos roteirizados (Decreto Imperial) são sempre identificados e nunca recebem mercados de previsão; as competições livres são calculadas pelo motor do jogo de forma independente.</p>
        </div>
      </Card>
    </div>
  );
}
