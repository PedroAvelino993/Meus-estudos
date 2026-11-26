# Instalação e configuração

## Requisitos

- **Node.js 22.18 ou mais novo** (o backend roda TypeScript direto no Node, sem compilação).

## Rodar no computador

```bash
cd viagens-app
npm run install:all
cp backend/.env.example backend/.env     # preencha as chaves (veja abaixo)
npm run dev:api                          # http://localhost:8787
npm run dev:web                          # http://localhost:5173
```

No app, abra **Ajustes → Servidor de pesquisa** e informe `http://localhost:8787` (ou crie `frontend/.env` com `VITE_API_URL=http://localhost:8787`). No `backend/.env`, `ALLOWED_ORIGINS` precisa incluir o endereço do app (`http://localhost:5173`).

Testes: `npm test` (backend com `node --test`, frontend com Vitest). Tipos: `npm run typecheck`.

## Chaves das APIs (todas opcionais)

Sem nenhuma chave o app funciona com: links de busca nos sites oficiais, assistente de destinos, roteiros, planejamento, comparador e viagens salvas. Cada chave liga uma parte:

### SerpApi — passagens e hotéis com preço (Google Flights e Google Hotels)

1. Crie a conta em <https://serpapi.com/users/sign_up> (plano gratuito: 250 buscas por mês).
2. Copie a chave em <https://serpapi.com/manage-api-key>.
3. No servidor: `SERPAPI_KEY=...`

Cada busca de voos gasta 1 crédito; escolher a volta e ver as opções de compra gastam mais 1 cada. Buscas iguais em até 30 min (voos) / 60 min (hotéis) usam o cache do servidor e não gastam.

### Duffel — ofertas das companhias com disponibilidade confirmada

1. Crie a conta em <https://app.duffel.com>.
2. Para preços **reais**, ative a conta (modo *live*) seguindo o painel da Duffel. Tokens de teste (`duffel_test_…`) devolvem dados fictícios, que o app descarta.
3. No servidor: `DUFFEL_TOKEN=duffel_live_...`

### Ofertas da página inicial (opcional)

```
DEALS_ORIGIN=FOR
DEALS_DESTINATIONS=GRU,GIG,REC,SSA,LIS
DEALS_DAYS_AHEAD=30
DEALS_REFRESH_HOURS=12
```

Usa a SerpApi (1 busca por destino a cada atualização).

## Publicar

### App (frontend) — GitHub Pages

`npm run build` gera o site em `../viagens/` (raiz do repositório), publicado em `https://<usuário>.github.io/<repositório>/viagens/`.

### API (backend) — Render (gratuito)

1. Em <https://render.com>: **New → Blueprint** e escolha o repositório (usa o `render.yaml` da raiz do repositório).
2. Preencha no painel: `ALLOWED_ORIGINS=https://<usuário>.github.io`, `SERPAPI_KEY`, `DUFFEL_TOKEN` (opcional), `DEALS_*` (opcional).
3. Depois de publicado, copie o endereço (ex.: `https://rota-api.onrender.com`) e coloque no app em **Ajustes → Servidor de pesquisa**.

No plano gratuito do Render o disco é apagado quando o serviço reinicia: as contas e viagens na nuvem se perdem. Para guardar de verdade, use um disco persistente (plano pago) ou mantenha `ACCOUNTS_ENABLED=false` e use as viagens salvas no aparelho (com exportar/importar em Ajustes).

### Tudo em um servidor só

Defina `STATIC_DIR` com o caminho do site compilado (ex.: `STATIC_DIR=../../viagens`) e o backend também entrega o app no mesmo endereço.

## Variáveis de ambiente

| Variável | Padrão | Para quê |
|---|---|---|
| `PORT` | 8787 | Porta da API |
| `ALLOWED_ORIGINS` | — | Endereços do app que podem chamar a API (vírgula) |
| `SERPAPI_KEY` | — | Google Flights e Google Hotels |
| `SERPAPI_BASE_URL` | `https://serpapi.com/search` | Só para testes/proxy |
| `DUFFEL_TOKEN` | — | Ofertas Duffel |
| `DUFFEL_ALLOW_TEST` | false | Mostrar ofertas de teste (marcadas como TESTE) |
| `DEALS_ORIGIN`, `DEALS_DESTINATIONS`, `DEALS_DAYS_AHEAD`, `DEALS_REFRESH_HOURS` | — / 30 / 12 | Ofertas da página inicial |
| `ACCOUNTS_ENABLED` | true | Contas e viagens na nuvem |
| `DATABASE_FILE` | `./data/viagens.db` | Banco SQLite |
| `RATE_LIMIT_PER_MINUTE` | 20 | Buscas por IP por minuto |
| `STATIC_DIR` | — | Servir o app pelo backend |

## Atualizar a base de aeroportos

```bash
curl -O https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv
npm run airports -- airports.csv
```
