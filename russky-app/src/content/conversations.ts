// Missões de conversa. Cada nó tem as falas do personagem e as intenções que ele entende.
// Os padrões aceitam várias formulações (ver core/convo.ts). {name} = nome dito pelo estudante.

import type { Conversation } from "../core/convo";

const DA_NET_NAME = ["[меня] зовут {name}", "я {name}", "{name} меня зовут", "здравствуйте [меня] зовут {name}", "здравствуйте я {name}", "привет [меня] зовут {name}", "привет я {name}", "очень приятно [меня] зовут {name}", "очень приятно я {name}"];

export const CONVERSATIONS: Conversation[] = [
  // ------------------------------------------------------------------ Anya, na estação
  {
    id: "c-anya-vokzal",
    character: "anya",
    title: "Na plataforma",
    place: "vokzal",
    level: "A1",
    goal: "Cumprimentar, dizer o seu nome e de onde você é.",
    requires: ["u2-3"],
    skills: ["fala", "escrita", "audicao"],
    vocabulary: ["privet", "menya_zovut", "ochen_priyatno", "mne_tozhe", "poka", "do_zavtra", "da", "net", "spasibo", "khorosho"],
    start: "start",
    nodes: [
      {
        id: "start",
        say: [
          { ru: "Приве'т! Ты но'вый студе'нт? Я жду студе'нтов из Брази'лии.", pt: "Oi! Você é o estudante novo? Estou esperando estudantes do Brasil.", mood: "happy" },
        ],
        reply: {
          options: [
            { id: "da", ru: "Да, я студе'нт.", pt: "Sim, sou estudante.", patterns: ["да [я] [новый] (студент|студентка)", "да", "да это я", "привет да"], next: "name" },
            { id: "privet", ru: "Приве'т! Да, э'то я.", pt: "Oi! Sim, sou eu.", patterns: ["привет [да] [это я]", "здравствуйте [да] [это я]"], next: "name", note: "Cumprimentar de volta é sempre uma boa ideia." },
            { id: "net", ru: "Нет, я не студе'нт.", pt: "Não, não sou estudante.", patterns: ["нет [я не (студент|студентка)]", "я не (студент|студентка)"], next: "not-student", hiddenInEasy: true },
          ],
          retry: { ru: "Извини', я не поняла'. Ты студе'нт? Да и'ли нет?", pt: "Desculpa, não entendi. Você é estudante? Sim ou não?", mood: "thinking" },
        },
      },
      {
        id: "not-student",
        say: [
          { ru: "Нет? Ой, извини'! А, у тебя' в руке' кни'га «Ру'сский язы'к»… Ты студе'нт, да?", pt: "Não? Ai, desculpa! Ah, você tem na mão um livro «Língua Russa»… Você é estudante, né?", mood: "surprised" },
        ],
        reply: {
          options: [
            { id: "da2", ru: "Да, я студе'нт.", pt: "Sim, sou estudante.", patterns: ["да [я] [новый] (студент|студентка)", "да", "ну да", "да это я"], next: "name", set: { joked: true } },
          ],
          retry: { ru: "Ну, ты студе'нт и'ли нет?", pt: "Então, você é estudante ou não?", mood: "thinking" },
        },
      },
      {
        id: "name",
        say: [
          { ru: "Ха-ха, я так и зна'ла!", pt: "Ha-ha, eu sabia!", mood: "happy", if: { flag: "joked" } },
          { ru: "Отли'чно! Меня' зову'т А'ня. А как тебя' зову'т?", pt: "Ótimo! Meu nome é Anya. E como você se chama?", mood: "happy", alts: [{ ru: "Здо'рово! Я А'ня. А тебя' как зову'т?", pt: "Que legal! Eu sou a Anya. E como você se chama?" }] },
        ],
        reply: {
          options: [{ id: "name", ru: "Меня' зову'т {player}.", pt: "Meu nome é {player}.", patterns: DA_NET_NAME, next: "from" }],
          retry: { ru: "Как тебя' зову'т? Меня' — А'ня. А тебя'?", pt: "Como você se chama? Eu sou a Anya. E você?", mood: "thinking" },
        },
      },
      {
        id: "from",
        say: [{ ru: "О'чень прия'тно, {name}! А отку'да ты? Из Сан-Па'улу?", pt: "Muito prazer, {name}! E de onde você é? De São Paulo?", mood: "happy" }],
        reply: {
          options: [
            { id: "br", ru: "Я из Брази'лии.", pt: "Sou do Brasil.", patterns: ["[я] из бразилии", "я (бразилец|бразильянка)", "[нет] я из бразилии", "мне тоже очень приятно я из бразилии"], next: "lang", set: { from: "br" } },
            { id: "sp", ru: "Да, я из Сан-Па'улу.", pt: "Sim, sou de São Paulo.", patterns: ["да [я] [из сан-паулу]", "[я] из сан-паулу", "да из сан-паулу"], next: "lang", set: { from: "sp" } },
            { id: "rio", ru: "Нет, я из Рио-де-Жане'йро.", pt: "Não, sou do Rio de Janeiro.", patterns: ["нет [я] из рио-де-жанейро", "[я] из рио-де-жанейро", "[нет] [я] из рио"], next: "lang", set: { from: "rio" } },
            { id: "tozhe", ru: "Мне то'же о'чень прия'тно!", pt: "Igualmente!", patterns: ["мне тоже [очень приятно]", "очень приятно"], next: "from-again" },
          ],
          retry: { ru: "Отку'да ты? Из Брази'лии?", pt: "De onde você é? Do Brasil?", mood: "thinking" },
        },
      },
      {
        id: "from-again",
        say: [{ ru: "Ты о'чень ве'жливый! А отку'да ты?", pt: "Você é muito educado! E de onde você é?", mood: "happy" }],
        reply: {
          options: [
            { id: "br", ru: "Я из Брази'лии.", pt: "Sou do Brasil.", patterns: ["[я] из бразилии", "я (бразилец|бразильянка)"], next: "lang", set: { from: "br" } },
            { id: "sp", ru: "Я из Сан-Па'улу.", pt: "Sou de São Paulo.", patterns: ["[я] из сан-паулу"], next: "lang", set: { from: "sp" } },
          ],
          retry: { ru: "Отку'да ты? Из Брази'лии?", pt: "De onde você é? Do Brasil?", mood: "thinking" },
        },
      },
      {
        id: "lang",
        say: [
          { ru: "Сан-Па'улу! Э'то о'чень большо'й го'род.", pt: "São Paulo! É uma cidade muito grande.", mood: "surprised", if: { flag: "from", eq: "sp" } },
          { ru: "Рио! Я о'чень хочу' в Рио!", pt: "Rio! Eu quero muito ir ao Rio!", mood: "happy", if: { flag: "from", eq: "rio" } },
          { ru: "Брази'лия! Как здо'рово!", pt: "Brasil! Que legal!", mood: "happy", if: { flag: "from", eq: "br" } },
          { ru: "Ты говори'шь по-ру'сски?", pt: "Você fala russo?", mood: "neutral" },
        ],
        reply: {
          options: [
            { id: "little", ru: "Да, немно'го.", pt: "Sim, um pouco.", patterns: ["[да] [я] [говорю] немного [говорю] [по-русски]", "да немного", "немного"], next: "goodbye", set: { russian: "little" } },
            { id: "yes", ru: "Да, я говорю' по-ру'сски.", pt: "Sim, falo russo.", patterns: ["да [я] говорю [по-русски]", "да"], next: "goodbye", set: { russian: "yes" } },
            { id: "no", ru: "Нет, я не говорю' по-ру'сски.", pt: "Não, não falo russo.", patterns: ["нет [я] [не говорю] [по-русски]", "я не говорю [по-русски]"], next: "joke-no" },
            { id: "what", ru: "Извини', я не понима'ю.", pt: "Desculpa, não entendo.", patterns: ["[извини|извините] [я] не понимаю", "повторите [пожалуйста]", "что"], next: "slow" },
          ],
          retry: { ru: "Ты говори'шь по-ру'сски? Да и'ли нет?", pt: "Você fala russo? Sim ou não?", mood: "thinking" },
        },
      },
      {
        id: "slow",
        say: [{ ru: "Ничего'! Ме'дленно: ты… говори'шь… по-ру'сски?", pt: "Tudo bem! Devagar: você… fala… russo?", mood: "happy" }],
        reply: {
          options: [
            { id: "little", ru: "Да, немно'го.", pt: "Sim, um pouco.", patterns: ["[да] [я] [говорю] немного [по-русски]", "да"], next: "goodbye", set: { russian: "little" } },
            { id: "no", ru: "Нет, не говорю'.", pt: "Não, não falo.", patterns: ["нет [я] [не говорю] [по-русски]"], next: "joke-no" },
          ],
          retry: { ru: "По-ру'сски — да и'ли нет?", pt: "Russo — sim ou não?", mood: "thinking" },
        },
      },
      {
        id: "joke-no",
        say: [{ ru: "Ха-ха! Но ты сейча'с говори'шь по-ру'сски!", pt: "Ha-ha! Mas você está falando russo agora!", mood: "happy" }],
        next: "goodbye",
      },
      {
        id: "goodbye",
        say: [
          { ru: "Ты хорошо' говори'шь!", pt: "Você fala bem!", mood: "happy", if: { flag: "russian" } },
          { ru: "Ну всё, мне пора' на рабо'ту. За'втра в университе'те, хорошо'? Пока', {name}!", pt: "Bom, preciso ir trabalhar. Amanhã na universidade, combinado? Tchau, {name}!", mood: "happy" },
        ],
        reply: {
          options: [
            { id: "poka", ru: "Пока', А'ня! До за'втра!", pt: "Tchau, Anya! Até amanhã!", patterns: ["пока [аня] [до завтра]", "до завтра [аня]", "хорошо [пока] [аня] [до завтра]", "спасибо [аня] пока [до завтра]"], next: "end" },
            { id: "formal", ru: "До свида'ния, А'ня!", pt: "Até logo, Anya!", patterns: ["до свидания [аня]"], next: "end", note: "Funciona, mas com uma amiga da sua idade soa formal. Entre amigos: Пока'!", set: { formalBye: true } },
          ],
          retry: { ru: "Пока'!", pt: "Tchau!", mood: "happy" },
        },
      },
      {
        id: "end",
        say: [
          { ru: "Ой, как форма'льно! Ха-ха. Пока'!", pt: "Nossa, que formal! Ha-ha. Tchau!", mood: "happy", if: { flag: "formalBye" } },
          { ru: "До за'втра!", pt: "Até amanhã!", mood: "happy", if: { flag: "formalBye", not: true } },
        ],
        end: true,
      },
    ],
  },

  // ------------------------------------------------------------------ Irina, primeira aula
  {
    id: "c-irina-urok",
    character: "irina",
    title: "Primeira aula",
    place: "universitet",
    level: "A1",
    goal: "Apresentar-se no registro formal, dizer onde mora e falar da família.",
    requires: ["u3-2"],
    skills: ["fala", "escrita", "gramatica"],
    vocabulary: ["zdravstvuyte", "menya_zovut", "iz", "braziliya", "zhivu", "u_menya_est", "brat", "sestra", "do_svidaniya"],
    start: "start",
    nodes: [
      {
        id: "start",
        say: [
          { ru: "Здра'вствуйте! Меня' зову'т Ири'на Петро'вна. Я ваш преподава'тель.", pt: "Olá! Meu nome é Irina Petrovna. Sou sua professora.", mood: "happy" },
          { ru: "Как вас зову'т?", pt: "Como o senhor/a senhora se chama?", mood: "neutral" },
        ],
        reply: {
          options: [
            { id: "formal", ru: "Здра'вствуйте! Меня' зову'т {player}.", pt: "Olá! Meu nome é {player}.", patterns: ["здравствуйте [меня] зовут {name}", "здравствуйте я {name}", "здравствуйте ирина петровна [меня] зовут {name}", "[меня] зовут {name}", "я {name}"], next: "from" },
            { id: "informal", ru: "Приве'т! Я {player}.", pt: "Oi! Eu sou {player}.", patterns: ["привет [меня] зовут {name}", "привет я {name}"], next: "informal", set: { visitedInformal: true }, note: "Приве'т é informal demais para uma professora. Use Здра'вствуйте." },
          ],
          retry: { ru: "Извини'те, я не поняла'. Как вас зову'т? Меня' зову'т…", pt: "Desculpe, não entendi. Como o senhor/a senhora se chama? Meu nome é…", mood: "thinking" },
        },
      },
      {
        id: "informal",
        say: [{ ru: "«Приве'т» — э'то для друзе'й. Преподава'телю мы говори'м «Здра'вствуйте». Но ничего'! О'чень прия'тно, {name}.", pt: "«Привет» é para amigos. Para a professora dizemos «Здравствуйте». Mas tudo bem! Muito prazer, {name}.", mood: "happy" }],
        next: "from",
      },
      {
        id: "from",
        say: [
          { ru: "О'чень прия'тно, {name}. Отку'да вы?", pt: "Muito prazer, {name}. De onde o senhor/a senhora é?", mood: "neutral", if: { flag: "visitedInformal", not: true } },
          { ru: "Отку'да вы?", pt: "De onde o senhor/a senhora é?", mood: "neutral", if: { flag: "visitedInformal" } },
        ],
        reply: {
          options: [
            { id: "br", ru: "Я из Брази'лии.", pt: "Sou do Brasil.", patterns: ["[я] из бразилии", "я (бразилец|бразильянка)", "я из бразилии из сан-паулу", "я из сан-паулу"], next: "live" },
            { id: "ru", ru: "Я из Росси'и!", pt: "Sou da Rússia!", patterns: ["[я] из россии", "я (русский|русская)"], next: "joke", hiddenInEasy: true },
          ],
          retry: { ru: "Отку'да вы? Я, наприме'р, из Москвы'.", pt: "De onde o senhor/a senhora é? Eu, por exemplo, sou de Moscou.", mood: "thinking" },
        },
      },
      {
        id: "joke",
        say: [{ ru: "Пра'вда? Ха-ха, у вас о'чень интере'сный акце'нт! Я ду'маю, вы из Брази'лии.", pt: "Verdade? Ha-ha, o senhor/a senhora tem um sotaque muito interessante! Acho que é do Brasil.", mood: "happy" }],
        next: "live",
      },
      {
        id: "live",
        say: [{ ru: "А где вы живёте сейча'с?", pt: "E onde o senhor/a senhora mora agora?", mood: "neutral" }],
        reply: {
          options: [
            { id: "here", ru: "Я живу' в Светлоре'ченске.", pt: "Moro em Svetlorechensk.", patterns: ["[я] [живу] [сейчас] в светлореченске", "[я] [сейчас] живу [здесь|тут]", "здесь", "тут"], next: "family" },
            { id: "moscow", ru: "Я живу' в Москве'.", pt: "Moro em Moscou.", patterns: ["[я] [сейчас] живу в москве", "в москве"], next: "family" },
            { id: "obshchezhitie", ru: "Я живу' в общежи'тии.", pt: "Moro no alojamento estudantil.", patterns: ["[я] живу в общежитии", "в общежитии"], next: "family", hiddenInEasy: true },
          ],
          retry: { ru: "Где вы живёте? Я живу' в Светлоре'ченске. А вы?", pt: "Onde o senhor/a senhora mora? Eu moro em Svetlorechensk. E o senhor/a senhora?", mood: "thinking" },
        },
      },
      {
        id: "family",
        say: [{ ru: "Хорошо'. Расскажи'те о семье'. У вас есть брат и'ли сестра'?", pt: "Muito bem. Fale da sua família. O senhor/a senhora tem irmão ou irmã?", mood: "neutral" }],
        reply: {
          options: [
            { id: "brother", ru: "Да, у меня' есть брат.", pt: "Sim, tenho um irmão.", patterns: ["[да] [у меня] [есть] брат", "да есть брат"], next: "sibling-name", set: { sibling: "brat" } },
            { id: "sister", ru: "Да, у меня' есть сестра'.", pt: "Sim, tenho uma irmã.", patterns: ["[да] [у меня] [есть] сестра", "да есть сестра"], next: "sibling-name", set: { sibling: "sestra" } },
            { id: "both", ru: "Да, у меня' есть брат и сестра'.", pt: "Sim, tenho um irmão e uma irmã.", patterns: ["[да] [у меня] [есть] брат и сестра", "[да] [у меня] [есть] сестра и брат"], next: "both", set: { sibling: "both" } },
            { id: "none", ru: "Нет.", pt: "Não.", patterns: ["нет", "нет у меня нет", "у меня нет (брата|сестры)"], next: "none" },
          ],
          retry: { ru: "У вас есть брат? Сестра'? Наприме'р: «У меня' есть брат».", pt: "O senhor/a senhora tem irmão? Irmã? Por exemplo: «Eu tenho um irmão».", mood: "thinking" },
        },
      },
      {
        id: "sibling-name",
        say: [
          { ru: "Как его' зову'т?", pt: "Como ele se chama?", if: { flag: "sibling", eq: "brat" } },
          { ru: "Как её зову'т?", pt: "Como ela se chama?", if: { flag: "sibling", eq: "sestra" } },
        ],
        reply: {
          options: [
            { id: "his", ru: "Его' зову'т {other}.", pt: "Ele se chama {other}.", patterns: ["его зовут {other}", "[его] зовут {other}"], next: "end", if: { flag: "sibling", eq: "brat" } },
            { id: "hers", ru: "Её зову'т {other}.", pt: "Ela se chama {other}.", patterns: ["ее зовут {other}", "[ее] зовут {other}"], next: "end", if: { flag: "sibling", eq: "sestra" } },
            { id: "wrong-pron", ru: "Его' зову'т {other}.", pt: "Ele se chama {other}.", patterns: ["ее зовут {other}"], next: "end", if: { flag: "sibling", eq: "brat" }, note: "Para o irmão (ele), use его'. её é para ela." },
            { id: "wrong-pron2", ru: "Её зову'т {other}.", pt: "Ela se chama {other}.", patterns: ["его зовут {other}"], next: "end", if: { flag: "sibling", eq: "sestra" }, note: "Para a irmã (ela), use её. его' é para ele." },
            { id: "menya", ru: "Его' зову'т {other}.", pt: "Ele se chama {other}.", patterns: ["меня зовут {other}"], next: "end", note: "Меня' зову'т é «meu nome». Para falar do irmão ou da irmã, use его' (dele) ou её (dela)." },
          ],
          retry: { ru: "Наприме'р: «Его' зову'т Пе'дро».", pt: "Por exemplo: «Ele se chama Pedro».", mood: "thinking" },
        },
      },
      {
        id: "both",
        say: [{ ru: "Больша'я семья'! Э'то здо'рово.", pt: "Uma família grande! Que ótimo.", mood: "happy" }],
        next: "end",
      },
      {
        id: "none",
        say: [{ ru: "Поня'тно. А у меня' два бра'та!", pt: "Entendi. Eu tenho dois irmãos!", mood: "neutral" }],
        next: "end",
      },
      {
        id: "end",
        say: [
          { ru: "{other} — краси'вое и'мя!", pt: "{other} é um nome bonito!", mood: "happy", if: { flag: "otherSet" } },
          { ru: "Вы молоде'ц. На сего'дня всё. До свида'ния!", pt: "Muito bem. Por hoje é só. Até logo!", mood: "happy" },
        ],
        reply: {
          options: [
            { id: "bye", ru: "До свида'ния, Ири'на Петро'вна!", pt: "Até logo, Irina Petrovna!", patterns: ["до свидания [ирина петровна]", "спасибо до свидания [ирина петровна]", "спасибо [ирина петровна] до свидания", "до завтра [ирина петровна]"], next: "fin" },
            { id: "poka", ru: "До свида'ния!", pt: "Até logo!", patterns: ["пока [ирина петровна]"], next: "fin", note: "Пока' é informal. Com a professora: До свида'ния!" },
          ],
          retry: { ru: "До свида'ния!", pt: "Até logo!", mood: "happy" },
        },
      },
      { id: "fin", say: [{ ru: "До за'втра!", pt: "Até amanhã!", mood: "happy" }], end: true },
    ],
  },

  // ------------------------------------------------------------------ Anya, a família
  {
    id: "c-anya-semya",
    character: "anya",
    title: "Fotos da família",
    place: "kvartira",
    level: "A1",
    goal: "Falar da família, dizer a idade e usar meu/minha.",
    requires: ["u3-4"],
    skills: ["fala", "vocabulario", "gramatica"],
    vocabulary: ["semya", "mama", "papa", "brat", "sestra", "u_menya_est", "mne_let", "kot"],
    start: "start",
    nodes: [
      {
        id: "start",
        say: [
          { ru: "Смотри', э'то моя' семья'! Вот моя' ма'ма, её зову'т Ната'ша. А э'то мой кот Ба'рсик.", pt: "Olha, esta é a minha família! Aqui está a minha mãe, ela se chama Natasha. E este é o meu gato Barsik.", mood: "happy" },
          { ru: "А у тебя' есть кот?", pt: "E você, tem gato?", mood: "neutral" },
        ],
        reply: {
          options: [
            { id: "cat", ru: "Да, у меня' есть кот.", pt: "Sim, tenho um gato.", patterns: ["да [у меня] [есть] [кот]", "у меня есть кот", "да есть"], next: "cat-name", set: { pet: "cat" } },
            { id: "dog", ru: "Нет, у меня' есть соба'ка.", pt: "Não, tenho um cachorro.", patterns: ["[нет] [у меня] [есть] собака", "нет собака"], next: "dog", set: { pet: "dog" } },
            { id: "none", ru: "Нет, у меня' нет кота'.", pt: "Não, não tenho gato.", patterns: ["нет [у меня нет] [кота]", "нет"], next: "none" },
          ],
          retry: { ru: "У тебя' есть кот? Да и'ли нет?", pt: "Você tem gato? Sim ou não?", mood: "thinking" },
        },
      },
      {
        id: "cat-name",
        say: [{ ru: "Кла'сс! Как его' зову'т?", pt: "Que legal! Como ele se chama?", mood: "happy" }],
        reply: {
          options: [{ id: "n", ru: "Его' зову'т {other}.", pt: "Ele se chama {other}.", patterns: ["[его] зовут {other}", "это {other}"], next: "family" }],
          retry: { ru: "Как зову'т твоего' кота'? Наприме'р: «Его' зову'т Ба'рсик».", pt: "Como se chama o seu gato? Por exemplo: «Ele se chama Barsik».", mood: "thinking" },
        },
      },
      {
        id: "dog",
        say: [{ ru: "Соба'ка! Ба'рсик не лю'бит соба'к, ха-ха.", pt: "Um cachorro! O Barsik não gosta de cachorros, ha-ha.", mood: "happy" }],
        next: "family",
      },
      {
        id: "none",
        say: [{ ru: "Ничего'! Ба'рсик бу'дет и твой кот то'же.", pt: "Tudo bem! O Barsik vai ser seu gato também.", mood: "happy" }],
        next: "family",
      },
      {
        id: "family",
        say: [{ ru: "А у тебя' больша'я семья'? У тебя' есть брат и'ли сестра'?", pt: "E a sua família é grande? Você tem irmão ou irmã?", mood: "neutral" }],
        reply: {
          options: [
            { id: "brother", ru: "Да, у меня' есть брат.", pt: "Sim, tenho um irmão.", patterns: ["[да] [у меня] [есть] брат", "да есть брат"], next: "age", set: { sibling: "brat" } },
            { id: "sister", ru: "Да, у меня' есть сестра'.", pt: "Sim, tenho uma irmã.", patterns: ["[да] [у меня] [есть] сестра", "да есть сестра"], next: "age", set: { sibling: "sestra" } },
            { id: "none", ru: "Нет, но у меня' есть ма'ма и па'па.", pt: "Não, mas tenho mamãe e papai.", patterns: ["нет [но] [у меня] [есть] мама и папа", "нет"], next: "age" },
          ],
          retry: { ru: "Брат? Сестра'? Наприме'р: «У меня' есть сестра'».", pt: "Irmão? Irmã? Por exemplo: «Eu tenho uma irmã».", mood: "thinking" },
        },
      },
      {
        id: "age",
        say: [{ ru: "Поня'тно! А ско'лько тебе' лет? Мне два'дцать.", pt: "Entendi! E quantos anos você tem? Eu tenho vinte.", mood: "neutral" }],
        reply: {
          options: [
            { id: "age", ru: "Мне … лет.", pt: "Eu tenho … anos.", patterns: ["мне * (лет|год|года)", "мне тоже двадцать [лет]"], next: "end" },
            { id: "age-ya", ru: "Мне … лет.", pt: "Eu tenho … anos.", patterns: ["я * (лет|год|года)"], next: "end", note: "A idade se diz com мне, não com я: Мне два'дцать лет." },
          ],
          retry: { ru: "Ско'лько тебе' лет? Наприме'р: «Мне два'дцать пять лет».", pt: "Quantos anos você tem? Por exemplo: «Tenho vinte e cinco anos».", mood: "thinking" },
        },
      },
      {
        id: "end",
        say: [{ ru: "Здо'рово! Пойдём пить чай? Ма'ма сде'лала торт!", pt: "Que legal! Vamos tomar chá? A mamãe fez um bolo!", mood: "happy" }],
        reply: {
          options: [
            { id: "yes", ru: "Да, коне'чно! Спаси'бо!", pt: "Sim, claro! Obrigado!", patterns: ["да [конечно] [спасибо]", "[спасибо] [да] [конечно]", "конечно", "хорошо [спасибо]", "давай", "я люблю торт"], next: "fin" },
            { id: "no", ru: "Спаси'бо, но я не хочу'.", pt: "Obrigado, mas não quero.", patterns: ["[спасибо] [но] [я] не хочу", "нет спасибо"], next: "fin-no" },
          ],
          retry: { ru: "Чай и торт — да?", pt: "Chá e bolo — sim?", mood: "happy" },
        },
      },
      { id: "fin", say: [{ ru: "Ура'! Ма'ма, у нас гость!", pt: "Oba! Mãe, temos visita!", mood: "happy" }], end: true },
      { id: "fin-no", say: [{ ru: "Жаль! Ну, тогда' в друго'й раз.", pt: "Que pena! Bom, então fica para outra vez.", mood: "sad" }], end: true },
    ],
  },

  // ------------------------------------------------------------------ Maksim, fim de semana
  {
    id: "c-maksim-vykhodnye",
    character: "maksim",
    title: "Planos para o sábado",
    place: "universitet",
    level: "A1",
    goal: "Falar do que você gosta e combinar um programa para o fim de semana.",
    requires: ["u4-3"],
    skills: ["fala", "escrita", "vocabulario"],
    vocabulary: ["lyubit", "futbol", "kino", "subbota", "rabotat", "segodnya", "zavtra", "da", "net", "izvini"],
    start: "start",
    nodes: [
      {
        id: "start",
        say: [
          { ru: "Приве'т! Я Макс, друг А'ни. Она' говори'т, ты из Брази'лии. Ты лю'бишь футбо'л?", pt: "Oi! Eu sou o Max, amigo da Anya. Ela disse que você é do Brasil. Você gosta de futebol?", mood: "happy" },
        ],
        reply: {
          options: [
            { id: "yes", ru: "Да, о'чень люблю'!", pt: "Sim, adoro!", patterns: ["да [я] [очень] люблю [футбол]", "да [очень]", "конечно [люблю]", "[да] я люблю футбол"], next: "plan", set: { likes: "futbol" } },
            { id: "no", ru: "Нет, не о'чень.", pt: "Não muito.", patterns: ["нет [не очень]", "[нет] я не люблю футбол", "не очень"], next: "what" },
          ],
          retry: { ru: "Футбо'л — ты лю'бишь и'ли нет?", pt: "Futebol — você gosta ou não?", mood: "thinking" },
        },
      },
      {
        id: "what",
        say: [{ ru: "Серьёзно? Брази'лец, кото'рый не лю'бит футбо'л! Ха-ха. А что ты лю'бишь?", pt: "Sério? Um brasileiro que não gosta de futebol! Ha-ha. E do que você gosta?", mood: "surprised" }],
        reply: {
          options: [
            { id: "kino", ru: "Я люблю' кино'.", pt: "Eu adoro cinema.", patterns: ["[я] [очень] люблю кино", "кино"], next: "plan", set: { likes: "kino" } },
            { id: "read", ru: "Я люблю' чита'ть.", pt: "Eu adoro ler.", patterns: ["[я] [очень] люблю читать", "читать"], next: "plan", set: { likes: "chitat" } },
            { id: "music", ru: "Я люблю' му'зыку.", pt: "Eu adoro música.", patterns: ["[я] [очень] люблю музыку", "музыку", "музыка"], next: "plan", set: { likes: "muzyka" } },
            { id: "games", ru: "Я люблю' компью'терные и'гры.", pt: "Eu adoro jogos de computador.", patterns: ["[я] [очень] люблю [компьютерные] игры", "игры"], next: "plan", set: { likes: "igry" }, hiddenInEasy: true },
          ],
          retry: { ru: "Что ты лю'бишь? Кино'? Му'зыку? Чита'ть?", pt: "Do que você gosta? Cinema? Música? Ler?", mood: "thinking" },
        },
      },
      {
        id: "plan",
        say: [
          { ru: "Кла'сс! Я то'же!", pt: "Demais! Eu também!", mood: "happy", if: { flag: "likes", eq: "futbol" } },
          { ru: "Кино' — э'то кру'то!", pt: "Cinema é muito legal!", mood: "happy", if: { flag: "likes", eq: "kino" } },
          { ru: "Э'то как А'ня, она' то'же мно'го чита'ет.", pt: "Igual à Anya, ela também lê muito.", mood: "neutral", if: { flag: "likes", eq: "chitat" } },
          { ru: "Му'зыка — э'то жизнь!", pt: "Música é vida!", mood: "happy", if: { flag: "likes", eq: "muzyka" } },
          { ru: "И'гры! Я програми'ст, я де'лаю и'гры!", pt: "Jogos! Eu sou programador, eu faço jogos!", mood: "surprised", if: { flag: "likes", eq: "igry" } },
          { ru: "Слу'шай, что ты де'лаешь в суббо'ту?", pt: "Escuta, o que você vai fazer no sábado?", mood: "neutral" },
        ],
        reply: {
          options: [
            { id: "free", ru: "В суббо'ту я до'ма.", pt: "No sábado estou em casa.", patterns: ["[в субботу] я дома", "[в субботу] ничего", "я не знаю", "[в субботу] я отдыхаю"], next: "invite", set: { saturday: "free" } },
            { id: "work", ru: "В суббо'ту я рабо'таю.", pt: "No sábado eu trabalho.", patterns: ["[в субботу] я работаю", "работаю"], next: "sunday", set: { saturday: "work" } },
            { id: "study", ru: "В суббо'ту я чита'ю.", pt: "No sábado eu estudo/leio.", patterns: ["[в субботу] я читаю", "[в субботу] я (учусь|учу русский)"], next: "invite", set: { saturday: "free" } },
          ],
          retry: { ru: "В суббо'ту — ты рабо'таешь и'ли ты до'ма?", pt: "No sábado — você trabalha ou está em casa?", mood: "thinking" },
        },
      },
      {
        id: "sunday",
        say: [{ ru: "Жаль! А в воскресе'нье?", pt: "Que pena! E no domingo?", mood: "sad" }],
        reply: {
          options: [
            { id: "free", ru: "В воскресе'нье я до'ма.", pt: "No domingo estou em casa.", patterns: ["[в воскресенье] я дома", "[в воскресенье] я не работаю", "да [в воскресенье] [можно]", "можно"], next: "invite", set: { day: "sunday" } },
            { id: "busy", ru: "В воскресе'нье я то'же рабо'таю.", pt: "No domingo também trabalho.", patterns: ["[в воскресенье] я тоже работаю", "я работаю", "нет"], next: "busy" },
          ],
          retry: { ru: "В воскресе'нье ты до'ма?", pt: "No domingo você está em casa?", mood: "thinking" },
        },
      },
      {
        id: "invite",
        say: [
          { ru: "Дава'й смотре'ть футбо'л вме'сте! В суббо'ту, в шесть часо'в.", pt: "Vamos assistir futebol juntos! No sábado, às seis horas.", mood: "happy", if: { flag: "likes", eq: "futbol" } },
          { ru: "Дава'й пойдём в кино'! В суббо'ту, в шесть часо'в.", pt: "Vamos ao cinema! No sábado, às seis horas.", mood: "happy", if: { flag: "likes", eq: "futbol", not: true } },
          { ru: "Ой, в воскресе'нье, коне'чно!", pt: "Opa, no domingo, claro!", mood: "happy", if: { flag: "day", eq: "sunday" } },
        ],
        reply: {
          options: [
            { id: "yes", ru: "Дава'й! Отли'чно!", pt: "Bora! Ótimo!", patterns: ["давай [отлично]", "[да] [давай] [хорошо|отлично|класс]", "отлично [давай]", "хорошо", "да конечно"], next: "fin", set: { plan: true } },
            { id: "no", ru: "Извини', я не могу'.", pt: "Desculpa, não posso.", patterns: ["[извини] [я] не могу", "нет [спасибо]", "извини нет"], next: "busy" },
          ],
          retry: { ru: "Ну что, да?", pt: "E aí, topa?", mood: "thinking" },
        },
      },
      { id: "busy", say: [{ ru: "Ничего'! Тогда' в друго'й раз. Пока'!", pt: "Tudo bem! Então fica para outra vez. Tchau!", mood: "neutral" }], end: true },
      { id: "fin", say: [{ ru: "Кру'то! Я напишу' А'не, она' то'же пойдёт. Пока'!", pt: "Demais! Vou mandar mensagem para a Anya, ela vai também. Tchau!", mood: "happy" }], end: true },
    ],
  },

  // ------------------------------------------------------------------ Dmitri, café Samovar
  {
    id: "c-dmitry-kafe",
    character: "dmitry",
    title: "Café «Самовар»",
    place: "kafe",
    level: "A1+",
    goal: "Pedir bebida e comida, perguntar o preço, pedir a conta e pagar.",
    requires: ["u5-1"],
    skills: ["fala", "escrita", "audicao"],
    vocabulary: ["chay", "kofe", "pozhaluysta", "ya_budu", "s_limonom", "s_molokom", "skolko_stoit", "schyot", "kartoy", "nalichnymi", "do_svidaniya", "spasibo"],
    start: "start",
    nodes: [
      {
        id: "start",
        say: [{ ru: "До'брый день! Добро' пожа'ловать в «Самова'р». Что вы бу'дете?", pt: "Boa tarde! Bem-vindo ao «Samovar». O que vai querer?", mood: "happy", alts: [{ ru: "Здра'вствуйте! Что для вас?", pt: "Olá! O que vai ser?" }] }],
        reply: {
          options: [
            { id: "tea", ru: "Я бу'ду чай, пожа'луйста.", pt: "Vou querer chá, por favor.", patterns: ["[здравствуйте] [я] (буду|хочу) чай [пожалуйста]", "чай [пожалуйста]", "дайте [пожалуйста] чай [пожалуйста]", "можно чай [пожалуйста]"], next: "tea", set: { drink: "chay" } },
            { id: "coffee", ru: "Я бу'ду ко'фе, пожа'луйста.", pt: "Vou querer café, por favor.", patterns: ["[здравствуйте] [я] (буду|хочу) кофе [пожалуйста]", "кофе [пожалуйста]", "дайте [пожалуйста] кофе [пожалуйста]", "можно кофе [пожалуйста]"], next: "coffee", set: { drink: "kofe" } },
            { id: "menu", ru: "Мо'жно меню', пожа'луйста?", pt: "Posso ver o cardápio, por favor?", patterns: ["[здравствуйте] можно меню [пожалуйста]", "меню [пожалуйста]", "дайте [пожалуйста] меню"], next: "menu" },
          ],
          retry: { ru: "Извини'те? Чай, ко'фе?", pt: "Como? Chá, café?", mood: "thinking" },
        },
      },
      {
        id: "menu",
        say: [{ ru: "Коне'чно, вот меню'. Чай — сто рубле'й, ко'фе — две'сти. Что вы бу'дете?", pt: "Claro, aqui está o cardápio. Chá — cem rublos, café — duzentos. O que vai querer?", mood: "happy" }],
        reply: {
          options: [
            { id: "tea", ru: "Я бу'ду чай, пожа'луйста.", pt: "Vou querer chá, por favor.", patterns: ["[я] (буду|хочу) чай [пожалуйста]", "чай [пожалуйста]", "дайте [пожалуйста] чай [пожалуйста]"], next: "tea", set: { drink: "chay" } },
            { id: "coffee", ru: "Я бу'ду ко'фе, пожа'луйста.", pt: "Vou querer café, por favor.", patterns: ["[я] (буду|хочу) кофе [пожалуйста]", "кофе [пожалуйста]", "дайте [пожалуйста] кофе [пожалуйста]"], next: "coffee", set: { drink: "kofe" } },
          ],
          retry: { ru: "Чай и'ли ко'фе?", pt: "Chá ou café?", mood: "thinking" },
        },
      },
      {
        id: "tea",
        say: [{ ru: "Чай с лимо'ном и'ли с молоко'м?", pt: "Chá com limão ou com leite?", mood: "neutral" }],
        reply: {
          options: [
            { id: "lemon", ru: "С лимо'ном, пожа'луйста.", pt: "Com limão, por favor.", patterns: ["[чай] с лимоном [пожалуйста]"], next: "food", set: { extra: "limon" } },
            { id: "milk", ru: "С молоко'м, пожа'луйста.", pt: "Com leite, por favor.", patterns: ["[чай] с молоком [пожалуйста]"], next: "food", set: { extra: "moloko" } },
            { id: "plain", ru: "Без всего', пожа'луйста.", pt: "Puro, por favor.", patterns: ["без всего [пожалуйста]", "просто чай [пожалуйста]", "нет спасибо", "ничего"], next: "food", set: { extra: "none" }, hiddenInEasy: true },
          ],
          retry: { ru: "Лимо'н? Молоко'?", pt: "Limão? Leite?", mood: "thinking" },
        },
      },
      {
        id: "coffee",
        say: [{ ru: "Ко'фе с молоко'м?", pt: "Café com leite?", mood: "neutral" }],
        reply: {
          options: [
            { id: "milk", ru: "Да, с молоко'м, пожа'луйста.", pt: "Sim, com leite, por favor.", patterns: ["да [с молоком] [пожалуйста]", "с молоком [пожалуйста]"], next: "food", set: { extra: "moloko" } },
            { id: "black", ru: "Нет, спаси'бо, без молока'.", pt: "Não, obrigado, sem leite.", patterns: ["нет [спасибо] [без молока]", "без молока [пожалуйста]"], next: "food", set: { extra: "none" }, note: "без + genitivo: молоко' → без молока' (sem leite)." },
          ],
          retry: { ru: "С молоко'м — да и'ли нет?", pt: "Com leite — sim ou não?", mood: "thinking" },
        },
      },
      {
        id: "food",
        say: [{ ru: "Что'-нибудь ещё? Сего'дня у нас о'чень вку'сный борщ.", pt: "Mais alguma coisa? Hoje temos um borsch muito gostoso.", mood: "happy" }],
        reply: {
          options: [
            { id: "borsch", ru: "Да, борщ, пожа'луйста.", pt: "Sim, um borsch, por favor.", patterns: ["да [борщ] [пожалуйста]", "[я] (буду|хочу) борщ [пожалуйста]", "борщ [пожалуйста]", "давайте борщ"], next: "bring", set: { food: "borshch" } },
            { id: "price", ru: "Ско'лько сто'ит борщ?", pt: "Quanto custa o borsch?", patterns: ["сколько стоит [борщ]", "а сколько стоит [борщ]"], next: "price" },
            { id: "no", ru: "Нет, спаси'бо.", pt: "Não, obrigado.", patterns: ["нет [спасибо]", "спасибо нет", "все спасибо", "это все"], next: "bring" },
          ],
          retry: { ru: "Борщ? Да и'ли нет?", pt: "Borsch? Sim ou não?", mood: "thinking" },
        },
      },
      {
        id: "price",
        say: [{ ru: "Три'ста рубле'й. Он о'чень вку'сный, пра'вда!", pt: "Trezentos rublos. É muito gostoso, juro!", mood: "happy" }],
        reply: {
          options: [
            { id: "yes", ru: "Хорошо', борщ, пожа'луйста.", pt: "Está bem, um borsch, por favor.", patterns: ["[хорошо] [да] [борщ] [пожалуйста]", "[я] (буду|возьму) [борщ]", "давайте"], next: "bring", set: { food: "borshch" } },
            { id: "expensive", ru: "Э'то до'рого. Нет, спаси'бо.", pt: "É caro. Não, obrigado.", patterns: ["[это] [очень] дорого [нет] [спасибо]", "нет [спасибо]"], next: "bring", set: { expensive: true } },
          ],
          retry: { ru: "Ну что, борщ бу'дете?", pt: "E então, vai querer o borsch?", mood: "thinking" },
        },
      },
      {
        id: "bring",
        say: [
          { ru: "До'рого? Ну что вы! Э'то лу'чший борщ в го'роде.", pt: "Caro? Que nada! É o melhor borsch da cidade.", mood: "surprised", if: { flag: "expensive" } },
          { ru: "Вот ваш чай.", pt: "Aqui está o seu chá.", mood: "happy", if: { flag: "drink", eq: "chay" } },
          { ru: "Вот ваш ко'фе.", pt: "Aqui está o seu café.", mood: "happy", if: { flag: "drink", eq: "kofe" } },
          { ru: "И борщ. Прия'тного аппети'та!", pt: "E o borsch. Bom apetite!", mood: "happy", if: { flag: "food" } },
        ],
        reply: {
          options: [
            { id: "thanks", ru: "Спаси'бо!", pt: "Obrigado!", patterns: ["[большое] спасибо", "спасибо большое"], next: "later" },
            { id: "bill", ru: "Спаси'бо! Счёт, пожа'луйста.", pt: "Obrigado! A conta, por favor.", patterns: ["[спасибо] счет [пожалуйста]", "[спасибо] можно счет [пожалуйста]"], next: "pay" },
          ],
          retry: { ru: "Всё хорошо'?", pt: "Tudo certo?", mood: "thinking" },
        },
      },
      {
        id: "later",
        say: [{ ru: "Пожа'луйста!", pt: "De nada!", mood: "happy" }, { ru: "…Ещё что'-нибудь и'ли счёт?", pt: "…Mais alguma coisa ou a conta?", mood: "neutral" }],
        reply: {
          options: [{ id: "bill", ru: "Счёт, пожа'луйста.", pt: "A conta, por favor.", patterns: ["счет [пожалуйста]", "можно счет [пожалуйста]", "[нет] [спасибо] счет [пожалуйста]"], next: "pay" }],
          retry: { ru: "Счёт?", pt: "A conta?", mood: "thinking" },
        },
      },
      {
        id: "pay",
        say: [
          { ru: "Чай — сто рубле'й.", pt: "Chá — cem rublos.", if: { flag: "drink", eq: "chay" } },
          { ru: "Ко'фе — две'сти рубле'й.", pt: "Café — duzentos rublos.", if: { flag: "drink", eq: "kofe" } },
          { ru: "Борщ — три'ста.", pt: "Borsch — trezentos.", if: { flag: "food" } },
          { ru: "Ка'ртой и'ли нали'чными?", pt: "Cartão ou dinheiro?", mood: "neutral" },
        ],
        reply: {
          options: [
            { id: "card", ru: "Ка'ртой, пожа'луйста.", pt: "Cartão, por favor.", patterns: ["картой [пожалуйста]", "можно картой [пожалуйста]"], next: "bye", set: { paid: "card" } },
            { id: "cash", ru: "Нали'чными.", pt: "Em dinheiro.", patterns: ["наличными [пожалуйста]"], next: "bye", set: { paid: "cash" } },
          ],
          retry: { ru: "Ка'ртой? Нали'чными?", pt: "Cartão? Dinheiro?", mood: "thinking" },
        },
      },
      {
        id: "bye",
        say: [{ ru: "Спаси'бо! Приходи'те ещё!", pt: "Obrigado! Volte sempre!", mood: "happy" }],
        reply: {
          options: [
            { id: "formal", ru: "Спаси'бо! До свида'ния!", pt: "Obrigado! Até logo!", patterns: ["[спасибо] до свидания", "до свидания [спасибо]", "спасибо [большое]"], next: "fin" },
            { id: "informal", ru: "До свида'ния!", pt: "Até logo!", patterns: ["[спасибо] пока"], next: "fin-informal", note: "Пока' funciona, mas com um atendente prefira До свида'ния." },
          ],
          retry: { ru: "До свида'ния!", pt: "Até logo!", mood: "happy" },
        },
      },
      { id: "fin", say: [{ ru: "До свида'ния! Хоро'шего дня!", pt: "Até logo! Tenha um bom dia!", mood: "happy" }], end: true },
      { id: "fin-informal", say: [{ ru: "Ха-ха, пока'! Хоро'шего дня!", pt: "Ha-ha, tchau! Tenha um bom dia!", mood: "happy" }], end: true },
    ],
  },

  // ------------------------------------------------------------------ Sofia, perdida na cidade
  {
    id: "c-sofiya-doroga",
    character: "sofiya",
    title: "Uma turista perdida",
    place: "metro",
    level: "A1+",
    goal: "Ensinar o caminho com пря́мо, нале́во, напра́во e dizer se é perto.",
    requires: ["u5-2"],
    skills: ["fala", "escrita", "audicao"],
    vocabulary: ["pryamo", "nalevo", "napravo", "potom", "blizko", "daleko", "vokzal", "metro", "izvinite", "ne_za_chto"],
    start: "start",
    nodes: [
      {
        id: "start",
        say: [
          { ru: "Извини'те, пожа'луйста! Вы не зна'ете, где вокза'л?", pt: "Com licença, por favor! O senhor/a senhora sabe onde fica a estação de trem?", mood: "thinking" },
        ],
        hint: "No seu mapa, o вокза́л (estação de trem) fica em frente e depois à direita.",
        reply: {
          options: [
            { id: "right", ru: "Иди'те пря'мо, пото'м напра'во.", pt: "Siga em frente, depois à direita.", patterns: ["[идите] прямо [и|потом|а потом] направо", "[вокзал] прямо [и|потом] направо", "иди прямо [и|потом] направо", "да идите прямо [потом] направо"], next: "far" },
            { id: "left", ru: "Иди'те пря'мо, пото'м нале'во.", pt: "Siga em frente, depois à esquerda.", patterns: ["[идите] прямо [и|потом] налево", "налево"], next: "wrong-way", hiddenInEasy: true },
            { id: "dunno", ru: "Извини'те, я не зна'ю.", pt: "Desculpe, não sei.", patterns: ["[извините] [я] не знаю", "не знаю"], next: "dunno" },
          ],
          retry: { ru: "Извини'те? Пря'мо? Нале'во? Напра'во?", pt: "Como? Em frente? À esquerda? À direita?", mood: "thinking" },
        },
      },
      {
        id: "wrong-way",
        say: [{ ru: "Нале'во? Но там парк… Мо'жет быть, напра'во?", pt: "À esquerda? Mas lá é o parque… Talvez à direita?", mood: "thinking" }],
        reply: {
          options: [{ id: "fix", ru: "Да, извини'те! Пря'мо, пото'м напра'во.", pt: "Sim, desculpe! Em frente, depois à direita.", patterns: ["[да] [извините] [прямо] [потом] направо", "да"], next: "far" }],
          retry: { ru: "Напра'во, да?", pt: "À direita, né?", mood: "thinking" },
        },
      },
      {
        id: "dunno",
        say: [{ ru: "Ничего'! О, у вас ка'рта! Смотри'те: вокза'л пря'мо и напра'во, да?", pt: "Tudo bem! Ah, o senhor/a senhora tem um mapa! Olha: a estação é em frente e à direita, né?", mood: "happy" }],
        reply: {
          options: [{ id: "yes", ru: "Да, пря'мо, пото'м напра'во.", pt: "Sim, em frente, depois à direita.", patterns: ["да [прямо] [потом|и] [направо]", "[прямо] [потом|и] направо"], next: "far" }],
          retry: { ru: "Пря'мо и напра'во?", pt: "Em frente e à direita?", mood: "thinking" },
        },
      },
      {
        id: "far",
        say: [{ ru: "Спаси'бо! А э'то далеко'?", pt: "Obrigada! E é longe?", mood: "neutral" }],
        reply: {
          options: [
            { id: "near", ru: "Нет, э'то бли'зко. Пять мину'т.", pt: "Não, é perto. Cinco minutos.", patterns: ["нет [это] близко [* минут]", "[это] близко [* минут]", "нет [не далеко] * минут", "нет"], next: "from", set: { near: true } },
            { id: "far", ru: "Да, далеко'.", pt: "Sim, é longe.", patterns: ["да [это] [очень] далеко", "далеко"], next: "taxi" },
          ],
          retry: { ru: "Далеко' и'ли бли'зко?", pt: "Longe ou perto?", mood: "thinking" },
        },
      },
      {
        id: "taxi",
        say: [{ ru: "Ой. Тогда' я возьму' такси'.", pt: "Ai. Então vou pegar um táxi.", mood: "sad" }],
        next: "from",
      },
      {
        id: "from",
        say: [{ ru: "Слу'шайте, у вас интере'сный акце'нт. Отку'да вы?", pt: "Escuta, o senhor/a senhora tem um sotaque interessante. De onde é?", mood: "thinking" }],
        reply: {
          options: [
            { id: "br", ru: "Я из Брази'лии.", pt: "Sou do Brasil.", patterns: ["[я] из бразилии", "я (бразилец|бразильянка)", "[я] из сан-паулу", "[я] из рио [де жанейро]"], next: "brazil" },
          ],
          retry: { ru: "Отку'да вы?", pt: "De onde o senhor/a senhora é?", mood: "thinking" },
        },
      },
      {
        id: "brazil",
        say: [
          { ru: "Из Брази'лии?! Tudo bem? Я два го'да жила' в Сан-Па'улу!", pt: "Do Brasil?! Tudo bem? Eu morei dois anos em São Paulo!", mood: "surprised" },
          { ru: "Дава'й на «ты»! Меня' зову'т Софи'я. А тебя'?", pt: "Vamos nos tratar por «você»! Meu nome é Sofia. E o seu?", mood: "happy" },
        ],
        reply: {
          options: [{ id: "name", ru: "Меня' зову'т {player}. О'чень прия'тно!", pt: "Meu nome é {player}. Muito prazer!", patterns: DA_NET_NAME, next: "end" }],
          retry: { ru: "Как тебя' зову'т?", pt: "Como você se chama?", mood: "thinking" },
        },
      },
      {
        id: "end",
        say: [{ ru: "О'чень прия'тно, {name}! Спаси'бо за по'мощь. Уви'димся!", pt: "Muito prazer, {name}! Obrigada pela ajuda. A gente se vê!", mood: "happy" }],
        reply: {
          options: [{ id: "bye", ru: "Пока', Софи'я!", pt: "Tchau, Sofia!", patterns: ["пока [софия]", "до свидания [софия]", "не за что [пока] [софия]", "пожалуйста [пока] [софия]", "увидимся"], next: "fin" }],
          retry: { ru: "Пока'!", pt: "Tchau!", mood: "happy" },
        },
      },
      { id: "fin", say: [{ ru: "Пока'! Até logo!", pt: "Tchau! Até logo!", mood: "happy" }], end: true },
    ],
  },
];

export function conversationOf(id: string): Conversation | undefined {
  return CONVERSATIONS.find((c) => c.id === id);
}
