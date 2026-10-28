# Russky

Aplicativo web para aprender russo do zero, explicado em português do Brasil.

## Rodar e publicar

```bash
npm install
npm run dev      # desenvolvimento
npm test         # testes automáticos (lógica de correção, revisão, conversas e integridade do conteúdo)
npm run build    # gera o site em ../russky (publicado pelo GitHub Pages)
```

## Organização

| Pasta | O que tem |
|---|---|
| `src/content/` | Todo o conteúdo pedagógico: alfabeto, mundos e lições (`worlds/w1.ts`…`w5.ts`), gramática, personagens, conversas e história. |
| `src/core/` | Lógica sem interface: correção de respostas, gerador de exercícios, revisão espaçada, progressão, estado do estudante, conquistas e o motor de conversas. |
| `src/components/`, `src/pages/` | Interface (React). |
| `src/audio/` | Síntese de voz, reconhecimento de fala e efeitos sonoros. |
| `src/test/` | Testes (Vitest). |

### Adicionar conteúdo

Não é preciso mexer na interface. Para uma lição nova, acrescente-a a uma unidade em `src/content/worlds/` com:
- `words`: ids do dicionário (crie as entradas no `lexicon` do mesmo arquivo com `w(id, "ру'сский", "português", "pronúncia")`);
- `steps`: cartões (`word`, `letter`, `tip`, `grammar`), frases (`sentence` com todas as formulações aceitas), lacunas (`gap`), correção de erro (`fix`), leitura (`text`), escolhas e pronúncia.

O apóstrofo depois de uma vogal marca o acento tônico (`ма'ма` → ма́ма). Os testes verificam automaticamente que palavras citadas existem, que as lições do Mundo 1 só usam letras já ensinadas, que cada frase aceita a si mesma, que lacunas têm a resposta entre as opções, que todas as palavras dos textos podem ser traduzidas por toque e que as conversas não têm becos sem saída.

## Limitações (declaradas também dentro do app)

- **Áudio**: usa a voz russa instalada no aparelho (Web Speech API). Sem voz russa, os exercícios de áudio viram leitura. Não há gravações de falantes nativos nesta versão.
- **Reconhecimento de fala**: usa o serviço do navegador quando existe (Chrome/Google, Safari/Apple). Ele transcreve; não avalia sotaque. Sem ele, o estudante grava a voz e compara de ouvido (autoavaliação, sem nota automática).
- **Conversas**: o entendimento é feito por padrões e tolerância a erros, sem IA. Os personagens entendem várias formulações e erros pequenos, mas não respostas fora do assunto da missão.
- **Dados**: salvos só no navegador (localStorage, chave `russky:v1`, com migração de versão). Não há sincronização na nuvem; há exportar/importar em Configurações.
- **Lembretes**: não há notificações (exigiriam um servidor de envio).
- **Conteúdo**: Mundos 1–5 (Pré-A1 a A1+) completos; Mundos 6–9 aparecem no mapa como planejados.
