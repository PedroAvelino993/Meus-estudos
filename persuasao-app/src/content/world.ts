// A cidade de Vila Áurea, os itens da loja e a árvore de habilidades.

import type { Attrs, Tactic } from "../core/types";

export const CITY = "Vila Áurea";
export const CURRENCY = "₢";

export interface District {
  id: string;
  name: string;
  kind: string;
  tagline: string;
  description: string;
  color: string;
  /** Classe social predominante (1–5). */
  tier: number;
  unlock: { level?: number; rep?: number; chapter?: number };
  /** Custo de transporte até lá (sem passe). */
  fare: number;
  /** Polígono no mapa (viewBox 1000×640). */
  path: string;
  label: [number, number];
  ambient: string[];
}

export const DISTRICTS: District[] = [
  {
    id: "jardim",
    name: "Vila Jardim",
    kind: "Bairro residencial",
    tagline: "Onde todo mundo se conhece — e comenta.",
    description: "Ruas de casas geminadas, varais nas lajes e a pensão da Dona Cida. É aqui que você começa, com uma mala e um quarto alugado.",
    color: "#6FA37A",
    tier: 2,
    unlock: {},
    fare: 0,
    path: "M60 360 L250 330 L300 420 L285 560 L120 590 L50 500 Z",
    label: [170, 460],
    ambient: ["Crianças jogam bola na rua de terra.", "O cheiro de café sai das janelas.", "Alguém ouve um samba antigo no rádio."],
  },
  {
    id: "mercado",
    name: "Mercado Central",
    kind: "Centro comercial",
    tagline: "Tudo tem preço. Quase tudo tem desconto.",
    description: "Bancas, lojas e camelôs em volta do velho mercado de ferro. Aqui se negocia o tempo todo — e quem pisca perde.",
    color: "#D49A3A",
    tier: 2,
    unlock: { rep: 10, chapter: 2 },
    fare: 6,
    path: "M250 330 L430 300 L470 400 L420 470 L300 420 Z",
    label: [360, 385],
    ambient: ["Um vendedor grita a promoção do dia.", "Pilhas de laranjas brilham ao sol.", "O alto-falante anuncia o fim da feira."],
  },
  {
    id: "campus",
    name: "Campus Aurora",
    kind: "Universidade",
    tagline: "Ideias baratas, argumentos caros.",
    description: "Prédios modernistas, laboratórios e cafés lotados de estudantes. Aqui ninguém aceita uma afirmação sem fonte.",
    color: "#5B8FD1",
    tier: 3,
    unlock: { level: 3, rep: 20, chapter: 2 },
    fare: 8,
    path: "M90 120 L300 90 L330 220 L250 330 L60 360 L40 220 Z",
    label: [190, 230],
    ambient: ["Um grupo discute economia aos gritos.", "Cartazes de uma assembleia cobrem o mural.", "Alguém ensaia uma apresentação sozinho."],
  },
  {
    id: "largo",
    name: "Largo do Relógio",
    kind: "Centro histórico",
    tagline: "O relógio atrasa. As pessoas, não.",
    description: "Casarões coloniais, antiquários e o museu da cidade. Histórias de família valem mais que dinheiro — e guardam segredos.",
    color: "#B5655B",
    tier: 3,
    unlock: { level: 4, rep: 30, chapter: 3 },
    fare: 8,
    path: "M300 90 L520 70 L540 190 L430 300 L250 330 L330 220 Z",
    label: [420, 190],
    ambient: ["O sino do relógio toca fora de hora.", "Um turista fotografa uma janela azul.", "Cheiro de livro velho na calçada."],
  },
  {
    id: "torres",
    name: "Torres do Porto",
    kind: "Região empresarial",
    tagline: "Tempo é dinheiro. O seu vale pouco.",
    description: "Prédios de vidro, contêineres e reuniões de quinze minutos. Ninguém tem paciência para rodeios.",
    color: "#3FA7A0",
    tier: 4,
    unlock: { level: 6, rep: 55, chapter: 4 },
    fare: 12,
    path: "M520 70 L800 60 L940 200 L880 330 L640 330 L540 190 Z",
    label: [720, 200],
    ambient: ["Guindastes se movem devagar no porto.", "Executivos falam ao telefone enquanto andam.", "Um navio apita ao longe."],
  },
  {
    id: "palmeiras",
    name: "Alto das Palmeiras",
    kind: "Área nobre",
    tagline: "Aqui o 'não' vem com um sorriso.",
    description: "Mansões com portões altos, galerias e jantares beneficentes. Dinheiro antigo, regras não escritas.",
    color: "#C9A44C",
    tier: 5,
    unlock: { level: 8, rep: 80, chapter: 4 },
    fare: 16,
    path: "M640 330 L880 330 L960 470 L860 590 L620 600 L560 470 Z",
    label: [760, 470],
    ambient: ["Um jardineiro poda as roseiras.", "Um carro de luxo passa em silêncio.", "Música de câmara vem de uma varanda."],
  },
  {
    id: "paco",
    name: "Paço Municipal",
    kind: "Prefeitura",
    tagline: "Onde as decisões da cidade são tomadas — ou adiadas.",
    description: "A prefeitura, a câmara e uma praça cheia de gente esperando atendimento. Todo acordo aqui vira notícia.",
    color: "#9A7BC9",
    tier: 4,
    unlock: { level: 9, rep: 110, chapter: 5 },
    fare: 8,
    path: "M430 300 L640 330 L560 470 L470 560 L285 560 L300 420 L420 470 L470 400 Z",
    label: [480, 470],
    ambient: ["Uma fila dobra o quarteirão.", "Repórteres esperam na escadaria.", "Um protesto pacífico canta na praça."],
  },
];

