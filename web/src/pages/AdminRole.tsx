// Your role: what this admin may publish to, in plain words. It is the same Sabi shell as the
// other admin screens: the bar with its way back, the handwritten line, the role card, the powers,
// the gold note, the hint, then the footer and the tab bar (screenshots role-390, role-768).
//
// Nothing here changes anything. The role comes from the server, and the screen only repeats what
// that role may do, so an admin never has to guess why a choice is locked in the composer.
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import AdminGate from '../components/admin/AdminGate';
import AdminIcon from '../components/admin/AdminIcon';
import { COPY } from '../lib/adminCopy';
import { scopeName } from '../lib/adminView';
import { powerWord, publishPowers, cardScope, roleHelp } from '../lib/roleView';
import type { User } from '../api/types';
import { readComposerChoices } from '../lib/offline';
import { useCachedRows } from '../lib/useCachedRows';

export default function AdminRole() {
  return (
    <>
      <AppHeader
        variant="bar"
        back={{ to: '/admin', label: COPY.admin.backShort }}
        title={COPY.role.title}
        wrapTitle
      />

      <div className="page page--role">
        <p className="hand">{COPY.role.kicker}</p>
        <AdminGate>{(user) => <RoleScreen user={user} />}</AdminGate>
      </div>

      <Footer className="foot--tabs" />
    </>
  );
}

export function RoleScreen({ user }: { user: User }) {
  const choices = useCachedRows(readComposerChoices);
  const cached = choices.result.state === 'ready' ? choices.result.value : null;
  const scope = cardScope(user.role, scopeName(user, cached?.faculties ?? [], cached?.departments ?? []));
  const powers = publishPowers(user.role);

  return (
    <>
      <p className="lead-text">{COPY.role.lead}</p>

      {/* Who you are: the name the server has, the scope it sits in, and the role's own name. */}
      <article className="a-card a-me">
        <span className="a-me__ic">
          <AdminIcon name="user-circle" size={40} />
        </span>
        <div className="a-me__body">
          <b>{user.full_name}</b>
          {scope && <small>{scope}</small>}
        </div>
        <span className="a-pill">{COPY.roles[user.role]}</span>
      </article>

      <section className="a-card a-power" aria-labelledby="power-h">
        <h2 id="power-h" className="a-power__title">
          {COPY.role.canTitle}
        </h2>
        <ul className="a-checks" role="list">
          {powers.map((power) => (
            <li key={power.text} className={power.allowed ? 'is-yes' : 'is-no'}>
              <AdminIcon name={power.allowed ? 'check-circle-fill' : 'x'} size={24} />
              <span>{power.text}</span>
              <small>{powerWord(power.allowed)}</small>
            </li>
          ))}
        </ul>
      </section>

      {/* The same mark the Verify screen wears, in the gold card the design gives it. */}
      <article className="a-card a-card--hl a-role-note">
        <AdminIcon name="shield-check" size={32} />
        <div>
          <small>{COPY.role.yourRole}</small>
          <b>{COPY.roles[user.role]}</b>
          <p>{roleHelp(scope)}</p>
        </div>
      </article>

      <p className="hint center">{COPY.role.why}</p>
    </>
  );
}
