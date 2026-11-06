// Publish notice: the composer an admin uses to post. It is the same Sabi shell as the rest of
// the admin screens: the bar with a way back, the handwritten line, the form, the footer and the
// tab bar (screenshots publish-390, publish-768, publish-invalid-390, publish-published-390).
//
// The form always says what the role may do. Segments it cannot use stay visible with a lock, and
// the source line names the real scope instead of a source the server never stores.
import { useRef, useState, type FormEvent } from 'react';
import { ApiError, apiPost } from '../api/client';
import type { Announcement, AnnouncementScope, User } from '../api/types';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import Icon from '../components/Icon';
import AdminGate from '../components/admin/AdminGate';
import AdminIcon from '../components/admin/AdminIcon';
import type { IconName } from '../components/admin/iconPaths';
import { formatDay } from '../lib/academicsView';
import { COPY, fill } from '../lib/adminCopy';
import type { FieldErrors } from '../lib/authView';
import {
  BODY_MAX,
  buildAnnouncement,
  charCount,
  publishError,
  scopesForRole,
  sendToHint,
  sendToOptions,
  sourceName,
  targetPicker,
  TITLE_MAX,
  validateAnnouncement,
  type ComposerField,
  type ComposerValues,
} from '../lib/composerView';
import { readComposerChoices } from '../lib/offline';
import { useCachedRows } from '../lib/useCachedRows';

export default function AdminPublish() {
  return (
    <>
      <AppHeader
        variant="bar"
        back={{ to: '/admin', label: COPY.admin.backShort }}
        title={COPY.publish.title}
      />

      <div className="page page--publish">
        <p className="hand">{COPY.publish.kicker}</p>
        <AdminGate>{(user) => <Composer user={user} />}</AdminGate>
      </div>

      <Footer className="foot--tabs" />
    </>
  );
}

/** The message under the form. The icon matches what went wrong, as the design draws it. */
function problemFor(error: unknown, online: boolean): { text: string; icon: IconName } {
  const text = publishError(error, online);
  if (!online) return { text, icon: 'wifi-slash' };
  if (error instanceof ApiError && error.status === 401) return { text, icon: 'lock' };
  return { text, icon: 'warning-circle' };
}

