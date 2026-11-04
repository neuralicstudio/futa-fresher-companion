// The footer every screen ends with: the gold wave lines, the friendly sign-off, the "unofficial"
// line and the photo credits link.
//
// The credits page arrives in its own step. Until then the footer says the credit for the photo
// on this screen in plain words, so nothing is used without a source (CREDITS.md).
import Logo from './Logo';
import { COPY } from '../copy/pidgin';

interface FooterProps {
  /** The credit line for the photo above, when the screen shows one. */
  photoCredit?: string;
}

function Waves() {
  return (
    <svg className="waves" viewBox="0 0 390 120" preserveAspectRatio="none" aria-hidden="true">
      <g>
        <path d="M0 40C40 46 90 80 130 120" />
        <path d="M0 62C32 68 70 92 100 120" />
        <path d="M0 84C24 90 50 104 70 120" />
      </g>
      <g>
        <path d="M390 40C350 46 300 80 260 120" />
        <path d="M390 62C358 68 320 92 290 120" />
        <path d="M390 84C366 90 340 104 320 120" />
      </g>
    </svg>
  );
}

export default function Footer({ photoCredit }: FooterProps) {
  return (
    <footer className="foot">
      <Waves />
      <p className="foot__line">
        <Logo className="logo--xs" />
        <span>{COPY.app.footer}</span>
      </p>
      <p className="foot__unofficial">{COPY.app.unofficial}</p>
      {photoCredit && <p className="foot__credit">{photoCredit}</p>}
    </footer>
  );
}
