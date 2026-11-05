// Estrutura da história, finais, eventos do mundo, desafios do dia, bicos e casos de investigação.

import type { Attrs, Mission, Outcome } from "../core/types";

// ---------- Capítulos ----------

export interface Chapter {
  n: number;
  title: string;
  subtitle: string;
  intro: string;
  /** Condições para concluir o capítulo. */
  goal: { rep: number; story: string[]; anyOf?: { missions: string[]; count: number } };
  goalText: string;
}

export const CHAPTERS: Chapter[] = [
  {
    n: 1,
    title: "Recomeço",
    subtitle: "Vila Jardim",
    intro: "Você chega a Vila Áurea com uma mala, ₢ 50 e um quarto alugado na pensão da Dona Cida. Ninguém conhece seu nome. Na cidade, quem resolve conflitos e fecha acordos ganha a vida — e a confiança dos outros. Comece pelo bairro.",
    goal: { rep: 10, story: ["m-helena"], anyOf: { missions: ["m-antonio", "m-cida", "m-jorge", "m-bia"], count: 2 } },
    goalText: "Chegar a 10 de reputação, ajudar a Helena e fechar pelo menos mais dois acordos na Vila Jardim.",
  },
  {
    n: 2,
    title: "Nome na praça",
    subtitle: "Mercado Central e Campus Aurora",
    intro: "O bairro já fala de você. O Mercado e a universidade abrem as portas — e, entre bancas e salas de aula, aparecem panfletos de um tal Grupo Zênite prometendo rendimentos impossíveis para aposentados.",
    goal: { rep: 30, story: ["m-valdir"], anyOf: { missions: ["m-kenji", "m-larissa", "m-rafaela", "m-osvaldo", "m-mariana", "m-lucas", "m-heitor", "m-taina", "m-paulo"], count: 4 } },
    goalText: "Chegar a 30 de reputação, descobrir o que o Valdir sabe sobre o Zênite e fechar mais quatro acordos no Mercado ou no Campus.",
  },
  {
    n: 3,
    title: "A rede Zênite",
    subtitle: "Largo do Relógio",
    intro: "Os panfletos eram só a ponta. No centro histórico, cartas elegantes chegam aos casarões oferecendo 'investimentos garantidos'. Com a jornalista Clara Bastos, você começa a montar o mapa do golpe.",
    goal: { rep: 55, story: ["m-clara", "m-conceicao"] },
    goalText: "Chegar a 55 de reputação, fechar a parceria com a Clara e impedir que Dona Conceição caia no golpe.",
  },
  {
    n: 4,
    title: "Grandes mesas",
    subtitle: "Torres do Porto e Alto das Palmeiras",
    intro: "Desmontar o golpe não basta: as vítimas precisam ser ressarcidas e os bairros precisam de algo melhor que promessas. Nasce o Plano Áurea. Para tirá-lo do papel, você vai sentar com quem tem dinheiro e poder.",
    goal: { rep: 85, story: ["m-fernanda", "m-diego"], anyOf: { missions: ["m-yara", "m-vitoria"], count: 1 } },
    goalText: "Chegar a 85 de reputação, conseguir o aporte da Naviera, fazer o Diego falar e fechar o fundo (Yara) ou a doação (Vitória).",
  },
  {
    n: 5,
    title: "O Paço",
    subtitle: "Paço Municipal",
    intro: "Todas as pistas levam à Câmara. Todas as decisões levam ao gabinete do prefeito. É hora de juntar tudo o que você construiu — pessoas, provas e reputação — numa última conversa de dez minutos.",
    goal: { rep: 110, story: ["m-roberto"] },
    goalText: "Convencer o prefeito a adotar o Plano Áurea.",
  },
];

// ---------- Finais ----------

export interface Ending {
  id: string;
  title: string;
  text: string;
  /** Condição avaliada no fim (ordem importa: o primeiro que valer). */
  when: (s: { outcome: Outcome; integrity: number; liesCaught: number; money: number; rep: number }) => boolean;
}

