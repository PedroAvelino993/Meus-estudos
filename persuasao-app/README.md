# The Art of Persuasion

Jogo de estratégia social, persuasão e negociação, em português do Brasil.

## Rodar e publicar

```bash
npm install
npm run dev      # desenvolvimento
npm test         # testes automáticos (motor, jogo, conteúdo, salvamento, balanceamento e uma partida inteira)
npm run build    # gera o jogo em ../persuasao (publicado pelo GitHub Pages)
```

## Como o jogo funciona

- **Conversas**: cada fala usa uma abordagem (explicar, perguntar, ouvir, mostrar dados, ceder, blefar, pressionar…). Cada personagem reage de um jeito, segundo os seus traços (analítico, caloroso, orgulhoso, cético, impaciente, bem-humorado, econômico, arriscado, formal). Sete atributos mudam a cada fala: confiança, interesse, paciência, desconfiança, humor, credibilidade e afinidade.
- **Equilíbrio**: repetir a mesma abordagem cansa (rende cada vez menos e gasta paciência). Descobrir uma necessidade escondida libera falas novas e fortalece as abordagens ligadas a ela. Blefes e afirmações ficam registrados: contradições podem ser percebidas na hora ou mais tarde, e custam confiança, reputação e integridade.
- **Imprevistos**: interrupções (telefone, cliente chegando) e perguntas inesperadas, que testam a sua sinceridade.
- **Proposta e negociação**: a proposta compara a pontuação de convencimento com o limite da missão (sucesso total, acordo, meio-termo ou recusa). Nas negociações, o preço aceito depende do clima da conversa e do limite que o cliente autorizou.
- **Mundo**: dias de 8h às 22h, energia, aluguel, transporte entre bairros, eventos do dia, bicos gerados, visitas sociais, desafios diários, mensagens dos personagens, capítulos e quatro finais decididos pela integridade.

## Organização

| Pasta | O que tem |
|---|---|
| `src/content/` | Personagens (`characters/`), missões por capítulo (`missions/`), bairros, loja e habilidades (`world.ts`), capítulos, finais, eventos, desafios, bicos e casos de investigação (`story.ts`). |
| `src/core/` | Lógica sem interface: personalidade e efeitos (`persona.ts`), motor de conversa (`encounter.ts`), estado e ações do jogo (`game.ts`), bicos e visitas (`generated.ts`), conquistas. |
| `src/screens/`, `src/phone/`, `src/components/` | Interface (React): início, mapa, bairro, conversa, celular e apps. |
| `src/store.ts` | Salvamento automático em 3 espaços, exportação e importação. |
| `src/test/` | Testes (Vitest), incluindo simulação de balanceamento e uma partida do começo ao fim. |

## Segurança e limites

- **Economia fictícia**: a moeda é ₢ e os cartões que aparecem nas investigações são mascarados (`•••• 0000`). O jogo não tem nenhum campo para dados reais. Um teste verifica que nenhum texto do jogo contém número de cartão.
- **Golpes**: as investigações ensinam a reconhecer golpes (pirâmide, carta falsa, mensagem de "banco", contrato viciado); o jogador desmonta os golpes, não os aplica.
- **Conversas**: as falas são escritas à mão e escolhidas por opções, sem IA. As reações variam por personagem, clima e histórico.
- **Dados**: salvos só no navegador (localStorage, chaves `persuasao:v1:*`). Não há sincronização na nuvem; há exportar/importar em Ajustes.
