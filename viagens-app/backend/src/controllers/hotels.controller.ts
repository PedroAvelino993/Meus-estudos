import { HttpError, type Req, type Reply } from "../http/router.ts";
import { searchHotels } from "../services/hotels/index.ts";
import { serpApiHotels } from "../services/hotels/serpapi.ts";
import { parseHotelSearch } from "../utils/validate.ts";

export async function search(req: Req): Promise<Reply> {
  if (!serpApiHotels.configured()) throw new HttpError(503, "not_configured", "A busca de hotéis não está configurada no servidor (SERPAPI_KEY).");
  return { json: await searchHotels(parseHotelSearch((req.body ?? {}) as Record<string, unknown>)) };
}
