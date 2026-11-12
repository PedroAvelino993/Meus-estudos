// Modalidades de espetáculo, construções, regiões do mundo, eras e níveis de autoridade.

import type { Building, Modality, Region } from "../core/types";

export const MODALITIES: Modality[] = [
  { id: "demonstracao", name: "Combate de demonstração", description: "Lutas coreografadas entre dois gladiadores para mostrar técnica. Barato e seguro: o começo de tudo.", appeal: 1, cost: 120, priceMult: 1, specialties: ["demonstracao"], minGladiators: 2, maxGladiators: 2, danger: 0.03, fatigue: 14, requires: {}, firstTimeEp: 0, prestige: 0 },
  { id: "duelos", name: "Noite de duelos", description: "Três ou quatro confrontos em sequência. Mais público, mais desgaste.", appeal: 1.25, cost: 260, priceMult: 1.1, specialties: ["demonstracao", "habilidade"], minGladiators: 4, maxGladiators: 6, danger: 0.06, fatigue: 18, requires: { node: "esp-duelos" }, firstTimeEp: 2, prestige: 1 },
  { id: "torneio", name: "Torneio de gladiadores", description: "Chaveamento eliminatório até um campeão. O público adora ver alguém subir rodada após rodada.", appeal: 1.6, cost: 650, priceMult: 1.25, specialties: ["torneio", "habilidade"], minGladiators: 4, maxGladiators: 8, danger: 0.08, fatigue: 24, requires: { node: "esp-torneios" }, firstTimeEp: 4, prestige: 3 },
  { id: "equipes", name: "Competição entre equipes", description: "Duas equipes de três disputam provas de força e coordenação.", appeal: 1.45, cost: 520, priceMult: 1.15, specialties: ["habilidade", "torneio"], minGladiators: 6, maxGladiators: 6, danger: 0.05, fatigue: 18, requires: { node: "esp-equipes" }, firstTimeEp: 3, prestige: 2 },
  { id: "bestas", name: "Desfile das Bestas Míticas", description: "Grifos, leões alados e serpentes de bronze — animais fictícios, bonecos gigantes e muito teatro.", appeal: 1.55, cost: 900, priceMult: 1.2, specialties: ["espetaculo"], minGladiators: 2, maxGladiators: 4, danger: 0.04, fatigue: 12, requires: { node: "esp-bestas" }, firstTimeEp: 4, prestige: 2, original: true },
  { id: "bigas", name: "Corrida de bigas", description: "Carros puxados por cavalos dando voltas na pista. Velocidade e apostas de torcida.", appeal: 1.7, cost: 1100, priceMult: 1.2, specialties: ["biga"], minGladiators: 4, maxGladiators: 8, danger: 0.07, fatigue: 16, requires: { node: "esp-bigas", infra: { pista: 1 } }, firstTimeEp: 5, prestige: 3 },
  { id: "historica", name: "Representação histórica", description: "Grandes batalhas do passado encenadas com figurino, cenário e narrador.", appeal: 1.4, cost: 800, priceMult: 1.15, specialties: ["espetaculo", "demonstracao"], minGladiators: 4, maxGladiators: 8, danger: 0.02, fatigue: 10, requires: { node: "esp-historica" }, firstTimeEp: 4, prestige: 4 },
  { id: "noturno", name: "Espetáculo noturno", description: "Tochas, fogueiras e lanternas: a arena vira outro lugar à noite.", appeal: 1.6, cost: 950, priceMult: 1.3, specialties: ["espetaculo", "demonstracao"], minGladiators: 2, maxGladiators: 6, danger: 0.05, fatigue: 14, requires: { node: "esp-noturnos", infra: { iluminacao: 1 } }, firstTimeEp: 4, prestige: 2, night: true },
  { id: "aquatico", name: "Espetáculo aquático", description: "A arena inundada vira um lago com barcos decorados, mergulhos e coreografias.", appeal: 1.9, cost: 1800, priceMult: 1.4, specialties: ["naval", "espetaculo"], minGladiators: 2, maxGladiators: 6, danger: 0.04, fatigue: 14, requires: { node: "esp-aquaticos", infra: { aquatica: 1 } }, firstTimeEp: 6, prestige: 4 },
  { id: "naumaquia", name: "Naumaquia", description: "Simulação de batalha naval com navios de verdade em escala reduzida.", appeal: 2.4, cost: 4200, priceMult: 1.6, specialties: ["naval"], minGladiators: 6, maxGladiators: 8, danger: 0.08, fatigue: 22, requires: { node: "esp-naumaquia", infra: { aquatica: 2 } }, firstTimeEp: 10, prestige: 8 },
  { id: "festival", name: "Grande Festival Romano", description: "Vários dias de atrações misturadas: lutas, música, comida e desfiles.", appeal: 2.1, cost: 3000, priceMult: 1.3, specialties: ["espetaculo", "torneio", "demonstracao"], minGladiators: 4, maxGladiators: 8, danger: 0.04, fatigue: 16, requires: { node: "esp-festivais", infra: { festival: 1 } }, firstTimeEp: 8, prestige: 6, festival: true },
  { id: "elementos", name: "Arena dos Elementos", description: "Cenários de fogo, água, vento e terra se alternam no meio da luta. Inédito no mundo.", appeal: 2.5, cost: 5200, priceMult: 1.7, specialties: ["espetaculo", "habilidade"], minGladiators: 2, maxGladiators: 6, danger: 0.06, fatigue: 20, requires: { node: "esp-elementos", infra: { tuneis: 2, aquatica: 1 } }, firstTimeEp: 12, prestige: 9, original: true },
  { id: "cemportas", name: "O Desafio das Cem Portas", description: "Um labirinto de portas com enigmas e obstáculos. Vence quem pensa rápido e corre mais.", appeal: 2.2, cost: 3600, priceMult: 1.5, specialties: ["habilidade"], minGladiators: 4, maxGladiators: 8, danger: 0.03, fatigue: 16, requires: { node: "esp-cemportas", infra: { tuneis: 1 } }, firstTimeEp: 10, prestige: 7, original: true },
  { id: "nacoes", name: "Festival das Nações", description: "Equipes representando as regiões do mundo disputam a glória da sua terra.", appeal: 2.6, cost: 6500, priceMult: 1.6, specialties: ["torneio", "habilidade", "espetaculo"], minGladiators: 6, maxGladiators: 8, danger: 0.05, fatigue: 18, requires: { node: "esp-nacoes", infra: { festival: 2 } }, firstTimeEp: 14, prestige: 12, festival: true, original: true },
  { id: "campeoes", name: "Noite dos Campeões", description: "Só os mais famosos. Ingresso caro, arquibancada lotada e história sendo escrita.", appeal: 2.8, cost: 7000, priceMult: 2, specialties: ["torneio", "demonstracao", "habilidade"], minGladiators: 4, maxGladiators: 6, danger: 0.07, fatigue: 22, requires: { node: "esp-campeoes", infra: { iluminacao: 2 } }, firstTimeEp: 15, prestige: 14, night: true, original: true },
  { id: "exclusivo", name: "Espetáculo exclusivo", description: "Criação própria: tema, cenário e efeito escolhidos por você no Ateliê de Espetáculos.", appeal: 2.4, cost: 5000, priceMult: 1.8, specialties: ["espetaculo", "habilidade", "torneio"], minGladiators: 2, maxGladiators: 8, danger: 0.05, fatigue: 18, requires: { node: "esp-exclusivos" }, firstTimeEp: 15, prestige: 10, original: true },
];

