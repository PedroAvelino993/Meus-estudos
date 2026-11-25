# API do backend

Base: o endereço onde a API está publicada (ex.: `https://rota-api.onrender.com`). Respostas em JSON. Erros sempre no formato:

```json
{ "error": "mensagem para o usuário", "code": "not_configured | bad_request | provider_error | unauthorized | rate_limited | not_found | server_error" }
```

Os tipos completos estão em [`shared/types.ts`](../shared/types.ts).

## Situação

`GET /api/status` → `ServerStatus`: quais fornecedores estão configurados (`flights.serpapi`, `flights.duffel`, `hotels.serpapi`, `deals`, `accounts`).

## Voos

`POST /api/flights/search` — corpo `FlightSearchParams`:

```json
{ "origin": ["FOR"], "destination": ["GRU", "CGH"], "departDate": "2026-12-20", "returnDate": "2026-12-27",
  "adults": 2, "children": 0, "infants": 0, "cabin": "economy", "directOnly": false, "currency": "BRL" }
```

Resposta `FlightSearchResponse`: `offers[]` (ordenadas pelo menor preço, sem repetidos entre fornecedores), `providers[]` (resultado de cada fornecedor, inclusive «não configurado» e erros), `insights` (nível de preço do Google Flights), `notes[]`, `fetchedAt`.

Cada `FlightOffer` traz `legs[]` (segmentos e conexões com tempo de espera), `price` (`total`, `perPassenger`, `kind: found|estimated`, `basis`), `baggage`, `fareRules`, `fetchedAt`, `availability` (`confirmed` só quando a companhia confirmou — Duffel), e `booking`:

- `{ kind: "serpapi_return", token }` — ida e volta no Google Flights: peça os voos de volta.
- `{ kind: "serpapi_booking", token }` — peça as opções de compra.
- `{ kind: "link", url, label }` — link direto (site da companhia).

`POST /api/flights/returns` — `{ search: FlightSearchParams, token, outbound: FlightLeg }` → `FlightSearchResponse` com ofertas de 2 trechos (preço = total ida + volta).

`POST /api/flights/booking` — `{ search, token }` → `BookingOptionsResponse`: vendedores (companhia primeiro), preço, bagagem, condições e `request { url, postData }` (abrir com POST quando houver `postData`).

## Hotéis

`POST /api/hotels/search` — corpo `HotelSearchParams` (`query`, `checkIn`, `checkOut`, `adults`, `children`, `childrenAges`, `rooms`, `currency`, `sort: relevance|price|rating|reviews`, `minRating`, `stars`) → `HotelSearchResponse` com `hotels[]` (`HotelOffer`).

## Ofertas

`GET /api/deals` → `DealsResponse`: menor preço só de ida para as rotas de `DEALS_ORIGIN`/`DEALS_DESTINATIONS`, atualizado no máximo a cada `DEALS_REFRESH_HOURS`, com `fetchedAt` de cada preço.

## Contas e viagens

| Método | Rota | Corpo / resposta |
|---|---|---|
| POST | `/api/auth/register` | `{ email, password (≥ 8), name }` → `{ user, token }` |
| POST | `/api/auth/login` | `{ email, password }` → `{ user, token }` |
| GET | `/api/auth/me` | `Authorization: Bearer <token>` → `{ user }` |
| POST | `/api/auth/logout` | encerra a sessão |
| GET | `/api/trips` | `{ trips: Trip[] }` |
| PUT | `/api/trips/:id` | corpo `Trip` (salva ou atualiza) |
| DELETE | `/api/trips/:id` | apaga |

Senhas com scrypt e sal aleatório; o token de sessão (30 dias) é aleatório e só o hash dele fica no banco.

## Limites

As rotas de busca (`/api/flights/*`, `/api/hotels/search`) aceitam `RATE_LIMIT_PER_MINUTE` buscas por IP (padrão 20) e devolvem `429 rate_limited` acima disso.
