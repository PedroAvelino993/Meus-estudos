// Estrutura da história, finais, eventos do mundo, desafios do dia e golpes rápidos.
// Tudo é ficção: pessoas, empresas, contas e cartões são inventados e aparecem sempre mascarados.

import type { Attrs, Mission, Outcome } from "../core/types";
import { gb } from "./missions/helpers";

// ---------- Capítulos ----------

export interface Chapter {
  n: number;
  title: string;
  subtitle: string;
  intro: string;
  /** Condições para concluir o capítulo. */
  goal: { money?: number; items?: string[]; story: string[]; anyOf?: { missions: string[]; count: number } };
  goalText: string;
}

export const CHAPTERS: Chapter[] = [
  {
    n: 1,
    title: "Primeiros trocados",
    subtitle: "Vila Jardim",
    intro: "Você chega a Vila Áurea com uma mala, ₢ 50 e uma dívida com o Lobo, um agiota que não costuma esperar. Não tem emprego, não tem nome. Tem lábia. Na Vila Jardim todo mundo se conhece — e todo mundo tem um ponto fraco. Comece pequeno, sem chamar atenção.",
    goal: { money: 400, story: ["m-helena"], anyOf: { missions: ["m-antonio", "m-cida", "m-jorge", "m-bia"], count: 2 } },
    goalText: "Juntar ₢ 400, aplicar o golpe na Helena e em pelo menos mais duas pessoas da Vila Jardim.",
  },
  {
    n: 2,
    title: "O esquema",
    subtitle: "Mercado Central e Campus Aurora",
    intro: "O Lobo foi pago e alguém reparou em você: o Grupo Zênite, a quadrilha que controla os golpes da cidade. No Mercado, o dinheiro sujo circula pelas bancas; no Campus, um pesquisador constrói o Sentinela, um sistema para caçar gente como você. Hora de equipamento melhor e de entrar no esquema.",
    goal: { items: ["leitor"], story: ["m-valdir"], anyOf: { missions: ["m-kenji", "m-larissa", "m-rafaela", "m-osvaldo", "m-mariana", "m-lucas", "m-heitor", "m-taina", "m-paulo"], count: 4 } },
    goalText: "Comprar o leitor de cartão, entrar no esquema do Valdir e aplicar mais quatro golpes no Mercado ou no Campus.",
  },
  {
    n: 3,
    title: "Velhas fortunas",
    subtitle: "Largo do Relógio",
    intro: "No centro histórico, famílias antigas guardam heranças que ninguém conta direito. Mas uma jornalista do jornal O Relógio está juntando reclamações de vítimas, e o seu rosto começa a aparecer nos depoimentos. Tire Clara Bastos do seu rastro e alcance a maior herança do Largo.",
    goal: { money: 2500, story: ["m-clara", "m-conceicao"] },
    goalText: "Juntar ₢ 2.500, despistar a jornalista Clara e aplicar o golpe da herança na Dona Conceição.",
  },
  {
    n: 4,
    title: "Peixe grande",
    subtitle: "Torres do Porto e Alto das Palmeiras",
    intro: "Golpe de rua paga o aluguel; golpe de escritório paga uma vida. Com uma empresa de fachada, você entra nas Torres do Porto, onde transferências milionárias saem com um e-mail. Diego Salazar, o golpista de estimação do Zênite, quer você fora do jogo.",
    goal: { items: ["identidade"], story: ["m-fernanda", "m-diego"], anyOf: { missions: ["m-yara", "m-vitoria", "m-gustavo", "m-sophia", "m-henrique"], count: 1 } },
    goalText: "Montar a empresa de fachada, aplicar o golpe na diretora Fernanda, derrubar o Diego e fechar mais um golpe grande.",
  },
  {
    n: 5,
    title: "O cofre da cidade",
    subtitle: "Paço Municipal",
    intro: "O Fundo Áurea guarda o dinheiro das obras da cidade, e só três pessoas podem mexer nele: a secretária de Obras, um vereador com o rabo preso e o prefeito. Um último golpe, o maior da história de Vila Áurea. Depois disso, sumir — ou ser pego tentando.",
    goal: { story: ["m-roberto"] },
    goalText: "Convencer o prefeito a transferir o Fundo Áurea.",
  },
];