export function modality(id: string): Modality {
  const m = MODALITIES.find((x) => x.id === id);
  if (!m) throw new Error(`Modalidade desconhecida: ${id}`);
  return m;
}

/** Ateliê de espetáculos exclusivos: o jogador combina tema, cenário e efeito. */
export const ATELIER = {
  temas: [
    { id: "mitologia", name: "Mitologia", appeal: 0.2, specialty: "espetaculo" },
    { id: "imperio", name: "Glória do Império", appeal: 0.15, specialty: "torneio" },
    { id: "misterio", name: "Mistério e enigmas", appeal: 0.18, specialty: "habilidade" },
    { id: "mar", name: "Lendas do mar", appeal: 0.22, specialty: "naval" },
    { id: "velocidade", name: "Velocidade", appeal: 0.16, specialty: "biga" },
  ],
  cenarios: [
    { id: "floresta", name: "Floresta encantada", appeal: 0.15, cost: 600 },
    { id: "cidade", name: "Cidade em chamas (fogos de artifício)", appeal: 0.2, cost: 900 },
    { id: "templo", name: "Templo dourado", appeal: 0.25, cost: 1200 },
    { id: "deserto", name: "Deserto de areia dourada", appeal: 0.12, cost: 400 },
  ],
  efeitos: [
    { id: "musica", name: "Orquestra ao vivo", appeal: 0.1, cost: 300 },
    { id: "fogos", name: "Fogos e faíscas", appeal: 0.18, cost: 700 },
    { id: "neblina", name: "Neblina e luzes", appeal: 0.15, cost: 500 },
    { id: "chuva-petalas", name: "Chuva de pétalas", appeal: 0.12, cost: 350 },
  ],
} as const;