export const ENDINGS: Ending[] = [
  {
    id: "sombra",
    title: "Sombra elegante",
    text: "O plano foi aprovado — mas a cidade aprendeu com você que quase tudo se resolve com a frase certa, mesmo que não seja verdadeira. Diego Salazar manda flores e um cartão: 'Bem-vindo ao clube'. Você é poderoso em Vila Áurea. E ninguém acredita em você.",
    when: (s) => s.integrity <= -15,
  },
  {
    id: "arquiteto",
    title: "Arquiteto de Vila Áurea",
    text: "Um ano depois, a Rede de Feiras está em doze bairros, o Fundo Áurea ressarciu 312 famílias e o Fórum da Vila se reúne todo mês no auditório nobre. No mural da escola, entre o papagaio da Dona Cida e o rádio do Seu Antônio, alguém pintou uma pessoa com uma mala na mão, chegando à cidade. É você.",
    when: (s) => s.outcome === "great" && s.integrity >= 8,
  },
  {
    id: "voz",
    title: "A voz da vila",
    text: "O plano saiu, com remendos e concessões, como as coisas boas costumam sair. Você continua morando na pensão da Dona Cida — por escolha. Quando alguém na cidade tem um problema impossível, alguém sempre diz: 'Fala com aquele que mora no quarto dos fundos'.",
    when: (s) => s.integrity >= 0,
  },
  {
    id: "negociador",
    title: "O negociador",
    text: "Você venceu — com eficiência, cálculo e algumas verdades ajustadas. O plano funciona, as vítimas recebem, o prefeito se reelege. Mas Seu Antônio, quando te vê na rua, cumprimenta com a cortesia de quem já foi enganado uma vez.",
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
  /** Mudança direta na conversa (ex.: todo mundo mais desconfiado). */
  start?: Partial<Attrs>;
  weight: number;
  minChapter?: number;
}

export const EVENTS: WorldEvent[] = [
  { id: "sol", title: "Dia de sol", text: "Céu limpo e calor bom. A cidade está de bom humor.", mood: { all: 6 }, weight: 4 },
  { id: "chuva", title: "Chuva forte", text: "Temporal desde a madrugada. Ônibus atrasados, gente irritada.", mood: { all: -8 }, fareMult: 1.5, weight: 3 },
  { id: "jogo", title: "Clássico de futebol", text: "Ferroviário Áureo x Portuários hoje à noite. A Vila Jardim só fala disso.", mood: { jardim: 10, torres: 4 }, weight: 2 },
  { id: "festival", title: "Festival do Largo", text: "Música e barracas no centro histórico. Turistas por todo lado.", mood: { largo: 12 }, gigBonus: 1.3, weight: 2, minChapter: 3 },
  { id: "dia-feira", title: "Dia de feira grande", text: "O Mercado Central está lotado: bom para negócios, ruim para paciência.", mood: { mercado: 4 }, start: { patience: -6 }, gigBonus: 1.4, weight: 2, minChapter: 2 },
  { id: "provas", title: "Semana de provas", text: "No Campus, todo mundo está tenso e sem tempo.", mood: { campus: -8 }, start: { patience: -5 }, weight: 2, minChapter: 2 },
  { id: "greve-onibus", title: "Greve de ônibus", text: "Sem transporte público: táxis cobram o dobro.", fareMult: 2, mood: { all: -4 }, weight: 1 },
  { id: "promocao", title: "Promoção na loja do celular", text: "A loja do seu celular está com 25% de desconto hoje.", shopDiscount: 0.25, weight: 2 },
  { id: "noticia-zenite", title: "Boato sobre o Zênite", text: "Correm boatos de golpe com aposentados. As pessoas estão mais desconfiadas.", start: { suspicion: 6 }, weight: 2, minChapter: 2 },
  { id: "feriado", title: "Feriado municipal", text: "Aniversário da cidade: escritórios fechados, praças cheias e gente sem pressa.", mood: { all: 8 }, start: { patience: 8 }, weight: 1 },
  { id: "eleicao", title: "Clima de eleição", text: "Carros de som e santinhos. No Paço, todo mundo mede cada palavra.", mood: { paco: -6 }, start: { suspicion: 4 }, weight: 2, minChapter: 4 },
  { id: "reportagem", title: "Reportagem sobre você", text: "O jornal O Relógio citou seu trabalho. As pessoas te reconhecem na rua.", start: { credibility: 6 }, weight: 1, minChapter: 3 },
];

// ---------- Desafios do dia ----------

export interface DayStats {
  talks: number;
  deals: number;
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
  /** Desafio que falha se o valor passar do alvo (ex.: nenhum abandono). */
  inverse?: boolean;
}

export const CHALLENGES: Challenge[] = [
  { id: "conversas", title: "Converse com 3 pessoas", target: 3, value: (d) => d.talks, reward: { money: 30, xp: 30 } },
  { id: "sem-blefe", title: "Feche um acordo sem blefar", target: 1, value: (d) => d.dealsNoBluff, reward: { money: 50, xp: 40 } },
  { id: "descobrir", title: "Descubra 2 necessidades escondidas", target: 2, value: (d) => d.needsFound, reward: { money: 40, xp: 40 } },
  { id: "ganhar", title: "Ganhe ₢ 150 em acordos", target: 150, value: (d) => d.earned, reward: { money: 40, xp: 30 } },
  { id: "humor", title: "Arranque 2 risadas", target: 2, value: (d) => d.humorHits, reward: { money: 25, xp: 30 } },
  { id: "afinidade", title: "Termine uma conversa com alguém gostando muito de você", target: 1, value: (d) => d.highAffinity, reward: { money: 35, xp: 40 } },
  { id: "novos", title: "Conheça 2 pessoas novas", target: 2, value: (d) => d.newPeople, reward: { money: 30, xp: 30 } },
  { id: "acordos", title: "Feche 2 acordos", target: 2, value: (d) => d.deals, reward: { money: 60, xp: 50 } },
];

// ---------- Bicos (missões geradas, repetíveis) ----------

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
}

const gb = (good: string, bad: string) => ({ good, bad });

