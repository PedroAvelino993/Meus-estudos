// Retrato vetorial dos personagens. Cada um é desenhado a partir do seu "Look" e muda de expressão
// conforme o humor da conversa.

import type { Look, Mood } from "../core/types";

interface Props {
  look: Look;
  mood?: Mood;
  bg?: string;
  size?: number | string;
  title?: string;
}

const SHADE = "rgba(0,0,0,0.16)";

function BackHair({ l, color }: { l: Look; color: string }) {
  switch (l.hairStyle) {
    case "long":
      return <path d="M28 62 C26 30 44 22 60 22 C78 22 95 30 92 62 L97 118 C82 124 38 124 23 118 Z" fill={color} />;
    case "wavy":
      return <path d="M29 62 C27 31 44 23 60 23 C77 23 94 31 91 62 L94 100 C90 106 94 110 88 113 C78 118 70 112 60 114 C50 112 42 118 32 113 C26 110 30 106 26 100 Z" fill={color} />;
    case "bob":
      return <path d="M29 60 C27 32 44 24 60 24 C77 24 93 32 91 60 L93 92 C86 96 80 94 78 90 L42 90 C40 94 34 96 27 92 Z" fill={color} />;
    case "afro":
      return <circle cx="60" cy="50" r="39" fill={color} />;
    case "curly":
      return (
        <g fill={color}>
          {[
            [34, 44, 11],
            [44, 32, 12],
            [60, 27, 13],
            [76, 32, 12],
            [86, 44, 11],
            [31, 60, 9],
            [89, 60, 9],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} />
          ))}
        </g>
      );
    case "ponytail":
      return <path d="M82 46 C100 52 102 78 94 100 C90 108 84 104 86 96 C90 80 88 62 78 54 Z" fill={color} />;
    case "bun":
      return <circle cx="60" cy="24" r="11" fill={color} />;
    default:
      return null;
  }
}

function FrontHair({ l, color }: { l: Look; color: string }) {
  switch (l.hairStyle) {
    case "short":
      return <path d="M33 60 C31 34 46 27 60 27 C75 27 89 34 87 60 C84 50 80 44 72 41 C64 44 52 44 44 41 C38 45 35 51 33 60 Z" fill={color} />;
    case "buzz":
      return <path d="M34.5 56 C35 36 47 30 60 30 C73 30 85 36 85.5 56 C80 45 71 40 60 40 C49 40 40 45 34.5 56 Z" fill={color} opacity="0.85" />;
    case "slick":
      return (
        <g>
          <path d="M33 58 C31 33 46 26 61 26 C77 26 89 34 87 58 C85 47 79 41 70 38 C58 36 44 40 33 58 Z" fill={color} />
          <path d="M44 34 C54 31 66 31 76 35" stroke="rgba(255,255,255,0.18)" strokeWidth="1.4" fill="none" />
        </g>
      );
    case "gray":
      return (
        <g fill={color}>
          <path d="M33 66 C31 52 33 44 38 40 C37 48 37 56 38 66 Z" />
          <path d="M87 66 C89 52 87 44 82 40 C83 48 83 56 82 66 Z" />
          <path d="M42 36 C50 31 70 31 78 36 C70 34 50 34 42 36 Z" opacity="0.7" />
        </g>
      );
    case "bald":
      return (
        <g fill={color}>
          <path d="M33 68 C32 58 33 52 36 48 C36 56 37 62 38 68 Z" />
          <path d="M87 68 C88 58 87 52 84 48 C84 56 83 62 82 68 Z" />
        </g>
      );
    case "bob":
      return <path d="M33 60 C33 36 46 29 60 29 C75 29 87 36 87 60 C80 52 72 44 58 43 C47 44 39 51 33 60 Z" fill={color} />;
    case "long":
    case "wavy":
      return <path d="M32 64 C30 36 45 28 60 28 C76 28 90 36 88 64 C84 52 78 44 66 40 C58 46 46 50 38 50 C35 54 33 58 32 64 Z" fill={color} />;
    case "afro":
      return <path d="M33 56 C34 36 47 29 60 29 C73 29 86 36 87 56 C80 46 70 42 60 42 C50 42 40 46 33 56 Z" fill={color} />;
    case "curly":
      return (
        <g fill={color}>
          <circle cx="44" cy="40" r="8" />
          <circle cx="56" cy="36" r="8" />
          <circle cx="68" cy="37" r="8" />
          <circle cx="78" cy="43" r="7" />
          <circle cx="37" cy="50" r="6" />
        </g>
      );
    case "ponytail":
    case "bun":
      return <path d="M34 58 C33 35 46 28 60 28 C75 28 87 35 86 58 C82 46 72 40 60 40 C48 40 38 46 34 58 Z" fill={color} />;
    default:
      return null;
  }
}

