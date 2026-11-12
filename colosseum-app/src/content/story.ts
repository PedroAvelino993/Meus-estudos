// Crises e ameaças, histórias do Decreto Imperial, objetivos do tutorial e conquistas.

import type { Crisis, DecreeStory } from "../core/types";

export const CRISES: Crisis[] = [
  { id: "economia", title: "Crise econômica em Roma", text: "O preço do trigo disparou e o povo conta moedas. Ninguém quer gastar com espetáculo nesta semana.", minEra: 1, weight: 3, choices: [
    { label: "Baixar os preços por um tempo", detail: "Menos receita, mas o povo agradece.", effect: { popularity: 6, money: -600 } },
    { label: "Manter tudo como está", detail: "Público menor nas próximas semanas.", effect: { popularity: -5, satisfaction: -3 } },
    { label: "Distribuir pão na entrada", detail: "Custa caro, mas vira assunto na cidade.", effect: { popularity: 10, favor: 4 }, cost: 1500, needsMoney: 1500 },
  ] },
  { id: "estrutura", title: "Rachaduras na arquibancada", text: "Os engenheiros encontraram rachaduras no anel inferior. Se nada for feito, pode haver um acidente.", minEra: 1, weight: 3, choices: [
    { label: "Reformar agora", detail: "Caro, mas seguro.", effect: { prestige: 1 }, cost: 2500, needsMoney: 2500 },
    { label: "Remendar e torcer", detail: "Barato. Se der errado, a reputação despenca.", effect: { satisfaction: -5 }, cost: 400, flag: "remendo" },
    { label: "Fechar o setor por um mês", detail: "Sem custo, mas o público sente.", effect: { popularity: -6, money: -800 } },
  ] },
  { id: "animais", title: "Doença entre os animais do espetáculo", text: "Uma doença atingiu os cavalos e animais usados nos desfiles. Os veterinários pedem cuidado e descanso.", minEra: 2, weight: 2, choices: [
    { label: "Pagar veterinários e dar descanso", detail: "Os animais se recuperam e o público respeita.", effect: { prestige: 2, popularity: 2 }, cost: 2000, needsMoney: 2000 },
    { label: "Trocar por bonecos e máscaras", detail: "Mais barato. Parte do público reclama.", effect: { satisfaction: -4, money: -500 } },
    { label: "Cancelar desfiles por um tempo", detail: "Menos espetáculo, menos receita.", effect: { popularity: -4, money: -1200 } },
  ] },
  { id: "revolta-precos", title: "Revolta pelos preços dos ingressos", text: "Uma multidão protesta na porta do Coliseu: 'Espetáculo é para todos!'.", minEra: 1, weight: 0, choices: [
    { label: "Baixar os preços e pedir desculpas", detail: "A paz volta. A receita cai um pouco.", effect: { popularity: 8, satisfaction: 4, money: -800 } },
    { label: "Explicar os custos em praça pública", detail: "Alguns entendem, outros não.", effect: { popularity: -3, prestige: 1 } },
    { label: "Chamar os guardas", detail: "Resolve hoje. O povo não esquece.", effect: { popularity: -12, favor: 2 } },
  ] },
  { id: "politica", title: "O Senado esfria com você", text: "Um senador influente acha que o Coliseu está ficando poderoso demais.", minEra: 2, weight: 2, choices: [
    { label: "Oferecer um camarote vitalício", detail: "Ele se acalma.", effect: { favor: 10 }, cost: 3000, needsMoney: 3000 },
    { label: "Organizar um evento em homenagem ao Senado", detail: "Prestígio e favor, mas sem lucro.", effect: { favor: 6, prestige: 3, money: -1500 } },
    { label: "Ignorar", detail: "O favor imperial cai.", effect: { favor: -15 } },
  ] },
  { id: "funcionarios", title: "Funcionários insatisfeitos", text: "Os funcionários reclamam de jornadas longas e salários atrasados. Falam em parar.", minEra: 1, weight: 0, choices: [
    { label: "Dar um aumento", detail: "Moral alta de novo.", effect: { staffMorale: 30 }, cost: 1200, needsMoney: 1200 },
    { label: "Prometer folgas", detail: "Moral sobe um pouco; eventos ficam um pouco piores.", effect: { staffMorale: 15, satisfaction: -2 } },
    { label: "Ameaçar demissões", detail: "Eles ficam, mas trabalham mal.", effect: { staffMorale: -20, satisfaction: -4 } },
  ] },
  { id: "tempestade", title: "Tempestade sobre Roma", text: "Uma tempestade inunda as ruas. Os eventos desta semana vão sofrer.", minEra: 1, weight: 2, choices: [
    { label: "Instalar toldos (velarium)", detail: "O espetáculo continua.", effect: { prestige: 1 }, cost: 1500, needsMoney: 1500 },
    { label: "Aguentar a chuva", detail: "Público menor e mais irritado.", effect: { satisfaction: -8, popularity: -3 } },
  ] },
  { id: "rival-estrela", title: "A Dominus contratou uma estrela", text: "A Dominus Arena anunciou um gladiador famoso como sua nova atração. A cidade só fala disso.", minEra: 2, weight: 0, choices: [
    { label: "Responder com uma campanha", detail: "Cartazes por toda a cidade.", effect: { popularity: 4, rivalPop: -4 }, cost: 2500, needsMoney: 2500 },
    { label: "Ignorar e focar na qualidade", detail: "O rival ganha força por um tempo.", effect: { rivalPop: 6 } },
  ] },
  { id: "governante", title: "O governante exige um espetáculo", text: "O prefeito de Roma quer um grande espetáculo para receber embaixadores. Se você cumprir, ganha prestígio. Se falhar, ele não vai esquecer.", minEra: 2, weight: 2, choices: [
    { label: "Aceitar o desafio", detail: "Missão: um evento com satisfação de 75% ou mais em 3 semanas.", effect: {} },
    { label: "Recusar educadamente", detail: "Perde favor imperial.", effect: { favor: -10, prestige: -2 } },
  ], quest: { minSatisfaction: 75, weeks: 3, reward: { prestige: 8, favor: 12, money: 3000, ep: 5 }, penalty: { favor: -15, prestige: -5 } } },
  { id: "nova-arena", title: "Uma nova arena em outra cidade", text: "Uma arena nova abriu em Capua e está levando parte do público da região.", minEra: 2, weight: 2, choices: [
    { label: "Comprar a arena", detail: "Fim da concorrência, mas é caro.", effect: { popularity: 4, prestige: 2 }, cost: 6000, needsMoney: 6000 },
    { label: "Fazer uma parceria", detail: "Dividem o público, sem guerra.", effect: { popularity: -2, fame: 5 } },
    { label: "Competir", detail: "Público menor por um tempo.", effect: { popularity: -6 } },
  ] },
  { id: "gladiador-saudade", title: "Saudade de casa", text: "Um dos seus gladiadores recebeu uma carta da família e quer tirar uns dias.", minEra: 1, weight: 2, choices: [
    { label: "Liberar com a viagem paga", detail: "Ele volta motivado.", effect: { condition: 10 }, cost: 300 },
    { label: "Pedir que fique", detail: "Ele fica, mas a moral cai.", effect: { satisfaction: -2 } },
  ] },
  { id: "patrocinio", title: "Proposta de patrocínio", text: "A casa comercial 'Ânforas Vinícius' (fictícia) quer o nome dela no seu próximo grande evento.", minEra: 2, weight: 2, choices: [
    { label: "Aceitar", detail: "Dinheiro na mão; o público acha meio comercial.", effect: { money: 3000, satisfaction: -2 } },
    { label: "Recusar", detail: "O Coliseu continua 'puro'.", effect: { prestige: 1 } },
  ] },
  { id: "embaixada", title: "Embaixada estrangeira", text: "Um rei da Armênia quer assistir a um espetáculo e trazer presentes.", minEra: 3, weight: 1, choices: [
    { label: "Recebê-lo no melhor camarote", detail: "Fama internacional.", effect: { fame: 15, prestige: 4 }, cost: 2000, needsMoney: 2000 },
    { label: "Recebê-lo sem cerimônia", detail: "Um pouco de fama.", effect: { fame: 5 } },
  ] },
  { id: "incendio", title: "Incêndio no bairro", text: "Um incêndio destruiu casas perto do Coliseu. As famílias pedem ajuda.", minEra: 2, weight: 1, choices: [
    { label: "Abrigar as famílias e doar comida", detail: "Roma não esquece quem ajuda.", effect: { popularity: 10, favor: 6, prestige: 3 }, cost: 3500, needsMoney: 3500 },
    { label: "Doar o lucro do próximo evento", detail: "Boa vontade, sem gastar agora.", effect: { popularity: 6, money: -1500 } },
    { label: "Não se envolver", detail: "O povo comenta.", effect: { popularity: -6 } },
  ] },
  { id: "boato", title: "Boato de resultados combinados", text: "Corre um boato de que os combates livres são combinados. O Arena Bets pode sofrer.", minEra: 2, weight: 0, choices: [
    { label: "Abrir os registros para auditoria", detail: "A verdade aparece: credibilidade sobe.", effect: { credibility: 8, prestige: 2 }, cost: 1000, needsMoney: 1000 },
    { label: "Negar em praça pública", detail: "Alguns acreditam.", effect: { credibility: -6 } },
  ] },
];

