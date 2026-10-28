import type { ReactNode } from 'react';
import AdminIcon from './AdminIcon';
import type { IconName } from './iconPaths';

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
      <span className="a-state__icon">
        <AdminIcon name={icon} size={28} />
      </span>
      <h2 className="a-state__title">{title}</h2>
      <p className="a-state__body">{body}</p>
      {action}
    </section>
  );
}
