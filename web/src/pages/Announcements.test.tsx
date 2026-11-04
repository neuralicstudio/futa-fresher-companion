import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Announcement, Department, Faculty } from '../api/types';

// The screen is rendered once, as the server would, against a faked cache read.
const cache: { value: unknown } = { value: null };
const auth: { status: 'loading' | 'signed-in' | 'signed-out'; user: unknown } = {
  status: 'signed-out',
  user: null,
};
const seen: { ids: string[] } = { ids: [] };
const online: { value: boolean } = { value: true };

vi.mock('../lib/useCachedRows', () => ({
  useCachedRows: () => ({
    result: cache.value,
    retry: () => {},
    progress: { running: false, firstRun: false, pages: 0 },
  }),
}));
vi.mock('../lib/auth', () => ({ useAuth: () => auth }));
vi.mock('../lib/useOnline', () => ({ useOnline: () => online.value }));
vi.mock('../lib/offline', () => ({ readAnnouncementsScreen: async () => ({}) }));
vi.mock('../lib/noticesSeen', async () => {
  const actual =
    await vi.importActual<typeof import('../lib/noticesSeen')>('../lib/noticesSeen');
  return { ...actual, loadSeenIds: () => new Set(seen.ids) };
});

import Announcements from './Announcements';
import { COPY } from '../copy/pidgin';

const STAMP = '2026-10-26T09:00:00.000+01:00';
const FACULTY = 'f-soc';
const DEPT = 'd-csc';
const VERIFICATION = { status: 'verified' as const, source: 'The Registry' };

function announcement(over: Partial<Announcement> & { id: string }): Announcement {
  return {
    title: 'Academic calendar for the 2026/2027 session',
    body: 'This is to inform all students that the academic calendar has been released.',
    scope: 'university',
    faculty_id: null,
    department_id: null,
    author_id: 'u-admin',
    published_at: STAMP,
    expires_at: null,
    verification: VERIFICATION,
    updated_at: STAMP,
    ...over,
  };
}

function faculty(over: Partial<Faculty> = {}): Faculty {
  return {
    id: FACULTY,
    name: 'School of Computing',
    short_name: 'SOC',
    verification: VERIFICATION,
    updated_at: STAMP,
    ...over,
  };
}

function department(over: Partial<Department> = {}): Department {
  return {
    id: DEPT,
    faculty_id: FACULTY,
    name: 'Computer Science',
    short_name: 'CSC',
    hod_name: null,
    office_location: null,
    verification: VERIFICATION,
    updated_at: STAMP,
    ...over,
  };
}

const CALENDAR = announcement({ id: 'a-calendar' });
const SUG = announcement({
  id: 'a-sug',
  title: 'SUG registration now open',
  body: 'All freshers are to complete their SUG registration before Friday.',
  scope: 'sug',
  published_at: '2026-10-25T09:00:00.000+01:00',
  verification: { status: 'unverified', source: 'SUG' },
});
const LECTURE = announcement({
  id: 'a-lecture',
  title: 'CSC 101 lecture venue change',
  body: 'The venue for CSC 101 has changed from Lecture Theatre A1 to Lecture Theatre B3.',
  scope: 'department',
  department_id: DEPT,
  published_at: '2026-10-24T09:00:00.000+01:00',
  verification: { status: 'verified', source: 'Computer Science department' },
});

function ready(rows: Announcement[]) {
  return {
    state: 'ready',
    value: {
      announcements: rows,
      faculties: [faculty()],
      departments: [department()],
    },
  };
}

function render(): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/announcements']}>
      <Announcements />
    </MemoryRouter>,
  );
}

function user(over: Record<string, unknown> = {}) {
  return {
    id: 'u-1',
    full_name: 'Tola Ade',
    email: 'student@example.com',
    role: 'student',
    faculty_id: FACULTY,
    department_id: DEPT,
    level: 100,
    ...over,
  };
}

beforeEach(() => {
  auth.status = 'signed-out';
  auth.user = null;
  seen.ids = [];
  online.value = true;
  cache.value = ready([CALENDAR, SUG, LECTURE]);
});

