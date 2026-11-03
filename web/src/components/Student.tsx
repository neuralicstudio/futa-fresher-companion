// The drawn students from the design: original characters, not real people.
//
// The paths are copied from docs/design/prototype/assets/scenes.js (`person()`), so the app draws
// the same figures without shipping the whole scene engine. Colours come from the scene tokens
// through the `.f-*` / `.s-*` classes in styles.css.
interface StudentProps {
  pose: 'wave' | 'phone';
}

export default function Student({ pose }: StudentProps) {
  return (
    <svg
      className="hero__student"
      viewBox="-62 -128 124 132"
      aria-hidden="true"
      focusable="false"
    >
      {pose === 'wave' ? <Waving /> : <OnPhone />}
    </svg>
  );
}

/** Braids in a high bun, maroon top, jeans. The Register hero. */
function Waving() {
  return (
    <g>
      <path className="s-sky ln" d="M-4 -48v46" strokeWidth="9" />
      <path className="s-sky ln" d="M4 -48v46" strokeWidth="9" />
      <path className="f-night" d="M-11 0h9v-4h-8zM2 0h9l-1-4h-8z" />
      <path
        className="f-maroon"
        d="M-13 -46c-1-12 0-26 4-32 3-3 15-3 18 0 4 6 5 20 4 32z"
      />
      <path className="f-shade" d="M2 -78c3 0 5 1 7 3 4 6 5 20 4 29H4c2-10 1-24-2-32z" />
      <path className="s-k1 ln" d="M-10 -74c-4 8-6 16-5 26" strokeWidth="6" />
      <path className="s-k1 ln" d="M10 -74c6-4 9-12 9-22" strokeWidth="6" />
      <rect className="f-k1" x="-3.5" y="-84" width="7" height="8" rx="3" />
      <circle className="f-k1" cx="0" cy="-94" r="11" />
      <path
        className="f-hair"
        d="M-11 -95c0-9 5-13 11-13s11 4 11 13c-3-5-7-7-11-7s-8 2-11 7z"
      />
      <circle className="f-hair" cx="2" cy="-110" r="6" />
      <circle className="f-hair" cx="-4" cy="-94" r="1.3" />
      <circle className="f-hair" cx="4" cy="-94" r="1.3" />
      <path className="s-hair ln" d="M-3 -89q3 2.4 6 0" strokeWidth="1.4" />
    </g>
  );
}

/** Short fade, glasses, gold shirt, backpack, a phone. The Log in hero. */
function OnPhone() {
  return (
    <g>
      <path className="s-night ln" d="M-4 -48v46" strokeWidth="9" />
      <path className="s-night ln" d="M4 -48v46" strokeWidth="9" />
      <path className="f-night" d="M-11 0h9v-4h-8zM2 0h9l-1-4h-8z" />
      <rect className="f-coral" x="-17" y="-80" width="12" height="26" rx="5" />
      <path className="f-gold" d="M-13 -46c-1-12 0-26 4-32 3-3 15-3 18 0 4 6 5 20 4 32z" />
      <path className="f-shade" d="M2 -78c3 0 5 1 7 3 4 6 5 20 4 29H4c2-10 1-24-2-32z" />
      <path className="s-k2 ln" d="M-10 -74c-4 8-6 16-5 26" strokeWidth="6" />
      <path className="s-k2 ln" d="M10 -74c5 6 4 14-3 16" strokeWidth="6" />
      <rect className="f-night" x="-1" y="-66" width="7" height="11" rx="2" />
      <rect className="f-k2" x="-3.5" y="-84" width="7" height="8" rx="3" />
      <circle className="f-k2" cx="0" cy="-94" r="11" />
      <path className="f-hair" d="M-11 -96c0-8 5-12 11-12s11 4 11 12c-4-3-7-4-11-4s-8 1-11 4z" />
      <circle className="f-hair" cx="-4" cy="-94" r="1.3" />
      <circle className="f-hair" cx="4" cy="-94" r="1.3" />
      <path className="s-hair ln" d="M-3 -89q3 2.4 6 0" strokeWidth="1.4" />
      <g className="s-night ln" strokeWidth="1.3">
        <circle cx="-4" cy="-94" r="3" />
        <circle cx="4" cy="-94" r="3" />
        <path d="M-1 -94h2" />
      </g>
    </g>
  );
}
