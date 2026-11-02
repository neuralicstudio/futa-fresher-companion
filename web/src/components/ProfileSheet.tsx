// The profile sheet: the only way to reach Settings and Admin.
//
// The design keeps these out of the tab bar on purpose, so this sheet is the app's single
// account surface. It renders as a bottom sheet on a phone and stays centred on a wide screen.
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import { COPY } from '../copy/pidgin';
import type { User } from '../api/types';
import { isAdminRole } from '../lib/composerView';
import { initials } from '../lib/initials';

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  signedIn: boolean;
  onSignOut: () => void;
}

export default function ProfileSheet({
  open,
  onClose,
  user,
  signedIn,
  onSignOut,
}: ProfileSheetProps) {
  const sheet = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  // Escape closes, and the page behind must not scroll while the sheet is up.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('is-sheet');
    closeButton.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('is-sheet');
    };
  }, [open, onClose]);

  if (!open) return null;

  const admin = isAdminRole(user?.role);
  // Only admin roles have a label in the copy deck; a student needs no second line.
  const roleLabel =
    admin && user ? COPY.role.roles[user.role as keyof typeof COPY.role.roles] : '';

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div
        className="sheet"
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-label={COPY.profile.title}
      >
        <div className="sheet__grab" aria-hidden="true" />

        <div className="sheet__head">
          <h2 className="sheet__title">{COPY.profile.title}</h2>
          <button
            type="button"
            className="sheet__close"
            ref={closeButton}
            onClick={onClose}
            aria-label={COPY.shell.close}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="sheet__who">
          <span className="sheet__avatar" aria-hidden="true">
            {signedIn ? initials(user?.full_name) : <Icon name="profile" size={24} />}
          </span>
          <div>
            <b>{signedIn ? (user?.full_name ?? COPY.profile.guest) : COPY.profile.guest}</b>
            <small>
              {signedIn ? roleLabel : COPY.profile.guestHelp}
            </small>
          </div>
        </div>

        <div className="sheet__rows">
          {admin && (
            <Link className="sheet__row" to="/admin" onClick={onClose}>
              <Icon name="badge" size={22} />
              <span>
                <b>{COPY.profile.admin}</b>
                <small>{COPY.profile.adminSub}</small>
              </span>
              <Icon name="caretRight" size={18} />
            </Link>
          )}

          {signedIn ? (
            <button
              type="button"
              className="sheet__row sheet__row--danger"
              onClick={() => {
                onSignOut();
                onClose();
              }}
            >
              <Icon name="signOut" size={22} />
              <span>
                <b>{COPY.profile.logout}</b>
                <small>{COPY.profile.logoutSub}</small>
              </span>
              <Icon name="caretRight" size={18} />
            </button>
          ) : (
            <>
              <Link className="sheet__row" to="/login" onClick={onClose}>
                <Icon name="profile" size={22} />
                <span>
                  <b>{COPY.profile.login}</b>
                </span>
                <Icon name="caretRight" size={18} />
              </Link>
              <Link className="sheet__row" to="/register" onClick={onClose}>
                <Icon name="badge" size={22} />
                <span>
                  <b>{COPY.profile.register}</b>
                </span>
                <Icon name="caretRight" size={18} />
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
