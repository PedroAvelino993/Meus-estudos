// Ferramenta de diagnóstico (só roda com DIAG=1): imprime a campanha do bot e grava um salvamento.
declare const process: { env: Record<string, string | undefined> };
import { it } from "vitest";
import { newGame } from "./state";
import { playWeeks } from "./bot";
import { weeklyExpenses } from "./economy";
import { victoryGoals } from "./progression";

it.runIf(process.env.DIAG === "1")("diag", async () => {
  const seeds = (process.env.SEEDS ?? "1,2").split(",").map(Number);
  const every = Number(process.env.EVERY ?? 1);
  for (const seed of seeds) {
    let s = newGame("Coliseu do Tibre", seed);
    s = playWeeks(s, Number(process.env.W ?? 40), {}, (x) => {
      if (x.week % 50 === 0) console.log(`s${seed} goals ` + victoryGoals(x).map((g) => `${g.id}:${g.have}/${g.need}`).join(" "));
      if ((x.week - 1) % every) return;
      const r = x.lastSummary!.reports.map((r) => `${r.modality}@${r.venue} ${r.attendance}/${r.capacity} s${r.satisfaction} $${r.profit}`).join(" | ");
      console.log(`s${seed} w${x.week - 1} e${x.era} $${Math.round(x.money)} fame${Math.round(x.fame)} pop${x.popularity} pre${Math.round(x.prestige)} ep${x.ep} exp${weeklyExpenses(x).reduce((a, e) => a + e.amount, 0)} rv${Math.round(x.rival.fame)}/${x.rival.regions.roma ?? 0} ${x.defeat?.reason ?? ""} :: ${r}`);
    });
    if (process.env.OUT) {
      // @ts-ignore módulo do Node só no diagnóstico
      const fs = await import("node:fs");
      fs.writeFileSync(`${process.env.OUT}/save-${seed}.json`, JSON.stringify(s));
    }
  }
}, 600000);
