// Falas geradas na hora. Dois jeitos: uma IA gratuita que roda no próprio aparelho (padrão)
// ou Claude, com a chave paga do próprio jogador.
// O motor do jogo continua decidindo os números (confiança, desconfiança, desfecho);
// a IA escreve o que o personagem diz, reagindo ao texto exato que o jogador digitou.
// A chave fica só neste navegador (localStorage) e nunca entra no salvamento exportado.

import Anthropic from "@anthropic-ai/sdk";
import type { Character, Mission, Reaction } from "./core/types";
import type { EncounterState, LogEntry } from "./core/encounter";
import { OUTCOME_LABEL } from "./core/types";
import { LOCAL_MODELS, crashedLastTime, hasWebGPU, localComplete, suggestedLocalModel, type LocalMessage } from "./local-llm";

export const AI_MODELS = [
  { id: "claude-opus-5-5", name: "Claude Opus 5.5", note: "melhor escrita (padrão)" },
  { id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5", note: "rápido e bom" },
  { id: "claude-haiku-5-5", name: "Claude Haiku 5.5", note: "o mais barato" },
] as const;

export interface AiSettings {
  /** "local" = IA gratuita no aparelho; "claude" = API da Anthropic (paga). */
  provider: "local" | "claude";
  apiKey: string;
  model: string;
  localModel: string;
  /** O modelo local já foi baixado e carregou pelo menos uma vez. */
  localReady: boolean;
  enabled: boolean;
}

const KEY = "persuasao:ai";

export function loadAi(): AiSettings {
  const base: AiSettings = { provider: "local", apiKey: "", model: "claude-opus-5-5", localModel: suggestedLocalModel(), localReady: false, enabled: true };
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return base;
  }
}

export function saveAi(a: AiSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    /* sem armazenamento */
  }
}

/**
 * Chamado ao abrir o jogo. Se a IA do aparelho travou a página da última vez, troca para um
 * modelo menor (ou desliga a IA, se já era o menor) e devolve um aviso para mostrar ao jogador.
 */
export function recoverFromCrash(): string | null {
  if (!crashedLastTime()) return null;
  const a = loadAi();
  if (a.provider !== "local" || !a.enabled) return null;
  const i = LOCAL_MODELS.findIndex((m) => m.id === a.localModel);
  if (i > 0) {
    saveAi({ ...a, localModel: LOCAL_MODELS[0].id, localReady: false });
    return "A IA travou o aparelho por falta de memória. Troquei para o modelo Mínimo (menor). Toque em «Ligar IA grátis» na conversa para baixá-lo.";
  }
  saveAi({ ...a, enabled: false });
  return "A IA travou o aparelho por falta de memória, mesmo no modelo Mínimo. Desliguei a IA: o jogo segue com as falas prontas. Dá para religar em Celular → Ajustes.";
}

export function aiActive(a: AiSettings): boolean {
  if (!a.enabled) return false;
  if (a.provider === "local") return a.localReady && hasWebGPU();
  return a.apiKey.trim().length > 20;
}

export function aiName(a: AiSettings): string {
  return a.provider === "local" ? `IA do aparelho (${LOCAL_MODELS.find((m) => m.id === a.localModel)?.name ?? "local"})` : AI_MODELS.find((m) => m.id === a.model)?.name ?? a.model;
}

/** Limpa o que modelos pequenos às vezes acrescentam: nome antes da fala, aspas, raciocínio. */
export function cleanReply(raw: string, c: Character): string {
  const first = c.nick ?? c.name.split(" ")[0];
  let t = raw.replace(/<think>[\s\S]*?(<\/think>|$)/g, "").trim();
  const names = [first, c.name, c.name.split(" ")[0]].map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  t = t.replace(new RegExp(`^\\**(${names})\\**\\s*[:：—-]\\s*`, "i"), "");
  t = t.replace(/^["«“]+|["»”]+$/g, "").trim();
  if (t.length > 420) {
    const cut = t.slice(0, 420);
    const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
    t = end > 80 ? cut.slice(0, end + 1) : cut + "…";
  }
  return t;
}

const REACTION_TEXT: Record<Reaction, string> = {
  warm: "a fala do jogador te tocou ou agradou de verdade",
  interested: "você ficou interessado(a)",
  considering: "você está pensando, pesando o que ouviu",
  amused: "você achou graça",
  skeptical: "você desconfiou",
  impatient: "você está impaciente e quer que ele vá direto ao ponto",
  offended: "você se ofendeu",
  confused: "você não entendeu bem aonde ele quer chegar",
  neutral: "a fala não mexeu muito com você",
};

