// Ilustrações em SVG: o Coliseu (cresce com as construções), retratos e o logotipo.

import type { Look } from "../core/types";

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="lg-gold" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f0d79b" />
          <stop offset="1" stopColor="#a8703f" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="#2a1a12" stroke="url(#lg-gold)" strokeWidth="3" />
      <path d="M14 44 V26 Q32 16 50 26 V44 Z" fill="url(#lg-gold)" />
      {[18, 25, 32, 39, 46].map((x) => (
        <rect key={x} x={x - 2.5} y={30} width={5} height={8} rx={2.5} fill="#2a1a12" />
      ))}
      <rect x="12" y="44" width="40" height="4" rx="1" fill="#a3241c" />
    </svg>
  );
}

interface ArtProps {
  level: number;
  lights: number;
  water: number;
  crowd: number;
  night?: boolean;
  monuments?: number;
}

/** O Coliseu visto de fora: madeira no começo, mármore e ouro no fim. */
export function ColosseumArt({ level, lights, water, crowd, night, monuments = 0 }: ArtProps) {
  const tiers = level === 0 ? 1 : Math.min(4, 1 + Math.ceil(level / 2));
  const width = 250 + Math.min(level, 7) * 38;
  const x0 = 300 - width / 2;
  const ground = 250;
  const tierH = level === 0 ? 46 : 42;
  const wood = level === 0;
  const marble = level >= 6;
  const stone = wood ? "#7a5230" : marble ? "#ece4d3" : "#cdb995";
  const stoneDark = wood ? "#5a3a20" : marble ? "#c9bc9f" : "#a8936e";
  const archFill = night ? "#3a2210" : "#2a1e14";
  const top = ground - tiers * tierH;
  const dots = Math.round(crowd * 46);
  const sky = night ? ["#0d1426", "#1c2340"] : ["#e9b97a", "#f6dfb0"];
  return (
    <svg className="colosseum-art" viewBox="0 0 600 300" role="img" aria-label="Ilustração do seu Coliseu">
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
        <linearGradient id="ground" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#8a6a43" />
          <stop offset="1" stopColor="#5b4128" />
        </linearGradient>
        <radialGradient id="glow">
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ff9a3a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="water" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#5fa3c4" />
          <stop offset="1" stopColor="#2c5f7a" />
        </linearGradient>
      </defs>
      <rect width="600" height="300" fill="url(#sky)" />
      {night ? (
        <>
          <circle cx="510" cy="54" r="18" fill="#f3ead2" opacity="0.9" />
          {[40, 120, 200, 260, 380, 450, 560].map((x, i) => (
            <circle key={x} cx={x} cy={20 + ((i * 37) % 60)} r="1.3" fill="#fff" opacity="0.7" />
          ))}
        </>
      ) : (
        <circle cx="510" cy="60" r="26" fill="#fff1c9" opacity="0.85" />
      )}
      {/* Colinas de Roma */}
      <path d="M0 230 Q90 190 180 222 T360 214 T600 220 V300 H0 Z" fill={night ? "#1a1f2a" : "#b9925e"} opacity="0.55" />
      {[60, 95, 520, 555].map((x) => (
        <g key={x}>
          <rect x={x - 1.5} y={200} width={3} height={36} fill="#3f3420" />
          <ellipse cx={x} cy={196} rx={6} ry={16} fill={night ? "#1f2a1e" : "#4d5b2c"} />
        </g>
      ))}
      <rect y={ground} width="600" height={300 - ground} fill="url(#ground)" />

      {/* Monumentos ao redor */}
      {Array.from({ length: Math.min(monuments, 4) }).map((_, i) => {
        const mx = i % 2 === 0 ? x0 - 30 - i * 8 : x0 + width + 30 + i * 8;
        return (
          <g key={i}>
            <rect x={mx - 4} y={ground - 54} width={8} height={54} fill={marble ? "#e8dcc0" : "#cbb48a"} />
            <rect x={mx - 7} y={ground - 58} width={14} height={5} fill="#d2ab5f" />
          </g>
        );
      })}

      {/* Mastros do velário */}
      {Array.from({ length: 5 }).map((_, i) => {
        const fx = x0 + 20 + (i * (width - 40)) / 4;
        return (
          <g key={i}>
            <rect x={fx - 1} y={top - 30} width={2} height={30} fill="#5a4630" />
            <path className="flag" d={`M${fx + 1} ${top - 30} l18 4 l-18 5 z`} fill={i % 2 ? "#a3241c" : "#d2ab5f"} style={{ animationDelay: `${i * 0.3}s` }} />
          </g>
        );
      })}

      {/* Público no topo */}
      {Array.from({ length: dots }).map((_, i) => (
        <circle key={i} className="crowd-dot" cx={x0 + 10 + ((i * (width - 20)) / Math.max(1, dots - 1))} cy={top - 3 - (i % 3)} r="2.4" fill={["#a3241c", "#e8cc8a", "#6f9fc8", "#efe9dd", "#6fae6a"][i % 5]} style={{ animationDelay: `${(i % 7) * 0.2}s` }} />
      ))}

      {/* Fachada em anéis */}
      {Array.from({ length: tiers }).map((_, t) => {
        const y = ground - (t + 1) * tierH;
        const inset = t * 6;
        const w = width - inset * 2;
        const n = Math.max(5, Math.floor(w / 34));
        const aw = (w - 16) / n;
        const isAttic = t === 3;
        return (
          <g key={t}>
            <rect x={x0 + inset} y={y} width={w} height={tierH} fill={stone} stroke={stoneDark} strokeWidth="1.5" />
            <rect x={x0 + inset} y={y} width={w} height={4} fill={marble ? "#d2ab5f" : stoneDark} />
            {Array.from({ length: n }).map((_, a) =>
              isAttic ? (
                <rect key={a} x={x0 + inset + 8 + a * aw + aw * 0.35} y={y + 14} width={aw * 0.3} height={10} fill={archFill} opacity="0.8" />
              ) : wood ? (
                <rect key={a} x={x0 + inset + 8 + a * aw + 3} y={y + 10} width={aw - 6} height={tierH - 14} fill="#3f2814" opacity="0.65" />
              ) : (
                <path key={a} d={`M${x0 + inset + 8 + a * aw + 4} ${y + tierH} V${y + 18} a${(aw - 8) / 2} ${(aw - 8) / 2} 0 0 1 ${aw - 8} 0 V${y + tierH} Z`} fill={archFill} />
              ),
            )}
            {!wood &&
              Array.from({ length: n + 1 }).map((_, a) => (
                <rect key={`c${a}`} x={x0 + inset + 8 + a * aw - 2} y={y + 6} width={4} height={tierH - 6} fill={stoneDark} opacity="0.55" />
              ))}
            {marble && Array.from({ length: n }).map((_, a) => (a % 2 === 0 && t < 3 ? <circle key={`s${a}`} cx={x0 + inset + 8 + a * aw + aw / 2} cy={y + tierH - 6} r="2.6" fill="#d2ab5f" /> : null))}
          </g>
        );
      })}
      {wood && (
        <>
          <path d={`M${x0} ${top} l${width / 2} -26 l${width / 2} 26 Z`} fill="#8a5a2c" stroke="#5a3a20" />
          <text x="300" y={top - 6} textAnchor="middle" fontFamily="Cinzel, serif" fontSize="11" fill="#f0d79b">
            ARENA
          </text>
        </>
      )}
      {/* Portão principal */}
      <path d={`M285 ${ground} V${ground - 26} a15 15 0 0 1 30 0 V${ground} Z`} fill="#1a120b" stroke="#d2ab5f" strokeWidth="1.5" />

      {/* Tochas */}
      {lights > 0 &&
        Array.from({ length: 2 + lights * 2 }).map((_, i) => {
          const tx = x0 + 14 + (i * (width - 28)) / Math.max(1, 1 + lights * 2);
          return (
            <g key={i} className="torch" style={{ animationDelay: `${i * 0.17}s` }}>
              <circle cx={tx} cy={ground - 12} r={night ? 14 : 8} fill="url(#glow)" />
              <circle cx={tx} cy={ground - 12} r="2.2" fill="#ffd27a" />
            </g>
          );
        })}

      {/* Lago artificial / canais */}
      {water > 0 && <rect x={x0 - 40} y={ground + 14} width={width + 80} height={10 + water * 6} rx={8} fill="url(#water)" opacity="0.9" />}
    </svg>
  );
}