// ---------- Finais ----------

export interface Ending {
  id: string;
  title: string;
  text: string;
  /** Condição (avaliada em ordem). */
  when: (s: { outcome: Outcome; heat: number; arrests: number; money: number; liesCaught: number }) => boolean;
}

export const ENDINGS: Ending[] = [
  {
    id: "preso",
    title: "Atrás das grades",
    text: "Na terceira vez, nem o melhor advogado resolve. A Operação Lábia apreende tudo: o notebook, os cartões, o caderno de mentiras. No julgamento, uma por uma, as vítimas contam como você era simpático. Vila Áurea vai lembrar do seu nome — escrito num processo.",
    when: (s) => s.arrests >= 3,
  },
  {
    id: "fantasma",
    title: "O fantasma de Vila Áurea",
    text: "O dinheiro do Fundo Áurea passa por doze contas e some numa sexta-feira à noite. Quando a polícia chega ao escritório da sua empresa, encontra só uma planta de plástico e um contrato de aluguel em nome de ninguém. Meses depois, um cartão-postal chega à pensão da Dona Cida, sem remetente. Ela nunca entendeu de quem era.",
    when: (s) => s.outcome === "great" && s.arrests === 0 && s.heat < 60,
  },
  {
    id: "chefe",
    title: "O novo dono do Zênite",
    text: "Com o Fundo Áurea nas mãos e o Diego fora do caminho, o Grupo Zênite tem um novo chefe. Os golpistas da cidade agora pagam pedágio para você. Você nunca mais aplica um golpe com as próprias mãos — e nunca mais dorme sem olhar a porta duas vezes.",
    when: (s) => s.money >= 15000,
  },
  {
    id: "fuga",
    title: "Fuga pela fronteira",
    text: "Parte do dinheiro sai antes de o banco bloquear as contas. Você pega um ônibus de madrugada com uma mochila e um nome novo. Vila Áurea fica para trás, com um mandado de prisão no seu nome e uma pergunta que a cidade inteira repete: como ninguém percebeu?",
    when: () => true,
  },
];

// ---------- Eventos do mundo ----------

export interface WorldEvent {
  id: string;
  title: string;
  text: string;
  /** Humor extra por bairro ("all" = todos). */
  mood?: Record<string, number>;
  fareMult?: number;
  shopDiscount?: number;
  gigBonus?: number;
  /** Calor a mais por golpe neste dia (multiplicador). */
  heatMult?: number;
  /** Mudança direta na conversa (ex.: todo mundo mais desconfiado). */
  start?: Partial<Attrs>;
  weight: number;
  minChapter?: number;
}

