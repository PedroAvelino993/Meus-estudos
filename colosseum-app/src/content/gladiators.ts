// Gladiadores: personagens únicos (com história) e gerador de novos talentos.

import type { Gladiator, Look, Personality, Specialty } from "../core/types";
import { pickOne } from "../core/rng";

type Seed = Omit<Gladiator, "fame" | "popularity" | "xp" | "condition" | "morale" | "wins" | "losses" | "events" | "injuredWeeks" | "history" | "fameMark" | "hiredWeek"> & { fame: number; minEra: number };

const look = (skin: string, hair: string, hairStyle: Look["hairStyle"], beard: Look["beard"], helmet: Look["helmet"], armor: string, scar = false): Look => ({ skin, hair, hairStyle, beard, helmet, armor, scar });

/** Personagens únicos. Aparecem no mercado conforme a era e a fama do Coliseu. */
export const CHARACTERS: Seed[] = [
  { id: "maximus", name: "Maximus Vareno", age: 24, origin: "Roma", specialty: "demonstracao", personality: "disciplinado", strength: 48, technique: 55, charisma: 40, stamina: 52, fame: 12, salary: 40, minEra: 1, bio: "Filho de um ferreiro do Aventino, treina antes do sol nascer e nunca perde a calma. Sonha em lutar diante do imperador.", look: look("#d9a47c", "#3a2618", "curto", "curta", "galea", "#8a2a1f") },
  { id: "darius", name: "Darius Thrax", age: 29, origin: "Trácia", specialty: "habilidade", personality: "competitivo", strength: 66, technique: 78, charisma: 58, stamina: 64, fame: 68, salary: 260, minEra: 2, bio: "Venceu os jogos de Filipópolis três vezes. Odeia perder até no jogo de dados — e não esconde isso de ninguém.", look: look("#c48a62", "#1d140d", "longo", "cheia", "tracio", "#3d4a6b", true) },
  { id: "cassius", name: "Cassius Magnus", age: 31, origin: "Hispânia", specialty: "torneio", personality: "ambicioso", strength: 84, technique: 82, charisma: 80, stamina: 78, fame: 95, salary: 900, minEra: 4, legend: true, bio: "Campeão invicto de Corduba. Quer ser lembrado como o maior gladiador de todos os tempos e escolhe a dedo onde luta.", look: look("#c99068", "#0f0b09", "curto", "curta", "coroa", "#b88a2f", true) },
  { id: "livia", name: "Lívia Aurelia", age: 22, origin: "Óstia", specialty: "biga", personality: "carismatico", strength: 44, technique: 70, charisma: 76, stamina: 60, fame: 30, salary: 140, minEra: 2, bio: "Filha de um condutor de bigas, assumiu os cavalos do pai e virou a queridinha dos portos. Ri alto e corre mais alto ainda.", look: look("#e7b994", "#6b3a1f", "rabo", "nenhuma", "nenhum", "#2f6b4f") },
  { id: "brennus", name: "Brennus o Ruivo", age: 34, origin: "Gália", specialty: "demonstracao", personality: "temperamental", strength: 82, technique: 48, charisma: 52, stamina: 74, fame: 40, salary: 160, minEra: 2, bio: "Chefe de clã que trocou a guerra pelo espetáculo. Força bruta e um temperamento que esquenta a arquibancada — e às vezes a ele mesmo.", look: look("#f0c3a0", "#b5462a", "trancas", "cheia", "nenhum", "#6b4a2a") },
  { id: "nefer", name: "Neferet de Mênfis", age: 27, origin: "Egito", specialty: "espetaculo", personality: "showman", strength: 46, technique: 66, charisma: 88, stamina: 56, fame: 45, salary: 210, minEra: 2, bio: "Dançarina e atriz de festivais do Nilo. Transforma qualquer cena em lenda e qualquer derrota em drama.", look: look("#9c6a45", "#0e0a08", "longo", "nenhuma", "nenhum", "#c79a3a") },
  { id: "kaeso", name: "Kaeso Fabius", age: 19, origin: "Campânia", specialty: "habilidade", personality: "ambicioso", strength: 40, technique: 58, charisma: 50, stamina: 62, fame: 6, salary: 30, minEra: 1, bio: "Um garoto magro que apareceu na porta da arena pedindo uma chance. Aprende tudo na primeira vez.", look: look("#dcae86", "#2a1a10", "cacheado", "nenhuma", "nenhum", "#5a5a6b") },
  { id: "tullia", name: "Túlia Serena", age: 26, origin: "Roma", specialty: "torneio", personality: "disciplinado", strength: 58, technique: 72, charisma: 46, stamina: 70, fame: 22, salary: 90, minEra: 1, bio: "Ex-guarda do templo de Vesta. Fala pouco, erra menos ainda e não perdoa quem subestima uma mulher na arena.", look: look("#e3b48e", "#2b1a10", "rabo", "nenhuma", "galea", "#7a2a2a") },
  { id: "aksum", name: "Ezana de Axum", age: 30, origin: "Axum", specialty: "naval", personality: "leal", strength: 70, technique: 64, charisma: 60, stamina: 80, fame: 35, salary: 170, minEra: 2, bio: "Marinheiro do Mar Vermelho que já atravessou tempestades piores que qualquer naumaquia. Não abandona um companheiro.", look: look("#5e3b27", "#0f0b09", "careca", "curta", "nenhum", "#2b4f6b") },
  { id: "corvus", name: "Corvus Niger", age: 33, origin: "Sicília", specialty: "espetaculo", personality: "showman", strength: 56, technique: 60, charisma: 82, stamina: 58, fame: 50, salary: 230, minEra: 3, bio: "Ninguém sabe seu nome verdadeiro. Entra na arena de capa preta e sai de cena sempre com um truque novo.", look: look("#cf9a72", "#0b0b0b", "longo", "bigode", "murmillo", "#1c1c22") },
  { id: "spurius", name: "Spurius o Velho", age: 41, origin: "Úmbria", specialty: "demonstracao", personality: "preguicoso", strength: 62, technique: 74, charisma: 64, stamina: 40, fame: 28, salary: 70, minEra: 1, bio: "Lutou em vinte arenas e diz ter vencido todas. Treina pouco, reclama muito, mas ainda ensina truques que ninguém conhece.", look: look("#d8a07a", "#9a958d", "careca", "cheia", "nenhum", "#6b5a3a", true) },
  { id: "hyla", name: "Hila das Amazonas", age: 25, origin: "Capadócia", specialty: "habilidade", personality: "competitivo", strength: 64, technique: 76, charisma: 62, stamina: 72, fame: 52, salary: 240, minEra: 3, bio: "Arqueira e lutadora, vem de uma terra de lendas. Desafia os campeões em público e cumpre o que promete.", look: look("#c48a62", "#4a2a14", "trancas", "nenhuma", "nenhum", "#8a5a2a") },
  { id: "marcus", name: "Marcus Ferox", age: 28, origin: "Germânia", specialty: "torneio", personality: "temperamental", strength: 86, technique: 62, charisma: 48, stamina: 80, fame: 58, salary: 280, minEra: 3, bio: "Ex-legionário expulso por brigar com um centurião. Na arena, a raiva vira técnica — quase sempre.", look: look("#f0c3a0", "#c9a44c", "curto", "cheia", "murmillo", "#5a3a2a", true) },
  { id: "aurelio", name: "Aurélio Cantor", age: 23, origin: "Nápoles", specialty: "espetaculo", personality: "carismatico", strength: 38, technique: 54, charisma: 90, stamina: 50, fame: 18, salary: 80, minEra: 1, bio: "Cantava nas tavernas antes de subir na arena. Luta mais ou menos — mas a plateia canta junto.", look: look("#e7b994", "#2b1a10", "cacheado", "nenhuma", "nenhum", "#3a5a8a") },
  { id: "zenobia", name: "Zenóbia de Palmira", age: 29, origin: "Palmira", specialty: "biga", personality: "ambicioso", strength: 60, technique: 84, charisma: 78, stamina: 70, fame: 72, salary: 420, minEra: 4, legend: true, bio: "Rainha das corridas do Oriente. Diz que vai correr em Roma só quando Roma estiver à altura dela.", look: look("#b07a52", "#0e0a08", "longo", "nenhuma", "coroa", "#6b2a5a") },
  { id: "gaius", name: "Gaius Petro", age: 37, origin: "Roma", specialty: "naval", personality: "disciplinado", strength: 68, technique: 70, charisma: 54, stamina: 76, fame: 42, salary: 190, minEra: 3, bio: "Capitão aposentado da frota de Miseno. Comanda uma naumaquia como comandava uma galera: sem gritar.", look: look("#d8a07a", "#5a5a5a", "curto", "curta", "galea", "#2b4f6b") },
  { id: "ubaid", name: "Ubaid o Leão", age: 32, origin: "Numídia", specialty: "torneio", personality: "leal", strength: 80, technique: 72, charisma: 70, stamina: 82, fame: 78, salary: 520, minEra: 4, legend: true, bio: "Herói da Numídia, protetor dos mais novos no ludus. Jurou nunca lutar por quem trata gladiadores como objetos.", look: look("#4a2e1e", "#0f0b09", "careca", "cheia", "tracio", "#a87a2f", true) },
  { id: "flavia", name: "Flávia Corvina", age: 21, origin: "Ravena", specialty: "naval", personality: "carismatico", strength: 50, technique: 62, charisma: 74, stamina: 66, fame: 14, salary: 60, minEra: 2, bio: "Nadadora dos canais de Ravena. Aparece na arena inundada como se tivesse nascido na água — e talvez tenha.", look: look("#e3b48e", "#2b1a10", "rabo", "nenhuma", "nenhum", "#2b6b6b") },
  { id: "titus", name: "Titus Invictus", age: 35, origin: "Roma", specialty: "torneio", personality: "ambicioso", strength: 88, technique: 86, charisma: 86, stamina: 80, fame: 98, salary: 1200, minEra: 5, legend: true, bio: "O nome que as mães usam para fazer os filhos dormirem. Nunca perdeu em Roma — e cobra por isso.", look: look("#d9a47c", "#2b1a10", "curto", "curta", "coroa", "#c9a44c", true) },
  { id: "bryn", name: "Bryn das Brumas", age: 26, origin: "Britânia", specialty: "habilidade", personality: "temperamental", strength: 72, technique: 74, charisma: 56, stamina: 78, fame: 46, salary: 220, minEra: 4, bio: "Veio do fim do mundo numa caravana de mercadores. Luta como quem já perdeu tudo — e por isso não tem medo.", look: look("#f3cdb0", "#c96a2a", "trancas", "nenhuma", "nenhum", "#3a6b3a") },
  { id: "pollux", name: "Pólux", age: 24, origin: "Esparta", specialty: "habilidade", personality: "leal", strength: 74, technique: 68, charisma: 50, stamina: 74, fame: 26, salary: 110, minEra: 2, bio: "Um dos gêmeos espartanos. Luta melhor quando o irmão está por perto.", look: look("#d8a07a", "#3a2618", "curto", "curta", "galea", "#8a6a2a") },
  { id: "castor", name: "Castor", age: 24, origin: "Esparta", specialty: "demonstracao", personality: "competitivo", strength: 70, technique: 72, charisma: 54, stamina: 70, fame: 26, salary: 110, minEra: 2, bio: "O outro gêmeo. Jura que é o melhor dos dois — o irmão jura o contrário.", look: look("#d8a07a", "#3a2618", "cacheado", "curta", "galea", "#6a8a2a") },
  { id: "seraphina", name: "Serafina Vox", age: 28, origin: "Antioquia", specialty: "espetaculo", personality: "showman", strength: 52, technique: 70, charisma: 92, stamina: 60, fame: 80, salary: 600, minEra: 5, legend: true, bio: "A voz mais famosa do Oriente. Seus espetáculos começam com silêncio e terminam com a cidade inteira em pé.", look: look("#b8865e", "#0e0a08", "longo", "nenhuma", "coroa", "#6b2a8a") },
  { id: "rufus", name: "Rufus Pertinax", age: 30, origin: "Dalmácia", specialty: "biga", personality: "competitivo", strength: 64, technique: 80, charisma: 60, stamina: 72, fame: 62, salary: 300, minEra: 3, bio: "Correu pelos Verdes, depois pelos Azuis, depois por quem pagasse mais. Dizem que nunca deixou um cavalo cansado na pista.", look: look("#dcae86", "#6b3a1f", "curto", "bigode", "nenhum", "#2a5a2a") },
];

