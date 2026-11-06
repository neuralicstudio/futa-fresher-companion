import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Announcement, Department, Faculty } from '../api/types';

// The screen is rendered once, as the server would, against a faked cache read.
const cache: { value: unknown } = { value: null };
const auth = { status: 'signed-out' as const, user: null };

vi.mock('../lib/useCachedRows', () => ({
  useCachedRows: () => ({
    result: cache.value,
    retry: () => {},
    progress: { running: false, firstRun: false, pages: 0 },
  }),
}));
vi.mock('../lib/auth', () => ({ useAuth: () => auth }));
vi.mock('../lib/offline', () => ({ readNoticeScreen: async () => ({}) }));

import NoticeDetail from './NoticeDetail';
import { COPY } from '../copy/pidgin';

const STAMP = '2026-10-26T09:00:00.000+01:00';
const FACULTY = 'f-soc';
const DEPT = 'd-csc';

function announcement(over: Partial<Announcement> = {}): Announcement {
  return {
    id: 'n2',
    title: 'SUG registration now open',
    body: 'All freshers are to complete their SUG registration before Friday.',
    scope: 'sug',
    faculty_id: null,
    department_id: null,
    author_id: 'u-sug',
    published_at: '2026-10-25T09:00:00.000+01:00',
    expires_at: null,
    verification: { status: 'unverified', source: 'SUG' },
    updated_at: STAMP,
    ...over,
  };
}

function faculty(over: Partial<Faculty> = {}): Faculty {
  return {
    id: FACULTY,
    name: 'School of Computing',
    short_name: 'SOC',
    verification: { status: 'verified', source: 'The Registry' },
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
    verification: { status: 'verified', source: 'The Registry' },
    updated_at: STAMP,
    ...over,
  };
}

function ready(over: Partial<Announcement> | null = {}) {
  return {
    state: 'ready',
    value: {
      announcement: over ? announcement(over) : null,
      faculties: [faculty()],
      departments: [department()],
    },
  };
}

function renderNotice(over: Partial<Announcement> = {}): string {
  cache.value = ready(over);
  return render();
}

function render(id = 'n2'): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[`/announcements/${id}`]}>
      <Routes>
        <Route path="/announcements/:id" element={<NoticeDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  cache.value = ready();
});

describe('Notice detail', () => {
  it('opens on the plain bar, with the way back and the screen s name', () => {
    const html = render();

    expect(html).toContain('app-header__back');
    expect(html).toContain(COPY.notice.back);
    expect(html).toContain(`href="/announcements"`);
    expect(html).toContain(`<h1 class="app-header__title">${COPY.notice.title}</h1>`);
    expect(html).toContain(COPY.notice.kicker);
  });

  it('draws one gold-outlined card with the scope, the day and the source', () => {
    const html = render();

    expect(html).toContain('card card--hl notice-full');
    expect(html).toContain('chip--scope-red');
    expect(html).toContain('>SUG<');
    expect(html).toContain('Posted 25 Oct 2026');
    expect(html).toContain('SUG registration now open');
    expect(html).toContain('From SUG');
    expect(html).toContain('All freshers are to complete their SUG registration');
  });

  it('shows the whole body, not the list s three lines', () => {
    const html = renderNotice({ body: 'One.\n\nTwo.' });

    expect(html).not.toContain('clamp3');
    expect(html).toContain('<div class="prose"><p>One.</p><p>Two.</p></div>');
  });

  it('names who the notice is for and that it has no expiry', () => {
    const html = render();

    expect(html).toContain(`<dt>${COPY.notice.forLabel}</dt><dd>Everyone</dd>`);
    expect(html).toContain(`<dt>${COPY.notice.expiresLabel}</dt><dd>${COPY.notice.noExpiry}</dd>`);
  });

  it('says "my school" for a school notice and the date it lapses', () => {
    const html = renderNotice({
      scope: 'faculty',
      faculty_id: FACULTY,
      verification: { status: 'verified', source: '' },
      expires_at: '2026-11-20T23:59:00+01:00',
    });

    expect(html).toContain('<dd>My school</dd>');
    expect(html).toContain('<dd>20 Nov 2026</dd>');
    // A blank source falls back to the school's name, as on the list.
    expect(html).toContain('From School of Computing');
  });

  it('says "my department" for a department notice', () => {
    const html = renderNotice({
      scope: 'department',
      department_id: DEPT,
      verification: { status: 'verified', source: 'CSC office' },
    });

    expect(html).toContain('<dd>My department</dd>');
    expect(html).toContain('From CSC office');
  });

  it('explains where the words came from', () => {
    const html = render();

    expect(html).toContain(COPY.notice.sourceTitle);
    expect(html).toContain(COPY.notice.sourceHelp);
  });

  it('offers Share and a gold way back to the list', () => {
    const html = render();

    expect(html).toContain(COPY.notice.share);
    expect(html).toContain('btn btn--outline');
    expect(html).toContain('btn btn--gold');
    expect(html).toContain('role="status"');
    expect(html).toContain(COPY.notice.back);
  });

  it('shows the body as text, never as HTML', () => {
    const html = renderNotice({ title: '<b>Bold</b>', body: '<img src=x onerror="alert(1)">' });

    expect(html).toContain('&lt;b&gt;Bold&lt;/b&gt;');
    expect(html).not.toContain('<img src=x');
  });

  it('draws the not-found card for a notice this phone has not saved', () => {
    cache.value = ready(null);
    const html = render('gone');

    expect(html).toContain(COPY.notice.notFoundTitle);
    expect(html).toContain(COPY.notice.notFoundBody);
    expect(html).not.toContain('notice-full');
    expect(html).not.toContain(COPY.notice.share);
  });

  it('shows the shape of the card while the cache is read', () => {
    cache.value = { state: 'loading' };
    const html = render();

    expect(html).toContain('skeleton');
    expect(html).not.toContain('notice-full');
  });

  it('offers a retry inside the card when the cache cannot be read', () => {
    cache.value = { state: 'error' };
    const html = render();

    expect(html).toContain(COPY.notices.errorTitle);
    expect(html).toContain(COPY.notices.retry);
  });

  it('sends the reader to the photo credits from the footer', () => {
    expect(render()).toContain('href="/credits"');
  });
});
