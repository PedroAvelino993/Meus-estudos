// Árvore de evolução: seis categorias com pré-requisitos e caminhos alternativos.

import { useState } from "react";
import type { TreeCategory } from "../core/types";
import { CATEGORY_LABEL } from "../core/types";
import { TREE } from "../content/tree";
import { useGame } from "../ui/game";
import { TreeGraph } from "../ui/TreeGraph";
import { Head, Seg } from "../ui/kit";

const CATS: TreeCategory[] = ["espetaculos", "infraestrutura", "gladiadores", "marketing", "economia", "prestigio"];

export default function Evolution() {
  const { s, focus } = useGame();
  const [cat, setCat] = useState<TreeCategory>((focus as TreeCategory) && CATS.includes(focus as TreeCategory) ? (focus as TreeCategory) : "espetaculos");
  const nodes = TREE.filter((n) => n.category === cat);
  const owned = nodes.filter((n) => s.nodes.includes(n.id)).length;
  return (
    <div className="stack">
      <Head
        title="Evolução"
        text={`Você tem ${s.ep} pontos de evolução. Eles vêm de eventos, estreias, recordes, contratações famosas, construções, filiais, objetivos e vitórias sobre o rival. Algumas melhorias são escolhas que fecham o caminho alternativo.`}
        right={<span className="tag">{s.nodes.length}/{TREE.length} melhorias</span>}
      />
      <Seg value={cat} onChange={setCat} options={CATS.map((c) => ({ id: c, label: `${CATEGORY_LABEL[c]} ${TREE.filter((n) => n.category === c && s.nodes.includes(n.id)).length}/${TREE.filter((n) => n.category === c).length}` }))} />
      <div className="small muted">
        {owned}/{nodes.length} em {CATEGORY_LABEL[cat]}. A árvore exclusiva do Arena Bets fica na tela do Arena Bets.
      </div>
      <TreeGraph key={cat} nodes={nodes} currency="PE" />
    </div>
  );
}
