// Mundos planejados: aparecem no mapa de aprendizado com os tópicos previstos,
// mas sem lições ainda. Nada aqui finge estar pronto.

import type { World } from "../../core/types";

export const PLANNED: World[] = [
  {
    id: "w6",
    n: 6,
    title: "Gramática em ação",
    ru: "Грамма'тика в де'йствии",
    level: "A2",
    description: "Os seis casos de verdade, plural, aspecto verbal e concordância.",
    color: "#2B7A9B",
    units: [],
    planned: [
      "Plural dos substantivos e adjetivos",
      "Acusativo com pessoas e animais",
      "Genitivo: нет, мно́го, ма́ло, de quem é",
      "Dativo: мне нра́вится, к дру́гу",
      "Instrumental: com quem, профе́ссия",
      "Aspecto verbal: делать × сделать",
      "Passado: я был, я была́",
    ],
  },
  {
    id: "w7",
    n: 7,
    title: "Conversas reais",
    ru: "Живы'е разгово'ры",
    level: "A2",
    description: "Gostos, amizades, planos, passado e opiniões em diálogos mais longos.",
    color: "#B5446E",
    units: [],
    planned: ["Мне нра́вится: gostos", "O que você fez ontem", "Planos com бу́ду + infinitivo", "Opiniões: я ду́маю, что…", "Verbos de movimento: идти́ × ходи́ть"],
  },
  {
    id: "w8",
    n: 8,
    title: "Russo intermediário",
    ru: "Сре'дний у'ровень",
    level: "B1",
    description: "Textos curtos, histórias narradas, áudios em várias velocidades e expressões idiomáticas.",
    color: "#5B5FC7",
    units: [],
    planned: ["Histórias narradas", "Conversas com vários interlocutores", "Expressões idiomáticas frequentes", "Registros formal, neutro e coloquial"],
  },
  {
    id: "w9",
    n: 9,
    title: "Imersão avançada",
    ru: "Погруже'ние",
    level: "B2",
    description: "Textos autênticos adaptados, fala natural e argumentação, com menos português.",
    color: "#3A3F58",
    units: [],
    planned: ["Textos autênticos adaptados", "Fala natural e sotaques", "Particípios e gerúndios", "Argumentação e narrativa"],
  },
];
