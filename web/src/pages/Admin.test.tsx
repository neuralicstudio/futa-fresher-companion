import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User, UserRole } from '../api/types';
import type { AuthStatus } from '../lib/auth';

// The Admin centre is rendered once, as the server would. Auth, the queue total and the offline
// cache are faked, so there is no network.
const auth: { status: AuthStatus; user: User | null } = { status: 'signed-out', user: null };
const queue: { total: number | null } = { total: null };
vi.mock('../lib/auth', () => ({ useAuth: () => auth }));
vi.mock('../lib/offline', () => ({ readComposerChoices: async () => ({}) }));
vi.mock('../lib/useCachedRows', () => ({
  useCachedRows: () => ({
    result: {
      state: 'ready',
      value: {
        faculties: [{ id: 'f1', name: 'Science' }],
        departments: [{ id: 'd1', faculty_id: 'f1', name: 'Biology' }],
      },
    },
    retry: () => {},
    progress: {},
  }),
}));
vi.mock('../lib/useVerifyQueue', () => ({ useQueueTotal: () => queue.total }));

import Admin from './Admin';

function page(): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <Admin />
    </MemoryRouter>,
  );
}

function signedInAs(role: UserRole, extra: Partial<User> = {}) {
  auth.status = 'signed-in';
  auth.user = { id: 'u1', full_name: 'A', email: 'a@b.co', role, ...extra };
}

beforeEach(() => {
  auth.status = 'signed-out';
  auth.user = null;
  queue.total = null;
});

describe('the Admin centre gate', () => {
  it('asks a signed-out visitor to log in', () => {
    const html = page();
    expect(html).toContain('Log in to continue');
    expect(html).toContain('href="/login"');
    expect(html).not.toContain('Verify data');
  });

  it('says "Admins only o" to a student and shows no tools', () => {
    signedInAs('student');
    const html = page();
    expect(html).toContain('Admins only o');
    expect(html).not.toContain('href="/admin/verify"');
    expect(html).not.toContain('href="/admin/publish"');
  });

  it('says "Admins only o" to a class rep too', () => {
    signedInAs('class_rep');
    expect(page()).toContain('Admins only o');
  });
});

describe('the Admin centre', () => {
  it('shows the role bar with the scope name, and links to both tools', () => {
    signedInAs('department_admin', { department_id: 'd1' });
    const html = page();

    expect(html).toContain('Admin centre');
    expect(html).toContain('Department admin, Biology');
    expect(html).toContain('href="/admin/publish"');
    expect(html).toContain('href="/admin/verify"');
  });

  it('shows the number waiting on the Verify data tile', () => {
    signedInAs('super_admin');
    queue.total = 12;
    const html = page();

    expect(html).toContain('>12</i>');
    expect(html).toContain(', 12 waiting');
  });

  it('shows no number when nothing is waiting or it is not known', () => {
    signedInAs('super_admin');
    queue.total = 0;
    expect(page()).not.toContain('class="a-badge"');
    queue.total = null;
    expect(page()).not.toContain('class="a-badge"');
  });

  it('caps a big number', () => {
    signedInAs('super_admin');
    queue.total = 250;
    const html = page();
    expect(html).toContain('>99+</i>');
    expect(html).toContain(', 250 waiting');
  });

  it.each(['department_admin', 'faculty_admin', 'sug', 'super_admin'] as const)(
    'is open to a %s',
    (role) => {
      signedInAs(role);
      expect(page()).toContain('href="/admin/verify"');
    },
  );
});
