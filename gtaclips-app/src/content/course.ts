// Curso: do zero a um canal organizado. Conteúdo educativo, sem promessa de monetização.
// Dados de monetização verificados em 15/11/2026 (links oficiais em cada lição).

export interface Lesson {
  id: string;
  title: string;
  body: string[];
  steps?: string[];
  links?: { label: string; url: string }[];
}

export interface Module {
  id: string;
  title: string;
  goal: string;
  lessons: Lesson[];
}

export const VERIFIED_AT = "15/11/2026";

export const YT = {
  ypp: "https://support.google.com/youtube/answer/72851?hl=pt-BR",
  changes: "https://support.google.com/youtube/answer/12843009?hl=pt-BR",
  policies: "https://support.google.com/youtube/answer/1311392?hl=pt-BR",
  copyright: "https://support.google.com/youtube/answer/2797370?hl=pt-BR",
  adsense: "https://support.google.com/youtube/answer/72857?hl=pt-BR",
  shorts: "https://support.google.com/youtube/answer/10059070?hl=pt-BR",
  analytics: "https://support.google.com/youtube/answer/9002587?hl=pt-BR",
  rockstar: "https://support.rockstargames.com/articles/200153756",
};

export const COURSE: Module[] = [
  {
    id: "m1",
    title: "Módulo 1 — Criando o canal",
    goal: "Ter um canal com nome, visual e descrição profissionais.",
    lessons: [
      {
        id: "m1l1",
        title: "Conta Google",
        body: ["O canal fica ligado a uma Conta Google. Use uma conta só para o canal (fica mais fácil dar acesso a editores no futuro sem passar a sua senha pessoal).", "Ative a verificação em duas etapas: ela é exigida para o Programa de Parcerias e protege o canal contra invasões."],
        steps: ["Crie a conta em accounts.google.com", "Ative a verificação em duas etapas (Segurança → Verificação em duas etapas)", "Guarde os códigos de recuperação num lugar seguro"],
      },
      {
        id: "m1l2",
        title: "Criar o canal",
        body: ["No YouTube, toque na foto de perfil → Criar um canal. Escolha nome e identificador (@nome).", "Depois, em youtube.com/verify, verifique o telefone para liberar vídeos com mais de 15 minutos, miniaturas personalizadas e transmissões ao vivo."],
        steps: ["Criar o canal", "Escolher o @identificador", "Verificar o telefone (recursos avançados)"],
      },
      {
        id: "m1l3",
        title: "Nome e identidade visual",
        body: ["Um bom nome é curto, fácil de falar e de buscar, e diz o que o canal entrega (ex.: algo com GTA, perseguições, momentos insanos…).", "Evite usar marcas registradas (como 'Rockstar' ou o logotipo do GTA) como se o canal fosse oficial: isso pode gerar denúncia de marca e confunde o público.", "Defina 2 ou 3 cores e uma fonte e use sempre: miniaturas, banner e legendas ficam reconhecíveis."],
      },
      {
        id: "m1l4",
        title: "Foto e banner",
        body: ["Foto de perfil: 800×800 px, legível em tamanho pequeno (rosto, símbolo ou iniciais).", "Banner: 2560×1440 px, com o conteúdo importante na área central segura de 1546×423 px (é o que aparece no celular).", "Diga no banner o que o canal posta e com que frequência (ex.: 'Clipes insanos de GTA toda semana')."],
      },
      {
        id: "m1l5",
        title: "Descrição profissional",
        body: ["As primeiras linhas aparecem na busca: comece dizendo o que o canal é e para quem.", "Inclua a frequência de publicação, as palavras que o público busca (GTA 6, perseguições, momentos engraçados…) e um contato profissional.", "Exemplo: 'Os momentos mais insanos de GTA: perseguições, explosões e situações absurdas, editados em clipes curtos. Vídeo novo toda terça e sexta.'"],
      },
    ],
  },
  {
    id: "m2",
    title: "Módulo 2 — Preparando o canal",
    goal: "Saber para quem você faz vídeos e como eles vão ser reconhecidos.",
    lessons: [
      { id: "m2l1", title: "Escolher um nicho", body: ["Nicho é o recorte do que você publica. 'Gameplay de GTA' é amplo; 'perseguições policiais de GTA com narração engraçada' é um nicho.", "Um nicho claro ajuda o YouTube a recomendar seus vídeos para as pessoas certas e faz o público voltar.", "Use a aba Análise do canal (depois de conectar) para ver que tipo de clipe funciona melhor e ajustar o foco."] },
      { id: "m2l2", title: "Definir o público", body: ["Pense em quem assiste: idade, o que já sabe do jogo, se prefere humor, ação ou dicas.", "Isso define o ritmo dos cortes, o tipo de legenda e até o horário de postagem. Para conteúdo com violência de jogo, lembre que o público não deve ser marcado como 'conteúdo para crianças' sem ser."] },
      { id: "m2l3", title: "Identidade dos vídeos", body: ["Repita elementos: o mesmo estilo de legenda, a mesma abertura curta, a mesma forma de terminar (pergunta para os comentários, chamada para a próxima parte).", "No GTA Clips AI, escolha um estilo de legenda e use sempre o mesmo."] },
      { id: "m2l4", title: "Playlists", body: ["Agrupe por tema (Perseguições, Explosões, Série 'Do zero ao milionário'…) e por série (Parte 1, 2, 3 do modo história contínua).", "Playlists aumentam o tempo de sessão: quem termina um vídeo já vê o próximo."] },
      { id: "m2l5", title: "Títulos interessantes", body: ["O título promete o que o vídeo entrega — nada de enganar. Curiosidade honesta funciona: 'A fuga mais absurda que já fiz no GTA'.", "Coloque a palavra que o público busca no começo (GTA 6, perseguição…). Shorts: títulos curtos, até ~60 caracteres.", "Teste variações e compare na aba Análise."] },
      { id: "m2l6", title: "Miniaturas (thumbnails)", body: ["1280×720 px, rosto ou ação clara, no máximo 3–4 palavras grandes, contraste alto.", "A miniatura deve mostrar algo que realmente acontece no vídeo.", "Nos Shorts, a miniatura aparece em alguns lugares (canal, busca); escolha um quadro forte ao publicar."] },
    ],
  },
  {
    id: "m3",
    title: "Módulo 3 — Publicando vídeos",
    goal: "Publicar Shorts e vídeos longos com tudo preenchido do jeito certo.",
    lessons: [
      { id: "m3l1", title: "Publicar Shorts", body: ["Shorts são vídeos verticais (9:16) ou quadrados de até 3 minutos. Exporte em 9:16 no GTA Clips AI.", "No app do YouTube: + → Enviar um vídeo → escolha o MP4. No computador: Criar → Enviar vídeos.", "Shorts com mais de 1 minuto: confira se a música de fundo (se houver) é permitida — o app não adiciona músicas."], links: [{ label: "Ajuda: Shorts", url: YT.shorts }] },
      { id: "m3l2", title: "Publicar vídeos tradicionais", body: ["Exporte em 16:9. Vídeos longos permitem capítulos (marque 00:00 Início, 01:20 A perseguição…) na descrição.", "Programe a publicação para o horário em que seu público está online (YouTube Studio → Público)."] },
      { id: "m3l3", title: "Títulos e descrições", body: ["Descrição: 2–3 linhas sobre o vídeo, depois links e créditos. Diga que é gameplay de GTA e se houve edição.", "Na aba Publicar deste app, gere título, descrição e hashtags para cada clipe exportado."] },
      { id: "m3l4", title: "Hashtags", body: ["Use 3 a 5 hashtags relevantes (#GTA6 #GTA #Shorts…). Mais que isso pode ser ignorado e excesso de hashtags pode ir contra as políticas.", "As 3 primeiras aparecem acima do título."] },
      { id: "m3l5", title: "Miniaturas", body: ["Vídeos longos: envie a miniatura personalizada (precisa do telefone verificado).", "Mostre o momento principal da história; evite enganar."] },
      { id: "m3l6", title: "Analisar os resultados", body: ["Depois de 48 horas, veja no YouTube Studio: impressões, taxa de cliques, retenção média e de onde vieram as visualizações.", "Conecte o canal na aba Análise para o GTA Clips AI aprender que tipo de clipe funciona melhor para você."], links: [{ label: "Ajuda: YouTube Analytics", url: YT.analytics }] },
    ],
  },
  {
    id: "m4",
    title: "Módulo 4 — Monetização",
    goal: "Entender as regras oficiais. Monetização nunca é garantida.",
    lessons: [
      {
        id: "m4l1",
        title: "Requisitos atuais do Programa de Parcerias (YPP)",
        body: [
          `Verificado em ${VERIFIED_AT}. Sempre confirme no link oficial: as regras mudam.`,
          "Nível 1 (recursos de fãs e Shopping, onde disponível, incluindo o Brasil): 500 inscritos, 3 envios públicos válidos nos últimos 90 dias e 3.000 horas de exibição públicas válidas nos últimos 12 meses OU 3 milhões de visualizações válidas de Shorts nos últimos 90 dias.",
          "Nível 2 (participação na receita de anúncios): 1.000 inscritos e 4.000 horas de exibição públicas válidas nos últimos 12 meses OU 10 milhões de visualizações válidas de Shorts nos últimos 90 dias.",
          "Mudança anunciada pelo YouTube: a partir de 1º de fevereiro de 2027, para novos participantes, a receita de anúncios passa a exigir 8.000 horas de exibição qualificadas nos últimos 365 dias OU 20 milhões de visualizações qualificadas de Shorts nos últimos 90 dias (continuam os 1.000 inscritos). Quem já está no programa não é afetado.",
          "Também é preciso: morar num país onde o programa existe, seguir as políticas de monetização, não ter avisos ativos das Diretrizes da Comunidade, ter a verificação em duas etapas ativa e uma conta do AdSense vinculada.",
        ],
        links: [
          { label: "Visão geral e requisitos do YPP", url: YT.ypp },
          { label: "Mudanças no YPP (2027)", url: YT.changes },
        ],
      },
      { id: "m4l2", title: "Níveis de acesso à monetização", body: ["Recursos de fãs (nível 1): Clubes de canais, Super Chat, Super Stickers, Super Thanks e Shopping.", "Receita de anúncios (nível 2): anúncios em vídeos longos (55% da receita líquida para o criador) e participação na receita dos Shorts (45% da parte alocada aos criadores, segundo o YouTube), além da receita do YouTube Premium.", "Os percentuais e regras são do YouTube e podem mudar: confira o link oficial."], links: [{ label: "Visão geral do YPP", url: YT.ypp }] },
      { id: "m4l3", title: "Visualizações válidas", body: ["São visualizações públicas de Shorts no feed de Shorts nos últimos 90 dias, descontadas as que o YouTube considera inválidas (tráfego artificial, automatizado ou incentivado).", "Comprar visualizações ou inscritos viola as políticas e pode tirar o canal do programa."] },
      { id: "m4l4", title: "Horas públicas de exibição", body: ["Contam as horas assistidas em vídeos longos públicos nos últimos 12 meses.", "Não contam: visualizações de Shorts no feed de Shorts, vídeos privados, não listados ou excluídos, e campanhas de anúncios."] },
      { id: "m4l5", title: "Como funciona o AdSense", body: ["O AdSense para YouTube é por onde o pagamento chega. Cada canal se vincula a uma conta.", "O pagamento sai quando o saldo atinge o limite mínimo definido pelo AdSense para a sua moeda, depois de verificar endereço (PIN pelo correio), dados fiscais e forma de pagamento."], links: [{ label: "Ajuda: AdSense para YouTube", url: YT.adsense }] },
      { id: "m4l6", title: "Como solicitar", body: ["YouTube Studio → Ganhar dinheiro. Quando os números forem atingidos, aceite os termos, vincule o AdSense e aguarde a revisão humana (costuma levar cerca de um mês).", "A revisão olha o canal como um todo: tema principal, vídeos mais vistos, mais recentes e com mais tempo de exibição."] },
      { id: "m4l7", title: "Acompanhar os ganhos", body: ["YouTube Studio → Analytics → Receita: receita estimada, RPM e quais vídeos rendem mais.", "Os valores são estimativas até o fechamento do mês no AdSense."] },
      { id: "m4l8", title: "Conteúdo de gameplay e reutilizado", body: ["Gameplay pode ser monetizada quando há contribuição sua: comentários, narração, edição significativa, contexto, histórias.", "A política de 'conteúdo reutilizado' pode tirar a monetização de canais que só republicam material de outras pessoas sem acrescentar valor — mesmo com permissão.", "A política de 'conteúdo inautêntico' (antes chamada de conteúdo repetitivo) atinge vídeos produzidos em massa, quase iguais entre si. Variar histórias e acrescentar sua voz é essencial.", "Usar este app para cortar a SUA gameplay não garante aprovação: o que conta é o canal como um todo."], links: [{ label: "Políticas de monetização de canais", url: YT.policies }] },
    ],
  },
  {
    id: "m5",
    title: "Módulo 5 — Crescimento",
    goal: "Usar dados reais para melhorar um vídeo de cada vez.",
    lessons: [
      { id: "m5l1", title: "Retenção de audiência", body: ["No Studio, o gráfico de retenção mostra onde as pessoas saem. Quedas nos primeiros 3 segundos indicam início fraco; quedas no meio, trechos lentos.", "No GTA Clips AI, use o contexto curto (2–3 s) e comece perto da ação. A aba Análise mostra a curva de retenção dos seus vídeos conectados."] },
      { id: "m5l2", title: "Vídeos que performam melhor", body: ["Compare por tipo: perseguições x explorações, humor x ação. A aba Análise agrupa seus vídeos por tipo de acontecimento automaticamente.", "Quando um tipo vai melhor (com pelo menos 3 vídeos), o app passa a dar um pouco mais de nota para esse tipo de momento — você pode desligar isso."] },
      { id: "m5l3", title: "Melhorar títulos", body: ["Se a taxa de cliques está baixa, teste outro título nos primeiros dias.", "Títulos que descrevem a história ('A fuga terminou numa batida') costumam funcionar melhor que genéricos ('GTA gameplay #12')."] },
      { id: "m5l4", title: "Melhorar miniaturas", body: ["Use o 'Testar e comparar' do YouTube (quando disponível) para testar até 3 miniaturas no mesmo vídeo.", "Mostre o clímax da história e um texto curto."] },
      { id: "m5l5", title: "Frequência de publicação", body: ["Constância vale mais que volume: escolha um ritmo que dá para manter (ex.: 3 Shorts por semana + 1 vídeo longo).", "O modo história contínua ajuda a criar séries (Parte 1, 2, 3) que fazem o público voltar."] },
      { id: "m5l6", title: "Interpretar o YouTube Studio", body: ["Visão geral: visualizações, tempo de exibição e inscritos.", "Conteúdo: desempenho de cada vídeo e Short.", "Público: quando seu público está online e o que mais assiste.", "Pesquisa: o que as pessoas estão buscando no seu nicho."], links: [{ label: "Ajuda: YouTube Analytics", url: YT.analytics }] },
    ],
  },
];