function Body({ l }: { l: Look }) {
  const c = l.outfitColor;
  const shoulders = "M12 140 C14 118 32 107 60 107 C88 107 106 118 108 140 Z";
  const parts: JSX.Element[] = [<path key="b" d={shoulders} fill={c} />];
  switch (l.outfit) {
    case "suit":
      parts.push(
        <path key="s" d="M48 107 L60 132 L72 107 Z" fill={l.accent} />,
        <path key="l1" d="M44 108 L58 134 L50 140 L36 112 Z" fill={SHADE} />,
        <path key="l2" d="M76 108 L62 134 L70 140 L84 112 Z" fill={SHADE} />,
      );
      break;
    case "shirt":
      parts.push(<path key="c1" d="M48 106 L58 118 L52 122 L44 110 Z" fill={l.accent} />, <path key="c2" d="M72 106 L62 118 L68 122 L76 110 Z" fill={l.accent} />, <line key="pl" x1="60" y1="116" x2="60" y2="140" stroke={SHADE} strokeWidth="1.5" />);
      break;
    case "blouse":
      parts.push(<path key="n" d="M47 107 C50 118 70 118 73 107 Z" fill={SHADE} />, <path key="r" d="M46 108 C50 120 70 120 74 108" stroke={l.accent} strokeWidth="2.5" fill="none" />);
      break;
    case "tee":
      parts.push(<path key="n" d="M49 107 C52 114 68 114 71 107" stroke={SHADE} strokeWidth="3" fill="none" />);
      break;
    case "apron":
      parts.push(<path key="a" d="M40 116 L80 116 L84 140 L36 140 Z" fill={l.accent} />, <path key="st" d="M44 116 L50 107 M76 116 L70 107" stroke={l.accent} strokeWidth="3" />);
      break;
    case "cardigan":
      parts.push(<path key="in" d="M50 107 L60 140 L70 107 Z" fill={l.accent} />, <circle key="b1" cx="64" cy="124" r="1.6" fill={SHADE} />, <circle key="b2" cx="65.5" cy="132" r="1.6" fill={SHADE} />);
      break;
    case "uniform":
      parts.push(<path key="v" d="M50 107 L60 122 L70 107" stroke={SHADE} strokeWidth="3" fill="none" />, <rect key="p" x="72" y="122" width="12" height="9" rx="2" fill={SHADE} />);
      break;
    case "hoodie":
      parts.push(<path key="h" d="M38 112 C40 100 80 100 82 112 C74 120 46 120 38 112 Z" fill={SHADE} />, <path key="s" d="M54 118 L53 132 M66 118 L67 132" stroke={l.accent} strokeWidth="2" />);
      break;
    case "dress":
      parts.push(<path key="n" d="M44 108 C50 122 70 122 76 108 Z" fill={SHADE} opacity="0.7" />, <path key="st" d="M44 108 L42 107 M76 108 L78 107" stroke={c} strokeWidth="4" />);
      break;
    case "jacket":
      parts.push(<path key="in" d="M52 107 L60 140 L68 107 Z" fill={l.accent} />, <path key="c1" d="M42 109 L52 107 L56 122 Z" fill={SHADE} />, <path key="c2" d="M78 109 L68 107 L64 122 Z" fill={SHADE} />);
      break;
  }
  if (l.extra === "tie") parts.push(<path key="tie" d="M58 112 L62 112 L64 132 L60 137 L56 132 Z" fill="#7A2E2E" />);
  if (l.extra === "bowtie") parts.push(<path key="bow" d="M52 110 L60 113 L68 110 L68 117 L60 114 L52 117 Z" fill="#1A1A1A" />);
  return <g>{parts}</g>;
}

