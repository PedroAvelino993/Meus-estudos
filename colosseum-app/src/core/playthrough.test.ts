import { describe, expect, it } from "vitest";
import { newGame } from "./state";
import { playWeeks } from "./bot";

describe("campanha completa (bot)", () => {
  for (const seed of [1, 2, 3]) {
    it(`semente ${seed}: progride pelas eras sem falir e chega à vitória`, () => {
      const eras: Record<number, number> = {};
      let s = newGame("Teste", seed);
      s = playWeeks(s, 700, { scripted: seed === 2 }, (x) => {
        if (eras[x.era] === undefined) eras[x.era] = x.week;
      });
      const line = `seed ${seed}: semana ${s.week} era ${s.era} fama ${Math.round(s.fame)} prest ${Math.round(s.prestige)} $ ${Math.round(s.money)} filiais ${s.branches.length} público ${s.stats.spectators} eras ${JSON.stringify(eras)} derrota ${s.defeat?.reason ?? "-"} vitória ${s.victory?.week ?? "-"} rival ${s.rival.defeated ? "vencido" : Math.round(s.rival.fame)} liga ${s.league ? (s.league.defeated ? "vencida" : "ativa") : "-"}`;
      console.log(line);
      expect(s.defeat).toBeNull();
      expect(s.era).toBeGreaterThanOrEqual(5);
      expect(s.victory).not.toBeNull();
    }, 120000);
  }
});
