// One pattern for empty, error, offline and not-found notes: a gold icon with two spark dashes,
// a bold title and one line of help (docs/design/COMPONENTS.md, States).
import Icon, { type IconName } from './Icon';

interface StateBlockProps {
  icon: IconName;
  title: string;
  body?: string;
  /** A tighter version that sits under a form rather than taking the screen. */
  inline?: boolean;
}

function Sparks({ side }: { side: 'l' | 'r' }) {
  return (
    <svg className={`sparks sparks--${side}`} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M6 8l9 5M3 20h12M6 32l9-5" />
    </svg>
  );
}

export default function StateBlock({ icon, title, body, inline = false }: StateBlockProps) {
  return (
    <div className={`state${inline ? ' state--inline' : ''}`} role="note">
      <span className="state__art">
        <Sparks side="l" />
        <Icon name={icon} size={40} />
        <Sparks side="r" />
      </span>
      <p className="state__title">{title}</p>
      {body && <p className="state__body">{body}</p>}
    </div>
  );
}
