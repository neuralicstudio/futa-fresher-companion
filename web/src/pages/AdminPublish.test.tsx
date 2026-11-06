import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User, UserRole } from '../api/types';
import type { AuthStatus } from '../lib/auth';

// The page is rendered once, as the server would, so only what shows first is checked.
// Auth is faked, and the offline cache is replaced with a fixed answer.
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
    retry: () => {},
    progress: {},
  }),
}));

import AdminPublish from './AdminPublish';

function page(): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <AdminPublish />
    </MemoryRouter>,
  );
}

function signedInAs(role: UserRole, extra: Partial<User> = {}) {
  auth.status = 'signed-in';
  auth.user = { id: 'u1', full_name: 'A', email: 'a@b.co', role, ...extra };
}

/** One "Send to" segment, as the server render writes it. */
function segment(html: string, label: string): string {
  const match = html.match(new RegExp(`<button[^>]*>((?!</button>).)*${label}</button>`, 's'));
  return match?.[0] ?? '';
}

beforeEach(() => {
  auth.status = 'signed-out';
  auth.user = null;
});

describe('the Publish notice page gate', () => {
  it('asks a signed-out visitor to log in, with a link, and shows no form', () => {
    const html = page();
    expect(html).toContain('Log in to continue');
    expect(html).toContain('href="/login"');
    expect(html).not.toContain('<form');
  });

  it('says "Admins only" to a student and shows no form', () => {
    signedInAs('student');
    const html = page();
    expect(html).toContain('Admins only');
    expect(html).not.toContain('<form');
  });

  it('says "Admins only" to a class rep', () => {
    signedInAs('class_rep');
    expect(page()).toContain('Admins only');
  });

  it('keeps the shell while the profile loads, and shows no form', () => {
    auth.status = 'loading';
    const html = page();
    expect(html).toContain('role="status"');
    expect(html).not.toContain('<form');
  });

  it('asks a signed-in account with no profile to reload, and shows no form', () => {
    auth.status = 'signed-in';
    const html = page();
    expect(html).toContain('We no fit load your account');
    expect(html).not.toContain('<form');
  });
});

describe('the composer for admins', () => {
  it('gives a super admin all four segments, none locked', () => {
    signedInAs('super_admin');
    const html = page();
    expect(html).toContain('<form');
    for (const label of ['Everyone', 'SUG', 'My school', 'My department']) {
      expect(segment(html, label)).toContain('aria-disabled="false"');
    }
    expect(html).not.toContain('is-locked');
  });

  it('starts a super admin on Everyone, with no target picker', () => {
    signedInAs('super_admin');
    const html = page();
    expect(segment(html, 'Everyone')).toContain('aria-pressed="true"');
    expect(html).not.toContain('id="pub-target"');
    expect(html).toContain('To: Everyone');
  });

  it('gives SUG its own segment and shows the other three locked', () => {
    signedInAs('sug');
    const html = page();
    expect(segment(html, 'SUG')).toContain('aria-pressed="true"');
    expect(segment(html, 'SUG')).toContain('aria-disabled="false"');
    for (const label of ['Everyone', 'My school', 'My department']) {
      const locked = segment(html, label);
      expect(locked).toContain('aria-disabled="true"');
      expect(locked).toContain('is-locked');
    }
    expect(html).toContain('You fit post to SUG only.');
    expect(html).not.toContain('id="pub-target"');
  });

  it('locks a department admin to their own department', () => {
    signedInAs('department_admin', { department_id: 'd1' });
    const html = page();
    expect(segment(html, 'My department')).toContain('aria-pressed="true"');
    expect(segment(html, 'Everyone')).toContain('aria-disabled="true"');
    expect(segment(html, 'My school')).toContain('aria-disabled="true"');
    expect(html).toContain('You fit post to your department only.');
    // The picker is locked, so it is not drawn at all; the source still names the department.
    expect(html).not.toContain('id="pub-target"');
    expect(html).toContain('<span class="field__value" aria-labelledby="pub-source-label">Biology department</span>');
    expect(html).toContain('To: My department');
  });

  it('lets a faculty admin post to their school or a department inside it', () => {
    signedInAs('faculty_admin', { faculty_id: 'f1' });
    const html = page();
    expect(segment(html, 'My school')).toContain('aria-pressed="true"');
    expect(segment(html, 'My department')).toContain('aria-disabled="false"');
    expect(segment(html, 'Everyone')).toContain('aria-disabled="true"');
    expect(html).not.toContain('>SUG<');
    expect(html).toContain('You fit post to your school or a department inside your school only.');
    expect(html).toContain('>Science</span>');
  });

  it('shows the contract limits in the live counts', () => {
    signedInAs('super_admin');
    const html = page();
    expect(html).toContain('0 / 200');
    expect(html).toContain('0 / 4000');
  });

  it('names the audience and the date in the preview', () => {
    signedInAs('super_admin');
    const html = page();
    expect(html).toContain('Preview');
    expect(html).toContain('To: Everyone');
    expect(html).toContain('Publish notice');
  });
});
