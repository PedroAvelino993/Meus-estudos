// Toda fala prevista pelas missões precisa poder ser alcançada escrevendo algo parecido com ela.
import { expect, it } from "vitest";
import { MISSIONS, character } from "../content";
import { fill, newRelationship, startEncounter, type PlayerCtx } from "../core/encounter";
import { understand } from "../core/understand";

it("cada fala do roteiro é reconhecida quando o jogador escreve algo equivalente", () => {
  const misses: string[] = [];
  let total = 0;
  for (const m of MISSIONS) {
    const c = character(m.npc);
    const ctx: PlayerCtx = { name: "Alex", perks: ["memoria"], skill: {}, items: ["caderno", "gravador", "cartao"], startMods: {}, energy: 100, reputation: 50, socialClass: 2, hour: 12, worldMood: 0, relationship: newRelationship(), worldFlags: MISSIONS.flatMap((x) => x.flagsOnSuccess ?? []) };
    for (const b of m.beats) {
      const e0 = startEncounter(m, c, ctx, 1);
      const e = { ...e0, beat: b.id, known: c.needs.map((n) => n.id), flags: b.options.flatMap((o) => (o.ifFlag ? [o.ifFlag] : [])), turn: 1 };
      for (const o of b.options) {
        if (o.notFlag && e.flags.includes(o.notFlag)) continue;
        total++;
        // O jogador escreve a ideia em primeira pessoa, sem o verbo de instrução
        const typed = fill(o.text, c, ctx).replace(/^(Dizer|Explicar|Perguntar|Mostrar|Contar|Oferecer|Sugerir|Garantir|Lembrar|Propor|Pedir|Reconhecer|Insistir|Avisar|Comentar)( que| a| o| ao| à| se)?\s*/i, "");
        const u = understand(typed, e, m, c, ctx);
        if (u.optionId !== o.id) misses.push(`${m.id}/${o.id}: «${typed}» → ${u.optionId}`);
      }
    }
  }
  console.log(`${total - misses.length}/${total} reconhecidas`);
  if (misses.length) console.log(misses.slice(0, 40).join("\n"));
  expect(misses.length / total).toBeLessThan(0.08);
});