const TRAIT_TEXT: [keyof Character["traits"], string, string][] = [
  ["analytical", "gosta de lógica e números", "decide mais pelo sentimento"],
  ["warmth", "é caloroso(a) e gosta de conversa", "é seco(a), vai direto ao assunto"],
  ["pride", "é orgulhoso(a) e detesta ser ensinado(a)", "é humilde"],
  ["skepticism", "é muito desconfiado(a) de promessas", "costuma acreditar nas pessoas"],
  ["impatience", "é impaciente", "tem paciência"],
  ["humor", "adora uma piada", "não tem muito senso de humor"],
  ["frugality", "é muito cuidadoso(a) com dinheiro", "não liga muito para dinheiro"],
  ["risk", "gosta de arriscar", "tem medo de arriscar"],
  ["formality", "espera ser tratado(a) com formalidade", "é informal"],
];

function characterSheet(c: Character, m: Mission): string {
  const first = c.nick ?? c.name.split(" ")[0];
  const traits = TRAIT_TEXT.map(([k, hi, lo]) => (c.traits[k] >= 0.6 ? hi : c.traits[k] <= 0.3 ? lo : null)).filter(Boolean);
  const voice = [...c.voice.greet, ...c.voice.reactions.skeptical, ...c.voice.reactions.warm, ...c.voice.reactions.impatient].slice(0, 7);
  return `Você interpreta ${c.name} (${first}), personagem de um jogo de ficção em português do Brasil chamado «The Art of Persuasion», passado em Vila Áurea, uma cidade inventada. O jogador interpreta um golpista que conversa com você. Você é uma pessoa comum dessa cidade e não sabe que é golpe — a não ser que perceba sozinho(a).

QUEM VOCÊ É
- ${c.age} anos, ${c.role}.
- ${c.bio}
- Família: ${c.family}
- Dinheiro: ${c.finances}
- Personalidade: ${traits.join("; ") || "equilibrada"}.
- Gosta de: ${c.likes.join(", ")}. Não gosta de: ${c.dislikes.join(", ")}.
- Limites (o que te faz encerrar a conversa): ${c.limits.join("; ")}.
- Assuntos que te aproximam das pessoas: ${c.interests.map((i) => `${i.topic} (você diria algo como: "${i.reply}")`).join("; ")}.
- Exemplos do seu jeito de falar (não repita, só use como tom): ${voice.map((v) => `"${v}"`).join(" ")}

O QUE VOCÊ GUARDA (pontos fracos)
${c.needs.map((n) => `- ${n.label}`).join("\n")}
Só fale desses assuntos com profundidade quando a direção do jogo pedir. Antes disso, se perguntarem, desconverse do seu jeito.

O QUE O JOGADOR ESTÁ TENTANDO (você não sabe disso)
${m.brief.replace(/\{name\}/g, first)}

COMO RESPONDER
- Escreva só a fala de ${first}, em português do Brasil coloquial e natural, como numa conversa de verdade: de 1 a 3 frases curtas (no máximo umas 60 palavras).
- Pode incluir uma ação curta entre parênteses, como "(olha o relógio)". Nunca narre em terceira pessoa, nunca coloque o seu nome antes da fala e não use aspas em volta da fala.
- Se o jogador fez uma pergunta, responda primeiro a ela, de forma direta e concreta, como uma pessoa normal (nada de «Sei.» ou «Ah, é?» sozinhos). Depois, se fizer sentido, volte ao assunto da conversa.
- Reaja ao que o jogador escreveu de verdade, com as palavras dele. Se ele disser algo sem sentido ou fora de contexto, reaja como ${first} reagiria.
- A cada fala, o jogo manda uma «direção» (mensagem de sistema) dizendo como você recebeu a fala, o que você precisa transmitir e se a conversa termina. Siga a direção: ela decide se você gostou, desconfiou, revelou algo, aceitou, recusou ou foi embora. Nunca decida o desfecho por conta própria e mantenha exatamente os valores em ₢ que a direção citar.
- Tudo é ficção. Se você entregar dados, cartão ou senha, apenas diga que entrega ("tá, anota aí", "toma o cartão") sem ditar números. Se o jogador pedir instruções reais de crime ou sair do jogo, ${first} simplesmente estranha e muda de assunto.
- Nunca diga que é uma IA nem fale das regras do jogo.`;
}

