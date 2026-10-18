(window.MATERIAS = window.MATERIAS || []).push({
  id: "quimica",
  nome: "Ciências · Química",
  icone: "🧪",
  prova: "AV2: tabela periódica e ligações químicas · AV3: soluções, solubilidade, concentração e densidade",
  topicos: [
    {
      titulo: "Tabela periódica: organização",
      av: "AV2",
      intro: "A tabela periódica organiza todos os elementos químicos conhecidos (118) em ordem crescente de **número atômico (Z)**, que é o número de prótons do átomo. Saber 'ler' a tabela é a base para entender as ligações químicas.",
      secoes: [
        {
          h: "1. Revisão rápida do átomo",
          lista: [
            "**Prótons (p+)**: ficam no núcleo, carga positiva. O número de prótons é o **número atômico (Z)** e define qual é o elemento.",
            "**Nêutrons (n)**: ficam no núcleo, sem carga.",
            "**Elétrons (e−)**: ficam na eletrosfera, em camadas (K, L, M, N, O, P, Q), carga negativa.",
            "**Número de massa (A) = prótons + nêutrons** → A = Z + n.",
            "Átomo **neutro**: número de prótons = número de elétrons."
          ],
          exercicio: {
            enunciado: "O sódio tem Z = 11 e A = 23. Quantos prótons, elétrons e nêutrons ele tem (átomo neutro)?",
            passos: ["Prótons = Z = 11", "Elétrons = prótons (neutro) = 11", "Nêutrons = A − Z = 23 − 11 = 12"],
            resposta: "11 prótons, 11 elétrons e 12 nêutrons."
          }
        },
        {
          h: "2. Períodos (linhas horizontais)",
          p: [
            "A tabela tem **7 períodos**. O número do período indica **quantas camadas eletrônicas** o átomo tem.",
            "Exemplo: o sódio (Na) está no **3º período** → tem 3 camadas (K, L, M)."
          ]
        },
        {
          h: "3. Grupos ou famílias (colunas verticais)",
          p: [
            "São **18 grupos**. Elementos do mesmo grupo têm o **mesmo número de elétrons na última camada** (elétrons de valência) e, por isso, **propriedades químicas parecidas**."
          ],
          tabela: {
            cab: ["Grupo", "Nome da família", "Elétrons na última camada", "Exemplos"],
            linhas: [
              ["1 (1A)", "Metais alcalinos", "1", "Li, Na, K, Rb, Cs, Fr"],
              ["2 (2A)", "Metais alcalinoterrosos", "2", "Be, Mg, Ca, Sr, Ba, Ra"],
              ["13 (3A)", "Família do boro", "3", "B, Al, Ga"],
              ["14 (4A)", "Família do carbono", "4", "C, Si, Ge, Sn, Pb"],
              ["15 (5A)", "Família do nitrogênio", "5", "N, P, As"],
              ["16 (6A)", "Calcogênios", "6", "O, S, Se, Te"],
              ["17 (7A)", "Halogênios", "7", "F, Cl, Br, I"],
              ["18 (8A ou 0)", "Gases nobres", "8 (o hélio tem 2)", "He, Ne, Ar, Kr, Xe, Rn"],
              ["3 a 12", "Metais de transição", "variável", "Fe, Cu, Zn, Ag, Au"]
            ]
          },
          atencao: "O **hidrogênio (H)** fica na coluna 1, mas **não é metal alcalino**! Ele é um caso especial (não metal)."
        },
        {
          h: "4. Metais, não metais e gases nobres",
          tabela: {
            cab: ["Classe", "Onde ficam", "Características"],
            linhas: [
              ["Metais", "Maioria, à esquerda e no centro", "Brilho metálico, bons condutores de calor e eletricidade, maleáveis (viram lâminas) e dúcteis (viram fios), sólidos a 25 °C (exceto o mercúrio, líquido). Tendem a **perder** elétrons."],
              ["Não metais", "À direita (C, N, O, P, S, F, Cl, Br, I, Se...) e o H", "Maus condutores, sem brilho, quebradiços quando sólidos. Tendem a **ganhar** elétrons."],
              ["Gases nobres", "Última coluna (18)", "Muito estáveis, quase não fazem ligações. Já têm a última camada completa."]
            ]
          }
        },
        {
          h: "5. Como descobrir período e família pela distribuição",
          p: ["Faça a distribuição pelas camadas (K = até 2, L = até 8, M = até 18...; para este nível, a última camada tem no máximo 8)."],
          exercicio: [
            {
              enunciado: "Onde fica o elemento de Z = 17 (cloro)?",
              passos: ["Distribuição: K = 2, L = 8, M = 7", "3 camadas → 3º período", "7 elétrons na última camada → grupo 17 (halogênios)"],
              resposta: "3º período, família 17 (halogênios)."
            },
            {
              enunciado: "Onde fica o elemento de Z = 20 (cálcio)?",
              passos: ["Distribuição: K = 2, L = 8, M = 8, N = 2", "4 camadas → 4º período", "2 elétrons na última → grupo 2"],
              resposta: "4º período, família 2 (alcalinoterrosos)."
            }
          ]
        },
        {
          h: "6. Regra do octeto",
          p: [
            "Os gases nobres são estáveis porque têm **8 elétrons na última camada** (o hélio tem 2). Os outros átomos fazem ligações químicas para ficar com a mesma configuração: **ganhando, perdendo ou compartilhando elétrons**.",
            "Metais (1, 2 ou 3 elétrons na última camada) tendem a **perder** e virar **cátions (+)**. Não metais (5, 6 ou 7) tendem a **ganhar** e virar **ânions (−)**."
          ],
          tabela: {
            cab: ["Família", "Tendência", "Íon formado"],
            linhas: [["1", "perde 1 e−", "X⁺ (ex.: Na⁺)"], ["2", "perde 2 e−", "X²⁺ (ex.: Mg²⁺, Ca²⁺)"], ["13", "perde 3 e−", "X³⁺ (ex.: Al³⁺)"], ["15", "ganha 3 e−", "X³⁻ (ex.: N³⁻)"], ["16", "ganha 2 e−", "X²⁻ (ex.: O²⁻, S²⁻)"], ["17", "ganha 1 e−", "X⁻ (ex.: Cl⁻, F⁻)"]]
          }
        }
      ],
      revisao: [
        "Elementos em ordem de número atômico Z (prótons).",
        "Período = número de camadas; família = elétrons na última camada (famílias A).",
        "1 alcalinos, 2 alcalinoterrosos, 16 calcogênios, 17 halogênios, 18 gases nobres.",
        "Metais perdem elétrons (cátions); não metais ganham (ânions).",
        "Octeto: átomos buscam 8 elétrons na última camada."
      ]
    },
    {
      titulo: "Ligação iônica",
      av: "AV2",
      intro: "É a ligação entre **metal e não metal** (ou metal e hidrogênio), em que há **transferência de elétrons**: o metal doa, o não metal recebe. Formam-se íons de cargas opostas que se atraem.",
      secoes: [
        {
          h: "1. Como acontece",
          p: [
            "Exemplo clássico: **sal de cozinha (NaCl)**. O sódio (Na, família 1) tem 1 elétron na última camada e o **perde** → Na⁺. O cloro (Cl, família 17) tem 7 e **ganha** 1 → Cl⁻. Os dois ficam com octeto e se atraem pela força eletrostática."
          ]
        },
        {
          h: "2. Montando a fórmula: a regra do 'cruzamento'",
          p: ["A carga do cátion vira o índice do ânion e vice-versa (simplificando quando der). A soma das cargas deve dar **zero**."],
          exercicio: [
            {
              enunciado: "Qual a fórmula do composto entre cálcio (família 2) e cloro (família 17)?",
              passos: ["Ca perde 2 → Ca²⁺", "Cl ganha 1 → Cl⁻", "Cruzando: Ca₁Cl₂", "Conferindo: +2 + 2·(−1) = 0 ✔"],
              resposta: "CaCl₂ (cloreto de cálcio)."
            },
            {
              enunciado: "Qual a fórmula entre alumínio (família 13) e oxigênio (família 16)?",
              passos: ["Al → Al³⁺", "O → O²⁻", "Cruzando: Al₂O₃", "Conferindo: 2·(+3) + 3·(−2) = 6 − 6 = 0 ✔"],
              resposta: "Al₂O₃ (óxido de alumínio)."
            },
            {
              enunciado: "Qual a fórmula entre magnésio (família 2) e oxigênio (família 16)?",
              passos: ["Mg²⁺ e O²⁻", "Cruzando: Mg₂O₂", "Simplificando por 2: MgO"],
              resposta: "MgO."
            }
          ]
        },
        {
          h: "3. Propriedades dos compostos iônicos",
          lista: [
            "São **sólidos** à temperatura ambiente, formando **retículos cristalinos** (arranjos organizados de íons).",
            "Têm **altos pontos de fusão e de ebulição** (o NaCl funde a 801 °C).",
            "São **duros, mas quebradiços**.",
            "**Conduzem corrente elétrica** quando **fundidos (líquidos)** ou **dissolvidos em água**, porque os íons ficam livres. **No estado sólido não conduzem.**",
            "Muitos são solúveis em água."
          ],
          atencao: "Pegadinha comum: 'O sal sólido conduz eletricidade?' → **Não!** Só conduz dissolvido em água ou derretido."
        }
      ],
      revisao: [
        "Iônica = metal + não metal, com transferência de elétrons.",
        "Forma cátions (+) e ânions (−) que se atraem.",
        "Fórmula: cruzar as cargas e simplificar.",
        "Sólidos, alto ponto de fusão, conduzem só em solução ou fundidos."
      ]
    },
    {
      titulo: "Ligação covalente",
      av: "AV2",
      intro: "É a ligação entre **não metais** (incluindo o hidrogênio). Como todos querem **ganhar** elétrons, ninguém doa: eles **compartilham pares de elétrons**. Formam-se **moléculas**.",
      secoes: [
        {
          h: "1. Quantas ligações cada átomo faz",
          tabela: {
            cab: ["Átomo", "Elétrons na última camada", "Faltam para o octeto", "Nº de ligações"],
            linhas: [["H", "1", "1 (para ficar com 2, como o hélio)", "1"], ["C", "4", "4", "4"], ["N", "5", "3", "3"], ["O", "6", "2", "2"], ["F, Cl, Br, I", "7", "1", "1"]]
          }
        },
        {
          h: "2. Ligações simples, duplas e triplas",
          lista: [
            "**Simples (—)**: 1 par compartilhado. Ex.: H—H (H₂), H—Cl (HCl).",
            "**Dupla (=)**: 2 pares. Ex.: O=O (O₂), O=C=O (CO₂).",
            "**Tripla (≡)**: 3 pares. Ex.: N≡N (N₂, o gás mais abundante do ar)."
          ],
          exemplo: [
            { titulo: "Água (H₂O)", texto: "O oxigênio precisa de 2 elétrons; cada hidrogênio, de 1. O oxigênio compartilha um par com cada H: **H—O—H**. Fórmula estrutural com duas ligações simples. A molécula é angular." },
            { titulo: "Metano (CH₄)", texto: "O carbono faz 4 ligações, uma com cada hidrogênio. É o principal componente do gás natural." },
            { titulo: "Gás carbônico (CO₂)", texto: "O carbono faz duas ligações duplas, uma com cada oxigênio: O=C=O." }
          ]
        },
        {
          h: "3. Tipos de fórmula",
          lista: [
            "**Molecular**: mostra quais e quantos átomos (H₂O, CO₂, NH₃).",
            "**Estrutural plana**: mostra as ligações com traços (H—O—H).",
            "**Eletrônica (de Lewis)**: mostra os elétrons da última camada como pontinhos ao redor dos símbolos."
          ]
        },
        {
          h: "4. Propriedades dos compostos moleculares",
          lista: [
            "Podem ser **sólidos, líquidos ou gases** à temperatura ambiente (açúcar, água, oxigênio).",
            "Em geral, têm **pontos de fusão e ebulição mais baixos** que os iônicos.",
            "Em geral **não conduzem** eletricidade (não há íons livres nem elétrons livres). Exceções: alguns, como o HCl, formam íons ao se dissolver em água."
          ],
          atencao: "Açúcar dissolvido em água **não conduz** eletricidade (é molecular e não forma íons). Sal dissolvido **conduz**. Essa comparação cai muito!"
        }
      ],
      revisao: [
        "Covalente = não metal + não metal (ou H): compartilhamento de pares de elétrons.",
        "H faz 1 ligação, O faz 2, N faz 3, C faz 4, halogênios 1.",
        "Simples, dupla e tripla = 1, 2 e 3 pares compartilhados.",
        "Formam moléculas; geralmente não conduzem eletricidade."
      ]
    },
    {
      titulo: "Ligação metálica e comparação geral",
      av: "AV2",
      intro: "É a ligação entre **átomos de metais**. Os metais perdem facilmente seus elétrons da última camada, que ficam se movendo livremente entre os cátions: é o modelo do **'mar de elétrons'**.",
      secoes: [
        {
          h: "1. O modelo do mar de elétrons",
          p: ["Os átomos do metal viram cátions organizados em um retículo, 'mergulhados' em uma nuvem de **elétrons livres**. Esses elétrons funcionam como uma 'cola' que mantém tudo unido."]
        },
        {
          h: "2. Propriedades que o modelo explica",
          lista: [
            "**Ótima condução elétrica e térmica** (até no estado sólido): os elétrons livres levam a corrente e o calor. Por isso os fios são de cobre.",
            "**Brilho metálico**: os elétrons livres refletem a luz.",
            "**Maleabilidade e ductilidade**: as camadas de átomos podem deslizar sem quebrar (lâminas de alumínio, fios de cobre).",
            "**Pontos de fusão geralmente altos** (o ferro funde a cerca de 1538 °C; o mercúrio é exceção, líquido)."
          ]
        },
        {
          h: "3. Ligas metálicas",
          tabela: {
            cab: ["Liga", "Composição", "Uso"],
            linhas: [["Aço", "Ferro + carbono", "Construção, ferramentas"], ["Aço inox", "Ferro + carbono + cromo + níquel", "Panelas, talheres"], ["Bronze", "Cobre + estanho", "Medalhas, sinos, estátuas"], ["Latão", "Cobre + zinco", "Instrumentos de sopro, torneiras"], ["Ouro 18 quilates", "75% ouro + cobre/prata", "Joias (mais resistente que o ouro puro)"]]
          }
        },
        {
          h: "4. Quadro comparativo (o mais importante!)",
          tabela: {
            cab: ["", "Iônica", "Covalente", "Metálica"],
            linhas: [
              ["Quem participa", "Metal + não metal", "Não metal + não metal (ou H)", "Metal + metal"],
              ["O que acontece", "Transferência de elétrons", "Compartilhamento de pares", "Elétrons livres (mar de elétrons)"],
              ["Forma", "Retículo de íons", "Moléculas", "Retículo de cátions"],
              ["Estado físico (25 °C)", "Sólido", "Sólido, líquido ou gás", "Sólido (exceto Hg)"],
              ["Conduz eletricidade?", "Só fundido ou em solução", "Geralmente não", "Sim, até sólido"],
              ["Exemplos", "NaCl, CaCl₂, MgO", "H₂O, CO₂, O₂, CH₄", "Fe, Cu, Al, Au, ligas"]
            ]
          }
        },
        {
          h: "5. Como identificar rapidinho",
          exercicio: {
            enunciado: "Classifique a ligação em: a) KBr  b) NH₃  c) Zn  d) Cl₂",
            passos: ["a) K é metal (família 1), Br é não metal → iônica", "b) N e H são não metais → covalente", "c) Zn sozinho, metal → metálica", "d) Cl com Cl, não metais → covalente"],
            resposta: "a) iônica; b) covalente; c) metálica; d) covalente."
          }
        }
      ],
      revisao: [
        "Metálica = metal + metal, com mar de elétrons livres.",
        "Explica condução, brilho, maleabilidade e ductilidade.",
        "Ligas: aço (Fe + C), bronze (Cu + Sn), latão (Cu + Zn).",
        "Decore o quadro comparativo das três ligações."
      ]
    },
    {
      titulo: "Soluções: soluto e solvente",
      av: "AV3",
      intro: "Uma **solução** é uma **mistura homogênea** (só uma fase visível) de duas ou mais substâncias. O suco em pó dissolvido, o soro caseiro, o ar e o aço são soluções.",
      secoes: [
        {
          h: "1. Componentes",
          lista: [
            "**Soluto**: a substância que é **dissolvida** (geralmente em menor quantidade). Ex.: o sal no soro.",
            "**Solvente**: a substância que **dissolve** (geralmente em maior quantidade). Ex.: a água.",
            "A **água** é chamada de **solvente universal**, porque dissolve muitas substâncias. Soluções com água como solvente são **aquosas**."
          ]
        },
        {
          h: "2. Classificação pelo estado físico",
          tabela: {
            cab: ["Tipo", "Exemplo"],
            linhas: [["Sólida", "Ligas metálicas (aço, ouro 18k, bronze)"], ["Líquida", "Água com sal, água com açúcar, vinagre, álcool 70%"], ["Gasosa", "Ar atmosférico filtrado (N₂, O₂, Ar...)"]]
          }
        },
        {
          h: "3. Dispersões: solução × coloide × suspensão",
          tabela: {
            cab: ["", "Solução verdadeira", "Coloide", "Suspensão"],
            linhas: [["Aspecto", "Homogênea", "Parece homogênea a olho nu", "Heterogênea"], ["Partículas", "Muito pequenas", "Médias", "Grandes"], ["Sedimenta?", "Não", "Não (ou muito pouco)", "Sim"], ["Exemplos", "Água com sal", "Leite, gelatina, neblina", "Água com areia, achocolatado parado"]]
          }
        },
        {
          h: "4. Pela condução elétrica",
          lista: [
            "**Eletrolíticas (iônicas)**: têm íons livres e **conduzem** corrente. Ex.: água com sal.",
            "**Não eletrolíticas (moleculares)**: não têm íons e **não conduzem**. Ex.: água com açúcar."
          ]
        },
        {
          h: "5. O que influencia a dissolução",
          lista: [
            "**Temperatura**: para a maioria dos sólidos, mais calor = dissolve mais. Para **gases, é o contrário**: mais calor = dissolve menos (refrigerante quente perde gás mais rápido).",
            "**Pressão**: importa para gases. Mais pressão = mais gás dissolvido (o refrigerante é engarrafado sob pressão; ao abrir, o gás escapa).",
            "**Natureza das substâncias**: 'semelhante dissolve semelhante'. Água dissolve sal e açúcar, mas não dissolve óleo.",
            "Agitar e triturar deixam a dissolução **mais rápida**, mas **não aumentam a quantidade máxima** que dissolve."
          ],
          atencao: "Mexer o copo faz o açúcar dissolver **mais rápido**, mas não faz dissolver **mais**. Quem muda o máximo é a temperatura (e o tipo de solvente)."
        }
      ],
      revisao: [
        "Solução = mistura homogênea de soluto (dissolvido) + solvente (dissolve).",
        "Água = solvente universal.",
        "Soluções sólidas, líquidas e gasosas.",
        "Gases dissolvem mais no frio e com mais pressão.",
        "Eletrolíticas conduzem (íons); não eletrolíticas não conduzem."
      ]
    },
    {
      titulo: "Coeficiente de solubilidade",
      av: "AV3",
      intro: "Existe um **limite** para a quantidade de soluto que dissolve em certa quantidade de solvente. Se você colocar açúcar demais no copo, ele fica no fundo. Esse limite é o **coeficiente de solubilidade (CS)**.",
      secoes: [
        {
          h: "1. Definição",
          p: [
            "**Coeficiente de solubilidade** é a **quantidade máxima de soluto** que pode ser dissolvida em uma quantidade padrão de solvente (geralmente **100 g de água**), a uma **temperatura determinada**.",
            "Exemplo: CS do NaCl a 20 °C ≈ **36 g / 100 g de água**. Ou seja, em 100 g de água a 20 °C dissolvem no máximo 36 g de sal."
          ],
          atencao: "O coeficiente **sempre depende da temperatura**. Um valor sem a temperatura está incompleto."
        },
        {
          h: "2. Classificação das soluções",
          tabela: {
            cab: ["Tipo", "Quantidade de soluto", "O que se observa"],
            linhas: [
              ["Insaturada", "Menor que o CS", "Ainda dá para dissolver mais soluto"],
              ["Saturada", "Igual ao CS", "Atingiu o limite. Se colocar mais, sobra no fundo (corpo de fundo)"],
              ["Saturada com corpo de fundo", "Mais que o CS (o excesso não dissolve)", "Solução saturada + sólido depositado no fundo"],
              ["Supersaturada", "Maior que o CS, tudo dissolvido", "Muito instável: qualquer agitação ou um cristal faz o excesso precipitar"]
            ]
          },
          exemplo: { titulo: "Como se faz uma supersaturada?", texto: "Aquece-se a água para dissolver mais soluto e depois resfria-se **lentamente e sem mexer**. O soluto continua dissolvido acima do limite. Basta uma batidinha ou um cristal para o excesso **precipitar** de uma vez." }
        },
        {
          h: "3. Exercícios resolvidos (regra de três)",
          exercicio: [
            {
              enunciado: "O CS do KNO₃ a 40 °C é 60 g/100 g de água. Quantos gramas dissolvem em 250 g de água a 40 °C?",
              passos: ["60 g ——— 100 g de água", "x ——— 250 g de água", "x = 60 · 250 ÷ 100 = 150"],
              resposta: "150 g de KNO₃."
            },
            {
              enunciado: "A 20 °C, o CS de um sal é 36 g/100 g de água. Colocam-se 50 g desse sal em 100 g de água a 20 °C. Classifique e diga a massa do corpo de fundo.",
              passos: ["Dissolvem no máximo 36 g", "Colocou 50 g → sobram 50 − 36 = 14 g sem dissolver"],
              resposta: "Solução saturada com 14 g de corpo de fundo."
            },
            {
              enunciado: "Com o mesmo sal (CS = 36 g/100 g a 20 °C), dissolvem-se 18 g em 50 g de água. Que tipo de solução é?",
              passos: ["Máximo em 50 g de água: 36 · 50 ÷ 100 = 18 g", "Foram colocados exatamente 18 g"],
              resposta: "Saturada (sem corpo de fundo)."
            },
            {
              enunciado: "Mesmo sal: 10 g em 50 g de água a 20 °C.",
              passos: ["Máximo em 50 g: 18 g", "10 g < 18 g"],
              resposta: "Insaturada (ainda caberiam mais 8 g)."
            }
          ]
        }
      ],
      revisao: [
        "CS = máximo de soluto em 100 g de água, numa temperatura.",
        "Abaixo do CS: insaturada. No CS: saturada. Excesso no fundo: saturada com corpo de fundo.",
        "Acima do CS e tudo dissolvido: supersaturada (instável).",
        "Para calcular: regra de três com a quantidade de água."
      ]
    },
    {
      titulo: "Curva de solubilidade",
      av: "AV3",
      intro: "A **curva de solubilidade** é um gráfico que mostra como o coeficiente de solubilidade de uma substância **varia com a temperatura**. No eixo x fica a **temperatura (°C)**; no eixo y, a **massa de soluto (g) por 100 g de água**.",
      secoes: [
        {
          h: "1. Como ler o gráfico",
          lista: [
            "**Ponto sobre a curva**: solução **saturada**.",
            "**Ponto abaixo da curva**: solução **insaturada** (cabe mais soluto).",
            "**Ponto acima da curva**: **supersaturada** (se estiver tudo dissolvido) ou **saturada com corpo de fundo** (se o excesso estiver no fundo)."
          ]
        },
        {
          h: "2. Tipos de curva",
          lista: [
            "**Curva ascendente (sobe)**: a solubilidade **aumenta** com a temperatura. Dissolução **endotérmica** (absorve calor). É o caso da maioria dos sais, como o KNO₃.",
            "**Curva descendente (desce)**: a solubilidade **diminui** com a temperatura. Dissolução **exotérmica** (libera calor). Ex.: Ce₂(SO₄)₃ e os **gases**.",
            "**Curva quase horizontal**: a temperatura quase não muda a solubilidade. Ex.: **NaCl** (sal de cozinha).",
            "**Curva com 'quebra' (ponto de inflexão)**: indica que o sal muda de forma (perde água de hidratação). Ex.: Na₂SO₄·10H₂O."
          ]
        },
        {
          h: "3. Exemplo de tabela que vira curva (KNO₃, valores aproximados)",
          tabela: {
            cab: ["Temperatura (°C)", "0", "20", "40", "60", "80"],
            linhas: [["g de KNO₃ / 100 g de água", "13", "32", "64", "110", "169"]]
          },
          p: ["Note como a solubilidade do KNO₃ cresce muito com a temperatura: a curva é bem inclinada para cima."]
        },
        {
          h: "4. Exercícios de resfriamento (cristalização)",
          exercicio: [
            {
              enunciado: "Uma solução saturada de KNO₃ com 100 g de água a 60 °C (110 g dissolvidos) é resfriada a 20 °C (CS = 32 g). Quanto sal precipita?",
              passos: ["A 60 °C havia 110 g dissolvidos", "A 20 °C só cabem 32 g", "Precipitam 110 − 32 = 78 g"],
              resposta: "78 g de KNO₃ se depositam no fundo."
            },
            {
              enunciado: "Mesma situação, mas com 200 g de água a 60 °C, resfriada a 20 °C.",
              passos: ["Com 200 g de água, tudo dobra: 220 g dissolvidos a 60 °C", "A 20 °C cabem 64 g", "Precipitam 220 − 64 = 156 g"],
              resposta: "156 g."
            },
            {
              enunciado: "Uma solução com 50 g de KNO₃ em 100 g de água a 40 °C é insaturada, saturada ou supersaturada? (CS a 40 °C = 64 g)",
              passos: ["50 g < 64 g", "O ponto (40 °C; 50 g) fica abaixo da curva"],
              resposta: "Insaturada."
            }
          ]
        },
        {
          h: "5. Gases e o meio ambiente",
          p: ["Como os gases dissolvem menos em água quente, a **poluição térmica** (água quente lançada por indústrias em rios) diminui o oxigênio dissolvido e pode matar peixes."]
        }
      ],
      revisao: [
        "Eixo x: temperatura; eixo y: g de soluto/100 g de água.",
        "Na curva: saturada; abaixo: insaturada; acima: supersaturada ou com corpo de fundo.",
        "Curva que sobe: endotérmica; curva que desce: exotérmica (gases).",
        "NaCl: curva quase horizontal.",
        "Ao resfriar uma saturada (curva ascendente), o excesso precipita: diferença entre os CS."
      ]
    },
    {
      titulo: "Concentração comum e densidade",
      av: "AV3",
      intro: "Duas fórmulas parecidas que confundem muita gente: **concentração comum (C = m₁/V)** e **densidade (d = m/V)**. A diferença está em **qual massa** você usa.",
      secoes: [
        {
          h: "1. Concentração comum (C)",
          p: [
            "Indica a **massa de soluto** em cada unidade de **volume da solução**.",
            "**C = m₁ ÷ V**  → m₁ = massa do **soluto**; V = volume da **solução**.",
            "Unidade mais comum: **g/L** (também g/mL ou g/cm³)."
          ],
          exemplo: { titulo: "O que significa C = 9 g/L?", texto: "No soro fisiológico (0,9% de NaCl), C ≈ 9 g/L: em cada 1 litro de soro há 9 g de sal dissolvidos. Em 500 mL, há 4,5 g." }
        },
        {
          h: "2. Densidade (d)",
          p: [
            "Indica a **massa total** (da solução ou do material) em cada unidade de volume.",
            "**d = m ÷ V** → m = massa da **solução inteira** (soluto + solvente); V = volume.",
            "Unidades: **g/mL**, **g/cm³** ou g/L. A água pura tem d ≈ **1 g/mL** (= 1 g/cm³ = 1000 g/L)."
          ],
          exemplo: { titulo: "Por que o gelo boia?", texto: "A densidade do gelo (≈ 0,92 g/cm³) é menor que a da água líquida (1 g/cm³). Quem tem densidade menor flutua. O óleo também boia na água pelo mesmo motivo." }
        },
        {
          h: "3. A diferença entre as duas",
          tabela: {
            cab: ["", "Concentração comum", "Densidade"],
            linhas: [["Fórmula", "C = m₁ / V", "d = m / V"], ["Massa usada", "Só do soluto", "Da solução toda (soluto + solvente)"], ["Unidade comum", "g/L", "g/mL ou g/cm³"], ["Diz o quê", "Quanto soluto há por volume", "Quão 'pesado' é cada volume"]]
          },
          atencao: "Lembre das conversões: **1 L = 1000 mL** e **1 mL = 1 cm³**. Muitos erros vêm de não converter mL para L antes de calcular em g/L."
        },
        {
          h: "4. Exercícios resolvidos de concentração",
          exercicio: [
            {
              enunciado: "Dissolvem-se 20 g de açúcar em água até 500 mL de solução. Qual a concentração em g/L?",
              passos: ["Converter: 500 mL = 0,5 L", "C = m₁ ÷ V = 20 ÷ 0,5", "C = 40"],
              resposta: "C = 40 g/L."
            },
            {
              enunciado: "Uma solução tem C = 50 g/L. Quantos gramas de soluto há em 200 mL?",
              passos: ["200 mL = 0,2 L", "m₁ = C · V = 50 · 0,2", "m₁ = 10"],
              resposta: "10 g de soluto."
            },
            {
              enunciado: "Que volume de uma solução de C = 8 g/L contém 2 g de soluto?",
              passos: ["V = m₁ ÷ C = 2 ÷ 8", "V = 0,25 L"],
              resposta: "0,25 L = 250 mL."
            }
          ]
        },
        {
          h: "5. Exercícios resolvidos de densidade",
          exercicio: [
            {
              enunciado: "Um bloco de 300 g ocupa 100 cm³. Qual sua densidade? Ele afunda na água?",
              passos: ["d = m ÷ V = 300 ÷ 100", "d = 3 g/cm³", "3 > 1 (água)"],
              resposta: "d = 3 g/cm³; afunda."
            },
            {
              enunciado: "Uma solução tem densidade 1,2 g/mL. Qual a massa de 500 mL dessa solução?",
              passos: ["m = d · V = 1,2 · 500", "m = 600"],
              resposta: "600 g."
            },
            {
              enunciado: "Dissolvem-se 40 g de sal em 160 g de água, formando 180 mL de solução. Calcule C (g/L) e d (g/mL).",
              passos: [
                "Concentração: m₁ = 40 g (só o soluto); V = 180 mL = 0,18 L → C = 40 ÷ 0,18 ≈ 222 g/L",
                "Densidade: m = 40 + 160 = 200 g (solução toda); V = 180 mL → d = 200 ÷ 180 ≈ 1,11 g/mL"
              ],
              resposta: "C ≈ 222 g/L e d ≈ 1,11 g/mL. Repare: o volume final não é a soma simples dos volumes."
            }
          ]
        },
        {
          h: "6. Diluição (extra útil)",
          p: [
            "Diluir é **acrescentar solvente**. A massa de soluto não muda, então: **C₁ · V₁ = C₂ · V₂**.",
            "Ex.: 100 mL de suco com 60 g/L, adicionando água até 300 mL → C₂ = 60 · 100 ÷ 300 = **20 g/L**."
          ]
        }
      ],
      revisao: [
        "C = m(soluto) ÷ V(solução), em g/L.",
        "d = m(solução) ÷ V, em g/mL ou g/cm³.",
        "Converta: 1 L = 1000 mL; 1 mL = 1 cm³.",
        "Água: d = 1 g/mL. Menos denso boia; mais denso afunda.",
        "Diluição: C₁·V₁ = C₂·V₂."
      ]
    }
  ],
  quiz: [
    { pergunta: "Os elementos da tabela periódica estão organizados em ordem crescente de:", alternativas: ["Massa atômica", "Número atômico (prótons)", "Número de nêutrons", "Data de descoberta"], correta: 1, explicacao: "Desde Moseley, a tabela segue o número atômico Z." },
    { pergunta: "Elementos de um mesmo grupo (família) têm em comum:", alternativas: ["O mesmo número de camadas", "A mesma massa", "O mesmo número de elétrons na última camada", "O mesmo número de nêutrons"], correta: 2, explicacao: "Mesma família = mesmos elétrons de valência = propriedades químicas parecidas." },
    { pergunta: "O número do período indica:", alternativas: ["O número de camadas eletrônicas", "Os elétrons da última camada", "O número de prótons", "Se é metal ou não"], correta: 0, explicacao: "3º período → 3 camadas." },
    { pergunta: "Os halogênios formam a família:", alternativas: ["1", "2", "16", "17"], correta: 3, explicacao: "Família 17: F, Cl, Br, I, com 7 elétrons na última camada." },
    { pergunta: "Um elemento com distribuição K=2, L=8, M=2 está:", alternativas: ["No 2º período, família 2", "No 3º período, família 2", "No 3º período, família 12", "No 2º período, família 3"], correta: 1, explicacao: "3 camadas → 3º período; 2 elétrons na última → família 2 (é o magnésio)." },
    { pergunta: "Os gases nobres são estáveis porque:", alternativas: ["São metais", "Têm a última camada completa (8 elétrons, ou 2 no He)", "Têm muitos prótons", "São muito pesados"], correta: 1, explicacao: "É a base da regra do octeto." },
    { pergunta: "A ligação iônica ocorre geralmente entre:", alternativas: ["Dois não metais", "Dois metais", "Metal e não metal", "Gases nobres"], correta: 2, explicacao: "O metal doa elétrons e o não metal recebe." },
    { pergunta: "A fórmula do composto entre Ca²⁺ e Cl⁻ é:", alternativas: ["CaCl", "Ca₂Cl", "CaCl₂", "Ca₂Cl₂"], correta: 2, explicacao: "Cruzando as cargas: Ca₁Cl₂." },
    { pergunta: "O sal de cozinha (NaCl) conduz corrente elétrica:", alternativas: ["No estado sólido", "Somente dissolvido em água ou fundido", "Nunca", "Só quando gelado"], correta: 1, explicacao: "Só com íons livres, em solução ou fundido." },
    { pergunta: "Na ligação covalente, os átomos:", alternativas: ["Transferem elétrons", "Compartilham pares de elétrons", "Perdem prótons", "Formam mar de elétrons"], correta: 1, explicacao: "Não metais compartilham elétrons e formam moléculas." },
    { pergunta: "Na molécula de N₂, a ligação entre os nitrogênios é:", alternativas: ["Simples", "Dupla", "Tripla", "Iônica"], correta: 2, explicacao: "O N precisa de 3 elétrons: N≡N." },
    { pergunta: "Qual propriedade é explicada pelo 'mar de elétrons'?", alternativas: ["Metais serem quebradiços", "Metais conduzirem bem eletricidade", "Sal dissolver em água", "Água ser líquida"], correta: 1, explicacao: "Os elétrons livres conduzem corrente e calor." },
    { pergunta: "O bronze é uma liga de:", alternativas: ["Ferro e carbono", "Cobre e zinco", "Cobre e estanho", "Ouro e prata"], correta: 2, explicacao: "Latão é cobre e zinco; aço é ferro e carbono." },
    { pergunta: "Em uma mistura de água com sal, o soluto é:", alternativas: ["A água", "O sal", "Os dois", "Nenhum"], correta: 1, explicacao: "O soluto é o que é dissolvido." },
    { pergunta: "Coeficiente de solubilidade é:", alternativas: ["A massa total da solução", "A quantidade máxima de soluto dissolvida numa quantidade de solvente, a certa temperatura", "O volume de água", "A densidade do soluto"], correta: 1, explicacao: "Sempre acompanhado da temperatura." },
    { pergunta: "CS = 36 g/100 g de água. Ao colocar 40 g em 100 g de água, obtém-se:", alternativas: ["Insaturada", "Saturada com 4 g de corpo de fundo", "Supersaturada estável", "Saturada sem corpo de fundo"], correta: 1, explicacao: "Dissolvem 36 g; sobram 4 g no fundo." },
    { pergunta: "Uma solução supersaturada é:", alternativas: ["Estável", "Instável: com agitação o excesso precipita", "Igual à insaturada", "Aquela com corpo de fundo"], correta: 1, explicacao: "Tem mais soluto dissolvido que o limite." },
    { pergunta: "Na curva de solubilidade, um ponto abaixo da curva representa solução:", alternativas: ["Saturada", "Supersaturada", "Insaturada", "Com corpo de fundo"], correta: 2, explicacao: "Ainda cabe mais soluto." },
    { pergunta: "Por que o refrigerante quente perde gás mais rápido?", alternativas: ["Gases dissolvem mais no calor", "Gases dissolvem menos quando a temperatura aumenta", "O açúcar evapora", "A pressão aumenta"], correta: 1, explicacao: "Gases têm curva de solubilidade descendente." },
    { pergunta: "20 g de soluto em 250 mL de solução. A concentração comum é:", alternativas: ["5 g/L", "20 g/L", "80 g/L", "0,08 g/L"], correta: 2, explicacao: "250 mL = 0,25 L; 20 ÷ 0,25 = 80 g/L." },
    { pergunta: "Na fórmula da densidade (d = m/V) de uma solução, m é a massa:", alternativas: ["Só do soluto", "Só do solvente", "Da solução inteira", "Dos íons"], correta: 2, explicacao: "Na concentração comum é só do soluto; na densidade é tudo." },
    { pergunta: "Um objeto com densidade 0,8 g/cm³ colocado na água (1 g/cm³):", alternativas: ["Afunda", "Boia", "Dissolve", "Fica no meio sempre"], correta: 1, explicacao: "Menos denso que a água, flutua." },
    { pergunta: "Mexer o copo com açúcar:", alternativas: ["Aumenta o coeficiente de solubilidade", "Só acelera a dissolução", "Diminui a solubilidade", "Transforma em supersaturada"], correta: 1, explicacao: "O máximo depende da temperatura, não da agitação." }
  ],
  flashcards: [
    { frente: "Período", verso: "Linha horizontal; indica o número de camadas eletrônicas (7 períodos)." },
    { frente: "Grupo/família", verso: "Coluna vertical (18); mesma quantidade de elétrons na última camada." },
    { frente: "Famílias 1, 2, 16, 17, 18", verso: "Alcalinos, alcalinoterrosos, calcogênios, halogênios, gases nobres." },
    { frente: "Regra do octeto", verso: "Átomos fazem ligações para ficar com 8 elétrons na última camada (2 no caso do H/He)." },
    { frente: "Cátion × ânion", verso: "Cátion: perdeu elétrons (+), típico de metais. Ânion: ganhou elétrons (−), típico de não metais." },
    { frente: "Ligação iônica", verso: "Metal + não metal; transferência de elétrons; retículo cristalino; conduz só em solução ou fundido." },
    { frente: "Ligação covalente", verso: "Não metal + não metal (ou H); compartilhamento de pares; forma moléculas." },
    { frente: "Ligação metálica", verso: "Metal + metal; mar de elétrons livres; conduz, brilha, é maleável e dúctil." },
    { frente: "Quantas ligações fazem H, O, N e C?", verso: "H = 1, O = 2, N = 3, C = 4." },
    { frente: "Aço, bronze e latão", verso: "Aço: Fe + C. Bronze: Cu + Sn. Latão: Cu + Zn." },
    { frente: "Soluto × solvente", verso: "Soluto é dissolvido; solvente dissolve (água = solvente universal)." },
    { frente: "Coeficiente de solubilidade", verso: "Máximo de soluto em 100 g de água, numa temperatura." },
    { frente: "Insaturada, saturada, supersaturada", verso: "Menos que o CS; igual ao CS; acima do CS tudo dissolvido (instável)." },
    { frente: "Corpo de fundo", verso: "Excesso de soluto que não dissolve e fica no fundo de uma solução saturada." },
    { frente: "Curva ascendente × descendente", verso: "Sobe: dissolução endotérmica (maioria dos sais). Desce: exotérmica (gases)." },
    { frente: "Concentração comum", verso: "C = m(soluto) ÷ V(solução), geralmente em g/L." },
    { frente: "Densidade", verso: "d = m(total) ÷ V, em g/mL ou g/cm³. Água ≈ 1 g/mL." },
    { frente: "Diluição", verso: "Adicionar solvente: C₁·V₁ = C₂·V₂." }
  ]
});
