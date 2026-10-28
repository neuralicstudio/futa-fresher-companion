// Verify Data: the queue of records waiting for a check. The only place a record becomes Verified.
// The server decides who may verify what and records who did it; this screen shows the queue the
// server sent and posts the check. See docs/DECISIONS.md decisions 9 and 10.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../api/client';
import type { User, VerifyQueueItem } from '../api/types';
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
  itemKey,
  placeLine,
  queueTabs,
  serverSaysLine,
  sourceCount,
  sourceLine,
  SOURCE_MAX,
  updatedLine,
  verifiedByLine,
  verifyItem,
  waitingLabel,
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

export default function AdminVerify() {
  return <AdminGate>{(user) => <VerifyScreen user={user} />}</AdminGate>;
}

function VerifyScreen({ user }: { user: User }) {
  const queue = useVerifyQueue();
  const choices = useCachedRows(readComposerChoices);
  const cached = choices.result.state === 'ready' ? choices.result.value : null;
  const scope = scopeName(user, cached?.faculties ?? [], cached?.departments ?? []);
  // Super admins may verify everything, so the "only yours" line is for the scoped roles.
  const showScope = user.role !== 'super_admin' ? scope : null;

  const [selected, setSelected] = useState<VerifyQueueItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function open(item: VerifyQueueItem) {
    setNotice(null);
    setSelected(item);
  }

  return (
    <>
      <header className="a-head">
        <Link className="a-back" to="/admin">
          <AdminIcon name="arrow-left" size={18} />
          <span>{COPY.admin.back}</span>
        </Link>
        <p className="a-kicker">{COPY.verify.kicker}</p>
        <h1>{COPY.verify.title}</h1>
        <p className="a-lead">{COPY.verify.lead}</p>
      </header>

      {selected ? (
        <VerifyPanel
          key={itemKey(selected)}
          item={selected}
          user={user}
          scope={showScope}
          onVerified={queue.removed}
          onGone={(item) => {
            queue.removed(item);
            setSelected(null);
            setNotice(COPY.verify.gone);
          }}
          onBack={() => setSelected(null)}
        />
      ) : (
        <>
          {notice && (
            <p role="status" className="a-notice">
              {notice}
            </p>
          )}
          <QueueList queue={queue} onOpen={open} scope={showScope} />
        </>
      )}
    </>
  );
}

// ----------------------------------------------------------------- the list

