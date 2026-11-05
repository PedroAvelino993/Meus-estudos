// Roda o modelo de linguagem local numa thread separada, para o jogo não travar enquanto ele escreve.
import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg: MessageEvent) => handler.onmessage(msg);
