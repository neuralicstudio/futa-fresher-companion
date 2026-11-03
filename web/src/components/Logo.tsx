// The Sabi mark: a gold map pin with a night mortarboard cap (docs/design/brand/mark.svg).
//
// Colours come from CSS classes, never from hex literals, so the mark follows the tokens.
interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <svg
      className={`logo${className ? ` ${className}` : ''}`}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="logo__pin"
        d="M24 3C14.6 3 7 10.4 7 19.5 7 31 24 45 24 45s17-14 17-25.5C41 10.4 33.4 3 24 3z"
      />
      <path className="logo__cap" d="M24 12.5 11.5 18.6 24 24.7l12.5-6.1L24 12.5z" />
      <path
        className="logo__cap-line"
        d="M17.5 22.3v4.6c0 1.6 3 3.1 6.5 3.1s6.5-1.5 6.5-3.1v-4.6M36.5 18.6v7"
      />
    </svg>
  );
}
