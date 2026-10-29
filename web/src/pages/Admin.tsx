// Admin centre: the home for admin tools. Reached from the nav for admin roles only.
import { Link } from 'react-router-dom';
import AdminGate from '../components/admin/AdminGate';
import AdminIcon from '../components/admin/AdminIcon';
import { roleLine, scopeName } from '../lib/adminView';
import { COPY } from '../lib/adminCopy';
import type { User } from '../api/types';
import { readComposerChoices } from '../lib/offline';
import { useCachedRows } from '../lib/useCachedRows';
import { useQueueTotal } from '../lib/useVerifyQueue';
import { badgeText, waitingLabel } from '../lib/verifyView';

export default function Admin() {
  return <AdminGate>{(user) => <AdminHome user={user} />}</AdminGate>;
}

function AdminHome({ user }: { user: User }) {
  const total = useQueueTotal();
  const choices = useCachedRows(readComposerChoices);
  const cached = choices.result.state === 'ready' ? choices.result.value : null;
  const scope = scopeName(user, cached?.faculties ?? [], cached?.departments ?? []);
  const badge = badgeText(total);

  return (
    <>
      <header className="a-head">
        <p className="a-kicker">{COPY.admin.kicker}</p>
        <h1>{COPY.admin.title}</h1>
        <p className="a-lead">{COPY.admin.lead}</p>
        <p className="a-role">{roleLine(user.role, scope)}</p>
      </header>

      <ul className="a-tiles" aria-label={COPY.admin.tilesLabel}>
        <li>
          <Link className="a-tile" to="/admin/publish">
            <span className="a-tile__icon">
              <AdminIcon name="megaphone" size={28} />
            </span>
            <span className="a-tile__title">{COPY.admin.publishTitle}</span>
            <span className="a-tile__body">{COPY.admin.publishBody}</span>
          </Link>
        </li>
        <li>
          <Link className="a-tile" to="/admin/verify">
            <span className="a-tile__icon">
              <AdminIcon name="shield-check" size={28} />
              {badge && (
                <i className="a-badge" aria-hidden="true">
                  {badge}
                </i>
              )}
            </span>
            <span className="a-tile__title">
              {COPY.admin.verifyTitle}
              {total !== null && total > 0 && (
                <span className="a-sr">, {waitingLabel(total)}</span>
              )}
            </span>
            <span className="a-tile__body">{COPY.admin.verifyBody}</span>
          </Link>
        </li>
      </ul>
    </>
  );
}
