// Admin centre: the home for admin tools. Reached from the profile sheet, never from a tab.
//
// The screen is the same Sabi shell as the rest of the app: the tree hero with its handwritten
// line, the role bar, the tools, then the footer and the tab bar (screenshots admin-390,
// admin-768). Only the tools that exist are here: My notices joins when that screen does.
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import AdminGate from '../components/admin/AdminGate';
import AdminIcon from '../components/admin/AdminIcon';
import { scopeName, roleLine } from '../lib/adminView';
import { COPY } from '../lib/adminCopy';
import type { User } from '../api/types';
import { readComposerChoices } from '../lib/offline';
import { useCachedRows } from '../lib/useCachedRows';
import { useQueueTotal } from '../lib/useVerifyQueue';
import { badgeText, waitingLabel } from '../lib/verifyView';

export default function Admin() {
  return (
    <>
      <Hero
        size="std"
        photo="/photos/tree-l.webp"
        kicker={COPY.admin.kicker}
        title={COPY.admin.title}
        lead={COPY.admin.lead}
        header={<AppHeader variant="hero" pill />}
      />

      <div className="page page--admin">
        <AdminGate>{(user) => <AdminHome user={user} />}</AdminGate>
      </div>

      <Footer className="foot--tabs" />
    </>
  );
}

function AdminHome({ user }: { user: User }) {
  const total = useQueueTotal();
  const choices = useCachedRows(readComposerChoices);
  const cached = choices.result.state === 'ready' ? choices.result.value : null;
  const scope = scopeName(user, cached?.faculties ?? [], cached?.departments ?? []);
  const badge = badgeText(total);

  return (
    <>
      {/* "Department admin, Computer Science": the role in bold, the scope after it. */}
      <div className="role-bar">
        <AdminIcon name="user-circle" size={28} />
        <span>
          <b>{COPY.roles[user.role]}</b>
          {scope ? `, ${scope}` : ''}
        </span>
      </div>

      <ul className="tiles" aria-label={COPY.admin.tilesLabel}>
        <li>
          <Link className="tile" to="/admin/publish">
            <span className="tile__ic">
              <AdminIcon name="megaphone" size={28} />
            </span>
            <b>{COPY.admin.publishTitle}</b>
            <small>{COPY.admin.publishBody}</small>
            <span className="go" aria-hidden="true">
              <AdminIcon name="arrow-right" size={20} />
            </span>
          </Link>
        </li>
        <li>
          <Link className="tile" to="/admin/verify">
            <span className="tile__ic">
              <AdminIcon name="shield-check" size={28} />
              {badge && (
                <i className="tile__count" aria-hidden="true">
                  {badge}
                </i>
              )}
            </span>
            <b>
              {COPY.admin.verifyTitle}
              {total !== null && total > 0 && (
                <span className="a-sr">, {waitingLabel(total)}</span>
              )}
            </b>
            <small>{COPY.admin.verifyBody}</small>
            <span className="go" aria-hidden="true">
              <AdminIcon name="arrow-right" size={20} />
            </span>
          </Link>
        </li>
        <li>
          <Link className="tile" to="/admin/role">
            <span className="tile__ic">
              <AdminIcon name="identification-badge" size={28} />
            </span>
            <b>{COPY.admin.roleTitle}</b>
            <small>{roleLine(user.role, scope)}</small>
            <span className="go" aria-hidden="true">
              <AdminIcon name="arrow-right" size={20} />
            </span>
          </Link>
        </li>
      </ul>
    </>
  );
}