describe('Notices', () => {
  it('opens on the hero, the search box and the chips', () => {
    const html = render();

    expect(html).toContain('miss out!');
    expect(html).toContain(COPY.notices.title);
    expect(html).toContain(COPY.notices.titleGold);
    expect(html).toContain('Stay updated on announcements from FUTA');
    expect(html).toContain(`placeholder="${COPY.notices.search}"`);
    expect(html).toContain('role="group"');
    expect(html).toContain('>All<');
    expect(html).toContain('>University<');
    expect(html).toContain('>SUG<');
  });

  it('marks the chip that is on', () => {
    expect(render()).toContain('aria-pressed="true">All<');
  });

  it('draws each notice with its scope, date, source and three-line body', () => {
    const html = render();

    expect(html).toContain('Academic calendar for the 2026/2027 session');
    expect(html).toContain('26 Oct 2026');
    expect(html).toContain('From The Registry');
    expect(html).toContain('This is to inform all students');
    expect(html).toContain('clamp3');
    expect(html).toContain(COPY.notices.viewDetails);
    expect(html).toContain('chip--scope-gold');
    expect(html).toContain('chip--scope-red');
    expect(html).toContain('chip--scope-indigo');
  });

  it('never shows a Verified tick: the source line is the trust signal', () => {
    const html = render();

    expect(html).not.toContain('Verified</');
    expect(html).toContain('From SUG');
  });

  it('outlines the newest card in gold and no other', () => {
    const html = render();

    expect(html.match(/card--hl/g)).toHaveLength(1);
    expect(html.indexOf('card--hl')).toBeLessThan(html.indexOf('SUG registration now open'));
  });

  it('marks a notice the phone has not shown yet, and only that one', () => {
    seen.ids = ['a-calendar'];

    const html = render();

    expect(html.match(/is-unread/g)).toHaveLength(2);
    const firstCard = html.slice(html.indexOf('<article'), html.indexOf('</article>'));
    expect(firstCard).not.toContain('is-unread');
  });

  it('shows no unread label once every card has been seen', () => {
    seen.ids = ['a-calendar', 'a-sug', 'a-lecture'];

    expect(render()).not.toContain('>Unread<');
  });

  it('offers "My school" and "My department" to a signed-in student', () => {
    auth.status = 'signed-in';
    auth.user = user();

    const html = render();

    expect(html).toContain('>My school<');
    expect(html).toContain('>My department<');
  });

  it('keeps a guest to the whole-campus chips', () => {
    const html = render();

    expect(html).not.toContain('>My school<');
    expect(html).not.toContain('>My department<');
  });

  it('names the student s own school on the line under the title', () => {
    auth.status = 'signed-in';
    auth.user = user();
    cache.value = ready([
      announcement({
        id: 'a-faculty',
        title: 'Orientation week',
        scope: 'faculty',
        faculty_id: FACULTY,
        verification: { status: 'verified', source: 'School of Computing' },
      }),
    ]);

    expect(render()).toContain('From School of Computing');
  });

  it('shows the shape of the list while the cache is read', () => {
    cache.value = { state: 'loading' };
    const html = render();

    expect(html).toContain(COPY.notices.loading);
    expect(html).toContain('skeleton');
    expect(html).toContain('>All<');
  });

  it('offers a retry inside the card when the cache cannot be read', () => {
    cache.value = { state: 'error' };
    const html = render();

    expect(html).toContain(COPY.notices.errorTitle);
    expect(html).toContain(COPY.notices.errorBody);
    expect(html).toContain(COPY.notices.retry);
    expect(html).not.toContain('role="group"');
  });

  it('says there is nothing new, with the words for the connection', () => {
    cache.value = ready([]);
    expect(render()).toContain(COPY.notices.emptyTitle);
    expect(render()).toContain(COPY.notices.emptyBody);

    online.value = false;
    expect(render()).toContain(COPY.notices.offlineBody);
  });

  it('shows the body as text, never as HTML', () => {
    cache.value = ready([
      announcement({
        id: 'a-html',
        title: '<b>Bold title</b>',
        body: '<img src=x onerror="alert(1)">',
      }),
    ]);

    const html = render();

    expect(html).toContain('&lt;b&gt;Bold title&lt;/b&gt;');
    expect(html).not.toContain('<img src=x');
  });

  it('shows the credit for the photo over the hero', () => {
    expect(render()).toContain('MediaMOF and Jesu-loba');
  });
});
