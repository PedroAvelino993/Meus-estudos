// Retratos ilustrados dos personagens, desenhados em SVG com expressões (humor) e animações discretas.

import type { Mood, PortraitLook } from "../content/characters";
import { character } from "../content";

function Hair({ look, back }: { look: PortraitLook; back?: boolean }) {
  const c = look.hair;
  switch (look.hairStyle) {
    case "bob":
      return back ? (
        <path d="M27 52c-3-22 8-36 23-36s27 13 23 36l-2 14c-4 2-8 2-11 0l1-14H39l1 14c-3 2-7 2-11 0z" fill={c} />
      ) : (
        <path d="M29 44c1-14 10-22 21-22s20 8 21 22c-6-8-14-11-22-11-7 0-14 3-20 11z" fill={c} />
      );
    case "long":
      return back ? <path d="M26 54c-3-24 9-38 24-38s27 14 24 38l3 30c-8 6-18 6-27 6s-19 0-27-6z" fill={c} /> : <path d="M29 46c1-15 10-24 21-24s20 9 21 24c-5-9-13-13-21-13s-16 4-21 13z" fill={c} />;
    case "short":
      return back ? null : (
        <path d="M29 44c-1-15 9-25 21-25 13 0 23 9 21 25-3-6-6-9-9-10-5 3-13 4-20 2-6-1-10 3-13 8z" fill={c} />
      );
    case "bun":
      return back ? (
        <circle cx="50" cy="16" r="9" fill={c} />
      ) : (
        <path d="M29 46c0-15 9-24 21-24s21 9 21 24c-4-7-11-11-21-11s-17 4-21 11z" fill={c} />
      );
    case "curly":
      return back ? (
        <g fill={c}>
          {[
            [30, 30], [38, 21], [50, 18], [62, 21], [70, 30], [74, 42], [26, 42], [27, 54], [73, 54],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={9} />
          ))}
        </g>
      ) : (
        <g fill={c}>
          {[
            [36, 30], [45, 26], [55, 26], [64, 30],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={6.5} />
          ))}
        </g>
      );
    case "buzz":
      return back ? null : <path d="M30 42c0-13 9-21 20-21s20 8 20 21c-5-5-12-7-20-7s-15 2-20 7z" fill={c} opacity="0.92" />;
  }
}

function Brows({ mood, color }: { mood: Mood; color: string }) {
  const y = mood === "surprised" ? 38 : 40;
  const tilt = mood === "sad" ? 2.5 : mood === "thinking" ? -2 : 0;
  return (
    <g stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none">
      <path d={`M38 ${y + tilt} q4 -2.5 8 0`} />
      <path d={mood === "thinking" ? `M54 ${y - 3} q4 -2.5 8 0` : `M54 ${y} q4 -2.5 8 ${tilt}`} />
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case "happy":
      return <path className="mouth" d="M43 59q7 7 14 0q-7 3 -14 0z" fill="#8a2f2a" stroke="#8a2f2a" strokeWidth="1.5" strokeLinejoin="round" />;
    case "surprised":
      return <ellipse className="mouth" cx="50" cy="60" rx="3.6" ry="4.4" fill="#8a2f2a" />;
    case "sad":
      return <path className="mouth" d="M44 62q6 -4 12 0" fill="none" stroke="#8a2f2a" strokeWidth="2.2" strokeLinecap="round" />;
    case "thinking":
      return <path className="mouth" d="M45 60q4 1.5 9 -1" fill="none" stroke="#8a2f2a" strokeWidth="2.2" strokeLinecap="round" />;
    default:
      return <path className="mouth" d="M44 59.5q6 3 12 0" fill="none" stroke="#8a2f2a" strokeWidth="2.2" strokeLinecap="round" />;
  }
}

export function Portrait({ id, mood = "neutral", size = 56, talking, bob }: { id: string; mood?: Mood; size?: number; talking?: boolean; bob?: boolean }) {
  const ch = character(id);
  const L = ch.look;
  const eyeR = mood === "surprised" ? 3.1 : 2.6;
  return (
    <div className={`portrait ${talking ? "talking" : ""} ${bob ? "bob" : ""}`} style={{ width: size, height: size, ["--p-bg" as string]: `${ch.color}26` }} aria-label={`${ch.name}`} role="img">
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50" fill={`${ch.color}22`} />
        <Hair look={L} back />
        {/* corpo */}
        <path d="M16 104c2-20 16-30 34-30s32 10 34 30z" fill={L.shirt} />
        {L.accessory === "apron" && <path d="M38 76v28h24V76" fill="#fff" opacity="0.9" stroke={L.accent} strokeWidth="2" />}
        {L.accessory === "scarf" && <path d="M36 72q14 8 28 0l2 6q-16 9-32 0z" fill={L.accent} />}
        <rect x="44" y="62" width="12" height="13" rx="5" fill={L.skin} />
        {/* cabeça */}
        <ellipse cx="50" cy="48" rx="20" ry="22.5" fill={L.skin} />
        <ellipse cx="30.5" cy="50" rx="3.5" ry="5" fill={L.skin} />
        <ellipse cx="69.5" cy="50" rx="3.5" ry="5" fill={L.skin} />
        {L.accessory === "earrings" && (
          <g fill={L.accent}>
            <circle cx="30.5" cy="57" r="2.2" />
            <circle cx="69.5" cy="57" r="2.2" />
          </g>
        )}
        <Hair look={L} />
        <Brows mood={mood} color={L.hair} />
        <g className="eyes">
          {mood === "happy" ? (
            <g stroke="#2a2522" strokeWidth="2.4" fill="none" strokeLinecap="round">
              <path d="M39 48q3 -3.5 6 0" />
              <path d="M55 48q3 -3.5 6 0" />
            </g>
          ) : (
            <g>
              <circle cx="42" cy="48" r={eyeR} fill="#2a2522" />
              <circle cx="58" cy="48" r={eyeR} fill="#2a2522" />
              <circle cx="43" cy="47" r="0.9" fill="#fff" />
              <circle cx="59" cy="47" r="0.9" fill="#fff" />
            </g>
          )}
        </g>
        <circle cx="38" cy="55" r="3.4" fill="#e36b5a" opacity="0.22" />
        <circle cx="62" cy="55" r="3.4" fill="#e36b5a" opacity="0.22" />
        {L.beard ? (
          <>
            <path d="M40 56q10 -5 20 0q-3 4 -10 3q-7 1 -10 -3z" fill={L.hair} />
            <Mouth mood={mood} />
          </>
        ) : (
          <Mouth mood={mood} />
        )}
        {L.accessory === "glasses" && (
          <g fill="none" stroke="#2a2a33" strokeWidth="1.8">
            <rect x="35.5" y="43" width="12" height="9.5" rx="3.5" />
            <rect x="52.5" y="43" width="12" height="9.5" rx="3.5" />
            <path d="M47.5 47h5" />
          </g>
        )}
        {L.accessory === "headphones" && (
          <g>
            <path d="M27 50c0-18 10-28 23-28s23 10 23 28" fill="none" stroke="#222" strokeWidth="3.5" />
            <rect x="23" y="45" width="8" height="14" rx="4" fill={L.accent} stroke="#222" strokeWidth="1.5" />
            <rect x="69" y="45" width="8" height="14" rx="4" fill={L.accent} stroke="#222" strokeWidth="1.5" />
          </g>
        )}
        {L.accessory === "beret" && <ellipse cx="46" cy="24" rx="22" ry="8" fill={L.accent} transform="rotate(-10 46 24)" />}
      </svg>
    </div>
  );
}