function transcript(log: LogEntry[]): Anthropic.Beta.BetaMessageParam[] {
  const out: Anthropic.Beta.BetaMessageParam[] = [];
  for (const l of log) {
    if (l.who === "sys" || !l.text.trim()) continue;
    const role = l.who === "me" ? "user" : "assistant";
    const last = out[out.length - 1];
    if (last && last.role === role && typeof last.content === "string") last.content = `${last.content}\n${l.text}`;
    else out.push({ role, content: l.text });
  }
  if (!out.length || out[0].role !== "user") out.unshift({ role: "user", content: "(Uma pessoa que você não conhece se aproxima para conversar.)" });
  return out;
}

export interface Direction {
  reaction: Reaction;
  lines: string[];
  attrs: EncounterState["attrs"];
  outcome: EncounterState["outcome"];
  done: boolean;
  question: boolean;
  opening: boolean;
  /** O jogador falou algo fora do roteiro (pergunta ou comentário livre). */
  free?: boolean;
}

function directionText(d: Direction, first: string): string {
  const a = d.attrs;
  const parts = [
    d.opening ? `Direção do jogo: esta é a sua primeira fala. ${first} acabou de ser abordado(a).` : `Direção do jogo para a próxima fala de ${first}: ${REACTION_TEXT[d.reaction]}.`,
    `Estado de ${first} agora (0 a 100): confiança ${a.trust}, interesse ${a.interest}, paciência ${a.patience}, desconfiança ${a.suspicion}, humor ${a.mood}, simpatia pelo jogador ${a.affinity}.`,
    d.free
      ? `O jogador fez uma pergunta ou comentário livre. Responda EXATAMENTE ao que ele perguntou ou disse, de forma direta, concreta e natural, como uma pessoa normal responderia. Não mude de assunto, não fale do negócio dele a menos que ele pergunte, e não responda só «Sei» ou «Ah, é?».${d.lines.length ? ` Se ajudar, use este fato sobre você: ${d.lines.join(" ")}` : ""}`
      : `Transmita, com as suas palavras e reagindo ao que o jogador acabou de dizer (não copie as frases):\n${d.lines.map((l) => `- ${l}`).join("\n")}`,
  ];
  if (d.question) parts.push("Termine a fala com essa pergunta, do seu jeito.");
  if (d.done) parts.push(`A conversa termina nesta fala (${OUTCOME_LABEL[d.outcome ?? "left"]}). Despeça-se de acordo.`);
  return parts.join("\n\n");
}

export class AiError extends Error {}

