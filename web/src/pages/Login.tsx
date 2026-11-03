// Log in. Optional: only admin features need an account.
//
// Follows docs/design/SCREENS.md (10) and the `login` screenshots: hero with a drawn student,
// email and password with show/hide, Log in, "Or", the Register button and the offline note.
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import AppHeader from '../components/AppHeader';
import Field from '../components/Field';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Icon from '../components/Icon';
import StateBlock from '../components/StateBlock';
import { COPY } from '../copy/pidgin';
import { useAuth } from '../lib/auth';
import { validateLogin } from '../lib/authView';

type FieldName = 'email' | 'password';
type Problems = Partial<Record<FieldName, string>>;

type Failure = 'wrong' | 'busy' | 'offline' | 'session' | 'invalid' | 'retry';

const ALERTS: Record<Exclude<Failure, 'wrong'>, { icon: 'warningCircle' | 'wifiSlash'; text: string }> = {
  busy: { icon: 'warningCircle', text: COPY.login.errBusy },
  offline: { icon: 'wifiSlash', text: COPY.login.errOffline },
  session: { icon: 'warningCircle', text: COPY.login.errSession },
  invalid: { icon: 'warningCircle', text: COPY.login.errInvalid },
  retry: { icon: 'warningCircle', text: COPY.login.errRetry },
};

function failureOf(error: unknown): Failure {
  if (!navigator.onLine) return 'offline';
  if (error instanceof ApiError) {
    if (error.status === 401) return 'wrong';
    if (error.status === 429 || error.status === 503) return 'busy';
    if (error.status === 422) return 'invalid';
  }
  return 'retry';
}

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = Boolean((location.state as { registered?: boolean } | null)?.registered);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [problems, setProblems] = useState<Problems>({});
  const [failure, setFailure] = useState<Failure | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const check = validateLogin({ email, password });
    const next: Problems = {};
    if (check.email) next.email = COPY.login.errEmail;
    if (check.password) next.password = COPY.login.errPassword;

    setProblems(next);
    setFailure(null);
    if (Object.keys(next).length > 0) return;

    setSending(true);
    try {
      await signIn(email.trim(), password);
      navigate('/');
    } catch (error) {
      const kind = failureOf(error);
      setFailure(kind);
      // The mockup puts "Incorrect email or password" on the password field, not in a banner.
      if (kind === 'wrong') setProblems({ password: COPY.login.errWrong });
    } finally {
      // The password is not kept after submit, whether it worked or not.
      setPassword('');
      setSending(false);
    }
  }

  const alert = failure && failure !== 'wrong' ? ALERTS[failure] : null;

  return (
    <>
      <Hero
        size="std"
        className="hero--auth"
        photo="/photos/road-l.webp"
        kicker={COPY.login.kicker}
        title={COPY.login.title}
        gold={COPY.login.titleGold}
        lead={COPY.login.lead}
        student="phone"
        header={<AppHeader variant="hero" />}
      />

      <div className="page">
        <form className="form" noValidate onSubmit={submit}>
          {justRegistered && (
            <div className="alert alert--success" role="status">
              <Icon name="checkCircle" size={24} />
              <p>{COPY.login.registered}</p>
            </div>
          )}

          <Field
            id="login-email"
            icon="envelope"
            label={COPY.login.email}
            error={problems.email}
          >
            <input
              id="login-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={COPY.login.emailPh}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(problems.email)}
              aria-describedby={problems.email ? 'login-email-err' : undefined}
            />
          </Field>

          <Field
            id="login-password"
            icon="lock"
            label={COPY.login.password}
            error={problems.password}
            trailing={
              <button
                type="button"
                className="iconbtn iconbtn--plain"
                aria-pressed={showPassword}
                aria-label={showPassword ? COPY.login.hidePassword : COPY.login.showPassword}
                onClick={() => setShowPassword((shown) => !shown)}
              >
                <Icon name={showPassword ? 'eyeSlash' : 'eye'} size={22} />
              </button>
            }
          >
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={COPY.login.passwordPh}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(problems.password)}
              aria-describedby={problems.password ? 'login-password-err' : undefined}
            />
          </Field>

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
              <span>{sending ? COPY.login.sending : COPY.login.submit}</span>
              {!sending && <Icon name="arrowRight" size={22} />}
            </button>
          </div>

          <p className="or">
            <span>{COPY.login.or}</span>
          </p>

          <Link className="btn btn--outline btn--block btn--lg" to="/register">
            <Icon name="userPlus" size={22} />
            <span>
              {COPY.login.noAccount} <b>{COPY.login.register}</b>
            </span>
          </Link>
        </form>

        <StateBlock
          inline
          icon="wifiSlash"
          title={COPY.login.offlineTitle}
          body={COPY.login.offlineBody}
        />
      </div>

      <Footer photoCredit="Photo: Omaonu, CC BY-SA 4.0 (Wikimedia Commons)." />
    </>
  );
}