export const POLICY_SECTIONS = [
  {
    title: "Direitos autorais no YouTube",
    body: [
      "Você só deve publicar o que tem direito de usar. Músicas, trechos de filmes, vídeos de outros criadores e transmissões alheias podem gerar reivindicações do Content ID ou avisos de direitos autorais.",
      "O GTA Clips AI não adiciona músicas nem efeitos sonoros: o áudio é só o da sua gravação. Se você colocar música depois, use faixas com licença (ex.: Biblioteca de Áudio do YouTube).",
      "Atenção às rádios do jogo: músicas licenciadas tocando no carro podem gerar reivindicação de Content ID. Nas configurações do jogo costuma haver opção de desligar músicas protegidas para gravação/streaming — confira no seu jogo.",
    ],
    link: { label: "Ajuda: direitos autorais", url: YT.copyright },
  },
  {
    title: "Conteúdo reutilizado e inautêntico",
    body: [
      "Conteúdo reutilizado: material de outras pessoas sem acréscimo significativo. Ter permissão para usar um vídeo NÃO garante aprovação na monetização.",
      "Conteúdo inautêntico: vídeos produzidos em massa, repetitivos ou feitos a partir de um modelo com pouca variação.",
      "O que ajuda: narração ou comentários seus, histórias com começo/meio/fim, contexto, edição significativa, variedade de temas, títulos e descrições escritos por você.",
    ],
    link: { label: "Políticas de monetização de canais", url: YT.policies },
  },
  {
    title: "GTA e a política da Rockstar Games",
    body: [
      "A Rockstar mantém uma 'Política de publicação de material protegido por direitos autorais da Rockstar Games' (atualizada em 10/01/2025, segundo a própria página). Ela permite que fãs publiquem vídeos de gameplay, mas fala em uso não comercial e remove: cenas cinematográficas isoladas (cutscenes sem jogabilidade), finais e grandes revelações da história (spoilers), material de antes do lançamento e entretenimento do jogo (como programas de TV do jogo).",
      "Sobre ganhar dinheiro com vídeos: leia a política oficial com atenção antes de monetizar. Em caso de dúvida, a própria política indica o contato copyright@take2games.com. A Take-Two pode remover material a qualquer momento.",
      "GTA 6: publique só gravações feitas depois do lançamento oficial, evite spoilers da história principal e não publique cutscenes isoladas. Use o modo de edição para manter os trechos com jogabilidade.",
      "Não use logotipos e nomes da Rockstar de forma que pareça um canal oficial.",
    ],
    link: { label: "Política oficial da Rockstar Games", url: YT.rockstar },
  },
  {
    title: "O que este app faz (e não faz) por você",
    body: [
      "Ele analisa a SUA gravação, encontra os melhores momentos, monta histórias e exporta MP4 prontos para enviar.",
      "Ele não garante visualizações nem monetização, não publica nada sozinho e não usa números inventados: as métricas de audiência só aparecem quando você conecta o seu canal pela API oficial do YouTube.",
    ],
  },
];
