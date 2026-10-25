import { useEffect, useMemo, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { apiDelete, apiGet, apiPatch } from '../api/client';
import type { Announcement, AnnouncementUpdate, User } from '../api/types';
import { formatPublished, namesById, scopeLabel } from '../lib/announcementsView';
import { friendlyError, type FieldErrors } from '../lib/authView';
import { BODY_MAX, charCount, TITLE_MAX } from '../lib/composerView';
import {
  ALREADY_REMOVED,
  applyOverlay,
  attemptChange,
  buildChanges,
  CONFIRM_DELETE,
  editValuesOf,
  formatExpiry,
  manageableAnnouncements,
  NO_CHANGES,
  validateEdit,
  withRemoved,
  withUpsert,
  type EditField,
  type EditValues,
  type Overlay,
} from '../lib/manageView';
import { readComposerChoices } from '../lib/offline';
import { useCachedRows } from '../lib/useCachedRows';

interface Props {
  user: User;
  /** Changes made on this device, laid over the server list (see manageView). */
  overlay: Overlay;
  onOverlay: Dispatch<SetStateAction<Overlay>>;
  /** Changes when the list should be read again, for example after a publish. */
  refreshKey: number;
}

type Active = { id: string; kind: 'edit' | 'delete' } | null;

// The announcements this admin may edit or delete. The list is the public one, so no token is
// sent to read it. The server checks the role and scope again on every change.
export default function ManageAnnouncements({ user, overlay, onOverlay, refreshKey }: Props) {
  const choices = useCachedRows(readComposerChoices);
  const cached = choices.result.state === 'ready' ? choices.result.value : null;

  const [rows, setRows] = useState<Announcement[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const [active, setActive] = useState<Active>(null);
  const [busy, setBusy] = useState(false);
  const [itemError, setItemError] = useState<{ id: string; text: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // State updates are not instant, so a quick double click needs this guard as well.
  const inFlight = useRef(false);

  useEffect(() => {
    if (!navigator.onLine) {
      setLoadError(friendlyError(new Error('offline'), false));
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    apiGet<Announcement[]>('/announcements', { limit: 50 }, controller.signal).then(
      (list) => {
        setRows(list);
        setLoading(false);
      },
      (error) => {
        if (controller.signal.aborted) return;
        setLoadError(friendlyError(error, navigator.onLine));
        setLoading(false);
      },
    );
    return () => controller.abort();
  }, [refreshKey, attempt]);

  const view = useMemo(
    () => ({
      items: manageableAnnouncements(user, applyOverlay(rows ?? [], overlay), cached?.departments ?? [], Date.now()),
      facultyNames: namesById(cached?.faculties ?? []),
      departmentNames: namesById(cached?.departments ?? []),
    }),
    [user, rows, overlay, cached],
  );

  // One request at a time. A failed PATCH or DELETE is never repeated by itself (attemptChange).
  async function run<T>(item: Announcement, send: () => Promise<T>, done: (value: T) => void) {
    if (inFlight.current) return;
    setNotice(null);
    setItemError(null);
    inFlight.current = true;
    setBusy(true);
    try {
      const outcome = await attemptChange(send, () => navigator.onLine);
      if (outcome.kind === 'ok') {
        done(outcome.value);
      } else if (outcome.kind === 'gone') {
        onOverlay((o) => withRemoved(o, item.id));
        setActive(null);
        setNotice(ALREADY_REMOVED);
      } else {
        setItemError({ id: item.id, text: outcome.message });
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function save(item: Announcement, changes: AnnouncementUpdate) {
    return run(
      item,
      () => apiPatch<Announcement>(`/announcements/${item.id}`, changes, { auth: true }),
      (updated) => {
        onOverlay((o) => withUpsert(o, updated));
        setActive(null);
        setNotice(`Saved “${updated.title}”.`);
      },
    );
  }

  function remove(item: Announcement) {
    return run(
      item,
      () => apiDelete(`/announcements/${item.id}`, { auth: true }),
      () => {
        onOverlay((o) => withRemoved(o, item.id));
        setActive(null);
        setNotice(`Deleted “${item.title}”.`);
      },
    );
  }

  function open(id: string, kind: 'edit' | 'delete') {
    if (busy) return;
    setNotice(null);
    setItemError(null);
    setActive({ id, kind });
  }

  return (
    <section aria-labelledby="manage-heading">
      <h2 id="manage-heading">Your announcements</h2>
      <p className="muted">Announcements you can edit or delete. Changes show to students straight away.</p>

      {notice && <p role="status">{notice}</p>}

      {loading && rows === null && (
        <p role="status" className="muted">
          Loading your announcements…
        </p>
      )}

      {loadError && (
        <div role="alert">
          <p>{loadError}</p>
          <button type="button" onClick={() => setAttempt((n) => n + 1)} disabled={loading}>
            Try again
          </button>
        </div>
      )}

      {!loadError && !loading && view.items.length === 0 && (
        <p className="muted" role="status">
          You have no announcements to manage right now.
        </p>
      )}

      {view.items.length > 0 && (
        <ul className="items">
          {view.items.map((item) => {
            const mode = active?.id === item.id ? active.kind : null;
            const error = itemError?.id === item.id ? itemError.text : null;
            return (
              <li key={item.id}>
                <h3 className="announcement-title">{item.title}</h3>
                <p className="muted">
                  {scopeLabel(item, view.facultyNames, view.departmentNames)} ·{' '}
                  {formatPublished(item.published_at)} · {formatExpiry(item.expires_at)}
                </p>

                {mode === 'edit' ? (
                  <EditForm
                    key={item.id}
                    item={item}
                    busy={busy}
                    error={error}
                    onSave={(changes) => save(item, changes)}
                    onCancel={() => {
                      setActive(null);
                      setItemError(null);
                    }}
                  />
                ) : (
                  <>
                    <ItemActions
                      mode={mode}
                      busy={busy}
                      onEdit={() => open(item.id, 'edit')}
                      onAskDelete={() => open(item.id, 'delete')}
                      onConfirmDelete={() => remove(item)}
                      onCancel={() => setActive(null)}
                    />
                    {error && (
                      <p role="alert" className="field-error">
                        {error}
                      </p>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Edit and Delete. Delete only asks first: the request is sent by the confirm button. */
export function ItemActions({
  mode,
  busy,
  onEdit,
  onAskDelete,
  onConfirmDelete,
  onCancel,
}: {
  mode: 'delete' | null;
  busy: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onConfirmDelete: () => void;
  onCancel: () => void;
}) {
  if (mode === 'delete') {
    return (
      <div role="group" aria-label="Confirm delete" className="confirm">
        <p>{CONFIRM_DELETE}</p>
        <div className="item-actions">
          <button type="button" disabled={busy} onClick={onConfirmDelete}>
            {busy ? 'Deleting…' : 'Yes, delete'}
          </button>
          <button type="button" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="item-actions">
      <button type="button" disabled={busy} onClick={onEdit}>
        Edit
      </button>
      <button type="button" disabled={busy} onClick={onAskDelete}>
        Delete
      </button>
    </div>
  );
}

export function EditForm({
  item,
  busy,
  error,
  onSave,
  onCancel,
}: {
  item: Announcement;
  busy: boolean;
  error: string | null;
  onSave: (changes: AnnouncementUpdate) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<EditValues>(() => editValuesOf(item));
  const [errors, setErrors] = useState<FieldErrors<EditField>>({});
  const [message, setMessage] = useState<string | null>(null);
  const id = item.id;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setMessage(null);
    const problems = validateEdit(item, values, Date.now());
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;
    const changes = buildChanges(item, values);
    // Nothing changed: send nothing.
    if (!changes) {
      setMessage(NO_CHANGES);
      return;
    }
    onSave(changes);
  }

  return (
    <form onSubmit={submit} noValidate className="form">
      <div className="field">
        <label htmlFor={`edit-title-${id}`}>Title</label>
        <input
          id={`edit-title-${id}`}
          autoComplete="off"
          value={values.title}
          onChange={(e) => setValues({ ...values, title: e.target.value })}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={`edit-title-count-${id}${errors.title ? ` edit-title-error-${id}` : ''}`}
        />
        <p className="hint" id={`edit-title-count-${id}`}>
          {charCount(values.title)} / {TITLE_MAX} characters
        </p>
        {errors.title && (
          <p id={`edit-title-error-${id}`} className="field-error">
            {errors.title}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor={`edit-body-${id}`}>Announcement</label>
        <textarea
          id={`edit-body-${id}`}
          rows={6}
          value={values.body}
          onChange={(e) => setValues({ ...values, body: e.target.value })}
          aria-invalid={Boolean(errors.body)}
          aria-describedby={`edit-body-count-${id}${errors.body ? ` edit-body-error-${id}` : ''}`}
        />
        <p className="hint" id={`edit-body-count-${id}`}>
          {charCount(values.body)} / {BODY_MAX} characters
        </p>
        {errors.body && (
          <p id={`edit-body-error-${id}`} className="field-error">
            {errors.body}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor={`edit-expires-${id}`}>Expires (optional)</label>
        <p className="hint" id={`edit-expires-hint-${id}`}>
          Your device’s time. Leave empty for no expiry.
        </p>
        <input
          id={`edit-expires-${id}`}
          type="datetime-local"
          value={values.expires}
          onChange={(e) => setValues({ ...values, expires: e.target.value })}
          aria-invalid={Boolean(errors.expires)}
          aria-describedby={`edit-expires-hint-${id}${errors.expires ? ` edit-expires-error-${id}` : ''}`}
        />
        {values.expires && (
          <button type="button" onClick={() => setValues({ ...values, expires: '' })} disabled={busy}>
            Remove expiry
          </button>
        )}
        {errors.expires && (
          <p id={`edit-expires-error-${id}`} className="field-error">
            {errors.expires}
          </p>
        )}
      </div>

      {message && <p role="status">{message}</p>}
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}

      <div className="item-actions">
        <button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button type="button" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