export function district(id: string): District {
  const d = DISTRICTS.find((x) => x.id === id);
  if (!d) throw new Error(`Bairro desconhecido: ${id}`);
  return d;
}

// ---------- Loja ----------

export type ItemKind = "outfit" | "tool" | "consumable" | "theme" | "pass";

export interface Item {
  id: string;
  name: string;
  kind: ItemKind;
  price: number;
  description: string;
  /** Efeito no começo de cada conversa. */
  start?: Partial<Attrs>;
  /** Efeito extra conforme a formalidade do personagem. */
  formal?: Partial<Attrs>;
  casual?: Partial<Attrs>;
  unlock?: { level?: number; chapter?: number };
  /** Tema do celular. */
  theme?: { accent: string; bg: string };
}

export const ITEMS: Item[] = [
  { id: "roupa-comum", name: "Roupa do dia a dia", kind: "outfit", price: 0, description: "Jeans e camiseta limpa. Ninguém se impressiona, ninguém se assusta." },
  { id: "camisa", name: "Camisa social", kind: "outfit", price: 180, description: "Passa seriedade sem parecer engomado.", start: { credibility: 4 }, formal: { credibility: 2 } },
  { id: "jaqueta", name: "Jaqueta de couro", kind: "outfit", price: 320, description: "Descolada. Agrada os informais, incomoda os formais.", casual: { affinity: 7, mood: 3 }, formal: { credibility: -4, affinity: -3 } },
  { id: "terno", name: "Terno risca de giz", kind: "outfit", price: 900, description: "Abre portas nos escritórios. Fecha algumas na rua.", formal: { credibility: 10, trust: 3 }, casual: { affinity: -6 }, unlock: { level: 4 } },
  { id: "elegante", name: "Visual de gala", kind: "outfit", price: 2200, description: "Corte impecável. Feito para o Alto das Palmeiras.", start: { credibility: 6 }, formal: { credibility: 6, affinity: 4 }, unlock: { level: 7 } },
  { id: "cartao", name: "Cartões de visita", kind: "tool", price: 120, description: "Seu nome impresso em papel bom. +credibilidade no começo das conversas.", start: { credibility: 5 } },
  { id: "caderno", name: "Caderno de couro", kind: "tool", price: 90, description: "Anota o que você já afirmou. Avisa quando uma fala contradiz algo que você disse antes." },
  { id: "gravador", name: "Gravador de bolso", kind: "tool", price: 350, description: "Registra depoimentos. Necessário para algumas falas nas investigações.", unlock: { chapter: 3 } },
  { id: "passe", name: "Passe de transporte", kind: "pass", price: 160, description: "Viagens sem custo entre os bairros." },
  { id: "dossie", name: "Dossiê", kind: "consumable", price: 70, description: "Pesquisa de fundo: revela uma necessidade escondida da próxima pessoa com quem você falar." },
  { id: "cafe", name: "Café para viagem", kind: "consumable", price: 12, description: "+30 de energia na hora." },
  { id: "flores", name: "Buquê de flores", kind: "consumable", price: 45, description: "Um presente: +afinidade no começo da próxima conversa." },
  { id: "tema-onix", name: "Tema Ônix", kind: "theme", price: 0, description: "O tema padrão do celular.", theme: { accent: "#C9A44C", bg: "#0E1117" } },
  { id: "tema-esmeralda", name: "Tema Esmeralda", kind: "theme", price: 220, description: "Verde profundo com detalhes claros.", theme: { accent: "#3FBF8A", bg: "#08150F" } },
  { id: "tema-champanhe", name: "Tema Champanhe", kind: "theme", price: 300, description: "Dourado suave sobre grafite.", theme: { accent: "#E8C98A", bg: "#16130E" } },
  { id: "tema-safira", name: "Tema Safira", kind: "theme", price: 260, description: "Azul noturno e prata.", theme: { accent: "#7FA8E8", bg: "#0A0F1C" } },
];