export const EVENTS: WorldEvent[] = [
  { id: "sol", title: "Dia de sol", text: "Céu limpo e calor bom. A cidade está de bom humor — e distraída.", mood: { all: 6 }, weight: 4 },
  { id: "chuva", title: "Chuva forte", text: "Temporal desde a madrugada. Ônibus atrasados, gente irritada e com pressa.", mood: { all: -8 }, fareMult: 1.5, start: { patience: -4 }, weight: 3 },
  { id: "jogo", title: "Clássico de futebol", text: "Ferroviário Áureo x Portuários hoje à noite. Ninguém presta atenção em mais nada.", mood: { jardim: 10, torres: 4 }, start: { suspicion: -4 }, weight: 2 },
  { id: "festival", title: "Festival do Largo", text: "Música e barracas no centro histórico. Multidão é ótima para quem não quer ser lembrado.", mood: { largo: 12 }, gigBonus: 1.3, heatMult: 0.7, weight: 2, minChapter: 3 },
  { id: "dia-feira", title: "Dia de feira grande", text: "O Mercado Central está lotado: muito dinheiro vivo circulando.", mood: { mercado: 4 }, start: { patience: -6 }, gigBonus: 1.4, weight: 2, minChapter: 2 },
  { id: "provas", title: "Semana de provas", text: "No Campus, todo mundo está tenso e sem tempo.", mood: { campus: -8 }, start: { patience: -5 }, weight: 2, minChapter: 2 },
  { id: "greve-onibus", title: "Greve de ônibus", text: "Sem transporte público: táxis cobram o dobro.", fareMult: 2, mood: { all: -4 }, weight: 1 },
  { id: "promocao", title: "Saldão no mercado clandestino", text: "Um receptador está queimando estoque: ferramentas e disfarces com 25% de desconto hoje.", shopDiscount: 0.25, weight: 2 },
  { id: "blitz", title: "Operação policial", text: "Viaturas em todos os bairros e a delegacia pedindo denúncias pelo rádio. Qualquer golpe hoje gera o dobro de calor.", heatMult: 2, start: { suspicion: 6 }, weight: 2, minChapter: 2 },
  { id: "campanha", title: "Campanha contra golpes", text: "A prefeitura espalhou cartazes: «Desconfie de quem pede seus dados». As pessoas estão mais atentas.", start: { suspicion: 8 }, weight: 2, minChapter: 2 },
  { id: "feriado", title: "Feriado municipal", text: "Aniversário da cidade: escritórios fechados, praças cheias e gente sem pressa.", mood: { all: 8 }, start: { patience: 8 }, weight: 1 },
  { id: "eleicao", title: "Clima de eleição", text: "Carros de som e santinhos. No Paço, todo mundo mede cada palavra.", mood: { paco: -6 }, start: { suspicion: 4 }, weight: 2, minChapter: 4 },
  { id: "pagamento", title: "Dia de pagamento", text: "Salários e aposentadorias caíram hoje. Todo mundo com dinheiro na conta e vontade de gastar.", start: { interest: 6 }, gigBonus: 1.2, weight: 2 },
];

// ---------- Desafios do dia ----------

export interface DayStats {
  talks: number;
  deals: number;
  /** Golpes que deram certo sem ninguém perceber nenhuma contradição. */
  dealsNoBluff: number;
  needsFound: number;
  earned: number;
  humorHits: number;
  walkouts: number;
  highAffinity: number;
  newPeople: number;
}

export function emptyDayStats(): DayStats {
  return { talks: 0, deals: 0, dealsNoBluff: 0, needsFound: 0, earned: 0, humorHits: 0, walkouts: 0, highAffinity: 0, newPeople: 0 };
}

export interface Challenge {
  id: string;
  title: string;
  target: number;
  value: (d: DayStats) => number;
  reward: { money: number; xp: number };
}

export const CHALLENGES: Challenge[] = [
  { id: "conversas", title: "Puxe conversa com 3 pessoas", target: 3, value: (d) => d.talks, reward: { money: 30, xp: 30 } },
  { id: "limpo", title: "Aplique um golpe sem ninguém perceber uma contradição", target: 1, value: (d) => d.dealsNoBluff, reward: { money: 50, xp: 40 } },
  { id: "descobrir", title: "Descubra 2 pontos fracos", target: 2, value: (d) => d.needsFound, reward: { money: 40, xp: 40 } },
  { id: "ganhar", title: "Arranque ₢ 150 em golpes", target: 150, value: (d) => d.earned, reward: { money: 40, xp: 30 } },
  { id: "humor", title: "Faça 2 vítimas rirem", target: 2, value: (d) => d.humorHits, reward: { money: 25, xp: 30 } },
  { id: "afinidade", title: "Termine uma conversa com a vítima gostando muito de você", target: 1, value: (d) => d.highAffinity, reward: { money: 35, xp: 40 } },
  { id: "novos", title: "Conheça 2 alvos novos", target: 2, value: (d) => d.newPeople, reward: { money: 30, xp: 30 } },
  { id: "acordos", title: "Aplique 2 golpes", target: 2, value: (d) => d.deals, reward: { money: 60, xp: 50 } },
];

