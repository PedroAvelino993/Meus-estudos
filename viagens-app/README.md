# Rota — agência de viagens digital

Pesquise o voo mais barato entre dois lugares, compare horários e duração, encontre hotéis, descubra o que fazer no destino e organize a viagem inteira em um lugar.

**Regra do projeto:** nenhum preço, voo ou hotel é inventado. Cada preço mostra a fonte, a hora em que foi encontrado e se a disponibilidade foi confirmada. Quando um fornecedor não está configurado, o app diz o que falta e oferece links para a mesma busca nos sites oficiais.

- `frontend/` — app web (React + TypeScript + Vite). Publicado em `/viagens/` no GitHub Pages.
- `backend/` — API (Node 22 + TypeScript, sem dependências de produção). Guarda as chaves das APIs e consulta os fornecedores.
- `shared/` — tipos e dados usados pelos dois lados.
- `docs/` — [visão geral](docs/README.md), [API](docs/API.md) e [instalação e configuração](docs/SETUP.md).

```bash
npm run install:all
npm run dev:api     # API em http://localhost:8787
npm run dev:web     # app em http://localhost:5173
npm test            # testes do backend e do frontend
```
