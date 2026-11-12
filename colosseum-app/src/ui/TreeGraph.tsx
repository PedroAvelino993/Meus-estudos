// Grafo interativo de uma árvore de evolução (ramos em linhas, níveis em colunas).

import { useMemo, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import type { TreeNode } from "../core/types";
import { CATEGORY_LABEL } from "../core/types";
import { nodeStatus, unlock, unlockIssue } from "../core/tree";
import { node as nodeById } from "../content/tree";
import { useGame } from "./game";

const COL = 196;
const ROW = 92;
const W = 168;

const EFFECT_LABEL: Record<string, string> = {
  demand: "demanda",
  satisfaction: "satisfação",
  priceRef: "preço aceito",
  food: "receita de comida",
  commerce: "receita do comércio",
  sponsor: "patrocínio",
  popGain: "popularidade ganha",
  fameGain: "fama ganha",
  epGain: "pontos de evolução",
  salary: "salários",
  upkeep: "manutenção",
  training: "treino",
  injury: "lesões",
  recovery: "recuperação",
  marketing: "efeito da divulgação",
  prestigeGain: "prestígio ganho",
  rivalResist: "resistência ao rival",
  expansionCost: "custo de expansão",
  capacity: "capacidade",
  gladiatorFame: "fama dos gladiadores",
  favor: "favor imperial",
  staffMorale: "moral dos funcionários",
  betsParticipants: "participantes do Arena Bets",
  betsAccuracy: "precisão do modelo",
  betsCredibility: "credibilidade",
  betsEngagement: "engajamento",
  betsChips: "fichas distribuídas",
  scoutQuality: "qualidade dos olheiros",
  regionDemand: "demanda nas filiais",
};

const ABSOLUTE = new Set(["satisfaction", "recovery", "favor", "staffMorale", "betsCredibility"]);

export function effectList(n: TreeNode): string[] {
  return Object.entries(n.effects ?? {}).map(([k, v]) => {
    const val = v as number;
    const txt = ABSOLUTE.has(k) ? `${val > 0 ? "+" : ""}${val}` : `${val > 0 ? "+" : ""}${Math.round(val * 100)}%`;
    return `${txt} ${EFFECT_LABEL[k] ?? k}`;
  });
}

export function TreeGraph({ nodes, currency }: { nodes: TreeNode[]; currency: "PE" | "pontos do mercado" }) {
  const { s, act } = useGame();
  const [sel, setSel] = useState<string | null>(null);
  const { pos, width, height } = useMemo(() => {
    const branches = [...new Set(nodes.map((n) => n.branch))];
    const pos: Record<string, { x: number; y: number }> = {};
    let y = 0;
    for (const b of branches) {
      const inBranch = nodes.filter((n) => n.branch === b);
      const perTier: Record<number, number> = {};
      let maxStack = 1;
      for (const n of inBranch) {
        const k = perTier[n.tier] ?? 0;
        perTier[n.tier] = k + 1;
        maxStack = Math.max(maxStack, k + 1);
        pos[n.id] = { x: (n.tier - 1) * COL, y: y + k * ROW };
      }
      y += maxStack * ROW + 26;
    }
    const tiers = Math.max(...nodes.map((n) => n.tier));
    return { pos, width: tiers * COL, height: y };
  }, [nodes]);
  const selected = sel ? nodeById(sel) : null;
  const issue = selected ? unlockIssue(s, selected.id) : null;

  return (
    <div className="grid planner">
      <div className="card tree-wrap">
        <div className="tree" style={{ width, height }}>
          <svg className="links" width={width} height={height}>
            {nodes.flatMap((n) =>
              n.requires
                .filter((r) => pos[r])
                .map((r) => {
                  const a = pos[r];
                  const b = pos[n.id];
                  const x1 = a.x + W;
                  const y1 = a.y + 36;
                  const x2 = b.x;
                  const y2 = b.y + 36;
                  const done = s.nodes.includes(r) || s.bets.unlocked.includes(r);
                  return <path key={`${r}-${n.id}`} d={`M${x1} ${y1} C${x1 + 20} ${y1}, ${x2 - 20} ${y2}, ${x2} ${y2}`} stroke={done ? "#d2ab5f" : "#4a3c2d"} strokeWidth="2" fill="none" />;
                }),
            )}
          </svg>
          {nodes.map((n) => {
            const st = nodeStatus(s, n);
            return (
              <button key={n.id} className={`node ${st} ${sel === n.id ? "sel" : ""}`} style={{ left: pos[n.id].x, top: pos[n.id].y }} onClick={() => setSel(n.id)}>
                <b>{n.name}</b>
                <span className="tiny muted">
                  {st === "comprado" ? "✓ Desbloqueado" : st === "excluido" ? "Caminho fechado" : st === "era" ? `Era ${n.era}` : `${n.cost} ${currency === "PE" ? "PE" : "pts"}`}
                  {n.excludes?.length ? " · escolha" : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="planner-side">
        <section className="card gilded">
          {selected ? (
            <div className="stack">
              <div>
                <h3>{selected.name}</h3>
                <div className="tiny muted">
                  {CATEGORY_LABEL[selected.category as keyof typeof CATEGORY_LABEL] ?? selected.branch} · ramo {selected.branch} · nível {selected.tier}
                </div>
              </div>
              <p className="small">{selected.description}</p>
              {effectList(selected).length > 0 && (
                <div className="row wrap" style={{ gap: 4 }}>
                  {effectList(selected).map((e) => (
                    <span key={e} className={`tag ${e.startsWith("-") && !e.includes("manutenção") && !e.includes("salários") && !e.includes("lesões") && !e.includes("custo") ? "red" : "green"}`}>
                      {e}
                    </span>
                  ))}
                </div>
              )}
              {selected.requires.length > 0 && (
                <div className="small">
                  Exige:{" "}
                  {selected.requires.map((r) => (
                    <span key={r} className={s.nodes.includes(r) || s.bets.unlocked.includes(r) ? "pos" : "neg"}>
                      {nodeById(r).name}{" "}
                    </span>
                  ))}
                </div>
              )}
              {selected.excludes?.length ? <div className="small neg">Escolha exclusiva: fecha {selected.excludes.map((x) => nodeById(x).name).join(", ")} para sempre.</div> : null}
              <button className="btn gold block" disabled={!!issue} onClick={() => act((x) => unlock(x, selected.id), `${selected.name} desbloqueado!`)}>
                {issue ? <Lock size={15} /> : <Sparkles size={15} />} {issue ?? `Desbloquear por ${selected.cost} ${currency}`}
              </button>
            </div>
          ) : (
            <p className="small muted">Toque em uma melhoria para ver o que ela faz, o que exige e quanto custa. Linhas douradas mostram caminhos já abertos; contornos verdes, o que já pode ser comprado.</p>
          )}
        </section>
      </div>
    </div>
  );
}