// ---------- Golpes rápidos (missões geradas, repetíveis) ----------

export interface GigTemplate {
  id: string;
  title: string;
  type: Mission["type"];
  client: string;
  brief: string;
  objective: string;
  beats: Mission["beats"];
  negotiation?: (tier: number) => Mission["negotiation"];
  endings: Mission["endings"];
  /** O que a vítima entrega (valores multiplicados pela classe do bairro). */
  loot?: { kind: "cartao" | "dados" | "senha" | "acesso" | "documento"; label: string; value: number }[];
}

export const GIGS: GigTemplate[] = [
  {
    id: "bilhete",
    title: "O bilhete premiado",
    type: "pitch",
    client: "Golpe próprio",
    brief: "Você tem um bilhete de loteria «premiado» que não pode resgatar porque «está sem documento». {name} pode ficar com uma parte do prêmio — basta adiantar um dinheiro para você ir embora da cidade hoje.",
    objective: "Fazer {name} comprar a sua parte do bilhete.",
    beats: [
      {
        id: "abertura",
        npc: ["Bilhete premiado? Isso não é aquele golpe antigo?", "Hum. Por que você mesmo não vai buscar o prêmio?"],
        options: [
          { id: "documento", text: "Explicar que perdeu os documentos e o ônibus para a sua cidade sai hoje", tactic: "explain", claim: { key: "motivo", value: "documento", label: "você perdeu os documentos" }, reply: gb("Sem documento não resgata mesmo… é verdade.", "Todo mundo tem uma desculpa.") },
          { id: "conferir", text: "Sugerir que {name} confira o resultado na lotérica ali da esquina", tactic: "evidence", reply: gb("Deu mesmo! Nossa senhora.", "Conferir eu confiro, mas e daí?") },
          { id: "mae", text: "Contar que precisa do dinheiro para visitar a mãe doente", tactic: "empathy", claim: { key: "motivo", value: "mae", label: "você precisa visitar a mãe doente" }, reply: gb("Ah, coitado. Mãe é mãe.", "Hum. Sei.") },
        ],
      },
      {
        id: "bote",
        canClose: true,
        npc: ["E quanto você quer adiantado?", "Tá… e como a gente faz isso?"],
        options: [
          { id: "metade", text: "Oferecer metade do prêmio por um adiantamento pequeno", tactic: "concession", reply: gb("Metade do prêmio? Por isso? …Nossa.", "Ninguém dá metade de nada.") },
          { id: "pressa", text: "Dizer que o ônibus sai em uma hora e não dá para esperar", tactic: "urgency", reply: gb("Uma hora? Então tem que ser agora.", "Pressa assim é suspeita.") },
        ],
      },
    ],
    endings: {
      great: "{name} adianta o dinheiro e ainda te deseja boa viagem. O bilhete, claro, não vale nada.",
      good: "{name} adianta o dinheiro e fica com um bilhete sem valor.",
      partial: "{name} adianta só um pouco, desconfiado.",
      fail: "{name} manda você procurar outra pessoa.",
      walkout: "{name} reconhece o golpe e vai embora falando alto.",
    },
  },
  {
    id: "tecnico",
    title: "O técnico da internet",
    type: "impersonation",
    client: "Golpe próprio",
    brief: "Com uniforme e crachá, você bate na porta de {name} como «técnico da operadora» fazendo um «recadastro obrigatório» para a internet não ser cortada.",
    objective: "Conseguir os dados e o cartão cadastrado de {name}.",
    loot: [
      { kind: "dados", label: "dados pessoais de {name}", value: 60 },
      { kind: "cartao", label: "cartão de {name}", value: 300 },
    ],
    beats: [
      {
        id: "abertura",
        npc: ["Recadastro? Ninguém me avisou de recadastro.", "A internet vai ser cortada? Mas eu pago em dia!"],
        options: [
          { id: "carta", text: "Dizer que a operadora mandou carta e mensagem há duas semanas", tactic: "authority", claim: { key: "aviso", value: "carta", label: "a operadora mandou carta" }, reply: gb("Carta? Deve ter ido para o lixo junto com a propaganda.", "Eu não recebi carta nenhuma.") },
          { id: "vizinhos", text: "Mostrar a «lista» dos vizinhos que já fizeram o recadastro", tactic: "socialProof", reply: gb("A vizinha do lado fez? Então tá.", "Lista qualquer um faz.") },
          { id: "rapido", text: "Garantir que leva dois minutos e evita o corte", tactic: "concession", reply: gb("Dois minutos eu tenho.", "Todo técnico diz dois minutos.") },
        ],
      },
      {
        id: "dados",
        canClose: true,
        npc: ["E o que você precisa?", "Tá. O que eu tenho que fazer?"],
        options: [
          { id: "confirmar", text: "Pedir só para «confirmar» os dados e o cartão de pagamento cadastrado", tactic: "explain", reply: gb("Só confirmar? Tá, anota aí.", "Cartão? Para quê cartão?") },
          { id: "brinde", text: "Dizer que quem recadastra hoje ganha um mês de velocidade dobrada", tactic: "reframe", reply: gb("Velocidade dobrada? Opa.", "Brinde demais é estranho.") },
        ],
      },
    ],
    endings: {
      great: "{name} passa tudo e ainda oferece um cafezinho ao «técnico».",
      good: "{name} passa os dados e o cartão sem desconfiar.",
      partial: "{name} passa os dados, mas não o cartão.",
      fail: "{name} diz que vai ligar para a operadora antes.",
      walkout: "{name} fecha a porta e pega o telefone.",
    },
  },
  {
    id: "rifa",
    title: "A rifa da creche",
    type: "pitch",
    client: "Golpe próprio",
    brief: "Um talão de rifa impresso em casa, uma «creche do bairro» que não existe e um prêmio que ninguém vai receber. {name} tem cara de quem ajuda.",
    objective: "Vender o máximo de números para {name}.",
    beats: [
      {
        id: "abertura",
        npc: ["Rifa de quê?", "Para qual creche é isso?"],
        options: [
          { id: "telhado", text: "Contar que o dinheiro vai para o telhado da creche, que chove dentro", tactic: "empathy", reply: gb("Chovendo nas crianças? Que horror.", "Toda rifa é para um telhado.") },
          { id: "premio", text: "Mostrar a foto do prêmio: uma moto zero", tactic: "evidence", reply: gb("Uma moto? Por esse preço?", "Moto de rifa nunca sai.") },
          { id: "conhecida", text: "Dizer que a Dona Cida comprou dez números", tactic: "socialProof", claim: { key: "cida", value: "dez", label: "a Dona Cida comprou dez números" }, reply: gb("A Cida? Então é coisa séria.", "Vou perguntar para ela.") },
        ],
      },
      {
        id: "bote",
        canClose: true,
        npc: ["Quanto é o número?", "Tá. Quantos números eu pego?"],
        options: [
          { id: "combo", text: "Oferecer cinco números pelo preço de quatro", tactic: "concession", reply: gb("Cinco por quatro? Fechado.", "Desconto em rifa?") },
          { id: "sorte", text: "Brincar que tem cara de quem ganha rifa", tactic: "humor", reply: gb("Ha! Tomara!", "Nunca ganhei nada na vida.") },
        ],
      },
    ],
    endings: {
      great: "{name} compra um talão inteiro e promete divulgar.",
      good: "{name} compra vários números de uma rifa que nunca vai ser sorteada.",
      partial: "{name} compra um número só, por educação.",
      fail: "{name} não compra nada.",
      walkout: "{name} encerra a conversa, desconfiado.",
    },
  },
  {
    id: "entrega",
    title: "Taxa de entrega",
    type: "clone",
    client: "Golpe próprio",
    brief: "Uma caixa vazia bem embrulhada, um boné de transportadora e uma maquininha. Você entrega um «presente» para {name}, mas há uma pequena «taxa de entrega» a pagar no cartão.",
    objective: "Fazer {name} passar o cartão na sua maquininha.",
    loot: [{ kind: "cartao", label: "cartão de {name}", value: 350 }],
    beats: [
      {
        id: "abertura",
        npc: ["Presente? Para mim? De quem?", "Eu não comprei nada."],
        options: [
          { id: "surpresa", text: "Dizer que o remetente pediu segredo: é uma surpresa", tactic: "rapport", reply: gb("Surpresa! Quem será?", "Não gosto de surpresa de desconhecido.") },
          { id: "nota", text: "Mostrar a «nota» com o nome e o endereço de {name}", tactic: "evidence", reply: gb("Meu nome mesmo. Hum!", "Isso qualquer um imprime.") },
          { id: "devolve", text: "Avisar que, se não receber hoje, volta para o remetente", tactic: "urgency", reply: gb("Volta? Não, não, eu recebo.", "Que volte, então.") },
        ],
      },
      {
        id: "taxa",
        canClose: true,
        npc: ["E tem que pagar alguma coisa?", "Tá. Onde eu assino?"],
        options: [
          { id: "simbolica", text: "Explicar que é uma taxa simbólica, só no cartão", tactic: "explain", reply: gb("Simbólica? Tá, passa.", "Por que só cartão?") },
          { id: "sistema", text: "Culpar o «sistema» da transportadora, que não aceita dinheiro", tactic: "reframe", reply: gb("Sistema é assim mesmo.", "Que sistema estranho.") },
        ],
      },
    ],
    endings: {
      great: "{name} passa o cartão, digita a senha e ainda agradece pelo presente vazio.",
      good: "{name} paga a «taxa» no cartão.",
      partial: "{name} paga em dinheiro, não no cartão.",
      fail: "{name} recusa a encomenda.",
      walkout: "{name} desconfia e fecha a porta.",
    },
  },
  {
    id: "temporada",
    title: "Casa de praia",
    type: "pitch",
    client: "Golpe próprio",
    brief: "Fotos bonitas de uma casa de praia que não é sua e uma promoção imperdível para o feriado. {name} só precisa pagar o sinal para garantir a reserva.",
    objective: "Fazer {name} pagar o sinal da casa.",
    beats: [
      {
        id: "abertura",
        npc: ["Casa de praia? Onde?", "Por esse preço? Tem alguma coisa errada."],
        options: [
          { id: "fotos", text: "Mostrar as fotos da varanda com vista para o mar", tactic: "evidence", reply: gb("Que lugar lindo!", "Foto de internet.") },
          { id: "desistencia", text: "Explicar que o preço é baixo porque outra família desistiu", tactic: "explain", claim: { key: "preco", value: "desistencia", label: "outra família desistiu" }, reply: gb("Ah, desistência. Faz sentido.", "Hum.") },
          { id: "ferias", text: "Perguntar quando foi a última vez que {name} tirou férias", tactic: "question", reply: gb("Férias? Nem lembro.", "Isso não é da sua conta.") },
        ],
      },
      {
        id: "sinal",
        canClose: true,
        npc: ["E como eu reservo?", "Quanto é o sinal?"],
        options: [
          { id: "metade", text: "Pedir só um sinal pequeno para segurar a data", tactic: "concession", reply: gb("Um sinal pequeno eu consigo.", "Sinal nenhum sem contrato.") },
          { id: "fila", text: "Avisar que tem mais gente querendo o mesmo feriado", tactic: "urgency", reply: gb("Então eu reservo já.", "Que reserve o outro.") },
        ],
      },
    ],
    endings: {
      great: "{name} paga o sinal e o restante adiantado, para garantir.",
      good: "{name} paga o sinal de uma casa que não existe.",
      partial: "{name} paga uma parte pequena do sinal.",
      fail: "{name} prefere procurar numa agência.",
      walkout: "{name} percebe o golpe e vai embora.",
    },
  },
  {
    id: "emprego",
    title: "Vaga garantida",
    type: "pitch",
    client: "Golpe próprio",
    brief: "Você «recruta» para uma grande empresa do porto. A vaga é de {name} — só falta pagar a taxa dos exames e passar os documentos para o cadastro.",
    objective: "Fazer {name} pagar a taxa e entregar os documentos.",
    loot: [{ kind: "documento", label: "documentos de {name}", value: 120 }],
    beats: [
      {
        id: "abertura",
        npc: ["Vaga? Para mim? Mas eu nem mandei currículo.", "Que empresa é essa?"],
        options: [
          { id: "indicacao", text: "Dizer que {name} foi indicado por um conhecido do bairro", tactic: "rapport", claim: { key: "indicacao", value: "conhecido", label: "um conhecido indicou" }, reply: gb("Indicação! Quem será?", "Indicação de quem?") },
          { id: "salario", text: "Mostrar o salário e os benefícios da vaga", tactic: "evidence", reply: gb("Com plano de saúde? Nossa.", "Salário bom demais.") },
          { id: "ouvir", text: "Perguntar como está a situação de trabalho de {name}", tactic: "question", reply: gb("Apertada. Muito apertada.", "Estou bem, obrigado.") },
        ],
      },
      {
        id: "taxa",
        canClose: true,
        npc: ["E o que eu preciso fazer?", "Tem algum custo?"],
        options: [
          { id: "exames", text: "Explicar que só os exames admissionais são pagos, e reembolsados no primeiro salário", tactic: "explain", reply: gb("Reembolsado? Ah, então tudo bem.", "Empresa séria não cobra exame.") },
          { id: "vagas", text: "Avisar que são só três vagas e muita gente interessada", tactic: "urgency", reply: gb("Então eu garanto a minha.", "Pressão não.") },
        ],
      },
    ],
    endings: {
      great: "{name} paga a taxa, entrega os documentos e agradece emocionado.",
      good: "{name} paga a taxa dos «exames» e entrega os documentos.",
      partial: "{name} entrega os documentos, mas não paga nada.",
      fail: "{name} diz que vai pesquisar a empresa antes.",
      walkout: "{name} percebe o golpe e manda você embora.",
    },
  },
  {
    id: "pesquisa",
    title: "Pesquisa premiada",
    type: "phishing",
    client: "Golpe próprio",
    brief: "Prancheta na mão: uma «pesquisa de satisfação» com sorteio de prêmios. Para concorrer, {name} só precisa informar alguns dados.",
    objective: "Arrancar os dados pessoais de {name}.",
    loot: [{ kind: "dados", label: "dados pessoais de {name}", value: 90 }],
    beats: [
      {
        id: "abertura",
        npc: ["Pesquisa? Eu tô com pressa.", "Pesquisa de quê?"],
        options: [
          { id: "rapida", text: "Garantir que são só três perguntas", tactic: "concession", reply: gb("Três? Vai.", "Sempre são três e viram trinta.") },
          { id: "premio", text: "Contar que todos que respondem concorrem a uma TV", tactic: "reframe", reply: gb("Uma TV? Opa.", "Prêmio, sei.") },
          { id: "elogio", text: "Elogiar o bom gosto de {name}, ideal para a pesquisa", tactic: "flattery", reply: gb("Ha, obrigado.", "Elogio para quê?") },
        ],
      },
      {
        id: "dados",
        canClose: true,
        npc: ["E pronto? Só isso?", "O que mais?"],
        options: [
          { id: "cadastro", text: "Pedir nome completo, data de nascimento e documento «para o sorteio»", tactic: "explain", reply: gb("Tá, anota aí.", "Documento para pesquisa?") },
          { id: "brinde", text: "Oferecer um brinde na hora para quem completa o cadastro", tactic: "concession", reply: gb("Brinde agora? Então completa.", "Não quero brinde.") },
        ],
      },
    ],
    endings: {
      great: "{name} preenche tudo e ainda chama a vizinha para responder também.",
      good: "{name} passa os dados para o «sorteio».",
      partial: "{name} passa só o nome e o telefone.",
      fail: "{name} não quer passar dados para ninguém.",
      walkout: "{name} vai embora no meio da pesquisa.",
    },
  },
  {
    id: "sofa",
    title: "O sofá que não existe",
    type: "negotiation",
    client: "Golpe próprio",
    brief: "Você anuncia um sofá retrátil quase novo, «de uma mudança urgente». {name} está procurando um. O sofá não existe; o sinal vai existir.",
    objective: "Fazer {name} pagar o maior sinal possível pelo sofá.",
    negotiation: (tier) => ({ item: "sofá", npcSells: false, anchor: 60 * tier, fair: 110 * tier, limit: 140 * tier, clientLimit: 70 * tier }),
    beats: [
      {
        id: "abertura",
        npc: ["Sofá? Que tipo de sofá?", "Ah, é você que está vendendo o sofá? Me mostra."],
        options: [
          { id: "fotos", text: "Mostrar fotos do sofá e contar que tem só um ano de uso", tactic: "evidence", reply: gb("Parece bem conservado.", "Foto engana.") },
          { id: "conforto", text: "Perguntar o que {name} procura num sofá", tactic: "question", reply: gb("Algo confortável para cochilar depois do almoço.", "Por que quer saber?") },
          { id: "interessados", text: "Dizer que tem mais três interessados", tactic: "urgency", truthful: false, claim: { key: "interessados", value: "tres", label: "há mais três interessados" }, reply: gb("Três? Hum.", "Sempre tem «mais três interessados».") },
        ],
      },
      {
        id: "preco",
        canClose: true,
        npc: ["E quanto você quer de sinal?", "Ok. Vamos falar de dinheiro."],
        options: [
          { id: "entrega", text: "Prometer entrega grátis no sábado", tactic: "concession", reply: gb("Entrega grátis? Ótimo.", "Hum, ok.") },
          { id: "defeito", text: "Contar um «defeito» pequeno para parecer honesto", tactic: "honesty", reply: gb("Gostei da sinceridade.", "Defeito? Hum.") },
        ],
      },
    ],
    endings: {
      great: "{name} paga um sinal gordo e combina a entrega para sábado. Sábado, seu número já não existe.",
      good: "{name} paga o sinal de um sofá imaginário.",
      partial: "{name} paga um sinal pequeno.",
      fail: "{name} quer ver o sofá pessoalmente antes.",
      walkout: "{name} perde a paciência e vai embora.",
    },
  },
];

// ---------- Alertas da polícia (app Central) ----------

export const POLICE_ALERTS = [
  "A delegacia de crimes financeiros abriu um canal de denúncias por mensagem.",
  "Viaturas descaracterizadas foram vistas rondando o Mercado Central.",
  "O jornal O Relógio publicou retratos falados de golpistas que agem na cidade.",
  "O banco Áurea passou a bloquear transferências fora do padrão por 24 horas.",
  "Um delator do Zênite está colaborando com a polícia. Cuidado com quem você conhece.",
  "A polícia está cruzando reclamações de vítimas por bairro.",
];