/** Retrato do gladiador desenhado a partir da aparência. */
export function Portrait({ look, size = 74, legend }: { look: Look; size?: number; legend?: boolean }) {
  const hair = look.hair;
  return (
    <svg className="portrait" width={size} height={size} viewBox="0 0 80 80" aria-hidden>
      {legend && <circle cx="40" cy="40" r="38" fill="none" stroke="#d2ab5f" strokeWidth="2" strokeDasharray="3 3" />}
      {/* Armadura */}
      <path d="M12 80 Q14 58 40 56 Q66 58 68 80 Z" fill={look.armor} />
      <path d="M22 66 Q40 60 58 66" stroke="rgba(0,0,0,0.3)" strokeWidth="2" fill="none" />
      <rect x="34" y="48" width="12" height="10" fill={look.skin} />
      {/* Cabelo longo atrás */}
      {(look.hairStyle === "longo" || look.hairStyle === "trancas") && <path d="M20 34 Q18 58 26 62 L54 62 Q62 58 60 34 Z" fill={hair} />}
      {/* Rosto */}
      <ellipse cx="40" cy="36" rx="15" ry="17" fill={look.skin} />
      <circle cx="34" cy="35" r="1.8" fill="#1d140d" />
      <circle cx="46" cy="35" r="1.8" fill="#1d140d" />
      <path d="M35 44 Q40 47 45 44" stroke="#5a3424" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {look.scar && <path d="M46 28 L51 40" stroke="#8a3a2a" strokeWidth="1.4" />}
      {/* Barba */}
      {look.beard === "cheia" && <path d="M25 38 Q26 56 40 55 Q54 56 55 38 Q52 48 40 49 Q28 48 25 38 Z" fill={hair} />}
      {look.beard === "curta" && <path d="M27 42 Q30 52 40 52 Q50 52 53 42 Q48 48 40 48 Q32 48 27 42 Z" fill={hair} opacity="0.75" />}
      {look.beard === "bigode" && <path d="M33 42 Q40 39 47 42 Q40 44 33 42 Z" fill={hair} />}
      {/* Cabelo */}
      {look.hairStyle === "curto" && <path d="M25 30 Q28 16 40 16 Q52 16 55 30 Q50 22 40 22 Q30 22 25 30 Z" fill={hair} />}
      {look.hairStyle === "cacheado" && [26, 31, 36, 41, 46, 51, 54].map((x, i) => <circle key={x} cx={x} cy={22 + (i % 2) * 3} r="5" fill={hair} />)}
      {look.hairStyle === "rabo" && (
        <>
          <path d="M25 30 Q28 16 40 16 Q52 16 55 30 Q50 22 40 22 Q30 22 25 30 Z" fill={hair} />
          <path d="M54 26 Q64 34 58 48" stroke={hair} strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      )}
      {(look.hairStyle === "longo" || look.hairStyle === "trancas") && <path d="M24 32 Q26 15 40 15 Q54 15 56 32 Q50 21 40 21 Q30 21 24 32 Z" fill={hair} />}
      {/* Elmo */}
      {look.helmet === "galea" && (
        <>
          <path d="M23 32 Q24 12 40 12 Q56 12 57 32 L53 32 Q52 18 40 18 Q28 18 27 32 Z" fill="#b08a4a" />
          <path d="M36 6 Q40 2 44 6 L44 14 L36 14 Z" fill="#a3241c" />
        </>
      )}
      {look.helmet === "murmillo" && (
        <>
          <path d="M22 34 Q22 10 40 10 Q58 10 58 34 L54 34 L54 26 L26 26 L26 34 Z" fill="#8f8a80" />
          <path d="M30 6 Q40 -2 50 6 L46 12 L34 12 Z" fill="#c9a44c" />
        </>
      )}
      {look.helmet === "tracio" && (
        <>
          <path d="M22 32 Q22 12 40 12 Q58 12 58 32 L54 30 Q52 18 40 18 Q28 18 26 30 Z" fill="#7d6a4a" />
          <path d="M38 4 Q52 2 50 14 L40 14 Z" fill="#7d6a4a" />
        </>
      )}
      {look.helmet === "coroa" && (
        <path d="M27 20 L30 10 L35 18 L40 8 L45 18 L50 10 L53 20 Z" fill="#d2ab5f" stroke="#a8703f" />
      )}
    </svg>
  );
}
