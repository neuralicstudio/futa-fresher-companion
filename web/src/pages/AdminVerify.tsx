// Verify Data: the queue of records waiting for a check. The only place a record becomes Verified.
// The server decides who may verify what and records who did it; this screen shows the queue the
// server sent and posts the check. See docs/DECISIONS.md decisions 9 and 10.
//
// It is the same Sabi shell as the other admin screens: the bar with its way back, the handwritten
// line, the queue, the footer and the tab bar (screenshots verify-390, verify-768, verify-detail-390,
// verify-verified-390, verify-empty-390, verify-needSource-390, verify-offline-390).
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { request } from '../api/client';
import type { User, VerifyQueueItem } from '../api/types';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import AdminGate from '../components/admin/AdminGate';
import AdminIcon from '../components/admin/AdminIcon';
import type { IconName } from '../components/admin/iconPaths';
import StateBlock from '../components/admin/StateBlock';
import { COPY, fill } from '../lib/adminCopy';
import { scopeName } from '../lib/adminView';
import { readComposerChoices } from '../lib/offline';
import { useCachedRows } from '../lib/useCachedRows';
import { useVerifyQueue } from '../lib/useVerifyQueue';
import {
  addedLine,
  busyBody,
  checkSource,
  emptyMessage,
  formatDate,
  formatDateTime,
  itemKey,
  markOutdated,
  queueTabs,
  serverSaysLine,
  sourceLine,
  SOURCE_MAX,
  updatedLine,
  verifiedByLine,
  verifyItem,
  type QueueProblem,
  type VerifyProblem,
} from '../lib/verifyView';

const KIND_ICONS: Record<VerifyQueueItem['entity_type'], IconName> = {
  faculties: 'bank',
  departments: 'graduation-cap',
  lecturers: 'chalkboard-teacher',
  courses: 'books',
  class_reps: 'users',
  buildings: 'buildings',
  timetable_entries: 'calendar-blank',
  announcements: 'megaphone',
};

interface Selection {
  item: VerifyQueueItem;
  /** When the record was verified on this device, once it is. */
  doneAt: string | null;
}

export default function AdminVerify() {
  // The bar changes with the screen: inside a record the way back returns to the queue without
  // leaving the route, and the handwritten line goes once the record is verified.
  const [selected, setSelected] = useState<Selection | null>(null);

  return (
    <>
      <AppHeader
        variant="bar"
        back={
          selected
            ? { to: '/admin/verify', label: COPY.verify.back, onClick: () => setSelected(null) }
            : { to: '/admin', label: COPY.admin.backShort }
        }
        title={COPY.verify.title}
      />

      <div className="page page--verify">
        {!selected?.doneAt && <p className="hand">{COPY.verify.kicker}</p>}
        <AdminGate>
          {(user) => (
            <VerifyScreen
              user={user}
              selected={selected}
              onOpen={(item) => setSelected({ item, doneAt: null })}
              onBack={() => setSelected(null)}
              onDone={() =>
                setSelected((current) =>
                  current ? { ...current, doneAt: new Date().toISOString() } : current,
                )
              }
            />
          )}
        </AdminGate>
      </div>

      <Footer className="foot--tabs" />
    </>
  );
}

function VerifyScreen({
  user,
  selected,
  onOpen,
  onBack,
  onDone,
}: {
  user: User;
  selected: Selection | null;
  onOpen: (item: VerifyQueueItem) => void;
  onBack: () => void;
  onDone: () => void;
}) {
  const queue = useVerifyQueue();
  const choices = useCachedRows(readComposerChoices);
  const cached = choices.result.state === 'ready' ? choices.result.value : null;
  const scope = scopeName(user, cached?.faculties ?? [], cached?.departments ?? []);
  // Super admins may verify everything, so the "only yours" line is for the scoped roles.
  const showScope = user.role !== 'super_admin' ? scope : null;
  const [notice, setNotice] = useState<string | null>(null);

  function open(item: VerifyQueueItem) {
    setNotice(null);
    onOpen(item);
  }

  // The card is no longer waiting: it leaves the list, and the queue says why.
  function closed(item: VerifyQueueItem, line: string) {
    queue.removed(item);
    onBack();
    setNotice(line);
  }

  return selected ? (
    <VerifyPanel
      key={itemKey(selected.item)}
      item={selected.item}
      user={user}
      scope={showScope}
      doneAt={selected.doneAt}
      onVerified={() => {
        queue.removed(selected.item);
        onDone();
      }}
      onGone={(item) => closed(item, COPY.verify.gone)}
      onOutdated={(item) => closed(item, COPY.verify.outdatedNotice)}
      onBack={onBack}
    />
  ) : (
    <>
      {notice && (
        <p role="status" className="a-notice">
          {notice}
        </p>
      )}
      <QueueList queue={queue} onOpen={open} />
    </>
  );
}

// ----------------------------------------------------------------- the list

