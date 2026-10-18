(window.MATERIAS = window.MATERIAS || []).push({
  id: "biologia",
  nome: "Ciências · Biologia",
  icone: "🧬",
  prova: "AV2: Cap. 12 (reprodução) · AV3: Cap. 4 (reino animal) e Cap. 6 (energia no corpo)",
  topicos: [
    {
      titulo: "Reprodução assexuada",
      av: "AV2",
      intro: "Reproduzir-se é gerar descendentes e garantir que a espécie continue. Existem duas grandes estratégias: a **assexuada** (um só indivíduo, sem gametas) e a **sexuada** (com gametas e fecundação). Ao longo da evolução, os seres vivos desenvolveram formas cada vez mais variadas de se reproduzir.",
      secoes: [
        {
          h: "1. O que é",
          p: [
            "Na reprodução assexuada, **um único indivíduo** gera descendentes, **sem gametas** e sem fecundação. Os filhos são **geneticamente idênticos** ao pai/mãe (são **clones**), exceto quando ocorrem mutações."
          ]
        },
        {
          h: "2. Tipos",
          tabela: {
            cab: ["Tipo", "Como acontece", "Exemplos"],
            linhas: [
              ["**Divisão binária (bipartição)**", "A célula se divide em duas iguais", "Bactérias, amebas, paramécios"],
              ["**Brotamento**", "Forma-se um 'broto' que cresce e se solta (ou fica preso, formando colônias)", "Leveduras (fermento), hidras, esponjas"],
              ["**Fragmentação / regeneração**", "O corpo se parte e cada pedaço regenera um indivíduo inteiro", "Planárias, estrelas-do-mar (se o pedaço tiver parte do disco central)"],
              ["**Esporulação**", "Formação de esporos que dão origem a novos indivíduos", "Fungos (bolor do pão), algas"],
              ["**Propagação vegetativa**", "Uma parte da planta (caule, folha, raiz) origina outra planta", "Batata (tubérculo), cana e mandioca (estacas), morango (estolão), folha-da-fortuna"],
              ["**Partenogênese**", "Um óvulo se desenvolve sem ser fecundado", "Abelhas (os machos/zangões), alguns lagartos e pulgões"]
            ]
          },
          atencao: "A partenogênese é especial: envolve um gameta (o óvulo), mas sem fecundação. Muitos livros a classificam junto com a assexuada, por não haver encontro de gametas."
        },
        {
          h: "3. Vantagens e desvantagens",
          tabela: {
            cab: ["Vantagens", "Desvantagens"],
            linhas: [
              ["Rápida e simples; não precisa de parceiro", "Pouca ou nenhuma **variabilidade genética**"],
              ["Gera muitos descendentes em pouco tempo", "Se o ambiente muda (doença, clima), todos podem morrer juntos, já que são iguais"],
              ["Ótima em ambientes estáveis", "Menor capacidade de adaptação a mudanças"]
            ]
          },
          exemplo: { titulo: "No dia a dia", texto: "Bananas cultivadas são quase todas clones. Por isso uma única doença (como o mal-do-Panamá) consegue atingir plantações inteiras." }
        }
      ],
      revisao: [
        "Assexuada: 1 indivíduo, sem gametas, descendentes clones.",
        "Tipos: bipartição, brotamento, fragmentação, esporulação, propagação vegetativa (e partenogênese).",
        "Vantagem: rapidez. Desvantagem: sem variabilidade genética."
      ]
    },
    {
      titulo: "Reprodução sexuada e a evolução da reprodução nos animais",
      av: "AV2",
      intro: "Na reprodução sexuada há **gametas** (células reprodutivas) que se unem na **fecundação**, formando o **zigoto**. Os filhos misturam características dos dois pais.",
      secoes: [
        {
          h: "1. Gametas, fecundação e variabilidade",
          lista: [
            "Gameta masculino: **espermatozoide** (nos animais) ou núcleo do **grão de pólen** (nas plantas).",
            "Gameta feminino: **óvulo** (ovócito) ou **oosfera** (nas plantas).",
            "Os gametas têm **metade** do material genético; o zigoto volta a ter a quantidade completa.",
            "Como cada filho recebe uma combinação diferente, surge a **variabilidade genética**: a grande vantagem da reprodução sexuada, porque aumenta a chance de alguns indivíduos sobreviverem a mudanças no ambiente."
          ],
          atencao: "**Hermafroditas** (minhoca, caracol) produzem os dois tipos de gametas, mas em geral fazem **fecundação cruzada** (trocam gametas com outro indivíduo), mantendo a variabilidade."
        },
        {
          h: "2. Fecundação externa × interna",
          tabela: {
            cab: ["", "Externa", "Interna"],
            linhas: [
              ["Onde ocorre", "Fora do corpo, geralmente na água", "Dentro do corpo da fêmea"],
              ["Quantidade de gametas", "Muitíssimos (a maioria se perde)", "Bem menos"],
              ["Exemplos", "Maioria dos peixes, anfíbios (sapos), ouriços", "Répteis, aves, mamíferos, insetos"],
              ["Relação com o ambiente", "Depende da água", "Permitiu a conquista do **ambiente terrestre**"]
            ]
          }
        },
        {
          h: "3. Onde o embrião se desenvolve",
          lista: [
            "**Ovíparos**: botam ovos; o embrião se desenvolve fora do corpo da mãe, nutrido pelas reservas do ovo. Aves, maioria dos répteis, insetos.",
            "**Vivíparos**: o embrião se desenvolve dentro do corpo da mãe, nutrido por ela (em mamíferos, pela **placenta**). Maioria dos mamíferos.",
            "**Ovovivíparos**: o ovo fica dentro da mãe até eclodir, mas o embrião se nutre das reservas do ovo. Alguns tubarões, cobras e peixes (como o guppy)."
          ]
        },
        {
          h: "4. Desenvolvimento direto × indireto",
          lista: [
            "**Direto**: o filhote já nasce parecido com o adulto (mamíferos, aves, répteis).",
            "**Indireto**: passa por **larva** e sofre **metamorfose**. Ex.: sapo (ovo → girino → adulto); borboleta (ovo → lagarta → pupa/crisálida → adulto)."
          ]
        },
        {
          h: "5. A grande 'invenção': o ovo amniótico",
          p: [
            "Anfíbios precisam voltar à água para se reproduzir: seus ovos não têm casca e secariam em terra. Os **répteis** desenvolveram o **ovo amniótico**, com **casca** e **membranas** (âmnio, córion, alantoide) e reservas (**vitelo**), que protegem o embrião contra a desidratação.",
            "Junto com a fecundação interna, isso permitiu que répteis, aves e mamíferos se reproduzissem **longe da água**, conquistando de vez o ambiente terrestre."
          ],
          exemplo: { titulo: "Linha da evolução da reprodução animal", texto: "Fecundação externa na água (peixes) → anfíbios ainda dependentes da água → répteis com fecundação interna e ovo amniótico → aves (ovo com casca e cuidado com os filhotes) → mamíferos (placenta e amamentação)." }
        },
        {
          h: "6. Cuidado parental",
          p: ["Em geral, quanto **menos filhotes** uma espécie produz, **mais cuidado** ela dedica a eles. Peixes podem soltar milhares de ovos sem cuidar; mamíferos têm poucos filhotes e cuidam por muito tempo (amamentação, proteção, ensino)."]
        }
      ],
      revisao: [
        "Sexuada: gametas + fecundação → zigoto; gera variabilidade genética.",
        "Fecundação externa (água) × interna (ambiente terrestre).",
        "Ovíparo, vivíparo, ovovivíparo.",
        "Direto × indireto (metamorfose).",
        "Ovo amniótico (répteis) = independência da água."
      ]
    },
    {
      titulo: "A evolução da reprodução nas plantas",
      av: "AV2",
      intro: "As plantas também passaram por uma 'evolução da reprodução', saindo da dependência da água até a invenção da **semente**, da **flor** e do **fruto**.",
      secoes: [
        {
          h: "1. Os quatro grandes grupos",
          tabela: {
            cab: ["Grupo", "Exemplo", "Vasos condutores", "Semente", "Flor/fruto", "Precisa de água para fecundar?"],
            linhas: [
              ["**Briófitas**", "Musgos", "Não", "Não", "Não", "**Sim** (o gameta nada até a oosfera)"],
              ["**Pteridófitas**", "Samambaias, avencas", "Sim", "Não", "Não", "**Sim**"],
              ["**Gimnospermas**", "Pinheiros, araucária", "Sim", "**Sim** (nua, sem fruto)", "Não têm flor verdadeira (têm estróbilos/pinhas)", "Não: usam o **grão de pólen**"],
              ["**Angiospermas**", "Mangueira, feijão, rosa", "Sim", "Sim, **dentro do fruto**", "**Sim**", "Não"]
            ]
          }
        },
        {
          h: "2. Esporos × sementes",
          lista: [
            "Briófitas e pteridófitas se espalham por **esporos**: células leves levadas pelo vento. Os esporos ficam, por exemplo, nos pontinhos marrons (soros) sob as folhas das samambaias.",
            "A **semente** (gimnospermas e angiospermas) leva um **embrião** protegido e com reserva de alimento, podendo esperar o momento certo para germinar. É uma enorme vantagem."
          ]
        },
        {
          h: "3. Grão de pólen e polinização",
          p: [
            "O **grão de pólen** leva o gameta masculino até o feminino **sem precisar de água**. Esse transporte é a **polinização**, que pode ser feita pelo **vento** (pinheiros, gramíneas) ou por **animais** (abelhas, beija-flores, morcegos), atraídos pelas cores, perfumes e néctar das flores.",
          ]
        },
        {
          h: "4. Flor e fruto (angiospermas)",
          lista: [
            "**Flor**: órgão reprodutor. Parte masculina: **estame** (antera + filete, produz pólen). Parte feminina: **pistilo/carpelo** (estigma, estilete, ovário com óvulos).",
            "Após a fecundação, o **óvulo vira semente** e o **ovário vira fruto**.",
            "O fruto **protege** a semente e ajuda na **dispersão**: animais comem o fruto e espalham as sementes (zoocoria); frutos leves voam (anemocoria); alguns boiam (hidrocoria)."
          ],
          atencao: "Pinhão (da araucária) **não é fruto**: as gimnospermas não têm fruto. O pinhão é uma semente."
        }
      ],
      revisao: [
        "Briófitas e pteridófitas: esporos, dependem de água.",
        "Gimnospermas: semente nua + grão de pólen.",
        "Angiospermas: flor e fruto (ovário → fruto; óvulo → semente).",
        "Polinização: vento ou animais."
      ]
    },
    {
      titulo: "O passado da Terra e o reino animal: características gerais",
      av: "AV3",
      intro: "O capítulo começa pelo passado da Terra: os **fósseis** mostram que a vida mudou muito ao longo de bilhões de anos, e que os grupos de animais atuais vieram de ancestrais diferentes. (Na prova: Reino animal, págs. 125 a 144.)",
      secoes: [
        {
          h: "1. Fósseis e evolução",
          lista: [
            "**Fósseis** são restos (ossos, conchas, dentes) ou vestígios (pegadas, ovos, marcas) de seres que viveram há muito tempo, preservados geralmente em **rochas sedimentares**.",
            "Eles mostram que espécies surgiram, mudaram e se extinguiram (como os dinossauros, há cerca de 66 milhões de anos).",
            "Comparando fósseis e animais atuais, os cientistas montam a **história evolutiva** dos grupos."
          ]
        },
        {
          h: "2. O que todo animal tem",
          lista: [
            "**Eucariontes**: células com núcleo organizado.",
            "**Pluricelulares**: formados por muitas células.",
            "**Heterótrofos**: não produzem o próprio alimento; obtêm energia comendo outros seres.",
            "A maioria se **locomove** em alguma fase da vida e tem **reprodução sexuada**."
          ]
        },
        {
          h: "3. Critérios de classificação",
          tabela: {
            cab: ["Critério", "Possibilidades"],
            linhas: [
              ["**Simetria**", "Assimetria (esponjas) · radial (cnidários, equinodermos adultos) · **bilateral** (lado direito = esquerdo: a maioria)"],
              ["**Coluna vertebral**", "**Invertebrados** (cerca de 95% das espécies) × **vertebrados**"],
              ["**Segmentação**", "Corpo dividido em segmentos (anelídeos, artrópodes)"],
              ["**Esqueleto**", "Exoesqueleto (externo, de quitina: artrópodes) × endoesqueleto (interno: vertebrados, equinodermos)"],
              ["**Temperatura do corpo**", "Ectotérmicos (dependem do ambiente) × endotérmicos (aves e mamíferos mantêm a temperatura constante)"]
            ]
          }
        }
      ],
      revisao: [
        "Fósseis provam que a vida mudou ao longo do tempo.",
        "Animais: eucariontes, pluricelulares, heterótrofos.",
        "Critérios: simetria, coluna vertebral, segmentação, tipo de esqueleto, temperatura."
      ]
    },
    {
      titulo: "Invertebrados",
      av: "AV3",
      intro: "Animais sem coluna vertebral. São a enorme maioria das espécies do planeta.",
      secoes: [
        {
          h: "1. Os grupos principais",
          tabela: {
            cab: ["Grupo (filo)", "Exemplos", "Características marcantes"],
            linhas: [
              ["**Poríferos**", "Esponjas", "Os mais simples; sem tecidos verdadeiros; corpo cheio de poros por onde a água passa (filtram alimento); fixos; aquáticos"],
              ["**Cnidários**", "Águas-vivas, corais, anêmonas, hidras", "Simetria radial; **cnidócitos** (células urticantes que 'queimam'); formas pólipo (fixo) e medusa (livre)"],
              ["**Platelmintos**", "Planária, tênia (solitária), esquistossomo", "Vermes **achatados**; muitos são parasitas (teníase, esquistossomose)"],
              ["**Nematódeos**", "Lombriga (*Ascaris*), ancilóstomo, filária", "Vermes **cilíndricos**, sem segmentos; muitos parasitas (ascaridíase, amarelão)"],
              ["**Anelídeos**", "Minhoca, sanguessuga, poliquetas", "Corpo **segmentado em anéis**; a minhoca areja e aduba o solo (húmus)"],
              ["**Moluscos**", "Caramujo, polvo, lula, ostra, mexilhão", "Corpo **mole**, muitos com **concha** de calcário; gastrópodes, bivalves, cefalópodes"],
              ["**Artrópodes**", "Insetos, aranhas, caranguejos, centopeias", "**Exoesqueleto de quitina** e **patas articuladas**; fazem **muda**; o maior grupo animal"],
              ["**Equinodermos**", "Estrela-do-mar, ouriço, pepino-do-mar", "Só marinhos; **pele com espinhos**; endoesqueleto calcário; sistema ambulacral (pés com ventosas)"]
            ]
          }
        },
        {
          h: "2. As classes de artrópodes",
          tabela: {
            cab: ["Classe", "Corpo", "Patas", "Antenas", "Exemplos"],
            linhas: [
              ["**Insetos**", "Cabeça, tórax, abdome", "6 (3 pares)", "2", "Formiga, borboleta, besouro, mosquito"],
              ["**Aracnídeos**", "Cefalotórax + abdome", "8 (4 pares)", "Nenhuma", "Aranha, escorpião, carrapato, ácaro"],
              ["**Crustáceos**", "Cefalotórax + abdome", "Muitas (geralmente 10)", "4", "Camarão, caranguejo, lagosta, tatuzinho-de-jardim"],
              ["**Quilópodes**", "Cabeça + muitos segmentos", "1 par por segmento", "2", "Centopeia, lacraia (têm veneno)"],
              ["**Diplópodes**", "Cabeça + muitos segmentos", "2 pares por segmento", "2", "Piolho-de-cobra (gongolo)"]
            ]
          },
          atencao: "Aranha **não é inseto**: tem 8 patas e nenhuma antena. Tatuzinho-de-jardim é um **crustáceo** que vive em terra."
        }
      ],
      revisao: [
        "Poríferos (poros) → cnidários (urticantes) → platelmintos (achatados) → nematódeos (cilíndricos) → anelídeos (anéis) → moluscos (corpo mole) → artrópodes (patas articuladas) → equinodermos (espinhos).",
        "Inseto: 6 patas, 3 partes, 2 antenas. Aracnídeo: 8 patas, sem antenas.",
        "Artrópodes fazem muda do exoesqueleto."
      ]
    },
    {
      titulo: "Vertebrados",
      av: "AV3",
      intro: "Fazem parte dos **cordados** e têm **coluna vertebral** e **crânio** protegendo o sistema nervoso, além de endoesqueleto.",
      secoes: [
        {
          h: "1. As cinco classes",
          tabela: {
            cab: ["Grupo", "Respiração", "Pele/cobertura", "Temperatura", "Reprodução", "Curiosidade"],
            linhas: [
              ["**Peixes**", "Brânquias", "Escamas e muco", "Ectotérmicos", "Fecundação geralmente externa", "Cartilaginosos (tubarão, raia) e ósseos (tilápia, sardinha)"],
              ["**Anfíbios**", "Brânquias (larva) → pulmões e **pele** (adulto)", "Pele fina, úmida, sem escamas", "Ectotérmicos", "Ovos sem casca na água; metamorfose", "Sapo, rã, perereca, salamandra"],
              ["**Répteis**", "Pulmões", "Pele seca com **escamas** ou placas", "Ectotérmicos", "Fecundação interna; **ovo com casca**", "Cobra, lagarto, jacaré, tartaruga"],
              ["**Aves**", "Pulmões + **sacos aéreos**", "**Penas**", "Endotérmicas", "Ovo com casca dura; chocam os ovos", "Ossos ocos (pneumáticos), bico sem dentes"],
              ["**Mamíferos**", "Pulmões", "**Pelos**", "Endotérmicos", "Maioria vivípara, com placenta", "**Glândulas mamárias** (amamentação); diafragma"]
            ]
          }
        },
        {
          h: "2. Detalhes que caem",
          lista: [
            "**Morcego** é mamífero (tem pelos e amamenta), não ave.",
            "**Baleia e golfinho** são mamíferos: respiram por pulmões e sobem à superfície para respirar.",
            "**Ornitorrinco e equidna** são mamíferos que **botam ovos** (monotremados).",
            "**Marsupiais** (canguru, gambá) têm filhotes que terminam o desenvolvimento numa bolsa (marsúpio).",
            "Aves têm adaptações ao voo: ossos ocos, penas, sacos aéreos, musculatura peitoral forte."
          ]
        }
      ],
      revisao: [
        "Peixes (brânquias), anfíbios (pele úmida, metamorfose), répteis (escamas, ovo com casca), aves (penas, sacos aéreos), mamíferos (pelos, mamas).",
        "Aves e mamíferos são endotérmicos.",
        "Morcego, baleia e golfinho são mamíferos."
      ]
    },
    {
      titulo: "A energia no corpo humano",
      av: "AV3",
      intro: "Todo o funcionamento do corpo (pensar, crescer, manter a temperatura, mexer os músculos) gasta **energia**. Ela vem dos **alimentos** e é liberada nas células. (Na prova: págs. 70 a 82 do Cap. 6.)",
      secoes: [
        {
          h: "1. De onde vem a energia",
          tabela: {
            cab: ["Nutriente", "Função principal", "Fontes"],
            linhas: [
              ["**Carboidratos**", "Principal fonte de energia **rápida** (glicose)", "Pão, arroz, massas, batata, frutas, açúcar"],
              ["**Lipídios (gorduras)**", "Reserva de energia (mais energia por grama); isolamento térmico", "Óleos, manteiga, castanhas, carnes gordas"],
              ["**Proteínas**", "Construção e reparo do corpo (músculos, enzimas); energia em último caso", "Carnes, ovos, leite, feijão"],
              ["**Vitaminas e sais minerais**", "Regulam o funcionamento (não fornecem energia)", "Frutas, verduras, legumes"]
            ]
          },
          p: [
            "A energia dos alimentos é medida em **quilocalorias (kcal)**, a 'caloria' dos rótulos. Gorduras têm cerca de **9 kcal por grama**; carboidratos e proteínas, cerca de **4 kcal por grama**."
          ]
        },
        {
          h: "2. A respiração celular",
          p: [
            "A energia dos alimentos só é usada depois de liberada dentro das células, nas **mitocôndrias**, pela **respiração celular**:",
            "**Glicose + gás oxigênio → gás carbônico + água + energia**",
            "A energia é guardada numa molécula chamada **ATP**, a 'bateria' da célula, usada em todas as atividades."
          ],
          atencao: "Respiração celular (dentro das células, libera energia) é diferente de respiração pulmonar (troca de gases nos pulmões). A pulmonar existe para fornecer o oxigênio e eliminar o gás carbônico da celular."
        },
        {
          h: "3. Os sistemas trabalham juntos",
          lista: [
            "**Digestório**: quebra os alimentos em nutrientes pequenos (como a glicose), absorvidos no intestino delgado.",
            "**Respiratório**: capta o gás oxigênio e elimina o gás carbônico.",
            "**Cardiovascular (circulatório)**: o sangue leva nutrientes e oxigênio a todas as células e recolhe o gás carbônico.",
            "**Urinário**: elimina resíduos do metabolismo."
          ]
        },
        {
          h: "4. Gasto de energia e metabolismo",
          lista: [
            "**Metabolismo** é o conjunto de reações químicas do corpo.",
            "**Metabolismo basal**: energia gasta em repouso só para manter o corpo vivo (coração, respiração, temperatura). É a maior parte do gasto diário.",
            "Atividades físicas aumentam o gasto. Se a pessoa ingere mais energia do que gasta, o excesso é guardado como **gordura**; se ingere menos, usa as reservas.",
            "A necessidade varia com idade, sexo, tamanho e nível de atividade. Adolescentes em crescimento precisam de bastante energia."
          ]
        },
        {
          h: "5. Eletricidade no corpo (ligação com o Cap. 6)",
          p: [
            "O corpo também usa **sinais elétricos**: os **neurônios** transmitem **impulsos nervosos** elétricos, e o coração se contrai a cada impulso elétrico gerado por ele mesmo. O **eletrocardiograma** registra essa atividade elétrica do coração, e o eletroencefalograma, a do cérebro.",
            "Por isso o **choque elétrico** é perigoso: a corrente externa atrapalha esses sinais, podendo causar contrações musculares, parada respiratória e arritmias cardíacas."
          ]
        }
      ],
      revisao: [
        "Carboidratos: energia rápida. Lipídios: reserva. Proteínas: construção.",
        "Energia dos alimentos em kcal (gordura ~9 kcal/g; carboidrato e proteína ~4 kcal/g).",
        "Respiração celular nas mitocôndrias: glicose + O₂ → CO₂ + água + energia (ATP).",
        "Metabolismo basal = gasto em repouso.",
        "Neurônios e coração funcionam com impulsos elétricos."
      ]
    }
  ],
  quiz: [
    { pergunta: "Na reprodução assexuada, os descendentes são:", alternativas: ["Muito diferentes dos pais", "Geneticamente idênticos (clones)", "Sempre hermafroditas", "Formados por gametas"], correta: 1, explicacao: "Sem gametas e sem fecundação, os filhos são cópias genéticas." },
    { pergunta: "As leveduras e as hidras se reproduzem principalmente por:", alternativas: ["Bipartição", "Brotamento", "Esporulação", "Fecundação externa"], correta: 1, explicacao: "Formam um broto que cresce e se solta." },
    { pergunta: "A batata e a cana-de-açúcar são plantadas por:", alternativas: ["Sementes", "Propagação vegetativa", "Esporos", "Polinização"], correta: 1, explicacao: "Pedaços do caule (tubérculo, estacas) originam novas plantas." },
    { pergunta: "A principal vantagem da reprodução sexuada é:", alternativas: ["Rapidez", "Não precisar de parceiro", "Variabilidade genética", "Gerar clones"], correta: 2, explicacao: "A mistura de genes aumenta a chance de adaptação." },
    { pergunta: "O ovo amniótico (com casca) surgiu nos:", alternativas: ["Peixes", "Anfíbios", "Répteis", "Equinodermos"], correta: 2, explicacao: "Permitiu a reprodução longe da água." },
    { pergunta: "Animais cujo embrião se desenvolve dentro da mãe nutrido pela placenta são:", alternativas: ["Ovíparos", "Vivíparos", "Ovovivíparos", "Partenogenéticos"], correta: 1, explicacao: "É o caso da maioria dos mamíferos." },
    { pergunta: "O sapo tem desenvolvimento:", alternativas: ["Direto", "Indireto, com metamorfose", "Só assexuado", "Dentro de ovo com casca"], correta: 1, explicacao: "Ovo → girino (larva) → adulto." },
    { pergunta: "Qual grupo de plantas tem flor e fruto?", alternativas: ["Briófitas", "Pteridófitas", "Gimnospermas", "Angiospermas"], correta: 3, explicacao: "Só as angiospermas têm flores verdadeiras e frutos." },
    { pergunta: "Após a fecundação nas angiospermas, o ovário se transforma em:", alternativas: ["Semente", "Fruto", "Flor", "Grão de pólen"], correta: 1, explicacao: "Ovário → fruto; óvulo → semente." },
    { pergunta: "Samambaias e musgos dependem de água para:", alternativas: ["Fazer fotossíntese", "A fecundação (o gameta masculino nada)", "Formar sementes", "Produzir frutos"], correta: 1, explicacao: "Sem grão de pólen, o gameta precisa nadar até a oosfera." },
    { pergunta: "Todos os animais são:", alternativas: ["Autótrofos e unicelulares", "Eucariontes, pluricelulares e heterótrofos", "Procariontes", "Vertebrados"], correta: 1, explicacao: "São as características gerais do reino animal." },
    { pergunta: "Animais com células urticantes (cnidócitos) são os:", alternativas: ["Poríferos", "Cnidários", "Anelídeos", "Moluscos"], correta: 1, explicacao: "Águas-vivas, corais e anêmonas." },
    { pergunta: "A minhoca pertence aos:", alternativas: ["Nematódeos", "Platelmintos", "Anelídeos", "Artrópodes"], correta: 2, explicacao: "Corpo segmentado em anéis." },
    { pergunta: "Um animal com 8 patas e sem antenas é um:", alternativas: ["Inseto", "Aracnídeo", "Crustáceo", "Diplópode"], correta: 1, explicacao: "Aranhas, escorpiões e carrapatos." },
    { pergunta: "O maior grupo de animais do planeta é o dos:", alternativas: ["Mamíferos", "Moluscos", "Artrópodes", "Peixes"], correta: 2, explicacao: "Exoesqueleto e patas articuladas; inclui os insetos." },
    { pergunta: "Qual vertebrado respira também pela pele quando adulto?", alternativas: ["Lagarto", "Sapo", "Galinha", "Baleia"], correta: 1, explicacao: "Anfíbios têm respiração cutânea, por isso a pele é úmida." },
    { pergunta: "O morcego é classificado como:", alternativas: ["Ave", "Mamífero", "Réptil", "Inseto"], correta: 1, explicacao: "Tem pelos e amamenta os filhotes." },
    { pergunta: "A respiração celular acontece:", alternativas: ["Nos pulmões", "Nas mitocôndrias", "No estômago", "No sangue"], correta: 1, explicacao: "Glicose + O₂ → CO₂ + água + energia (ATP)." },
    { pergunta: "O nutriente que é a principal fonte de energia rápida é o:", alternativas: ["Proteína", "Carboidrato", "Vitamina", "Sal mineral"], correta: 1, explicacao: "Os carboidratos fornecem glicose." },
    { pergunta: "O exame que registra a atividade elétrica do coração é o:", alternativas: ["Raio X", "Eletrocardiograma", "Hemograma", "Ultrassom"], correta: 1, explicacao: "O coração funciona com impulsos elétricos." }
  ],
  flashcards: [
    { frente: "Reprodução assexuada", verso: "Um indivíduo, sem gametas; filhos são clones." },
    { frente: "Tipos de reprodução assexuada", verso: "Bipartição, brotamento, fragmentação, esporulação, propagação vegetativa." },
    { frente: "Vantagem da reprodução sexuada", verso: "Variabilidade genética (mais chance de adaptação)." },
    { frente: "Fecundação externa × interna", verso: "Externa: fora do corpo, na água. Interna: dentro da fêmea, permitiu viver em terra." },
    { frente: "Ovovivíparo", verso: "O ovo fica dentro da mãe, mas o embrião se nutre do próprio ovo (alguns tubarões e cobras)." },
    { frente: "Ovo amniótico", verso: "Ovo com casca e membranas (répteis): reprodução fora da água." },
    { frente: "Gimnospermas", verso: "Têm semente nua (sem fruto) e grão de pólen. Ex.: pinheiro, araucária." },
    { frente: "Angiospermas", verso: "Têm flor e fruto; ovário vira fruto, óvulo vira semente." },
    { frente: "Polinização", verso: "Transporte do pólen até a parte feminina, pelo vento ou por animais." },
    { frente: "Características do reino animal", verso: "Eucariontes, pluricelulares e heterótrofos." },
    { frente: "Inseto", verso: "Cabeça, tórax e abdome; 6 patas; 2 antenas." },
    { frente: "Aracnídeo", verso: "Cefalotórax e abdome; 8 patas; sem antenas." },
    { frente: "Equinodermos", verso: "Marinhos, pele com espinhos, endoesqueleto (estrela-do-mar, ouriço)." },
    { frente: "Aves", verso: "Penas, sacos aéreos, ossos ocos, endotérmicas, ovo com casca." },
    { frente: "Mamíferos", verso: "Pelos, glândulas mamárias, diafragma, endotérmicos." },
    { frente: "Respiração celular", verso: "Glicose + O₂ → CO₂ + água + energia (ATP), nas mitocôndrias." },
    { frente: "Metabolismo basal", verso: "Energia gasta em repouso para manter o corpo funcionando." },
    { frente: "kcal por grama", verso: "Gordura ~9; carboidrato e proteína ~4." }
  ]
});