export const GIGS: GigTemplate[] = [
  {
    id: "sofa",
    title: "O sofá do vizinho",
    type: "negotiation",
    client: "Um vizinho que vai se mudar",
    brief: "Um vizinho de {name} vai se mudar e precisa vender um sofá retrátil quase novo. {name} comentou que está procurando um.",
    objective: "Vender o sofá para {name} por um bom preço.",
    negotiation: (tier) => ({ item: "sofá retrátil", npcSells: false, anchor: 120 * tier, fair: 200 * tier, limit: 230 * tier, clientLimit: 170 * tier }),
    beats: [
      {
        id: "abertura",
        npc: ["Sofá? Hum. Que tipo de sofá?", "Ah, você que está vendendo o sofá? Me mostra."],
        options: [
          { id: "fotos", text: "Mostrar fotos do sofá e contar quanto tempo de uso ele tem", tactic: "evidence", reply: gb("Parece bem conservado.", "Foto engana.") },
          { id: "conforto", text: "Perguntar o que {name} procura num sofá", tactic: "question", reply: gb("Algo confortável para cochilar depois do almoço.", "Por que quer saber?") },
          { id: "ultimo", text: "Dizer que tem mais três interessados", tactic: "urgency", truthful: false, claim: { key: "interessados", value: "tres", label: "há mais três interessados" }, reply: gb("Três? Hum.", "Sempre tem 'mais três interessados'.") },
        ],
      },
      {
        id: "preco",
        canClose: true,
        npc: ["E quanto o seu vizinho quer?", "Ok. Vamos falar de dinheiro."],
        options: [
          { id: "entrega", text: "Oferecer entrega grátis no mesmo dia", tactic: "concession", reply: gb("Entrega no mesmo dia? Isso ajuda muito.", "Hum, ok.") },
          { id: "honesto", text: "Contar um defeito pequeno do sofá antes que {name} descubra", tactic: "honesty", reply: gb("Gostei da sinceridade. Isso me deixa mais tranquilo.", "Defeito? Hum.") },
        ],
      },
    ],
    endings: {
      great: "{name} compra o sofá e ainda pede o contato do vizinho para comprar a estante.",
      good: "Sofá vendido. O vizinho agradece com um pote de doce de leite.",
      partial: "Vendido, mas barato.",
      fail: "{name} não compra. O sofá continua no corredor.",
      walkout: "{name} perde a paciência e vai embora.",
    },
  },
  {
    id: "barulho",
    title: "Barulho no prédio",
    type: "mediation",
    client: "Síndico do prédio",
    brief: "Os vizinhos reclamam do barulho que {name} faz à noite. O síndico pediu que você resolva sem multa e sem briga.",
    objective: "Chegar a um acordo sobre o barulho com {name}.",
    beats: [
      {
        id: "abertura",
        npc: ["Barulho? Que barulho? Eu nem estou em casa à noite.", "Ah, já sei. O síndico mandou você."],
        options: [
          { id: "ouvir", text: "Perguntar como é a rotina de {name} à noite", tactic: "question", reply: gb("Chego tarde do trabalho e ainda tenho que fazer tudo em casa.", "Isso é da minha conta.") },
          { id: "multa", text: "Avisar que a próxima reclamação vira multa", tactic: "pressure", reply: gb("Tá bom, tá bom.", "Multa? Então que multem!") },
          { id: "entender", text: "Dizer que entende: ninguém faz barulho porque quer", tactic: "empathy", reply: gb("Pois é! Obrigado por entender.", "Não precisa me dar sermão.") },
        ],
      },
      {
        id: "acordo",
        canClose: true,
        npc: ["E o que você sugere?", "Tá. Qual é a solução?"],
        options: [
          { id: "horario", text: "Propor um horário combinado para tarefas barulhentas, até as 22h", tactic: "reframe", reply: gb("Até as dez… dá para fazer.", "Dez horas? Eu chego às nove.") },
          { id: "feltro", text: "Oferecer feltros para os pés das cadeiras, pagos pelo condomínio", tactic: "concession", reply: gb("Feltro grátis? Ha. Tá bom.", "Feltro não resolve tudo.") },
        ],
      },
    ],
    endings: {
      great: "{name} e os vizinhos fazem as pazes e combinam um churrasco no salão de festas.",
      good: "Acordo de horário fechado. O prédio fica em silêncio às dez.",
      partial: "{name} promete tentar. Veremos.",
      fail: "{name} não aceita. O síndico vai aplicar a multa.",
      walkout: "{name} bate a porta.",
    },
  },
  {
    id: "quermesse",
    title: "Doação para a quermesse",
    type: "pitch",
    client: "Comissão da quermesse do bairro",
    brief: "A quermesse do bairro precisa de prendas para a rifa. {name} tem condições de doar alguma coisa — se for bem convidado.",
    objective: "Conseguir uma doação de {name} para a quermesse.",
    beats: [
      {
        id: "abertura",
        npc: ["Quermesse? Hum. Para quê é o dinheiro?", "Doação? De novo?"],
        options: [
          { id: "destino", text: "Explicar que a renda vai para consertar o telhado da creche", tactic: "explain", reply: gb("A creche? Ah, isso é importante.", "Toda quermesse diz isso.") },
          { id: "lista", text: "Mostrar quem já doou e o que doou", tactic: "socialProof", reply: gb("A padaria doou um bolo? Então eu também ajudo.", "Cada um com seu bolso.") },
          { id: "prestigio", text: "Dizer que o nome de quem doar vai aparecer no microfone", tactic: "flattery", reply: gb("No microfone? Ha. Gosto disso.", "Não preciso de microfone.") },
        ],
      },
      {
        id: "pedido",
        canClose: true,
        npc: ["E o que vocês precisam exatamente?", "Tá. Quanto?"],
        options: [
          { id: "pequeno", text: "Pedir algo pequeno, que caiba no bolso de {name}", tactic: "concession", reply: gb("Algo pequeno eu consigo.", "Pequeno quanto?") },
          { id: "tempo", text: "Pedir ajuda com tempo, não dinheiro: uma hora na barraca", tactic: "reframe", reply: gb("Uma hora na barraca? Isso eu faço com gosto.", "Tempo é o que eu menos tenho.") },
        ],
      },
    ],
    endings: {
      great: "{name} doa e ainda passa a tarde na barraca de pescaria.",
      good: "{name} doa uma prenda para a rifa.",
      partial: "{name} compra uma rifa. Ajuda um pouco.",
      fail: "{name} não doa nada este ano.",
      walkout: "{name} fecha a porta.",
    },
  },
  {
    id: "indicacao",
    title: "Um bom eletricista",
    type: "pitch",
    client: "Seu Nonato, eletricista",
    brief: "Seu Nonato é um eletricista honesto que precisa de clientes. {name} tem uma instalação antiga em casa e um medo enorme de ser enganado por prestador de serviço.",
    objective: "Convencer {name} a chamar o Seu Nonato para um orçamento.",
    beats: [
      {
        id: "abertura",
        npc: ["Eletricista? O último me cobrou o triplo.", "Hum. E por que eu confiaria nesse aí?"],
        options: [
          { id: "referencias", text: "Mostrar três clientes do bairro que indicam o Seu Nonato", tactic: "socialProof", reply: gb("A Dona Marli indicou? Ela não indica ninguém.", "Indicação de amigo dele.") },
          { id: "orcamento", text: "Explicar que o orçamento é grátis e por escrito", tactic: "evidence", reply: gb("Por escrito? Ah, isso sim.", "Papel aceita tudo.") },
          { id: "medo", text: "Perguntar o que aconteceu com o último eletricista", tactic: "question", reply: gb("Me cobrou por um serviço que ele nem fez. Fiquei com raiva semanas.", "Não quero falar disso.") },
        ],
      },
      {
        id: "decisao",
        canClose: true,
        npc: ["Tá. E se ele cobrar caro?", "Hum. Talvez."],
        options: [
          { id: "sem-compromisso", text: "Garantir que ninguém é obrigado a fechar depois do orçamento", tactic: "concession", reply: gb("Sem compromisso? Então tá.", "Todo mundo fala isso.") },
          { id: "perigo", text: "Avisar que fiação antiga pode causar incêndio", tactic: "urgency", reply: gb("…Incêndio? Tá. Chama ele.", "Agora vai me assustar para vender?") },
        ],
      },
    ],
    endings: {
      great: "{name} chama o Seu Nonato, gosta do serviço e indica para a rua inteira.",
      good: "{name} marca o orçamento para sábado.",
      partial: "{name} pega o telefone do Seu Nonato. Talvez ligue.",
      fail: "{name} prefere não arriscar.",
      walkout: "{name} encerra o assunto.",
    },
  },
  {
    id: "bicicleta",
    title: "A bicicleta parada",
    type: "negotiation",
    client: "Rafa, entregador do bairro",
    brief: "O Rafa perdeu a bicicleta num assalto e precisa de outra para voltar a fazer entregas. {name} tem uma bicicleta parada na garagem há anos.",
    objective: "Comprar a bicicleta de {name} para o Rafa, dentro do orçamento dele.",
    negotiation: (tier) => ({ item: "bicicleta", npcSells: true, anchor: 140 * tier, fair: 100 * tier, limit: 75 * tier, clientLimit: 115 * tier }),
    beats: [
      {
        id: "abertura",
        npc: ["A bicicleta? Era do meu filho. Está parada, mas tem valor sentimental.", "Bicicleta? Ah, aquela lá no fundo. Por quê?"],
        options: [
          { id: "rafa", text: "Contar a história do Rafa e para que ele precisa da bicicleta", tactic: "empathy", reply: gb("Assaltado? Coitado. Trabalho honesto é difícil.", "Todo mundo tem uma história triste.") },
          { id: "estado", text: "Perguntar há quanto tempo a bicicleta está parada e em que estado", tactic: "question", reply: gb("Uns quatro anos. Pneu murcho, corrente enferrujada… é verdade.", "Está ótima. Só precisa de um ar.") },
          { id: "barato", text: "Dizer que bicicleta velha não vale quase nada hoje em dia", tactic: "pressure", reply: gb("Hum. Talvez.", "Então vai comprar uma nova, ué.") },
        ],
      },
      {
        id: "valor",
        canClose: true,
        npc: ["Tá, e quanto vocês pensam em pagar?", "Vamos ver se a gente chega num número."],
        options: [
          { id: "uso", text: "Prometer que a bicicleta vai voltar a rodar todo dia, como a do filho rodava", tactic: "rapport", reply: gb("…Ele ia gostar disso.", "Não precisa apelar.") },
          { id: "conserto", text: "Mostrar quanto vai custar trocar pneus e corrente", tactic: "evidence", reply: gb("Faz sentido descontar isso.", "Isso é problema de quem compra.") },
        ],
      },
    ],
    endings: {
      great: "O Rafa sai pedalando e {name} pede que ele passe na frente de casa de vez em quando.",
      good: "Negócio fechado. A bicicleta volta a rodar.",
      partial: "O Rafa paga um pouco acima do que queria, mas volta ao trabalho.",
      fail: "{name} decide guardar a bicicleta.",
      walkout: "{name} se ofende e encerra a conversa.",
    },
  },
  {
    id: "horta",
    title: "A horta do terreno baldio",
    type: "pitch",
    client: "Associação de moradores",
    brief: "A associação quer transformar um terreno baldio em horta comunitária. Falta gente para cuidar dos canteiros — e {name} tem jeito para isso, se aceitar.",
    objective: "Convencer {name} a assumir um canteiro da horta.",
    beats: [
      {
        id: "abertura",
        npc: ["Horta? Naquele terreno cheio de entulho?", "Plantar? Hum. Faz tempo que não mexo com terra."],
        options: [
          { id: "plano", text: "Explicar o plano: limpeza no sábado, mudas doadas e água da caixa da escola", tactic: "explain", reply: gb("Com água da escola? Então é sério.", "Plano bonito no papel.") },
          { id: "memoria", text: "Perguntar se {name} já teve horta ou quintal", tactic: "question", reply: gb("Minha avó tinha. Couve, cebolinha, pé de limão…", "Não lembro.") },
          { id: "vagas", text: "Dizer que só sobrou um canteiro e é para hoje", tactic: "urgency", reply: gb("Só um? Hum.", "Nada é para hoje.") },
        ],
      },
      {
        id: "compromisso",
        canClose: true,
        npc: ["E quanto tempo isso toma?", "Tá. Mas eu não posso ir todo dia."],
        options: [
          { id: "dupla", text: "Propor dividir o canteiro com outra pessoa, para ninguém ficar sobrecarregado", tactic: "concession", reply: gb("Em dupla fica leve. Pode ser.", "Dividir com quem?") },
          { id: "colheita", text: "Lembrar que quem cuida leva a colheita para casa", tactic: "reframe", reply: gb("Salada de graça? Aí sim.", "Por esse trabalho todo?") },
        ],
      },
    ],
    endings: {
      great: "{name} assume dois canteiros e ensina as crianças a plantar.",
      good: "{name} fica com um canteiro de temperos.",
      partial: "{name} promete aparecer no mutirão de sábado.",
      fail: "{name} não tem tempo para horta agora.",
      walkout: "{name} encerra a conversa.",
    },
  },
  {
    id: "cachorro",
    title: "O cachorro que late",
    type: "mediation",
    client: "Uma vizinha que trabalha de madrugada",
    brief: "O cachorro de {name} late o dia inteiro quando fica sozinho, e a vizinha, que trabalha de madrugada, não consegue dormir. Ela não quer briga, quer descanso.",
    objective: "Chegar a uma solução para o latido com {name}.",
    beats: [
      {
        id: "abertura",
        npc: ["Meu cachorro? Ele é um amor. Late um pouquinho, só.", "Já sei. A vizinha reclamou, né?"],
        options: [
          { id: "nome", text: "Perguntar o nome do cachorro e há quanto tempo ele está com {name}", tactic: "rapport", reply: gb("É o Pipoca! Peguei na feira de adoção, era o mais medroso.", "Isso importa?") },
          { id: "vizinha", text: "Contar que a vizinha trabalha de madrugada e dorme de dia", tactic: "explain", reply: gb("De madrugada? Eu não sabia. Que chato.", "Problema dela.") },
          { id: "denuncia", text: "Dizer que a vizinha pode registrar uma queixa", tactic: "pressure", reply: gb("Queixa? Calma aí.", "Que registre!") },
        ],
      },
      {
        id: "solucao",
        canClose: true,
        npc: ["E o que eu faço? Não posso levar ele para o trabalho.", "Tá. Alguma ideia?"],
        options: [
          { id: "passeio", text: "Sugerir um passeio longo antes de sair: cachorro cansado late menos", tactic: "reframe", reply: gb("Faz sentido. Ele fica elétrico de manhã.", "Eu já não tenho tempo nem para mim.") },
          { id: "brinquedo", text: "Oferecer um brinquedo de petisco doado pela vizinha", tactic: "concession", reply: gb("Ela daria um brinquedo? Que gentileza.", "Não preciso de esmola.") },
        ],
      },
    ],
    endings: {
      great: "{name} e a vizinha combinam: ela passeia com o Pipoca nas folgas. Os dois saem ganhando.",
      good: "Passeio de manhã e brinquedo novo. O latido diminui bastante.",
      partial: "{name} promete tentar alguma coisa.",
      fail: "{name} acha que o cachorro não é o problema.",
      walkout: "{name} fecha a porta com o Pipoca latindo atrás.",
    },
  },
  {
    id: "aula",
    title: "Reforço de matemática",
    type: "pitch",
    client: "Júlia, estudante que dá aulas particulares",
    brief: "A Júlia dá aulas de reforço para pagar a faculdade. O sobrinho de {name} vai mal em matemática, mas {name} acha que aula particular é dinheiro jogado fora.",
    objective: "Convencer {name} a experimentar uma aula com a Júlia.",
    beats: [
      {
        id: "abertura",
        npc: ["Aula particular? O menino tem é preguiça.", "Reforço? Quanto custa isso?"],
        options: [
          { id: "dificuldade", text: "Perguntar em que parte da matemática o sobrinho trava", tactic: "question", reply: gb("Fração. Desde o ano passado ele empaca em fração.", "Em tudo, ué.") },
          { id: "resultado", text: "Mostrar as notas de dois alunos da Júlia antes e depois", tactic: "evidence", reply: gb("De quatro para oito? Hum.", "Escolheu os melhores, claro.") },
          { id: "culpa", text: "Dizer que, se ele repetir, a culpa vai ser da família", tactic: "pressure", reply: gb("…Também não é assim.", "Você não sabe nada da minha família.") },
        ],
      },
      {
        id: "teste",
        canClose: true,
        npc: ["E se não adiantar?", "Tá. Mas eu não vou pagar um mês inteiro no escuro."],
        options: [
          { id: "gratis", text: "Propor uma primeira aula experimental sem custo", tactic: "concession", reply: gb("Sem custo? Aí não tenho o que perder.", "Grátis sempre tem pegadinha.") },
          { id: "jogo", text: "Explicar que a Júlia ensina fração com receita de bolo", tactic: "reframe", reply: gb("Com bolo? Ele vai adorar. Eu também.", "Bolo? Isso é sério?") },
        ],
      },
    ],
    endings: {
      great: "O sobrinho tira oito na prova seguinte, e {name} indica a Júlia para meio bairro.",
      good: "Primeira aula marcada para quinta.",
      partial: "{name} vai pensar e pede o telefone da Júlia.",
      fail: "{name} acha que é coisa da idade e vai passar.",
      walkout: "{name} encerra o assunto.",
    },
  },
];

