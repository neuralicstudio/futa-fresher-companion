// Create an account. Optional: only admin features need one.
//
// The screen follows docs/design/SCREENS.md (9) and the `register` screenshots: a hero with a
// drawn student, then the form on the page itself (no card), with a strength meter, the optional
// school / department / level picks and the consent box.
import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, apiPost } from '../api/client';
import AppHeader from '../components/AppHeader';
import Field from '../components/Field';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Icon from '../components/Icon';
import StrengthMeter from '../components/StrengthMeter';
import { COPY } from '../copy/pidgin';
import { LEVEL_OPTIONS, passwordStrength, validateRegister } from '../lib/authView';
import { readDepartmentChoices } from '../lib/offline';
import { useCachedRows } from '../lib/useCachedRows';

type FieldName = 'fullName' | 'email' | 'password' | 'consent';
type Problems = Partial<Record<FieldName, string>>;

/** What went wrong when the server said no, in the design's terms. */
type Failure = 'taken' | 'busy' | 'offline' | 'invalid' | 'retry';

const ALERTS: Record<Exclude<Failure, 'taken'>, { icon: 'warningCircle' | 'wifiSlash'; text: string }> = {
  busy: { icon: 'warningCircle', text: COPY.register.errBusy },
  offline: { icon: 'wifiSlash', text: COPY.register.errOffline },
  invalid: { icon: 'warningCircle', text: COPY.register.errInvalid },
  retry: { icon: 'warningCircle', text: COPY.register.errRetry },
};

function failureOf(error: unknown): Failure {
  if (!navigator.onLine) return 'offline';
  if (error instanceof ApiError) {
    if (error.status === 409) return 'taken';
    if (error.status === 429 || error.status === 503) return 'busy';
    if (error.status === 422) return 'invalid';
  }
  return 'retry';
}