function QueueList({
  queue,
  onOpen,
  scope,
}: {
  queue: ReturnType<typeof useVerifyQueue>;
  onOpen: (item: VerifyQueueItem) => void;
  scope: string | null;
}) {
  const { state } = queue;
  const tabs = queueTabs(state.counts, state.total, state.kind);

  return (
    <>
      {tabs.length > 0 && (
        <div className="a-filters" role="group" aria-label={COPY.verify.filtersLabel}>
          {tabs.map((tab) => (
            <button
              key={tab.kind}
              type="button"
              className="a-filter"
              aria-pressed={tab.kind === state.kind}
              onClick={() => queue.select(tab.kind)}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      )}

      {state.phase === 'problem' && state.problem ? (
        <ProblemBlock problem={state.problem} onRetry={queue.retry} />
      ) : state.phase === 'loading' || (state.items.length === 0 && state.nextCursor) ? (
        <Skeleton />
      ) : state.items.length === 0 ? (
        <StateBlock icon="sparkle" {...emptyMessage(state.kind)} />
      ) : (
        <>
          <p className="a-count" role="status">
            {waitingLabel(state.total ?? state.items.length)}
          </p>
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
          {scope && <p className="a-hint">{fill(COPY.verify.onlyYours, { scope })}</p>}
        </>
      )}
    </>
  );
}

function QueueCard({
  item,
  onOpen,
}: {
  item: VerifyQueueItem;
  onOpen: (item: VerifyQueueItem) => void;
}) {
  return (
    <article className="a-card a-row">
      <span className="a-row__icon">
        <AdminIcon name={KIND_ICONS[item.entity_type]} size={28} />
      </span>
      <div className="a-row__body">
        <p className="a-tags">
          <span className="a-tag">{COPY.kinds[item.entity_type].one}</span>
          <span className="a-tag a-tag--dashed">{COPY.verify.notVerified}</span>
        </p>
        <b className="a-row__name">{item.name}</b>
        <RecordFacts item={item} />
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

/** Where it sits, its source if it has one, and when it was added or last changed. */
function RecordFacts({ item }: { item: VerifyQueueItem }) {
  const place = placeLine(item);
  const source = sourceLine(item);
  const updated = updatedLine(item);
  return (
    <>
      {place && <small>{place}</small>}
      {source && <small>{source}</small>}
      <small>
        <time dateTime={item.created_at}>{addedLine(item)}</time>
      </small>
      {updated && (
        <small>
          <time dateTime={item.updated_at}>{updated}</time>
        </small>
      )}
    </>
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

function VerifyPanel({
  item,
  user,
  scope,
  onVerified,
  onGone,
  onBack,
}: {
  item: VerifyQueueItem;
  user: User;
  scope: string | null;
  onVerified: (item: VerifyQueueItem) => void;
  onGone: (item: VerifyQueueItem) => void;
  onBack: () => void;
}) {
  const [source, setSource] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [problem, setProblem] = useState<VerifyProblem | null>(null);
  const [sending, setSending] = useState(false);
  const [doneAt, setDoneAt] = useState<string | null>(null);
  // State updates are not instant, so a quick double tap needs this guard as well.
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  // Focus moves to the panel's heading when it opens and when it turns into "Verified!".
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
      setSending(true);
    }
    setFieldError(null);
    const outcome = await verifyItem(
      item,
      source,
      () => navigator.onLine,
      (body) => request<void>('POST', '/admin/verify', { body, auth: true }),
    );
    inFlight.current = false;
    setSending(false);

    if (outcome.kind === 'invalid') {
      setFieldError(outcome.error);
    } else if (outcome.kind === 'verified') {
      // The card leaves the list and the counts go down now. The server has it as Verified.
      onVerified(item);
      setDoneAt(new Date().toISOString());
    } else if (outcome.problem.gone) {
      onGone(item);
    } else {
      // A 401 has already signed the user out and sent them to the login page.
      setProblem(outcome.problem);
    }
  }

  if (doneAt) {
    return (
      <section aria-labelledby="v-done">
        <div className="a-state a-state--win" role="status">
          <span className="a-state__icon">
            <AdminIcon name="shield-check-fill" size={28} />
          </span>
          <h2 className="a-state__title" id="v-done" tabIndex={-1} ref={heading}>
            {COPY.verify.verifiedTitle}
          </h2>
          <p className="a-state__body">{COPY.verify.verifiedBody}</p>
        </div>
        <article className="a-card a-row">
          <span className="a-row__icon">
            <AdminIcon name="shield-check" size={28} />
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
      </section>
    );
  }

  const describedBy = ['v-source-hint', 'v-source-count', fieldError ? 'v-source-error' : null]
    .filter(Boolean)
    .join(' ');

  return (
    <section aria-labelledby="v-title">
      <button type="button" className="a-back a-back--button" onClick={onBack}>
        <AdminIcon name="arrow-left" size={18} />
        <span>{COPY.verify.back}</span>
      </button>
      <h2 className="a-section" id="v-title" tabIndex={-1} ref={heading}>
        {COPY.verify.detailTitle}
      </h2>

      <article className="a-card a-row">
        <span className="a-row__icon">
          <AdminIcon name={KIND_ICONS[item.entity_type]} size={28} />
        </span>
        <div className="a-row__body">
          <p className="a-tags">
            <span className="a-tag">{COPY.kinds[item.entity_type].one}</span>
            <span className="a-tag a-tag--dashed">{COPY.verify.notVerified}</span>
          </p>
          <b className="a-row__name">{item.name}</b>
          <RecordFacts item={item} />
        </div>
      </article>

      <form className="a-form" onSubmit={submit} noValidate>
        <div className="a-field">
          <label htmlFor="v-source">{COPY.verify.sourceChecked}</label>
          <input
            id="v-source"
            name="source"
            type="text"
            autoComplete="off"
            maxLength={SOURCE_MAX}
            placeholder={COPY.verify.sourcePlaceholder}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            aria-invalid={fieldError !== null}
            aria-describedby={describedBy}
          />
          <p className="a-hint" id="v-source-hint">
            {COPY.verify.sourceHint}
          </p>
          <p className="a-hint" id="v-source-count">
            {sourceCount(source)}
          </p>
          {fieldError && (
            <p className="a-error" id="v-source-error">
              <AdminIcon name="warning-circle" size={16} />
              <span>{fieldError}</span>
            </p>
          )}
        </div>

        {scope && <p className="a-hint">{fill(COPY.verify.onlyYours, { scope })}</p>}

        {problem && (
          <div role="alert" className="a-error a-error--block">
            <p>{problem.message}</p>
            {problem.serverMessage && <p className="a-hint">{serverSaysLine(problem.serverMessage)}</p>}
          </div>
        )}

        <button type="submit" className="a-btn a-btn--gold a-btn--block" disabled={sending}>
          <AdminIcon name="shield-check" size={20} />
          <span>{sending ? COPY.verify.sending : COPY.verify.markVerified}</span>
        </button>
      </form>
    </section>
  );
}
