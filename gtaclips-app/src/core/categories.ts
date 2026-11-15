// Catálogo de acontecimentos: nome em português, descrições para o modelo de visão (CLIP),
// peso de interesse e se é um "tempo morto" que deve ser cortado.

import type { Category } from "./types";

export interface CategoryInfo {
  id: Category;
  name: string;
  /** Frases em inglês comparadas com cada quadro pelo modelo CLIP. */
  prompts: string[];
  /** Interesse base (0–1) para clipes curtos. */
  interest: number;
  /** Tempo morto: cortado sempre que não for essencial à história. */
  dead: boolean;
  /** Ação: participa de perseguições, confrontos e clímax. */
  action: boolean;
  humor: number;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: "perseguicao", name: "Perseguição", prompts: ["a high speed police car chase in a video game", "a car fleeing from police cars on a city street"], interest: 0.95, dead: false, action: true, humor: 0.1, color: "#ef4444" },
  { id: "policia", name: "Polícia na cola", prompts: ["police cars with flashing red and blue lights", "police officers aiming guns in a video game"], interest: 0.85, dead: false, action: true, humor: 0.05, color: "#3b82f6" },
  { id: "explosao", name: "Explosão", prompts: ["a huge explosion with fire and smoke", "a car exploding in flames"], interest: 1, dead: false, action: true, humor: 0.15, color: "#f97316" },
  { id: "acidente", name: "Acidente", prompts: ["a violent car crash in a video game", "a wrecked car after a collision"], interest: 0.9, dead: false, action: true, humor: 0.35, color: "#f59e0b" },
  { id: "tiroteio", name: "Tiroteio", prompts: ["a shootout with guns in a video game", "a character shooting a rifle"], interest: 0.88, dead: false, action: true, humor: 0.05, color: "#dc2626" },
  { id: "briga", name: "Briga", prompts: ["two characters fist fighting on the street", "a melee brawl in a video game"], interest: 0.8, dead: false, action: true, humor: 0.3, color: "#e11d48" },
  { id: "engracado", name: "Situação engraçada", prompts: ["a funny ragdoll physics moment in a video game", "a character in an absurd silly situation"], interest: 0.85, dead: false, action: false, humor: 1, color: "#a855f7" },
  { id: "queda", name: "Queda", prompts: ["a character falling from a great height", "a person tumbling down in a video game"], interest: 0.75, dead: false, action: true, humor: 0.6, color: "#8b5cf6" },
  { id: "aereo", name: "Voo", prompts: ["a helicopter flying over a city", "an airplane in the sky in a video game"], interest: 0.6, dead: false, action: false, humor: 0.1, color: "#06b6d4" },
  { id: "aquatico", name: "Na água", prompts: ["a speedboat on the ocean", "a jet ski racing on water"], interest: 0.55, dead: false, action: false, humor: 0.1, color: "#0ea5e9" },
  { id: "cinematico", name: "Cena cinematográfica", prompts: ["a cinematic view of a city at sunset", "a beautiful wide shot of a beach landscape"], interest: 0.6, dead: false, action: false, humor: 0, color: "#eab308" },
  { id: "cutscene", name: "Cena de diálogo", prompts: ["a cutscene with characters talking face to face", "a close up of two people having a conversation"], interest: 0.45, dead: false, action: false, humor: 0.15, color: "#64748b" },
  { id: "conducao", name: "Dirigindo", prompts: ["driving a car on a highway in a video game", "a car driving through traffic, third person view"], interest: 0.35, dead: false, action: false, humor: 0, color: "#94a3b8" },
  { id: "andando", name: "Caminhando", prompts: ["a character walking on the sidewalk", "a person walking around a city street, third person view"], interest: 0.12, dead: true, action: false, humor: 0, color: "#71717a" },
  { id: "menu", name: "Menu", prompts: ["a video game pause menu with text options", "a settings menu screen"], interest: 0, dead: true, action: false, humor: 0, color: "#52525b" },
  { id: "carregamento", name: "Carregamento", prompts: ["a loading screen with a progress indicator", "a black screen"], interest: 0, dead: true, action: false, humor: 0, color: "#3f3f46" },
  { id: "mapa", name: "Mapa", prompts: ["a video game world map screen", "a GPS map interface"], interest: 0, dead: true, action: false, humor: 0, color: "#52525b" },
  { id: "parado", name: "Espera", prompts: ["a character standing still doing nothing", "an empty quiet street with nothing happening"], interest: 0.05, dead: true, action: false, humor: 0, color: "#3f3f46" },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export function category(id: Category): CategoryInfo {
  return CATEGORIES.find((c) => c.id === id)!;
}

/** Sequências típicas de uma história (o que costuma levar a quê). */
export const STORY_LINKS: [Category, Category][] = [
  ["conducao", "perseguicao"],
  ["tiroteio", "policia"],
  ["briga", "policia"],
  ["policia", "perseguicao"],
  ["perseguicao", "acidente"],
  ["perseguicao", "explosao"],
  ["acidente", "explosao"],
  ["acidente", "engracado"],
  ["queda", "engracado"],
  ["aereo", "queda"],
  ["perseguicao", "aquatico"],
  ["cutscene", "conducao"],
  ["cutscene", "tiroteio"],
];

export function linked(a: Category, b: Category): boolean {
  return a === b || STORY_LINKS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}
