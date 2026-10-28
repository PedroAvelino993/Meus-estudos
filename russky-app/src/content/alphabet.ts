// As 33 letras do alfabeto russo, na ordem oficial.
// Convenção do conteúdo: o apóstrofo depois de uma vogal marca o acento tônico (ма'ма → ма́ма).
// A transliteração "tr" é uma pronúncia aproximada para brasileiros, não uma regra de escrita.

import type { Letter } from "../core/types";

export const ALPHABET: Letter[] = [
  {
    upper: "А", lower: "а", name: "а", nameTr: "a", sound: "a", kind: "vogal",
    explain: "Som de «a» aberto, como em «casa». Quando a sílaba não é tônica, fica mais curto e fraco.",
    examples: [
      { ru: "ма'ма", pt: "mamãe", tr: "máma" },
      { ru: "А'нна", pt: "Anna", tr: "ánna" },
      { ru: "там", pt: "lá", tr: "tam" },
    ],
    lookalikes: [{ char: "A", note: "Igual à letra latina A, e com o mesmo som." }],
  },
  {
    upper: "Б", lower: "б", name: "бэ", nameTr: "bê", sound: "b", kind: "consoante",
    explain: "Som de «b», como em «bola».",
    pitfall: "No fim da palavra vira «p»: хлеб (pão) soa «khliep».",
    examples: [
      { ru: "брат", pt: "irmão", tr: "brat" },
      { ru: "банк", pt: "banco", tr: "bank" },
      { ru: "ры'ба", pt: "peixe", tr: "rýba" },
    ],
    lookalikes: [
      { char: "6", note: "Parece o número 6, mas é a letra «b»." },
      { char: "В", note: "Б (b) tem a barriga só embaixo; В (v) tem duas." },
    ],
  },
  {
    upper: "В", lower: "в", name: "вэ", nameTr: "vê", sound: "v", kind: "consoante", falseFriend: true,
    explain: "Som de «v», como em «vaca». Parece o B latino, mas NÃO é «b».",
    pitfall: "O erro mais comum de quem começa: ler В como «b». вода' é «vadá», não «boda». No fim da palavra vira «f»: Ивано'в soa «ivanóf».",
    examples: [
      { ru: "вот", pt: "aqui está", tr: "vot" },
      { ru: "вода'", pt: "água", tr: "vadá" },
      { ru: "Москва'", pt: "Moscou", tr: "maskvá" },
    ],
    lookalikes: [{ char: "B", note: "B latino = som de «b». В russo = som de «v»." }],
  },
  {
    upper: "Г", lower: "г", name: "гэ", nameTr: "guê", sound: "g", kind: "consoante",
    explain: "Sempre som de «g» duro, como em «gato» — mesmo antes de е e и. гид soa «guit», nunca «jid».",
    pitfall: "Exceção importante: nas terminações -ого e -его, г soa «v»: его' soa «yivó», сего'дня soa «sivódnia».",
    examples: [
      { ru: "го'род", pt: "cidade", tr: "górat" },
      { ru: "где", pt: "onde", tr: "gdie" },
      { ru: "год", pt: "ano", tr: "got" },
    ],
    lookalikes: [{ char: "r", note: "Parece um «r» minúsculo de pernas para o ar, mas é «g»." }],
  },
  {
    upper: "Д", lower: "д", name: "дэ", nameTr: "dê", sound: "d", kind: "consoante",
    explain: "Som de «d», como em «dado».",
    pitfall: "Antes de и, е e я, não vire «dj» como no português do Brasil («djia»): ди é um «di» com a língua encostada nos dentes. No fim da palavra vira «t»: год soa «got».",
    examples: [
      { ru: "дом", pt: "casa", tr: "dom" },
      { ru: "да", pt: "sim", tr: "da" },
      { ru: "дя'дя", pt: "tio", tr: "diádia" },
    ],
    lookalikes: [{ char: "D", note: "O Д tem «pezinhos» embaixo, como uma casinha." }],
  },
  {
    upper: "Е", lower: "е", name: "е", nameTr: "ié", sound: "ie", kind: "vogal", falseFriend: true,
    explain: "No começo da palavra ou depois de vogal soa «ié» (есть = «iest'»). Depois de consoante, amolece a consoante e soa «e»: нет soa «niet».",
    pitfall: "Parece o E latino, mas carrega um «i» na frente. Fora da sílaba tônica fica parecido com «i»: сестра' soa «sistrá».",
    examples: [
      { ru: "нет", pt: "não", tr: "niet" },
      { ru: "метро'", pt: "metrô", tr: "mitró" },
      { ru: "сестра'", pt: "irmã", tr: "sistrá" },
    ],
    lookalikes: [
      { char: "E", note: "E latino = «e». Е russo = «ie» ou amolece a consoante." },
      { char: "Ё", note: "Ё tem dois pontinhos e soa «io»." },
    ],
  },
  {
    upper: "Ё", lower: "ё", name: "ё", nameTr: "io", sound: "io", kind: "vogal",
    explain: "Soa «iô». A sílaba com ё é sempre a tônica.",
    pitfall: "Nos textos comuns os dois pontinhos quase sempre são omitidos: ёлка aparece escrito «елка». Você precisa reconhecer a palavra mesmo assim.",
    examples: [
      { ru: "ёлка", pt: "pinheiro (árvore de Natal)", tr: "iólka" },
      { ru: "мёд", pt: "mel", tr: "miot" },
      { ru: "тётя", pt: "tia", tr: "tiótia" },
    ],
    lookalikes: [{ char: "Е", note: "Sem os pontos é Е («ie»)." }],
  },
  {
    upper: "Ж", lower: "ж", name: "жэ", nameTr: "jê", sound: "j", kind: "consoante",
    explain: "Parecido com o «j» de «já», mas mais grave: a ponta da língua vai um pouco para trás. É sempre duro.",
    pitfall: "Por ser sempre duro, жи soa «jy» (com ы): жить soa «jyt'». No fim da palavra vira «sh»: нож soa «nosh».",
    examples: [
      { ru: "жук", pt: "besouro", tr: "juk" },
      { ru: "журна'л", pt: "revista", tr: "jurnál" },
      { ru: "нож", pt: "faca", tr: "nosh" },
    ],
    lookalikes: [{ char: "Ж", note: "Lembra um inseto com seis patinhas — como жук (besouro)." }],
  },
  {
    upper: "З", lower: "з", name: "зэ", nameTr: "zê", sound: "z", kind: "consoante",
    explain: "Som de «z», como em «zebra».",
    pitfall: "Parece o número 3. No fim da palavra vira «s»: раз soa «ras».",
    examples: [
      { ru: "зонт", pt: "guarda-chuva", tr: "zont" },
      { ru: "зима'", pt: "inverno", tr: "zimá" },
      { ru: "за'втра", pt: "amanhã", tr: "záftra" },
    ],
    lookalikes: [
      { char: "3", note: "Parece o número 3, mas é a letra «z»." },
      { char: "Э", note: "Э é o espelho: aberto para a esquerda, som de «é»." },
    ],
  },
  {
    upper: "И", lower: "и", name: "и", nameTr: "i", sound: "i", kind: "vogal",
    explain: "Som de «i», como em «vida». Amolece a consoante anterior.",
    pitfall: "Parece um N ao contrário. Depois de ж, ш e ц soa como ы.",
    examples: [
      { ru: "и", pt: "e", tr: "i" },
      { ru: "Ива'н", pt: "Ivan", tr: "iván" },
      { ru: "кино'", pt: "cinema", tr: "kinó" },
    ],
    lookalikes: [
      { char: "N", note: "N latino com a diagonal ao contrário." },
      { char: "Й", note: "Com a «tampinha» em cima é Й, um «i» curto." },
    ],
  },
  {
    upper: "Й", lower: "й", name: "и кра'ткое", nameTr: "i krátkaie (i curto)", sound: "i curto", kind: "consoante",
    explain: "Um «i» rápido que não forma sílaba sozinho, como o «i» de «pai» ou «boi».",
    examples: [
      { ru: "май", pt: "maio", tr: "mai" },
      { ru: "мой", pt: "meu", tr: "moi" },
      { ru: "чай", pt: "chá", tr: "tchai" },
    ],
    lookalikes: [{ char: "И", note: "Sem a tampinha é И, um «i» completo." }],
  },
  {
    upper: "К", lower: "к", name: "ка", nameTr: "ká", sound: "k", kind: "consoante",
    explain: "Som de «k», como em «casa».",
    examples: [
      { ru: "кот", pt: "gato", tr: "kot" },
      { ru: "как", pt: "como", tr: "kak" },
      { ru: "такси'", pt: "táxi", tr: "taksí" },
    ],
    lookalikes: [{ char: "K", note: "Igual ao K latino, com o mesmo som." }],
  },
  {
    upper: "Л", lower: "л", name: "эль", nameTr: "él'", sound: "l", kind: "consoante",
    explain: "Som de «l». O л duro é pronunciado com a língua mais para trás, como o «l» de Portugal em «mal».",
    pitfall: "Brasileiros transformam o L do fim da sílaba em «u» («Brasiu»). Em russo não: стол é «stol», com L de verdade.",
    examples: [
      { ru: "лимо'н", pt: "limão", tr: "limón" },
      { ru: "стол", pt: "mesa", tr: "stol" },
      { ru: "шко'ла", pt: "escola", tr: "shkóla" },
    ],
    lookalikes: [{ char: "П", note: "П (p) tem as duas pernas retas; Л tem a perna esquerda curvada." }],
  },
  {
    upper: "М", lower: "м", name: "эм", nameTr: "em", sound: "m", kind: "consoante",
    explain: "Som de «m», como em «mão».",
    pitfall: "No fim da palavra, feche os lábios e pronuncie o M: дом é «dom», não «dõ».",
    examples: [
      { ru: "ма'ма", pt: "mamãe", tr: "máma" },
      { ru: "дом", pt: "casa", tr: "dom" },
      { ru: "мост", pt: "ponte", tr: "most" },
    ],
    lookalikes: [{ char: "M", note: "Igual ao M latino; a minúscula м é só um M pequeno." }],
  },
  {
    upper: "Н", lower: "н", name: "эн", nameTr: "en", sound: "n", kind: "consoante", falseFriend: true,
    explain: "Som de «n», como em «nada». Parece o H latino, mas é «n».",
    pitfall: "нет é «niet», não «het». No fim da palavra, pronuncie o N sem anasalar a vogal: он é «on».",
    examples: [
      { ru: "нет", pt: "não", tr: "niet" },
      { ru: "нос", pt: "nariz", tr: "nos" },
      { ru: "он", pt: "ele", tr: "on" },
    ],
    lookalikes: [{ char: "H", note: "H latino = «h». Н russo = «n»." }],
  },
  {
    upper: "О", lower: "о", name: "о", nameTr: "o", sound: "o", kind: "vogal",
    explain: "Na sílaba tônica soa «ó»/«ô». Fora dela, soa quase como «a» — isso se chama «akanie».",
    pitfall: "молоко' (leite) se escreve com três О, mas se fala «malakó»: só o último О é tônico.",
    examples: [
      { ru: "дом", pt: "casa", tr: "dom" },
      { ru: "окно'", pt: "janela", tr: "aknó" },
      { ru: "молоко'", pt: "leite", tr: "malakó" },
    ],
    lookalikes: [{ char: "O", note: "Igual ao O latino." }],
  },
  {
    upper: "П", lower: "п", name: "пэ", nameTr: "pê", sound: "p", kind: "consoante",
    explain: "Som de «p», como em «pato».",
    examples: [
      { ru: "па'па", pt: "papai", tr: "pápa" },
      { ru: "парк", pt: "parque", tr: "park" },
      { ru: "суп", pt: "sopa", tr: "sup" },
    ],
    lookalikes: [
      { char: "Π", note: "Igual ao «pi» da matemática." },
      { char: "Л", note: "Л (l) tem a perna esquerda curvada." },
    ],
  },
  {
    upper: "Р", lower: "р", name: "эр", nameTr: "er", sound: "r", kind: "consoante", falseFriend: true,
    explain: "Um «r» vibrado com a ponta da língua, como em «caro» (ou mais forte, como «rr» em espanhol). Parece o P latino, mas é «r».",
    pitfall: "Nunca use o «r» de garganta do carioca («rato»): рот é «rot» com a língua vibrando atrás dos dentes.",
    examples: [
      { ru: "рот", pt: "boca", tr: "rot" },
      { ru: "Росси'я", pt: "Rússia", tr: "rassíia" },
      { ru: "брат", pt: "irmão", tr: "brat" },
    ],
    lookalikes: [{ char: "P", note: "P latino = «p». Р russo = «r»." }],
  },
  {
    upper: "С", lower: "с", name: "эс", nameTr: "es", sound: "s", kind: "consoante", falseFriend: true,
    explain: "Sempre «s», como em «sapo». Parece o C latino, mas nunca soa «k».",
    pitfall: "Também nunca soa «z» entre vogais: ро'са soa «rósa», com S.",
    examples: [
      { ru: "сок", pt: "suco", tr: "sok" },
      { ru: "сыр", pt: "queijo", tr: "syr" },
      { ru: "нос", pt: "nariz", tr: "nos" },
    ],
    lookalikes: [{ char: "C", note: "C latino pode soar «k». С russo é sempre «s»." }],
  },
  {
    upper: "Т", lower: "т", name: "тэ", nameTr: "tê", sound: "t", kind: "consoante",
    explain: "Som de «t», como em «tatu».",
    pitfall: "Antes de и e е, não vire «tch» como no Brasil («tchia»): ти é «ti» com a língua nos dentes.",
    examples: [
      { ru: "там", pt: "lá", tr: "tam" },
      { ru: "тут", pt: "aqui", tr: "tut" },
      { ru: "такси'", pt: "táxi", tr: "taksí" },
    ],
    lookalikes: [{ char: "T", note: "Igual ao T latino. A minúscula т parece um T pequeno (e em letra cursiva parece um m!)." }],
  },
  {
    upper: "У", lower: "у", name: "у", nameTr: "u", sound: "u", kind: "vogal", falseFriend: true,
    explain: "Som de «u», como em «uva». Parece o Y latino, mas é «u».",
    examples: [
      { ru: "у'тро", pt: "manhã", tr: "útra" },
      { ru: "суп", pt: "sopa", tr: "sup" },
      { ru: "у'лица", pt: "rua", tr: "úlitsa" },
    ],
    lookalikes: [{ char: "Y", note: "Y latino ≠ У russo, que soa «u»." }],
  },
  {
    upper: "Ф", lower: "ф", name: "эф", nameTr: "ef", sound: "f", kind: "consoante",
    explain: "Som de «f», como em «faca».",
    examples: [
      { ru: "фо'то", pt: "foto", tr: "fóta" },
      { ru: "футбо'л", pt: "futebol", tr: "futból" },
      { ru: "кафе'", pt: "café (lugar)", tr: "kafé" },
    ],
  },
  {
    upper: "Х", lower: "х", name: "ха", nameTr: "khá", sound: "kh", kind: "consoante", falseFriend: true,
    explain: "Um «h» raspado na garganta, como o «rr» do carioca em «carro» ou o «j» espanhol de «jamón». Parece o X latino.",
    pitfall: "Nunca leia como «ks» nem «sh»: хор é «khor».",
    examples: [
      { ru: "хорошо'", pt: "bem", tr: "kharashó" },
      { ru: "хлеб", pt: "pão", tr: "khliep" },
      { ru: "у'хо", pt: "orelha", tr: "úkha" },
    ],
    lookalikes: [{ char: "X", note: "X latino = «ks»/«sh». Х russo = «h» raspado." }],
  },
  {
    upper: "Ц", lower: "ц", name: "цэ", nameTr: "tsê", sound: "ts", kind: "consoante",
    explain: "Som de «ts», como em «tsunami» ou na pizza italiana. É sempre duro.",
    pitfall: "Depois de ц, a letra и soa como ы: цирк soa «tsyrk».",
    examples: [
      { ru: "центр", pt: "centro", tr: "tsentr" },
      { ru: "у'лица", pt: "rua", tr: "úlitsa" },
      { ru: "цирк", pt: "circo", tr: "tsyrk" },
    ],
    lookalikes: [{ char: "Щ", note: "Ц tem o «rabinho» embaixo como Щ, mas só duas pernas." }],
  },
  {
    upper: "Ч", lower: "ч", name: "че", nameTr: "tchê", sound: "tch", kind: "consoante",
    explain: "Som de «tch», como em «tchau». É sempre suave.",
    pitfall: "Em что (o quê) e чтобы, ч soa «sh»: «shto».",
    examples: [
      { ru: "чай", pt: "chá", tr: "tchai" },
      { ru: "час", pt: "hora", tr: "tchas" },
      { ru: "врач", pt: "médico", tr: "vratch" },
    ],
    lookalikes: [{ char: "4", note: "Parece o número 4 de cabeça para baixo." }],
  },
  {
    upper: "Ш", lower: "ш", name: "ша", nameTr: "shá", sound: "sh", kind: "consoante",
    explain: "Parecido com o «ch» de «chuva», mas mais grave, com a língua mais para trás. É sempre duro.",
    pitfall: "Depois de ш, и soa como ы: машина soa «mashýna».",
    examples: [
      { ru: "шко'ла", pt: "escola", tr: "shkóla" },
      { ru: "ша'пка", pt: "gorro", tr: "shápka" },
      { ru: "хорошо'", pt: "bem", tr: "kharashó" },
    ],
    lookalikes: [{ char: "Щ", note: "Щ tem um rabinho embaixo e soa diferente (mais longo e suave)." }],
  },
  {
    upper: "Щ", lower: "щ", name: "ща", nameTr: "shchá", sound: "shch", kind: "consoante",
    explain: "Um «ch» longo e suave, com a língua mais alta, como se você sorrisse ao dizer «chhh». A pronúncia padrão de Moscou é esse «ch» longo, não «sh» + «tch».",
    pitfall: "Ш e Щ são letras diferentes: Ш é grave e curto, Щ é suave e longo.",
    examples: [
      { ru: "борщ", pt: "borsch (sopa de beterraba)", tr: "borshch" },
      { ru: "о'вощи", pt: "legumes", tr: "óvashchi" },
      { ru: "щи", pt: "sopa de repolho", tr: "shchi" },
    ],
    lookalikes: [{ char: "Ш", note: "Sem o rabinho é Ш (sh grave)." }],
  },
  {
    upper: "Ъ", lower: "ъ", name: "твёрдый знак", nameTr: "tviórdyi znak (sinal duro)", sound: "sem som", kind: "sinal",
    explain: "Não tem som. Aparece antes de е, ё, ю, я para separar a consoante da vogal: a vogal mantém o «i» do começo. É uma letra rara.",
    examples: [
      { ru: "подъе'зд", pt: "entrada do prédio", tr: "padiést" },
      { ru: "объявле'ние", pt: "aviso, anúncio", tr: "abiavliénie" },
    ],
    lookalikes: [{ char: "Ь", note: "Ь (sinal brando) não tem o tracinho em cima à esquerda." }],
  },
  {
    upper: "Ы", lower: "ы", name: "ы", nameTr: "y", sound: "y (i duro)", kind: "vogal",
    explain: "Não existe em português. Diga «i», mas puxe a língua para trás, com os lábios relaxados (sem sorrir). Também ajuda dizer «u» com os lábios esticados.",
    pitfall: "ы ≠ и: мы (nós) e ми (a nota mi) soam diferente. Nunca aparece no começo das palavras russas.",
    examples: [
      { ru: "ты", pt: "você", tr: "ty" },
      { ru: "мы", pt: "nós", tr: "my" },
      { ru: "сыр", pt: "queijo", tr: "syr" },
    ],
    lookalikes: [{ char: "bl", note: "Parece «b» + «l» juntos, mas é uma vogal só." }],
  },
  {
    upper: "Ь", lower: "ь", name: "мя'гкий знак", nameTr: "miákhkii znak (sinal brando)", sound: "sem som (amolece)", kind: "sinal",
    explain: "Não tem som próprio: amolece a consoante anterior, como se um «i» bem rápido encostasse nela. мат e мать são palavras diferentes.",
    examples: [
      { ru: "мать", pt: "mãe", tr: "mat'" },
      { ru: "день", pt: "dia", tr: "dien'" },
      { ru: "соль", pt: "sal", tr: "sol'" },
    ],
    lookalikes: [
      { char: "b", note: "Parece um «b» minúsculo, mas não tem som." },
      { char: "Ъ", note: "Ъ (sinal duro) tem um tracinho a mais em cima." },
    ],
  },
  {
    upper: "Э", lower: "э", name: "э оборо'тное", nameTr: "e abarótnaie", sound: "é", kind: "vogal",
    explain: "Som de «é», como em «é verdade». Diferente do е, não tem «i» e não amolece a consoante.",
    examples: [
      { ru: "э'то", pt: "isto é / isso é", tr: "éta" },
      { ru: "поэ'т", pt: "poeta", tr: "paét" },
      { ru: "мэр", pt: "prefeito", tr: "mer" },
    ],
    lookalikes: [{ char: "З", note: "З (z) é aberto para a esquerda; Э para a direita." }],
  },
  {
    upper: "Ю", lower: "ю", name: "ю", nameTr: "iu", sound: "iu", kind: "vogal",
    explain: "Soa «iu», como em «iuiu». Depois de consoante, amolece a consoante: люблю' soa «liubliú».",
    examples: [
      { ru: "юг", pt: "sul", tr: "iuk" },
      { ru: "люблю'", pt: "eu amo / eu gosto", tr: "liubliú" },
      { ru: "ю'бка", pt: "saia", tr: "iúpka" },
    ],
    lookalikes: [{ char: "IO", note: "Parece «I» e «O» grudados — e soa mesmo «i» + «u»." }],
  },
  {
    upper: "Я", lower: "я", name: "я", nameTr: "ia", sound: "ia", kind: "vogal",
    explain: "Soa «iá». Sozinha, я é a palavra «eu». Depois de consoante, amolece a consoante.",
    pitfall: "Fora da sílaba tônica fica parecido com «i»: язы'к soa «yizýk».",
    examples: [
      { ru: "я", pt: "eu", tr: "ia" },
      { ru: "моя'", pt: "minha", tr: "maiá" },
      { ru: "Росси'я", pt: "Rússia", tr: "rassíia" },
    ],
    lookalikes: [{ char: "R", note: "Parece um R espelhado, mas soa «iá»." }],
  },
];

/** Letra pela forma maiúscula ou minúscula. */
export function letterOf(ch: string): Letter | undefined {
  return ALPHABET.find((l) => l.upper === ch || l.lower === ch);
}
