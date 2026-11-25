# Rota — visão geral

## O que o app faz

| Área | O que tem | De onde vêm os dados |
|---|---|---|
| **Passagens** | Origem/destino (cidade com todos os aeroportos ou aeroporto específico), datas, só ida ou ida e volta, adultos/crianças/bebês, classe, só voos diretos. Resultados com companhia, preço total e por passageiro, horários, duração, escalas e tempo de cada conexão, bagagem, regras da tarifa e link de compra. Ordena por menor preço, menor duração, menos escalas e custo-benefício; filtra por escalas, companhia, preço, horário, duração, mala e disponibilidade confirmada. | **Google Flights via SerpApi** (preços encontrados no momento + opções de compra com link para a companhia e agências) e **Duffel** (ofertas das companhias, com disponibilidade confirmada). |
| **Hotéis** | Fotos, estrelas, nota e número de avaliações, localização e distância do centro, lugares próximos, serviços, café da manhã, preço por diária e total, links de reserva. Ordena por relevância, preço, avaliação e distância; compara até 3 lado a lado. | **Google Hotels via SerpApi**. Sem servidor: hospedagens reais do **OpenStreetMap** (sem preço) + links para Booking.com, Google Hotels e Airbnb já com datas e hóspedes. |
| **Destinos** | Resumo e foto, mapa, previsão de 7 dias, pontos turísticos, museus, parques, praias, restaurantes, vida noturna, programas para a família e cultura (com distância, horário, entrada grátis/paga quando o mapa informa, site e resumo da Wikipédia). Roteiro dia a dia agrupando lugares próximos, na ordem do menor caminho, com restaurante perto. Dicas do Wikivoyage. | **OpenStreetMap** (Nominatim e Overpass), **Wikipédia**, **Wikivoyage**, **Open-Meteo** — gratuitos, chamados direto do navegador. |
| **Minhas viagens** | Passagens de ida e volta, hotel e datas, passeios por dia, restaurantes, endereços importantes, gastos e orçamento. Resumo financeiro (passagens, hospedagem, transporte, alimentação, passeios, outros, total e por pessoa). Várias viagens salvas. | Salvo no aparelho; com conta, também no servidor (SQLite). |
| **Comparar** | Até 4 voos lado a lado (diferença de preço, duração, escalas, bagagem, condições e quanto custa cada hora economizada) — inclusive opções digitadas de outros sites, marcadas como «informado por você». Comparação de viagens salvas. | Dados das buscas reais ou digitados pelo usuário. |

## Arquitetura

```
navegador (frontend, GitHub Pages)
 ├─ fontes públicas sem chave: OpenStreetMap, Wikipédia, Wikivoyage, Open-Meteo
 └─ API própria (backend) ──► SerpApi (Google Flights/Hotels), Duffel
                          └─► SQLite (contas e viagens)
```

- As chaves ficam **só** no backend (variáveis de ambiente). O frontend guarda apenas o endereço da API.
- O backend tem CORS restrito às origens configuradas, limite de buscas por IP e cache de 30 min (voos) / 60 min (hotéis) para não gastar cota — o horário original da busca é preservado.
- Fornecedores de voo seguem a mesma interface (`backend/src/services/flights/types.ts`): para incluir outro, crie um módulo e registre em `FLIGHT_PROVIDERS`.

## Fornecedores avaliados (novembro de 2026)

| Fornecedor | Situação | Uso no app |
|---|---|---|
| **SerpApi — Google Flights / Google Hotels** | Ativo. Plano gratuito de 250 buscas/mês; pagos a partir de US$ 25/mês. Os dados são os do Google Flights/Hotels no momento da busca. | Integrado (voos, volta, opções de compra com links, hotéis, ofertas). |
| **Duffel** | Ativo. Preços reais só com a conta ativada (modo live); o modo teste devolve dados fictícios. Cobrança por pedido emitido. | Integrado; ofertas de teste são descartadas (ou aparecem marcadas como TESTE se `DUFFEL_ALLOW_TEST=true`). A compra é feita no site da companhia (o app não emite bilhetes). |
| **Amadeus Self-Service** | **Encerrado em 17/07/2026** (só contrato Enterprise). | Não integrado. |
| **Travelpayouts / Aviasales Data API** | Preços em cache (2 a 7 dias), exige cadastro de afiliado. | Não integrado: a documentação não pôde ser conferida durante o desenvolvimento. Pode entrar como novo módulo de fornecedor. |
| **LiteAPI (hotéis)** | Sandbox gratuito; reserva só pela própria API (pré-reserva e pagamento). | Não integrado: exige montar o fluxo de pagamento; o app usa links de reserva dos fornecedores. |

## Limitações conhecidas

- **Preço total para vários passageiros (SerpApi):** o app trata o `price` do Google Flights como o total da busca e divide pelo número de passageiros. Confira com uma busca real de 2+ passageiros ao configurar.
- **Bagagem e regras na lista do Google Flights:** aparecem completas nas «opções de compra» (por vendedor). A Duffel informa bagagem e regras já na lista.
- **Duffel com várias cidades:** consulta só o primeiro aeroporto de cada lado.
- **Quartos:** o Google Hotels não tem parâmetro de quartos; o preço é de 1 quarto (o app avisa) e os links de reserva levam o número de quartos.
- **OpenStreetMap:** dados colaborativos — horários e preços podem faltar ou estar desatualizados; o app só mostra preço de entrada quando o mapa informa.