function Eyes({ mood, eye }: { mood: Mood; eye: string }) {
  const L = 49,
    R = 71,
    Y = 64;
  switch (mood) {
    case "happy":
      return (
        <g stroke="#1b1b1b" strokeWidth="2.2" fill="none" strokeLinecap="round">
          <path d={`M${L - 4} ${Y + 1} Q${L} ${Y - 4} ${L + 4} ${Y + 1}`} />
          <path d={`M${R - 4} ${Y + 1} Q${R} ${Y - 4} ${R + 4} ${Y + 1}`} />
        </g>
      );
    case "suspicious":
      return (
        <g>
          <ellipse cx={L} cy={Y} rx="3.6" ry="1.4" fill={eye} />
          <ellipse cx={R} cy={Y} rx="3.6" ry="1.8" fill={eye} />
        </g>
      );
    case "annoyed":
      return (
        <g>
          <ellipse cx={L} cy={Y + 0.5} rx="3" ry="2" fill={eye} />
          <ellipse cx={R} cy={Y + 0.5} rx="3" ry="2" fill={eye} />
          <path d={`M${L - 4} ${Y - 1.5} L${L + 4} ${Y - 1.5} M${R - 4} ${Y - 1.5} L${R + 4} ${Y - 1.5}`} stroke="#1b1b1b" strokeWidth="1.4" opacity="0.6" />
        </g>
      );
    case "surprised":
      return (
        <g fill={eye}>
          <circle cx={L} cy={Y} r="3.6" />
          <circle cx={R} cy={Y} r="3.6" />
          <circle cx={L + 1} cy={Y - 1} r="1" fill="#fff" />
          <circle cx={R + 1} cy={Y - 1} r="1" fill="#fff" />
        </g>
      );
    case "thinking":
      return (
        <g className="blink">
          <ellipse cx={L + 1.5} cy={Y - 1.5} rx="2.6" ry="3" fill={eye} />
          <ellipse cx={R + 1.5} cy={Y - 1.5} rx="2.6" ry="3" fill={eye} />
        </g>
      );
    case "sad":
      return (
        <g>
          <ellipse cx={L} cy={Y + 1} rx="2.6" ry="2.6" fill={eye} />
          <ellipse cx={R} cy={Y + 1} rx="2.6" ry="2.6" fill={eye} />
        </g>
      );
    case "angry":
      return (
        <g>
          <ellipse cx={L} cy={Y + 1} rx="3" ry="2.2" fill={eye} />
          <ellipse cx={R} cy={Y + 1} rx="3" ry="2.2" fill={eye} />
        </g>
      );
    default:
      return (
        <g className="blink">
          <ellipse cx={L} cy={Y} rx="2.7" ry="3.1" fill={eye} />
          <ellipse cx={R} cy={Y} rx="2.7" ry="3.1" fill={eye} />
          <circle cx={L + 0.9} cy={Y - 1} r="0.8" fill="#fff" opacity="0.8" />
          <circle cx={R + 0.9} cy={Y - 1} r="0.8" fill="#fff" opacity="0.8" />
        </g>
      );
  }
}