export default function Register() {
  const navigate = useNavigate();
  const departments = useCachedRows(readDepartmentChoices);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [school, setSchool] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [level, setLevel] = useState('');
  const [consent, setConsent] = useState(false);
  const [problems, setProblems] = useState<Problems>({});
  const [failure, setFailure] = useState<Failure | null>(null);
  const [takenDismissed, setTakenDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  const choices = departments.result.state === 'ready' ? departments.result.value : [];
  // "School" is the faculty name the department list carries. No new API call, no contract change.
  const schools = useMemo(
    () => [...new Set(choices.map((choice) => choice.school).filter(Boolean))].sort(),
    [choices],
  );
  const departmentsForSchool = useMemo(
    () => choices.filter((choice) => choice.school === school),
    [choices, school],
  );
  const listsLoading = departments.result.state === 'loading';
  const listsMissing = departments.result.state === 'error' || (choices.length === 0 && !listsLoading);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const check = validateRegister({ fullName, email, password, matric: '' });
    const next: Problems = {};
    if (check.fullName) next.fullName = COPY.register.errName;
    if (check.email) next.email = COPY.register.errEmail;
    if (check.password) {
      next.password = check.password.includes('128')
        ? COPY.register.errPasswordLong
        : COPY.register.errPassword;
    }
    if (!consent) next.consent = COPY.register.errConsent;

    setProblems(next);
    setFailure(null);
    if (Object.keys(next).length > 0) return;

    setSending(true);
    try {
      // Optional fields are left out when blank. The server never gets empty strings for them.
      await apiPost('/auth/register', {
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        ...(departmentId ? { department_id: departmentId } : {}),
        ...(level ? { level: Number(level) } : {}),
      });
      // Registration returns no token. The user logs in next.
      navigate('/login', { state: { registered: true } });
    } catch (error) {
      const kind = failureOf(error);
      setFailure(kind);
      if (kind === 'taken') {
        setProblems({ email: COPY.register.errTaken });
        setTakenDismissed(false);
      }
    } finally {
      // The password is not kept after submit, whether it worked or not.
      setPassword('');
      setSending(false);
    }
  }

  const summary = (['fullName', 'email', 'password', 'consent'] as const).filter(
    (name) => problems[name],
  );
  const alert = failure && failure !== 'taken' ? ALERTS[failure] : null;
  const showTaken = failure === 'taken' && !takenDismissed;

  return (
    <>
      <Hero
        size="std"
        className="hero--auth"
        photo="/photos/road-l.webp"
        kicker={COPY.register.kicker}
        title={COPY.register.title}
        gold={COPY.register.titleGold}
        lead={COPY.register.lead}
        student="wave"
        header={<AppHeader variant="hero" />}
      />

      <div className="page">
        <form className="form" noValidate onSubmit={submit}>
          {summary.length > 0 && (
            <div className="alert alert--error" role="alert">
              <Icon name="warningCircle" size={24} />
              <div>
                <b>{COPY.register.errorSummary.replace('{n}', String(summary.length))}</b>
                <ul>
                  {summary.map((name) => (
                    <li key={name}>
                      <a href={`#reg-${name}`}>{problems[name]}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <Field
            id="reg-fullName"
            icon="profile"
            label={COPY.register.fullName}
            error={problems.fullName}
          >
            <input
              id="reg-fullName"
              name="full_name"
              autoComplete="name"
              placeholder={COPY.register.fullNamePh}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              aria-invalid={Boolean(problems.fullName)}
              aria-describedby={problems.fullName ? 'reg-fullName-err' : undefined}
            />
          </Field>

          <Field
            id="reg-email"
            icon="envelope"
            label={COPY.register.email}
            hint={COPY.register.emailHint}
            error={problems.email}
          >
            <input
              id="reg-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={COPY.register.emailPh}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(problems.email)}
              aria-describedby={
                problems.email ? 'reg-email-hint reg-email-err' : 'reg-email-hint'
              }
            />
          </Field>

          <Field
            id="reg-password"
            icon="lock"
            label={COPY.register.password}
            error={problems.password}
            trailing={
              <button
                type="button"
                className="iconbtn iconbtn--plain"
                aria-pressed={showPassword}
                aria-label={
                  showPassword ? COPY.register.hidePassword : COPY.register.showPassword
                }
                onClick={() => setShowPassword((shown) => !shown)}
              >
                <Icon name={showPassword ? 'eyeSlash' : 'eye'} size={22} />
              </button>
            }
          >
            <input
              id="reg-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={COPY.register.passwordPh}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(problems.password)}
              aria-describedby={problems.password ? 'reg-password-err' : undefined}
            />
          </Field>

          <StrengthMeter strength={passwordStrength(password)} />

          <Field
            id="reg-school"
            icon="bank"
            label={COPY.register.school}
            select
            optional
            hint={listsMissing ? COPY.register.departmentUnavailable : undefined}
          >
            <select
              id="reg-school"
              value={school}
              disabled={listsLoading || listsMissing}
              onChange={(e) => {
                setSchool(e.target.value);
                setDepartmentId('');
              }}
              aria-describedby={listsMissing ? 'reg-school-hint' : undefined}
            >
              <option value="">
                {listsLoading ? COPY.register.loading : COPY.register.schoolPh}
              </option>
              {schools.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id="reg-department"
            icon="bookOpen"
            label={COPY.register.department}
            select
            optional
            hint={COPY.register.departmentHelp}
          >
            <select
              id="reg-department"
              value={departmentId}
              disabled={!school}
              onChange={(e) => setDepartmentId(e.target.value)}
              aria-describedby="reg-department-hint"
            >
              <option value="">{COPY.register.departmentPh}</option>
              {departmentsForSchool.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </Field>

          <Field id="reg-level" icon="graduationCap" label={COPY.register.level} select optional>
            <select id="reg-level" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">{COPY.register.levelPh}</option>
              {LEVEL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} Level
                </option>
              ))}
            </select>
          </Field>

          <div className={`check${problems.consent ? ' is-error' : ''}`}>
            <input
              type="checkbox"
              id="reg-consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              aria-invalid={Boolean(problems.consent)}
              aria-describedby={problems.consent ? 'reg-consent-err' : undefined}
            />
            <label htmlFor="reg-consent">
              {COPY.register.consent.split('{privacy}')[0]}
              <span className="consent-link">{COPY.register.consentLink}</span>
              {COPY.register.consent.split('{privacy}')[1]}
            </label>
          </div>
          {problems.consent && (
            <p className="field__err" id="reg-consent-err">
              <Icon name="warning" size={16} />
              <span>{problems.consent}</span>
            </p>
          )}

          {alert && (
            <div className="alert alert--error" role="alert">
              <Icon name={alert.icon} size={24} />
              <p>{alert.text}</p>
            </div>
          )}

          <div className="btn-row">
            <button
              type="submit"
              className={`btn btn--gold btn--block btn--lg${sending ? ' is-loading' : ''}`}
              disabled={sending}
            >
              {sending && <Icon name="arrowsClockwise" size={22} />}
              <span>{sending ? COPY.register.sending : COPY.register.submit}</span>
              {!sending && <Icon name="arrowRight" size={22} />}
            </button>
          </div>

          <p className="center">
            {COPY.register.haveAccount} <Link to="/login">{COPY.register.login}</Link>
          </p>
        </form>

        {showTaken && (
          <div className="toast toast--error" role="alert">
            <Icon name="warningCircle" size={22} />
            <span>{COPY.register.errTaken}</span>
            <button
              type="button"
              className="iconbtn iconbtn--plain"
              aria-label={COPY.register.dismiss}
              onClick={() => setTakenDismissed(true)}
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        )}

        <p className="hint center">{COPY.register.optional}</p>
      </div>

      <Footer photoCredit="Photo: Omaonu, CC BY-SA 4.0 (Wikimedia Commons)." />
    </>
  );
}