export function item(id: string): Item | undefined {
  return ITEMS.find((i) => i.id === id);
}

// ---------- Habilidades ----------

export interface Perk {
  id: string;
  name: string;
  branch: "leitura" | "retorica" | "carisma" | "frieza";
  description: string;
  level: number;
  requires?: string;
  skill?: Partial<Record<Tactic, number>>;
  start?: Partial<Attrs>;
}

export const BRANCHES: Record<Perk["branch"], { name: string; color: string; description: string }> = {
  leitura: { name: "Leitura", color: "#7FA8E8", description: "Entender o que a pessoa sente e quer." },
  retorica: { name: "Retórica", color: "#C9A44C", description: "Argumentos claros, dados e fechamento." },
  carisma: { name: "Carisma", color: "#3FBF8A", description: "Conexão, acolhimento e bom humor." },
  frieza: { name: "Sangue-frio", color: "#C77B6B", description: "Calma sob pressão e memória afiada." },
};

export const PERKS: Perk[] = [
  { id: "olho-clinico", name: "Olho clínico", branch: "leitura", level: 2, description: "Mostra os atributos da conversa como faixas aproximadas, além dos sinais de linguagem corporal." },
  { id: "leitura-fria", name: "Leitura fria", branch: "leitura", level: 5, requires: "olho-clinico", description: "Mostra os números exatos e quanto cada fala mudou cada atributo." },
  { id: "intuicao", name: "Intuição", branch: "leitura", level: 8, requires: "leitura-fria", description: "Perguntas revelam necessidades com muito mais facilidade.", skill: { question: 0.8 } },
  { id: "argumentacao", name: "Argumentação", branch: "retorica", level: 2, description: "Explicar, mostrar dados e reenquadrar rendem mais.", skill: { explain: 0.5, evidence: 0.5, reframe: 0.5 } },
  { id: "oratoria", name: "Oratória", branch: "retorica", level: 4, requires: "argumentacao", description: "Autoridade e prova social convencem mais e levantam menos suspeita.", skill: { authority: 0.6, socialProof: 0.6 } },
  { id: "fechador", name: "Fechador", branch: "retorica", level: 7, requires: "oratoria", description: "Suas propostas são aceitas com 6 pontos a menos de convencimento." },
  { id: "empatia", name: "Escuta ativa", branch: "carisma", level: 2, description: "Ouvir e perguntar criam mais confiança.", skill: { empathy: 0.5, question: 0.3 } },
  { id: "bom-papo", name: "Bom de papo", branch: "carisma", level: 4, requires: "empatia", description: "Conversa fiada e humor funcionam melhor e cansam menos.", skill: { rapport: 0.6, humor: 0.6 } },
  { id: "presenca", name: "Presença", branch: "carisma", level: 7, requires: "bom-papo", description: "As pessoas começam mais simpáticas e pacientes com você.", start: { affinity: 8, patience: 8 } },
  { id: "calma", name: "Calma", branch: "frieza", level: 3, description: "Franqueza e mudar de assunto recuperam o clima com mais força.", skill: { honesty: 0.6, changeSubject: 0.6 } },
  { id: "memoria", name: "Memória afiada", branch: "frieza", level: 5, requires: "calma", description: "Marca as falas que contradizem algo que você já disse (como o caderno)." },
  { id: "negociador", name: "Negociador", branch: "frieza", level: 8, requires: "memoria", description: "Ceder rende mais e os preços aceitos ficam 6% melhores para você.", skill: { concession: 0.6 } },
];