function Brows({ mood, color }: { mood: Mood; color: string }) {
  const p: Record<Mood, string> = {
    neutral: "M43 56 Q49 54 55 56 M65 56 Q71 54 77 56",
    happy: "M43 55 Q49 52 55 55 M65 55 Q71 52 77 55",
    annoyed: "M43 55 L55 58 M65 58 L77 55",
    suspicious: "M43 58 L55 58 M65 54 Q71 51 77 55",
    thinking: "M43 55 Q49 52 55 55 M65 53 Q71 50 77 54",
    surprised: "M43 52 Q49 48 55 52 M65 52 Q71 48 77 52",
    sad: "M43 57 L55 54 M65 54 L77 57",
    angry: "M43 53 L56 59 M64 59 L77 53",
  };
  return <path d={p[mood]} stroke={color} strokeWidth="2.6" fill="none" strokeLinecap="round" />;
}

function Mouth({ mood }: { mood: Mood }) {
  const s = { stroke: "#5a2a24", strokeWidth: 2.2, fill: "none", strokeLinecap: "round" as const };
  switch (mood) {
    case "happy":
      return <path d="M50 80 Q60 90 70 80 Q60 85 50 80 Z" fill="#7a2f2a" stroke="#5a2a24" strokeWidth="1.5" strokeLinejoin="round" />;
    case "annoyed":
      return <path d="M52 83 L68 82" {...s} />;
    case "suspicious":
      return <path d="M52 83 Q60 83 68 80" {...s} />;
    case "thinking":
      return <ellipse cx="64" cy="83" rx="3" ry="2.2" fill="#5a2a24" />;
    case "surprised":
      return <ellipse cx="60" cy="84" rx="4" ry="5" fill="#5a2a24" />;
    case "sad":
      return <path d="M52 85 Q60 79 68 85" {...s} />;
    case "angry":
      return <path d="M51 85 Q60 78 69 85" {...s} strokeWidth={2.8} />;
    default:
      return <path d="M52 82 Q60 86 68 82" {...s} />;
  }
}

function Beard({ l, color }: { l: Look; color: string }) {
  switch (l.beard) {
    case "full":
      return <path d="M35 70 C36 92 48 100 60 100 C72 100 84 92 85 70 C82 80 76 78 72 86 C66 82 54 82 48 86 C44 78 38 80 35 70 Z" fill={color} />;
    case "goatee":
      return (
        <g fill={color}>
          <path d="M53 88 C55 97 65 97 67 88 C64 90 56 90 53 88 Z" />
          <path d="M51 79 Q60 75 69 79 Q60 77 51 79 Z" />
        </g>
      );
    case "mustache":
      return <path d="M49 79 Q60 72 71 79 Q66 81 60 78 Q54 81 49 79 Z" fill={color} />;
    case "stubble":
      return <path d="M36 72 C38 92 48 98 60 98 C72 98 82 92 84 72 C80 86 72 92 60 92 C48 92 40 86 36 72 Z" fill={color} opacity="0.32" />;
    default:
      return null;
  }
}

function Extra({ l }: { l: Look }) {
  switch (l.extra) {
    case "earrings":
      return (
        <g fill={l.accent}>
          <circle cx="33" cy="77" r="2.4" />
          <circle cx="87" cy="77" r="2.4" />
        </g>
      );
    case "pearls":
      return (
        <g fill="#F2EEE4">
          {[40, 45, 50, 55, 60, 65, 70, 75, 80].map((x, i) => (
            <circle key={x} cx={x} cy={108 + Math.abs(i - 4) * -0.9 + 4} r="2" />
          ))}
        </g>
      );
    case "necklace":
      return <path d="M48 106 Q60 118 72 106" stroke={l.accent} strokeWidth="1.6" fill="none" />;
    case "cap":
      return (
        <g>
          <path d="M32 50 C32 30 46 24 60 24 C74 24 88 30 88 50 Z" fill={l.accent} />
          <path d="M60 46 L98 50 C96 54 70 54 60 52 Z" fill={l.accent} />
          <path d="M32 50 L88 50" stroke={SHADE} strokeWidth="2" />
        </g>
      );
    case "beret":
      return <path d="M30 44 C30 28 52 22 66 24 C82 26 92 34 88 44 C80 40 44 40 30 44 Z" fill={l.accent} />;
    case "headscarf":
      return <path d="M30 56 C28 30 46 22 60 22 C76 22 92 30 90 56 C84 44 74 38 60 38 C46 38 36 44 30 56 Z" fill={l.accent} />;
    case "headphones":
      return (
        <g>
          <path d="M30 64 C28 30 92 30 90 64" stroke="#2a2a2a" strokeWidth="4" fill="none" />
          <rect x="24" y="58" width="10" height="18" rx="4" fill="#2a2a2a" />
          <rect x="86" y="58" width="10" height="18" rx="4" fill="#2a2a2a" />
        </g>
      );
    default:
      return null;
  }
}

