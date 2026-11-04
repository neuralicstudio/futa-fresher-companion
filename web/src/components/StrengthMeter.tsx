// The password strength meter: four segments and a word, so strength is never colour alone.
import { COPY } from '../copy/pidgin';
import type { PasswordStrength } from '../lib/authView';

const WORDS = [
  COPY.register.strength.empty,
  COPY.register.strength.weak,
  COPY.register.strength.fair,
  COPY.register.strength.good,
  COPY.register.strength.strong,
];

export default function StrengthMeter({ strength }: { strength: PasswordStrength }) {
  return (
    <div className="meter" aria-live="polite">
      <div className="meter__bar" aria-hidden="true">
        {[0, 1, 2, 3].map((segment) => (
          <i
            key={segment}
            className={`meter__seg${segment < strength ? ' is-on' : ''}`}
            data-level={strength}
          />
        ))}
      </div>
      <p className="meter__hint">
        <b>{WORDS[strength]}</b> {COPY.register.passwordHint}
      </p>
    </div>
  );
}