// ---------- Gerador de novos talentos ----------

const NAMES = ["Lúcio", "Quinto", "Décimo", "Sexto", "Ápio", "Névio", "Otávio", "Cneu", "Galba", "Silvano", "Varro", "Aulo", "Mânio", "Póstumo", "Vibio", "Tito", "Caio", "Flávio", "Júlio", "Calpúrnio", "Ásio", "Severo", "Oto", "Crispo", "Druso", "Fausto", "Hostílio", "Plácido", "Rúfio", "Sabino"];
const NAMES_F = ["Júlia", "Cornélia", "Aurélia", "Cláudia", "Valéria", "Prisca", "Marcela", "Pompônia", "Sabina", "Lúcia", "Fabíola", "Hortênsia", "Calpúrnia", "Domícia", "Emília"];
const EPITHETS = ["o Forte", "o Rápido", "Martelo", "o Silencioso", "Pé-de-Vento", "o Gaulês", "Mão-de-Ferro", "o Sorridente", "Leão Jovem", "o Teimoso", "Escudo-Largo", "Lobo do Tibre", "a Destemida", "Dente-de-Bronze", "o Poeta", "Olhos-de-Águia"];
const ORIGINS = ["Roma", "Campânia", "Etrúria", "Sicília", "Gália", "Hispânia", "Trácia", "Grécia", "Egito", "Numídia", "Germânia", "Síria", "Dácia", "Ilíria", "Britânia", "Capadócia"];
const SKINS = ["#f3cdb0", "#e7b994", "#d9a47c", "#c48a62", "#a8744e", "#8d5a3b", "#5e3b27", "#4a2e1e"];
const HAIRS = ["#0f0b09", "#2b1a10", "#3a2618", "#6b3a1f", "#b5462a", "#c9a44c", "#9a958d"];
const ARMORS = ["#8a2a1f", "#3d4a6b", "#2f6b4f", "#6b4a2a", "#5a5a6b", "#7a2a2a", "#2b4f6b", "#8a6a2a", "#4a3a6b"];
const PERSONALITIES: Personality[] = ["disciplinado", "competitivo", "ambicioso", "carismatico", "temperamental", "leal", "preguicoso", "showman"];
const SPECIALTIES: Specialty[] = ["demonstracao", "habilidade", "torneio", "espetaculo", "biga", "naval"];