export const EXTRAS = [
  { id: "musicos", name: "Músicos e tambores", cost: 150, satisfaction: 3, demand: 0.02 },
  { id: "comida-gratis", name: "Pão grátis na entrada", cost: 400, satisfaction: 6, demand: 0.05 },
  { id: "desfile", name: "Desfile de abertura", cost: 350, satisfaction: 4, demand: 0.04 },
  { id: "poeta", name: "Narrador e poeta", cost: 250, satisfaction: 4, demand: 0.02 },
  { id: "premios", name: "Sorteio de brindes para a plateia", cost: 500, satisfaction: 5, demand: 0.06 },
];

// ---------- Construções (Coliseu de Roma) ----------

export const BUILDINGS: Building[] = [
  { id: "arquibancada", name: "Arquibancadas", description: "Lugares para o público. A capacidade é o teto de qualquer evento na arena.", unit: "lugares", upkeep: 20, levels: [
    { cost: 0, label: "Arena de madeira", value: 500 },
    { cost: 3500, label: "Arquibancada de pedra", value: 1000 },
    { cost: 9000, label: "Dois anéis", value: 2500, era: 2 },
    { cost: 22000, label: "Três anéis", value: 5000, era: 2, node: "inf-arquibancada" },
    { cost: 70000, label: "Anfiteatro monumental", value: 10000, era: 3 },
    { cost: 220000, label: "Coliseu de quatro anéis", value: 20000, era: 4, node: "inf-mega" },
    { cost: 600000, label: "Colosso de mármore", value: 35000, era: 5 },
    { cost: 1500000, label: "Maravilha do mundo", value: 50000, era: 6, node: "inf-maravilha" },
  ] },
  { id: "camarotes", name: "Camarotes imperiais", description: "Assentos de luxo para senadores e ricos. Aumentam o preço aceito e o prestígio.", unit: "% preço", upkeep: 30, levels: [
    { cost: 0, label: "Sem camarotes", value: 0 },
    { cost: 4000, label: "Tribuna dos patrícios", value: 8 },
    { cost: 14000, label: "Camarote senatorial", value: 16, era: 2, node: "inf-camarotes" },
    { cost: 45000, label: "Pulvinar imperial", value: 26, era: 3 },
  ] },
  { id: "secundaria", name: "Arenas secundárias", description: "Cada nível permite um evento a mais por semana em Roma.", unit: "eventos extras", upkeep: 60, levels: [
    { cost: 0, label: "Uma arena só", value: 0 },
    { cost: 12000, label: "Arena de treino aberta ao público", value: 1, era: 2, node: "inf-secundaria" },
    { cost: 40000, label: "Segunda arena", value: 2, era: 3 },
  ] },
  { id: "iluminacao", name: "Iluminação", description: "Tochas e lanternas: permitem eventos noturnos e melhoram a experiência.", unit: "satisfação", upkeep: 15, levels: [
    { cost: 0, label: "Só luz do dia", value: 0 },
    { cost: 2500, label: "Tochas", value: 2, node: "inf-iluminacao" },
    { cost: 9000, label: "Lanternas de bronze", value: 4, era: 2 },
    { cost: 26000, label: "Espelhos e braseiros", value: 7, era: 3 },
  ] },
  { id: "som", name: "Acústica e som", description: "Cornetas, tambores e acústica que faz o grito da plateia ecoar.", unit: "satisfação", upkeep: 10, levels: [
    { cost: 0, label: "Nada", value: 0 },
    { cost: 1800, label: "Trombetas e tambores", value: 2 },
    { cost: 7000, label: "Concha acústica", value: 4, node: "inf-som" },
    { cost: 20000, label: "Órgão hidráulico", value: 6, era: 3 },
  ] },
  { id: "aquatica", name: "Estruturas aquáticas", description: "Canais e comportas para inundar a arena: espetáculos aquáticos e naumaquias.", unit: "nível", upkeep: 80, levels: [
    { cost: 0, label: "Sem água", value: 0 },
    { cost: 16000, label: "Canais e comportas", value: 1, era: 2, node: "inf-aquatica" },
    { cost: 60000, label: "Lago artificial", value: 2, era: 3 },
  ] },
  { id: "tuneis", name: "Túneis subterrâneos (hipogeu)", description: "Elevadores e alçapões: aparições surpresa e cenários que surgem do chão.", unit: "satisfação", upkeep: 40, levels: [
    { cost: 0, label: "Sem túneis", value: 0 },
    { cost: 8000, label: "Corredores", value: 3, era: 2, node: "inf-tuneis" },
    { cost: 30000, label: "Hipogeu com elevadores", value: 6, era: 3 },
    { cost: 80000, label: "Labirinto mecânico", value: 9, era: 4 },
  ] },
  { id: "treino", name: "Salas de treinamento", description: "Os gladiadores evoluem mais rápido e se recuperam melhor.", unit: "% treino", upkeep: 25, levels: [
    { cost: 0, label: "Pátio de terra", value: 0 },
    { cost: 2200, label: "Ludus simples", value: 20 },
    { cost: 8000, label: "Ludus com termas", value: 40, node: "inf-treino" },
    { cost: 24000, label: "Academia de campeões", value: 70, era: 3 },
  ] },
  { id: "hospedagem", name: "Hospedagem", description: "Estalagens para visitantes de longe: mais público e fama fora de Roma.", unit: "% demanda", upkeep: 35, levels: [
    { cost: 0, label: "Nenhuma", value: 0 },
    { cost: 6000, label: "Estalagem", value: 6, era: 2 },
    { cost: 20000, label: "Hospedaria do Coliseu", value: 12, era: 3, node: "inf-hospedagem" },
    { cost: 60000, label: "Bairro dos visitantes", value: 20, era: 4 },
  ] },
  { id: "restaurantes", name: "Restaurantes e tabernas", description: "Cada espectador gasta mais com comida e bebida.", unit: "por pessoa", upkeep: 25, levels: [
    { cost: 0, label: "Vendedores ambulantes", value: 0.3 },
    { cost: 1500, label: "Barracas de comida", value: 0.6 },
    { cost: 6000, label: "Tabernas", value: 1.0, node: "inf-restaurantes" },
    { cost: 20000, label: "Banquetes", value: 1.6, era: 3 },
  ] },
  { id: "comercio", name: "Comércio interno", description: "Lojas de lembranças, estátuas dos gladiadores e mosaicos.", unit: "por pessoa", upkeep: 25, levels: [
    { cost: 0, label: "Nada", value: 0 },
    { cost: 2500, label: "Banca de lembranças", value: 0.3 },
    { cost: 9000, label: "Galeria de lojas", value: 0.7, era: 2, node: "inf-comercio" },
    { cost: 30000, label: "Mercado do Coliseu", value: 1.2, era: 3 },
  ] },
  { id: "festival", name: "Estruturas para festivais", description: "Palcos, tendas e praças ao redor da arena para eventos de vários dias.", unit: "nível", upkeep: 50, levels: [
    { cost: 0, label: "Nenhuma", value: 0 },
    { cost: 14000, label: "Praça dos festivais", value: 1, era: 2, node: "inf-festivais" },
    { cost: 50000, label: "Cidade dos espetáculos", value: 2, era: 4 },
  ] },
  { id: "pista", name: "Pista de corridas", description: "Pista oval para corridas de bigas.", unit: "nível", upkeep: 45, levels: [
    { cost: 0, label: "Sem pista", value: 0 },
    { cost: 12000, label: "Pista de areia", value: 1, era: 2 },
    { cost: 40000, label: "Circo com obelisco", value: 2, era: 3 },
  ] },
];

