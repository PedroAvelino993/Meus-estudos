# Meus Estudos

App de estudos para a AP3 do 8º ano (3º trimestre, 2026): resumos, quizzes e flashcards separados por matéria.

## Matérias

- 📐 Matemática – ângulos, polígonos regulares, mediatriz e bissetriz, paralelas e transversal, triângulos, quadriláteros, áreas
- 📖 Língua Portuguesa – crônica argumentativa, *O Médico e o Monstro*, frase/oração/período, conjunções, vírgula, porquês
- ⚡ Ciências – fontes de energia e impactos, eletricidade
- 🌍 Geografia – África: passado e presente, natureza e sociedades
- 🏛️ História – EUA no século XIX, Imperialismo na África e na Ásia
- 🇬🇧 Língua Inglesa – Units 7 e 8, Passive Voice, Reported Speech

## Como usar

Abra o `index.html` no navegador. Em cada matéria há três abas:

- **Resumo** – os pontos principais de cada assunto
- **Quiz** – perguntas de múltipla escolha com explicação da resposta
- **Flashcards** – toque no cartão para ver a resposta

A melhor nota de cada quiz fica salva no navegador.

## Como editar o conteúdo

Todo o conteúdo fica em `conteudo.js`. Para outra prova, basta trocar ou adicionar matérias seguindo o mesmo formato.

## Instalar no iPhone

1. Abra o link do app no **Safari**.
2. Toque em **Compartilhar** (o quadrado com a seta para cima).
3. Toque em **Adicionar à Tela de Início** e depois em **Adicionar**.

O app aparece com o ícone 📚 e o nome "Estudos", abre em tela cheia e funciona sem internet depois da primeira vez.

## Bandeiras do Mundo

