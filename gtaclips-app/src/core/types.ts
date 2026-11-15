// Tipos centrais do GTA Clips AI. Tudo o que é salvo no aparelho segue estas formas.

/** Tipos de acontecimento que a IA reconhece numa gameplay. */
export type Category =
  | "perseguicao"
  | "policia"
  | "explosao"
  | "acidente"
  | "tiroteio"
  | "briga"
  | "engracado"
  | "queda"
  | "aereo"
  | "aquatico"
  | "cinematico"
  | "cutscene"
  | "conducao"
  | "andando"
  | "menu"
  | "carregamento"
  | "mapa"
  | "parado";

/** Uma amostra de imagem (um quadro analisado) com as medidas extraídas. */
export interface Sample {
  /** Tempo no vídeo original, em segundos. */
  t: number;
  /** Diferença para o quadro anterior (0–1): ação, câmera em movimento. */
  motion: number;
  /** Brilho médio (0–1). */
  brightness: number;
  /** Saturação média (0–1). */
  saturation: number;
  /** Fração de pixels quentes e muito claros (fogo, explosões). */
  fire: number;
  /** Pixels vermelhos e azuis saturados (sirenes, giroflex). */
  siren: number;
  /** Quantidade de detalhes (bordas), ajuda a separar menus e telas lisas. */
  detail: number;
  /** Variação de cor da imagem (0 = imagem lisa, como tela de carregamento). */
  variance: number;
  /** Corte de cena em relação à amostra anterior. */
  cut: boolean;
  /** Centro horizontal da ação (0–1), usado no reenquadramento. */
  cx: number;
  /** Probabilidades do modelo de visão (CLIP) para cada categoria, quando usado. */
  labels?: Partial<Record<Category, number>>;
}

export interface AudioEnvelope {
  /** Janelas por segundo. */
  rate: number;
  /** Volume RMS normalizado (0–1) por janela. */
  rms: number[];
}

/** Um momento identificado: um trecho contínuo com uma pontuação de interesse. */
export interface Moment {
  id: string;
  start: number;
  end: number;
  category: Category;
  /** Pontuação total de 0 a 100. */
  score: number;
  factors: ScoreFactors;
  description: string;
  /** Tempo do quadro usado como miniatura. */
  thumbT: number;
  /** Momento sem importância (menu, carregamento, espera…). */
  dead: boolean;
  /** Pico de intensidade dentro do momento. */
  peakT: number;
}

export interface ScoreFactors {
  intensidade: number;
  surpresa: number;
  humor: number;
  historia: number;
  visual: number;
  ritmo: number;
  retencao: number;
  clareza: number;
}

export interface Analysis {
  version: number;
  /** "ia" quando o modelo de visão foi usado; "basica" quando só as medidas de imagem e som. */
  mode: "ia" | "basica";
  samples: Sample[];
  audio: AudioEnvelope | null;
  moments: Moment[];
  /** Duração total dos trechos sem importância. */
  deadSeconds: number;
  createdAt: number;
  elapsedMs: number;
}

// ---------- Clipes e linha do tempo ----------

export type AspectFormat = "9:16" | "16:9" | "1:1";
export type ReframeMode = "acao" | "desfocado" | "centro" | "manual";

export interface Segment {
  id: string;
  /** Início e fim no vídeo original (segundos). */
  start: number;
  end: number;
  /** Volume do trecho (1 = original). */
  volume: number;
  /** Posição manual do recorte (0–1, centro do quadro), quando o modo é manual. */
  cropX?: number;
  /** Zoom extra deste trecho (1 = nenhum). */
  zoom?: number;
}

export interface Word {
  w: string;
  s: number;
  e: number;
}

/** Legenda em tempo do vídeo original (sobrevive a cortes e reordenação). */
export interface Caption {
  id: string;
  start: number;
  end: number;
  text: string;
  words: Word[];
  /** Falante estimado (1, 2, 3…) quando foi possível separar vozes. */
  speaker?: number;
  /** Traduções por código de idioma. */
  translations: Record<string, string>;
}

export type CaptionStyleId = "tradicional" | "dinamica" | "destaque" | "viral" | "minimalista";

export interface CaptionStyle {
  id: CaptionStyleId;
  font: string;
  /** Tamanho em % da altura do vídeo. */
  size: number;
  color: string;
  highlight: string;
  /** Posição vertical (0 = topo, 1 = base). */
  position: number;
  animation: "nenhuma" | "pop" | "subir" | "palavra";
  uppercase: boolean;
  outline: boolean;
  background: boolean;
}

export interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
}

export interface Clip {
  id: string;
  title: string;
  /** Resumo da história contada pelo clipe (começo, desenvolvimento, conclusão). */
  story: string;
  beats: { t: number; label: string }[];
  category: Category;
  score: number;
  /** Parte N no modo história contínua. */
  part?: number;
  segments: Segment[];
  format: AspectFormat;
  reframe: ReframeMode;
  zoom: number;
  fps: 30 | 60;
  captions: Caption[];
  captionLang: string;
  captionsOn: boolean;
  captionStyle: CaptionStyle;
  adjust: Adjustments;
  volume: number;
  normalize: boolean;
  transition: "corte" | "fade";
  removeSilence: boolean;
  /** Idioma original detectado nas falas. */
  spokenLang?: string;
  updatedAt: number;
}

export interface GenerateSettings {
  mode: "historias" | "continua";
  count: number;
  /** Duração alvo de cada clipe, em segundos. */
  duration: number;
  format: AspectFormat;
  reframe: ReframeMode;
  fps: 30 | 60;
  captions: boolean;
  captionLang: string;
  captionStyle: CaptionStyleId;
  removeSilence: boolean;
  /** Segundos de contexto mantidos antes do acontecimento principal. */
  context: number;
}

export interface SourceInfo {
  name: string;
  size: number;
  lastModified: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec: string | null;
  container: string;
  /** Cópia do vídeo guardada no aparelho (IndexedDB). */
  stored: boolean;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  source: SourceInfo;
  status: "novo" | "analisando" | "analisado" | "erro";
  error?: string;
  analysis?: Analysis;
  settings: GenerateSettings;
  clips: Clip[];
  /** Avisos honestos da geração (ex.: material insuficiente). */
  notes: string[];
}

export interface ExportRecord {
  id: string;
  projectId: string;
  clipId: string;
  title: string;
  createdAt: number;
  size: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec: string | null;
  mime: string;
}
