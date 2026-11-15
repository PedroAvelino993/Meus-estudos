// IA avançada (opcional) com Claude, usando a chave do próprio usuário (fica só neste navegador).
// Usada para: corrigir e traduzir legendas, descrever clipes olhando os quadros, sugerir título,
// descrição e hashtags, e consultar os requisitos atuais de monetização nas páginas oficiais.

import Anthropic from "@anthropic-ai/sdk";
import type { Caption, Category } from "../core/types";
import { languageName } from "../core/captions";

const KEY = "gca:claudeKey";
const MODEL = "claude-opus-5-5";

export function claudeKey(): string {
  return localStorage.getItem(KEY) ?? "";
}

export function setClaudeKey(k: string) {
  if (k.trim()) localStorage.setItem(KEY, k.trim());
  else localStorage.removeItem(KEY);
}

export function claudeAvailable(): boolean {
  return claudeKey().startsWith("sk-ant-");
}

function client() {
  return new Anthropic({ apiKey: claudeKey(), dangerouslyAllowBrowser: true, maxRetries: 2 });
}

async function ask(content: Anthropic.Beta.BetaContentBlockParam[] | string, opts: { system?: string; schema?: Record<string, unknown>; effort?: "low" | "medium" | "high"; tools?: Anthropic.Beta.BetaToolUnion[] } = {}): Promise<string> {
  const res = await client().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: opts.system,
    output_config: { effort: opts.effort ?? "medium", ...(opts.schema ? { format: { type: "json_schema", schema: opts.schema } } : {}) },
    ...(opts.tools ? { tools: opts.tools } : {}),
    messages: [{ role: "user", content }],
  });
  if (res.stop_reason === "refusal") throw new Error("O pedido foi recusado pelo modelo.");
  return res.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/** Testa a chave com um pedido mínimo. */
export async function testClaude(): Promise<string> {
  const out = await ask("Responda só: ok", { effort: "low" });
  return out;
}

/** Corrige erros de transcrição e traduz, mantendo o mesmo número de legendas e os tempos. */
export async function claudeFixAndTranslate(captions: Caption[], spoken: string | null, target: string | null): Promise<Caption[]> {
  const out = captions.map((c) => ({ ...c, translations: { ...c.translations } }));
  for (let i = 0; i < captions.length; i += 80) {
    const part = captions.slice(i, i + 80);
    const schema = {
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: { type: "object", additionalProperties: false, required: ["i", "fixed", "translation"], properties: { i: { type: "integer" }, fixed: { type: "string" }, translation: { type: "string" } } },
        },
      },
    };
    const text = await ask(
      `Estas são legendas transcritas automaticamente de uma gameplay de GTA (falas de personagens do jogo e/ou de quem está jogando). Idioma provável: ${spoken ? languageName(spoken) : "desconhecido"}.\n` +
        `1) Em "fixed", corrija apenas erros evidentes de transcrição (palavras trocadas, pontuação), sem mudar o sentido, sem censurar e sem inventar falas.\n` +
        `2) Em "translation", ${target ? `traduza para ${languageName(target)} de forma natural e curta, como legenda` : "repita o texto corrigido"}.\n` +
        `Devolva um item por legenda, com o mesmo índice i.\n\n` +
        part.map((c, k) => `${i + k}\t${c.text}`).join("\n"),
      { schema, effort: "low", system: "Você revisa e traduz legendas de vídeos. Responda só no formato pedido." },
    );
    const data = JSON.parse(text) as { items: { i: number; fixed: string; translation: string }[] };
    for (const it of data.items) {
      const c = out[it.i];
      if (!c || !it.fixed?.trim()) continue;
      if (it.fixed.trim() !== c.text) c.text = it.fixed.trim();
      if (target) c.translations[target] = it.translation.trim() || c.text;
    }
  }
  return out;
}

export interface ClipInsight {
  title: string;
  story: string;
  beats: string[];
  hook: string;
}

/** Olha alguns quadros do clipe (em ordem) e descreve a história com mais contexto. */
export async function claudeDescribeClip(frames: { t: number; jpegBase64: string }[], info: { categories: Category[]; durationSec: number; transcript: string }): Promise<ClipInsight> {
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["title", "story", "beats", "hook"],
    properties: { title: { type: "string" }, story: { type: "string" }, beats: { type: "array", items: { type: "string" } }, hook: { type: "string" } },
  };
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  frames.forEach((f, i) => {
    content.push({ type: "text", text: `Quadro ${i + 1} (aos ${Math.floor(f.t / 60)}:${String(Math.floor(f.t % 60)).padStart(2, "0")} do vídeo original):` });
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: f.jpegBase64 } });
  });
  content.push({
    type: "text",
    text:
      `Estes quadros, em ordem cronológica, formam um clipe curto (${Math.round(info.durationSec)}s) de gameplay de GTA. A análise automática detectou: ${info.categories.join(", ")}.` +
      (info.transcript ? `\nFalas transcritas: "${info.transcript.slice(0, 1500)}"` : "") +
      `\nDescreva em português do Brasil apenas o que dá para ver ou ouvir — não invente acontecimentos.\n` +
      `title: título curto e chamativo para YouTube Shorts (até 60 caracteres, sem clickbait enganoso).\n` +
      `story: 1–2 frases com começo, desenvolvimento e conclusão do que acontece.\n` +
      `beats: 3 a 5 marcos da história, na ordem.\n` +
      `hook: uma frase curta para os primeiros segundos do vídeo (texto na tela).`,
  });
  return JSON.parse(await ask(content, { schema, effort: "medium" })) as ClipInsight;
}

export interface PublishKit {
  title: string;
  description: string;
  hashtags: string[];
}

export async function claudePublishKit(info: { title: string; story: string; categories: string[]; shorts: boolean; channelNiche: string }): Promise<PublishKit> {
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["title", "description", "hashtags"],
    properties: { title: { type: "string" }, description: { type: "string" }, hashtags: { type: "array", items: { type: "string" } } },
  };
  const text = await ask(
    `Crie título, descrição e hashtags em português do Brasil para um ${info.shorts ? "YouTube Shorts" : "vídeo do YouTube"} de gameplay de GTA.\n` +
      `Título atual: ${info.title}\nHistória: ${info.story}\nAcontecimentos: ${info.categories.join(", ")}\nNicho do canal: ${info.channelNiche || "gameplay de GTA"}\n` +
      `Regras: nada enganoso, sem prometer o que não acontece no vídeo, descrição de 2–4 linhas com um convite para comentar, 3 a 6 hashtags relevantes (com #). Não afirme que o vídeo é oficial da Rockstar.`,
    { schema, effort: "low" },
  );
  return JSON.parse(text) as PublishKit;
}

/** Consulta as páginas oficiais (busca na web feita pelo Claude) e resume os requisitos atuais. */
export async function claudeMonetizationUpdate(): Promise<string> {
  return ask(
    "Pesquise nas páginas oficiais da Ajuda do YouTube os requisitos ATUAIS do Programa de Parcerias do YouTube (YPP): os dois níveis de acesso (recursos de fãs e participação na receita de anúncios), números de inscritos, horas de exibição públicas válidas, visualizações válidas de Shorts, prazos, requisitos de AdSense e qualquer mudança anunciada com data. Responda em português do Brasil, em tópicos curtos, com o link oficial de cada informação e a data de hoje no início. Se algo não estiver confirmado na fonte oficial, diga que não está confirmado.",
    {
      effort: "medium",
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5, allowed_domains: ["support.google.com", "blog.youtube", "youtube.com"] }],
    },
  );
}
