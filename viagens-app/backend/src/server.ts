// Ponto de entrada: `npm start` (ou `node src/server.ts`).

import { config } from "./config/env.ts";
import { createApp } from "./app.ts";

const app = createApp(config);
app.listen(config.port, () => {
  const on = (b: boolean) => (b ? "configurado" : "NÃO configurado");
  console.log(`API de viagens em http://localhost:${config.port}`);
  console.log(`  SerpApi (voos e hotéis): ${on(!!config.serpApiKey)}`);
  console.log(`  Duffel (voos): ${on(!!config.duffelToken)}`);
  console.log(`  Contas: ${config.accountsEnabled ? "ligadas" : "desligadas"} · Origens permitidas: ${config.allowedOrigins.join(", ") || "(nenhuma)"}`);
});
