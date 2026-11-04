// The drawn night scenes: the picture a screen shows when there is no photo (screenshots
// place-noPhoto-390 and academics-390). They are drawings, not pictures of real buildings; the
// photo credits screen says so (docs/design/CREDITS.md, Drawings). Decorative only.
//
// Four shapes cover what the mockups use: a long low block, an arched hall, a lamplit path up to
// a building, and the campus gate. The sky, moon and stars are shared, so they always look like
// the same night.
import { useId } from 'react';

export type SceneVariant = 'block' | 'hall' | 'path' | 'gate';

interface SceneProps {
  /** `block` is the long low building place detail falls back to. */
  variant?: SceneVariant;
  /** Mirrors the drawing, so a grid of scenes does not look stamped from one mould. */
  flip?: boolean;
  className?: string;
}

const STARS: [number, number, number, number][] = [
  [62, 46, 1.5, 0.7],
  [108, 26, 1, 0.5],
  [150, 58, 1.7, 0.8],
  [196, 30, 1.2, 0.6],
  [232, 72, 1, 0.45],
  [286, 34, 1.4, 0.65],
  [350, 132, 1.2, 0.5],
  [36, 112, 1, 0.4],
  [126, 96, 1.3, 0.55],
  [246, 118, 1, 0.4],
  [386, 52, 1.3, 0.55],
];

/** The block: a long, low building with a red roof and warm windows. */
function Block() {
  return (
    <g>
      <path d="M56 170l24-17h236l20 17z" fill="#5e1d29" />
      <rect x="64" y="168" width="264" height="126" fill="#24101d" />
      <g fill="#f7c85c" opacity="0.82">
        <rect x="84" y="188" width="22" height="26" rx="2" />
        <rect x="122" y="188" width="22" height="26" rx="2" />
        <rect x="160" y="188" width="22" height="26" rx="2" />
        <rect x="198" y="188" width="22" height="26" rx="2" />
        <rect x="236" y="188" width="22" height="26" rx="2" />
        <rect x="274" y="188" width="22" height="26" rx="2" />
        <rect x="84" y="234" width="22" height="26" rx="2" />
        <rect x="122" y="234" width="22" height="26" rx="2" />
        <rect x="236" y="234" width="22" height="26" rx="2" />
        <rect x="274" y="234" width="22" height="26" rx="2" />
      </g>
      <rect x="178" y="232" width="32" height="62" rx="3" fill="#3a1a26" />
    </g>
  );
}

/** The hall: an arched red roof over a row of tall windows. */
function Hall() {
  return (
    <g>
      <path d="M48 206c0-48 66-78 147-78s147 30 147 78z" fill="#a8242f" />
      <path d="M58 206c0-41 61-66 137-66s137 25 137 66z" fill="#7d1c26" />
      <rect x="56" y="206" width="278" height="88" fill="#24101d" />
      <g fill="#f7c85c" opacity="0.82">
        <rect x="78" y="220" width="26" height="42" rx="2" />
        <rect x="122" y="220" width="26" height="42" rx="2" />
        <rect x="166" y="220" width="26" height="42" rx="2" />
        <rect x="210" y="220" width="26" height="42" rx="2" />
        <rect x="254" y="220" width="26" height="42" rx="2" />
        <rect x="298" y="220" width="26" height="42" rx="2" />
      </g>
      <rect x="176" y="238" width="38" height="56" rx="3" fill="#3a1a26" />
    </g>
  );
}

