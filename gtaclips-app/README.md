# GTA Clips AI

Editor inteligente que transforma gameplays longas em clipes curtos para YouTube Shorts e outros formatos. Tudo roda no navegador, no aparelho do usuário: os vídeos não são enviados para nenhum servidor.

## Rodar e publicar

```bash
npm install
npm run dev      # desenvolvimento (harness.html = página de teste do pipeline)
npm test         # testes do núcleo (momentos, histórias, linha do tempo, legendas, aprendizado)
npm run build    # gera o app em ../gtaclips (publicado pelo GitHub Pages)
```

## Arquitetura

| Parte | Tecnologia | Onde |
|---|---|---|
| Interface | React + TypeScript + Vite, PWA | `src/App.tsx`, `src/screens/`, `src/ui/` |
| Leitura, cortes, montagem e MP4 | [Mediabunny](https://mediabunny.dev) + WebCodecs (decodificação/codificação por hardware) | `src/media/probe.ts`, `analyze.ts`, `export.ts` |
| Composição de quadros (formato, reenquadramento, zoom, ajustes, transições, legendas) | Canvas 2D, a mesma função na prévia e no arquivo final | `src/media/compose.ts` |
| Visão (contexto das cenas) | CLIP ViT-B/32 via Transformers.js, num worker (WebGPU ou WASM) | `src/media/ai-worker.ts` |
| Fala e legendas | Whisper (tiny/base/small) via Transformers.js, detecção de idioma pelo decodificador | `src/media/ai-worker.ts`, `speech.ts` |
| Tradução local | NLLB-200 600M (opcional, ~600 MB) | `src/media/ai-worker.ts` |
| IA avançada (opcional) | Claude, com a chave do próprio usuário: correção/tradução de legendas, títulos, descrições e consulta aos requisitos oficiais do YouTube por busca na web | `src/media/claude.ts` |
| Banco de dados e armazenamento | IndexedDB: projetos, miniaturas, cópias opcionais dos originais e MP4 exportados | `src/media/db.ts` |
| Processamento em segundo plano | Fila de tarefas com progresso, cancelamento e tela acesa (Wake Lock) | `src/ui/store.tsx` |
| YouTube | API oficial (OAuth do Google, só leitura): Data API v3 e Analytics API | `src/media/youtube.ts` |
| Núcleo testável (sem navegador) | Medidas, momentos e pontuação, histórias, linha do tempo, legendas, aprendizado | `src/core/` |

## Como a IA escolhe os momentos

1. **Leitura dos quadros.** Lê os quadros-chave do vídeo inteiro (rápido, sem decodificar tudo) e mede:
   - movimento, cortes de cena e centro da ação;
   - brilho, saturação e detalhes;
   - pixels de fogo e de sirene;
   - o volume do áudio, 4 vezes por segundo.
2. **Reconhecimento da cena.** Com a IA de visão, o CLIP compara cada quadro com descrições de perseguição, explosão, batida, tiroteio, briga, queda, menu, tela de carregamento, mapa, espera e outras. A probabilidade se combina com as medidas.
3. **Momentos e nota.** O vídeo vira momentos contínuos, e cada um recebe uma nota de 0 a 100 a partir de oito fatores:
   - intensidade;
   - surpresa;
   - humor;
   - importância na história;
   - qualidade visual;
   - ritmo;
   - potencial de retenção (estimado, não é métrica real);
   - clareza.

   Tempo morto fica com no máximo 12.
4. **Histórias.** Acontecimentos relacionados viram uma linha (ex.: polícia → perseguição → batida → explosão). Cada clipe mantém, em ordem cronológica e cabendo na duração pedida:
   - o contexto antes do primeiro acontecimento;
   - um bloco contínuo em volta do clímax;
   - um desfecho.

   Clipes diferentes nunca repetem trechos.
5. **Modo história contínua.** Corta o tempo morto e comprime cada momento (sem pular a sequência). Cada parte termina num ponto de tensão real.
6. **Aprendizado com o canal.** Com o canal conectado, os tipos de clipe que performam melhor ganham até +20% na nota, e os que performam pior perdem até −20%. Isso só vale com pelo menos 3 vídeos do tipo.

## Limites honestos

- A análise de contexto depende do modelo de visão (baixa ~150 MB na primeira vez). Sem ele, funciona só com medidas de imagem e som.
- Navegadores sem WebCodecs não conseguem analisar nem exportar.
- O app precisa de acesso ao arquivo original para exportar: ou ele foi aberto na sessão, ou foi guardada uma cópia no aparelho.
- **Separação de vozes:** é uma estimativa pela altura da voz.
- **Músicas e efeitos:** nenhum é adicionado.
- **Monetização:** o app não promete nada. Os requisitos foram verificados em 15/11/2026, com links oficiais.
