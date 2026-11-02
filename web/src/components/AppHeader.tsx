// The logo row: mark, wordmark and the profile button.
//
// It sits at the top of every screen, including the ones without a tab bar (log in, first
// sync). The design shows it over each screen's hero photo, so it is transparent: the scrim
// that makes the text readable belongs to the hero behind it, not to this row.
import { Link } from 'react-router-dom';
import Icon from './Icon';
import { COPY } from '../copy/pidgin';
import { initials } from '../lib/initials';

interface AppHeaderProps {
  signedIn: boolean;
  name?: string;
  onOpenProfile: () => void;
}

/** The Sabi mark: a gold map pin with a graduation cap, from docs/design/brand/mark.svg. */
function Mark() {
  return (
    <svg className="app-header__mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M24 3C14.6 3 7 10.4 7 19.5 7 31 24 45 24 45s17-14 17-25.5C41 10.4 33.4 3 24 3z" fill="#fcc13c" />
      <path d="M24 12.5 11.5 18.6 24 24.7l12.5-6.1L24 12.5z" fill="#0a0309" />
      <path
        d="M17.5 22.3v4.6c0 1.6 3 3.1 6.5 3.1s6.5-1.5 6.5-3.1v-4.6M36.5 18.6v7"
        fill="none"
        stroke="#0a0309"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AppHeader({ signedIn, name, onOpenProfile }: AppHeaderProps) {
  return (
    <header className="app-header">
      <Link className="app-header__brand" to="/">
        <Mark />
        <span className="app-header__word">
          <b>{COPY.app.name}</b>
          <small>{COPY.app.tagline}</small>
        </span>
      </Link>

      <button
        type="button"
        className="app-header__profile"
        onClick={onOpenProfile}
        aria-label={COPY.shell.profile}
      >
        {signedIn ? (
          <span aria-hidden="true">{initials(name)}</span>
        ) : (
          <Icon name="profile" size={22} />
        )}
      </button>
    </header>
  );
}