export function building(id: string): Building {
  const b = BUILDINGS.find((x) => x.id === id);
  if (!b) throw new Error(`Construção desconhecida: ${id}`);
  return b;
}

// ---------- Regiões ----------

export const REGIONS: Region[] = [
  { id: "roma", name: "Roma", description: "O coração do império. Público tradicional, exigente e cheio de senadores.", population: 1000000, interest: 1, wealth: 1.1, competition: 0.2, cost: 0, minFame: 0, minPrestige: 0, era: 1, likes: { torneio: 1.2, campeoes: 1.25, festival: 1.1 }, culture: "Tradição e prestígio imperial", path: "M455 205 L500 195 L520 230 L505 280 L470 285 L450 250 Z", label: [485, 245] },
  { id: "grecia", name: "Grécia", description: "Berço das competições e do teatro. Ama habilidade e cultura.", population: 600000, interest: 0.9, wealth: 1, competition: 0.3, cost: 30000, minFame: 220, minPrestige: 30, era: 3, likes: { cemportas: 1.4, historica: 1.3, equipes: 1.2, habilidade: 1.1 }, culture: "Competições de habilidade e teatro", path: "M560 245 L610 230 L640 260 L625 310 L585 315 L565 285 Z", label: [600, 280] },
  { id: "egito", name: "Egito", description: "Riqueza antiga e gosto por grandes festivais monumentais.", population: 800000, interest: 0.85, wealth: 1.2, competition: 0.25, cost: 45000, minFame: 300, minPrestige: 45, era: 4, likes: { festival: 1.4, aquatico: 1.3, bestas: 1.3, nacoes: 1.2 }, culture: "Festivais monumentais e espetáculos no Nilo", path: "M650 390 L720 380 L745 440 L720 500 L660 505 L640 450 Z", label: [692, 445] },
  { id: "hispania", name: "Hispânia", description: "Província em crescimento, com público jovem e entusiasmado.", population: 500000, interest: 0.95, wealth: 0.85, competition: 0.15, cost: 20000, minFame: 160, minPrestige: 20, era: 3, likes: { bigas: 1.3, duelos: 1.2, torneio: 1.1 }, culture: "Corridas e duelos", path: "M200 220 L285 205 L320 245 L300 300 L230 310 L195 270 Z", label: [258, 260] },
  { id: "galia", name: "Gália", description: "Novos mercados, tribos orgulhosas e muito interesse por força.", population: 550000, interest: 0.8, wealth: 0.8, competition: 0.2, cost: 22000, minFame: 180, minPrestige: 25, era: 3, likes: { demonstracao: 1.2, equipes: 1.3, historica: 1.1 }, culture: "Força e competições entre clãs", path: "M300 120 L380 105 L420 140 L405 195 L340 205 L300 170 Z", label: [360, 158] },
  { id: "africa", name: "Norte da África", description: "Portos ricos de Cartago e gosto por bestas e corridas.", population: 650000, interest: 0.9, wealth: 0.95, competition: 0.3, cost: 32000, minFame: 260, minPrestige: 35, era: 4, likes: { bestas: 1.4, bigas: 1.3, elementos: 1.2 }, culture: "Bestas míticas e corridas no deserto", path: "M300 340 L420 330 L470 360 L455 410 L340 420 L295 385 Z", label: [383, 375] },
  { id: "oriente", name: "Oriente", description: "Antioquia, Pérsia e além. Culturas diferentes e modalidades novas.", population: 900000, interest: 0.8, wealth: 1.15, competition: 0.35, cost: 60000, minFame: 380, minPrestige: 60, era: 5, likes: { elementos: 1.4, exclusivo: 1.4, noturno: 1.3, nacoes: 1.3 }, culture: "Novidade, luzes e espetáculos exóticos", path: "M760 230 L860 215 L905 265 L885 335 L800 345 L755 300 Z", label: [830, 280] },
  { id: "britania", name: "Britânia", description: "Fronteira do império. Público pequeno, mas apaixonado pelo que é raro.", population: 350000, interest: 1, wealth: 0.75, competition: 0.1, cost: 28000, minFame: 340, minPrestige: 50, era: 5, likes: { campeoes: 1.3, torneio: 1.2, noturno: 1.2 }, culture: "Torneios e noites de campeões", path: "M270 40 L320 30 L340 70 L320 105 L280 100 L260 70 Z", label: [300, 70] },
];

