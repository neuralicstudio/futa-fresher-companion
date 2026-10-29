import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User, UserRole, VerifyQueueCounts, VerifyQueueItem } from '../api/types';
import type { AuthStatus } from '../lib/auth';
import { initialQueue, type QueueView } from '../lib/verifyView';

// The page is rendered once, as the server would, so only what shows first is checked. Auth, the
// queue hook and the offline cache are faked, so there is no network.
const auth: { status: AuthStatus; user: User | null } = { status: 'signed-out', user: null };
const queue: { state: QueueView } = { state: initialQueue() };
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
vi.mock('../lib/useVerifyQueue', () => ({
  useVerifyQueue: () => ({
    state: queue.state,
    online: true,
    select: () => {},
    retry: () => {},
    loadMore: () => {},
    removed: () => {},
  }),
}));

import AdminVerify from './AdminVerify';

const ZERO: VerifyQueueCounts = {
  faculties: 0,
  departments: 0,
  lecturers: 0,
  courses: 0,
  class_reps: 0,
  buildings: 0,
  timetable_entries: 0,
  announcements: 0,
};

function item(over: Partial<VerifyQueueItem> = {}): VerifyQueueItem {
  return {
    entity_type: 'courses',
    id: 'c1',
    name: 'CSC101 Intro',
    belongs_to: {
      faculty: { id: 'f1', name: 'Science' },
      department: { id: 'd1', name: 'Biology' },
    },
    source: 'HOD office',
    created_at: '2026-10-12T12:00:00Z',
    updated_at: '2026-10-12T12:00:00Z',
    ...over,
  };
}

function ready(items: VerifyQueueItem[], over: Partial<QueueView> = {}): QueueView {
  return {
    ...initialQueue(),
    phase: 'ready',
    items,
    counts: { ...ZERO, courses: 2, lecturers: 1 },
    total: 3,
    ...over,
  };
}

function page(): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <AdminVerify />
    </MemoryRouter>,
  );
}

function signedInAs(role: UserRole, extra: Partial<User> = {}) {
  auth.status = 'signed-in';
  auth.user = { id: 'u1', full_name: 'Ada Obi', email: 'a@b.co', role, ...extra };
}

beforeEach(() => {
  auth.status = 'signed-out';
  auth.user = null;
  queue.state = initialQueue();
});

describe('the Verify Data gate', () => {
  it('asks a signed-out visitor to log in, and shows no queue', () => {
    const html = page();
    expect(html).toContain('Log in to continue');
    expect(html).toContain('href="/login"');
    expect(html).not.toContain('Verify Data');
  });

  it('says "Admins only o" to a student, and never shows the queue', () => {
    signedInAs('student');
    queue.state = ready([item()]);
    const html = page();
    expect(html).toContain('Admins only o');
    expect(html).not.toContain('CSC101 Intro');
    expect(html).not.toContain('Verify Data');
  });

  it('does not guess when the account details could not be loaded', () => {
    auth.status = 'signed-in';
    auth.user = null;
    const html = page();
    expect(html).toContain('We no fit load your account');
    expect(html).not.toContain('CSC101 Intro');
  });

  it('waits while the sign-in is being checked', () => {
    auth.status = 'loading';
    expect(page()).not.toContain('Verify Data');
  });

  it.each(['department_admin', 'faculty_admin', 'sug', 'super_admin'] as const)(
    'lets a %s in',
    (role) => {
      signedInAs(role);
      expect(page()).toContain('Verify Data');
    },
  );
});

