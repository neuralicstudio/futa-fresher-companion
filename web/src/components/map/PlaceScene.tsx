// The drawn scene behind a place with no photo (screenshots place-noPhoto-390 and
// place-notFound-390). It is a placeholder, not a picture of a real building; the photo credits
// screen says so (docs/design/CREDITS.md, Drawings). Decorative only.
export default function PlaceScene() {
  return (
    <svg
      className="place-scene"
      viewBox="0 0 390 340"
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
    >
      <defs>
        <linearGradient id="place-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c0d20" />
          <stop offset="0.62" stopColor="#140918" />
          <stop offset="1" stopColor="#0c070f" />
        </linearGradient>
        <radialGradient id="place-glow">
          <stop offset="0" stopColor="#f6e7c6" stopOpacity="0.28" />
          <stop offset="1" stopColor="#f6e7c6" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="390" height="340" fill="url(#place-sky)" />

      {/* A moon with its glow, and enough stars to read as night without competing with text. */}
      <g fill="#f8eed6">
        <circle cx="62" cy="46" r="1.5" opacity="0.7" />
        <circle cx="108" cy="26" r="1" opacity="0.5" />
        <circle cx="150" cy="58" r="1.7" opacity="0.8" />
        <circle cx="196" cy="30" r="1.2" opacity="0.6" />
        <circle cx="232" cy="72" r="1" opacity="0.45" />
        <circle cx="286" cy="34" r="1.4" opacity="0.65" />
        <circle cx="350" cy="132" r="1.2" opacity="0.5" />
        <circle cx="36" cy="112" r="1" opacity="0.4" />
        <circle cx="126" cy="96" r="1.3" opacity="0.55" />
        <circle cx="246" cy="118" r="1" opacity="0.4" />
        <circle cx="386" cy="52" r="1.3" opacity="0.55" />
      </g>
      <circle cx="318" cy="72" r="62" fill="url(#place-glow)" />
      <circle cx="318" cy="72" r="30" fill="#efe4c9" opacity="0.92" />
      <circle cx="304" cy="62" r="26" fill="#170b1b" opacity="0.96" />

      {/* The block itself: a long, low building with a red roof and warm windows. */}
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

      {/* Ground, so the building sits on something. */}
      <path d="M0 294h390v46H0z" fill="#120b14" />
      <path d="M0 300c60-12 120-12 195 0s135 10 195-2v42H0z" fill="#0e0810" />
    </svg>
  );
}
