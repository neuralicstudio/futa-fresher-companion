import type { ReactNode } from 'react';
import AdminIcon from './AdminIcon';
import type { IconName } from './iconPaths';

function Sparks({ side }: { side: 'l' | 'r' }) {
  return (
    <svg className={`sparks sparks--${side}`} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M6 8l9 5M3 20h12M6 32l9-5" />
    </svg>
  );
}

/** One pattern for empty, error, offline and not-allowed: an icon, a title, a line, at most one action. */
export default function StateBlock({
  icon,
  title,
  body,
  action,
  error = false,
  live = 'status',
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
  error?: boolean;
  live?: 'status' | 'alert';
}) {
  return (
    <section className={error ? 'a-state a-state--error' : 'a-state'} role={error ? 'alert' : live}>
      <span className="a-state__art">
        <Sparks side="l" />
        <AdminIcon name={icon} size={40} />
        <Sparks side="r" />
      </span>
      <h2 className="a-state__title">{title}</h2>
      <p className="a-state__body">{body}</p>
      {action}
    </section>
  );
}
