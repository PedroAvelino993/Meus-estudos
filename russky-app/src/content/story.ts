// A história: um semestre de intercâmbio em Светлоре́ченск, uma cidade fictícia às margens do rio Светла́я.
// Os capítulos se abrem conforme as unidades são concluídas e usam o que acabou de ser estudado.

import type { Flags } from "../core/convo";
import type { Mood } from "./characters";

export interface Place {
  id: string;
  ru: string;
  name: string;
  description: string;
  /** Unidade que desbloqueia o lugar (null = desde o início). */
  unlockedBy: string | null;
  color: string;
  /** Posição no mapa ilustrado (0–100). */
  x: number;
  y: number;
}

export const CITY = { ru: "Светлоре'ченск", pt: "Svetlorechensk" };

export const PLACES: Place[] = [
  { id: "vokzal", ru: "Вокза'л", name: "Estação de trem", description: "Onde tudo começa. Placas, avisos e a primeira leitura de verdade.", unlockedBy: null, color: "#D63A2F", x: 14, y: 70 },
  { id: "universitet", ru: "Университе'т", name: "Universidade", description: "Aulas com a Irina Petrovna e encontros nos corredores.", unlockedBy: "u3-1", color: "#3D4B8C", x: 52, y: 22 },
  { id: "park", ru: "Парк", name: "Parque Svetlaia", description: "À beira do rio, bom para conversar e passear.", unlockedBy: "u2-4", color: "#1F8A70", x: 30, y: 38 },
  { id: "kvartira", ru: "Кварти'ра", name: "Apartamento da Anya", description: "Chá, bolo, fotos da família e o gato Barsik.", unlockedBy: "u4-4", color: "#E05A47", x: 74, y: 42 },
  { id: "kafe", ru: "Кафе' «Самова'р»", name: "Café Samovar", description: "O café do Dmitri, com o melhor borsch da cidade.", unlockedBy: "u4-2", color: "#8C5A3C", x: 40, y: 62 },
  { id: "metro", ru: "Метро'", name: "Metrô", description: "Estações, passagens e direções.", unlockedBy: "u5-2", color: "#7B4BC4", x: 62, y: 72 },
  { id: "rynok", ru: "Ры'нок", name: "Mercado", description: "Queijo, frutas e pechincha.", unlockedBy: "u5-3", color: "#C77D1A", x: 84, y: 76 },
  { id: "knizhny", ru: "Кни'жный «Страни'ца»", name: "Livraria Stranitsa", description: "Em breve: leitura de textos e histórias (Mundo 6).", unlockedBy: "future", color: "#5A6B7B", x: 22, y: 16 },
  { id: "muzey", ru: "Музе'й", name: "Museu da cidade", description: "Em breve: passado e narrativas (Mundo 7).", unlockedBy: "future", color: "#5A6B7B", x: 86, y: 18 },
];

export type Panel =
  | { k: "narr"; pt: string; ru?: string }
  | { k: "say"; who: string; ru: string; pt: string; mood?: Mood }
  | { k: "sign"; ru: string; prompt: string; options: string[]; answer: number; explain: string }
  | { k: "choice"; prompt: string; options: { pt: string; set: Flags; reply?: { who: string; ru: string; pt: string } }[] }
  | { k: "mission"; convo: string; intro: string };

export interface Chapter {
  id: string;
  n: number;
  title: string;
  ru: string;
  place: string;
  requires: string[];
  summary: string;
  panels: Panel[];
  reward: { xp: number; text: string };
}