export default function Portrait({ look: l, mood = "neutral", bg = "#1b212b", size = "100%", title }: Props) {
  const hair = l.hairStyle === "gray" ? "#B9B6B0" : l.hair;
  const eye = l.eyes ?? "#2a1d14";
  const old = l.age >= 58;
  const gid = `g${l.skin.slice(1)}${l.outfitColor.slice(1)}`;
  return (
    <div className="portrait" style={{ width: size }}>
      <svg viewBox="0 0 120 140" role="img" aria-label={title ?? "Retrato"}>
        <defs>
          <radialGradient id={gid} cx="50%" cy="35%" r="75%">
            <stop offset="0" stopColor={bg} stopOpacity="1" />
            <stop offset="1" stopColor="#0b0e13" stopOpacity="1" />
          </radialGradient>
          <clipPath id={`${gid}c`}>
            <rect x="0" y="0" width="120" height="140" rx="18" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${gid}c)`}>
          <rect width="120" height="140" fill={`url(#${gid})`} />
          <BackHair l={l} color={hair} />
          <Body l={l} />
          <rect x="51" y="88" width="18" height="22" rx="6" fill={l.skin} />
          <rect x="51" y="96" width="18" height="8" fill={SHADE} />
          <ellipse cx="33.5" cy="68" rx="5" ry="7" fill={l.skin} />
          <ellipse cx="86.5" cy="68" rx="5" ry="7" fill={l.skin} />
          <ellipse cx="60" cy="63" rx="26.5" ry="31" fill={l.skin} />
          <ellipse cx="60" cy="88" rx="16" ry="5" fill={SHADE} opacity="0.35" />
          {l.extra === "headscarf" ? null : <FrontHair l={l} color={hair} />}
          {old && <path d="M43 70 Q46 72 48 70 M72 70 Q74 72 77 70 M52 46 Q60 44 68 46" stroke={SHADE} strokeWidth="1.2" fill="none" />}
          <Brows mood={mood} color={l.hairStyle === "bald" || l.hairStyle === "gray" ? "#8a8580" : hair} />
          <Eyes mood={mood} eye={eye} />
          <path d="M60 66 Q57 75 56 76 Q60 78 63 76" stroke={SHADE} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          {(mood === "happy" || mood === "neutral") && (
            <g fill="#e07a6a" opacity="0.18">
              <circle cx="44" cy="76" r="5" />
              <circle cx="76" cy="76" r="5" />
            </g>
          )}
          <Beard l={l} color={l.hairStyle === "gray" || l.hairStyle === "bald" ? "#A9A49C" : hair} />
          <Mouth mood={mood} />
          {l.glasses && (
            <g stroke="#1a1a1a" strokeWidth="1.8" fill="rgba(255,255,255,0.08)">
              <rect x="40" y="57" width="18" height="13" rx="5" />
              <rect x="62" y="57" width="18" height="13" rx="5" />
              <path d="M58 62 L62 62" />
            </g>
          )}
          <Extra l={l} />
        </g>
      </svg>
    </div>
  );
}
