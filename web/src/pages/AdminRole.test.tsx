import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User, UserRole } from '../api/types';
import type { AuthStatus } from '../lib/auth';

// The screen is rendered once, as the server would. Auth and the offline cache are faked, so
// there is no network.
const auth: { status: AuthStatus; user: User | null } = { status: 'signed-out', user: null };
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
  }),
}));

import AdminRole from './AdminRole';

function page(): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <AdminRole />
    </MemoryRouter>,
  );
}

function signedInAs(role: UserRole, extra: Partial<User> = {}) {
  auth.status = 'signed-in';
  auth.user = {
    id: 'u1',
    full_name: 'Sade Falana',
    email: 'a@b.co',
    role,
    ...extra,
  };
}

beforeEach(() => {
  auth.status = 'signed-out';
  auth.user = null;
});

describe('the Your role gate', () => {
  it('asks a signed-out visitor to log in, and shows no role card', () => {
    const html = page();
    expect(html).toContain('Log in to continue');
    expect(html).toContain('href="/login"');
    expect(html).not.toContain('Sade Falana');
    expect(html).not.toContain('What you fit publish to');
  });

  it('says "Admins only o" to a student', () => {
    signedInAs('student');
    const html = page();
    expect(html).toContain('Admins only o');
    expect(html).not.toContain('What you fit publish to');
  });

  it('does not guess when the account details could not be loaded', () => {
    auth.status = 'signed-in';
    auth.user = null;
    expect(page()).toContain('We no fit load your account');
  });
});

describe('the screen', () => {
  it('wears the Sabi shell: the bar, the handwritten line, the page and the footer', () => {
    signedInAs('department_admin', { department_id: 'd1' });
    const html = page();

    // A phrase, not a label: the bar lets it fold instead of cutting it off (role-390).
    expect(html).toContain(
      '<h1 class="app-header__title app-header__title--wrap">Role and permissions</h1>',
    );
    expect(html).toContain('href="/admin"');
    expect(html).toContain('Know your power');
    expect(html).toContain('Here na wetin you fit publish and verify.');
    expect(html).toContain('class="page page--role"');
    expect(html).toContain('class="foot foot--tabs"');
    expect(html).toContain('href="/credits"');
  });

  it('names the admin, their scope and their role', () => {
    signedInAs('department_admin', { department_id: 'd1' });
    const html = page();

    expect(html).toContain('Sade Falana');
    expect(html).toContain('>Biology<');
    expect(html).toContain('class="a-pill">Department admin</span>');
  });

  it('lists what the role may publish to, with the answer on each line', () => {
    signedInAs('faculty_admin', { faculty_id: 'f1' });
    const html = page();

    expect(html).toContain('What you fit publish to');
    expect(html).toContain('All departments in your school');
    expect(html).toContain('Your school, full access');
    expect(html).toContain('All schools (not allowed)');
    expect(html.match(/>Allowed</g)).toHaveLength(2);
    expect(html.match(/>Not allowed</g)).toHaveLength(1);
    // The green mark for a power, the plain cross for a row the role cannot use.
    expect(html).toContain('class="is-yes"');
    expect(html).toContain('class="is-no"');
  });

  it('tells a department admin the truth: only their own department', () => {
    signedInAs('department_admin', { department_id: 'd1' });
    const html = page();

    expect(html).toContain('Your department');
    expect(html.match(/>Allowed</g)).toHaveLength(1);
    expect(html.match(/>Not allowed</g)).toHaveLength(2);
  });

  it('tells a SUG admin their people are the students, not a school', () => {
    signedInAs('sug');
    const html = page();

    expect(html).toContain('FUTA students');
    expect(html).toContain('You dey here to support FUTA students. Make we do am well!');
  });

  it('ends with the gold note and the line about the server', () => {
    signedInAs('department_admin', { department_id: 'd1' });
    const html = page();

    expect(html).toContain('a-card--hl');
    expect(html).toContain('Your role');
    expect(html).toContain('You dey here to support Biology. Make we do am well!');
    expect(html).toContain('Roles come from the server. Sabi cannot give you more power.');
  });

  it('names the university for a super admin, with no ceiling row', () => {
    signedInAs('super_admin');
    const html = page();

    expect(html).toContain('Everyone (University)');
    // A super admin has no school of its own, so the rows say "any", not "your".
    expect(html).toContain('Any school, full access');
    expect(html).toContain('Any department');
    expect(html).not.toContain('Your school, full access');
    expect(html).not.toContain('All schools (not allowed)');
  });
});
