import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../../api/types';
import { COPY } from '../../lib/adminCopy';
import { useAuth } from '../../lib/auth';
import { adminGate } from '../../lib/composerView';
import StateBlock from './StateBlock';
import '../../styles/admin.css';

/**
 * Shows the admin screen only to an admin. The role comes from the server (/auth/me), never from
 * the token, and the server checks it again on every call, so this only keeps the screen out of
 * the wrong hands. Everyone else sees one plain message.
 */
export default function AdminGate({ children }: { children: (user: User) => ReactNode }) {
  const { status, user } = useAuth();
  const gate = adminGate(status, user);

  if (gate === 'allowed' && user) return <div className="admin-ui">{children(user)}</div>;

  return (
    <div className="admin-ui">
      {gate === 'loading' && <p role="status" className="a-muted">…</p>}
      {gate === 'signed-out' && (
        <StateBlock
          icon="lock-key"
          title={COPY.gate.loginTitle}
          body={COPY.gate.loginBody}
          action={
            <Link className="a-btn a-btn--outline" to="/login">
              {COPY.gate.loginLink}
            </Link>
          }
        />
      )}
      {gate === 'no-profile' && (
        <StateBlock
          icon="warning-circle"
          error
          title={COPY.gate.noProfileTitle}
          body={COPY.gate.noProfileBody}
        />
      )}
      {gate === 'forbidden' && (
        <StateBlock
          icon="lock-key"
          title={COPY.gate.notAdminTitle}
          body={COPY.gate.notAdminBody}
        />
      )}
    </div>
  );
}