export function region(id: string): Region {
  const r = REGIONS.find((x) => x.id === id);
  if (!r) throw new Error(`Região desconhecida: ${id}`);
  return r;
}

/** Capacidade da arena de uma filial por nível. */
export const BRANCH_LEVELS = [
  { level: 1, capacity: 2000, cost: 0, label: "Arena provincial" },
  { level: 2, capacity: 5000, cost: 40000, label: "Anfiteatro regional" },
  { level: 3, capacity: 12000, cost: 150000, label: "Grande anfiteatro" },
  { level: 4, capacity: 25000, cost: 450000, label: "Coliseu da província" },
];

// ---------- Eras ----------

export interface Era {
  n: number;
  name: string;
  subtitle: string;
  intro: string;
  /** Condições para entrar nesta era. */
  needs: { fame?: number; prestige?: number; capacity?: number; branches?: number; legends?: number; events?: number };
  goal: string;
}

export const ERAS: Era[] = [
  { n: 1, name: "Pequena Arena", subtitle: "Uma arena de madeira no subúrbio de Roma", intro: "Você comprou uma arena de madeira para 500 pessoas, com três gladiadores desconhecidos e meia dúzia de funcionários. Ninguém em Roma sabe o seu nome. Organize espetáculos, conquiste a confiança do povo e transforme este lugar em algo que valha a viagem.", needs: {}, goal: "Realize 6 espetáculos e chegue a 60 de fama." },
  { n: 2, name: "Glória Romana", subtitle: "Roma começa a falar de você", intro: "As filas dão volta no quarteirão. Os patrícios querem camarotes, os gladiadores querem contratos e uma arena rival começa a se organizar do outro lado do Tibre. É hora de crescer de verdade.", needs: { fame: 60, events: 6 }, goal: "Chegue a 150 de fama, 15 de prestígio e 2.500 lugares." },
  { n: 3, name: "O Império do Entretenimento", subtitle: "Toda Roma assiste aos seus espetáculos", intro: "Seu nome está nos muros de Roma. As províncias querem uma arena como a sua. A Dominus Arena não vai deixar isso barato.", needs: { fame: 150, prestige: 15, capacity: 2500 }, goal: "Chegue a 260 de fama, 40 de prestígio e abra a primeira filial." },
  { n: 4, name: "Expansão Internacional", subtitle: "Do Tibre ao Nilo", intro: "Filiais nas províncias, caravanas de gladiadores e públicos que nunca viram um espetáculo romano. Cada região tem seus gostos — e seus concorrentes.", needs: { fame: 260, prestige: 40, branches: 1 }, goal: "Chegue a 400 de fama, 80 de prestígio, 3 filiais e um gladiador lendário." },
  { n: 5, name: "A Era dos Grandes Espetáculos", subtitle: "O mundo inteiro quer ver", intro: "Naumaquias, festivais das nações e noites de campeões. Você virou referência — e as arenas menores começam a se unir contra você.", needs: { fame: 400, prestige: 80, branches: 3, legends: 1 }, goal: "Construa um legado: veja os objetivos de vitória." },
  { n: 6, name: "O Legado Eterno", subtitle: "Seu nome atravessa os séculos", intro: "Monumentos, títulos e uma organização presente em todo o mundo conhecido. Falta pouco para a eternidade.", needs: { fame: 600, prestige: 130, branches: 5, legends: 3 }, goal: "Complete todos os objetivos de vitória." },
];

