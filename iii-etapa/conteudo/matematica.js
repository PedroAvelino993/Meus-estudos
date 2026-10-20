(window.MATERIAS = window.MATERIAS || []).push({
  id: "matematica",
  nome: "Matemática",
  icone: "📐",
  prova: "AV2: Cap. 10, 11 e 12 · AV3: os mesmos + conteúdos essenciais",
  topicos: [
    // ------------------------------------------------------------------
    {
      titulo: "Simetria: reflexão, rotação e translação",
      av: "AV2 · AV3",
      intro: "Simetria é a ideia de que uma figura pode ser movida (refletida, girada ou deslizada) e continuar 'encaixando' em si mesma ou em uma cópia. As transformações que estudamos aqui mudam a **posição** da figura, mas **não mudam forma nem tamanho**: por isso são chamadas de **isometrias** (iso = igual, metria = medida).",
      secoes: [
        {
          h: "1. Simetria axial (reflexão)",
          p: [
            "Na simetria axial existe uma reta, o **eixo de simetria**, que funciona como um espelho. Cada ponto da figura tem um ponto correspondente do outro lado do eixo, **à mesma distância** e na **perpendicular** ao eixo.",
            "Se você dobrar o papel no eixo, as duas metades se sobrepõem perfeitamente."
          ],
          lista: [
            "Quadrado: 4 eixos de simetria (2 diagonais + 2 que passam pelos pontos médios dos lados).",
            "Retângulo (não quadrado): 2 eixos (os que passam pelos pontos médios). As diagonais **não** são eixos!",
            "Triângulo equilátero: 3 eixos. Triângulo isósceles: 1 eixo. Triângulo escaleno: nenhum.",
            "Círculo: infinitos eixos (qualquer reta que passa pelo centro).",
            "Polígono regular de n lados: n eixos de simetria."
          ],
          exemplo: {
            titulo: "Exemplo com coordenadas",
            texto: "Refletindo o ponto A(3, 2) em relação ao **eixo y**, o x troca de sinal: A'(−3, 2). Refletindo em relação ao **eixo x**, o y troca de sinal: A''(3, −2)."
          },
          atencao: "Na reflexão a figura fica 'espelhada': a orientação se inverte (o que estava à direita passa para a esquerda). Por isso uma letra 'R' refletida fica ao contrário."
        },
        {
          h: "2. Simetria de rotação (rotacional)",
          p: [
            "Na rotação a figura gira em torno de um ponto fixo, o **centro de rotação**, por um certo **ângulo** e num **sentido** (horário ou anti-horário).",
            "Uma figura tem **simetria de rotação** quando, girada por um ângulo menor que 360°, coincide com ela mesma. O menor ângulo que faz isso é o ângulo de simetria.",
            "Para um polígono regular de n lados, esse ângulo é **360° ÷ n**. Exemplo: o hexágono regular coincide consigo mesmo a cada 360° ÷ 6 = 60°."
          ],
          exemplo: {
            titulo: "Simetria central",
            texto: "É uma rotação de **180°**. Cada ponto vai para o lado oposto do centro, à mesma distância. O paralelogramo tem simetria central (em torno do encontro das diagonais), mesmo sem ter eixo de simetria."
          }
        },
        {
          h: "3. Translação",
          p: [
            "Na translação a figura **desliza**, sem girar e sem espelhar. Todos os pontos se movem a mesma distância, na mesma direção e no mesmo sentido. Isso é descrito por um **vetor** (uma seta).",
            "Com coordenadas: transladar 4 unidades para a direita e 1 para baixo é somar +4 no x e −1 no y. O ponto (2, 5) vai para (6, 4)."
          ],
          tabela: {
            cab: ["Transformação", "O que acontece", "Muda o tamanho?", "Inverte a orientação?"],
            linhas: [
              ["Reflexão", "Espelha em relação a um eixo", "Não", "Sim"],
              ["Rotação", "Gira em torno de um ponto", "Não", "Não"],
              ["Translação", "Desliza na direção de um vetor", "Não", "Não"],
              ["Homotetia (ampliação/redução)", "Aumenta ou diminui a partir de um centro", "**Sim**", "Não"]
            ]
          },
          atencao: "A ampliação/redução (homotetia) **não** é isometria: ela gera figuras **semelhantes**, não congruentes. É a ponte para o próximo assunto."
        }
      ],
      revisao: [
        "Isometrias (reflexão, rotação, translação) mantêm forma e tamanho.",
        "Polígono regular de n lados: n eixos de simetria e simetria de rotação de 360°/n.",
        "Reflexão no eixo y troca o sinal do x; no eixo x troca o sinal do y.",
        "Simetria central = rotação de 180°.",
        "Ampliação/redução muda o tamanho e gera figuras semelhantes."
      ]
    },
    // ------------------------------------------------------------------
    {
      titulo: "Semelhança de triângulos",
      av: "AV2 · AV3",
      intro: "Duas figuras são **semelhantes** quando têm a **mesma forma**, mas podem ter tamanhos diferentes, como uma foto e sua ampliação. Nos triângulos isso é muito usado para calcular alturas e distâncias que não dá para medir diretamente.",
      secoes: [
        {
          h: "1. O que é ser semelhante",
          p: [
            "Dois triângulos são semelhantes quando:",
          ],
          lista: [
            "os **ângulos correspondentes são iguais** (congruentes), e",
            "os **lados correspondentes são proporcionais** (dividindo um lado pelo seu correspondente, sempre dá o mesmo número)."
          ],
          exemplo: {
            titulo: "Razão de semelhança (k)",
            texto: "Se o triângulo ABC tem lados 3, 4 e 5 e o triângulo DEF tem lados 6, 8 e 10, então 6/3 = 8/4 = 10/5 = **2**. A razão de semelhança é k = 2: DEF é o dobro de ABC."
          }
        },
        {
          h: "2. Casos de semelhança (como provar)",
          p: ["Não é preciso conferir tudo. Basta um destes casos:"],
          tabela: {
            cab: ["Caso", "O que precisa", "Exemplo"],
            linhas: [
              ["**AA** (ângulo-ângulo)", "Dois ângulos iguais (o terceiro é igual automaticamente, porque a soma é 180°)", "Dois triângulos com ângulos de 40° e 70°"],
              ["**LAL**", "Dois lados proporcionais e o ângulo **entre eles** igual", "Lados 2 e 3 com 50° entre eles × lados 4 e 6 com 50°"],
              ["**LLL**", "Os três lados proporcionais", "3, 4, 5 × 6, 8, 10"]
            ]
          },
          atencao: "Semelhante ≠ congruente. **Congruentes** são cópias exatas (k = 1). **Semelhantes** podem ter tamanhos diferentes."
        },
        {
          h: "3. O que acontece com perímetro e área",
          p: [
            "Se a razão de semelhança entre os lados é **k**:",
          ],
          lista: [
            "a razão entre os **perímetros** também é **k**;",
            "a razão entre as **áreas** é **k²** (porque a área usa duas medidas multiplicadas)."
          ],
          exemplo: {
            titulo: "Exemplo",
            texto: "Um triângulo é ampliado com k = 3. Se o perímetro era 12 cm, passa a ser 36 cm. Se a área era 6 cm², passa a ser 6 × 3² = **54 cm²** (e não 18!)."
          }
        },
        {
          h: "4. Aplicação: a sombra e a altura",
          p: [
            "Num mesmo momento do dia, os raios de sol chegam paralelos. Por isso um objeto e sua sombra formam um triângulo retângulo **semelhante** ao de outro objeto e sua sombra (caso AA: o ângulo reto e o ângulo do sol são iguais)."
          ],
          exercicio: {
            enunciado: "Um poste projeta uma sombra de 6 m. No mesmo instante, uma pessoa de 1,6 m projeta uma sombra de 1,2 m. Qual a altura do poste?",
            passos: [
              "Os triângulos (poste/sombra e pessoa/sombra) são semelhantes.",
              "Monte a proporção: altura do poste / 6 = 1,6 / 1,2.",
              "Multiplique cruzado: altura × 1,2 = 6 × 1,6 = 9,6.",
              "altura = 9,6 ÷ 1,2 = 8."
            ],
            resposta: "O poste tem 8 m."
          }
        },
        {
          h: "5. Teorema de Tales (ligado à semelhança)",
          p: [
            "Quando um feixe de **retas paralelas** é cortado por duas transversais, os segmentos formados nas transversais são **proporcionais**.",
            "Uma consequência importante: uma reta **paralela a um lado** de um triângulo, que corta os outros dois lados, forma um **triângulo menor semelhante** ao original."
          ],
          exercicio: {
            enunciado: "Três paralelas cortam duas transversais. Na primeira, os segmentos medem 4 cm e 6 cm. Na segunda, o segmento correspondente ao de 4 cm mede 10 cm. Quanto mede o outro (x)?",
            passos: ["4/6 = 10/x", "4x = 60", "x = 15"],
            resposta: "x = 15 cm."
          }
        }
      ],
      revisao: [
        "Semelhantes: ângulos iguais e lados proporcionais.",
        "Casos: AA, LAL (ângulo entre os lados), LLL.",
        "Perímetros na razão k; áreas na razão k².",
        "Sombra e altura: monte a proporção e multiplique cruzado.",
        "Tales: paralelas cortando transversais formam segmentos proporcionais."
      ]
    },
    // ------------------------------------------------------------------
    {
      titulo: "Áreas de figuras planas e figuras compostas",
      av: "AV2 · AV3",
      intro: "Área é a medida da superfície, sempre em unidades **ao quadrado** (cm², m², km²). Para figuras complicadas, a estratégia é sempre a mesma: **decompor** em figuras simples ou **subtrair** a parte que falta.",
      secoes: [
        {
          h: "1. As fórmulas básicas",
          tabela: {
            cab: ["Figura", "Fórmula", "Observação"],
            linhas: [
              ["Quadrado", "A = l²", "l = lado"],
              ["Retângulo", "A = b · h", "base × altura"],
              ["Paralelogramo", "A = b · h", "a altura é perpendicular à base (não é o lado inclinado!)"],
              ["Triângulo", "A = (b · h) ÷ 2", "é metade de um paralelogramo"],
              ["Trapézio", "A = (B + b) · h ÷ 2", "B = base maior, b = base menor"],
              ["Losango", "A = (D · d) ÷ 2", "D e d = diagonais"],
              ["Hexágono regular", "A = 6 × área de um triângulo equilátero", "é formado por 6 triângulos equiláteros"]
            ]
          },
          atencao: "Lembre de usar a **mesma unidade** em todas as medidas antes de calcular. 1 m = 100 cm, mas **1 m² = 10 000 cm²**."
        },
        {
          h: "2. Figuras compostas: decompor",
          p: ["Divida a figura em retângulos, triângulos ou trapézios, calcule cada área e **some**."],
          exercicio: {
            enunciado: "Uma figura em forma de 'L' é formada por um retângulo de 8 m × 3 m e outro de 4 m × 5 m (sem sobreposição). Qual a área total?",
            passos: ["Primeiro retângulo: 8 × 3 = 24 m².", "Segundo retângulo: 4 × 5 = 20 m².", "Total: 24 + 20 = 44 m²."],
            resposta: "Área = 44 m²."
          }
        },
        {
          h: "3. Figuras compostas: subtrair",
          p: ["Quando a figura é 'um pedaço grande com um buraco', calcule a área grande e **tire** a do buraco."],
          exercicio: {
            enunciado: "Um terreno retangular de 20 m × 12 m tem uma piscina quadrada de 5 m de lado. Qual a área do terreno sem a piscina?",
            passos: ["Terreno: 20 × 12 = 240 m².", "Piscina: 5² = 25 m².", "Sem a piscina: 240 − 25 = 215 m²."],
            resposta: "215 m²."
          }
        },
        {
          h: "4. Polígonos regulares",
          p: [
            "Um polígono regular pode ser dividido em **n triângulos iguais** a partir do centro. A altura desses triângulos se chama **apótema** (a).",
            "Área do polígono regular = (perímetro × apótema) ÷ 2."
          ],
          exemplo: {
            titulo: "Exemplo",
            texto: "Hexágono regular de lado 4 cm e apótema ≈ 3,46 cm: perímetro = 24 cm; área ≈ (24 × 3,46) ÷ 2 ≈ **41,5 cm²**."
          }
        }
      ],
      revisao: [
        "Área = medida da superfície, em unidades².",
        "Triângulo: b·h/2 · Trapézio: (B+b)·h/2 · Losango: D·d/2.",
        "Figura composta: decompor e somar, ou calcular o todo e subtrair o buraco.",
        "Polígono regular: (perímetro × apótema)/2."
      ]
    },
    // ------------------------------------------------------------------
    {
      titulo: "Círculo e circunferência: comprimento e área",
      av: "AV2 · AV3",
      intro: "**Circunferência** é a linha (a 'borda'); **círculo** é a região dentro dela. Para os dois aparece o número **π (pi)**, que vale aproximadamente **3,14**.",
      secoes: [
        {
          h: "1. De onde vem o π",
          p: [
            "Se você medir o contorno de qualquer circunferência e dividir pelo diâmetro, sempre dá o mesmo número: aproximadamente 3,14159... Esse número é o **π**.",
            "Por isso: **C = π · d** ou, como o diâmetro é o dobro do raio, **C = 2 · π · r**."
          ],
          exercicio: {
            enunciado: "Uma roda de bicicleta tem raio de 35 cm. Quantos centímetros ela anda em uma volta completa? (use π = 3,14)",
            passos: ["C = 2 · π · r", "C = 2 · 3,14 · 35", "C = 219,8"],
            resposta: "Em uma volta ela anda 219,8 cm (≈ 2,2 m)."
          }
        },
        {
          h: "2. Área do círculo",
          p: ["**A = π · r²**. Atenção: é o **raio** ao quadrado."],
          exercicio: {
            enunciado: "Qual a área de uma pizza de 40 cm de diâmetro? (π = 3,14)",
            passos: ["O raio é metade do diâmetro: r = 20 cm.", "A = 3,14 · 20² = 3,14 · 400", "A = 1256"],
            resposta: "1 256 cm²."
          },
          atencao: "Erro clássico: usar o diâmetro no lugar do raio. Se a questão der o diâmetro, divida por 2 primeiro."
        },
        {
          h: "3. Partes do círculo",
          lista: [
            "**Setor circular** (fatia de pizza): área = (ângulo ÷ 360°) × π · r². Um setor de 90° é 1/4 do círculo.",
            "**Coroa circular** (anel, entre dois círculos com o mesmo centro): A = π · (R² − r²).",
            "**Semicírculo**: metade da área do círculo."
          ],
          exercicio: {
            enunciado: "Uma fatia de pizza tem ângulo de 45° e a pizza tem raio 20 cm. Qual a área da fatia? (π = 3,14)",
            passos: ["Área total: 3,14 × 400 = 1256 cm².", "45° é 45/360 = 1/8 do círculo.", "1256 ÷ 8 = 157."],
            resposta: "157 cm²."
          }
        }
      ],
      revisao: [
        "Circunferência = contorno; círculo = região.",
        "C = 2πr (ou πd).",
        "A = πr² (sempre o raio!).",
        "Setor: (ângulo/360)·πr². Coroa: π(R² − r²)."
      ]
    },
    // ------------------------------------------------------------------
    {
      titulo: "Volume de poliedros e sólidos de revolução",
      av: "AV2 · AV3",
      intro: "Volume é o espaço ocupado por um sólido, em unidades **ao cubo** (cm³, m³). Também é ligado à capacidade: **1 dm³ = 1 litro** e **1 m³ = 1000 litros**.",
      secoes: [
        {
          h: "1. Poliedros",
          p: [
            "Poliedros são sólidos formados só por **faces planas** (polígonos). Exemplos: cubo, prismas, pirâmides.",
            "Elementos: **faces** (F), **arestas** (A, os 'segmentos') e **vértices** (V, os 'cantos'). Nos poliedros convexos vale a **Relação de Euler: V − A + F = 2**."
          ],
          exemplo: {
            titulo: "Conferindo Euler no cubo",
            texto: "Cubo: V = 8, A = 12, F = 6. 8 − 12 + 6 = **2** ✓."
          }
        },
        {
          h: "2. Volume dos prismas e do cubo",
          p: ["Todo prisma (e cilindro) segue a mesma ideia: **V = área da base × altura**."],
          lista: [
            "Cubo: V = a³.",
            "Paralelepípedo (caixa): V = comprimento × largura × altura.",
            "Prisma de base triangular: V = (área do triângulo) × altura."
          ],
          exercicio: {
            enunciado: "Uma caixa-d'água tem 2 m × 1,5 m × 1 m. Quantos litros cabem?",
            passos: ["V = 2 × 1,5 × 1 = 3 m³.", "1 m³ = 1000 L.", "3 × 1000 = 3000."],
            resposta: "3 000 litros."
          }
        },
        {
          h: "3. Pirâmides",
          p: [
            "A pirâmide tem **um terço** do volume de um prisma com a mesma base e a mesma altura: **V = (área da base × altura) ÷ 3**."
          ],
          exercicio: {
            enunciado: "Uma pirâmide de base quadrada com lado 6 cm tem altura 10 cm. Qual o volume?",
            passos: ["Área da base: 6² = 36 cm².", "V = 36 × 10 ÷ 3 = 120."],
            resposta: "120 cm³."
          }
        },
        {
          h: "4. Sólidos de revolução",
          p: [
            "São sólidos 'redondos' formados quando uma figura plana **gira 360°** em torno de um eixo:",
          ],
          tabela: {
            cab: ["Figura que gira", "Sólido formado", "Volume"],
            linhas: [
              ["Retângulo (girando em um lado)", "**Cilindro**", "V = π · r² · h"],
              ["Triângulo retângulo (girando em um cateto)", "**Cone**", "V = (π · r² · h) ÷ 3"],
              ["Semicírculo (girando no diâmetro)", "**Esfera**", "V = (4 · π · r³) ÷ 3"]
            ]
          },
          exercicio: [
            {
              enunciado: "Uma lata cilíndrica tem raio 5 cm e altura 12 cm. Qual o volume? (π = 3,14)",
              passos: ["Área da base: 3,14 × 5² = 78,5 cm².", "V = 78,5 × 12 = 942."],
              resposta: "942 cm³ (≈ 0,94 litro)."
            },
            {
              enunciado: "Uma casquinha (cone) tem raio 3 cm e altura 10 cm. Qual o volume? (π = 3,14)",
              passos: ["π · r² · h = 3,14 × 9 × 10 = 282,6.", "Divide por 3: 94,2."],
              resposta: "94,2 cm³."
            }
          ],
          atencao: "Cilindro, cone e esfera **não são poliedros**: têm superfícies curvas. Por isso a relação de Euler não vale para eles."
        }
      ],
      revisao: [
        "Volume em unidades³; 1 dm³ = 1 L; 1 m³ = 1000 L.",
        "Euler (poliedros): V − A + F = 2.",
        "Prisma e cilindro: área da base × altura.",
        "Pirâmide e cone: (área da base × altura) ÷ 3.",
        "Esfera: 4πr³/3. Sólidos de revolução: cilindro, cone, esfera."
      ]
    },
    // ------------------------------------------------------------------
    {
      titulo: "Sequências recursivas e não recursivas",
      av: "AV2 · AV3",
      intro: "Uma **sequência** é uma lista ordenada de números (ou figuras) que segue uma regra. Cada elemento é um **termo**: a₁ é o 1º termo, a₂ o 2º, aₙ o termo da posição n.",
      secoes: [
        {
          h: "1. Sequência recursiva",
          p: [
            "Na sequência **recursiva**, cada termo é calculado **a partir do anterior** (ou dos anteriores). Para usá-la você precisa conhecer o primeiro termo e a regra.",
          ],
          exemplo: [
            { titulo: "Exemplo 1", texto: "a₁ = 3 e aₙ = aₙ₋₁ + 4. Sequência: 3, 7, 11, 15, 19, ... (sempre soma 4 ao anterior)." },
            { titulo: "Exemplo 2 (Fibonacci)", texto: "a₁ = 1, a₂ = 1 e cada termo é a soma dos dois anteriores: 1, 1, 2, 3, 5, 8, 13, 21, ..." }
          ],
          atencao: "Para descobrir o 100º termo de uma sequência recursiva você teria que calcular os 99 anteriores. Por isso a fórmula não recursiva é tão útil."
        },
        {
          h: "2. Sequência não recursiva (termo geral)",
          p: [
            "Na sequência **não recursiva**, cada termo é calculado diretamente pela **posição n**, sem precisar do anterior. A fórmula se chama **termo geral**."
          ],
          exemplo: {
            titulo: "Exemplo",
            texto: "aₙ = 4n − 1. Para n = 1: 3; n = 2: 7; n = 3: 11... (é a mesma sequência do Exemplo 1!). O 100º termo: 4 × 100 − 1 = **399**, direto."
          }
        },
        {
          h: "3. Descobrindo o termo geral",
          p: [
            "Em sequências que **aumentam sempre a mesma quantidade** (progressão aritmética), o termo geral tem a forma **aₙ = (diferença) · n + ajuste**."
          ],
          exercicio: {
            enunciado: "Encontre o termo geral de 5, 8, 11, 14, ... e calcule o 20º termo.",
            passos: [
              "A diferença entre os termos é 3, então aₙ = 3n + ajuste.",
              "Para n = 1 deve dar 5: 3 × 1 + ajuste = 5 → ajuste = 2.",
              "Termo geral: aₙ = 3n + 2.",
              "a₂₀ = 3 × 20 + 2 = 62."
            ],
            resposta: "aₙ = 3n + 2 e a₂₀ = 62."
          }
        },
        {
          h: "4. Sequências de figuras",
          p: ["Muitas questões mostram figuras crescendo (palitos, bolinhas, quadradinhos). Conte os elementos das 3 primeiras figuras, veja quanto aumenta e monte a regra."],
          exercicio: {
            enunciado: "Com palitos se formam quadradinhos em fila: 1 quadrado usa 4 palitos, 2 quadrados usam 7, 3 quadrados usam 10. Quantos palitos para 15 quadrados?",
            passos: [
              "Aumenta 3 palitos por quadrado: recursiva aₙ = aₙ₋₁ + 3.",
              "Não recursiva: aₙ = 3n + 1 (confira: n = 1 → 4 ✓).",
              "a₁₅ = 3 × 15 + 1 = 46."
            ],
            resposta: "46 palitos."
          }
        },
        {
          h: "5. Outros tipos",
          lista: [
            "**Progressão geométrica**: multiplica sempre pelo mesmo número. 2, 6, 18, 54... (×3).",
            "**Quadrados perfeitos**: 1, 4, 9, 16, ... → aₙ = n².",
            "**Números pares**: aₙ = 2n · **ímpares**: aₙ = 2n − 1."
          ]
        }
      ],
      revisao: [
        "Recursiva: usa o termo anterior (precisa de a₁ e da regra).",
        "Não recursiva: fórmula pela posição n (termo geral).",
        "Somando sempre d: aₙ = d·n + ajuste (ajuste = a₁ − d).",
        "Teste a fórmula com n = 1, 2, 3 antes de usar."
      ]
    },
    // ------------------------------------------------------------------
    {
      titulo: "Notação científica",
      av: "AV3",
      intro: "Serve para escrever números muito grandes ou muito pequenos de forma curta. Formato: **a × 10ⁿ**, em que **1 ≤ a < 10** (um número com um algarismo antes da vírgula, diferente de zero) e n é inteiro.",
      secoes: [
        {
          h: "1. Números grandes (expoente positivo)",
          p: ["Ande com a vírgula para a **esquerda** até sobrar um algarismo antes dela. Cada casa andada soma 1 no expoente."],
          exemplo: {
            titulo: "Exemplos",
            texto: "Distância Terra–Sol ≈ 150 000 000 km = **1,5 × 10⁸ km** (a vírgula andou 8 casas). População mundial ≈ 8 000 000 000 = **8 × 10⁹**."
          }
        },
        {
          h: "2. Números pequenos (expoente negativo)",
          p: ["Ande com a vírgula para a **direita** até o primeiro algarismo diferente de zero. O expoente fica **negativo**."],
          exemplo: {
            titulo: "Exemplos",
            texto: "0,00045 = **4,5 × 10⁻⁴** (andou 4 casas). Tamanho de uma bactéria ≈ 0,000002 m = **2 × 10⁻⁶ m**."
          }
        },
        {
          h: "3. Operações",
          lista: [
            "**Multiplicação**: multiplica os números e **soma** os expoentes. (2 × 10³) · (4 × 10⁵) = 8 × 10⁸.",
            "**Divisão**: divide os números e **subtrai** os expoentes. (9 × 10⁷) ÷ (3 × 10²) = 3 × 10⁵.",
            "Se o resultado sair fora do padrão, ajuste: 25 × 10⁴ = 2,5 × 10⁵."
          ],
          atencao: "34 × 10⁵ **não** está em notação científica (34 é maior que 10). O certo é 3,4 × 10⁶."
        }
      ],
      revisao: [
        "Formato a × 10ⁿ com 1 ≤ a < 10.",
        "Número grande → expoente positivo; pequeno (0,...) → negativo.",
        "Multiplicar: soma expoentes. Dividir: subtrai.",
        "Sempre ajuste o 'a' para ficar entre 1 e 10."
      ]
    },
    // ------------------------------------------------------------------
    {
      titulo: "Razão, proporção e regra de três",
      av: "AV3",
      intro: "**Razão** é a comparação entre dois números por divisão (a/b). **Proporção** é a igualdade entre duas razões.",
      secoes: [
        {
          h: "1. Razão",
          lista: [
            "Numa sala com 12 meninas e 18 meninos, a razão meninas/meninos é 12/18 = **2/3**.",
            "**Escala** é uma razão: escala 1 : 100 significa que 1 cm no desenho = 100 cm (1 m) na realidade.",
            "**Velocidade média** é a razão distância/tempo; **densidade** é massa/volume."
          ]
        },
        {
          h: "2. Proporção e propriedade fundamental",
          p: ["Em a/b = c/d, vale: **a · d = b · c** (o produto dos meios é igual ao produto dos extremos, 'multiplicar cruzado')."],
          exemplo: { titulo: "Exemplo", texto: "x/5 = 12/20 → 20x = 60 → x = 3." }
        },
        {
          h: "3. Grandezas diretamente e inversamente proporcionais",
          tabela: {
            cab: ["Tipo", "Como reconhecer", "Exemplo"],
            linhas: [
              ["**Diretamente** proporcionais", "Uma dobra → a outra dobra", "Quantidade de pães e preço"],
              ["**Inversamente** proporcionais", "Uma dobra → a outra cai pela metade", "Velocidade e tempo de viagem; nº de operários e dias de obra"]
            ]
          }
        },
        {
          h: "4. Regra de três simples",
          exercicio: [
            {
              enunciado: "(Direta) 3 kg de carne custam R$ 120. Quanto custam 5 kg?",
              passos: ["3 kg → 120; 5 kg → x.", "Mais carne, mais caro: direta, multiplica cruzado.", "3x = 600 → x = 200."],
              resposta: "R$ 200."
            },
            {
              enunciado: "(Inversa) 4 pedreiros fazem um muro em 6 dias. Em quantos dias 8 pedreiros fazem?",
              passos: ["Mais pedreiros, menos dias: inversa.", "Inverta uma das razões: 4/8 = x/6.", "8x = 24 → x = 3."],
              resposta: "3 dias."
            }
          ],
          atencao: "Antes de multiplicar cruzado, pergunte: 'se uma aumenta, a outra aumenta ou diminui?'. Se diminui, é inversa: inverta antes."
        }
      ],
      revisao: [
        "Razão = a/b. Proporção = duas razões iguais.",
        "Propriedade fundamental: a·d = b·c.",
        "Direta: ambas aumentam. Inversa: uma aumenta e a outra diminui.",
        "Escala 1:n → 1 unidade no desenho = n na realidade."
      ]
    },
    // ------------------------------------------------------------------
    {
      titulo: "Expressões algébricas e produtos notáveis",
      av: "AV3",
      intro: "Expressão algébrica mistura números, letras (variáveis) e operações. As letras representam números desconhecidos ou que variam.",
      secoes: [
        {
          h: "1. Valor numérico",
          p: ["Substitua as letras pelos números (use parênteses!) e resolva."],
          exercicio: {
            enunciado: "Calcule 3x² − 2y para x = −2 e y = 5.",
            passos: ["3 · (−2)² − 2 · 5", "3 · 4 − 10", "12 − 10 = 2"],
            resposta: "Valor numérico = 2."
          },
          atencao: "(−2)² = +4, mas −2² = −4. Por isso sempre use parênteses ao substituir números negativos."
        },
        {
          h: "2. Monômios, termos semelhantes e polinômios",
          lista: [
            "**Monômio**: um termo só, como 5x²y (coeficiente 5, parte literal x²y).",
            "**Termos semelhantes**: mesma parte literal. 3x² e −7x² são semelhantes; 3x² e 3x não são.",
            "Só se somam termos semelhantes: 3x² + 5x − x² + 2x = **2x² + 7x**.",
            "**Polinômio**: soma de monômios."
          ]
        },
        {
          h: "3. Multiplicação (distributiva)",
          p: ["Cada termo de um parêntese multiplica cada termo do outro."],
          exemplo: { titulo: "Exemplo", texto: "(x + 3)(x − 2) = x² − 2x + 3x − 6 = **x² + x − 6**." }
        },
        {
          h: "4. Produtos notáveis",
          tabela: {
            cab: ["Produto", "Resultado", "Frase para lembrar"],
            linhas: [
              ["(a + b)²", "a² + 2ab + b²", "quadrado do 1º + 2 × 1º × 2º + quadrado do 2º"],
              ["(a − b)²", "a² − 2ab + b²", "igual, mas o termo do meio fica negativo"],
              ["(a + b)(a − b)", "a² − b²", "quadrado do 1º menos quadrado do 2º"]
            ]
          },
          exemplo: { titulo: "Exemplos", texto: "(x + 5)² = x² + 10x + 25 · (2y − 3)² = 4y² − 12y + 9 · (m + 4)(m − 4) = m² − 16." },
          atencao: "Erro mais comum da prova: (a + b)² = a² + b². **Falta o 2ab!** Teste: (2 + 3)² = 25, e 2² + 3² = 13."
        },
        {
          h: "5. Fatoração (o caminho de volta)",
          lista: [
            "Fator comum em evidência: 6x² + 9x = **3x(2x + 3)**.",
            "Diferença de quadrados: x² − 49 = **(x + 7)(x − 7)**.",
            "Trinômio quadrado perfeito: x² + 6x + 9 = **(x + 3)²**."
          ]
        }
      ],
      revisao: [
        "Valor numérico: substitui com parênteses.",
        "Só soma termos semelhantes (mesma parte literal).",
        "(a+b)² = a²+2ab+b²; (a−b)² = a²−2ab+b²; (a+b)(a−b) = a²−b².",
        "Fatorar é desfazer a multiplicação."
      ]
    },
    // ------------------------------------------------------------------
    {
      titulo: "Probabilidade e estatística (média, mediana e moda)",
      av: "AV3",
      intro: "A estatística organiza e resume dados; a probabilidade mede a chance de algo acontecer.",
      secoes: [
        {
          h: "1. Média aritmética",
          p: ["Soma todos os valores e divide pela quantidade de valores."],
          exercicio: {
            enunciado: "Notas: 6, 8, 7, 9 e 5. Qual a média?",
            passos: ["Soma: 6 + 8 + 7 + 9 + 5 = 35.", "Quantidade: 5.", "35 ÷ 5 = 7."],
            resposta: "Média = 7."
          },
          exemplo: {
            titulo: "Média ponderada",
            texto: "Quando os valores têm pesos diferentes. Prova (peso 2) nota 8 e trabalho (peso 1) nota 5: (8·2 + 5·1) ÷ (2 + 1) = 21 ÷ 3 = **7**."
          }
        },
        {
          h: "2. Mediana",
          p: ["É o valor **do meio** depois de colocar os dados **em ordem**."],
          lista: [
            "Quantidade ímpar: é o termo central. 3, 5, **7**, 8, 10 → mediana 7.",
            "Quantidade par: é a média dos dois centrais. 2, 4, **6, 8**, 9, 11 → (6 + 8) ÷ 2 = **7**."
          ],
          atencao: "Esquecer de **ordenar** os dados é o erro mais comum na mediana."
        },
        {
          h: "3. Moda",
          p: ["É o valor que **mais se repete**. Pode não existir (todos aparecem igual) ou haver mais de uma (bimodal)."],
          exemplo: { titulo: "Exemplo", texto: "Tamanhos de tênis vendidos: 37, 38, 38, 39, 38, 40 → moda = **38**." }
        },
        {
          h: "4. Probabilidade",
          p: ["**P = casos favoráveis ÷ casos possíveis**. O resultado fica entre 0 (impossível) e 1 (certo), e pode ser escrito em fração, decimal ou porcentagem."],
          exercicio: [
            {
              enunciado: "Ao lançar um dado comum, qual a probabilidade de sair um número maior que 4?",
              passos: ["Possíveis: 1, 2, 3, 4, 5, 6 → 6 casos.", "Favoráveis: 5 e 6 → 2 casos.", "P = 2/6 = 1/3."],
              resposta: "1/3 ≈ 33,3%."
            },
            {
              enunciado: "Numa urna há 3 bolas vermelhas, 5 azuis e 2 verdes. Qual a chance de sortear uma azul?",
              passos: ["Total: 10 bolas.", "Favoráveis: 5.", "P = 5/10 = 1/2."],
              resposta: "50%."
            }
          ],
          atencao: "Probabilidade de **não** acontecer = 1 − P. Se a chance de chover é 30%, a de não chover é 70%."
        },
        {
          h: "5. Gráficos",
          lista: [
            "**Colunas/barras**: comparar quantidades entre categorias.",
            "**Setores (pizza)**: partes de um todo (porcentagens). 25% = 90° do círculo.",
            "**Linhas**: mostrar evolução ao longo do tempo."
          ]
        }
      ],
      revisao: [
        "Média = soma ÷ quantidade (ponderada: com pesos).",
        "Mediana = valor do meio com os dados EM ORDEM.",
        "Moda = valor mais frequente.",
        "P = favoráveis ÷ possíveis; P(não) = 1 − P."
      ]
    }
  ],
  quiz: [
    { pergunta: "Quantos eixos de simetria tem um quadrado?", alternativas: ["2", "4", "1", "Infinitos"], correta: 1, explicacao: "Duas diagonais e duas retas pelos pontos médios dos lados." },
    { pergunta: "O ponto A(3, 2) refletido em relação ao eixo y fica em:", alternativas: ["(3, −2)", "(−3, 2)", "(−3, −2)", "(2, 3)"], correta: 1, explicacao: "Na reflexão no eixo y, o x troca de sinal." },
    { pergunta: "Um hexágono regular coincide consigo mesmo a cada rotação de:", alternativas: ["45°", "60°", "90°", "120°"], correta: 1, explicacao: "360° ÷ 6 = 60°." },
    { pergunta: "Qual transformação muda o tamanho da figura?", alternativas: ["Reflexão", "Rotação", "Translação", "Homotetia (ampliação/redução)"], correta: 3, explicacao: "As outras três são isometrias: mantêm o tamanho." },
    { pergunta: "Triângulos com lados 3, 4, 5 e 6, 8, 10 são semelhantes pelo caso:", alternativas: ["AA", "LAL", "LLL", "Não são semelhantes"], correta: 2, explicacao: "Os três lados são proporcionais (razão 2)." },
    { pergunta: "Dois triângulos semelhantes têm razão k = 3. Se a área do menor é 5 cm², a do maior é:", alternativas: ["15 cm²", "45 cm²", "8 cm²", "25 cm²"], correta: 1, explicacao: "As áreas ficam na razão k² = 9: 5 × 9 = 45." },
    { pergunta: "Um prédio faz sombra de 15 m; uma vara de 2 m faz sombra de 3 m. A altura do prédio é:", alternativas: ["10 m", "22,5 m", "9 m", "30 m"], correta: 0, explicacao: "h/15 = 2/3 → 3h = 30 → h = 10 m." },
    { pergunta: "A área de um trapézio de bases 10 e 6 e altura 4 é:", alternativas: ["64", "32", "40", "24"], correta: 1, explicacao: "(10 + 6) × 4 ÷ 2 = 32." },
    { pergunta: "O comprimento de uma circunferência de raio 10 cm (π = 3,14) é:", alternativas: ["31,4 cm", "62,8 cm", "314 cm", "100 cm"], correta: 1, explicacao: "C = 2πr = 2 × 3,14 × 10 = 62,8 cm." },
    { pergunta: "A área de um círculo de diâmetro 10 cm (π = 3,14) é:", alternativas: ["314 cm²", "78,5 cm²", "31,4 cm²", "157 cm²"], correta: 1, explicacao: "Raio = 5. A = 3,14 × 25 = 78,5 cm²." },
    { pergunta: "Num poliedro com 6 vértices e 9 arestas, o número de faces é:", alternativas: ["3", "4", "5", "6"], correta: 2, explicacao: "Euler: 6 − 9 + F = 2 → F = 5 (é um prisma triangular)." },
    { pergunta: "O volume de um cilindro de raio 2 cm e altura 5 cm (π = 3,14) é:", alternativas: ["62,8 cm³", "31,4 cm³", "20,9 cm³", "125,6 cm³"], correta: 0, explicacao: "π · r² · h = 3,14 × 4 × 5 = 62,8 cm³." },
    { pergunta: "Girando um triângulo retângulo em torno de um cateto, forma-se:", alternativas: ["Cilindro", "Cone", "Esfera", "Pirâmide"], correta: 1, explicacao: "O cateto vira o eixo e a hipotenusa forma a superfície lateral do cone." },
    { pergunta: "A sequência com a₁ = 2 e aₙ = aₙ₋₁ × 3 é:", alternativas: ["Não recursiva", "Recursiva", "Constante", "Aritmética"], correta: 1, explicacao: "Cada termo depende do anterior: 2, 6, 18, 54..." },
    { pergunta: "O termo geral da sequência 7, 11, 15, 19, ... é:", alternativas: ["aₙ = 4n + 3", "aₙ = 7n", "aₙ = 4n + 7", "aₙ = n + 4"], correta: 0, explicacao: "Aumenta 4; ajuste = 7 − 4 = 3. Confira: n = 1 → 7 ✓." },
    { pergunta: "0,00072 em notação científica é:", alternativas: ["72 × 10⁻⁵", "7,2 × 10⁻⁴", "7,2 × 10⁴", "0,72 × 10⁻³"], correta: 1, explicacao: "A vírgula anda 4 casas para a direita: expoente −4, e 7,2 está entre 1 e 10." },
    { pergunta: "(3 × 10⁴) · (2 × 10⁵) =", alternativas: ["6 × 10²⁰", "6 × 10⁹", "5 × 10⁹", "6 × 10¹"], correta: 1, explicacao: "Multiplica 3 × 2 = 6 e soma os expoentes 4 + 5 = 9." },
    { pergunta: "6 operários fazem uma obra em 10 dias. 12 operários fariam em:", alternativas: ["20 dias", "5 dias", "12 dias", "8 dias"], correta: 1, explicacao: "Inversamente proporcional: o dobro de operários, metade do tempo." },
    { pergunta: "(x + 4)² é igual a:", alternativas: ["x² + 16", "x² + 8x + 16", "x² + 4x + 16", "2x + 8"], correta: 1, explicacao: "Quadrado do 1º + 2·1º·2º + quadrado do 2º." },
    { pergunta: "O valor de 2a² − b para a = −3 e b = 4 é:", alternativas: ["14", "−22", "22", "−14"], correta: 0, explicacao: "2 × 9 − 4 = 18 − 4 = 14 (lembre que (−3)² = 9)." },
    { pergunta: "A mediana de 9, 2, 7, 4, 5 é:", alternativas: ["7", "5", "4", "5,4"], correta: 1, explicacao: "Em ordem: 2, 4, 5, 7, 9. O do meio é 5." },
    { pergunta: "Qual a probabilidade de tirar um número par em um dado comum?", alternativas: ["1/6", "1/3", "1/2", "2/3"], correta: 2, explicacao: "Pares: 2, 4, 6 → 3 de 6 = 1/2." }
  ],
  flashcards: [
    { frente: "Isometrias", verso: "Reflexão, rotação e translação: mudam a posição, mantêm forma e tamanho." },
    { frente: "Eixos de simetria de um polígono regular de n lados", verso: "n eixos." },
    { frente: "Casos de semelhança de triângulos", verso: "AA, LAL (ângulo entre os lados) e LLL." },
    { frente: "Razão k entre lados → razão entre áreas?", verso: "k²." },
    { frente: "Comprimento da circunferência", verso: "C = 2πr (ou πd)." },
    { frente: "Área do círculo", verso: "A = πr²." },
    { frente: "Área do trapézio", verso: "(B + b) · h ÷ 2." },
    { frente: "Relação de Euler", verso: "V − A + F = 2." },
    { frente: "Volume de prisma e cilindro", verso: "Área da base × altura." },
    { frente: "Volume de pirâmide e cone", verso: "(Área da base × altura) ÷ 3." },
    { frente: "Volume da esfera", verso: "4πr³ ÷ 3." },
    { frente: "Sequência recursiva", verso: "Cada termo é calculado a partir do anterior." },
    { frente: "Sequência não recursiva", verso: "Termo calculado direto pela posição n (termo geral)." },
    { frente: "Notação científica", verso: "a × 10ⁿ, com 1 ≤ a < 10." },
    { frente: "(a + b)²", verso: "a² + 2ab + b²." },
    { frente: "(a + b)(a − b)", verso: "a² − b²." },
    { frente: "Mediana", verso: "Valor central dos dados EM ORDEM." },
    { frente: "Moda", verso: "Valor que mais se repete." },
    { frente: "Probabilidade", verso: "Casos favoráveis ÷ casos possíveis." },
    { frente: "1 m³ equivale a…", verso: "1000 litros (e 1 dm³ = 1 L)." }
  ]
});
