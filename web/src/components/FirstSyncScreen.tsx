// The first-time sync: the screen a new phone sees while the campus data comes down.
//
// It is the same screen in three states (docs/design/SCREENS.md, 11): syncing, done and
// failed. The server sends no totals, so the ring is a spinner and each row counts what has
// arrived; there is no made-up "132/256" (docs/design/SCREENS.md says the counts need a change
// in lib/sync.ts, which is where `counts` comes from).
import AppHeader from './AppHeader';
import Footer from './Footer';
import Hero from './Hero';
import Icon, { type IconName } from './Icon';
import { COPY } from '../copy/pidgin';
import type { CollectionName, SyncProgress } from '../lib/sync';

interface FirstSyncScreenProps {
  progress: SyncProgress;
  /** "Continue without saving", "You're set!" → away from this screen. */
  onContinue: () => void;
  /** "Retry" after a failed first sync. */
  onRetry: () => void;
}

const ROWS: { key: CollectionName; label: string; icon: IconName }[] = [
  { key: 'faculties', label: COPY.sync.items.schools, icon: 'graduationCap' },
  { key: 'departments', label: COPY.sync.items.departments, icon: 'buildings' },
  { key: 'courses', label: COPY.sync.items.courses, icon: 'bookOpen' },
  { key: 'timetable_entries', label: COPY.sync.items.timetables, icon: 'timetable' },
  { key: 'buildings', label: COPY.sync.items.buildings, icon: 'map' },
  { key: 'announcements', label: COPY.sync.items.notices, icon: 'notices' },
];

export default function FirstSyncScreen({ progress, onContinue, onRetry }: FirstSyncScreenProps) {
  const { running, failed, rows, counts } = progress;
  const done = !running && !failed;
  const tag = running ? COPY.sync.syncing : failed ? COPY.sync.failedTag : COPY.sync.stateDoneTag;

  return (
    <>
      <Hero
        className="hero--sync"
        photo="/photos/gate-l.webp"
        kicker={COPY.sync.kicker}
        title={COPY.sync.title}
        gold={COPY.sync.titleGold}
        lead={COPY.sync.lead}
        header={<AppHeader variant="hero" />}
      />

      <div className="page page--sync">
        <section className="card card--soft syncing" aria-labelledby="sync-title">
          <div
            className={`sync-ring${running ? ' is-busy' : failed ? ' is-fail' : ' is-done'}`}
            role="progressbar"
            aria-valuetext={`${rows} ${COPY.sync.savedLabel}`}
            aria-label={COPY.sync.savingTitle}
          >
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle className="sync-ring__track" cx="60" cy="60" r="52" />
              <circle className="sync-ring__arc" cx="60" cy="60" r="52" />
            </svg>
            <span className="sync-ring__in">
              <b className="num">{rows}</b>
              <small>{tag}</small>
            </span>
          </div>

          <div className="syncing__list">
            <h2 id="sync-title">{COPY.sync.savingTitle}</h2>
            <ul className="sync-rows" role="list">
              {ROWS.map((row) => {
                const count = counts[row.key];
                const state = done ? 'done' : running ? (count > 0 ? 'now' : 'wait') : count > 0 ? 'fail' : 'wait';
                return (
                  <li className="sync-row" key={row.key}>
                    <Icon name={row.icon} size={22} className="sync-row__ic" />
                    <span className="sync-row__name">{row.label}</span>
                    <span className="sync-row__n num">{count}</span>
                    <Mark state={state} />
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {done ? (
          <div className="card card--success note-row" role="status">
            <Icon name="checkCircleFill" size={28} className="ic--green" />
            <div>
              <b>{COPY.sync.stateDoneTitle}</b>
              <p>{COPY.sync.stateDoneBody}</p>
            </div>
          </div>
        ) : failed ? (
          <div className="card card--danger note-row" role="alert">
            <Icon name="wifiSlash" size={28} className="ic--red" />
            <div>
              <b>{COPY.sync.stateFailTitle}</b>
              <p>{COPY.sync.stateFailBody}</p>
            </div>
            <button type="button" className="btn btn--outline-red btn--sm" onClick={onRetry}>
              <Icon name="arrowsClockwise" size={18} />
              <span>{COPY.sync.retry}</span>
            </button>
          </div>
        ) : (
          <div className="card card--soft note-row">
            <Icon name="deviceMobile" size={28} />
            <div>
              <b>{COPY.sync.keepUsingTitle}</b>
              <p>{COPY.sync.keepUsingBody}</p>
            </div>
          </div>
        )}

        <button type="button" className="btn btn--gold btn--block btn--lg" onClick={onContinue}>
          <span>{done ? COPY.sync.doneAction : COPY.sync.continue}</span>
          <Icon name="arrowRight" size={22} />
        </button>

        <section className="card card--soft note-row" aria-labelledby="sync-why">
          <Icon name="lightbulb" size={28} />
          <div>
            <b id="sync-why">{COPY.sync.whyTitle}</b>
            <p>{COPY.sync.whyBody}</p>
          </div>
        </section>

        <p className="meta-line meta-line--center">
          <Icon name="database" size={20} />
          <span>
            {COPY.sync.dataLine.replace('{size}', COPY.sync.dataSize)} {COPY.sync.wifi}
          </span>
        </p>
      </div>

      <Footer />
    </>
  );
}

/** The mark at the end of a row: a tick, a moving dot, a clock, or a warning. */
function Mark({ state }: { state: 'done' | 'now' | 'wait' | 'fail' }) {
  if (state === 'done') {
    return (
      <>
        <Icon name="checkCircleFill" size={22} className="st st--done" />
        <span className="visually-hidden">{COPY.sync.stateDoneTag}</span>
      </>
    );
  }
  if (state === 'fail') {
    return (
      <>
        <Icon name="warningCircleFill" size={22} className="st st--fail" />
        <span className="visually-hidden">{COPY.sync.stateFailTitle}</span>
      </>
    );
  }
  if (state === 'now') {
    return (
      <>
        <span className="st st--now" aria-hidden="true" />
        <span className="visually-hidden">{COPY.sync.stateSyncingTag}</span>
      </>
    );
  }
  return (
    <>
      <Icon name="clock" size={22} className="st st--wait" />
      <span className="visually-hidden">{COPY.sync.waitTag}</span>
    </>
  );
}