const BIO_START = ["Cresceu nas ruas de", "Veio de uma família de agricultores de", "Serviu como remador numa galera de", "Era ajudante de ferreiro em", "Fugiu de uma dívida em", "Ganhou fama em feiras de"];
const BIO_END = ["Quer provar que não é só mais um.", "Diz que vai comprar uma casa para a mãe com o primeiro prêmio.", "Ninguém sabe muito sobre o passado dele.", "Treina com um entusiasmo que contagia o ludus.", "Tem medo de cavalos, mas não admite.", "Promete uma vitória a cada lua cheia."];

const clamp = (v: number, lo = 1, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

/** Gera um gladiador novo. `quality` (0–1) sobe com olheiros e com a era. */
export function generateGladiator(id: string, r: () => number, quality: number, era: number, specialties: Specialty[] = SPECIALTIES): Gladiator {
  const female = r() < 0.28;
  const base = 30 + quality * 40 + era * 3;
  const spread = () => clamp(base + (r() - 0.5) * 30);
  const specialty = pickOne(specialties, r);
  const personality = pickOne(PERSONALITIES, r);
  const origin = pickOne(ORIGINS, r);
  const name = `${pickOne(female ? NAMES_F : NAMES, r)} ${r() < 0.55 ? pickOne(EPITHETS, r) : pickOne(["Varo", "Mácer", "Lento", "Bruto", "Rufo", "Nasão", "Cipião", "Galo", "Pulcro", "Celso"], r)}`;
  const strength = spread();
  const technique = spread();
  const charisma = clamp(base - 5 + (r() - 0.5) * 40);
  const stamina = spread();
  const fame = clamp(r() * (8 + quality * 25 + era * 4), 0, 60);
  const skill = (strength + technique + stamina) / 3;
  return {
    id,
    name,
    age: 18 + Math.floor(r() * 16),
    origin,
    specialty,
    personality,
    strength,
    technique,
    charisma,
    stamina,
    fame,
    popularity: clamp(fame * 0.8 + r() * 20, 0),
    xp: 0,
    condition: 100,
    morale: 70,
    salary: Math.round(15 + skill * 0.6 + fame * 3),
    bio: `${pickOne(BIO_START, r)} ${origin}. ${pickOne(BIO_END, r)}`,
    look: {
      skin: pickOne(SKINS, r),
      hair: pickOne(HAIRS, r),
      hairStyle: pickOne(["curto", "longo", "careca", "trancas", "cacheado", "rabo"] as const, r),
      beard: female ? "nenhuma" : pickOne(["nenhuma", "curta", "cheia", "bigode"] as const, r),
      helmet: pickOne(["nenhum", "galea", "murmillo", "tracio", "nenhum"] as const, r),
      armor: pickOne(ARMORS, r),
      scar: r() < 0.2,
    },
    wins: 0,
    losses: 0,
    events: 0,
    injuredWeeks: 0,
    history: [],
    fameMark: fame,
    hiredWeek: 0,
  };
}

/** Transforma um personagem único em gladiador do jogo. */
export function fromCharacter(c: Seed): Gladiator {
  const { minEra: _m, ...rest } = c;
  return { ...rest, popularity: Math.round(c.fame * 0.9), xp: c.fame * 10, condition: 100, morale: 75, wins: Math.round(c.fame / 3), losses: Math.round(c.fame / 9), events: Math.round(c.fame / 2), injuredWeeks: 0, history: [], fameMark: c.fame, hiredWeek: 0 };
}

/** Rivalidades e amizades que já existem entre personagens únicos. */
export const STARTING_RELATIONS = [
  { a: "castor", b: "pollux", kind: "amizade" as const, story: "Gêmeos de Esparta: brigam entre si, mas ninguém mais pode tocar no outro." },
  { a: "darius", b: "marcus", kind: "rivalidade" as const, story: "Darius chamou Marcus de 'legionário sem legião'. Marcus jurou calar a boca dele na arena." },
  { a: "cassius", b: "titus", kind: "rivalidade" as const, story: "Dois invictos. Só um pode continuar invicto." },
  { a: "livia", b: "rufus", kind: "rivalidade" as const, story: "Rufus diz que Lívia só ganha porque os cavalos são do pai dela." },
  { a: "ubaid", b: "maximus", kind: "amizade" as const, story: "Ubaid treinou Maximus quando ele ainda era um aprendiz." },
  { a: "nefer", b: "seraphina", kind: "rivalidade" as const, story: "As duas maiores artistas do Oriente. O palco é pequeno demais para as duas." },
  { a: "brennus", b: "bryn", kind: "amizade" as const, story: "Os dois do norte frio se reconhecem de longe." },
  { a: "zenobia", b: "livia", kind: "rivalidade" as const, story: "A rainha do Oriente contra a menina dos portos." },
];

// ---------- Previsores fictícios do Arena Bets ----------

export const PREDICTOR_NAMES = [
  ["Aulo, o Padeiro", "Subura"], ["Cornélia Sábia", "Palatino"], ["Velho Ênio", "Óstia"], ["Tércio dos Dados", "Trastevere"], ["Prisca Afortunada", "Esquilino"],
  ["Mestre Lúcio", "Aventino"], ["Gêmeos Fábio e Fabiano", "Campo de Marte"], ["Dona Hortênsia", "Célio"], ["Severo Contador", "Fórum"], ["Ápio Pé-Quente", "Viminal"],
  ["Júlia dos Ventos", "Quirinal"], ["Rúfio Calado", "Capitólio"], ["Marcela Olho-Vivo", "Velabro"], ["Sabino da Taberna", "Subura"], ["Calpúrnia Pergaminho", "Palatino"],
  ["Ásio o Grego", "Óstia"], ["Druso Sortudo", "Trastevere"], ["Emília Cálculo", "Esquilino"], ["Plácido Paciente", "Aventino"], ["Vibio Ventania", "Célio"],
  ["Domícia Áugure", "Fórum"], ["Névio Teimoso", "Viminal"], ["Lúcia Lanterna", "Quirinal"], ["Hostílio Barbudo", "Capitólio"], ["Fausto Feliz", "Velabro"],
  ["Valéria Valente", "Campo de Marte"], ["Galba Ganancioso", "Subura"], ["Pompônia Precisa", "Palatino"], ["Crispo Cético", "Óstia"], ["Oto Otimista", "Trastevere"],
];