function QueueList({
  queue,
  onOpen,
}: {
  queue: ReturnType<typeof useVerifyQueue>;
  onOpen: (item: VerifyQueueItem) => void;
}) {
  const { state } = queue;
  const tabs = queueTabs(state.counts, state.total, state.kind);

  if (state.phase === 'problem' && state.problem) {
    return <ProblemBlock problem={state.problem} onRetry={queue.retry} />;
  }
  if (state.phase === 'loading' || (state.items.length === 0 && state.nextCursor)) {
    return <Skeleton />;
  }
  if (state.items.length === 0) {
    return <StateBlock icon="sparkle" {...emptyMessage(state.kind)} />;
  }

  return (
    <>
      <p className="lead-text">{COPY.verify.lead}</p>

      {tabs.length > 0 && (
        <div className="filter" role="group" aria-label={COPY.verify.filtersLabel}>
          {tabs.map((tab) => (
            <button
              key={tab.kind}
              type="button"
              aria-pressed={tab.kind === state.kind}
              onClick={() => queue.select(tab.kind)}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      )}

      <ul className="a-queue" aria-label={COPY.verify.title}>
        {state.items.map((item) => (
          <li key={itemKey(item)}>
            <QueueCard item={item} onOpen={onOpen} />
          </li>
        ))}
      </ul>

      {state.nextCursor && (
        <div className="a-more">
          {state.more === 'problem' && (
            <p role="alert" className="a-error">
              {COPY.verify.moreFailed}
            </p>
          )}
          <button
            type="button"
            className="a-btn a-btn--outline"
            disabled={state.more === 'loading'}
            onClick={queue.loadMore}
          >
            {state.more === 'loading'
              ? COPY.verify.loadingMore
              : state.more === 'problem'
                ? COPY.verify.retry
                : COPY.verify.loadMore}
          </button>
        </div>
      )}
    </>
  );
}

/** One record: what it is, where the source came from, and when it arrived. */
function QueueCard({
  item,
  onOpen,
}: {
  item: VerifyQueueItem;
  onOpen: (item: VerifyQueueItem) => void;
}) {
  const source = sourceLine(item);
  const updated = updatedLine(item);
  return (
    <article className="a-card a-row">
      <span className="a-row__icon">
        <AdminIcon name={KIND_ICONS[item.entity_type]} size={28} />
      </span>
      <div className="a-row__body">
        <b className="a-row__name">{item.name}</b>
        {source && <small>{source}</small>}
        <small>
          <time dateTime={item.created_at}>{formatDateTime(item.created_at)}</time>
        </small>
        {updated && (
          <small>
            <time dateTime={item.updated_at}>{updated}</time>
          </small>
        )}
      </div>
      <button
        type="button"
        className="a-btn a-btn--gold a-btn--sm"
        aria-label={fill(COPY.verify.actionFor, { name: item.name })}
        onClick={() => onOpen(item)}
      >
        {COPY.verify.action}
      </button>
    </article>
  );
}

function Skeleton() {
  return (
    <div className="a-card a-skeleton" role="status">
      <span className="a-sr">{COPY.verify.loading}</span>
      <span className="a-skeleton__bar" aria-hidden="true" />
      <span className="a-skeleton__bar a-skeleton__bar--short" aria-hidden="true" />
      <span className="a-skeleton__bar" aria-hidden="true" />
    </div>
  );
}

function ProblemBlock({ problem, onRetry }: { problem: QueueProblem; onRetry: () => void }) {
  const retry = (
    <button type="button" className="a-btn a-btn--outline" onClick={onRetry}>
      <AdminIcon name="arrows-clockwise" size={18} />
      <span>{COPY.verify.retry}</span>
    </button>
  );
  switch (problem.kind) {
    case 'offline':
      return (
        <StateBlock
          icon="wifi-slash"
          error
          title={COPY.verify.offlineTitle}
          body={COPY.verify.offlineBody}
          action={retry}
        />
      );
    case 'forbidden':
      // The server says this account may not use the queue (its role changed since it signed in).
      return (
        <StateBlock
          icon="lock-key"
          title={COPY.gate.notAdminTitle}
          body={COPY.gate.notAdminBody}
        />
      );
    case 'busy':
      return (
        <StateBlock
          icon="warning-circle"
          error
          title={COPY.verify.busyTitle}
          body={busyBody(problem.retryAfter)}
          action={retry}
        />
      );
    default:
      return (
        <StateBlock
          icon="warning-circle"
          error
          title={COPY.verify.errorTitle}
          body={COPY.verify.errorBody}
          action={retry}
        />
      );
  }
}

// ----------------------------------------------------------------- one record

export function VerifyPanel({
  item,
  user,
  scope,
  doneAt,
  onVerified,
  onGone,
  onOutdated,
  onBack,
}: {
  item: VerifyQueueItem;
  user: User;
  scope: string | null;
  doneAt: string | null;
  onVerified: () => void;
  onGone: (item: VerifyQueueItem) => void;
  onOutdated: (item: VerifyQueueItem) => void;
  onBack: () => void;
}) {
  const [source, setSource] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [problem, setProblem] = useState<VerifyProblem | null>(null);
  const [busy, setBusy] = useState<'verified' | 'outdated' | null>(null);
  // State updates are not instant, so a quick double tap needs this guard as well.
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  // Focus moves to the "Verified!" heading when the form turns into the success card.
  useEffect(() => {
    heading.current?.focus();
  }, [doneAt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    setProblem(null);

    // A missing source never reaches the server; neither does a send while offline.
    if (checkSource(source).ok) {
      inFlight.current = true;
      setBusy('verified');
    }
    setFieldError(null);
    const outcome = await verifyItem(
      item,
      source,
      () => navigator.onLine,
      (body) => request<void>('POST', '/admin/verify', { body, auth: true }),
    );
    inFlight.current = false;
    setBusy(null);

    if (outcome.kind === 'invalid') {
      setFieldError(outcome.error);
    } else if (outcome.kind === 'verified') {
      // The card leaves the list and the counts go down now. The server has it as Verified.
      onVerified();
    } else if (outcome.problem.gone) {
      onGone(item);
    } else {
      // A 401 has already signed the user out and sent them to the login page.
      setProblem(outcome.problem);
    }
  }

  async function markOutdatedNow() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy('outdated');
    setProblem(null);
    const outcome = await markOutdated(
      item,
      () => navigator.onLine,
      (body) => request<void>('POST', '/admin/verify', { body, auth: true }),
    );
    inFlight.current = false;
    setBusy(null);
    if (outcome.kind === 'outdated') onOutdated(item);
    else if (outcome.problem.gone) onGone(item);
    else setProblem(outcome.problem);
  }

  if (doneAt) {
    return (
      <div className="verify-done">
        <StateBlock
          win
          icon="shield-check-fill"
          title={COPY.verify.verifiedTitle}
          body={COPY.verify.verifiedBody}
          titleId="v-done"
          titleRef={heading}
        />
        <article className="a-card a-row">
          <span className="a-row__icon">
            <AdminIcon name={KIND_ICONS[item.entity_type]} size={28} />
          </span>
          <div className="a-row__body">
            <b className="a-row__name">{item.name}</b>
            <small>{fill(COPY.verify.source, { source: source.trim() })}</small>
            <small>
              {verifiedByLine(user.full_name)},{' '}
              <time dateTime={doneAt}>{formatDate(doneAt)}</time>
            </small>
          </div>
        </article>
        <button type="button" className="a-btn a-btn--gold a-btn--block" onClick={onBack}>
          <AdminIcon name="arrow-left" size={18} />
          <span>{COPY.verify.back}</span>
        </button>
      </div>
    );
  }

  const updated = updatedLine(item);
  const describedBy = fieldError ? 'v-source-hint v-source-error' : 'v-source-hint';

  return (
    <div className="verify-detail">
      <article className="a-card a-row">
        <span className="a-row__icon">
          <AdminIcon name={KIND_ICONS[item.entity_type]} size={28} />
        </span>
        <div className="a-row__body">
          <b className="a-row__name">{item.name}</b>
          {sourceLine(item) && <small>{sourceLine(item)}</small>}
          <small>
            <time dateTime={item.created_at}>{addedLine(item)}</time>
          </small>
          {updated && (
            <small>
              <time dateTime={item.updated_at}>{updated}</time>
            </small>
          )}
        </div>
      </article>

      <form className="a-form" onSubmit={submit} noValidate>
        <div className={fieldError ? 'field is-error' : 'field'}>
          <div className="field__box field__box--plain">
            <span className="field__main">
              <label htmlFor="v-source">{COPY.verify.sourceChecked}</label>
              <input
                id="v-source"
                name="source"
                type="text"
                autoComplete="off"
                maxLength={SOURCE_MAX}
                placeholder={COPY.verify.sourcePlaceholder}
                value={source}
                onChange={(event) => {
                  setSource(event.target.value);
                  // The red line goes as soon as the admin starts fixing it.
                  setFieldError(null);
                }}
                aria-invalid={fieldError !== null}
                aria-describedby={describedBy}
              />
            </span>
          </div>
          <p className="field__hint" id="v-source-hint">
            {COPY.verify.sourceHint}
          </p>
          {fieldError && (
            <p className="field__err" id="v-source-error">
              <AdminIcon name="warning-circle" size={16} />
              <span>{fieldError}</span>
            </p>
          )}
        </div>

        {scope && <p className="hint">{fill(COPY.verify.onlyYours, { scope })}</p>}

        {problem && (
          <div role="alert" className="a-error a-error--block">
            <p>{problem.message}</p>
            {problem.serverMessage && <p className="a-hint">{serverSaysLine(problem.serverMessage)}</p>}
          </div>
        )}

        <div className="verify-actions">
          <button type="submit" className="a-btn a-btn--gold a-btn--block" disabled={busy !== null}>
            <AdminIcon name="shield-check" size={20} />
            <span>{busy === 'verified' ? COPY.verify.sending : COPY.verify.markVerified}</span>
          </button>
          <button
            type="button"
            className="a-btn a-btn--outline a-btn--block"
            disabled={busy !== null}
            onClick={markOutdatedNow}
          >
            <AdminIcon name="warning" size={20} />
            <span>{COPY.verify.markOutdated}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
