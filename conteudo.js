// Conteúdo de estudo do 8º ano – AP3 (3º trimestre, 2026), dividido por matéria.
// Baseado nos "Objetos de conhecimento para avaliação parcial" do CEI.
// Cada matéria tem: resumos (textos curtos), quiz (múltipla escolha) e flashcards.
// "correta" no quiz é o índice da alternativa certa (começa em 0).

const MATERIAS = [
  // ===================================================================
  {
    id: "matematica",
    nome: "Matemática",
    icone: "📐",
    prova: "Geometria · Cap. 2, 4 e 6",
    resumos: [
      {
        titulo: "Ângulos: definição e classificação",
        texto: "Ângulo é a abertura formada por duas semirretas com a mesma origem (o vértice). É medido em graus (°).",
        pontos: [
          "Agudo: menor que 90°",
          "Reto: exatamente 90°",
          "Obtuso: entre 90° e 180°",
          "Raso: 180° (meia volta) · Completo: 360°",
          "Complementares: somam 90° · Suplementares: somam 180°",
          "Opostos pelo vértice: são sempre iguais"
        ]
      },
      {
        titulo: "Polígonos regulares",
        texto: "Polígono regular tem todos os lados iguais e todos os ângulos iguais (ex.: triângulo equilátero, quadrado, hexágono regular).",
        pontos: [
          "Soma dos ângulos internos: S = (n − 2) · 180°",
          "Cada ângulo interno (regular): (n − 2) · 180° ÷ n",
          "Cada ângulo externo (regular): 360° ÷ n",
          "Número de diagonais: d = n · (n − 3) ÷ 2",
          "Ex.: hexágono → soma 720°, cada ângulo 120°"
        ]
      },
      {
        titulo: "Mediatriz e bissetriz (lugares geométricos)",
        texto: "Lugar geométrico é o conjunto de todos os pontos que têm uma mesma propriedade.",
        pontos: [
          "Mediatriz: reta perpendicular a um segmento passando pelo seu ponto médio",
          "Todo ponto da mediatriz está à MESMA DISTÂNCIA das duas pontas do segmento",
          "Bissetriz: semirreta que divide um ângulo em duas partes iguais",
          "Todo ponto da bissetriz está à MESMA DISTÂNCIA dos dois lados do ângulo"
        ]
      },
      {
        titulo: "Paralelas cortadas por uma transversal",
        texto: "Quando duas retas paralelas são cortadas por uma transversal, formam-se 8 ângulos. Só existem DOIS valores: os agudos são todos iguais entre si, os obtusos também, e um agudo + um obtuso = 180°.",
        pontos: [
          "Correspondentes: mesma posição em cada cruzamento → iguais",
          "Alternos internos (entre as paralelas, lados opostos) → iguais",
          "Alternos externos (fora das paralelas, lados opostos) → iguais",
          "Colaterais internos/externos (mesmo lado) → suplementares (somam 180°)"
        ]
      },
      {
        titulo: "Triângulos: classificação e propriedades",
        texto: "A soma dos ângulos internos de qualquer triângulo é 180°. O triângulo é a única figura RÍGIDA: não muda de forma sem mudar os lados — por isso aparece em pontes, telhados e torres.",
        pontos: [
          "Pelos lados: equilátero (3 iguais), isósceles (2 iguais), escaleno (todos diferentes)",
          "Pelos ângulos: acutângulo (3 agudos), retângulo (1 reto), obtusângulo (1 obtuso)",
          "Ângulo externo = soma dos dois internos não adjacentes a ele",
          "Isósceles: os ângulos da base são iguais"
        ]
      },
      {
        titulo: "Congruência de triângulos",
        texto: "Dois triângulos são congruentes quando têm lados e ângulos correspondentes iguais (são 'cópias'). Basta verificar um dos casos:",
        pontos: [
          "LLL: três lados iguais",
          "LAL: dois lados e o ângulo ENTRE eles",
          "ALA: dois ângulos e o lado ENTRE eles",
          "LAAo: um lado, um ângulo adjacente e o ângulo oposto ao lado",
          "Atenção: AAA NÃO garante congruência (só semelhança)"
        ]
      },
      {
        titulo: "Quadriláteros e paralelogramos",
        texto: "A soma dos ângulos internos de qualquer quadrilátero é 360°. Paralelogramo é o quadrilátero com os dois pares de lados opostos paralelos.",
        pontos: [
          "Paralelogramo: lados opostos iguais, ângulos opostos iguais, ângulos consecutivos somam 180°",
          "Paralelogramo: as diagonais se cortam no ponto médio",
          "Retângulo: 4 ângulos retos e diagonais iguais",
          "Losango: 4 lados iguais e diagonais perpendiculares",
          "Quadrado: é retângulo e losango ao mesmo tempo",
          "Trapézio: só um par de lados paralelos (não é paralelogramo)"
        ]
      },
      {
        titulo: "Áreas",
        texto: "Área é a medida da superfície, em unidades ao quadrado (cm², m²...).",
        pontos: [
          "Quadrado: A = l²",
          "Retângulo e paralelogramo: A = b · h",
          "Triângulo: A = (b · h) ÷ 2",
          "Trapézio: A = (B + b) · h ÷ 2",
          "Losango: A = (D · d) ÷ 2",
          "Círculo: A = π · r² (π ≈ 3,14)"
        ]
      }
    ],
    quiz: [
      {
        pergunta: "Um ângulo de 135° é classificado como:",
        alternativas: ["Agudo", "Reto", "Obtuso", "Raso"],
        correta: 2,
        explicacao: "Está entre 90° e 180°, então é obtuso."
      },
      {
        pergunta: "Qual é o complemento de um ângulo de 35°?",
        alternativas: ["55°", "65°", "145°", "35°"],
        correta: 0,
        explicacao: "Complementares somam 90°: 90° − 35° = 55°."
      },
      {
        pergunta: "Qual é o suplemento de um ângulo de 110°?",
        alternativas: ["20°", "70°", "80°", "250°"],
        correta: 1,
        explicacao: "Suplementares somam 180°: 180° − 110° = 70°."
      },
      {
        pergunta: "Quanto mede cada ângulo interno de um hexágono regular?",
        alternativas: ["108°", "120°", "135°", "90°"],
        correta: 1,
        explicacao: "Soma = (6 − 2) · 180° = 720°. Dividindo por 6 lados: 720° ÷ 6 = 120°."
      },
      {
        pergunta: "Quanto mede cada ângulo externo de um pentágono regular?",
        alternativas: ["60°", "72°", "108°", "90°"],
        correta: 1,
        explicacao: "Ângulo externo de polígono regular = 360° ÷ n = 360° ÷ 5 = 72°."
      },
      {
        pergunta: "Qual é a soma dos ângulos internos de um octógono (8 lados)?",
        alternativas: ["900°", "1080°", "1440°", "720°"],
        correta: 1,
        explicacao: "S = (8 − 2) · 180° = 6 · 180° = 1080°."
      },
      {
        pergunta: "Todo ponto da mediatriz de um segmento AB:",
        alternativas: [
          "Está mais perto de A do que de B",
          "Está à mesma distância de A e de B",
          "Divide o ângulo ao meio",
          "Fica fora do segmento"
        ],
        correta: 1,
        explicacao: "A mediatriz é o lugar geométrico dos pontos equidistantes das extremidades do segmento."
      },
      {
        pergunta: "A bissetriz de um ângulo é o lugar geométrico dos pontos que:",
        alternativas: [
          "Estão à mesma distância dos dois lados do ângulo",
          "Estão à mesma distância do vértice",
          "Formam 90° com um dos lados",
          "Estão no ponto médio de um segmento"
        ],
        correta: 0,
        explicacao: "A bissetriz divide o ângulo ao meio, e cada ponto dela é equidistante dos dois lados."
      },
      {
        pergunta: "Duas paralelas são cortadas por uma transversal. Um ângulo alterno interno mede 65°. Quanto mede o outro alterno interno?",
        alternativas: ["25°", "115°", "65°", "130°"],
        correta: 2,
        explicacao: "Ângulos alternos internos são congruentes (iguais): 65°."
      },
      {
        pergunta: "Em paralelas cortadas por transversal, dois ângulos colaterais internos são:",
        alternativas: ["Iguais", "Complementares (90°)", "Suplementares (180°)", "Opostos pelo vértice"],
        correta: 2,
        explicacao: "Colaterais ficam do mesmo lado da transversal e somam 180°."
      },
      {
        pergunta: "Um triângulo tem ângulos de 50° e 60°. Quanto mede o terceiro ângulo?",
        alternativas: ["70°", "80°", "90°", "110°"],
        correta: 0,
        explicacao: "A soma é 180°: 180° − 50° − 60° = 70°."
      },
      {
        pergunta: "Um triângulo com três lados de medidas diferentes é:",
        alternativas: ["Equilátero", "Isósceles", "Escaleno", "Retângulo"],
        correta: 2,
        explicacao: "Escaleno = todos os lados diferentes."
      },
      {
        pergunta: "Qual destes casos NÃO garante que dois triângulos são congruentes?",
        alternativas: ["LLL", "LAL", "ALA", "AAA"],
        correta: 3,
        explicacao: "Com três ângulos iguais os triângulos têm a mesma forma, mas podem ter tamanhos diferentes."
      },
      {
        pergunta: "Por que o triângulo é muito usado em estruturas como telhados e pontes?",
        alternativas: [
          "Porque tem a maior área",
          "Porque é uma figura rígida",
          "Porque tem lados paralelos",
          "Porque seus ângulos somam 360°"
        ],
        correta: 1,
        explicacao: "Fixados os três lados, o triângulo não muda de forma — é rígido."
      },
      {
        pergunta: "Em um triângulo, os ângulos internos A = 40° e B = 70°. O ângulo externo junto ao vértice C mede:",
        alternativas: ["70°", "110°", "40°", "180°"],
        correta: 1,
        explicacao: "Ângulo externo = soma dos dois internos não adjacentes: 40° + 70° = 110°."
      },
      {
        pergunta: "Em um paralelogramo, um ângulo mede 60°. O ângulo consecutivo a ele mede:",
        alternativas: ["60°", "90°", "120°", "300°"],
        correta: 2,
        explicacao: "Ângulos consecutivos do paralelogramo são suplementares: 180° − 60° = 120°."
      },
      {
        pergunta: "Qual quadrilátero tem as diagonais perpendiculares e os 4 lados iguais, mas não precisa ter ângulos retos?",
        alternativas: ["Retângulo", "Losango", "Trapézio", "Paralelogramo comum"],
        correta: 1,
        explicacao: "O losango tem 4 lados iguais e diagonais perpendiculares."
      },
      {
        pergunta: "Qual é a área de um triângulo de base 10 cm e altura 6 cm?",
        alternativas: ["60 cm²", "30 cm²", "16 cm²", "32 cm²"],
        correta: 1,
        explicacao: "A = (b · h) ÷ 2 = (10 · 6) ÷ 2 = 30 cm²."
      },
      {
        pergunta: "Um trapézio tem base maior 10 m, base menor 6 m e altura 4 m. Sua área é:",
        alternativas: ["32 m²", "64 m²", "40 m²", "24 m²"],
        correta: 0,
        explicacao: "A = (B + b) · h ÷ 2 = (10 + 6) · 4 ÷ 2 = 32 m²."
      },
      {
        pergunta: "Qual é a área aproximada de um círculo de raio 3 cm? (use π = 3,14)",
        alternativas: ["18,84 cm²", "9,42 cm²", "28,26 cm²", "37,68 cm²"],
        correta: 2,
        explicacao: "A = π · r² = 3,14 · 9 = 28,26 cm². (18,84 é o comprimento da circunferência!)"
      },
      {
        pergunta: "Um losango tem diagonais de 10 cm e 6 cm. Sua área é:",
        alternativas: ["60 cm²", "30 cm²", "16 cm²", "15 cm²"],
        correta: 1,
        explicacao: "A = (D · d) ÷ 2 = (10 · 6) ÷ 2 = 30 cm²."
      }
    ],
    flashcards: [
      { frente: "Ângulos complementares somam…", verso: "90°" },
      { frente: "Ângulos suplementares somam…", verso: "180°" },
      { frente: "Fórmula da soma dos ângulos internos de um polígono", verso: "S = (n − 2) · 180°" },
      { frente: "Ângulo externo de um polígono regular", verso: "360° ÷ n" },
      { frente: "O que é mediatriz?", verso: "Reta perpendicular ao segmento pelo ponto médio; seus pontos são equidistantes das extremidades." },
      { frente: "O que é bissetriz?", verso: "Semirreta que divide o ângulo ao meio; seus pontos são equidistantes dos lados." },
      { frente: "Paralelas + transversal: alternos internos são…", verso: "Iguais (congruentes)" },
      { frente: "Paralelas + transversal: colaterais internos são…", verso: "Suplementares (somam 180°)" },
      { frente: "Soma dos ângulos internos do triângulo", verso: "180°" },
      { frente: "Soma dos ângulos internos do quadrilátero", verso: "360°" },
      { frente: "Casos de congruência de triângulos", verso: "LLL, LAL, ALA e LAAo" },
      { frente: "Triângulo isósceles", verso: "Dois lados iguais (e os ângulos da base iguais)" },
      { frente: "Propriedade das diagonais do paralelogramo", verso: "Cortam-se no ponto médio" },
      { frente: "Área do trapézio", verso: "(B + b) · h ÷ 2" },
      { frente: "Área do círculo", verso: "π · r²" }
    ]
  },

  // ===================================================================
  {
    id: "portugues",
    nome: "Língua Portuguesa",
    icone: "📖",
    prova: "Crônica · O Médico e o Monstro · Pontuação · Conjunções · Porquês",
    resumos: [
      {
        titulo: "Crônica argumentativa",
        texto: "A crônica é um texto curto, publicado em jornais, revistas ou sites, que parte de um fato do cotidiano. Na crônica argumentativa, o autor usa esse fato para DEFENDER UMA OPINIÃO, com argumentos, mas em linguagem leve, próxima da conversa.",
        pontos: [
          "Parte de um acontecimento do dia a dia",
          "Apresenta o ponto de vista do autor (opinião + argumentos)",
          "Linguagem simples, muitas vezes em 1ª pessoa, com humor ou ironia",
          "Texto curto, com título e reflexão final",
          "Diferença do artigo de opinião: a crônica é mais pessoal e literária"
        ]
      },
      {
        titulo: "O Médico e o Monstro (R. L. Stevenson)",
        texto: "Publicado em 1886, na Londres vitoriana. O respeitado Dr. Henry Jekyll cria uma poção que o transforma em Edward Hyde, a encarnação do seu lado mau. A história é contada a partir da investigação do advogado Utterson, amigo de Jekyll.",
        pontos: [
          "Tema central: a DUALIDADE do ser humano (bem x mal dentro da mesma pessoa)",
          "Jekyll: médico respeitado · Hyde: baixo, de aparência repulsiva, violento",
          "Utterson: advogado que investiga a ligação entre os dois",
          "Dr. Lanyon: médico amigo que vê a transformação e morre de choque",
          "Poole: o mordomo de Jekyll",
          "Hyde mata Sir Danvers Carew; com o tempo Jekyll se transforma sem tomar a poção e perde o controle",
          "A verdade é revelada no final pela confissão escrita de Jekyll"
        ]
      },
      {
        titulo: "Frase, oração e período",
        texto: "Três conceitos que caem juntos:",
        pontos: [
          "Frase: enunciado com sentido completo, com ou sem verbo (\"Silêncio!\")",
          "Oração: enunciado organizado em torno de um verbo",
          "Período: frase formada por uma ou mais orações",
          "Período simples: 1 oração (1 verbo) · Período composto: 2 ou mais orações",
          "Dica: conte os verbos (locução verbal conta como 1)"
        ]
      },
      {
        titulo: "Coordenação x subordinação",
        texto: "No período composto, as orações se ligam de dois jeitos:",
        pontos: [
          "Coordenação: orações independentes, cada uma tem sentido sozinha (\"Estudei, mas não passei.\")",
          "Subordinação: uma oração depende da outra (oração principal + subordinada) (\"Disse que viria.\")"
        ]
      },
      {
        titulo: "Conjunções coordenativas",
        texto: "Ligam orações independentes:",
        pontos: [
          "Aditivas (soma): e, nem, não só… mas também",
          "Adversativas (oposição): mas, porém, contudo, todavia, entretanto, no entanto",
          "Alternativas (escolha): ou… ou, ora… ora, quer… quer",
          "Conclusivas (conclusão): logo, portanto, por isso, então, pois (depois do verbo)",
          "Explicativas (explicação): porque, que, pois (antes do verbo)"
        ]
      },
      {
        titulo: "Conjunções subordinativas",
        texto: "Ligam a oração subordinada à principal:",
        pontos: [
          "Causais: porque, como, já que, visto que",
          "Concessivas: embora, ainda que, mesmo que",
          "Condicionais: se, caso, desde que",
          "Temporais: quando, enquanto, assim que, logo que",
          "Finais: para que, a fim de que",
          "Consecutivas: tão… que, tanto… que",
          "Conformativas: conforme, segundo, como",
          "Comparativas: como, (mais) do que",
          "Proporcionais: à medida que, à proporção que",
          "Integrantes: que, se (\"Espero QUE você venha.\")"
        ]
      },
      {
        titulo: "Vírgula no período simples",
        texto: "Regra de ouro: NÃO se separa com vírgula o sujeito do verbo, nem o verbo do seu complemento.",
        pontos: [
          "USA vírgula: para separar itens de uma enumeração",
          "USA: para isolar vocativo (\"Maria, venha aqui.\")",
          "USA: para isolar aposto (\"Stevenson, escritor escocês, escreveu o livro.\")",
          "USA: com adjunto adverbial deslocado (\"No sábado, fomos ao cinema.\")",
          "USA: para isolar expressões explicativas (isto é, ou seja, por exemplo)",
          "USA: entre lugar e data (\"Salvador, 10 de outubro de 2026.\")",
          "NÃO USA: \"O menino, comeu o bolo.\" ❌"
        ]
      },
      {
        titulo: "Vírgula no período composto",
        texto: "Entre orações:",
        pontos: [
          "Antes de orações coordenadas adversativas, conclusivas e explicativas (\"Estudou, mas esqueceu.\")",
          "Antes do 'e' quando os sujeitos são diferentes (\"Eu li, e ela escreveu.\")",
          "Oração subordinada adverbial antes da principal (\"Quando chegou, todos aplaudiram.\")",
          "Orações adjetivas explicativas ficam entre vírgulas (\"O homem, que é mortal, erra.\")",
          "Orações adjetivas restritivas NÃO têm vírgula (\"Os alunos que estudaram passaram.\")"
        ]
      },
      {
        titulo: "Uso dos porquês",
        texto: "Quatro formas, quatro usos:",
        pontos: [
          "POR QUE (separado, sem acento): perguntas → \"Por que você faltou?\" · também = 'pelo qual'",
          "POR QUÊ (separado, com acento): no final da frase → \"Você faltou por quê?\"",
          "PORQUE (junto, sem acento): explicação/resposta → \"Faltei porque estava doente.\"",
          "PORQUÊ (junto, com acento): substantivo, vem com artigo → \"Não sei o porquê da falta.\""
        ]
      }
    ],
    quiz: [
      {
        pergunta: "O que caracteriza a crônica argumentativa?",
        alternativas: [
          "Narra uma longa aventura com muitos personagens",
          "Parte de um fato do cotidiano para defender uma opinião, em linguagem leve",
          "Apresenta apenas dados científicos, sem opinião",
          "É escrita sempre em versos"
        ],
        correta: 1,
        explicacao: "A crônica argumentativa usa um fato do dia a dia como ponto de partida para o autor defender seu ponto de vista."
      },
      {
        pergunta: "Qual é o tema central de \"O Médico e o Monstro\"?",
        alternativas: [
          "A vida no campo",
          "A dualidade entre o bem e o mal no ser humano",
          "Uma viagem ao fundo do mar",
          "Uma história de amor impossível"
        ],
        correta: 1,
        explicacao: "Jekyll e Hyde são a mesma pessoa: o livro mostra que bem e mal convivem dentro de nós."
      },
      {
        pergunta: "Quem investiga a relação entre Jekyll e Hyde ao longo da história?",
        alternativas: ["Dr. Lanyon", "Poole, o mordomo", "Utterson, o advogado", "Sir Danvers Carew"],
        correta: 2,
        explicacao: "O advogado Gabriel John Utterson, amigo de Jekyll, conduz a investigação."
      },
      {
        pergunta: "O que transforma Dr. Jekyll em Mr. Hyde?",
        alternativas: ["Uma maldição", "Uma poção criada por ele", "A lua cheia", "Um acidente de laboratório com animais"],
        correta: 1,
        explicacao: "Jekyll cria uma poção para separar seu lado mau — e assim nasce Hyde."
      },
      {
        pergunta: "Quantas orações há em \"Cheguei, tomei banho e dormi\"?",
        alternativas: ["1", "2", "3", "Nenhuma"],
        correta: 2,
        explicacao: "São 3 verbos (cheguei, tomei, dormi) → 3 orações → período composto."
      },
      {
        pergunta: "\"Fogo!\" é:",
        alternativas: ["Uma oração", "Uma frase sem verbo (frase nominal)", "Um período composto", "Uma conjunção"],
        correta: 1,
        explicacao: "Tem sentido completo, mas não tem verbo: é frase, não oração."
      },
      {
        pergunta: "Em \"Estudei muito, mas não fui bem na prova\", a conjunção \"mas\" é:",
        alternativas: ["Aditiva", "Adversativa", "Conclusiva", "Explicativa"],
        correta: 1,
        explicacao: "\"Mas\" indica oposição → coordenativa adversativa."
      },
      {
        pergunta: "Em \"Choveu muito; portanto, o jogo foi cancelado\", a ideia expressa por \"portanto\" é de:",
        alternativas: ["Conclusão", "Oposição", "Condição", "Tempo"],
        correta: 0,
        explicacao: "\"Portanto\" introduz uma conclusão → coordenativa conclusiva."
      },
      {
        pergunta: "Em \"Embora estivesse cansado, foi ao treino\", a conjunção \"embora\" é:",
        alternativas: ["Causal", "Condicional", "Concessiva", "Temporal"],
        correta: 2,
        explicacao: "\"Embora\" indica uma concessão (algo que poderia impedir, mas não impede)."
      },
      {
        pergunta: "Em \"Se você estudar, vai passar\", a conjunção \"se\" indica:",
        alternativas: ["Causa", "Condição", "Finalidade", "Comparação"],
        correta: 1,
        explicacao: "\"Se\" aqui é subordinativa condicional."
      },
      {
        pergunta: "Qual período é formado por COORDENAÇÃO?",
        alternativas: [
          "Espero que você venha.",
          "Quando cheguei, ela saiu.",
          "Li o livro e assisti ao filme.",
          "Disse que estava doente."
        ],
        correta: 2,
        explicacao: "\"Li o livro\" e \"assisti ao filme\" têm sentido sozinhas, ligadas por \"e\" (aditiva)."
      },
      {
        pergunta: "Qual frase está com a vírgula usada CORRETAMENTE?",
        alternativas: [
          "Os alunos do 8º ano, fizeram a prova.",
          "No domingo, visitamos a vovó.",
          "Pedro comprou, um livro novo.",
          "A professora explicou, a matéria."
        ],
        correta: 1,
        explicacao: "Adjunto adverbial deslocado (\"No domingo\") leva vírgula. Nas outras, a vírgula separa sujeito do verbo ou verbo do complemento — erro!"
      },
      {
        pergunta: "Em \"João, feche a janela\", a vírgula isola:",
        alternativas: ["Um aposto", "Um vocativo", "Um adjunto adverbial", "Uma enumeração"],
        correta: 1,
        explicacao: "\"João\" é com quem se fala → vocativo, sempre separado por vírgula."
      },
      {
        pergunta: "\"Stevenson, escritor escocês, escreveu o livro.\" O trecho entre vírgulas é:",
        alternativas: ["Vocativo", "Aposto", "Sujeito", "Oração adjetiva restritiva"],
        correta: 1,
        explicacao: "\"Escritor escocês\" explica quem é Stevenson → aposto, entre vírgulas."
      },
      {
        pergunta: "Complete: \"_____ você chegou atrasado?\"",
        alternativas: ["Porque", "Por quê", "Por que", "Porquê"],
        correta: 2,
        explicacao: "Pergunta no início da frase → \"por que\" (separado, sem acento)."
      },
      {
        pergunta: "Complete: \"Você não veio _____?\"",
        alternativas: ["por que", "por quê", "porque", "porquê"],
        correta: 1,
        explicacao: "No final da frase → \"por quê\" (separado, com acento)."
      },
      {
        pergunta: "Complete: \"Não entendi o _____ da sua decisão.\"",
        alternativas: ["por que", "por quê", "porque", "porquê"],
        correta: 3,
        explicacao: "Com artigo (\"o\"), é substantivo → \"porquê\" (junto, com acento)."
      },
      {
        pergunta: "Complete: \"Faltei _____ estava doente.\"",
        alternativas: ["por que", "por quê", "porque", "porquê"],
        correta: 2,
        explicacao: "Explicação/causa → \"porque\" (junto, sem acento)."
      }
    ],
    flashcards: [
      { frente: "Crônica argumentativa", verso: "Texto curto que parte de um fato do cotidiano para defender uma opinião, em linguagem leve." },
      { frente: "Autor e ano de \"O Médico e o Monstro\"", verso: "Robert Louis Stevenson, 1886." },
      { frente: "Quem é Utterson?", verso: "O advogado amigo de Jekyll que investiga o mistério." },
      { frente: "Quem é Dr. Lanyon?", verso: "Médico amigo de Jekyll que presencia a transformação e morre de choque." },
      { frente: "Tema central do livro", verso: "A dualidade do ser humano: bem e mal na mesma pessoa." },
      { frente: "Diferença entre frase e oração", verso: "Frase: sentido completo (com ou sem verbo). Oração: tem verbo." },
      { frente: "Período simples x composto", verso: "Simples: 1 oração. Composto: 2 ou mais orações." },
      { frente: "Coordenação", verso: "Orações independentes (cada uma tem sentido sozinha)." },
      { frente: "Subordinação", verso: "Uma oração depende da outra (principal + subordinada)." },
      { frente: "Conjunções adversativas", verso: "mas, porém, contudo, todavia, entretanto, no entanto" },
      { frente: "Conjunções conclusivas", verso: "logo, portanto, por isso, então, pois (depois do verbo)" },
      { frente: "Conjunções concessivas", verso: "embora, ainda que, mesmo que" },
      { frente: "Quando NÃO usar vírgula?", verso: "Entre sujeito e verbo, e entre verbo e complemento." },
      { frente: "Por que (separado, sem acento)", verso: "Perguntas: \"Por que você faltou?\"" },
      { frente: "Por quê (separado, com acento)", verso: "Final de frase: \"Faltou por quê?\"" },
      { frente: "Porque (junto, sem acento)", verso: "Explicação: \"Faltei porque estava doente.\"" },
      { frente: "Porquê (junto, com acento)", verso: "Substantivo: \"o porquê\"." }
    ]
  },

  // ===================================================================
  {
    id: "ciencias",
    nome: "Ciências",
    icone: "⚡",
    prova: "Cap. 9 Fontes de energia · Cap. 7 Eletricidade",
    resumos: [
      {
        titulo: "Como a energia elétrica chega até nós",
        texto: "A energia é produzida nas usinas, geralmente longe das cidades, e percorre um caminho até as casas:",
        pontos: [
          "1. Usina gera a energia (gerador transforma movimento em eletricidade)",
          "2. Transformador ELEVA a tensão (para perder menos energia no caminho)",
          "3. Linhas de transmissão levam a energia por longas distâncias",
          "4. Subestação REBAIXA a tensão",
          "5. Rede de distribuição (postes) leva até casas, escolas e indústrias"
        ]
      },
      {
        titulo: "Recursos renováveis e não renováveis",
        texto: "Renováveis se repõem na natureza em pouco tempo; não renováveis levam milhões de anos para se formar e podem acabar.",
        pontos: [
          "Renováveis: água (hidrelétrica), vento (eólica), Sol (solar), biomassa, calor da Terra (geotérmica), marés",
          "Não renováveis: petróleo, carvão mineral, gás natural (combustíveis fósseis) e urânio (nuclear)",
          "Atenção: renovável não quer dizer 'sem impacto ambiental'"
        ]
      },
      {
        titulo: "Hidrelétricas",
        texto: "A água represada desce com força, gira as turbinas e o gerador produz eletricidade. É a principal fonte do Brasil (ex.: Itaipu).",
        pontos: [
          "Vantagem: renovável, não queima combustível",
          "Impactos: alagamento de grandes áreas, perda de florestas, deslocamento de populações (inclusive indígenas e ribeirinhas), mudança na vida dos peixes"
        ]
      },
      {
        titulo: "Termelétricas e combustíveis fósseis",
        texto: "Queimam carvão, petróleo (óleo) ou gás natural para aquecer água; o vapor gira a turbina.",
        pontos: [
          "Vantagem: podem ser construídas perto das cidades e funcionam a qualquer hora",
          "Impactos: liberam CO₂ e outros gases → poluição do ar e aumento do efeito estufa",
          "Fonte não renovável"
        ]
      },
      {
        titulo: "Outras fontes de energia",
        texto: "Cada fonte tem vantagens e impactos:",
        pontos: [
          "Biomassa: queima de matéria orgânica (bagaço de cana, lenha). Renovável, mas emite gases",
          "Eólica: o vento gira as hélices dos aerogeradores. Limpa; impactos: ruído, paisagem, aves. Forte no Nordeste",
          "Solar: placas fotovoltaicas transformam luz em eletricidade. Limpa; depende do Sol e as placas usam minerais",
          "Geotérmica: usa o calor do interior da Terra (vapor). Comum na Islândia",
          "Das marés (maremotriz): usa o sobe e desce do mar",
          "Nuclear: fissão do urânio aquece água. Não emite CO₂, mas gera lixo radioativo e risco de acidentes (Chernobyl, Fukushima). Brasil: Angra dos Reis"
        ]
      },
      {
        titulo: "Equilíbrio ambiental e aquecimento global",
        texto: "O efeito estufa é natural e mantém a Terra aquecida. O problema é o EXCESSO de gases (CO₂, metano) liberados pela queima de combustíveis fósseis e pelo desmatamento, que intensifica o aquecimento global.",
        pontos: [
          "Consequências: derretimento de geleiras, aumento do nível do mar, eventos climáticos extremos",
          "Soluções: usar fontes renováveis, reduzir desmatamento, reflorestar, transporte público, economizar energia",
          "Acordos internacionais buscam limitar o aquecimento (ex.: Acordo de Paris, 2015)"
        ]
      },
      {
        titulo: "Cargas elétricas, condutores e isolantes",
        texto: "A matéria é formada por átomos. Prótons têm carga positiva (+), elétrons têm carga negativa (−) e nêutrons não têm carga.",
        pontos: [
          "Cargas iguais se REPELEM; cargas diferentes se ATRAEM",
          "Corpo eletrizado: ganhou ou perdeu elétrons (ganhou → negativo; perdeu → positivo)",
          "Eletrização: por atrito, por contato e por indução",
          "Condutores: deixam a eletricidade passar (metais como cobre, alumínio; água com sais; corpo humano)",
          "Isolantes: dificultam a passagem (borracha, plástico, vidro, madeira seca)"
        ]
      },
      {
        titulo: "Corrente elétrica",
        texto: "Corrente elétrica é o movimento ORDENADO de cargas elétricas (elétrons) por um condutor. Só existe corrente em um circuito FECHADO.",
        pontos: [
          "Corrente → ampère (A)",
          "Tensão (ou diferença de potencial, 'voltagem') → volt (V). É o 'empurrão' que move as cargas",
          "Resistência → ohm (Ω). É a dificuldade que o material oferece",
          "Potência → watt (W). Quanto de energia o aparelho usa por segundo",
          "Corrente contínua: pilhas e baterias · Corrente alternada: tomadas de casa"
        ]
      },
      {
        titulo: "Cuidados com instalações elétricas",
        texto: "O choque elétrico acontece quando a corrente passa pelo corpo. Prevenção:",
        pontos: [
          "Não mexer em aparelhos com mãos molhadas ou pés descalços em piso molhado",
          "Não sobrecarregar tomadas com 'T' ou 'benjamim' (risco de superaquecimento e incêndio)",
          "Desligar o disjuntor antes de mexer na instalação",
          "Disjuntores e fusíveis desligam o circuito quando a corrente é alta demais",
          "Fio terra protege contra choques em aparelhos",
          "Não soltar pipa perto da rede elétrica e não tocar em fios caídos",
          "Não puxar o aparelho da tomada pelo fio"
        ]
      }
    ],
    quiz: [
      {
        pergunta: "No caminho da energia até as casas, para que serve o transformador perto da usina?",
        alternativas: [
          "Para desligar a energia à noite",
          "Para elevar a tensão e diminuir as perdas na transmissão",
          "Para transformar energia elétrica em calor",
          "Para armazenar energia"
        ],
        correta: 1,
        explicacao: "A tensão é elevada para transportar a energia com menos perdas; depois as subestações a rebaixam."
      },
      {
        pergunta: "Qual destas fontes é NÃO renovável?",
        alternativas: ["Eólica", "Solar", "Carvão mineral", "Biomassa"],
        correta: 2,
        explicacao: "O carvão mineral é combustível fóssil: levou milhões de anos para se formar."
      },
      {
        pergunta: "Qual é a principal fonte de energia elétrica do Brasil?",
        alternativas: ["Nuclear", "Hidrelétrica", "Geotérmica", "Das marés"],
        correta: 1,
        explicacao: "O Brasil tem muitos rios caudalosos; as hidrelétricas (como Itaipu) são a principal fonte."
      },
      {
        pergunta: "Um impacto socioambiental típico da construção de hidrelétricas é:",
        alternativas: [
          "Gerar lixo radioativo",
          "Alagar grandes áreas e deslocar populações",
          "Emitir muita fumaça preta",
          "Causar ruído das hélices"
        ],
        correta: 1,
        explicacao: "A represa inunda florestas e terras, e comunidades precisam se mudar."
      },
      {
        pergunta: "Por que as termelétricas contribuem para o aquecimento global?",
        alternativas: [
          "Porque usam muita água",
          "Porque queimam combustíveis e liberam CO₂",
          "Porque produzem lixo radioativo",
          "Porque matam aves"
        ],
        correta: 1,
        explicacao: "A queima de carvão, óleo ou gás libera gases do efeito estufa, como o CO₂."
      },
      {
        pergunta: "A energia obtida da queima do bagaço da cana-de-açúcar é chamada de:",
        alternativas: ["Geotérmica", "Biomassa", "Eólica", "Nuclear"],
        correta: 1,
        explicacao: "Biomassa = energia de matéria orgânica (restos vegetais, lenha, etc.)."
      },
      {
        pergunta: "Qual fonte usa o calor do interior da Terra?",
        alternativas: ["Solar", "Maremotriz", "Geotérmica", "Hidrelétrica"],
        correta: 2,
        explicacao: "Geo = Terra, térmica = calor. Muito usada na Islândia."
      },
      {
        pergunta: "Uma desvantagem da energia nuclear é:",
        alternativas: [
          "Emitir muito CO₂",
          "Depender do vento",
          "Gerar lixo radioativo e risco de acidentes",
          "Só funcionar de dia"
        ],
        correta: 2,
        explicacao: "A nuclear quase não emite CO₂, mas o lixo radioativo e os acidentes (Chernobyl, Fukushima) são grandes problemas."
      },
      {
        pergunta: "Qual atitude ajuda a combater o aquecimento global?",
        alternativas: [
          "Aumentar o desmatamento",
          "Usar mais carros particulares",
          "Trocar combustíveis fósseis por fontes renováveis",
          "Queimar lixo a céu aberto"
        ],
        correta: 2,
        explicacao: "Fontes renováveis e limpas reduzem a emissão de gases do efeito estufa."
      },
      {
        pergunta: "Duas cargas elétricas NEGATIVAS colocadas próximas vão:",
        alternativas: ["Se atrair", "Se repelir", "Se anular", "Virar positivas"],
        correta: 1,
        explicacao: "Cargas iguais se repelem; cargas diferentes se atraem."
      },
      {
        pergunta: "Um corpo que PERDEU elétrons fica eletrizado:",
        alternativas: ["Negativamente", "Positivamente", "Neutro", "Com nêutrons a mais"],
        correta: 1,
        explicacao: "Com menos elétrons (−), sobram mais prótons (+): o corpo fica positivo."
      },
      {
        pergunta: "Qual destes materiais é um bom ISOLANTE elétrico?",
        alternativas: ["Cobre", "Alumínio", "Borracha", "Ferro"],
        correta: 2,
        explicacao: "Borracha, plástico, vidro e madeira seca são isolantes. Os metais são condutores."
      },
      {
        pergunta: "Por que os fios elétricos são de cobre e encapados com plástico?",
        alternativas: [
          "O cobre é isolante e o plástico é condutor",
          "O cobre conduz a corrente e o plástico isola, evitando choques",
          "Os dois são condutores",
          "Apenas por estética"
        ],
        correta: 1,
        explicacao: "O metal conduz a corrente; a capa isolante protege quem toca o fio."
      },
      {
        pergunta: "Corrente elétrica é:",
        alternativas: [
          "O movimento ordenado de cargas elétricas em um condutor",
          "A quantidade de água em uma usina",
          "Um tipo de isolante",
          "A força do vento"
        ],
        correta: 0,
        explicacao: "É o fluxo ordenado de elétrons, que só acontece em circuito fechado."
      },
      {
        pergunta: "A unidade de medida da TENSÃO elétrica é:",
        alternativas: ["Ampère (A)", "Volt (V)", "Watt (W)", "Ohm (Ω)"],
        correta: 1,
        explicacao: "Tensão → volt. Corrente → ampère. Potência → watt. Resistência → ohm."
      },
      {
        pergunta: "Qual dispositivo desliga o circuito automaticamente quando a corrente fica alta demais?",
        alternativas: ["Tomada", "Disjuntor", "Lâmpada", "Interruptor comum"],
        correta: 1,
        explicacao: "Disjuntores (e fusíveis) protegem a instalação contra sobrecargas e curtos-circuitos."
      },
      {
        pergunta: "Qual atitude é PERIGOSA com eletricidade?",
        alternativas: [
          "Desligar o disjuntor antes de trocar uma tomada",
          "Ligar vários aparelhos em um mesmo 'benjamim'",
          "Secar as mãos antes de usar o secador",
          "Puxar o plugue, e não o fio"
        ],
        correta: 1,
        explicacao: "Sobrecarregar uma tomada pode superaquecer os fios e causar incêndio."
      }
    ],
    flashcards: [
      { frente: "Caminho da energia elétrica", verso: "Usina → transformador (eleva) → linhas de transmissão → subestação (rebaixa) → distribuição → casas" },
      { frente: "Recurso renovável", verso: "Se repõe na natureza em pouco tempo (água, vento, Sol, biomassa)." },
      { frente: "Combustíveis fósseis", verso: "Petróleo, carvão mineral e gás natural (não renováveis)." },
      { frente: "Principal impacto das hidrelétricas", verso: "Alagamento de áreas e deslocamento de populações." },
      { frente: "Principal impacto das termelétricas", verso: "Emissão de CO₂ → poluição e efeito estufa." },
      { frente: "Energia eólica", verso: "Vem do vento (aerogeradores). Forte no Nordeste do Brasil." },
      { frente: "Energia geotérmica", verso: "Vem do calor do interior da Terra." },
      { frente: "Energia nuclear: problema", verso: "Lixo radioativo e risco de acidentes." },
      { frente: "Causa do aquecimento global", verso: "Excesso de gases do efeito estufa (queima de fósseis e desmatamento)." },
      { frente: "Cargas iguais… cargas diferentes…", verso: "Iguais se repelem; diferentes se atraem." },
      { frente: "Condutores (exemplos)", verso: "Metais (cobre, alumínio), água com sais, corpo humano." },
      { frente: "Isolantes (exemplos)", verso: "Borracha, plástico, vidro, madeira seca." },
      { frente: "Corrente elétrica", verso: "Movimento ordenado de cargas elétricas. Unidade: ampère (A)." },
      { frente: "Volt, ampère e watt medem…", verso: "Volt: tensão · Ampère: corrente · Watt: potência" },
      { frente: "Para que serve o disjuntor?", verso: "Desliga o circuito quando a corrente fica alta demais." }
    ]
  },

  // ===================================================================
  {
    id: "geografia",
    nome: "Geografia",
    icone: "🌍",
    prova: "Cap. 5 África: passado e presente · Cap. 6 Natureza e sociedades",
    resumos: [
      {
        titulo: "Neocolonialismo na África",
        texto: "No século XIX, as potências europeias dividiram a África entre si para explorar matérias-primas e mercados. Na Conferência de Berlim (1884–1885), definiram as regras dessa partilha — sem a participação dos africanos.",
        pontos: [
          "Fronteiras traçadas 'com régua', sem respeitar povos, línguas e culturas",
          "Povos rivais foram juntados e povos irmãos foram separados",
          "Principais colonizadores: Reino Unido e França (também Portugal, Bélgica, Alemanha, Itália, Espanha)",
          "Só Etiópia e Libéria não foram colonizadas"
        ]
      },
      {
        titulo: "Descolonização",
        texto: "Depois da Segunda Guerra Mundial (1945), as potências europeias estavam enfraquecidas e cresceram os movimentos de independência africanos.",
        pontos: [
          "A maioria das independências ocorreu entre 1950 e 1970",
          "1960 ficou conhecido como o 'Ano da África' (17 países ficaram independentes)",
          "Algumas foram negociadas; outras, por guerras (ex.: Argélia contra a França)",
          "Colônias portuguesas (Angola, Moçambique...) só em 1974–1975"
        ]
      },
      {
        titulo: "Dificuldades pós-independência",
        texto: "As heranças da colonização trouxeram muitos problemas aos novos países:",
        pontos: [
          "Fronteiras artificiais → conflitos étnicos e guerras civis",
          "Economias dependentes da exportação de produtos primários (minérios, agrícolas)",
          "Instabilidade política, golpes e ditaduras",
          "Pobreza, desigualdade e dívidas externas"
        ]
      },
      {
        titulo: "Conflitos étnicos: o caso de Ruanda",
        texto: "Em 1994, aconteceu o genocídio de Ruanda: extremistas da etnia hutu mataram cerca de 800 mil pessoas, a maioria da etnia tutsi (e hutus moderados), em cerca de 100 dias.",
        pontos: [
          "Raiz colonial: os belgas reforçaram a divisão hutu x tutsi, favorecendo os tutsis e registrando a etnia nos documentos",
          "A rivalidade continuou após a independência (1962)",
          "Estopim: a derrubada do avião do presidente ruandês (hutu) em 1994",
          "A comunidade internacional (ONU) foi criticada por não agir a tempo"
        ]
      },
      {
        titulo: "União Africana (UA)",
        texto: "Organização criada em 2002, substituindo a Organização da Unidade Africana (OUA, de 1963). Sede: Adis Abeba (Etiópia). Reúne os 55 países africanos.",
        pontos: [
          "Objetivos: integração política e econômica, paz e segurança, democracia e direitos humanos",
          "Pode intervir em conflitos e enviar missões de paz"
        ]
      },
      {
        titulo: "Revoltas populares no norte da África (Primavera Árabe)",
        texto: "Entre 2010 e 2012, uma onda de protestos tomou o norte da África e o Oriente Médio, contra ditaduras, desemprego, pobreza e corrupção. As redes sociais ajudaram a organizar os protestos.",
        pontos: [
          "Começou na Tunísia (dezembro de 2010), após um vendedor ambulante atear fogo ao próprio corpo em protesto",
          "Tunísia: queda do ditador Ben Ali",
          "Egito: queda de Hosni Mubarak (2011)",
          "Líbia: guerra civil e morte de Muammar Kadafi (2011)"
        ]
      },
      {
        titulo: "Relevo e o Rift Valley",
        texto: "O relevo africano é formado principalmente por PLANALTOS antigos, com algumas cadeias montanhosas e planícies litorâneas.",
        pontos: [
          "Montes Atlas: noroeste (Marrocos, Argélia)",
          "Monte Kilimanjaro (Tanzânia): ponto mais alto da África, cerca de 5.895 m",
          "Rift Valley (Grande Vale do Rift): enorme fenda no LESTE africano, formada pelo afastamento de placas tectônicas",
          "No Rift há vulcões, terremotos e grandes lagos (Tanganica, Malawi). No futuro, pode separar parte do leste da África do continente"
        ]
      },
      {
        titulo: "Hidrografia",
        texto: "Os principais rios e lagos da África:",
        pontos: [
          "Rio Nilo: um dos mais longos do mundo; corre para o norte e deságua no Mar Mediterrâneo. Foi essencial para o Egito Antigo",
          "Rio Congo: maior volume de água da África; atravessa a floresta equatorial",
          "Rio Níger: oeste africano",
          "Rio Zambeze: onde ficam as Cataratas Vitória",
          "Lago Vitória: maior lago da África"
        ]
      },
      {
        titulo: "Climas e formações vegetais",
        texto: "A Linha do Equador corta a África ao meio, por isso os climas se repetem de forma 'espelhada' ao norte e ao sul.",
        pontos: [
          "Equatorial (centro, Bacia do Congo): quente e chuvoso → floresta equatorial",
          "Tropical: verão chuvoso e inverno seco → savanas (a vegetação mais extensa da África, com grandes animais)",
          "Semiárido: pouca chuva → estepes (ex.: Sahel)",
          "Desértico: Saara (norte, maior deserto quente do mundo), Kalahari e Namibe (sul) → vegetação escassa",
          "Mediterrâneo (extremo norte e extremo sul): verão seco e inverno chuvoso → vegetação mediterrânea"
        ]
      },
      {
        titulo: "A desertificação do Sahel",
        texto: "O Sahel é uma faixa semiárida ao sul do Saara, uma transição entre o deserto e as savanas. Ali ocorre a desertificação: o solo perde fertilidade e vira paisagem desértica.",
        pontos: [
          "Causas humanas: desmatamento, sobrepastoreio (gado demais), agricultura sem cuidado com o solo",
          "Causas naturais: secas longas, agravadas pelas mudanças climáticas",
          "Consequências: fome, pobreza e migração da população",
          "Solução em andamento: 'Grande Muralha Verde', projeto de plantio de árvores atravessando o continente"
        ]
      }
    ],
    quiz: [
      {
        pergunta: "Qual evento definiu as regras da partilha da África entre as potências europeias?",
        alternativas: ["Tratado de Tordesilhas", "Conferência de Berlim (1884–1885)", "Primavera Árabe", "Criação da União Africana"],
        correta: 1,
        explicacao: "Na Conferência de Berlim, os europeus dividiram a África sem a participação dos africanos."
      },
      {
        pergunta: "Por que as fronteiras africanas traçadas pelos europeus geraram conflitos?",
        alternativas: [
          "Porque seguiam exatamente os limites de cada povo",
          "Porque não respeitaram os povos e culturas, juntando rivais e separando grupos",
          "Porque eram fronteiras naturais, como rios",
          "Porque foram decididas pelos próprios africanos"
        ],
        correta: 1,
        explicacao: "As fronteiras artificiais estão na raiz de muitos conflitos étnicos."
      },
      {
        pergunta: "A maioria dos países africanos conquistou a independência:",
        alternativas: ["No século XVI", "Antes de 1900", "Após a Segunda Guerra Mundial", "Depois de 2010"],
        correta: 2,
        explicacao: "Principalmente entre 1950 e 1970; 1960 foi o 'Ano da África'."
      },
      {
        pergunta: "No genocídio de Ruanda (1994), o conflito foi principalmente entre:",
        alternativas: ["Árabes e berberes", "Hutus e tutsis", "Zulus e bôeres", "Ingleses e franceses"],
        correta: 1,
        explicacao: "Extremistas hutus mataram cerca de 800 mil pessoas, principalmente tutsis."
      },
      {
        pergunta: "Qual foi o papel da colonização belga na rivalidade em Ruanda?",
        alternativas: [
          "Acabou com a rivalidade",
          "Reforçou a divisão étnica, favorecendo os tutsis e registrando a etnia nos documentos",
          "Não teve nenhuma influência",
          "Uniu hutus e tutsis em um só grupo"
        ],
        correta: 1,
        explicacao: "Os belgas aprofundaram a separação entre os grupos, o que alimentou o ódio depois."
      },
      {
        pergunta: "A União Africana (UA), criada em 2002, tem sede em:",
        alternativas: ["Cairo (Egito)", "Adis Abeba (Etiópia)", "Joanesburgo (África do Sul)", "Paris (França)"],
        correta: 1,
        explicacao: "A UA substituiu a OUA e tem sede em Adis Abeba."
      },
      {
        pergunta: "A Primavera Árabe começou em qual país?",
        alternativas: ["Egito", "Líbia", "Tunísia", "Marrocos"],
        correta: 2,
        explicacao: "Começou na Tunísia, em dezembro de 2010, e se espalhou para Egito, Líbia e outros países."
      },
      {
        pergunta: "Quais eram as principais reivindicações das revoltas populares no norte da África?",
        alternativas: [
          "Volta da colonização europeia",
          "Fim de ditaduras, mais empregos e combate à corrupção",
          "Construção de hidrelétricas",
          "Divisão dos países em mais territórios"
        ],
        correta: 1,
        explicacao: "A população protestava contra governos autoritários, pobreza e desemprego."
      },
      {
        pergunta: "O que é o Rift Valley?",
        alternativas: [
          "O maior deserto da África",
          "Uma grande fenda no leste africano formada pelo afastamento de placas tectônicas",
          "Um rio que deságua no Mediterrâneo",
          "Uma floresta equatorial"
        ],
        correta: 1,
        explicacao: "É uma enorme falha geológica, com vulcões, terremotos e grandes lagos."
      },
      {
        pergunta: "Qual é o ponto mais alto da África?",
        alternativas: ["Montes Atlas", "Monte Kilimanjaro", "Monte Everest", "Rift Valley"],
        correta: 1,
        explicacao: "O Kilimanjaro, na Tanzânia, tem cerca de 5.895 m."
      },
      {
        pergunta: "O relevo da África é formado principalmente por:",
        alternativas: ["Planaltos", "Cordilheiras jovens", "Planícies alagadas", "Geleiras"],
        correta: 0,
        explicacao: "Predominam planaltos antigos e desgastados."
      },
      {
        pergunta: "Qual rio deságua no Mar Mediterrâneo e foi essencial para o Egito Antigo?",
        alternativas: ["Congo", "Níger", "Nilo", "Zambeze"],
        correta: 2,
        explicacao: "O Nilo corre para o norte e deságua no Mediterrâneo."
      },
      {
        pergunta: "Qual rio africano tem o MAIOR volume de água?",
        alternativas: ["Nilo", "Congo", "Zambeze", "Orange"],
        correta: 1,
        explicacao: "O Congo atravessa a região equatorial, muito chuvosa, e tem o maior volume de água."
      },
      {
        pergunta: "Qual é a formação vegetal mais extensa da África, típica do clima tropical?",
        alternativas: ["Floresta equatorial", "Savana", "Tundra", "Vegetação mediterrânea"],
        correta: 1,
        explicacao: "As savanas (vegetação rasteira com árvores espaçadas) cobrem grande parte do continente."
      },
      {
        pergunta: "O clima quente e chuvoso o ano todo, na Bacia do Congo, é o:",
        alternativas: ["Desértico", "Mediterrâneo", "Equatorial", "Semiárido"],
        correta: 2,
        explicacao: "Clima equatorial → floresta equatorial."
      },
      {
        pergunta: "O que é o Sahel?",
        alternativas: [
          "Uma floresta tropical",
          "Uma faixa semiárida de transição entre o Saara e as savanas",
          "Um rio da África do Sul",
          "Uma cadeia de montanhas"
        ],
        correta: 1,
        explicacao: "O Sahel fica ao sul do Saara e sofre com a desertificação."
      },
      {
        pergunta: "Qual é uma causa HUMANA da desertificação do Sahel?",
        alternativas: ["Sobrepastoreio e desmatamento", "Erupções vulcânicas", "Excesso de chuvas", "Terremotos"],
        correta: 0,
        explicacao: "Gado demais e retirada da vegetação deixam o solo exposto e pobre."
      }
    ],
    flashcards: [
      { frente: "Conferência de Berlim", verso: "1884–1885: potências europeias definem a partilha da África." },
      { frente: "Países africanos que não foram colonizados", verso: "Etiópia e Libéria." },
      { frente: "'Ano da África'", verso: "1960, quando 17 países africanos ficaram independentes." },
      { frente: "Herança das fronteiras artificiais", verso: "Conflitos étnicos e guerras civis." },
      { frente: "Genocídio de Ruanda", verso: "1994: hutus extremistas mataram cerca de 800 mil pessoas, principalmente tutsis, em cerca de 100 dias." },
      { frente: "União Africana", verso: "Criada em 2002 (substituiu a OUA), sede em Adis Abeba, 55 países." },
      { frente: "Primavera Árabe", verso: "Revoltas de 2010–2012 contra ditaduras; começou na Tunísia (Egito e Líbia também)." },
      { frente: "Rift Valley", verso: "Fenda no leste africano causada pelo afastamento de placas tectônicas." },
      { frente: "Ponto mais alto da África", verso: "Monte Kilimanjaro (Tanzânia), cerca de 5.895 m." },
      { frente: "Rio Nilo", verso: "Corre para o norte e deságua no Mediterrâneo." },
      { frente: "Rio Congo", verso: "O de maior volume de água da África." },
      { frente: "Maior lago da África", verso: "Lago Vitória." },
      { frente: "Vegetação mais extensa da África", verso: "Savana." },
      { frente: "Desertos da África", verso: "Saara (norte), Kalahari e Namibe (sul)." },
      { frente: "Desertificação do Sahel: causas", verso: "Desmatamento, sobrepastoreio, agricultura inadequada e secas." }
    ]
  },

  // ===================================================================
  {
    id: "historia",
    nome: "História",
    icone: "🏛️",
    prova: "Cap. 8 EUA no século XIX · Cap. 10 Imperialismo",
    resumos: [
      {
        titulo: "Expansão territorial dos EUA (Marcha para o Oeste)",
        texto: "Depois da independência (1776), os EUA expandiram seu território do Atlântico até o Pacífico durante o século XIX.",
        pontos: [
          "Compra da Louisiana da França (1803), dobrando o território",
          "Compra da Flórida da Espanha (1819)",
          "Guerra contra o México (1846–1848): os EUA tomaram Texas, Califórnia e outras terras",
          "Corrida do ouro na Califórnia (1848) atraiu milhares de pessoas",
          "Lei de Terras – Homestead Act (1862): terras do Oeste distribuídas a colonos",
          "Ferrovia transcontinental (1869) ligou o leste ao oeste"
        ]
      },
      {
        titulo: "Destino Manifesto e Doutrina Monroe",
        texto: "Duas ideias justificaram a expansão e a influência dos EUA:",
        pontos: [
          "Destino Manifesto: crença de que os norte-americanos eram um povo escolhido por Deus para ocupar e 'civilizar' o continente",
          "Doutrina Monroe (1823): 'A América para os americanos' — os EUA não aceitariam interferência europeia no continente americano"
        ]
      },
      {
        titulo: "Os povos indígenas",
        texto: "A expansão para o Oeste foi feita à custa dos povos nativos.",
        pontos: [
          "Indígenas foram expulsos de suas terras, mortos em guerras ou confinados em reservas",
          "Trilha das Lágrimas (1838): remoção forçada dos cherokees, com milhares de mortos",
          "A matança dos bisões destruiu a base de vida de muitos povos das planícies"
        ]
      },
      {
        titulo: "Norte x Sul e a Guerra de Secessão",
        texto: "No século XIX, os EUA tinham duas regiões muito diferentes, e a principal divergência era a escravidão, sobretudo nos novos territórios do Oeste.",
        pontos: [
          "NORTE: industrializado, trabalho assalariado, defendia proteção à indústria e era contra expandir a escravidão",
          "SUL: agrário, grandes fazendas de algodão exportado e mão de obra ESCRAVIZADA",
          "1860: Abraham Lincoln (contra a expansão da escravidão) é eleito presidente",
          "Estados do Sul se separam e formam os Estados Confederados → Guerra de Secessão (1861–1865)",
          "A União (Norte) vence; a escravidão é abolida em 1865 (13ª Emenda); Lincoln é assassinado no mesmo ano"
        ]
      },
      {
        titulo: "Depois da guerra",
        texto: "O fim da escravidão não trouxe igualdade aos afro-americanos.",
        pontos: [
          "Surgimento da Ku Klux Klan, grupo racista e violento",
          "Leis de segregação racial (leis 'Jim Crow') no Sul",
          "O Norte industrializado impulsionou o crescimento econômico — os EUA se tornam grande potência no fim do século"
        ]
      },
      {
        titulo: "Imperialismo: causas",
        texto: "Imperialismo (ou neocolonialismo) foi a dominação de territórios da África e da Ásia pelas potências industriais no século XIX e início do XX. Foi impulsionado pela Segunda Revolução Industrial.",
        pontos: [
          "Busca de matérias-primas (borracha, minérios, algodão)",
          "Novos mercados consumidores para os produtos industrializados",
          "Lugares para investir capitais",
          "Destino para o excedente populacional europeu",
          "Disputa de prestígio e poder entre as potências"
        ]
      },
      {
        titulo: "Imperialismo: justificativas",
        texto: "Os europeus usavam ideias racistas para justificar a dominação:",
        pontos: [
          "Darwinismo social: aplicação errada da teoria de Darwin às sociedades, dizendo que haveria povos 'superiores'",
          "'Missão civilizadora': a ideia de levar 'civilização', cristianismo e progresso aos povos dominados",
          "'O fardo do homem branco': poema de Rudyard Kipling que apresentava a dominação como um dever"
        ]
      },
      {
        titulo: "Imperialismo na África",
        texto: "Na Conferência de Berlim (1884–1885), as potências europeias dividiram a África. Por volta de 1914, quase todo o continente estava sob domínio europeu.",
        pontos: [
          "Congo: propriedade pessoal do rei Leopoldo II da Bélgica; exploração da borracha com trabalho forçado e mutilações",
          "Guerra dos Bôeres (1899–1902): britânicos x bôeres (descendentes de holandeses) pelo ouro e diamantes da África do Sul",
          "Resistência: a Etiópia derrotou a Itália na Batalha de Adwa (1896) e manteve a independência",
          "Houve muitas outras resistências africanas, como a dos zulus contra os britânicos"
        ]
      },
      {
        titulo: "Imperialismo na Ásia",
        texto: "As potências também disputaram a Ásia:",
        pontos: [
          "Índia: dominada pelos britânicos; Revolta dos Sipaios (1857), soldados indianos contra o domínio inglês",
          "China: Guerras do Ópio (1839–1842 e 1856–1860) contra o Reino Unido, que queria vender ópio; a China perdeu e cedeu Hong Kong (Tratado de Nanquim)",
          "Revolta dos Boxers (1900): chineses contra a presença estrangeira",
          "Japão: com a Era Meiji (a partir de 1868), modernizou-se, industrializou-se e virou ele mesmo uma potência imperialista"
        ]
      }
    ],
    quiz: [
      {
        pergunta: "O que defendia a ideia do 'Destino Manifesto'?",
        alternativas: [
          "Que os EUA deviam devolver terras aos indígenas",
          "Que os norte-americanos eram escolhidos por Deus para ocupar o continente",
          "Que a Europa devia colonizar a América",
          "Que a escravidão devia ser abolida"
        ],
        correta: 1,
        explicacao: "Essa crença justificou a expansão para o Oeste."
      },
      {
        pergunta: "A frase 'A América para os americanos' resume:",
        alternativas: ["O Destino Manifesto", "A Doutrina Monroe", "O Homestead Act", "A 13ª Emenda"],
        correta: 1,
        explicacao: "A Doutrina Monroe (1823) rejeitava a interferência europeia na América."
      },
      {
        pergunta: "Como os EUA conquistaram o Texas e a Califórnia?",
        alternativas: [
          "Comprando da França",
          "Na guerra contra o México (1846–1848)",
          "Por um acordo com a Inglaterra",
          "Na Guerra de Secessão"
        ],
        correta: 1,
        explicacao: "O México perdeu cerca de metade do seu território para os EUA nessa guerra."
      },
      {
        pergunta: "O que aconteceu com os povos indígenas durante a Marcha para o Oeste?",
        alternativas: [
          "Ganharam mais terras",
          "Foram expulsos, mortos ou confinados em reservas",
          "Tornaram-se donos das ferrovias",
          "Não foram afetados"
        ],
        correta: 1,
        explicacao: "Um exemplo é a Trilha das Lágrimas, a remoção forçada dos cherokees."
      },
      {
        pergunta: "Qual era a principal diferença entre o Norte e o Sul dos EUA antes da Guerra de Secessão?",
        alternativas: [
          "O Norte era agrário e escravista; o Sul, industrial",
          "O Norte era industrial e assalariado; o Sul, agrário e escravista",
          "Os dois eram iguais",
          "O Sul queria abolir a escravidão"
        ],
        correta: 1,
        explicacao: "O Sul dependia das grandes plantações de algodão com trabalho escravizado."
      },
      {
        pergunta: "O que provocou a separação dos estados do Sul em 1860–1861?",
        alternativas: [
          "A eleição de Abraham Lincoln, contrário à expansão da escravidão",
          "A compra da Louisiana",
          "A corrida do ouro",
          "A Doutrina Monroe"
        ],
        correta: 0,
        explicacao: "Os sulistas temiam o fim da escravidão e formaram os Estados Confederados."
      },
      {
        pergunta: "Qual foi o resultado da Guerra de Secessão (1861–1865)?",
        alternativas: [
          "Vitória do Sul e manutenção da escravidão",
          "Vitória do Norte e abolição da escravidão",
          "Divisão dos EUA em dois países",
          "Independência do México"
        ],
        correta: 1,
        explicacao: "A União venceu, e a 13ª Emenda (1865) aboliu a escravidão."
      },
      {
        pergunta: "Após o fim da escravidão nos EUA, os afro-americanos:",
        alternativas: [
          "Conquistaram igualdade total imediatamente",
          "Sofreram com segregação racial e violência de grupos como a Ku Klux Klan",
          "Voltaram todos para a África",
          "Passaram a governar o Sul"
        ],
        correta: 1,
        explicacao: "Leis de segregação ('Jim Crow') e a KKK mantiveram a discriminação."
      },
      {
        pergunta: "Qual era um dos principais objetivos econômicos do imperialismo?",
        alternativas: [
          "Ajudar os povos africanos a se industrializarem",
          "Obter matérias-primas e mercados consumidores",
          "Acabar com o comércio internacional",
          "Diminuir a produção industrial europeia"
        ],
        correta: 1,
        explicacao: "A Segunda Revolução Industrial exigia matérias-primas e novos mercados."
      },
      {
        pergunta: "O 'darwinismo social' foi usado para:",
        alternativas: [
          "Defender a igualdade entre os povos",
          "Justificar a dominação, dizendo que haveria povos 'superiores'",
          "Explicar a origem das espécies animais",
          "Combater o imperialismo"
        ],
        correta: 1,
        explicacao: "Era uma ideia racista, sem base científica, que justificava a dominação."
      },
      {
        pergunta: "O que foi a Conferência de Berlim (1884–1885)?",
        alternativas: [
          "Um acordo de paz da Primeira Guerra",
          "A reunião em que potências europeias definiram a partilha da África",
          "A independência da Etiópia",
          "Um tratado entre China e Reino Unido"
        ],
        correta: 1,
        explicacao: "Nenhum africano participou das decisões sobre o próprio continente."
      },
      {
        pergunta: "Qual país africano derrotou a Itália na Batalha de Adwa (1896) e manteve sua independência?",
        alternativas: ["Egito", "Etiópia", "Congo", "Argélia"],
        correta: 1,
        explicacao: "A vitória etíope é um símbolo da resistência africana."
      },
      {
        pergunta: "O Congo foi, por um tempo, propriedade pessoal de:",
        alternativas: ["Rainha Vitória", "Rei Leopoldo II da Bélgica", "Napoleão III", "Imperador Meiji"],
        correta: 1,
        explicacao: "Sob Leopoldo II, a exploração da borracha causou trabalho forçado, mutilações e milhões de mortes."
      },
      {
        pergunta: "As Guerras do Ópio aconteceram entre:",
        alternativas: ["Japão e Rússia", "China e Reino Unido", "Índia e França", "EUA e México"],
        correta: 1,
        explicacao: "O Reino Unido queria vender ópio na China; a China perdeu e cedeu Hong Kong."
      },
      {
        pergunta: "A Revolta dos Sipaios (1857) aconteceu na:",
        alternativas: ["China", "Índia", "África do Sul", "Etiópia"],
        correta: 1,
        explicacao: "Soldados indianos (sipaios) se revoltaram contra o domínio britânico."
      },
      {
        pergunta: "Qual país asiático se modernizou na Era Meiji e virou uma potência imperialista?",
        alternativas: ["China", "Índia", "Japão", "Vietnã"],
        correta: 2,
        explicacao: "A partir de 1868, o Japão se industrializou rapidamente e passou a dominar outros territórios."
      }
    ],
    flashcards: [
      { frente: "Destino Manifesto", verso: "Crença de que os norte-americanos eram escolhidos por Deus para ocupar o continente." },
      { frente: "Doutrina Monroe (1823)", verso: "'A América para os americanos' — contra a interferência europeia." },
      { frente: "Compra da Louisiana", verso: "1803, comprada da França; dobrou o território dos EUA." },
      { frente: "Homestead Act (1862)", verso: "Lei de Terras: distribuiu terras do Oeste a colonos." },
      { frente: "Trilha das Lágrimas", verso: "Remoção forçada dos indígenas cherokees (1838)." },
      { frente: "Guerra de Secessão", verso: "1861–1865: Norte (União) x Sul (Confederados). O Norte venceu." },
      { frente: "13ª Emenda (1865)", verso: "Aboliu a escravidão nos EUA." },
      { frente: "Ku Klux Klan", verso: "Grupo racista e violento criado no Sul após a guerra." },
      { frente: "Causas do imperialismo", verso: "Matérias-primas, mercados consumidores, investimento de capitais, excedente populacional." },
      { frente: "Darwinismo social", verso: "Ideia racista de que haveria povos 'superiores', usada para justificar a dominação." },
      { frente: "'O fardo do homem branco'", verso: "Poema de Kipling que apresentava a dominação como 'dever civilizador'." },
      { frente: "Batalha de Adwa (1896)", verso: "A Etiópia derrotou a Itália e manteve a independência." },
      { frente: "Guerra dos Bôeres", verso: "1899–1902: britânicos x bôeres pelo ouro e diamantes da África do Sul." },
      { frente: "Guerras do Ópio", verso: "China x Reino Unido; a China perdeu e cedeu Hong Kong." },
      { frente: "Revolta dos Sipaios", verso: "1857: soldados indianos contra o domínio britânico." },
      { frente: "Era Meiji", verso: "Modernização do Japão a partir de 1868; virou potência imperialista." }
    ]
  },

  // ===================================================================
  {
    id: "ingles",
    nome: "Língua Inglesa",
    icone: "🇬🇧",
    prova: "Units 7 e 8 · Passive Voice · Reported Speech",
    resumos: [
      {
        titulo: "Vocabulary – Visual Arts (Unit 7)",
        texto: "Palavras sobre artes visuais:",
        pontos: [
          "painting = pintura · drawing = desenho · sculpture = escultura",
          "portrait = retrato · landscape = paisagem · still life = natureza-morta",
          "artist / painter / sculptor = artista / pintor / escultor",
          "brush = pincel · canvas = tela · paint = tinta",
          "gallery = galeria · museum = museu · exhibition = exposição",
          "masterpiece = obra-prima · artwork = obra de arte"
        ]
      },
      {
        titulo: "Vocabulary – Perform and Create (Unit 8)",
        texto: "Palavras sobre artes cênicas e apresentações:",
        pontos: [
          "perform = apresentar/atuar · performance = apresentação",
          "actor / actress = ator / atriz · dancer = dançarino(a) · singer = cantor(a)",
          "stage = palco · audience = plateia · show = espetáculo",
          "play = peça de teatro · musical = musical · script = roteiro",
          "rehearsal = ensaio · rehearse = ensaiar",
          "costume = figurino · character = personagem · role = papel",
          "choir = coral · band = banda · director = diretor(a)"
        ]
      },
      {
        titulo: "Passive Voice (voz passiva)",
        texto: "Usamos a voz passiva quando o mais importante é a AÇÃO ou quem a SOFREU, e não quem a fez. Estrutura: verbo TO BE (no tempo da frase) + PAST PARTICIPLE (particípio).",
        pontos: [
          "Present simple: am/is/are + particípio → \"English is spoken here.\"",
          "Past simple: was/were + particípio → \"The Mona Lisa was painted by Leonardo da Vinci.\"",
          "Quem fez a ação (agente) aparece com BY: \"by Leonardo da Vinci\"",
          "Ativa: \"Picasso painted this picture.\" → Passiva: \"This picture was painted by Picasso.\"",
          "Particípios irregulares comuns: written, made, done, built, sung, seen, taken, drawn"
        ]
      },
      {
        titulo: "Reported Speech (discurso indireto)",
        texto: "Usamos para contar o que outra pessoa disse. Com 'said' (passado), o verbo 'volta um tempo' (backshift).",
        pontos: [
          "Present simple → Past simple: \"I like art.\" → She said (that) she liked art.",
          "Present continuous → Past continuous: \"I am dancing.\" → He said he was dancing.",
          "Past simple → Past perfect: \"I saw the play.\" → She said she had seen the play.",
          "will → would · can → could",
          "Pronomes mudam: I → he/she · my → his/her · we → they"
        ]
      },
      {
        titulo: "Reported Speech: say x tell e expressões de tempo",
        texto: "Detalhes que caem na prova:",
        pontos: [
          "SAY não precisa de pessoa: \"She said (that)...\"",
          "TELL precisa de pessoa: \"She told ME (that)...\"",
          "now → then · today → that day",
          "tomorrow → the next day · yesterday → the day before",
          "here → there · this → that"
        ]
      },
      {
        titulo: "Reading Comprehension: dicas",
        texto: "Estratégias para entender textos em inglês:",
        pontos: [
          "Skimming: leitura rápida para pegar a ideia geral",
          "Scanning: procurar uma informação específica (nome, data, número)",
          "Cognatos: palavras parecidas com o português (museum, artist, exhibition)",
          "Cuidado com falsos cognatos: 'actually' = na verdade; 'pretend' = fingir",
          "Use título, imagens e contexto para deduzir palavras desconhecidas"
        ]
      }
    ],
    quiz: [
      {
        pergunta: "What is a 'portrait'?",
        alternativas: ["Uma paisagem", "Um retrato de uma pessoa", "Uma escultura", "Um palco"],
        correta: 1,
        explicacao: "Portrait = retrato (pintura ou foto de uma pessoa). Landscape = paisagem."
      },
      {
        pergunta: "Qual palavra significa 'ensaio' (antes de uma apresentação)?",
        alternativas: ["Audience", "Rehearsal", "Costume", "Stage"],
        correta: 1,
        explicacao: "Rehearsal = ensaio. Audience = plateia, costume = figurino, stage = palco."
      },
      {
        pergunta: "'The audience clapped at the end of the show.' 'Audience' significa:",
        alternativas: ["Plateia", "Atores", "Diretor", "Palco"],
        correta: 0,
        explicacao: "Audience = plateia, o público que assiste."
      },
      {
        pergunta: "Qual palavra significa 'pincel'?",
        alternativas: ["Canvas", "Brush", "Paint", "Gallery"],
        correta: 1,
        explicacao: "Brush = pincel. Canvas = tela. Paint = tinta."
      },
      {
        pergunta: "Complete na voz passiva: \"The Mona Lisa _____ by Leonardo da Vinci.\"",
        alternativas: ["painted", "was painted", "is painting", "were painted"],
        correta: 1,
        explicacao: "Passado + sujeito singular: was + particípio (painted)."
      },
      {
        pergunta: "Complete: \"English _____ in many countries.\"",
        alternativas: ["is spoken", "speaks", "was speak", "are spoken"],
        correta: 0,
        explicacao: "Presente + sujeito singular: is + particípio (spoken)."
      },
      {
        pergunta: "Passe para a voz passiva: \"Picasso painted this picture.\"",
        alternativas: [
          "This picture painted Picasso.",
          "This picture was painted by Picasso.",
          "This picture is paint by Picasso.",
          "Picasso was painted by this picture."
        ],
        correta: 1,
        explicacao: "Objeto vira sujeito + was + particípio + by + agente."
      },
      {
        pergunta: "Complete: \"These songs _____ by the school choir last year.\"",
        alternativas: ["was sung", "were sung", "is sung", "sang"],
        correta: 1,
        explicacao: "Passado (last year) + plural (songs): were + particípio (sung)."
      },
      {
        pergunta: "Na voz passiva, qual palavra introduz quem fez a ação?",
        alternativas: ["to", "by", "of", "for"],
        correta: 1,
        explicacao: "O agente da passiva vem com 'by'."
      },
      {
        pergunta: "Discurso indireto: \"I like art,\" she said. →",
        alternativas: [
          "She said she likes art.",
          "She said she liked art.",
          "She said I liked art.",
          "She told she liked art."
        ],
        correta: 1,
        explicacao: "Present simple (like) → past simple (liked); I → she."
      },
      {
        pergunta: "Discurso indireto: \"I am rehearsing,\" Tom said. →",
        alternativas: [
          "Tom said he is rehearsing.",
          "Tom said he was rehearsing.",
          "Tom said I was rehearsing.",
          "Tom said he rehearsed tomorrow."
        ],
        correta: 1,
        explicacao: "Present continuous (am rehearsing) → past continuous (was rehearsing)."
      },
      {
        pergunta: "Discurso indireto: \"I will paint a landscape,\" he said. →",
        alternativas: [
          "He said he will paint a landscape.",
          "He said he would paint a landscape.",
          "He said he can paint a landscape.",
          "He said he painted a landscape."
        ],
        correta: 1,
        explicacao: "will → would."
      },
      {
        pergunta: "Discurso indireto: \"I saw the play yesterday,\" Ana said. →",
        alternativas: [
          "Ana said she had seen the play the day before.",
          "Ana said she saw the play yesterday.",
          "Ana said she has seen the play tomorrow.",
          "Ana told she had seen the play."
        ],
        correta: 0,
        explicacao: "Past simple → past perfect (had seen); yesterday → the day before."
      },
      {
        pergunta: "Qual frase está CORRETA?",
        alternativas: [
          "She said me that she was tired.",
          "She told that she was tired.",
          "She told me that she was tired.",
          "She say me she was tired."
        ],
        correta: 2,
        explicacao: "TELL precisa de pessoa (told me). SAY não leva pessoa direto (said that...)."
      },
      {
        pergunta: "No discurso indireto, 'tomorrow' vira:",
        alternativas: ["the day before", "the next day", "that day", "yesterday"],
        correta: 1,
        explicacao: "tomorrow → the next day (ou the following day)."
      },
      {
        pergunta: "Ler um texto rapidamente só para ter a ideia geral se chama:",
        alternativas: ["Scanning", "Skimming", "Rehearsing", "Reporting"],
        correta: 1,
        explicacao: "Skimming = ideia geral. Scanning = buscar informação específica."
      }
    ],
    flashcards: [
      { frente: "painting / drawing / sculpture", verso: "pintura / desenho / escultura" },
      { frente: "portrait / landscape", verso: "retrato / paisagem" },
      { frente: "brush / canvas", verso: "pincel / tela" },
      { frente: "exhibition / masterpiece", verso: "exposição / obra-prima" },
      { frente: "stage / audience", verso: "palco / plateia" },
      { frente: "rehearsal / costume", verso: "ensaio / figurino" },
      { frente: "play / script / role", verso: "peça de teatro / roteiro / papel" },
      { frente: "Estrutura da Passive Voice", verso: "to be + past participle (+ by + agente)" },
      { frente: "Passive no presente", verso: "am / is / are + particípio" },
      { frente: "Passive no passado", verso: "was / were + particípio" },
      { frente: "Reported speech: present simple vira…", verso: "past simple (like → liked)" },
      { frente: "Reported speech: past simple vira…", verso: "past perfect (saw → had seen)" },
      { frente: "Reported speech: will / can viram…", verso: "would / could" },
      { frente: "Say x Tell", verso: "said (that)… · told + pessoa (told me that…)" },
      { frente: "today / tomorrow / yesterday no reported speech", verso: "that day / the next day / the day before" }
    ]
  }
];