function Composer({ user }: { user: User }) {
  const scopes = scopesForRole(user.role);
  const segments = sendToOptions(user.role);
  const lockedHint = sendToHint(user.role);
  const choices = useCachedRows(readComposerChoices);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [scope, setScope] = useState<AnnouncementScope>(scopes[0]);
  const [chosenId, setChosenId] = useState('');
  const [expires, setExpires] = useState('');
  const [errors, setErrors] = useState<FieldErrors<ComposerField>>({});
  const [formError, setFormError] = useState<{ text: string; icon: IconName } | null>(null);
  const [published, setPublished] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // State updates are not instant, so a quick double click needs this guard as well.
  const inFlight = useRef(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const cached = choices.result.state === 'ready' ? choices.result.value : null;
  const faculties = cached?.faculties ?? [];
  const departments = cached?.departments ?? [];
  const picker = targetPicker(user, scope, faculties, departments);
  // A locked picker always shows the user's own faculty or department.
  const targetId = picker?.locked ? picker.selectedId : chosenId;
  const source = sourceName(scope, targetId, faculties, departments);
  const today = formatDay(new Date().toISOString()) ?? '';

  // Editing a field dismisses the success card, so the button comes back for the new text.
  function edited() {
    if (published) setPublished(null);
  }

  // The red line under a field goes as soon as the student starts fixing that field.
  function clearProblem(field: ComposerField) {
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  function changeScope(next: AnnouncementScope) {
    if (!segments.find((segment) => segment.scope === next)?.enabled) return;
    edited();
    setScope(next);
    setChosenId('');
    setErrors((current) => ({ ...current, scope: undefined, target: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Enter in a field must not send the same notice twice after the success card shows.
    if (inFlight.current || published) return;
    setFormError(null);

    const values: ComposerValues = { title, body, scope, targetId, expires };
    const problems = validateAnnouncement(values, user.role, Date.now());
    if (picker?.problem && !problems.target) problems.target = picker.problem;
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    if (!navigator.onLine) {
      setFormError(problemFor(new Error('offline'), false));
      return;
    }

    inFlight.current = true;
    setSending(true);
    try {
      const sent = buildAnnouncement(values);
      const created = await apiPost<Announcement>('/announcements', sent, { auth: true });
      setPublished(created.title);
      setErrors({});
    } catch (error) {
      // A 401 has already signed the user out and sent them to the login page.
      setFormError(problemFor(error, navigator.onLine));
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  // "Publish another" clears the form and puts the cursor back where the next notice starts.
  function publishAnother() {
    setTitle('');
    setBody('');
    setScope(scopes[0]);
    setChosenId('');
    setExpires('');
    setErrors({});
    setFormError(null);
    setPublished(null);
    requestAnimationFrame(() => titleRef.current?.focus());
  }

  const titleCount = charCount(title);
  const bodyCount = charCount(body);
  const targetProblem = picker?.problem ?? errors.target;
  const pickerHelp =
    picker && !picker.locked && choices.result.state === 'error'
      ? COPY.publish.listError
      : picker && !picker.locked && cached && picker.options.length === 0
        ? COPY.publish.listEmpty
        : null;

  return (
    <>
      <p className="lead-text">{COPY.publish.lead}</p>

      <form className="form" onSubmit={submit} noValidate>
        <div className={errors.title ? 'field is-error' : 'field'}>
          <div className="field__box field__box--plain">
            <span className="field__main">
              <label htmlFor="pub-title">
                {COPY.publish.fieldTitle} <em className="req" aria-hidden="true">*</em>
              </label>
              <input
                id="pub-title"
                ref={titleRef}
                name="title"
                autoComplete="off"
                maxLength={TITLE_MAX}
                required
                value={title}
                onChange={(event) => {
                  edited();
                  clearProblem('title');
                  setTitle(event.target.value);
                }}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={
                  errors.title ? 'pub-title-count pub-title-err' : 'pub-title-count'
                }
              />
            </span>
            <span className="count num" id="pub-title-count">
              {fill(COPY.publish.fieldTitleHint, { n: titleCount, max: TITLE_MAX })}
            </span>
          </div>
          {errors.title && (
            <p className="field__err" id="pub-title-err">
              <AdminIcon name="warning-circle" size={16} />
              <span>{errors.title}</span>
            </p>
          )}
        </div>

        <div className={errors.body ? 'field is-error' : 'field'}>
          <div className="field__box field__box--plain">
            <span className="field__main">
              <label htmlFor="pub-body">
                {COPY.publish.fieldMessage} <em className="req" aria-hidden="true">*</em>
              </label>
              <textarea
                id="pub-body"
                name="body"
                rows={5}
                maxLength={BODY_MAX}
                required
                value={body}
                onChange={(event) => {
                  edited();
                  clearProblem('body');
                  setBody(event.target.value);
                }}
                aria-invalid={Boolean(errors.body)}
                aria-describedby={[
                  'pub-body-count',
                  'pub-body-hint',
                  errors.body ? 'pub-body-err' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            </span>
            <span className="count num" id="pub-body-count">
              {fill(COPY.publish.fieldMessageHint, { n: bodyCount, max: BODY_MAX })}
            </span>
          </div>
          <p className="field__hint" id="pub-body-hint">
            {COPY.publish.plainText}
          </p>
          {errors.body && (
            <p className="field__err" id="pub-body-err">
              <AdminIcon name="warning-circle" size={16} />
              <span>{errors.body}</span>
            </p>
          )}
        </div>

        <div className={errors.scope || targetProblem ? 'field is-error' : 'field'}>
          <span className="label" id="pub-sendto">
            {COPY.publish.fieldSendTo} <em className="req" aria-hidden="true">*</em>
            <span className="a-sr"> {COPY.publish.required}</span>
          </span>
          <div className="seg" role="group" aria-labelledby="pub-sendto">
            {segments.map((segment) => (
              <button
                key={segment.scope}
                type="button"
                aria-pressed={scope === segment.scope}
                aria-disabled={!segment.enabled}
                className={segment.enabled ? undefined : 'is-locked'}
                onClick={() => changeScope(segment.scope)}
              >
                {!segment.enabled && <AdminIcon name="lock" size={16} />}
                {segment.label}
              </button>
            ))}
          </div>
          {lockedHint && <p className="field__hint">{lockedHint}</p>}
          {errors.scope && (
            <p className="field__err">
              <AdminIcon name="warning-circle" size={16} />
              <span>{errors.scope}</span>
            </p>
          )}
          {targetProblem && (
            <p className="field__err" id="pub-target-err">
              <AdminIcon name="warning-circle" size={16} />
              <span>{targetProblem}</span>
            </p>
          )}
        </div>

        {picker && !picker.locked && (
          <div className="field">
            <div className="field__box field__box--plain">
              <span className="field__main">
                <label htmlFor="pub-target">{picker.label}</label>
                <select
                  id="pub-target"
                  value={targetId}
                  disabled={choices.result.state === 'loading'}
                  onChange={(event) => {
                    edited();
                    clearProblem('target');
                    setChosenId(event.target.value);
                  }}
                  aria-invalid={Boolean(errors.target)}
                  aria-describedby={
                    errors.target ? 'pub-target-err' : pickerHelp ? 'pub-target-help' : undefined
                  }
                >
                  <option value="">
                    {choices.result.state === 'loading'
                      ? COPY.publish.pickerLoading
                      : fill(COPY.publish.pickerChoose, { kind: picker.label.toLowerCase() })}
                  </option>
                  {picker.options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </span>
              <span className="field__caret" aria-hidden="true">
                <Icon name="caretDown" size={20} />
              </span>
            </div>
            {pickerHelp && (
              <p className="field__hint" id="pub-target-help">
                {pickerHelp}
              </p>
            )}
          </div>
        )}

        <div className="field">
          <div className="field__box field__box--plain">
            <span className="field__main">
              <span className="label" id="pub-source-label">
                {COPY.publish.fieldSource}
              </span>
              <span className="field__value" aria-labelledby="pub-source-label">
                {source}
              </span>
            </span>
          </div>
          <p className="field__hint">
            {fill(COPY.publish.fieldSourceHint, { source })}
          </p>
        </div>

        <div className={errors.expires ? 'field is-error' : 'field'}>
          <div className="field__box field__box--plain">
            <span className="field__main">
              <label htmlFor="pub-expires">{COPY.publish.fieldExpires}</label>
              <input
                id="pub-expires"
                name="expires"
                type="datetime-local"
                value={expires}
                onChange={(event) => {
                  edited();
                  clearProblem('expires');
                  setExpires(event.target.value);
                }}
                aria-invalid={Boolean(errors.expires)}
                aria-describedby={
                  errors.expires ? 'pub-expires-hint pub-expires-err' : 'pub-expires-hint'
                }
              />
            </span>
          </div>
          <p className="field__hint" id="pub-expires-hint">
            {COPY.publish.fieldExpiresHint}
          </p>
          {errors.expires && (
            <p className="field__err" id="pub-expires-err">
              <AdminIcon name="warning-circle" size={16} />
              <span>{errors.expires}</span>
            </p>
          )}
        </div>

        <section className="card preview" aria-labelledby="pub-preview">
          <h2 id="pub-preview">{COPY.publish.preview}</h2>
          <div className="preview__row">
            <span className="preview__ic" aria-hidden="true">
              <AdminIcon name="megaphone" size={28} />
            </span>
            <div>
              <b>{title.trim() || '…'}</b>
              <p className="clamp3">{body.trim() || '…'}</p>
              <small>
                {fill(COPY.publish.previewTo, { audience: COPY.publish.sendTo[scope] })}
                {today ? `, ${today}` : ''}
              </small>
            </div>
          </div>
        </section>

        {formError && (
          <div className="alert alert--error" role="alert">
            <AdminIcon name={formError.icon} size={22} />
            <p>{formError.text}</p>
          </div>
        )}

        {published ? (
          <>
            <div className="card card--success note-row" role="status">
              <AdminIcon name="check-circle-fill" size={40} />
              <div>
                <b>{COPY.publish.published}</b>
                <p>{COPY.publish.publishedBody}</p>
              </div>
            </div>
            <div className="btn-row">
              <button type="button" className="btn btn--ghost" onClick={publishAnother}>
                {COPY.publish.publishedAgain}
              </button>
            </div>
          </>
        ) : (
          <div className="btn-row">
            <button type="submit" className="btn btn--gold btn--block btn--lg" disabled={sending}>
              {sending ? (
                COPY.publish.publishing
              ) : (
                <>
                  <AdminIcon name="paper-plane-tilt" size={20} />
                  {COPY.publish.publish}
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </>
  );
}
