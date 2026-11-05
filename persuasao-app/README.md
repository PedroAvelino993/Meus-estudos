# The Art of Persuasion

Jogo de lábia e golpes, em português do Brasil. Você é um golpista em Vila Áurea, uma cidade fictícia: aplica golpes conversando, junta butim, compra ferramentas e sobe até os alvos mais poderosos, fugindo da polícia.

## Rodar e publicar

```bash
npm install
npm run dev      # desenvolvimento
npm test         # testes automáticos (motor, jogo, conteúdo, salvamento, balanceamento e uma partida inteira)
npm run build    # gera o jogo em ../persuasao (publicado pelo GitHub Pages)
```

## Como o jogo funciona

- **Conversas por escrito**: não há lista de falas. O jogador escreve o que quiser, como numa conversa de mensagens. O jogo reconhece a intenção (perguntar, ouvir, explicar, mostrar dados, ceder, blefar, pressionar…) e compara a fala com as que a missão prevê naquele momento (`src/core/understand.ts`). Se a fala se parece com uma delas, valem as consequências dela; se não, vira uma fala livre com a abordagem reconhecida. Em negociações, basta dizer um valor («te pago 300»). Um botão de dica orienta sem dar falas prontas.
- **Falas geradas na hora (opcional)**: em Celular → Ajustes → IA dos personagens, cada fala dos personagens passa a ser escrita na hora, reagindo ao texto exato que o jogador digitou, com a personalidade, a história e o humor do momento de cada um. O motor do jogo continua decidindo os números (confiança, desconfiança, pontos fracos, contradições, desfecho) e manda para a IA uma «direção» do que o personagem sente e precisa transmitir. Sem IA, ou se ela falhar, o jogo usa as falas escritas à mão. Duas opções:
  - **Grátis (padrão)**: um modelo Qwen2.5 (1,5B, 3B ou 7B) roda no próprio aparelho com WebLLM e WebGPU (`src/local-llm.ts`, numa web worker). Baixa uma vez (de 1 a 5 GB), fica guardado no navegador e depois funciona sem internet. Sem conta e sem custo; escreve pior que uma IA grande.
  - **Paga**: Claude, com a chave do próprio jogador, guardada só no navegador e cobrada por uso.
- **Abordagens**: cada fala usa uma abordagem (explicar, perguntar, ouvir, mostrar dados, ceder, blefar, pressionar…). Cada personagem reage de um jeito, segundo os seus traços (analítico, caloroso, orgulhoso, cético, impaciente, bem-humorado, econômico, arriscado, formal). Sete atributos mudam a cada fala: confiança, interesse, paciência, desconfiança, humor, credibilidade e afinidade.
- **Equilíbrio**: repetir a mesma abordagem cansa (rende cada vez menos e gasta paciência). Descobrir uma necessidade escondida libera falas novas e fortalece as abordagens ligadas a ela. Blefes e afirmações ficam registrados: contradições podem ser percebidas na hora ou mais tarde, e custam confiança e aumentam o calor policial.
- **Imprevistos**: interrupções (telefone, cliente chegando) e perguntas inesperadas, que testam a sua sinceridade.
- **Proposta e negociação**: a proposta compara a pontuação de convencimento com o limite da missão (sucesso total, acordo, meio-termo ou recusa). Nas negociações, o preço aceito depende do clima da conversa e do limite que o cliente autorizou.
- **Golpes e butim**: cada personagem tem um golpe próprio, com várias saídas: golpe perfeito, golpe certo, pela metade, vítima que não cai ou que desconfia e vai embora. Golpes podem render dinheiro na hora e butim (dados, cartões, senhas, acessos, documentos). O butim pode ser vendido ao receptador ou usado com a ferramenta certa: o kit de clonagem para cartões, o notebook para senhas e acessos. Usar rende mais, mas gera mais calor.
- **Calor policial**: cada golpe esquenta; contradições percebidas e vítimas desconfiadas esquentam muito. Ferramentas e habilidades cortam o calor, e à noite ele cai 12 pontos. Em 100, a polícia te pega: fiança, butim apreendido e, sem advogado, uma ferramenta perdida. Na terceira prisão, fim de jogo.
- **Progressão**: dinheiro → ferramentas → bairros e alvos maiores. As Torres pedem uma identidade corporativa falsa, o Alto das Palmeiras um convite do clube, e o Paço uma rede de laranjas.
- **Mundo**: dias de 8h às 22h, energia, aluguel, transporte entre bairros, eventos do dia (incluindo operações policiais), golpes rápidos gerados, visitas para sondar alvos, desafios diários, mensagens, 5 capítulos e quatro finais: fantasma, novo dono do Zênite, fuga ou prisão.

## Organização

| Pasta | O que tem |
|---|---|
| `src/content/` | Personagens (`characters/`), missões por capítulo (`missions/`), bairros, loja e habilidades (`world.ts`), capítulos, finais, eventos, desafios e golpes rápidos (`story.ts`). |
| `src/core/` | Lógica sem interface: personalidade e efeitos (`persona.ts`), motor de conversa (`encounter.ts`), entendimento da fala escrita (`understand.ts`), estado, butim, calor e prisões (`game.ts`), golpes rápidos e visitas (`generated.ts`), conquistas. |
| `src/screens/`, `src/phone/`, `src/components/` | Interface (React): início, mapa, bairro, conversa, celular e apps. |
| `src/store.ts` | Salvamento automático em 3 espaços, exportação e importação. |
| `src/test/` | Testes (Vitest), incluindo simulação de balanceamento e uma partida do começo ao fim. |

## Segurança e limites

- **Ficção**: a moeda é ₢, as pessoas e empresas são inventadas e os cartões aparecem só com um final fictício (`•••• 1234`). As ferramentas são itens de jogo com efeitos de jogo; os textos contam a história sem ensinar técnica real. O jogo não tem nenhum campo para dados reais, e um teste verifica que nenhum texto contém número de cartão.
- **Conversas**: sem chave da API, as respostas dos personagens são as escritas à mão. O entendimento da intenção da sua fala (que move os números do jogo) é feito por padrões do português, sem IA, nos dois modos. Ele entende paráfrases do que a missão prevê e reconhece a intenção de frases livres, mas não interpreta qualquer assunto como uma pessoa faria. Um teste garante que mais de 92% das falas previstas são reconhecidas quando escritas com outras palavras.
- **Dados**: salvos só no navegador (localStorage, chaves `persuasao:v1:*`). Não há sincronização na nuvem; há exportar/importar em Ajustes.
