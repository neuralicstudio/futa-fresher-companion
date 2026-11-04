// The full-bleed screen header: a photo, a night scrim, the logo row, one handwritten line, the
// title and a lead. Every screen that has a hero uses this (docs/design/COMPONENTS.md, Hero).
//
// Text never sits on a raw photo: the scrim in `.hero__body::before` is part of the component.
import type { ReactNode } from 'react';
import Student from './Student';

interface HeroProps {
  /** `tall` is 600px (Welcome), `std` is 430px (the rest). */
  size?: 'tall' | 'std';
  /** A file in web/public/photos. Leave it out to use the plain night background. */
  photo?: string;
  /** The screen's ONE handwritten line. Never used anywhere else. */
  kicker: string;
  title: string;
  /** The last words of the title, in gold. */
  gold?: string;
  lead?: string;
  /** The logo row, so it sits over the photo instead of above it. */
  header?: ReactNode;
  /** A badge over the photo, on the right: Home's countdown. */
  badge?: ReactNode;
  /** The drawn student in the bottom-right corner, as on the auth screens. */
  student?: 'wave' | 'phone';
  /** The call to action and any line under the lead. */
  children?: ReactNode;
  className?: string;
}

export default function Hero({
  size = 'std',
  photo,
  kicker,
  title,
  gold,
  lead,
  header,
  badge,
  student,
  children,
  className,
}: HeroProps) {
  return (
    <header
      className={`hero hero--${size}${className ? ` ${className}` : ''}`}
      aria-labelledby="hero-title"
    >
      {photo && (
        <div className="hero__bg" aria-hidden="true">
          <img src={photo} alt="" />
        </div>
      )}

      {header}

      <div className="hero__body">
        <p className="hand">{kicker}</p>
        <h1 id="hero-title">
          {title}
          {gold && (
            <>
              {' '}
              <span className="gold">{gold}</span>
            </>
          )}
        </h1>
        {lead && <p className="hero__lead">{lead}</p>}
        {children}
      </div>

      {badge && <div className="hero__badge">{badge}</div>}

      {student && (
        <div className="hero__badge">
          <Student pose={student} />
        </div>
      )}
    </header>
  );
}
