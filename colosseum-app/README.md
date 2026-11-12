# COLOSSEUM INC.

Jogo de estratégia, administração e expansão mundial, em português do Brasil. Você começa com uma arena de madeira para 500 pessoas em Roma e a transforma numa organização mundial de espetáculos.

## Rodar e publicar

```bash
npm install
npm run dev      # desenvolvimento
npm test         # testes: sistemas + 3 campanhas completas jogadas por um bot (início → vitória)
npm run build    # gera o jogo em ../colosseum (publicado pelo GitHub Pages)
```

Diagnóstico de balanceamento: `DIAG=1 W=200 EVERY=5 SEEDS=1,2 npx vitest run src/core/diag.test.ts`.

## Sistemas

- **Semana a semana**: «Avançar semana» resolve, nesta ordem:
  1. eventos planejados;
  2. mercados do Arena Bets;
  3. despesas e receitas fixas;
  4. treino e condição dos gladiadores;
  5. a IA dos rivais;
  6. as filiais;
  7. crises e missões;
  8. o mercado de previsões;
  9. eras, conquistas, vitória e derrota.
- **Eventos** (`src/core/events.ts`):
  - **Público:** depende da população, da popularidade, da atração da modalidade, do gosto da região, da novidade, das estrelas, das rivalidades, da divulgação, do preço em relação ao preço justo, da concorrência e de um fator de sorte.
  - **Satisfação:** soma o nível dos gladiadores, a decoração, a estrutura, os organizadores, os extras e o drama dos combates, e desconta preço abusivo, repetição e cansaço.
  - **Combates:** são simulados de verdade, gerando lesões, fama, relações e recordes.
- **Pontos de evolução**: vêm de eventos, estreias, recordes, contratações famosas, obras, filiais, conquistas, disputas com o rival e mercados.
- **Árvore** (`src/content/tree.ts`): 6 categorias com pré-requisitos e escolhas que fecham o caminho alternativo, como Tradição × Vanguarda, Disciplina × Estrelato, Pão e circo × Exclusividade, Austeridade × Investimento e Favor do Imperador × Voz do Povo.
- **Rivais** (`src/core/rival.ts`): a Dominus Arena surge na Era 2, com dinheiro, estádio, gladiadores, estratégias e ímpeto. Ela disputa:
  - o público de Roma;
  - os gladiadores (propostas pelas suas estrelas e contratações no mercado);
  - os contratos de patrocínio;
  - o voto imperial;
  - os jogos internacionais;
  - as províncias.

  Na Era 5 começa a Rebelião das Arenas.
- **Derrota**: 5 semanas no vermelho, 4 semanas sem popularidade, 4 semanas sem favor imperial ou 12 semanas de domínio de um rival.
- **Vitória**: prestígio, filiais, público histórico, lendas, estrutura, rivais superados e reconhecimento histórico. Depois da vitória há o modo infinito.
- **Arena Bets** (`src/core/bets.ts`):
  - 8 tipos de mercado.
  - Probabilidades do modelo vêm de um Monte Carlo com o mesmo simulador dos eventos; o administrador pode publicar estimativas próprias.
  - 30 previsores com nome.
  - Credibilidade medida pela pontuação de Brier, pela transparência e pela clareza das regras.
  - Concorrência com a Dominus Arena Bets.
  - Árvore própria com 5 ramos × 8 melhorias.
- **Central Imperial**:
  - níveis de autoridade;
  - Decreto Imperial (roteiros e arcos de temporada);
  - direção dramática;
  - jogos internacionais;
  - controles do mercado;
  - delegação a gerentes (diretor, tesoureiro, governadores e pregoeiro), que podem ser desligados a qualquer momento.

## Segurança e limites

- Fichas do Arena Bets são fictícias e gratuitas. Não existe depósito, saque, pagamento nem conversão em dinheiro.
- Espetáculos roteirizados aparecem sempre como «ROTEIRIZADO» e não podem ter mercado. Se um evento com mercado vira roteirizado ou é cancelado, o mercado é cancelado e as fichas voltam.
- Combates são esportivos e coreografados, sem descrições gráficas; criaturas e empresas são fictícias.

## Organização

| Pasta | O que tem |
|---|---|
| `src/content/` | Modalidades, construções, regiões, eras (`world.ts`), árvores (`tree.ts`), personagens (`gladiators.ts`), crises, histórias do Decreto, tutorial e conquistas (`story.ts`). |
| `src/core/` | Lógica pura e testável: estado, economia, eventos, gladiadores, árvore, construção, mundo, rivais, Arena Bets, crises, progressão, turno, salvamento e o bot de testes. |
| `src/screens/`, `src/ui/` | Interface React: painel do Coliseu, eventos, gladiadores, evolução, construção, mapa, Arena Bets, rivais, Central Imperial, crônica e ajustes. |