export const AUTHORITY = [
  { level: 1, name: "Proprietário da Arena", needs: 0, unlocks: "Eventos, gladiadores, construção e árvore de evolução." },
  { level: 2, name: "Magnata dos Espetáculos", needs: 120, unlocks: "Arena Bets, Decreto Imperial (espetáculos roteirizados) e tesoureiro automático." },
  { level: 3, name: "Senhor das Arenas Romanas", needs: 300, unlocks: "Reviravoltas e arcos de temporada no Decreto, governadores para filiais e mercados especiais." },
  { level: 4, name: "Imperador do Entretenimento", needs: 600, unlocks: "Central Imperial completa, decretos de festa imperial e campeonatos internacionais." },
  { level: 5, name: "Lenda Mundial", needs: 1000, unlocks: "Monumentos ao legado e espetáculos exclusivos sem limite." },
];

export const STAFF = [
  { id: "organizadores", name: "Organizadores", salary: 30, description: "Cada um melhora a satisfação dos eventos (+1,5, até 10).", max: 8 },
  { id: "tratadores", name: "Médicos e massagistas", salary: 35, description: "Recuperação mais rápida e menos lesões.", max: 6 },
  { id: "vendedores", name: "Vendedores", salary: 20, description: "Mais receita de comida e comércio (+5% cada).", max: 10 },
  { id: "segurancas", name: "Guardas", salary: 25, description: "Evitam tumultos e protegem nas crises.", max: 8 },
  { id: "administradores", name: "Administradores", salary: 45, description: "Cortam despesas fixas (-3% cada, até -18%).", max: 6 },
  { id: "olheiros", name: "Olheiros", salary: 40, description: "Encontram gladiadores melhores no mercado.", max: 4 },
] as const;

export type StaffId = (typeof STAFF)[number]["id"];

/** Funcionários que automatizam tarefas (Autonomia e Controle). */
export const MANAGERS = [
  { id: "diretor", name: "Diretor de eventos", salary: 180, authority: 1, description: "Planeja sozinho um evento por semana em Roma se você não planejar nenhum." },
  { id: "tesoureiro", name: "Tesoureiro", salary: 150, authority: 2, description: "Ajusta o preço dos ingressos ao público e guarda uma reserva para emergências." },
  { id: "governador", name: "Governadores das filiais", salary: 250, authority: 3, description: "Organizam eventos nas filiais delegadas toda semana." },
  { id: "pregoeiro", name: "Pregoeiro do Arena Bets", salary: 120, authority: 2, description: "Abre mercados de previsão para os eventos livres planejados." },
] as const;