Jogo para aprender as bandeiras dos 197 países, sem tempo. Fica na pasta `bandeiras/` e abre em `/bandeiras/` no mesmo link do GitHub Pages. As imagens das bandeiras vêm do pacote [svg-country-flags](https://github.com/hjnilsson/country-flags), copiadas da Wikipédia.

A aba **Países do mundo** é um mapa no estilo do JetPunk, sem cronômetro: você digita o nome de um país (não precisa de Enter, e erros pequenos de digitação valem) e ele fica verde no mapa. Dá para jogar o mundo todo ou um continente. O mapa vem do [Natural Earth](https://www.naturalearthdata.com/) (domínio público), pelo pacote [world-atlas](https://github.com/topojson/world-atlas).

## Russky — aprender russo

Plataforma para aprender russo do zero, em português: alfabeto cirílico (33 letras), pronúncia, vocabulário, gramática, conversas com personagens, uma história e revisão espaçada. Abre em `/russky/` no mesmo link do GitHub Pages.

O código-fonte fica em `russky-app/` (React + TypeScript + Vite) e o app publicado é gerado em `russky/`. Detalhes em `russky-app/README.md`.

## The Art of Persuasion — jogo de lábia e golpes

Jogo de ficção em que você é um golpista recém-chegado a Vila Áurea, uma cidade inventada com 7 bairros e 30 personagens. Você conversa escrevendo livremente, como numa troca de mensagens. Descobre o ponto fraco de cada pessoa e arranca dinheiro, dados, cartões e acessos. Com o lucro, compra ferramentas melhores no mercado clandestino, que liberam bairros e alvos mais importantes, até o golpe final no cofre da prefeitura. Cada golpe gera calor policial: se chegar a 100, você é preso, e na terceira prisão o jogo acaba. Tem celular dentro do jogo (conta, contatos, mensagens, central de butim e radar da polícia, mercado, perfil e ajustes), 5 capítulos com quatro finais, árvore de habilidades, conquistas, golpes rápidos e desafios diários. Abre em `/persuasao/` no mesmo link do GitHub Pages.

É tudo ficção: pessoas, empresas, contas e cartões são inventados e aparecem sempre mascarados (`•••• 1234`). As ferramentas são itens de jogo, sem nenhuma instrução real, e o jogo não pede nem guarda dados reais. O código-fonte fica em `persuasao-app/` (React + TypeScript + Vite) e o jogo publicado é gerado em `persuasao/`. Detalhes em `persuasao-app/README.md`.

## COLOSSEUM INC. — estratégia, administração e expansão mundial

Jogo de gestão em que você recebe uma arena de madeira para 500 pessoas em Roma, com três gladiadores desconhecidos, e precisa transformá-la no maior império do entretenimento do mundo antigo. São 6 eras, da Pequena Arena ao Legado Eterno, com:

- espetáculos calculados com estimativa antes e relatório depois;
- árvore de evolução com 75 melhorias em 6 categorias, incluindo escolhas exclusivas;
- gladiadores com atributos, personalidade, história, rivalidades e amizades;
- construções em vários níveis;
- mapa com 7 regiões para filiais;
- a rival Dominus Arena, com IA própria, e a Rebelião das Arenas;
- crises;
- o Arena Bets;
- a Central Imperial.

Abre em `/colosseum/` no mesmo link do GitHub Pages.

O Arena Bets usa só fichas fictícias e gratuitas, sem compra, venda, saque ou conversão em dinheiro. Espetáculos roteirizados (Decreto Imperial) são sempre identificados e nunca recebem mercados de previsão; as competições livres são calculadas pelo motor do jogo. O código-fonte fica em `colosseum-app/` (React + TypeScript + Vite) e o jogo publicado é gerado em `colosseum/`. Detalhes em `colosseum-app/README.md`.

## GTA Clips AI — clipes curtos de gameplay com IA

Plataforma de edição automatizada que transforma gravações longas de gameplay (como 40 minutos de GTA 6) em clipes curtos com começo, desenvolvimento e conclusão, prontos para o YouTube Shorts.

- **Análise:** uma IA de visão (CLIP) e medidas de imagem e som identificam e pontuam (0–100) perseguições, explosões, batidas e tiroteios. Menus, carregamentos e esperas são cortados.
- **Montagem:** as histórias saem em ordem cronológica, ou em episódios no modo história contínua.
- **Legendas:** automáticas (Whisper), com detecção de idioma, tradução (NLLB ou Claude) e 5 estilos.
- **Editor manual:** linha do tempo e prévia fiel ao resultado final.
- **Exportação:** MP4 real em 1080p, a 30 ou 60 FPS, com ZIP.
- **YouTube:** curso de canal e monetização, requisitos oficiais e análise do canal pela API oficial.

Tudo roda no navegador do próprio aparelho, sem servidor. Abre em `/gtaclips/` no mesmo link do GitHub Pages. O código-fonte fica em `gtaclips-app/` e o app publicado é gerado em `gtaclips/`. Detalhes em `gtaclips-app/README.md`.

## Rota — agência de viagens digital

Pesquisa de passagens e hotéis em fontes reais, assistente de destino e planejamento completo da viagem.

- **Passagens:** busca por cidade (todos os aeroportos) ou aeroporto, só ida ou ida e volta, adultos, crianças e bebês, classe e só voos diretos. Mostra companhia, preço total e por passageiro, horários, duração, escalas e tempo de cada conexão, bagagem, regras da tarifa e link de compra.
- **Ordenar e filtrar:** menor preço, menor duração, menos escalas, custo-benefício e filtros.
- **Origem dos preços:** Google Flights e Duffel. Cada preço mostra a fonte, a hora em que foi encontrado e se a disponibilidade foi confirmada.
- **Hotéis:** fotos, estrelas, avaliações, distância do centro, serviços, café da manhã, diária, total e links de reserva, com comparação lado a lado.
- **Destinos:** pontos turísticos, museus, parques, praias, restaurantes, vida noturna, previsão do tempo, dicas e roteiro dia a dia agrupando lugares próximos. Fontes: OpenStreetMap, Wikipédia, Wikivoyage e Open-Meteo.
- **Minhas viagens:** passagens, hotel, passeios por dia, restaurantes, endereços, gastos, orçamento e resumo financeiro.
- **Comparar:** passagens e viagens salvas lado a lado.

Nenhum preço é inventado. Sem o servidor configurado, o app explica o que falta e abre a mesma busca nos sites oficiais. Abre em `/viagens/` no mesmo link do GitHub Pages. O código-fonte fica em `viagens-app/` (frontend React + TypeScript, backend Node + TypeScript que guarda as chaves das APIs) e o app publicado é gerado em `viagens/`. Detalhes em `viagens-app/docs/`.