export const CHAPTERS: Chapter[] = [
  {
    id: "ch0",
    n: 0,
    title: "A carta",
    ru: "Письмо'",
    place: "vokzal",
    requires: [],
    summary: "Uma bolsa de estudos, uma cidade desconhecida e um alfabeto novo.",
    panels: [
      { k: "narr", pt: "São Paulo, julho. Chega um e-mail com um anexo: «Поздравля́ем!». Você ainda não sabe ler, mas o texto em português embaixo explica." },
      { k: "narr", pt: "Você ganhou uma bolsa para um semestre na Universidade de Svetlorechensk, uma cidade às margens do rio Svetlaia, a algumas horas de Moscou." },
      { k: "narr", pt: "A carta é assinada por Ири́на Петро́вна, coordenadora do curso de russo para estrangeiros. Ela escreve: «Leia as placas da estação. Uma estudante vai buscar você.»" },
      {
        k: "choice",
        prompt: "Antes de embarcar, por que você quer aprender russo?",
        options: [
          { pt: "Pela cultura: livros, música, cinema.", set: { motivo: "cultura" } },
          { pt: "Para viajar e conhecer lugares novos.", set: { motivo: "viagem" } },
          { pt: "Pelas pessoas: quero fazer amigos russos.", set: { motivo: "pessoas" } },
        ],
      },
      { k: "narr", pt: "Primeiro passo: o alfabeto. Nada de transliteração para sempre — o objetivo é ler as placas sozinho quando o trem chegar." },
    ],
    reward: { xp: 10, text: "O mapa de Svetlorechensk está no seu bolso." },
  },
  {
    id: "ch1",
    n: 1,
    title: "A estação",
    ru: "Вокза'л",
    place: "vokzal",
    requires: ["u1-3"],
    summary: "Ler as placas da estação de verdade, sem ajuda.",
    panels: [
      { k: "narr", pt: "O trem para. Você desce com a mala, cercado de placas em cirílico. Hora de usar o que aprendeu." },
      { k: "sign", ru: "КА'ССА", prompt: "Você precisa comprar um bilhete de volta para o mês que vem. Que placa procura?", options: ["Bilheteria / caixa", "Saída", "Farmácia"], answer: 0, explain: "КА'ССА = «kássa», caixa ou bilheteria." },
      { k: "sign", ru: "АПТЕ'КА", prompt: "Esqueceu o remédio para dor de cabeça. Esta placa ajuda?", options: ["Sim: é uma farmácia", "Não: é um banco", "Não: é um táxi"], answer: 0, explain: "АПТЕ'КА = «aptiéka», farmácia." },
      { k: "sign", ru: "ТАКСИ'", prompt: "E esta placa, na saída?", options: ["Táxi", "Metrô", "Parque"], answer: 0, explain: "ТАКСИ' = «taksí»." },
      { k: "sign", ru: "МЕТРО'", prompt: "E esta, com um grande «М» vermelho?", options: ["Metrô", "Mercado", "Museu"], answer: 0, explain: "МЕТРО' = «mitró». O «М» vermelho marca as estações." },
      {
        k: "choice",
        prompt: "Como você vai até a universidade?",
        options: [
          { pt: "De metrô — é mais barato e mais russo.", set: { transporte: "metro" } },
          { pt: "De táxi — a mala está pesada.", set: { transporte: "taksi" } },
        ],
      },
      { k: "narr", pt: "Antes de sair, você vê uma garota de cabelo ruivo segurando uma placa: «СТУДЕ́НТЫ ИЗ БРАЗИ́ЛИИ». Ela está procurando você." },
    ],
    reward: { xp: 20, text: "Lugar desbloqueado: a estação (Вокза́л)." },
  },
  {
    id: "ch2",
    n: 2,
    title: "Primeiro encontro",
    ru: "Пе'рвая встре'ча",
    place: "vokzal",
    requires: ["u2-3"],
    summary: "Conhecer a Anya, que veio buscar você na estação.",
    panels: [
      { k: "narr", pt: "A garota da placa acena. Ela sorri e vem na sua direção." },
      { k: "say", who: "anya", ru: "Приве'т!", pt: "Oi!", mood: "happy" },
      { k: "mission", convo: "c-anya-vokzal", intro: "Responda à Anya em russo. Ela vai perguntar seu nome e de onde você é." },
      { k: "narr", pt: "A Anya anota o seu telefone num papel: «До за́втра!». Você tem a sua primeira amiga na cidade." },
    ],
    reward: { xp: 30, text: "Personagem conhecida: А́ня. A seção Conversação foi liberada." },
  },
  {
    id: "ch3",
    n: 3,
    title: "A primeira aula",
    ru: "Пе'рвый уро'к",
    place: "universitet",
    requires: ["u3-2"],
    summary: "Apresentar-se à professora Irina Petrovna — no registro formal.",
    panels: [
      { k: "narr", pt: "Prédio principal da universidade, sala 214. A professora já está escrevendo no quadro: «Здра́вствуйте!»" },
      { k: "say", who: "irina", ru: "До'брое у'тро! Сади'тесь, пожа'луйста.", pt: "Bom dia! Sentem-se, por favor.", mood: "happy" },
      { k: "narr", pt: "Ela chama os alunos um por um. Chegou a sua vez." },
      { k: "mission", convo: "c-irina-urok", intro: "Apresente-se à professora. Lembre: com ela, use o formal (вы, Здра́вствуйте)." },
    ],
    reward: { xp: 30, text: "Personagem conhecida: Ири́на Петро́вна." },
  },
  {
    id: "ch4",
    n: 4,
    title: "Chá na casa da Anya",
    ru: "Чай у А'ни",
    place: "kvartira",
    requires: ["u3-4"],
    summary: "Fotos de família, um gato chamado Barsik e muitas perguntas.",
    panels: [
      { k: "narr", pt: "Sábado à tarde. A Anya convidou você para conhecer o apartamento dela, perto do parque." },
      { k: "say", who: "anya", ru: "Проходи'! Э'то моя' кварти'ра.", pt: "Entra! Este é o meu apartamento.", mood: "happy" },
      { k: "narr", pt: "Um gato cinza enorme pula do sofá e cheira o seu sapato." },
      { k: "mission", convo: "c-anya-semya", intro: "A Anya mostra fotos da família. Fale da sua: irmãos, idade, animais." },
    ],
    reward: { xp: 30, text: "Lugar visitado: o apartamento da Anya." },
  },
  {
    id: "ch5",
    n: 5,
    title: "Um novo amigo",
    ru: "Но'вый друг",
    place: "universitet",
    requires: ["u4-3"],
    summary: "O Maksim quer saber do que você gosta e tem um plano para o sábado.",
    panels: [
      { k: "narr", pt: "No corredor, um rapaz de fones de ouvido acena para você. A Anya tinha falado dele." },
      {
        k: "choice",
        prompt: "Ele parece animado. Como você reage?",
        options: [
          { pt: "Acena de volta e vai falar com ele.", set: { maksimFirst: "voce" }, reply: { who: "maksim", ru: "О, приве'т!", pt: "Opa, oi!" } },
          { pt: "Espera ele vir até você.", set: { maksimFirst: "ele" }, reply: { who: "maksim", ru: "Эй! Подожди'!", pt: "Ei! Espera!" } },
        ],
      },
      { k: "mission", convo: "c-maksim-vykhodnye", intro: "Converse com o Maksim sobre o que vocês gostam e combinem algo para o fim de semana." },
    ],
    reward: { xp: 30, text: "Personagem conhecido: Макси́м." },
  },
  {
    id: "ch6",
    n: 6,
    title: "Café Samovar",
    ru: "Кафе' «Самова'р»",
    place: "kafe",
    requires: ["u5-1"],
    summary: "Pedir sozinho num café — e não se assustar com o preço do borsch.",
    panels: [
      { k: "narr", pt: "Chove. O letreiro «САМОВА́Р» brilha do outro lado da rua. Lá dentro cheira a chá preto e pão quente." },
      { k: "say", who: "dmitry", ru: "До'брый день!", pt: "Boa tarde!", mood: "happy" },
      { k: "mission", convo: "c-dmitry-kafe", intro: "Peça uma bebida e algo para comer, pergunte o preço, peça a conta e pague." },
    ],
    reward: { xp: 30, text: "Lugar desbloqueado: Кафе́ «Самова́р»." },
  },
  {
    id: "ch7",
    n: 7,
    title: "Agora quem ajuda é você",
    ru: "Тепе'рь помога'ешь ты",
    place: "metro",
    requires: ["u5-2"],
    summary: "Uma turista perdida pede ajuda — e ela já morou no Brasil.",
    panels: [
      { k: "narr", pt: "Saindo do metrô, uma mulher de boina olha para o mapa do celular, confusa." },
      { k: "mission", convo: "c-sofiya-doroga", intro: "Ensine o caminho até a estação de trem: em frente e depois à direita." },
      { k: "narr", pt: "Algumas semanas atrás, você precisava de ajuda para ler uma placa. Hoje, você ensinou o caminho em russo." },
    ],
    reward: { xp: 40, text: "Personagem conhecida: Софи́я." },
  },
];

export function chapterOf(id: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.id === id);
}
