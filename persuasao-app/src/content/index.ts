// Junta todo o conteúdo do jogo.

import type { Character, Mission } from "../core/types";
import { JARDIM } from "./characters/jardim";
import { MERCADO } from "./characters/mercado";
import { CAMPUS } from "./characters/campus";
import { LARGO } from "./characters/largo";
import { TORRES } from "./characters/torres";
import { PALMEIRAS, PACO } from "./characters/elite";
import { CH1 } from "./missions/ch1";
import { CH2 } from "./missions/ch2";
import { CH3 } from "./missions/ch3";
import { CH4 } from "./missions/ch4";
import { CH5 } from "./missions/ch5";

export const CHARACTERS: Character[] = [...JARDIM, ...MERCADO, ...CAMPUS, ...LARGO, ...TORRES, ...PALMEIRAS, ...PACO];
export const MISSIONS: Mission[] = [...CH1, ...CH2, ...CH3, ...CH4, ...CH5];

const BY_ID = new Map(CHARACTERS.map((c) => [c.id, c]));
const MISSION_BY_ID = new Map(MISSIONS.map((m) => [m.id, m]));

export function character(id: string): Character {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`Personagem desconhecido: ${id}`);
  return c;
}

export function mission(id: string): Mission {
  const m = MISSION_BY_ID.get(id);
  if (!m) throw new Error(`Missão desconhecida: ${id}`);
  return m;
}

export * from "./world";