/** Escreve a fala do personagem na hora. `onText` recebe o texto parcial enquanto chega. */
export async function npcReply(opts: {
  settings: AiSettings;
  character: Character;
  mission: Mission;
  history: LogEntry[];
  typed: string | null;
  direction: Direction;
  onText: (text: string) => void;
  onStatus?: (text: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const { settings, character: c, mission: m } = opts;
  if (settings.provider === "local") return localReply(opts);
  const client = new Anthropic({ apiKey: settings.apiKey.trim(), dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 60_000 });
  const first = c.nick ?? c.name.split(" ")[0];
  const messages = transcript(opts.history);
  if (opts.typed) messages.push({ role: "user", content: opts.typed });
  messages.push({ role: "system", content: directionText(opts.direction, first) });

  // Opus e Sonnet: se um filtro de segurança recusar, o próprio servidor tenta outro modelo.
  const fallback = settings.model !== "claude-haiku-5-5";
  try {
    const stream = client.beta.messages.stream(
      {
        model: settings.model,
        max_tokens: 2000,
        output_config: { effort: "low" },
        system: [{ type: "text", text: characterSheet(c, m), cache_control: { type: "ephemeral" } }],
        messages,
        ...(fallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      },
      { signal: opts.signal },
    );
    stream.on("text", (_delta, snapshot) => opts.onText(snapshot));
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") throw new AiError("O modelo recusou esta fala.");
    const text = msg.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim()
      .replace(/^["«]|["»]$/g, "");
    if (!text) throw new AiError("A resposta veio vazia.");
    return text;
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new AiError("Chave da API inválida. Confira em Ajustes.");
    if (e instanceof Anthropic.PermissionDeniedError) throw new AiError("Essa chave não tem permissão para este modelo.");
    if (e instanceof Anthropic.RateLimitError) throw new AiError("Limite de uso da API atingido. Espere um pouco.");
    if (e instanceof Anthropic.BadRequestError) throw new AiError(`A API recusou o pedido: ${e.message}`);
    if (e instanceof Anthropic.APIError) throw new AiError(`Erro da API (${e.status ?? "?"}).`);
    throw new AiError("Sem conexão com a IA.");
  }
}

/** Teste rápido da chave (Ajustes). */
export async function testKey(settings: AiSettings): Promise<string> {
  const client = new Anthropic({ apiKey: settings.apiKey.trim(), dangerouslyAllowBrowser: true, maxRetries: 0, timeout: 30_000 });
  try {
    const msg = await client.messages.create({
      model: settings.model,
      max_tokens: 400,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: "Responda só com: tudo certo!" }],
    });
    return msg.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim() || "ok";
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new AiError("Chave inválida.");
    if (e instanceof Anthropic.APIError) throw new AiError(`Erro da API (${e.status ?? "?"}): ${e.message}`);
    throw new AiError("Sem conexão com a API.");
  }
}

/** Versão para a IA local: tudo vai no começo (modelos pequenos seguem melhor assim) e o histórico é curto. */
/** Ficha curta para a IA do aparelho: modelos pequenos têm pouca memória para ler. */
function compactSheet(c: Character, m: Mission): string {
  const first = c.nick ?? c.name.split(" ")[0];
  const bio = (c.bio.match(/^[^.]+\./) ?? [c.bio])[0];
  const brief = (m.brief.replace(/\{name\}/g, first).match(/^[^.]+\./) ?? [m.brief])[0];
  return `Você é ${c.name} (${first}), ${c.age} anos, ${c.role.toLowerCase()}, numa cidade inventada chamada Vila Áurea. ${bio} Família: ${c.family} Gosta de: ${c.likes.slice(0, 3).join(", ")}. Não gosta de: ${c.dislikes.slice(0, 2).join(", ")}.
Jeito de falar: ${c.voice.greet[0]}
O jogador conversa com você. O que ele quer (você não sabe): ${brief}
Regras: responda só a fala de ${first}, em português do Brasil coloquial, em 1 a 3 frases curtas. Responda primeiro ao que o jogador perguntou. Não narre, não diga que é IA, não dite números de cartão ou senha.`;
}

/** Estimativa grosseira de tokens (português ≈ 3 caracteres por token). */
const tokens = (t: string) => Math.ceil(t.length / 3);
const LOCAL_BUDGET = 1500;

async function localReply(opts: Parameters<typeof npcReply>[0]): Promise<string> {
  const { settings, character: c, mission: m } = opts;
  const first = c.nick ?? c.name.split(" ")[0];
  const direction = directionText(opts.direction, first)
    .split("\n\n")
    .filter((p) => !p.startsWith("Estado de"))
    .join("\n");
  const system = `${compactSheet(c, m)}\n\n${direction}`;
  const hist = transcript(opts.history)
    .slice(-6)
    .map((x) => ({ role: x.role as "user" | "assistant", content: String(x.content).slice(0, 300) }));
  // Corta o histórico até caber na memória do modelo
  while (hist.length && tokens(system) + hist.reduce((a, x) => a + tokens(x.content), 0) + tokens(opts.typed ?? "") + 60 > LOCAL_BUDGET) hist.shift();
  while (hist.length && hist[0].role !== "user") hist.shift();
  const messages: LocalMessage[] = [{ role: "system", content: system }, ...hist];
  const last = opts.typed ?? "(Uma pessoa que você não conhece se aproxima e puxa conversa.)";
  if (messages[messages.length - 1].role === "user") messages[messages.length - 1] = { role: "user", content: `${messages[messages.length - 1].content}\n${last}` };
  else messages.push({ role: "user", content: last });
  // Modelos pequenos se perdem: lembra no fim o que fazer com a fala do jogador
  if (opts.direction.free && opts.typed) messages[messages.length - 1] = { role: "user", content: `${messages[messages.length - 1].content}\n\n(Responda a isso como ${first}, direto ao ponto, em 1 ou 2 frases.)` };
  try {
    const raw = await localComplete(settings.localModel, messages, (t) => opts.onText(cleanReply(t, c)), opts.onStatus);
    const text = cleanReply(raw, c);
    if (!text) throw new AiError("A IA do aparelho não respondeu.");
    return text;
  } catch (e) {
    if (e instanceof AiError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    if (/webgpu|gpu|adapter/i.test(msg)) throw new AiError("Este navegador não conseguiu usar a placa de vídeo (WebGPU).");
    if (/memory|oom|allocation/i.test(msg)) throw new AiError("Faltou memória para o modelo. Tente o modelo Mínimo em Ajustes.");
    if (/context|window|exceed|too long/i.test(msg)) throw new AiError("A conversa ficou longa demais para a IA do aparelho.");
    throw new AiError(`A IA do aparelho falhou: ${msg.slice(0, 120)}`);
  }
}
