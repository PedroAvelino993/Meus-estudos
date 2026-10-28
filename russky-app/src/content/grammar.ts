// Tópicos de gramática. Cada um é apresentado dentro das lições quando é necessário
// e fica disponível na seção Gramática para consulta e prática.

import type { GrammarTopic } from "../core/types";

export const GRAMMAR: GrammarTopic[] = [
  {
    id: "pronuncia",
    title: "Acento tônico e redução das vogais",
    level: "Pré-A1",
    summary: "Fora da sílaba tônica, о soa «a» e е/я soam perto de «i».",
    body: [
      "Toda palavra russa tem **uma sílaba tônica**, mais forte e mais longa. Nos materiais didáticos ela é marcada com um acento (молоко́); nos textos comuns, não.",
      "Quando **о** não é tônico, ele soa como um «a» curto: молоко́ = «malakó», хорошо́ = «kharashó». Isso se chama «akanie» e é típico da pronúncia de Moscou.",
      "Quando **е** e **я** não são tônicos, ficam parecidos com um «i» curto: сестра́ = «sistrá», язы́к = «yizýk».",
      "O acento não segue uma regra fixa e pode mudar entre as formas da mesma palavra (вода́ → во́ду). Por isso é importante aprender cada palavra já com o acento.",
    ],
    examples: [
      { ru: "молоко'", pt: "leite", note: "«malakó»" },
      { ru: "окно'", pt: "janela", note: "«aknó»" },
      { ru: "го'род", pt: "cidade", note: "«górat» — o segundo о é átono" },
      { ru: "сестра'", pt: "irmã", note: "«sistrá»" },
    ],
    compare: "Em português também reduzimos vogais átonas (o «o» final de «gato» soa «u»), mas no russo a mudança acontece em qualquer posição da palavra.",
    mistakes: [
      { wrong: "«molokó»", right: "«malakó»", why: "Só o О tônico soa «o»." },
      { wrong: "Ler todas as vogais com a mesma força", right: "Destacar só a sílaba tônica", why: "A sílaba tônica muda o ritmo e às vezes o sentido da palavra." },
    ],
    practice: [
      { t: "choice", skill: "leitura", prompt: "Como soa хорошо́?", ru: "хорошо'", options: ["kharashó", "khoroshó", "kharóshu"], answer: 0, explain: "Só o último О é tônico: kha-ra-SHÓ." },
      { t: "choice", skill: "leitura", prompt: "Como soa го́род?", ru: "го'род", options: ["górat", "garód", "górod"], answer: 0, explain: "O acento está no primeiro О; o segundo vira «a» e o д final vira «t»." },
      { t: "choice", skill: "leitura", prompt: "Em сестра́, o primeiro е soa…", ru: "сестра'", options: ["como um «i» curto", "como «é» aberto", "não se pronuncia"], answer: 0, explain: "е átono soa perto de «i»: «sistrá»." },
    ],
  },
  {
    id: "ty-vy",
    title: "Ты e вы: informal e formal",
    level: "A1",
    summary: "ты para amigos e família; вы para desconhecidos, pessoas mais velhas e mais de uma pessoa.",
    body: [
      "O russo tem duas formas para «você». **ты** é íntimo: amigos, família, crianças, colegas da mesma idade.",
      "**вы** é educado (como «o senhor / a senhora») e também é o plural («vocês»). Use вы com desconhecidos, atendentes, professores e pessoas mais velhas.",
      "Os cumprimentos acompanham: Приве́т (ты) × Здра́вствуйте (вы); Пока́ (ты) × До свида́ния (вы); Извини́ (ты) × Извини́те (вы).",
      "Passar do вы para o ты é um passo de intimidade. Na dúvida, comece com вы — a pessoa pode sugerir «Дава́й на ты» («Vamos nos tratar por ты»).",
    ],
    examples: [
      { ru: "Приве'т! Как дела'?", pt: "Oi! Como vai? (informal)" },
      { ru: "Здра'вствуйте! Как у вас дела'?", pt: "Olá! Como vai o senhor? (formal)" },
      { ru: "Извини'те, вы говори'те по-англи'йски?", pt: "Com licença, o senhor fala inglês?" },
    ],
    compare: "Parecido com «tu/você» × «o senhor/a senhora», mas o russo usa o formal com muito mais frequência — inclusive com qualquer adulto desconhecido.",
    mistakes: [
      { wrong: "Приве'т! (para a professora)", right: "Здра'вствуйте!", why: "Com professores usa-se sempre o formal." },
      { wrong: "Здра'вствуйте! Как тебя' зову'т?", right: "Здра'вствуйте! Как вас зову'т?", why: "Misturar formal e informal soa estranho." },
    ],
    practice: [
      { t: "choice", skill: "gramatica", prompt: "Você quer perguntar algo a um atendente desconhecido. Como começa?", options: ["Извини'те…", "Извини'…"], answer: 0, explain: "Com desconhecidos, sempre o formal: Извини'те." },
      { t: "gap", ru: "Приве'т, Макс! Как у ___ дела'?", answer: ["тебя'"], options: ["тебя'", "вас"], pt: "Oi, Max! Como vão as coisas com você?", explain: "Com um amigo (Приве'т), use a forma de ты: у тебя'." },
      { t: "fix", wrong: "До свида'ния, Макси'м! Пока'!", right: ["Пока', Макси'м!", "До свида'ния, Макси'м!"], pt: "Tchau, Maksim!", explain: "Escolha um registro só: Пока' (informal) ou До свида'ния (formal)." },
    ],
  },
  {
    id: "menya-zovut",
    title: "Меня зовут: dizendo o nome",
    level: "A1",
    summary: "Literalmente «me chamam»: меня́ é o objeto do verbo.",
    body: [
      "Para dizer o nome, o russo usa **Меня́ зову́т + nome**. Literalmente: «(eles) me chamam Anya».",
      "Por isso o pronome muda: меня́ (me), тебя́ (te), вас (o senhor), его́ (o), её (a).",
      "Perguntas: **Как тебя́ зову́т?** (informal) / **Как вас зову́т?** (formal).",
    ],
    examples: [
      { ru: "Меня' зову'т Ива'н.", pt: "Meu nome é Ivan." },
      { ru: "Как вас зову'т?", pt: "Como o senhor se chama?" },
      { ru: "Её зову'т А'ня.", pt: "O nome dela é Anya." },
    ],
    compare: "Parecido com o espanhol «me llamo», mas sem o verbo reflexivo: é «me chamam».",
    mistakes: [
      { wrong: "Я зову'т А'ня.", right: "Меня' зову'т А'ня.", why: "зову'т pede меня', não я." },
      { wrong: "Меня' зову'т есть А'ня.", right: "Меня' зову'т А'ня.", why: "Não se acrescenta «é»." },
    ],
    practice: [
      { t: "gap", ru: "Как ___ зову'т? (formal)", answer: ["вас"], options: ["вас", "тебя'", "вы"], pt: "Como o senhor se chama?", explain: "Formal: Как вас зову'т?" },
      { t: "gap", ru: "___ зову'т Макси'м.", answer: ["Меня'"], options: ["Меня'", "Я", "Мне"], pt: "Meu nome é Maksim.", explain: "Меня' зову'т…" },
      { t: "fix", wrong: "Я зову'т Со'ня.", right: ["Меня' зову'т Со'ня."], pt: "Meu nome é Sônia.", explain: "Com зову'т, use меня'." },
    ],
  },
  {
    id: "sem-byt",
    title: "Sem verbo «ser» no presente",
    level: "A1",
    summary: "«Eu sou estudante» = Я студе́нт. O presente não usa o verbo «ser/estar».",
    body: [
      "No presente, o russo **omite o verbo ser/estar**: Я студе́нт = «Eu (sou) estudante». Он до́ма = «Ele (está) em casa».",
      "Também **não há artigos** (o, a, um, uma): Э́то кот = «Isto é um gato» ou «É o gato», conforme o contexto.",
      "Na escrita, às vezes aparece um travessão entre dois substantivos: Мой брат — врач (Meu irmão é médico).",
      "A pergunta se faz pela entonação: Ты студе́нт? (Você é estudante?) — a voz sobe na palavra principal.",
    ],
    examples: [
      { ru: "Я студе'нт.", pt: "Eu sou estudante." },
      { ru: "Она' до'ма.", pt: "Ela está em casa." },
      { ru: "Мой брат — врач.", pt: "Meu irmão é médico." },
      { ru: "Ты студе'нт?", pt: "Você é estudante?" },
    ],
    compare: "Em português o verbo é obrigatório. Em russo ele aparece no passado (был, была́) e no futuro (бу́ду), mas não no presente.",
    mistakes: [
      { wrong: "Я есть студе'нт.", right: "Я студе'нт.", why: "есть não traduz «sou»; ele significa «há/existe»." },
    ],
    practice: [
      { t: "sentence", s: { ru: ["Он врач.", "Он — врач."], pt: "Ele é médico.", extra: ["есть", "она'"] }, modes: ["build"] },
      { t: "fix", wrong: "Она' есть студе'нтка.", right: ["Она' студе'нтка."], pt: "Ela é estudante.", explain: "No presente, sem verbo: Она' студе'нтка." },
      { t: "choice", skill: "gramatica", prompt: "Como se diz «Isto é um livro»?", options: ["Э'то кни'га.", "Э'то есть кни'га.", "Э'то оди'н кни'га."], answer: 0, explain: "Sem verbo e sem artigo: Э'то кни'га." },
    ],
  },
  {
    id: "genero",
    title: "Gênero dos substantivos",
    level: "A1",
    summary: "Masculino (consoante), feminino (-а/-я), neutro (-о/-е). Termina em -ь? Precisa decorar.",
    body: [
      "Todo substantivo russo tem gênero: **masculino, feminino ou neutro**. Normalmente a terminação mostra qual é.",
      "**Masculino**: termina em consoante ou -й: стол, брат, чай.",
      "**Feminino**: termina em -а ou -я: ма́ма, кни́га, семья́.",
      "**Neutro**: termina em -о ou -е: окно́, молоко́, мо́ре.",
      "Palavras em **-ь** podem ser masculinas (день) ou femininas (крова́ть, мать, соль) — aprenda junto com a palavra.",
      "Exceções: homens com -а são masculinos (па́па, де́душка, мужчи́на). E ко́фе é masculino.",
      "O gênero importa porque as palavras que acompanham concordam: мой брат, моя́ сестра́, моё окно́.",
    ],
    examples: [
      { ru: "мой стол", pt: "minha mesa (masc.)" },
      { ru: "моя' кни'га", pt: "meu livro (fem.)" },
      { ru: "моё окно'", pt: "minha janela (neutro)" },
      { ru: "мой па'па", pt: "meu pai (masc., apesar do -а)" },
    ],
    compare: "O gênero russo nem sempre coincide com o português: стол (mesa) é masculino, кни́га (livro) é feminino.",
    mistakes: [
      { wrong: "моя' стол", right: "мой стол", why: "стол termina em consoante: masculino." },
      { wrong: "моя' па'па", right: "мой па'па", why: "Homens são masculinos mesmo com -а." },
    ],
    practice: [
      { t: "choice", skill: "gramatica", prompt: "Qual é o gênero de окно́?", options: ["Neutro", "Masculino", "Feminino"], answer: 0, explain: "Termina em -о: neutro." },
      { t: "choice", skill: "gramatica", prompt: "Qual é o gênero de сестра́?", options: ["Feminino", "Neutro", "Masculino"], answer: 0, explain: "Termina em -а: feminino." },
      { t: "gap", ru: "Э'то ___ де'душка.", answer: ["мой"], options: ["мой", "моя'"], pt: "Este é o meu avô.", explain: "де'душка é homem: masculino → мой." },
    ],
  },
  {
    id: "possessivos",
    title: "Meu, teu, dele, dela",
    level: "A1",
    summary: "мой/моя́/моё e твой/твоя́/твоё concordam com a coisa possuída; его́ e её não mudam.",
    body: [
      "**мой** (meu) e **твой** (teu/seu, informal) concordam com o gênero da coisa: мой брат, моя́ сестра́, моё окно́.",
      "**его́** (dele) e **её** (dela) **nunca mudam**: его́ брат, его́ сестра́, её брат, её сестра́.",
      "Atenção à pronúncia: его́ soa «yivó», com «v».",
    ],
    examples: [
      { ru: "Э'то моя' ма'ма.", pt: "Esta é a minha mãe." },
      { ru: "Э'то твой ко'фе?", pt: "Este é o seu café?" },
      { ru: "Его' сестра' — студе'нтка.", pt: "A irmã dele é estudante." },
    ],
    compare: "Como em português (meu/minha), mas com três gêneros. E «dele/dela» também ficam antes do substantivo: его́ брат = o irmão dele.",
    mistakes: [
      { wrong: "Его'я сестра'", right: "Его' сестра'", why: "его' não muda com o gênero." },
      { wrong: "Моя' брат", right: "Мой брат", why: "брат é masculino." },
    ],
    practice: [
      { t: "gap", ru: "Где ___ ко'фе? (meu)", answer: ["мой"], options: ["мой", "моя'", "моё"], pt: "Onde está o meu café?", explain: "ко'фе é masculino." },
      { t: "gap", ru: "Э'то ___ я'блоко? (teu)", answer: ["твоё"], options: ["твоё", "твой", "твоя'"], pt: "Esta maçã é sua?", explain: "я'блоко é neutro → твоё." },
      { t: "gap", ru: "Э'то А'ня и ___ брат.", answer: ["её"], options: ["её", "его'", "моя'"], pt: "Esta é a Anya e o irmão dela.", explain: "O irmão da Anya = её брат (dela)." },
    ],
  },
  {
    id: "iz-genitivo",
    title: "Я из Бразилии: dizendo a origem",
    level: "A1",
    summary: "из (de) faz a palavra seguinte mudar: Бразилия → из Бразилии.",
    body: [
      "Para dizer de onde você é: **Я из + lugar**. Depois de из, o nome muda de forma — é o **caso genitivo**.",
      "Por enquanto, guarde os modelos: Росси́я → из Росси́и; Брази́лия → из Брази́лии; Москва́ → из Москвы́; Пари́ж → из Пари́жа.",
      "Regra geral do genitivo singular: -а → -ы (ou -и depois de г, к, х, ж, ш, ч, щ); -я e -ия → -и/-ии; consoante → +а.",
      "Nomes estrangeiros terminados em vogal que não seja -а/-я normalmente não mudam: из Сан-Па́улу, из Торо́нто.",
    ],
    examples: [
      { ru: "Я из Брази'лии.", pt: "Eu sou do Brasil." },
      { ru: "А'ня из Москвы'.", pt: "A Anya é de Moscou." },
      { ru: "Отку'да вы? — Я из Росси'и.", pt: "De onde o senhor é? — Sou da Rússia." },
    ],
    compare: "Em português só muda a preposição (de + o = do). Em russo muda o próprio substantivo.",
    mistakes: [
      { wrong: "Я из Брази'лия.", right: "Я из Брази'лии.", why: "Depois de из, o nome vai para o genitivo." },
    ],
    practice: [
      { t: "gap", ru: "Она' из ___.", answer: ["Росси'и"], options: ["Росси'и", "Росси'я", "Росси'ю"], pt: "Ela é da Rússia.", explain: "-ия → -ии depois de из." },
      { t: "gap", ru: "Я из ___. (Moscou)", answer: ["Москвы'"], options: ["Москвы'", "Москва'", "Москве'"], pt: "Sou de Moscou.", explain: "-а → -ы: Москва' → из Москвы'." },
      { t: "fix", wrong: "Мой друг из Брази'лия.", right: ["Мой друг из Брази'лии."], pt: "Meu amigo é do Brasil.", explain: "из + genitivo: Брази'лии." },
    ],
  },
  {
    id: "negacao",
    title: "Negação: не e нет",
    level: "A1",
    summary: "не antes da palavra negada; нет como resposta ou «não há».",
    body: [
      "**не** fica imediatamente antes do que se nega, normalmente o verbo: Я не понима́ю (Eu não entendo).",
      "**нет** é o «não» como resposta: Ты студе́нт? — Нет. Também significa «não há»: Хле́ба нет (Não há pão).",
      "É comum usar os dois juntos: Нет, я не студе́нт (Não, eu não sou estudante).",
    ],
    examples: [
      { ru: "Я не зна'ю.", pt: "Eu não sei." },
      { ru: "Нет, спаси'бо.", pt: "Não, obrigado." },
      { ru: "Нет, я не говорю' по-ру'сски.", pt: "Não, eu não falo russo." },
    ],
    compare: "Igual ao português «não sei», com не no lugar de «não». Só a resposta isolada usa нет.",
    mistakes: [
      { wrong: "Я нет понима'ю.", right: "Я не понима'ю.", why: "Antes do verbo é не." },
    ],
    practice: [
      { t: "gap", ru: "Я ___ рабо'таю в суббо'ту.", answer: ["не"], options: ["не", "нет"], pt: "Eu não trabalho no sábado.", explain: "Antes do verbo: не." },
      { t: "gap", ru: "Ты студе'нт? — ___, я врач.", answer: ["Нет"], options: ["Нет", "Не"], pt: "Você é estudante? — Não, sou médico.", explain: "Resposta: нет." },
      { t: "sentence", s: { ru: ["Я не понима'ю."], pt: "Eu não entendo.", extra: ["нет"] }, modes: ["type"] },
    ],
  },
  {
    id: "idade",
    title: "Idade: Мне 20 лет",
    level: "A1",
    summary: "A idade usa мне (para mim) e год/года/лет conforme o número.",
    body: [
      "Para dizer a idade: **Мне + número + год/го́да/лет**. Literalmente «para mim (são) X anos».",
      "Perguntas: **Ско́лько тебе́ лет?** (informal) / **Ско́лько вам лет?** (formal).",
      "A palavra «ano» muda com o número (olhe o último algarismo): **1 → год** (21 год); **2, 3, 4 → го́да** (22 го́да); **5–9 e 0 → лет** (25 лет, 30 лет).",
      "Exceção: **11 a 14 pedem лет** (11 лет, 12 лет, 14 лет), porque terminam em «-на́дцать».",
    ],
    examples: [
      { ru: "Мне два'дцать оди'н год.", pt: "Tenho 21 anos." },
      { ru: "Мне три'дцать три го'да.", pt: "Tenho 33 anos." },
      { ru: "Мне два'дцать пять лет.", pt: "Tenho 25 anos." },
    ],
    compare: "Em português «tenho X anos» usa o verbo ter. Em russo é «para mim X anos», e a forma de «anos» depende do número.",
    mistakes: [
      { wrong: "Я два'дцать лет.", right: "Мне два'дцать лет.", why: "A idade usa мне." },
      { wrong: "Мне два'дцать два лет.", right: "Мне два'дцать два го'да.", why: "Terminado em 2 → го'да." },
    ],
    practice: [
      { t: "gap", ru: "Мне три'дцать ___.", answer: ["лет"], options: ["лет", "год", "го'да"], pt: "Tenho 30 anos.", explain: "Terminado em 0 → лет." },
      { t: "gap", ru: "Мне два'дцать три ___.", answer: ["го'да"], options: ["го'да", "лет", "год"], pt: "Tenho 23 anos.", explain: "Terminado em 3 → го'да." },
      { t: "gap", ru: "Ско'лько ___ лет? (informal)", answer: ["тебе'"], options: ["тебе'", "ты", "тебя'"], pt: "Quantos anos você tem?", explain: "Ско'лько тебе' лет?" },
    ],
  },
  {
    id: "u-menya-est",
    title: "У меня есть: o verbo «ter»",
    level: "A1",
    summary: "«Eu tenho» = У меня́ есть (literalmente «comigo existe»).",
    body: [
      "O russo diz «ter» de um jeito diferente: **У меня́ есть + o que você tem**. Literalmente: «junto de mim existe…».",
      "Mudando a pessoa: у меня́, у тебя́, у него́, у неё, у нас, у вас, у них.",
      "Pergunta: **У тебя́ есть брат?** Resposta curta: **Да, есть.**",
      "Quando o importante não é se existe, mas como é, o есть some: У меня́ больша́я семья́ (Tenho uma família grande).",
    ],
    examples: [
      { ru: "У меня' есть брат.", pt: "Eu tenho um irmão." },
      { ru: "У тебя' есть сестра'? — Да, есть.", pt: "Você tem irmã? — Tenho, sim." },
      { ru: "У вас есть хлеб?", pt: "Vocês têm pão?" },
    ],
    compare: "Lembra o português antigo «há comigo». A coisa possuída é o sujeito da frase.",
    mistakes: [
      { wrong: "Я есть брат.", right: "У меня' есть брат.", why: "«Ter» se diz com у + pessoa + есть." },
      { wrong: "У я есть брат.", right: "У меня' есть брат.", why: "Depois de у, я vira меня'." },
    ],
    practice: [
      { t: "gap", ru: "У ___ есть сестра'.", answer: ["меня'"], options: ["меня'", "я", "мне"], pt: "Eu tenho uma irmã.", explain: "у + меня'." },
      { t: "sentence", s: { ru: ["У тебя' есть кот?"], pt: "Você tem um gato?", ptAlt: ["Você tem gato?"], extra: ["ты"] }, modes: ["build"] },
      { t: "fix", wrong: "Я есть сестра'.", right: ["У меня' есть сестра'."], pt: "Eu tenho uma irmã.", explain: "Use У меня' есть…" },
    ],
  },
  {
    id: "presente-1",
    title: "Presente: verbos em -ать (1ª conjugação)",
    level: "A1",
    summary: "Tire o -ть e acrescente -ю, -ешь, -ет, -ем, -ете, -ют.",
    body: [
      "A maioria dos verbos terminados em **-ать** segue o mesmo modelo. Tire o **-ть** e acrescente a terminação:",
      "**я** -ю · **ты** -ешь · **он/она́** -ет · **мы** -ем · **вы** -ете · **они́** -ют",
      "Exemplo: чита́ть (ler) → я чита́ю, ты чита́ешь, он чита́ет, мы чита́ем, вы чита́ете, они́ чита́ют.",
      "O russo tem um só presente: «eu leio» e «eu estou lendo» são a mesma coisa — я чита́ю.",
    ],
    examples: [
      { ru: "Я рабо'таю.", pt: "Eu trabalho." },
      { ru: "Ты зна'ешь?", pt: "Você sabe?" },
      { ru: "Они' понима'ют.", pt: "Eles entendem." },
    ],
    compare: "Como os verbos em -ar do português, que também têm um modelo regular (eu falo, você fala…).",
    mistakes: [
      { wrong: "Я чита'ть.", right: "Я чита'ю.", why: "Depois de я, use a forma conjugada." },
      { wrong: "Ты чита'ет.", right: "Ты чита'ешь.", why: "ты sempre termina em -шь." },
    ],
    practice: [
      { t: "gap", ru: "Вы ___ (знать) А'ню?", answer: ["зна'ете"], options: ["зна'ете", "зна'ешь", "зна'ют"], pt: "Vocês conhecem a Anya?", explain: "вы → -ете." },
      { t: "gap", ru: "Я ___ (де'лать) сала'т.", answer: ["де'лаю"], options: ["де'лаю", "де'лает", "де'лать"], pt: "Eu estou fazendo uma salada.", explain: "я → -ю." },
      { t: "gap", ru: "Он ___ (чита'ть) журна'л.", answer: ["чита'ет"], options: ["чита'ет", "чита'ешь", "чита'ют"], pt: "Ele está lendo uma revista.", explain: "он → -ет." },
    ],
  },
  {
    id: "presente-2",
    title: "Presente: verbos em -ить (2ª conjugação)",
    level: "A1",
    summary: "-ю/-у, -ишь, -ит, -им, -ите, -ят/-ат: as terminações têm и.",
    body: [
      "Muitos verbos em **-ить** formam o presente com **и** nas terminações:",
      "**я** -ю · **ты** -ишь · **он/она́** -ит · **мы** -им · **вы** -ите · **они́** -ят",
      "говори́ть (falar) → я говорю́, ты говори́шь, он говори́т, мы говори́м, вы говори́те, они́ говоря́т.",
      "Alguns mudam a consoante só na forma «я»: люби́ть → я люблю́, mas ты лю́бишь.",
    ],
    examples: [
      { ru: "Я говорю' по-ру'сски.", pt: "Eu falo russo." },
      { ru: "Ты лю'бишь чай?", pt: "Você gosta de chá?" },
      { ru: "Они' говоря'т о'чень бы'стро.", pt: "Eles falam muito rápido." },
    ],
    compare: "Parecido com os verbos em -er/-ir do português, que mudam a vogal da terminação.",
    mistakes: [
      { wrong: "Ты говоре'шь.", right: "Ты говори'шь.", why: "Na 2ª conjugação a terminação tem и." },
      { wrong: "Я лю'бю.", right: "Я люблю'.", why: "люби'ть ganha um л na forma «я»." },
    ],
    practice: [
      { t: "gap", ru: "Мы ___ по-португа'льски.", answer: ["говори'м"], options: ["говори'м", "говори'т", "говори'шь"], pt: "Nós falamos português.", explain: "мы → -им." },
      { t: "gap", ru: "Ты ___ ко'фе?", answer: ["лю'бишь"], options: ["лю'бишь", "люблю'", "лю'бит"], pt: "Você gosta de café?", explain: "ты → -ишь: лю'бишь." },
      { t: "gap", ru: "Они' ___ по-ру'сски.", answer: ["говоря'т"], options: ["говоря'т", "говори'т", "говори'те"], pt: "Eles falam russo.", explain: "они' → -ят." },
    ],
  },
  {
    id: "acusativo",
    title: "O objeto direto (acusativo)",
    level: "A1",
    summary: "Objeto feminino em -а/-я vira -у/-ю. Masculino e neutro (coisas) não mudam.",
    body: [
      "Quando uma palavra é o **objeto direto** (o que você quer, ama, vê, compra), ela vai para o **caso acusativo**.",
      "**Femininos** em -а → **-у**; em -я → **-ю**: вода́ → Я хочу́ во́ду; ча́шка → ча́шку.",
      "**Masculinos e neutros que são coisas não mudam**: Я хочу́ чай. Я люблю́ молоко́.",
      "Pessoas e animais masculinos mudam (brat → бра́та), mas isso vem depois.",
    ],
    examples: [
      { ru: "Я хочу' во'ду.", pt: "Quero água." },
      { ru: "Я люблю' Москву'.", pt: "Eu amo Moscou." },
      { ru: "Ты хо'чешь чай?", pt: "Você quer chá?", note: "чай não muda" },
    ],
    compare: "Em português a palavra não muda: «quero água». Em russo a terminação mostra que ela é o objeto.",
    mistakes: [
      { wrong: "Я хочу' вода'.", right: "Я хочу' во'ду.", why: "Objeto feminino: -а → -у." },
      { wrong: "Я хочу' ча'ю.", right: "Я хочу' чай.", why: "Masculino (coisa) não muda no acusativo." },
    ],
    practice: [
      { t: "gap", ru: "Я люблю' ___. (Moscou)", answer: ["Москву'"], options: ["Москву'", "Москва'", "Москве'"], pt: "Eu amo Moscou.", explain: "Objeto feminino: -а → -у." },
      { t: "gap", ru: "Я хочу' ___. (chá)", answer: ["чай"], options: ["чай", "чая", "чаю"], pt: "Eu quero chá.", explain: "Masculino (coisa): não muda." },
      { t: "gap", ru: "Да'йте ___, пожа'луйста. (xícara)", answer: ["ча'шку"], options: ["ча'шку", "ча'шка"], pt: "Me dê uma xícara, por favor.", explain: "ча'шка → ча'шку." },
    ],
  },
  {
    id: "prepositivo",
    title: "Onde? в/на + caso prepositivo",
    level: "A1",
    summary: "Para dizer onde: в/на + a palavra com -е (Москва → в Москве).",
    body: [
      "Para responder **«Onde?» (Где?)**, use **в** (em, dentro de) ou **на** (sobre, em certos lugares) + a palavra no **caso prepositivo**.",
      "Na maioria das palavras basta trocar ou acrescentar **-е**: Москва́ → в Москве́; стол → на столе́; ко́мната → в ко́мнате; окно́ → на окне́.",
      "Palavras em **-ия** viram **-ии**: Росси́я → в Росси́и; ста́нция → на ста́нции. Femininas em **-ь** ganham **-и**: крова́ть → на крова́ти.",
      "**в** × **на**: в é «dentro» (в до́ме, в шко́ле); на é «em cima» ou eventos e lugares abertos (на столе́, на рабо́те, на у́лице, на ку́хне, на вокза́ле). Algumas combinações se decoram.",
      "Palavras estrangeiras que não mudam ficam iguais: в метро́, в кафе́, в Сан-Па́улу.",
    ],
    examples: [
      { ru: "Я живу' в Москве'.", pt: "Eu moro em Moscou.", note: "Москва' → Москве'" },
      { ru: "Ма'ма на ку'хне.", pt: "A mamãe está na cozinha." },
      { ru: "Кни'га на столе'.", pt: "O livro está na mesa." },
      { ru: "Я рабо'таю в кафе'.", pt: "Eu trabalho num café.", note: "кафе' não muda" },
    ],
    compare: "Em português só a preposição muda (em + a = na). Em russo a palavra também muda de terminação.",
    mistakes: [
      { wrong: "Я живу' в Москва'.", right: "Я живу' в Москве'.", why: "Depois de в (lugar), a palavra ganha -е." },
      { wrong: "Я на Брази'лии.", right: "Я в Брази'лии.", why: "Países e cidades usam в." },
    ],
    practice: [
      { t: "gap", ru: "Я живу' в ___. (Rússia)", answer: ["Росси'и"], options: ["Росси'и", "Росси'я", "Росси'е"], pt: "Eu moro na Rússia.", explain: "-ия → -ии." },
      { t: "gap", ru: "Кот на ___. (mesa)", answer: ["столе'"], options: ["столе'", "стол", "стола'"], pt: "O gato está na mesa.", explain: "Masculino: + -е: стол → на столе'." },
      { t: "gap", ru: "Па'па ___ рабо'те.", answer: ["на"], options: ["на", "в"], pt: "O papai está no trabalho.", explain: "рабо'та usa на: на рабо'те." },
      { t: "fix", wrong: "Мы в Москва'.", right: ["Мы в Москве'."], pt: "Estamos em Moscou.", explain: "в + prepositivo: Москве'." },
    ],
  },
  {
    id: "dias",
    title: "Quando? в + dia da semana",
    level: "A1",
    summary: "«Na segunda» = в понеде́льник. Dias femininos trocam -а por -у.",
    body: [
      "Para dizer em que dia algo acontece, use **в + dia no acusativo**.",
      "Dias masculinos não mudam: **в понеде́льник, во вто́рник, в четве́рг**. (Antes de вт- usa-se во, para facilitar a pronúncia.)",
      "Dias femininos trocam -а por -у: **в сре́ду, в пя́тницу, в суббо́ту**. Em среда́ o acento também muda: в сре́ду.",
      "Neutro não muda: **в воскресе́нье**.",
    ],
    examples: [
      { ru: "В понеде'льник я рабо'таю.", pt: "Na segunda eu trabalho." },
      { ru: "В суббо'ту мы до'ма.", pt: "No sábado estamos em casa." },
      { ru: "Во вто'рник у меня' футбо'л.", pt: "Na terça eu tenho futebol." },
    ],
    mistakes: [
      { wrong: "В суббо'та", right: "В суббо'ту", why: "Dia feminino: -а → -у." },
      { wrong: "В вто'рник", right: "Во вто'рник", why: "Antes de вт- a preposição vira во." },
    ],
    practice: [
      { t: "gap", ru: "В ___ я до'ма. (sexta)", answer: ["пя'тницу"], options: ["пя'тницу", "пя'тница", "пя'тнице"], pt: "Na sexta estou em casa.", explain: "-а → -у." },
      { t: "gap", ru: "___ вто'рник я рабо'таю.", answer: ["Во"], options: ["Во", "В", "На"], pt: "Na terça eu trabalho.", explain: "во вто'рник." },
      { t: "gap", ru: "В ___ я чита'ю. (domingo)", answer: ["воскресе'нье"], options: ["воскресе'нье", "воскресе'нью"], pt: "No domingo eu leio.", explain: "Neutro não muda." },
    ],
  },
  {
    id: "numeros-substantivos",
    title: "Números + substantivos",
    level: "A1",
    summary: "1 → рубль; 2–4 → рубля́; 5+ → рубле́й. O mesmo padrão de год/го́да/лет.",
    body: [
      "Depois de um número, o substantivo muda conforme o **último algarismo**:",
      "**1** → forma básica: оди́н рубль, два́дцать оди́н рубль.",
      "**2, 3, 4** → genitivo singular: два рубля́, три часа́, четы́ре го́да.",
      "**5 a 20, e terminados em 0, 5–9** → genitivo plural: пять рубле́й, де́сять часо́в, сто лет.",
      "Os números de **11 a 14** sempre pedem a forma de 5+: оди́ннадцать рубле́й.",
    ],
    examples: [
      { ru: "оди'н рубль", pt: "um rublo" },
      { ru: "три рубля'", pt: "três rublos" },
      { ru: "сто рубле'й", pt: "cem rublos" },
      { ru: "пять часо'в", pt: "cinco horas" },
    ],
    mistakes: [
      { wrong: "пять рубля'", right: "пять рубле'й", why: "5 ou mais → рубле'й." },
    ],
    practice: [
      { t: "gap", ru: "два ___", answer: ["рубля'"], options: ["рубля'", "рубле'й", "рубль"], pt: "dois rublos", explain: "2 → рубля'." },
      { t: "gap", ru: "де'сять ___", answer: ["рубле'й"], options: ["рубле'й", "рубля'", "рубль"], pt: "dez rublos", explain: "10 → рубле'й." },
      { t: "gap", ru: "два'дцать оди'н ___", answer: ["рубль"], options: ["рубль", "рубля'", "рубле'й"], pt: "vinte e um rublos", explain: "Termina em 1 → рубль." },
    ],
  },
];

export function grammarOf(id: string): GrammarTopic | undefined {
  return GRAMMAR.find((g) => g.id === id);
}
