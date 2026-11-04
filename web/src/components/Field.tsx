// One form field: a 64px box with a leading icon, a small label, the control and an optional
// trailing action (show/hide password, a select caret), then a hint or an error below.
// The control is passed in, so the page keeps its own state and accessibility attributes.
import type { ReactNode } from 'react';
import Icon, { type IconName } from './Icon';
import { COPY } from '../copy/pidgin';

interface FieldProps {
  id: string;
  label: string;
  icon: IconName;
  /** Shows the small "Optional" tag after the label. */
  optional?: boolean;
  hint?: string;
  error?: string;
  /** A select gets the design's caret. */
  select?: boolean;
  /** A button at the end of the box, such as show/hide password. */
  trailing?: ReactNode;
  children: ReactNode;
}

export default function Field({
  id,
  label,
  icon,
  optional = false,
  hint,
  error,
  select = false,
  trailing,
  children,
}: FieldProps) {
  return (
    <div className={`field${error ? ' is-error' : ''}`}>
      <div className="field__box">
        <Icon name={icon} className="field__icon" size={24} />
        <span className="field__main">
          <label htmlFor={id}>
            {label}
            {optional && <em> {COPY.register.optionalTag}</em>}
          </label>
          {children}
        </span>
        {trailing ?? (select ? <Icon name="caretDown" className="field__caret" size={18} /> : null)}
      </div>
      {hint && (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__err" id={`${id}-err`}>
          <Icon name="warning" size={16} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
