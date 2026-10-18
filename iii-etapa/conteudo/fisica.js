(window.MATERIAS = window.MATERIAS || []).push({
  id: "fisica",
  nome: "Ciências · Física",
  icone: "⚡",
  prova: "AV2: Cap. 6 (eletricidade e consumo) · AV3: Cap. 6 e Cap. 7 (magnetismo)",
  topicos: [
    {
      titulo: "Carga, corrente, tensão e resistência",
      av: "AV2 · AV3",
      intro: "Para entender a eletricidade de casa (tomadas, chuveiro, conta de luz), precisamos de quatro ideias: **carga**, **corrente**, **tensão** e **resistência**.",
      secoes: [
        {
          h: "1. Carga elétrica",
          lista: [
            "A matéria é feita de átomos com **prótons (+)**, **elétrons (−)** e nêutrons (sem carga).",
            "Cargas **iguais se repelem**; cargas **diferentes se atraem**.",
            "Um corpo fica eletrizado quando ganha elétrons (fica negativo) ou perde elétrons (fica positivo). Formas de eletrização: **atrito**, **contato** e **indução**.",
            "**Condutores** deixam as cargas se moverem com facilidade (metais, como o cobre); **isolantes** dificultam (borracha, plástico, vidro)."
          ]
        },
        {
          h: "2. Corrente elétrica (i)",
          p: [
            "É o **movimento ordenado de cargas** (nos fios, elétrons) através de um condutor. Unidade: **ampère (A)**. Só existe corrente se o **circuito estiver fechado**.",
          ],
          lista: [
            "**Corrente contínua (CC)**: flui sempre no mesmo sentido (pilhas, baterias).",
            "**Corrente alternada (CA)**: muda de sentido muitas vezes por segundo (tomadas de casa, 60 vezes por segundo no Brasil)."
          ]
        },
        {
          h: "3. Tensão elétrica (U ou V)",
          p: [
            "Também chamada de **diferença de potencial (ddp)** ou 'voltagem'. É o 'empurrão' que faz as cargas se moverem. Unidade: **volt (V)**. No Brasil as tomadas são de **127 V** ou **220 V**, dependendo da região."
          ],
          atencao: "Ligar um aparelho de 127 V numa tomada de 220 V pode queimá-lo. Um aparelho de 220 V ligado em 127 V funciona mal (fraco)."
        },
        {
          h: "4. Resistência elétrica (R) e a Lei de Ohm",
          p: [
            "É a **dificuldade** que um material oferece à passagem da corrente. Unidade: **ohm (Ω)**. Quanto maior a resistência, menor a corrente (para a mesma tensão).",
            "**Lei de Ohm: U = R · i**"
          ],
          exercicio: {
            enunciado: "Um resistor de 20 Ω está ligado a uma tensão de 120 V. Qual a corrente?",
            passos: ["U = R · i", "120 = 20 · i", "i = 120 ÷ 20 = 6"],
            resposta: "i = 6 A."
          },
          exemplo: { titulo: "Efeito Joule", texto: "Quando a corrente passa por uma resistência, parte da energia vira **calor**. É o que aquece o chuveiro, o ferro de passar e a torradeira. Nas lâmpadas incandescentes, o filamento esquenta tanto que brilha." }
        }
      ],
      revisao: [
        "Corrente (A): movimento ordenado de cargas; precisa de circuito fechado.",
        "Tensão (V): o 'empurrão'; tomadas de 127 V ou 220 V.",
        "Resistência (Ω): dificuldade à passagem.",
        "Lei de Ohm: U = R · i.",
        "Efeito Joule: corrente em resistência gera calor."
      ]
    },
    {
      titulo: "Potência, energia e a conta de luz",
      av: "AV2 · AV3",
      intro: "É o assunto que mais aparece em conta na prova: calcular **quanto um aparelho gasta** e **quanto custa**.",
      secoes: [
        {
          h: "1. Potência elétrica (P)",
          p: [
            "Indica **quanta energia o aparelho usa por segundo**. Unidade: **watt (W)**; 1 kW = 1000 W.",
            "**P = U · i** (potência = tensão × corrente)."
          ],
          tabela: {
            cab: ["Aparelho", "Potência típica"],
            linhas: [
              ["Chuveiro elétrico", "4 000 a 7 500 W (um dos maiores consumos da casa)"],
              ["Ar-condicionado", "1 000 a 3 000 W"],
              ["Micro-ondas", "1 000 a 1 500 W"],
              ["Geladeira", "100 a 250 W (mas fica ligada o dia todo)"],
              ["TV", "50 a 150 W"],
              ["Lâmpada LED", "5 a 15 W"]
            ]
          },
          exercicio: {
            enunciado: "Um secador ligado em 220 V puxa uma corrente de 5 A. Qual sua potência?",
            passos: ["P = U · i", "P = 220 · 5 = 1100"],
            resposta: "1 100 W (1,1 kW)."
          }
        },
        {
          h: "2. Energia consumida (E)",
          p: [
            "**E = P · Δt** (potência × tempo de uso).",
            "A companhia elétrica cobra em **quilowatt-hora (kWh)**: é a energia de um aparelho de 1 kW ligado por 1 hora. Por isso, use a **potência em kW** e o **tempo em horas**."
          ],
          exercicio: [
            {
              enunciado: "Um chuveiro de 5 000 W é usado 30 minutos por dia. Quanto consome em 30 dias?",
              passos: ["P = 5 000 W = 5 kW.", "Tempo por dia: 30 min = 0,5 h. Em 30 dias: 0,5 × 30 = 15 h.", "E = 5 × 15 = 75 kWh."],
              resposta: "75 kWh por mês."
            },
            {
              enunciado: "Se o kWh custa R$ 0,80, quanto custa esse banho no mês?",
              passos: ["Custo = energia × tarifa", "75 × 0,80 = 60"],
              resposta: "R$ 60,00."
            }
          ],
          atencao: "Erro comum: esquecer de converter watts para kW (÷ 1000) ou minutos para horas (÷ 60)."
        },
        {
          h: "3. A conta de luz",
          lista: [
            "O **medidor** (relógio de luz) registra o consumo em kWh. A conta é a leitura atual menos a anterior.",
            "Além da energia, a conta tem impostos e taxas.",
            "**Bandeiras tarifárias** (verde, amarela, vermelha) indicam se a geração de energia está mais cara (por exemplo, em secas, quando as usinas termelétricas precisam ser ligadas)."
          ]
        },
        {
          h: "4. Como economizar",
          lista: [
            "Banhos mais curtos e o chuveiro na posição 'verão' (morno, menor potência).",
            "Trocar lâmpadas comuns por **LED**.",
            "Escolher aparelhos com **selo Procel / etiqueta A** (mais eficientes).",
            "Não deixar a geladeira aberta nem aparelhos em stand-by o tempo todo.",
            "Aproveitar a luz natural e passar roupas acumuladas de uma vez."
          ]
        }
      ],
      revisao: [
        "P = U · i (watt).",
        "E = P · Δt; em kWh use P em kW e t em horas.",
        "Custo = kWh × preço do kWh.",
        "Chuveiro é um dos maiores consumos; LED economiza."
      ]
    },
    {
      titulo: "Circuitos, segurança e geração de energia",
      av: "AV2 · AV3",
      intro: "Como os aparelhos são ligados, como a instalação se protege e de onde vem a energia que chega às tomadas.",
      secoes: [
        {
          h: "1. Circuito elétrico",
          p: ["Um circuito simples tem: **fonte** (pilha, tomada), **fios condutores**, **receptor/consumidor** (lâmpada, motor) e, geralmente, um **interruptor** que abre ou fecha o caminho."]
        },
        {
          h: "2. Série × paralelo",
          tabela: {
            cab: ["", "Em série", "Em paralelo"],
            linhas: [
              ["Caminho da corrente", "Um só caminho", "Vários caminhos"],
              ["Se um aparelho queimar", "**Todos apagam**", "Os outros **continuam funcionando**"],
              ["Tensão", "Dividida entre os aparelhos", "A mesma para todos"],
              ["Exemplo", "Alguns pisca-piscas antigos", "**Instalação das casas** (cada tomada é independente)"]
            ]
          }
        },
        {
          h: "3. Proteção e segurança",
          lista: [
            "**Fusível** e **disjuntor**: desligam o circuito quando a corrente fica alta demais (sobrecarga ou curto-circuito), evitando incêndios. O fusível queima e precisa ser trocado; o disjuntor 'desarma' e pode ser religado.",
            "**Fio terra**: desvia correntes indesejadas para o solo, evitando choques em aparelhos com carcaça metálica.",
            "**Curto-circuito**: a corrente encontra um caminho de resistência quase zero, ficando enorme e aquecendo os fios.",
            "Evite: benjamins sobrecarregados, mexer em aparelhos com mãos molhadas, fios descascados, pipas perto da rede elétrica."
          ]
        },
        {
          h: "4. Geração e transmissão",
          lista: [
            "Usinas transformam outras formas de energia em elétrica: **hidrelétricas** (água), **termelétricas** (queima de combustível), **eólicas** (vento), **solares** (luz), **nucleares**.",
            "A maioria usa um **gerador**: ímãs e bobinas girando produzem corrente (é a indução eletromagnética, vista em Magnetismo).",
            "**Transformadores** elevam a tensão para transportar a energia por longas distâncias com menos perda, e depois a abaixam para chegar às casas."
          ]
        }
      ],
      revisao: [
        "Série: um caminho, se um queima todos apagam. Paralelo: caminhos independentes (casas).",
        "Disjuntor/fusível protegem contra sobrecarga e curto.",
        "Fio terra evita choques.",
        "Geradores usam ímãs e bobinas; transformadores mudam a tensão."
      ]
    },
    {
      titulo: "Magnetismo: ímãs e campo magnético",
      av: "AV3",
      intro: "Magnetismo é a propriedade de certos materiais de **atrair ferro** e de interagir uns com os outros. A Terra inteira se comporta como um ímã gigante.",
      secoes: [
        {
          h: "1. Ímãs e seus polos",
          lista: [
            "Todo ímã tem **dois polos**: **norte (N)** e **sul (S)**.",
            "Polos **iguais se repelem**; polos **diferentes se atraem**.",
            "**Inseparabilidade dos polos**: se você quebrar um ímã ao meio, cada pedaço vira um novo ímã completo, com norte e sul. Nunca se obtém um polo isolado.",
            "Ímãs atraem materiais **ferromagnéticos**: ferro, níquel, cobalto e algumas ligas (como o aço). Não atraem alumínio, cobre, plástico, madeira nem ouro."
          ]
        },
        {
          h: "2. Campo magnético",
          p: [
            "É a região ao redor do ímã onde ele exerce sua força. É representado por **linhas de campo** que saem do polo **norte** e entram no polo **sul**. Onde as linhas estão mais juntas (perto dos polos), o campo é mais forte.",
            "Dá para 'ver' o campo espalhando limalha de ferro ao redor de um ímã."
          ]
        },
        {
          h: "3. A Terra como ímã e a bússola",
          lista: [
            "A Terra tem um **campo magnético** (gerado pelo movimento do metal líquido do núcleo externo).",
            "A **bússola** tem uma agulha imantada que se alinha com esse campo e aponta para o **norte geográfico**.",
            "Curiosidade: o polo norte da agulha é atraído por um polo **sul magnético**. Por isso, perto do **norte geográfico** fica o **sul magnético** da Terra.",
            "O campo magnético nos protege do **vento solar**; as **auroras boreais e austrais** acontecem quando partículas do Sol são desviadas para perto dos polos."
          ]
        }
      ],
      revisao: [
        "Polos iguais se repelem; diferentes se atraem.",
        "Polos são inseparáveis: quebrou, virou dois ímãs.",
        "Linhas de campo: saem do norte e entram no sul.",
        "Atrai ferro, níquel e cobalto (não alumínio nem cobre).",
        "Bússola aponta o norte geográfico (lá fica o sul magnético)."
      ]
    },
    {
      titulo: "Eletromagnetismo: a ligação entre eletricidade e magnetismo",
      av: "AV3",
      intro: "Eletricidade e magnetismo são duas faces do mesmo fenômeno: **corrente elétrica cria campo magnético**, e **campo magnético variando cria corrente**. É a base de motores, geradores e muito da tecnologia atual.",
      secoes: [
        {
          h: "1. A experiência de Oersted (1820)",
          p: [
            "Hans Christian **Oersted** percebeu que a agulha de uma bússola se mexia quando ficava perto de um fio com corrente. Conclusão: **corrente elétrica gera campo magnético** ao redor do fio."
          ]
        },
        {
          h: "2. Eletroímã",
          p: [
            "Enrolando um fio em espiral (**bobina**) em volta de um núcleo de ferro e passando corrente, obtém-se um **eletroímã**: um ímã que **liga e desliga** com a corrente e cuja força aumenta com mais corrente ou mais voltas no fio."
          ],
          lista: [
            "Usos: guindastes de ferro-velho, campainhas, fechaduras elétricas, alto-falantes, trens de levitação magnética (maglev), aparelhos de ressonância magnética."
          ]
        },
        {
          h: "3. Indução eletromagnética (Faraday)",
          p: [
            "Michael **Faraday** (1831) descobriu o caminho inverso: movimentar um ímã perto de uma bobina (ou a bobina perto do ímã) **gera corrente elétrica**. O campo magnético precisa **variar**: um ímã parado não gera corrente.",
            "É assim que funcionam os **geradores** das usinas: a água, o vapor ou o vento giram uma turbina ligada a ímãs e bobinas, produzindo eletricidade."
          ],
          exemplo: { titulo: "Dínamo da bicicleta", texto: "A roda gira um pequeno ímã dentro de uma bobina, gerando corrente para o farol. Pedalou mais rápido, a luz fica mais forte." }
        },
        {
          h: "4. Motor × gerador",
          tabela: {
            cab: ["", "Motor elétrico", "Gerador"],
            linhas: [
              ["Transforma", "Energia **elétrica → mecânica** (movimento)", "Energia **mecânica → elétrica**"],
              ["Exemplos", "Ventilador, liquidificador, carrinho elétrico", "Usinas, dínamo, aerogerador"]
            ]
          }
        },
        {
          h: "5. Transformador",
          p: ["Usa duas bobinas e um núcleo de ferro para **aumentar ou diminuir a tensão** da corrente alternada. Fica nos postes e nas subestações, e também dentro de carregadores de celular."]
        }
      ],
      revisao: [
        "Oersted: corrente gera campo magnético.",
        "Eletroímã: bobina com corrente + núcleo de ferro, liga e desliga.",
        "Faraday: campo magnético variando gera corrente (indução).",
        "Motor: elétrica → mecânica. Gerador: mecânica → elétrica.",
        "Transformador muda a tensão."
      ]
    }
  ],
  quiz: [
    { pergunta: "A unidade de corrente elétrica é o:", alternativas: ["Volt", "Ampère", "Ohm", "Watt"], correta: 1, explicacao: "Corrente em ampère (A); tensão em volt; resistência em ohm; potência em watt." },
    { pergunta: "Pela Lei de Ohm, um resistor de 10 Ω com corrente de 2 A está submetido a:", alternativas: ["5 V", "12 V", "20 V", "0,2 V"], correta: 2, explicacao: "U = R · i = 10 × 2 = 20 V." },
    { pergunta: "O aquecimento de um fio quando passa corrente é o efeito:", alternativas: ["Doppler", "Joule", "Estufa", "Oersted"], correta: 1, explicacao: "Efeito Joule: energia elétrica vira calor." },
    { pergunta: "As tomadas de casa fornecem corrente:", alternativas: ["Contínua", "Alternada", "Estática", "Magnética"], correta: 1, explicacao: "Corrente alternada, que muda de sentido 60 vezes por segundo." },
    { pergunta: "Um aparelho em 127 V com corrente de 10 A tem potência de:", alternativas: ["12,7 W", "137 W", "1 270 W", "127 W"], correta: 2, explicacao: "P = U · i = 127 × 10 = 1 270 W." },
    { pergunta: "Uma TV de 100 W ligada 5 h por dia consome em 30 dias:", alternativas: ["15 kWh", "150 kWh", "500 kWh", "3 kWh"], correta: 0, explicacao: "0,1 kW × 5 h × 30 = 15 kWh." },
    { pergunta: "Se 1 kWh custa R$ 0,90, um consumo de 200 kWh custa:", alternativas: ["R$ 90", "R$ 180", "R$ 200", "R$ 222"], correta: 1, explicacao: "200 × 0,90 = R$ 180." },
    { pergunta: "Nas residências, os aparelhos são ligados em:", alternativas: ["Série", "Paralelo", "Curto-circuito", "Bobina"], correta: 1, explicacao: "Em paralelo, cada aparelho funciona de forma independente." },
    { pergunta: "O dispositivo que desarma quando a corrente fica alta demais é o:", alternativas: ["Transformador", "Disjuntor", "Gerador", "Resistor"], correta: 1, explicacao: "O disjuntor protege contra sobrecarga e curto-circuito." },
    { pergunta: "Se um ímã for quebrado ao meio:", alternativas: ["Um pedaço fica só norte e outro só sul", "Cada pedaço vira um ímã com norte e sul", "Perde o magnetismo", "Vira eletroímã"], correta: 1, explicacao: "Inseparabilidade dos polos." },
    { pergunta: "Um ímã NÃO atrai:", alternativas: ["Ferro", "Níquel", "Alumínio", "Cobalto"], correta: 2, explicacao: "Alumínio não é ferromagnético." },
    { pergunta: "As linhas de campo magnético:", alternativas: ["Saem do sul e entram no norte", "Saem do norte e entram no sul", "São retas paralelas sempre", "Não existem fora do ímã"], correta: 1, explicacao: "Por convenção, saem do polo norte e entram no sul." },
    { pergunta: "Oersted mostrou que:", alternativas: ["Ímã em movimento gera corrente", "Corrente elétrica gera campo magnético", "A Terra é um ímã", "O átomo tem núcleo"], correta: 1, explicacao: "A agulha da bússola se mexeu perto do fio com corrente." },
    { pergunta: "O princípio de funcionamento dos geradores das usinas é:", alternativas: ["Efeito Joule", "Indução eletromagnética", "Eletrização por atrito", "Refração"], correta: 1, explicacao: "Faraday: campo magnético variando gera corrente." },
    { pergunta: "O motor elétrico transforma energia:", alternativas: ["Mecânica em elétrica", "Elétrica em mecânica", "Térmica em elétrica", "Luminosa em química"], correta: 1, explicacao: "O gerador faz o contrário." },
    { pergunta: "Um eletroímã fica mais forte quando:", alternativas: ["Diminuímos a corrente", "Aumentamos o número de voltas da bobina", "Tiramos o núcleo de ferro", "Usamos fio de plástico"], correta: 1, explicacao: "Mais voltas e mais corrente reforçam o campo." }
  ],
  flashcards: [
    { frente: "Lei de Ohm", verso: "U = R · i." },
    { frente: "Potência elétrica", verso: "P = U · i (watt)." },
    { frente: "Energia consumida", verso: "E = P · Δt (em kWh: P em kW e t em horas)." },
    { frente: "Corrente contínua × alternada", verso: "Contínua: um sentido (pilhas). Alternada: muda de sentido (tomadas)." },
    { frente: "Efeito Joule", verso: "Corrente passando por resistência gera calor (chuveiro, ferro)." },
    { frente: "Circuito em paralelo", verso: "Caminhos independentes; se um aparelho queima, os outros funcionam." },
    { frente: "Disjuntor", verso: "Desliga o circuito em sobrecarga ou curto-circuito." },
    { frente: "Fio terra", verso: "Desvia correntes para o solo e evita choques." },
    { frente: "Polos magnéticos", verso: "Iguais se repelem, diferentes se atraem; são inseparáveis." },
    { frente: "Materiais ferromagnéticos", verso: "Ferro, níquel e cobalto." },
    { frente: "Bússola", verso: "Agulha imantada que aponta o norte geográfico (onde está o sul magnético)." },
    { frente: "Experiência de Oersted", verso: "Corrente elétrica gera campo magnético." },
    { frente: "Indução eletromagnética", verso: "Campo magnético variando gera corrente (Faraday) — geradores." },
    { frente: "Eletroímã", verso: "Bobina com corrente e núcleo de ferro; liga e desliga." },
    { frente: "Transformador", verso: "Aumenta ou diminui a tensão da corrente alternada." }
  ]
});