/** A Rebelião das Arenas: crise especial do fim de jogo. */
export const REBELLION: Crisis = {
  id: "rebeliao",
  title: "A Rebelião das Arenas",
  text: "As arenas menores do mundo se uniram numa coalizão: a Liga das Arenas Livres. Juntas, têm dinheiro, gladiadores e o apoio de quem tem medo do seu poder. Como você reage?",
  minEra: 5,
  weight: 0,
  choices: [
    { label: "Enfrentar de frente", detail: "Guerra de espetáculos: a Liga vira um rival forte, mas derrotá-la vale muito prestígio.", effect: { fame: 10 }, flag: "rebeliao-guerra" },
    { label: "Negociar uma aliança", detail: "Paga caro e divide o mercado, mas a Liga não ataca.", effect: { prestige: 5, favor: 5 }, cost: 300000, needsMoney: 300000, flag: "rebeliao-alianca" },
    { label: "Comprar as arenas uma a uma", detail: "Caríssimo, mas a Liga deixa de existir.", effect: { prestige: 12, popularity: -5 }, cost: 1200000, needsMoney: 1200000, flag: "rebeliao-compra" },
  ],
};

export const DECREE_STORIES: DecreeStory[] = [
  { id: "vinganca", name: "A vingança", description: "Um rival busca revanche diante da plateia.", needs: "rivalidade", bonus: 10 },
  { id: "ascensao", name: "A ascensão do desconhecido", description: "Um novato que ninguém conhecia derruba os favoritos.", needs: "desconhecido", bonus: 9 },
  { id: "queda", name: "A queda do campeão", description: "O favorito tropeça e o público vê o fim de uma era.", needs: "campeao", bonus: 8 },
  { id: "irmaos", name: "Irmãos de armas", description: "Dois amigos lutam lado a lado — ou frente a frente.", needs: "amizade", bonus: 7 },
  { id: "gloria", name: "Glória a Roma", description: "Uma história simples de coragem e vitória.", needs: "nenhum", bonus: 4 },
];

