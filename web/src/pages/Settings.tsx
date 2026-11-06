// Settings: the one place for the app's own housekeeping (screenshots settings-390,
// settings-768, settings-offline-390).
//
// It shows only what Sabi can really do today: who you are, what is saved on this phone, the
// browser's own storage figure, and the way out. Lite mode, the photo pack, language and the
// privacy page wait for the features they switch; a row that does nothing is a promise, not a
// setting.
//
// The page draws its own hero, page and footer, so App keeps the shell off this route.
import { useEffect, useState, type HTMLAttributes, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Icon, { type IconName } from '../components/Icon';
import { COPY } from '../copy/pidgin';
import type { User } from '../api/types';
import { useAuth } from '../lib/auth';
import { initials } from '../lib/initials';
import { readSettingsScreen, syncReferenceData } from '../lib/offline';
import {
  lastSavedText,
  profileLine,
  storagePercent,
  storageText,
} from '../lib/settingsView';
import { useCachedRows } from '../lib/useCachedRows';

type StorageState =
  | { state: 'unknown' }
  | { state: 'known'; value: string; percent: number };

type CheckState = 'idle' | 'checking' | 'done' | 'failed';

/** One row in a card: a symbol, a title, an optional line under it, and an optional tail. */
function Row({
  icon,
  title,
  titleId,
  line,
  tail,
  ...rest
}: {
  icon: IconName;
  title: string;
  titleId?: string;
  line?: string;
  tail?: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="srow" {...rest}>
      <Icon name={icon} size={28} className="srow__ic" />
      <span className="srow__main">
        <b id={titleId}>{title}</b>
        {line && <small>{line}</small>}
      </span>
      {tail}
    </div>
  );
}

function ProfileCard({
  signedIn,
  loading,
  user,
  line,
}: {
  signedIn: boolean;
  loading: boolean;
  user: User | null;
  line: string;
}) {
  if (!signedIn && !loading) {
    return (
      <Link className="card card--profile" to="/login">
        <span className="profile__avatar" aria-hidden="true">
          <Icon name="profile" size={30} />
        </span>
        <span className="profile__main">
          <b>{COPY.profile.guest}</b>
          <small>{COPY.settings.profileGuest}</small>
        </span>
        <Icon name="caretRight" size={20} className="srow__go" />
      </Link>
    );
  }

  return (
    <div className="card card--profile">
      <span className="profile__avatar" aria-hidden="true">
        {loading ? <Icon name="profile" size={30} /> : initials(user?.full_name)}
      </span>
      <span className="profile__main">
        <b>
          {loading
            ? COPY.states.loadingTitle
            : (user?.full_name ?? COPY.settings.profileUnknown)}
        </b>
        {!loading && line && <small>{line}</small>}
      </span>
    </div>
  );
}

function SettingsScreen({ departmentId }: { departmentId: string | null }) {
  const { status, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { result, retry } = useCachedRows(() => readSettingsScreen(departmentId));

  const [storage, setStorage] = useState<StorageState>({ state: 'unknown' });
  const [check, setCheck] = useState<CheckState>('idle');

  // The browser's figure for this app's origin, not a guess. A browser that will not say (or a
  // page with no quota) simply leaves the row out.
  useEffect(() => {
    let active = true;
    const manager = navigator.storage;
    if (!manager || typeof manager.estimate !== 'function') return;

    manager.estimate().then(
      ({ usage, quota }) => {
        if (!active) return;
        const value = storageText(usage ?? null, quota ?? null);
        if (!value) return;
        setStorage({
          state: 'known',
          value,
          percent: storagePercent(usage ?? null, quota ?? null),
        });
      },
      () => {
        // No answer is an answer: keep the row quiet.
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const signedIn = status === 'signed-in';
  const loading = status === 'loading';

  const data = result.state === 'ready' ? result.value : null;
  const savedLine =
    result.state === 'ready'
      ? lastSavedText(data?.lastSaved)
      : result.state === 'error'
        ? COPY.settings.savedUnknown
        : COPY.settings.loadingSaved;
  const profile = profileLine(data?.departmentName ?? null, user?.level ?? null);

  const checkNote =
    check === 'checking'
      ? COPY.settings.checking
      : check === 'done'
        ? COPY.settings.upToDate
        : check === 'failed'
          ? COPY.settings.checkFailed
          : '';

  async function checkForUpdates() {
    if (check === 'checking') return;
    setCheck('checking');
    try {
      await syncReferenceData();
      setCheck('done');
    } catch {
      // Offline, or the server said no. The line says so; the saved data stays.
      setCheck('failed');
    }
  }

  function logOut() {
    signOut();
    navigate('/');
  }

  return (
    <>
      <Hero
        size="short"
        className="hero--settings"
        photo="/photos/tree-l.webp"
        kicker={COPY.settings.kicker}
        title={COPY.settings.title}
        lead={COPY.settings.lead}
        header={<AppHeader variant="hero" pill />}
      />

      <div className="page page--settings">
        <ProfileCard signedIn={signedIn} loading={loading} user={user} line={profile} />

        <section className="card" aria-labelledby="settings-offline-h">
          <Row
            icon="cloudArrowDown"
            title={COPY.settings.offlineTitle}
            titleId="settings-offline-h"
            line={savedLine}
          />

          <button
            type="button"
            className="srow srow--btn"
            onClick={checkForUpdates}
            disabled={check === 'checking'}
          >
            <Icon name="arrowsClockwise" size={28} className="srow__ic" />
            <span className="srow__main">
              <b>{COPY.settings.check}</b>
              <small role="status">{checkNote}</small>
            </span>
            <Icon name="caretRight" size={18} className="srow__go" />
          </button>

          {result.state === 'error' && (
            <button type="button" className="srow srow--btn" onClick={retry}>
              <Icon name="warningCircle" size={28} className="srow__ic" />
              <span className="srow__main">
                <b>{COPY.states.retry}</b>
              </span>
            </button>
          )}

          {storage.state === 'known' && (
            <div className="srow srow--storage">
              <Icon name="database" size={28} className="srow__ic" />
              <span className="srow__main">
                <b>{COPY.settings.storage}</b>
                <span
                  className="bar"
                  role="img"
                  aria-label={storage.value}
                >
                  <i style={{ width: `${storage.percent}%` }} />
                </span>
                <small>{COPY.settings.storageHelp}</small>
              </span>
              <span className="srow__val num">{storage.value}</span>
            </div>
          )}
        </section>

        <section className="card" aria-labelledby="settings-about-h">
          <Link className="srow" to="/credits">
            <Icon name="camera" size={28} className="srow__ic" />
            <span className="srow__main">
              <b>{COPY.settings.creditsTitle}</b>
              <small>{COPY.settings.creditsBody}</small>
            </span>
            <Icon name="caretRight" size={18} className="srow__go" />
          </Link>
          <Row
            icon="info"
            title={COPY.settings.aboutTitle}
            titleId="settings-about-h"
            line={COPY.settings.aboutBody.replace('{version}', __APP_VERSION__)}
          />
        </section>

        {signedIn && (
          <section className="card card--danger-soft">
            <button
              type="button"
              className="srow srow--btn srow--danger"
              onClick={logOut}
            >
              <Icon name="signOut" size={28} className="srow__ic" />
              <span className="srow__main">
                <b>{COPY.settings.logout}</b>
                <small>{COPY.settings.logoutBody}</small>
              </span>
              <Icon name="caretRight" size={18} className="srow__go" />
            </button>
          </section>
        )}
      </div>

      <Footer className="foot--tabs" />
    </>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const departmentId = user?.department_id ?? null;

  // A different student means a different department name on the profile card, so the screen
  // reads the cache again when that changes.
  return <SettingsScreen key={departmentId ?? 'none'} departmentId={departmentId} />;
}