function Lamp({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x} 244v-54`} stroke="#2a1a12" strokeWidth="4" />
      <circle cx={x} cy="184" r="18" fill="#f7c85c" opacity="0.12" />
      <circle cx={x} cy="184" r="7" fill="#f7c85c" />
    </g>
  );
}

/** The path: a low block set back, a dirt path up to it, and two lamps. */
function PathScene() {
  return (
    <g>
      <rect x="10" y="184" width="150" height="60" fill="#24101d" />
      <path d="M10 184l18-14h114l18 14z" fill="#5e1d29" />
      <g fill="#f7c85c" opacity="0.78">
        <rect x="26" y="200" width="18" height="18" rx="2" />
        <rect x="58" y="200" width="18" height="18" rx="2" />
        <rect x="90" y="200" width="18" height="18" rx="2" />
        <rect x="122" y="200" width="18" height="18" rx="2" />
      </g>
      <path d="M162 340h62l28-96h-118z" fill="#4a2c22" opacity="0.9" />
      <Lamp x={112} />
      <Lamp x={286} />
      <g fill="#1f5537">
        <circle cx="336" cy="222" r="26" />
        <circle cx="358" cy="236" r="20" />
        <circle cx="52" cy="226" r="22" />
      </g>
      <rect x="330" y="240" width="5" height="24" fill="#2a1a12" />
      <rect x="50" y="238" width="5" height="26" fill="#2a1a12" />
    </g>
  );
}

/** The gate: two pillars, a beam between them and a clipped hedge. */
function Gate() {
  return (
    <g>
      <rect x="84" y="176" width="38" height="118" fill="#5a2230" />
      <rect x="268" y="176" width="38" height="118" fill="#5a2230" />
      <rect x="76" y="162" width="54" height="16" rx="2" fill="#7d1c26" />
      <rect x="260" y="162" width="54" height="16" rx="2" fill="#7d1c26" />
      <rect x="84" y="186" width="222" height="13" fill="#8a2f36" />
      <g fill="#f7c85c" opacity="0.7">
        <circle cx="128" cy="192" r="2.2" />
        <circle cx="160" cy="192" r="2.2" />
        <circle cx="192" cy="192" r="2.2" />
        <circle cx="224" cy="192" r="2.2" />
        <circle cx="256" cy="192" r="2.2" />
      </g>
      <rect x="52" y="254" width="286" height="40" rx="6" fill="#123326" />
      <g fill="#1f5537">
        <circle cx="86" cy="258" r="16" />
        <circle cx="140" cy="256" r="18" />
        <circle cx="206" cy="258" r="15" />
        <circle cx="258" cy="256" r="17" />
        <circle cx="308" cy="258" r="15" />
      </g>
      <path d="M168 340h54l-27-46z" fill="#4a2c22" opacity="0.85" />
    </g>
  );
}

export default function Scene({ variant = 'block', flip = false, className }: SceneProps) {
  // Each scene draws its own sky and glow, so a page with six of them must not reuse one id.
  const uid = useId().replace(/:/g, '');
  const sky = `scene-sky-${uid}`;
  const glow = `scene-glow-${uid}`;

  return (
    <svg
      className={`scene${className ? ` ${className}` : ''}`}
      viewBox="0 0 390 340"
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c0d20" />
          <stop offset="0.62" stopColor="#140918" />
          <stop offset="1" stopColor="#0c070f" />
        </linearGradient>
        <radialGradient id={glow}>
          <stop offset="0" stopColor="#f6e7c6" stopOpacity="0.28" />
          <stop offset="1" stopColor="#f6e7c6" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="390" height="340" fill={`url(#${sky})`} />

      <g fill="#f8eed6">
        {STARS.map(([x, y, r, opacity]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} opacity={opacity} />
        ))}
      </g>
      <circle cx="318" cy="72" r="62" fill={`url(#${glow})`} />
      <circle cx="318" cy="72" r="30" fill="#efe4c9" opacity="0.92" />
      <circle cx="304" cy="62" r="26" fill="#170b1b" opacity="0.96" />

      <g transform={flip ? 'translate(390 0) scale(-1 1)' : undefined}>
        {variant === 'hall' ? <Hall /> : variant === 'path' ? <PathScene /> : variant === 'gate' ? <Gate /> : <Block />}
      </g>

      {/* Ground, so the building sits on something. */}
      <path d="M0 294h390v46H0z" fill="#120b14" />
      <path d="M0 300c60-12 120-12 195 0s135 10 195-2v42H0z" fill="#0e0810" />
    </svg>
  );
}