export const TUTORIAL = [
  { id: "t1", title: "Seu primeiro espetáculo", text: "Vá em Eventos → Novo evento. Escolha o Combate de demonstração, dois gladiadores e um preço, veja a estimativa e toque em Confirmar. Depois toque em «Iniciar evento agora».", check: "events>=1" },
  { id: "t2", title: "Avance a semana", text: "Toque em «Iniciar evento agora» (ou no botão dourado do topo). O evento acontece, os salários são pagos e o mundo se move.", check: "week>=2" },
  { id: "t3", title: "Evolua", text: "Use pontos de evolução na Árvore. Comece por algo barato, como Noite de duelos ou Cartazes.", check: "nodes>=1" },
  { id: "t4", title: "Construa", text: "Em Construção, amplie a arquibancada quando o público começar a ficar de fora.", check: "builds>=1" },
  { id: "t5", title: "Contrate", text: "No mercado de gladiadores, contrate alguém que combine com as modalidades que você quer.", check: "hires>=1" },
  { id: "t6", title: "Rumo à Glória Romana", text: "Realize 6 espetáculos e chegue a 60 de fama para entrar na Era 2.", check: "era>=2" },
];

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  secret?: boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "primeiro", title: "Que comecem os jogos", description: "Realize o primeiro espetáculo." },
  { id: "lotado", title: "Casa cheia", description: "Lote a arena num evento." },
  { id: "mil", title: "Mil vozes", description: "1.000 espectadores num único evento." },
  { id: "dezmil", title: "Uma cidade inteira", description: "10.000 espectadores num único evento." },
  { id: "satisfacao", title: "Delírio na arquibancada", description: "Satisfação de 95% ou mais." },
  { id: "rico", title: "Cofre cheio", description: "Junte 50.000 moedas." },
  { id: "arvore10", title: "Engenheiro de espetáculos", description: "Desbloqueie 10 melhorias." },
  { id: "arvore40", title: "Mestre da evolução", description: "Desbloqueie 40 melhorias." },
  { id: "estrela", title: "Nasce uma estrela", description: "Tenha um gladiador com 50 de fama." },
  { id: "lenda", title: "Lenda viva", description: "Tenha um gladiador com 90 de fama." },
  { id: "tres-lendas", title: "Panteão", description: "Tenha três gladiadores lendários ao mesmo tempo." },
  { id: "desconhecido", title: "Do nada ao topo", description: "Leve um gladiador contratado com menos de 10 de fama até 60." },
  { id: "filial", title: "Além do Tibre", description: "Abra a primeira filial." },
  { id: "mundo", title: "O mundo é a arena", description: "Tenha filiais em 5 regiões." },
  { id: "rival-vencido", title: "Fim da Dominus", description: "Derrote a Dominus Arena." },
  { id: "liga", title: "Mais forte que todos juntos", description: "Supere a Liga das Arenas Livres." },
  { id: "bets-100", title: "Oráculo do Fórum", description: "Tenha 1.000 participantes no Arena Bets." },
  { id: "credibilidade", title: "Palavra de ouro", description: "Credibilidade do mercado acima de 90." },
  { id: "decreto", title: "O roteirista do império", description: "Realize 5 espetáculos roteirizados." },
  { id: "livre", title: "Que vença o melhor", description: "Realize 30 competições livres." },
  { id: "crises", title: "Mão firme", description: "Atravesse 10 crises." },
  { id: "era6", title: "Legado eterno", description: "Chegue à Era 6." },
  { id: "vitoria", title: "Imperador do Entretenimento", description: "Vença a campanha." },
  { id: "exclusivo", title: "Visionário", description: "Crie um espetáculo exclusivo no Ateliê.", secret: true },
  { id: "naumaquia", title: "Almirante da arena", description: "Realize uma naumaquia.", secret: true },
  { id: "falido", title: "Por um fio", description: "Sobreviva a 3 semanas no vermelho.", secret: true },
];