describe('the queue', () => {
  beforeEach(() => signedInAs('super_admin'));

  it('shows a loading state while the first page comes', () => {
    const html = page();
    expect(html).toContain('Dey load the queue');
    expect(html).toContain('role="status"');
    expect(html).not.toContain('Nothing to verify');
  });

  it('shows a card with name, kind, place, source, date and a Verify button', () => {
    queue.state = ready([item()]);
    const html = page();

    expect(html).toContain('CSC101 Intro');
    expect(html).toContain('>Course<');
    expect(html).toContain('Not verified yet');
    expect(html).toContain('Biology · Science');
    expect(html).toContain('Source: HOD office');
    expect(html).toContain('Added 12 Oct 2026');
    expect(html).toContain('aria-label="Verify: CSC101 Intro"');
    expect(html).toContain('3 waiting');
  });

  it('leaves out the source line when the record has none', () => {
    queue.state = ready([item({ source: null })]);
    expect(page()).not.toContain('Source:');
  });

  it('shows the kinds with their counts, All first and pressed', () => {
    queue.state = ready([item()]);
    const html = page();

    expect(html).toContain('All (3)');
    expect(html).toContain('Courses (2)');
    expect(html).toContain('Lecturers (1)');
    expect(html).not.toContain('Buildings (');
    expect(html).toMatch(/aria-pressed="true"[^>]*>All \(3\)/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Courses \(2\)/);
  });

  it('prints record text as text, never as markup', () => {
    queue.state = ready([item({ name: '<img src=x onerror=alert(1)>' })]);
    const html = page();
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('offers "Show more" only when the server has more', () => {
    queue.state = ready([item()], { nextCursor: 'abc' });
    expect(page()).toContain('Show more');

    queue.state = ready([item()], { nextCursor: null });
    expect(page()).not.toContain('Show more');
  });

  it('shows loading more, and a failed load more with a way to retry', () => {
    queue.state = ready([item()], { nextCursor: 'abc', more: 'loading' });
    const loading = page();
    expect(loading).toContain('Dey load more');
    expect(loading).toContain('disabled');

    queue.state = ready([item()], { nextCursor: 'abc', more: 'problem' });
    const failed = page();
    expect(failed).toContain('We no fit load more');
    expect(failed).toContain('Try again');
    expect(failed).toContain('role="alert"');
  });

  it('says "Nothing to verify" when the queue is empty', () => {
    queue.state = ready([], { counts: { ...ZERO }, total: 0 });
    const html = page();
    expect(html).toContain('Nothing to verify');
    expect(html).toContain('Your queue don clean');
  });

  it('says so when one kind is empty but others are not', () => {
    queue.state = ready([], { kind: 'courses', counts: { ...ZERO, lecturers: 1 }, total: 1 });
    expect(page()).toContain('Try another one');
  });

  it('shows the offline message with Try again', () => {
    queue.state = { ...initialQueue(), phase: 'problem', problem: { kind: 'offline' } };
    const html = page();
    expect(html).toContain('You dey offline');
    expect(html).toContain('We no fit verify data without internet');
    expect(html).toContain('Try again');
  });

  it('shows "not allowed" for a 403 without a retry button', () => {
    queue.state = { ...initialQueue(), phase: 'problem', problem: { kind: 'forbidden' } };
    const html = page();
    expect(html).toContain('Admins only o');
    expect(html).not.toContain('Try again');
  });

  it('shows a busy server with how long to wait, and a retry', () => {
    queue.state = {
      ...initialQueue(),
      phase: 'problem',
      problem: { kind: 'busy', retryAfter: 5 },
    };
    const html = page();
    expect(html).toContain('The server dey busy');
    expect(html).toContain('Wait 5 seconds and try again.');
    expect(html).toContain('Try again');
  });

  it('shows a general error with a retry', () => {
    queue.state = { ...initialQueue(), phase: 'problem', problem: { kind: 'error' } };
    const html = page();
    expect(html).toContain('We no fit read the queue');
    expect(html).toContain('Try again');
  });

  it('links back to the Admin centre', () => {
    queue.state = ready([item()]);
    expect(page()).toContain('href="/admin"');
  });
});

describe('who sees which words', () => {
  it('tells a scoped admin what they may verify', () => {
    signedInAs('department_admin', { department_id: 'd1' });
    queue.state = ready([item()]);
    expect(page()).toContain('You fit verify only records wey belong to Biology.');
  });

  it('does not say it to a super admin', () => {
    signedInAs('super_admin');
    queue.state = ready([item()]);
    expect(page()).not.toContain('You fit verify only');
  });
});

describe('accessibility basics', () => {
  it('gives every button a name and keeps the kind filter a labelled group', () => {
    signedInAs('super_admin');
    queue.state = ready([item(), item({ id: 'c2', name: 'CSC102 Next' })], { nextCursor: 'abc' });
    const html = page();

    for (const match of html.matchAll(/<button\b([^>]*)>(.*?)<\/button>/gs)) {
      const [, attributes, inner] = match;
      const text = inner.replace(/<[^>]*>/g, '').trim();
      expect(text || /aria-label="[^"]+"/.test(attributes)).toBeTruthy();
    }
    expect(html).toContain('role="group" aria-label="Kind of record"');
    expect(html).toContain('<h1>Verify Data</h1>');
  });
});
