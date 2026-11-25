import type { ServerStatus } from "../../../shared/types.ts";
import { config } from "../config/env.ts";
import type { Reply } from "../http/router.ts";
import { dealsConfigured, getDeals } from "../services/deals/index.ts";

export function status(): Reply {
  const s: ServerStatus = {
    version: config.version,
    flights: { serpapi: !!config.serpApiKey, duffel: !!config.duffelToken },
    hotels: { serpapi: !!config.serpApiKey },
    deals: dealsConfigured(),
    accounts: config.accountsEnabled,
  };
  return { json: s };
}

export async function deals(): Promise<Reply> {
  return { json: await getDeals() };
}
