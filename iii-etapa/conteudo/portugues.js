(window.MATERIAS = window.MATERIAS || []).push({
  id: "portugues",
  nome: "Língua Portuguesa",
  icone: "📖",
  prova: "AV2: QUE, substantivas, adjetivas, crase · AV3: + adverbiais",
  aviso: "Os conteúdos da AV2 também caem na AV3 (somativa).",
  topicos: [
    // ------------------------------------------------------------------
    {
      titulo: "Período composto por subordinação: a base",
      av: "AV2 · AV3",
      intro: "Antes das orações subordinadas, é preciso entender a ideia geral. Esta é a base de quase tudo que cai na prova.",
      secoes: [
        {
          h: "1. Período simples × composto",
          lista: [
            "**Oração** é um enunciado organizado em torno de um **verbo** (ou locução verbal).",
            "**Período simples**: uma oração só. *O aluno estudou.*",
            "**Período composto**: duas ou mais orações. *O aluno estudou porque a prova era amanhã.*",
            "Dica: conte os verbos. Cada verbo (ou locução) = uma oração."
          ]
        },
        {
          h: "2. Coordenação × subordinação",
          p: [
            "Na **coordenação**, as orações são independentes: cada uma tem sentido completo sozinha (*Cheguei e jantei.*).",
            "Na **subordinação**, uma oração (a **subordinada**) depende da outra (a **principal**). A subordinada funciona como um **termo** da principal: sujeito, objeto, adjunto..."
          ],
          exemplo: {
            titulo: "Exemplo",
            texto: "*Eu espero **que você venha**.* → A oração principal é *Eu espero*. A subordinada *que você venha* é o **objeto** do verbo esperar (espero o quê? que você venha)."
          }
        },
        {
          h: "3. Os três tipos de subordinadas",
          p: ["A oração subordinada recebe o nome da **classe de palavra** que ela substitui:"],
          tabela: {
            cab: ["Tipo", "Funciona como", "Teste", "Exemplo"],
            linhas: [
              ["**Substantiva**", "um substantivo", "troque por **ISSO**", "*Quero **que você estude**.* → Quero **isso**."],
              ["**Adjetiva**", "um adjetivo", "retoma um nome anterior", "*O livro **que li** é ótimo.* → O livro **lido**..."],
              ["**Adverbial**", "um advérbio", "indica circunstância (tempo, causa...)", "*Saí **quando chovia**.* → Saí **então**."]
            ]
          },
          atencao: "O teste do **ISSO** é o mais útil da prova: se dá para trocar a oração inteira por 'isso', ela é **substantiva**."
        }
      ],
      revisao: [
        "Cada verbo = uma oração.",
        "Subordinada depende da principal e exerce uma função nela.",
        "Substantiva (troca por ISSO), adjetiva (caracteriza um nome), adverbial (circunstância)."
      ]
    },
    // ------------------------------------------------------------------
    {
      titulo: "Funções do QUE: conjunção integrante × pronome relativo",
      av: "AV2 · AV3",
      intro: "O 'que' é uma das palavras mais versáteis da língua. Na prova, o foco é diferenciar o **que conjunção integrante** do **que pronome relativo**, porque cada um começa um tipo de oração.",
      secoes: [
        {
          h: "1. QUE conjunção integrante",
          p: [
            "Introduz uma **oração subordinada substantiva**. Ele **não retoma** nenhuma palavra; só 'liga' a oração à principal.",
            "**Teste**: troque a oração que ele inicia por **ISSO**. Se a frase fizer sentido, é integrante."
          ],
          exemplo: [
            { titulo: "Exemplos", texto: "*Ela disse **que** voltaria cedo.* → Ela disse **isso**. ✓ · *É importante **que** todos participem.* → **Isso** é importante. ✓" }
          ]
        },
        {
          h: "2. QUE pronome relativo",
          p: [
            "Introduz uma **oração subordinada adjetiva**. Ele **retoma** um termo anterior (o **antecedente**) e evita repeti-lo.",
            "**Teste**: troque o 'que' por **o qual / a qual / os quais / as quais**. Se funcionar, é pronome relativo."
          ],
          exemplo: {
            titulo: "Exemplos",
            texto: "*O filme **que** vimos era longo.* → O filme **o qual** vimos. ✓ (retoma 'filme') · *A menina **que** ganhou o prêmio é minha prima.* → A menina **a qual** ganhou. ✓"
          }
        },
        {
          h: "3. Comparando lado a lado",
          tabela: {
            cab: ["", "Conjunção integrante", "Pronome relativo"],
            linhas: [
              ["Retoma alguma palavra?", "Não", "Sim (o antecedente)"],
              ["Teste", "Oração vira **ISSO**", "QUE vira **O QUAL**"],
              ["Inicia oração", "Subordinada **substantiva**", "Subordinada **adjetiva**"],
              ["Exemplo", "*Sei **que** ele mente.*", "*O homem **que** mente...*"]
            ]
          }
        },
        {
          h: "4. Outras funções do QUE (para não confundir)",
          lista: [
            "**Conjunção comparativa**: *Ele é mais alto **(do) que** eu.*",
            "**Conjunção consecutiva**: *Correu tanto **que** cansou.* (tanto... que)",
            "**Conjunção explicativa/causal**: *Vá logo, **que** está tarde.* (= porque)",
            "**Pronome interrogativo**: ***Que** horas são?*",
            "**Advérbio de intensidade**: ***Que** lindo!* (= muito)",
            "**Substantivo** (com acento): *Ela tem um **quê** de mistério.*",
            "**Interjeição** (com acento): ***Quê!** Não acredito!*",
            "**Partícula expletiva/de realce** (pode ser retirada): *Nós é **que** decidimos.* → Nós decidimos."
          ],
          atencao: "Quando o QUE é **substantivo**, **interjeição** ou aparece **no fim da frase**, ele leva acento: **quê**."
        }
      ],
      revisao: [
        "Integrante: oração vira ISSO → subordinada substantiva.",
        "Relativo: QUE vira O QUAL e retoma o antecedente → subordinada adjetiva.",
        "Outras funções: comparativa, consecutiva, explicativa, interrogativo, advérbio, substantivo (quê), interjeição (quê!), realce."
      ]
    },
    // ------------------------------------------------------------------
    {
      titulo: "Orações subordinadas substantivas",
      av: "AV2 · AV3",
      intro: "Exercem, em relação à oração principal, as mesmas funções de um **substantivo**: sujeito, objeto direto, objeto indireto, complemento nominal, predicativo e aposto. Geralmente começam com **que** ou **se** (conjunções integrantes).",
      secoes: [
        {
          h: "1. Os seis tipos",
          tabela: {
            cab: ["Tipo", "Função", "Como reconhecer", "Exemplo"],
            linhas: [
              ["**Subjetiva**", "Sujeito da principal", "Principal com verbo de ligação + adjetivo, ou verbo na 3ª pessoa: *É bom, convém, parece, sabe-se*", "*É necessário **que você descanse**.*"],
              ["**Objetiva direta**", "Objeto direto", "Verbo transitivo direto (sem preposição)", "*Eu sei **que ela virá**.*"],
              ["**Objetiva indireta**", "Objeto indireto", "Verbo pede **preposição** (de, em, a...)", "*Lembrei-me **de que tinha prova**.*"],
              ["**Completiva nominal**", "Complemento nominal", "Completa um **nome** (substantivo, adjetivo) com preposição", "*Tenho medo **de que chova**.*"],
              ["**Predicativa**", "Predicativo do sujeito", "Vem depois de **verbo de ligação** (ser)", "*O problema é **que ninguém estudou**.*"],
              ["**Apositiva**", "Aposto", "Vem depois de **dois-pontos** ou vírgula, explicando um termo", "*Só quero uma coisa: **que você seja feliz**.*"]
            ]
          }
        },
        {
          h: "2. Como resolver na prova (passo a passo)",
          lista: [
            "1) Ache a oração principal e a subordinada (troque a subordinada por **ISSO**).",
            "2) Reescreva a frase com ISSO e descubra a função de 'isso':",
            "• *É necessário **isso*** → isso é o sujeito → **subjetiva**.",
            "• *Eu sei **isso*** → objeto direto → **objetiva direta**.",
            "• *Lembrei-me **disso*** (de + isso) → objeto indireto → **objetiva indireta**.",
            "• *Tenho medo **disso*** → completa o nome 'medo' → **completiva nominal**.",
            "• *O problema é **isso*** → depois do verbo ser → **predicativa**.",
            "• *Quero uma coisa: **isso*** → explica 'uma coisa' → **apositiva**."
          ],
          atencao: "Objetiva indireta × completiva nominal: as duas têm preposição. A diferença é **quem pede** a preposição: um **verbo** (objetiva indireta: *lembrar de*, *gostar de*) ou um **nome** (completiva nominal: *medo de*, *certeza de*, *necessidade de*)."
        },
        {
          h: "3. Substantivas com 'se' e reduzidas",
          lista: [
            "Com **se** (integrante): *Não sei **se ele vem**.* (objetiva direta)",
            "**Reduzidas de infinitivo** (sem conjunção, com verbo no infinitivo): *É importante **estudar todos os dias**.* (subjetiva reduzida)"
          ]
        }
      ],
      revisao: [
        "Substantivas: troca por ISSO; iniciam com QUE/SE integrante.",
        "Subjetiva (sujeito), objetiva direta, objetiva indireta (verbo pede preposição), completiva nominal (nome pede preposição), predicativa (após ser), apositiva (após dois-pontos)."
      ]
    },
    // ------------------------------------------------------------------
    {
      titulo: "Orações subordinadas adjetivas",
      av: "AV2 · AV3",
      intro: "Funcionam como um **adjetivo**: caracterizam um substantivo da oração principal. Sempre começam por um **pronome relativo** (que, quem, o qual, cujo, onde, quanto, como).",
      secoes: [
        {
          h: "1. Restritiva × explicativa",
          tabela: {
            cab: ["", "Restritiva", "Explicativa"],
            linhas: [
              ["Sentido", "**Restringe**, limita: fala de uma parte do grupo", "**Explica**, acrescenta uma informação sobre o todo"],
              ["Vírgulas", "**Sem** vírgulas", "**Entre vírgulas**"],
              ["Exemplo", "*Os alunos **que estudaram** passaram.* (só alguns)", "*Os alunos, **que estudaram**, passaram.* (todos estudaram)"]
            ]
          },
          exemplo: {
            titulo: "A vírgula muda o sentido",
            texto: "*O homem, **que é mortal**, erra.* → todos os homens são mortais (explicativa). · *O homem **que fuma** tem mais riscos.* → só os que fumam (restritiva)."
          }
        },
        {
          h: "2. Pronomes relativos e seus usos",
          lista: [
            "**que**: o mais comum; retoma pessoas e coisas. *O carro **que** comprei.*",
            "**quem**: só para pessoas, quase sempre com preposição. *A amiga **de quem** falei.*",
            "**o qual / a qual**: substitui o que, sobretudo após preposições. *A cidade **na qual** nasci.*",
            "**cujo / cuja**: indica **posse** e concorda com a coisa possuída; **nunca** leva artigo depois. *O autor **cujo livro** li.* (e não 'cujo o livro')",
            "**onde**: só para **lugar físico**. *A casa **onde** moro.*"
          ],
          atencao: "Erros comuns: 'cujo **o**' (errado: cujo não aceita artigo depois) e usar 'onde' para coisas que não são lugar (*a situação onde...* → o certo é *a situação **em que***)."
        },
        {
          h: "3. Preposição antes do relativo",
          p: ["Se o verbo da oração adjetiva pede preposição, ela vem **antes** do pronome relativo."],
          exemplo: { titulo: "Exemplo", texto: "Gosto **do** filme → *O filme **de que** gosto* (e não 'o filme que eu gosto', na norma-padrão). Confio **na** amiga → *A amiga **em quem** confio.*" }
        }
      ],
      revisao: [
        "Adjetiva: começa com pronome relativo e caracteriza um nome.",
        "Restritiva: sem vírgula, limita. Explicativa: entre vírgulas, generaliza.",
        "Cujo indica posse e não aceita artigo. Onde só para lugar.",
        "Preposição exigida pelo verbo vem antes do relativo."
      ]
    },
    // ------------------------------------------------------------------
    {
      titulo: "Conjunções e orações subordinadas adverbiais",
      av: "AV3",
      intro: "Funcionam como um **advérbio**: indicam uma **circunstância** do fato da oração principal (tempo, causa, condição, finalidade...). O tipo é dado pela **conjunção subordinativa adverbial**.",
      secoes: [
        {
          h: "1. Os nove tipos",
          tabela: {
            cab: ["Tipo", "Ideia", "Conjunções principais", "Exemplo"],
            linhas: [
              ["**Causal**", "a causa", "porque, como (no início), já que, visto que, uma vez que", "*Faltei **porque estava doente**.*"],
              ["**Consecutiva**", "a consequência", "(tão, tanto, tal) ... que, de modo que", "*Choveu **tanto que** a rua alagou.*"],
              ["**Condicional**", "a condição", "se, caso, desde que, contanto que", "*Irei **se fizer sol**.*"],
              ["**Concessiva**", "algo contrário que não impede", "embora, ainda que, mesmo que, apesar de que, se bem que", "***Embora estivesse cansado**, foi ao treino.*"],
              ["**Comparativa**", "comparação", "como, (mais/menos) ... (do) que, tal qual", "*Ela corre **como um raio**.*"],
              ["**Conformativa**", "conformidade, acordo", "conforme, segundo, como (= conforme), consoante", "*Fiz **conforme o professor pediu**.*"],
              ["**Final**", "finalidade", "para que, a fim de que", "*Estudo **para que eu passe**.*"],
              ["**Proporcional**", "proporção", "à medida que, à proporção que, quanto mais... (mais)", "***À medida que estudava**, aprendia mais.*"],
              ["**Temporal**", "tempo", "quando, enquanto, assim que, logo que, depois que, sempre que", "*Saí **quando escureceu**.*"]
            ]
          }
        },
        {
          h: "2. As confusões mais comuns",
          lista: [
            "**Causa × consequência**: a causa vem antes no tempo (*porque choveu*); a consequência vem depois (*tanto que alagou*).",
            "**'Como'** tem três valores: causal (*Como choveu, ficamos* — no início, = porque), comparativo (*corre como um raio*) e conformativo (*fiz como mandaram* — = conforme).",
            "**Concessiva × adversativa**: as duas expressam oposição. A concessiva é subordinada (*embora*, *ainda que*); a adversativa é coordenada (*mas*, *porém*). *Embora chovesse, saí* = *Chovia, mas saí*.",
            "**Final × causal**: final aponta para o futuro (objetivo: *para que*); causal explica o motivo (*porque*)."
          ],
          atencao: "Com **embora**, **ainda que**, **caso** e **para que**, o verbo vai para o **subjuntivo**: *embora **estivesse***, *caso **chova***, *para que **entendam***."
        },
        {
          h: "3. Pontuação",
          p: [
            "Quando a oração adverbial vem **antes** da principal, ela é separada por **vírgula**: *Quando a aula acabou, todos saíram.* Depois da principal, a vírgula é opcional na maioria dos casos."
          ]
        },
        {
          h: "4. Reduzidas",
          p: ["Podem aparecer sem conjunção, com verbo no infinitivo, gerúndio ou particípio:"],
          lista: [
            "*Ao chegar em casa, dormi.* (temporal reduzida de infinitivo = quando cheguei)",
            "*Estudando muito, você passa.* (condicional reduzida de gerúndio = se estudar)",
            "*Terminada a prova, saímos.* (temporal reduzida de particípio = quando a prova terminou)"
          ]
        }
      ],
      revisao: [
        "Nove tipos: causal, consecutiva, condicional, concessiva, comparativa, conformativa, final, proporcional, temporal.",
        "Embora/ainda que = concessiva (oposição que não impede).",
        "'Como' pode ser causal, comparativo ou conformativo.",
        "Adverbial antes da principal: use vírgula."
      ]
    },
    // ------------------------------------------------------------------
    {
      titulo: "Crase",
      av: "AV2 · AV3",
      intro: "Crase é a **fusão** de duas vogais 'a': a **preposição a** + o **artigo feminino a** (ou o 'a' de *aquele, aquela, aquilo*). Essa fusão é marcada pelo **acento grave (à)**.",
      secoes: [
        {
          h: "1. Quando usar: as duas condições",
          p: ["Só há crase se acontecerem **as duas coisas ao mesmo tempo**:"],
          lista: [
            "1) Uma palavra **exige a preposição a** (*ir a*, *referir-se a*, *obedecer a*, *entregar algo a alguém*).",
            "2) A palavra seguinte é **feminina e aceita o artigo a**."
          ],
          exemplo: { titulo: "Exemplo", texto: "*Vou **à** escola.* → vou **a** (preposição) + **a** escola (artigo) = **à**." }
        },
        {
          h: "2. Os truques que resolvem quase tudo",
          lista: [
            "**Troque por uma palavra masculina**: se aparecer **ao**, tem crase. *Fui **à** praia* → *Fui **ao** clube* ✓. *Conheço **a** praia* → *Conheço **o** clube* (sem 'ao') → sem crase.",
            "**Com nomes de lugar**, use o teste do 'voltar': *Vou a ___ / Volto **da** ___* → crase. *Volto **de** ___* → sem crase. 'Vou **à** Bahia' (volto **da** Bahia) · 'Vou **a** Recife' (volto **de** Recife). Macete: *vou A, volto DA, crase PRA QUÊ? Vou A, volto DE, crase pra quê?*"
          ]
        },
        {
          h: "3. Crase obrigatória",
          lista: [
            "**Horas exatas**: *às 8h*, *à meia-noite*, *das 14h às 16h*.",
            "**Locuções femininas** (adverbiais, prepositivas, conjuntivas): *às vezes, à noite, à tarde, às pressas, à vontade, à medida que, à procura de, às escondidas*.",
            "**À moda de / à maneira de** (mesmo subentendido): *bife **à** milanesa*, *gol **à** Pelé*.",
            "**Aquele, aquela, aquilo** depois de palavra que exige 'a': *Refiro-me **àquele** livro.*"
          ]
        },
        {
          h: "4. Crase proibida",
          lista: [
            "Antes de **palavra masculina**: *andar a cavalo*, *pagar a prazo*.",
            "Antes de **verbo**: *começou a chover*.",
            "Antes da maioria dos **pronomes** (pessoais, de tratamento, indefinidos): *a ela*, *a Vossa Excelência*, *a ninguém*, *a cada*.",
            "Antes de **artigo indefinido**: *a uma pessoa*.",
            "Entre **palavras repetidas**: *cara a cara*, *frente a frente*, *gota a gota*.",
            "Quando o 'a' está no **singular** e a palavra seguinte no **plural**: *Falei **a** pessoas estranhas* (só preposição).",
            "Antes de **numeral** que não indica hora: *de 1 a 5*."
          ]
        },
        {
          h: "5. Crase facultativa (pode ou não)",
          lista: [
            "Antes de **pronome possessivo feminino**: *Entreguei a/à minha mãe.*",
            "Antes de **nome próprio feminino** de pessoa: *Disse a/à Maria.*",
            "Depois da preposição **até**: *Fui até a/à praia.*"
          ]
        },
        {
          h: "6. Casos especiais",
          lista: [
            "**Casa** (o próprio lar) sem determinante: sem crase. *Voltei **a** casa cedo.* Com determinante: *Fui **à** casa da vovó.*",
            "**Terra** (oposta a bordo/ao mar): sem crase. *Os marinheiros voltaram **a** terra.* Planeta: *voltar **à** Terra.*",
            "**Distância** determinada: *à distância de 10 metros*; indeterminada: *a distância*."
          ]
        }
      ],
      revisao: [
        "Crase = preposição a + artigo a → à.",
        "Teste do masculino: se vira AO, tem crase.",
        "Lugares: volto DA → crase; volto DE → sem crase.",
        "Obrigatória: horas, locuções femininas, à moda de, àquele/àquilo.",
        "Proibida: antes de masculino, verbo, pronomes pessoais, entre palavras repetidas, a + plural.",
        "Facultativa: possessivo feminino, nome de mulher, depois de até."
      ]
    }
  ],
  quiz: [
    { pergunta: "Em 'Espero **que** você entenda', o QUE é:", alternativas: ["Pronome relativo", "Conjunção integrante", "Conjunção comparativa", "Advérbio de intensidade"], correta: 1, explicacao: "Dá para trocar a oração por ISSO: Espero isso." },
    { pergunta: "Em 'O livro **que** comprei é ótimo', o QUE é:", alternativas: ["Conjunção integrante", "Pronome relativo", "Interjeição", "Conjunção consecutiva"], correta: 1, explicacao: "Retoma 'livro' e pode virar 'o qual'." },
    { pergunta: "Em 'Correu tanto **que** caiu', o QUE é conjunção:", alternativas: ["Integrante", "Consecutiva", "Causal", "Final"], correta: 1, explicacao: "tanto... que indica consequência." },
    { pergunta: "'É necessário que você descanse.' A oração destacada é substantiva:", alternativas: ["Objetiva direta", "Subjetiva", "Predicativa", "Apositiva"], correta: 1, explicacao: "Isso é necessário → 'isso' é o sujeito." },
    { pergunta: "'Tenho medo de que chova.' A oração subordinada é substantiva:", alternativas: ["Objetiva indireta", "Completiva nominal", "Subjetiva", "Predicativa"], correta: 1, explicacao: "Completa o nome 'medo' (medo disso)." },
    { pergunta: "'Lembrei-me de que tinha prova.' A oração é substantiva:", alternativas: ["Objetiva indireta", "Completiva nominal", "Objetiva direta", "Apositiva"], correta: 0, explicacao: "Quem pede a preposição é o verbo lembrar-se (lembrei-me disso)." },
    { pergunta: "'O problema é que ninguém estudou.' A oração é substantiva:", alternativas: ["Subjetiva", "Predicativa", "Apositiva", "Objetiva direta"], correta: 1, explicacao: "Vem depois do verbo de ligação 'ser'." },
    { pergunta: "Qual frase tem oração adjetiva EXPLICATIVA?", alternativas: ["Os alunos que estudaram passaram.", "O Sol, que é uma estrela, ilumina a Terra.", "Quero que você venha.", "Saí quando choveu."], correta: 1, explicacao: "Está entre vírgulas e generaliza (todo o Sol é estrela)." },
    { pergunta: "Qual frase está correta?", alternativas: ["O autor cujo o livro li.", "O autor cujo livro li.", "O autor que o livro li.", "O autor onde o livro li."], correta: 1, explicacao: "Cujo indica posse e nunca aceita artigo depois." },
    { pergunta: "'Embora estivesse cansado, foi ao treino.' A oração é adverbial:", alternativas: ["Causal", "Concessiva", "Condicional", "Consecutiva"], correta: 1, explicacao: "Embora = oposição que não impede o fato." },
    { pergunta: "'Fiz o trabalho conforme o professor pediu.' A oração é adverbial:", alternativas: ["Comparativa", "Conformativa", "Final", "Temporal"], correta: 1, explicacao: "Conforme indica conformidade (de acordo com)." },
    { pergunta: "'À medida que estudava, aprendia mais.' A oração é adverbial:", alternativas: ["Temporal", "Proporcional", "Causal", "Final"], correta: 1, explicacao: "À medida que = proporção." },
    { pergunta: "'Como estava chovendo, ficamos em casa.' O COMO indica:", alternativas: ["Comparação", "Conformidade", "Causa", "Tempo"], correta: 2, explicacao: "No início da frase, como = porque (causal)." },
    { pergunta: "Em qual frase a crase está correta?", alternativas: ["Começou à chover.", "Fui à praia ontem.", "Andou à cavalo.", "Falei à ela."], correta: 1, explicacao: "Fui ao clube → fui à praia. Nas outras: verbo, masculino e pronome pessoal (proibidas)." },
    { pergunta: "Complete: 'Vou ___ Recife e depois ___ Bahia.'", alternativas: ["à / à", "a / à", "à / a", "a / a"], correta: 1, explicacao: "Volto DE Recife (sem crase); volto DA Bahia (com crase)." },
    { pergunta: "Em qual caso a crase é facultativa?", alternativas: ["Antes de horas", "Antes de pronome possessivo feminino", "Antes de verbo", "Entre palavras repetidas"], correta: 1, explicacao: "Entreguei a/à minha mãe: as duas formas são aceitas." },
    { pergunta: "'A reunião será das 14h ___ 16h.'", alternativas: ["a", "à", "às", "as"], correta: 2, explicacao: "Horas exatas no plural: às 16h (das... às...)." }
  ],
  flashcards: [
    { frente: "QUE conjunção integrante", verso: "Inicia oração substantiva. Teste: a oração vira ISSO." },
    { frente: "QUE pronome relativo", verso: "Retoma um antecedente e inicia oração adjetiva. Teste: vira O QUAL." },
    { frente: "Oração subordinada subjetiva", verso: "Funciona como sujeito: 'É bom que você venha' (isso é bom)." },
    { frente: "Objetiva indireta × completiva nominal", verso: "Ambas com preposição: na OI quem pede é um VERBO; na CN, um NOME." },
    { frente: "Oração predicativa", verso: "Vem depois do verbo SER: 'O certo é que...'" },
    { frente: "Oração apositiva", verso: "Explica um termo, geralmente após dois-pontos." },
    { frente: "Adjetiva restritiva", verso: "Sem vírgulas, limita o sentido (só uma parte)." },
    { frente: "Adjetiva explicativa", verso: "Entre vírgulas, generaliza (vale para todos)." },
    { frente: "Cujo", verso: "Indica posse, concorda com o possuído e não aceita artigo depois." },
    { frente: "Conjunções concessivas", verso: "Embora, ainda que, mesmo que, apesar de que, se bem que." },
    { frente: "Conjunções conformativas", verso: "Conforme, segundo, como (= conforme), consoante." },
    { frente: "Conjunções proporcionais", verso: "À medida que, à proporção que, quanto mais... mais." },
    { frente: "Conjunções finais", verso: "Para que, a fim de que." },
    { frente: "Crase", verso: "Preposição a + artigo a = à." },
    { frente: "Teste do masculino na crase", verso: "Se trocando por masculino aparece AO, tem crase." },
    { frente: "Crase com lugares", verso: "Volto DA → crase. Volto DE → sem crase." },
    { frente: "Crase proibida", verso: "Antes de masculino, verbo, pronome pessoal, artigo indefinido, entre palavras repetidas." },
    { frente: "Crase facultativa", verso: "Antes de possessivo feminino, de nome de mulher e depois de 'até'." }
  ]
});
