// The logo row: mark, wordmark and the profile button, which is the only way to Settings and Admin.
//
// It sits at the top of every screen. On a screen with a hero it is rendered INSIDE the hero
// (`variant="hero"`), so it reads over the photo; elsewhere App renders it above the page.
// The profile sheet lives here too, so any header can open it.
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import Logo from './Logo';
import ProfileSheet from './ProfileSheet';
import { COPY } from '../copy/pidgin';
import { initials } from '../lib/initials';
import { useAuth } from '../lib/auth';

interface AppHeaderProps {
  /** `hero` removes the page padding and lets the photo show through. */
  variant?: 'bar' | 'hero';
  /** Welcome has no profile icon (docs/design/SCREENS.md, 1). */
  showProfile?: boolean;
  /** The lockup on a dark pill, as on Welcome. */
  pill?: boolean;
  /**
   * A way back instead of the logo lockup (screenshot place-390: "← Back to map"). The profile
   * button and its sheet stay, because this is still another screen in the app.
   */
  back?: { to: string; label: string };
  /**
   * The screen's name beside the back link, as the notice screen draws "← Back to notices
   * Notice" (notice-390). It is the screen's h1, so the page below starts at h2.
   */
  title?: string;
}

export default function AppHeader({
  variant = 'bar',
  showProfile = true,
  pill = false,
  back,
  title,
}: AppHeaderProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  // A route change closes the sheet, so it never floats over a screen it did not open from.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const signedIn = auth.status === 'signed-in';

  return (
    <>
      <header className={`app-header app-header--${variant}`}>
        {back ? (
          <div className="app-header__leader">
            <Link className="app-header__back" to={back.to}>
              <Icon name="arrowLeft" size={22} />
              <span>{back.label}</span>
            </Link>
            {title && <h1 className="app-header__title">{title}</h1>}
          </div>
        ) : (
          <Link
            className={`app-header__brand${pill ? ' is-pill' : ''}`}
            to="/"
            aria-label={`${COPY.app.name}, ${COPY.shell.tabs.home}`}
          >
            <Logo className="app-header__mark" />
            <span className="app-header__word">
              <b>{COPY.app.name}</b>
              <small>{COPY.app.tagline}</small>
            </span>
          </Link>
        )}

        {showProfile && (
          <button
            type="button"
            className="app-header__profile"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-label={COPY.shell.profile}
          >
            {signedIn ? (
              <span aria-hidden="true">{initials(auth.user?.full_name)}</span>
            ) : (
              <Icon name="profile" size={22} />
            )}
          </button>
        )}
      </header>

      {showProfile && (
        <ProfileSheet
          open={open}
          onClose={() => setOpen(false)}
          user={auth.user}
          signedIn={signedIn}
          onSignOut={() => {
            auth.signOut();
            navigate('/');
          }}
        />
      )}
    </>
  );
}