// ---------- Casos de investigação (app Investigação) ----------

export interface CaseItem {
  id: string;
  /** Linha mostrada (transação, mensagem ou documento fictício). */
  title: string;
  detail: string;
  suspicious: boolean;
  why: string;
}

export interface CaseFile {
  id: string;
  title: string;
  summary: string;
  requires: string[];
  instructions: string;
  items: CaseItem[];
  question: { q: string; options: string[]; answer: number; explain: string };
  reward: { xp: number; rep: number; money: number };
  flag: string;
}

export const CASES: CaseFile[] = [
  {
    id: "c-panfletos",
    title: "Os panfletos do Zênite",
    summary: "Clara enviou fotos de panfletos e extratos fictícios de aposentados que 'investiram' no Grupo Zênite. Encontre os sinais de golpe.",
    requires: ["m-valdir"],
    instructions: "Marque tudo o que é suspeito. Todos os dados são fictícios: nomes, contas e cartões foram inventados para o jogo.",
    items: [
      { id: "p1", title: "Panfleto: 'Rendimento garantido de 8% ao mês'", detail: "Impresso em papel brilhante, sem CNPJ.", suspicious: true, why: "Nenhum investimento legítimo garante 8% ao mês (mais de 150% ao ano). Promessa de ganho alto e 'garantido' é o primeiro sinal de golpe." },
      { id: "p2", title: "Extrato: depósito de ₢ 2.000 para 'Zênite Serviços Ltda.'", detail: "Conta aberta há 11 dias. Cartão fictício •••• 0000.", suspicious: true, why: "Conta recém-aberta recebendo depósitos de várias pessoas é padrão de conta de passagem." },
      { id: "p3", title: "Extrato: pagamento da conta de luz", detail: "Companhia de energia, valor habitual.", suspicious: false, why: "Pagamento recorrente, para empresa conhecida, com valor dentro do normal." },
      { id: "p4", title: "Panfleto: 'Vagas limitadas! Só até sexta!'", detail: "Em letras vermelhas.", suspicious: true, why: "Urgência artificial serve para impedir que a pessoa pense, pesquise ou peça opinião." },
      { id: "p5", title: "Extrato: aposentadoria creditada", detail: "Instituto de previdência, todo dia 5.", suspicious: false, why: "Crédito regular de fonte oficial." },
      { id: "p6", title: "Mensagem: 'Indique dois amigos e ganhe bônus de 20%'", detail: "Recebida por aplicativo de mensagens.", suspicious: true, why: "Bônus por indicação que depende de novos 'investidores' é a estrutura de pirâmide." },
    ],
    question: { q: "Qual é o padrão do golpe?", options: ["Pirâmide: o dinheiro dos novos paga os antigos até tudo desabar", "Um banco que faliu por azar", "Um erro de digitação nos extratos"], answer: 0, explain: "Ganho 'garantido' alto, urgência e bônus por indicação: é uma pirâmide financeira." },
    reward: { xp: 120, rep: 6, money: 0 },
    flag: "padrao-zenite",
  },
  {
    id: "c-cartas",
    title: "As cartas do casarão",
    summary: "Dona Conceição recebeu uma carta 'personalizada' do Zênite. Compare com uma carta verdadeira do banco dela.",
    requires: ["m-clara"],
    instructions: "Marque os sinais de fraude na carta. Os documentos são fictícios.",
    items: [
      { id: "k1", title: "Remetente: 'Zênite Private Bank — Genebra'", detail: "Endereço de retorno numa caixa postal local.", suspicious: true, why: "Banco suíço com caixa postal na cidade? Endereço não confere com a instituição alegada." },
      { id: "k2", title: "'Prezada Sra. Conceição, a senhora foi selecionada'", detail: "Tratamento muito pessoal e elogioso.", suspicious: true, why: "Golpes usam bajulação e a ideia de 'seleção exclusiva' para baixar a guarda da vítima." },
      { id: "k3", title: "Carta do banco dela: 'Nunca pedimos senhas por carta ou telefone'", detail: "Aviso padrão do banco.", suspicious: false, why: "Esse é um aviso legítimo, comum em comunicações de bancos reais." },
      { id: "k4", title: "'Transfira para a conta do nosso agente pessoal'", detail: "Conta em nome de pessoa física.", suspicious: true, why: "Instituição séria nunca pede transferência para conta pessoal de um funcionário." },
      { id: "k5", title: "'Não comente com familiares: oferta confidencial'", detail: "Em negrito no fim da carta.", suspicious: true, why: "Pedir sigilo isola a vítima de quem poderia alertá-la." },
    ],
    question: { q: "Qual é o melhor conselho para a Dona Conceição?", options: ["Ligar para o banco pelo número do cartão e conversar com alguém de confiança antes de qualquer transferência", "Transferir só metade do valor, por segurança", "Responder à carta pedindo mais detalhes"], answer: 0, explain: "Confirmar por um canal oficial e conversar com alguém de confiança desmonta a maioria dos golpes." },
    reward: { xp: 150, rep: 8, money: 0 },
    flag: "cartas-analisadas",
  },
  {
    id: "c-fachada",
    title: "Empresas de fachada",
    summary: "Yara reuniu dados públicos de empresas que receberam contratos da Câmara. Descubra quais são de fachada.",
    requires: ["m-diego"],
    instructions: "Marque as empresas suspeitas. Todas as empresas e pessoas são fictícias.",
    items: [
      { id: "f1", title: "Áurea Consultoria Estratégica", detail: "Aberta há 2 meses, sem funcionários, contrato de ₢ 800 mil.", suspicious: true, why: "Empresa recém-criada, sem estrutura, ganhando contrato grande: sinal clássico de fachada." },
      { id: "f2", title: "Gráfica Relógio", detail: "40 anos de atividade, 25 funcionários, contratos pequenos e frequentes.", suspicious: false, why: "Histórico longo e compatível com o tamanho dos contratos." },
      { id: "f3", title: "Zênite Serviços Ltda.", detail: "Mesmo endereço de outras 6 empresas.", suspicious: true, why: "Várias empresas no mesmo endereço indicam empresas de papel." },
      { id: "f4", title: "Horizonte Eventos", detail: "Sócio é o motorista de um vereador.", suspicious: true, why: "Sócio sem renda compatível, ligado a alguém com poder de decisão: possível 'laranja'." },
      { id: "f5", title: "Construtora Ponte Firme", detail: "Obra pública entregue, fotos e medições publicadas.", suspicious: false, why: "Entrega comprovada e transparente." },
    ],
    question: { q: "O que liga as empresas suspeitas?", options: ["Contratos assinados pelo mesmo gabinete da Câmara", "Todas são do mesmo ramo", "Nenhuma relação"], answer: 0, explain: "Os contratos das empresas de fachada saíram todos do mesmo gabinete: o fio que leva ao vereador Otávio." },
    reward: { xp: 180, rep: 10, money: 0 },
    flag: "rede-mapeada",
  },
  {
    id: "c-mensagens",
    title: "Mensagens do «banco»",
    summary: "Depois do Sentinela, aposentados do Campus passaram a encaminhar mensagens suspeitas para o Paulo. Ele separou algumas. Quais são golpe?",
    requires: ["m-paulo"],
    instructions: "Marque as mensagens fraudulentas. Números, links e cartões são fictícios (•••• 0000).",
    items: [
      { id: "s1", title: "«Banco Áurea: sua conta será bloqueada em 2h. Confirme sua senha no link»", detail: "Link encurtado, remetente com número de celular comum.", suspicious: true, why: "Banco não pede senha por mensagem nem ameaça bloqueio com prazo curto. Link encurtado esconde o destino." },
      { id: "s2", title: "«Compra aprovada de ₢ 1.890 no cartão •••• 0000. Não reconhece? Ligue para este número»", detail: "O número não é o que está no verso do cartão.", suspicious: true, why: "O golpe cria susto para a vítima ligar para a central falsa. O certo é ligar para o número impresso no cartão." },
      { id: "s3", title: "«Sua fatura de outubro fechou em ₢ 212. Veja no aplicativo»", detail: "Sem link, sem pedido de dados, valor coerente.", suspicious: false, why: "Aviso informativo, sem pedido de ação fora do aplicativo oficial." },
      { id: "s4", title: "«Oi, mãe, troquei de número. Me faz um Pix urgente?»", detail: "Número desconhecido, foto do filho tirada de rede social.", suspicious: true, why: "Golpe do falso parente: urgência, número novo e pedido de dinheiro. Ligue para o número antigo antes de qualquer coisa." },
      { id: "s5", title: "«Lembrete: consulta no posto de saúde amanhã, 9h»", detail: "Mensagem automática da unidade de saúde do bairro.", suspicious: false, why: "Lembrete sem link e sem pedido de dados pessoais." },
      { id: "s6", title: "«Você ganhou um prêmio! Pague a taxa de liberação de ₢ 49»", detail: "Sorteio do qual a pessoa nunca participou.", suspicious: true, why: "Prêmio que exige pagamento antecipado é sempre golpe." },
    ],
    question: { q: "Qual é a regra de ouro que o Sentinela deve ensinar?", options: ["Nunca passar senha ou código e confirmar tudo por um canal oficial que você mesmo procurou", "Só responder mensagens que tenham o logotipo do banco", "Clicar no link apenas pelo computador"], answer: 0, explain: "Logotipos são fáceis de copiar. O que protege é nunca entregar senhas e códigos e sempre confirmar por um canal oficial que você mesmo buscou." },
    reward: { xp: 140, rep: 6, money: 60 },
    flag: "mensagens-analisadas",
  },
  {
    id: "c-contrato",
    title: "O contrato da Câmara",
    summary: "Celina conseguiu a minuta do contrato que o vereador Otávio queria aprovar às pressas. Encontre as cláusulas que favorecem as empresas de fachada.",
    requires: ["m-celina"],
    instructions: "Marque as cláusulas problemáticas. O contrato e as empresas são fictícios.",
    items: [
      { id: "t1", title: "Cláusula 2: pagamento de 70% adiantado, antes de qualquer entrega", detail: "Sem garantia de execução.", suspicious: true, why: "Adiantar quase tudo sem garantia transfere o risco inteiro para a cidade." },
      { id: "t2", title: "Cláusula 4: publicação mensal das medições no portal da transparência", detail: "Com fotos e notas fiscais.", suspicious: false, why: "Transparência é proteção, não problema." },
      { id: "t3", title: "Cláusula 6: subcontratação livre, sem aprovação prévia", detail: "A empresa pode repassar o serviço a qualquer outra.", suspicious: true, why: "Subcontratação sem controle é o caminho para o dinheiro chegar às empresas de fachada." },
      { id: "t4", title: "Cláusula 8: dispensa de licitação por «urgência»", detail: "A obra está planejada há três anos.", suspicious: true, why: "Urgência fabricada para fugir da concorrência: o mesmo truque da pressa nos golpes." },
      { id: "t5", title: "Cláusula 9: multa por atraso de 0,5% ao dia", detail: "Limitada a 20% do valor.", suspicious: false, why: "Multa proporcional e com teto é padrão de contratos sérios." },
    ],
    question: { q: "O que a Celina deve levar ao prefeito?", options: ["As cláusulas 2, 6 e 8, com a ligação entre as empresas e o gabinete", "Um pedido para cancelar todas as obras da cidade", "Nada: contrato assinado não se discute"], answer: 0, explain: "Um pedido específico, com provas, é muito mais forte do que uma acusação genérica." },
    reward: { xp: 200, rep: 10, money: 120 },
    flag: "contrato-analisado",
  },
];

export const SECURITY_TIPS = [
  "Desconfie de qualquer ganho 'garantido' muito acima do normal.",
  "Bancos nunca pedem senha, código de verificação ou transferência para 'teste'.",
  "Urgência ('só hoje!') existe para você não pensar. Respire e pergunte a alguém.",
  "Confirme sempre por um canal oficial: o telefone que está no seu cartão, não o da mensagem.",
  "Pedido de sigilo ('não conte para a família') é sinal de golpe.",
  "Pirâmide: se o lucro depende de trazer novas pessoas, o dinheiro vem delas — não de um negócio.",
];
