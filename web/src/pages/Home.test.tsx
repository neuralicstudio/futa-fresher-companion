import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Announcement, Building, Course, TimetableEntry, User } from '../api/types';
import type { AuthStatus } from '../lib/auth';

// Home is rendered once, as the server would, against a faked cache and auth. The clock is
// pinned to Tuesday 3 November 2026, 09:48, so the 10:00 lecture is 12 minutes away, the same
// reading as the approved mockup (docs/design/screenshots/home-390.webp).
const auth: { status: AuthStatus; user: User | null } = { status: 'signed-out', user: null };
const read: { value: unknown } = { value: null };
vi.mock('../lib/auth', () => ({ useAuth: () => auth }));
vi.mock('../lib/useCachedRows', () => ({ useCachedRows: () => ({ result: read.value }) }));
vi.mock('../lib/offline', () => ({ readHomeScreen: async () => ({}) }));

import Home from './Home';

const STAMP = '2026-10-25T09:00:00.000+01:00';
const VERIFICATION = { status: 'verified' as const, source: 'Collected data' };

const STUDENT: User = {
  id: 'u1',
  full_name: 'Sade Falana',
  email: 'sade@example.com',
  role: 'student',
  matric_no: null,
  department_id: 'd1',
  faculty_id: 'f1',
  level: 100,
};

const BUILDINGS: Building[] = [
  { id: 'b-gate', name: 'Main gate', type: 'gate', description: null, lat: 7.3, lng: 5.14, verification: VERIFICATION, updated_at: STAMP },
  { id: 'b-lib', name: 'Albert Ilemobade Library', type: 'library', description: null, lat: 7.3, lng: 5.14, verification: VERIFICATION, updated_at: STAMP },
  { id: 'b-comp', name: 'School of Computing', type: 'department', description: null, lat: 7.3, lng: 5.14, verification: VERIFICATION, updated_at: STAMP },
  { id: 'b-phys', name: 'Department of Physics', type: 'faculty', description: null, lat: 7.3, lng: 5.14, verification: VERIFICATION, updated_at: STAMP },
  { id: 'b-a1', name: 'Lecture Theatre A1', type: 'other', description: null, lat: 7.3, lng: 5.14, verification: VERIFICATION, updated_at: STAMP },
];

const COURSES: Course[] = [
  { id: 'c1', department_id: 'd1', code: 'CSC 101', title: 'Computer Science 101', units: 3, level: 100, semester: 1, verification: VERIFICATION, updated_at: STAMP },
];

const ENTRIES: TimetableEntry[] = [
  { id: 't1', department_id: 'd1', level: 100, semester: 1, course_id: 'c1', day_of_week: 2, start_time: '10:00', end_time: '11:00', venue_building_id: 'b-a1', venue_note: null, verification: VERIFICATION, updated_at: STAMP },
];

const NOTICES: Announcement[] = [
  {
    id: 'a1',
    title: 'SUG registration now open',
    body: 'All freshers and returning students are to complete their SUG registration before the deadline.',
    scope: 'sug',
    faculty_id: null,
    department_id: null,
    author_id: 'u2',
    published_at: STAMP,
    expires_at: null,
    verification: { status: 'verified', source: 'SUG notice' },
    updated_at: STAMP,
  },
];

function ready(value: unknown) {
  read.value = { state: 'ready', value };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 3, 9, 48));
  auth.status = 'signed-in';
  auth.user = STUDENT;
  ready({
    announcements: NOTICES,
    buildings: BUILDINGS,
    timetable: { department: undefined, entries: ENTRIES, courses: COURSES, buildings: BUILDINGS },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

function render(): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

describe('Home with a saved timetable', () => {
  it('counts down to the next lecture and names it', () => {
    const html = render();

    expect(html).toContain('badge-ring');
    expect(html).toContain('>12<');
    expect(html).toContain('to my next class');
    expect(html).toContain('CSC 101');
    expect(html).toContain('Computer Science 101');
    expect(html).toContain('10:00 AM to 11:00 AM');
    expect(html).toContain('Lecture Theatre A1');
  });

  it('shows the latest notice with its source and date, never a Verified badge', () => {
    const html = render();

    expect(html).toContain('SUG registration now open');
    expect(html).toContain('From SUG on 25 Oct 2026');
    expect(html).not.toContain('Verified');
  });

  it('numbers four places, with the way to their credits', () => {
    const html = render();

    expect(html).toContain('Main gate');
    expect(html).toContain('Albert Ilemobade Library');
    expect(html).toContain('School of Computing');
    expect(html).toContain('Department of Physics');
    expect(html).toContain('>1<');
    expect(html).toContain('>4<');
    expect(html).toContain('href="/credits"');
  });

  it('links the lecture arrow to the student’s own timetable', () => {
    expect(render()).toContain('/academics/f1/d1/timetable');
  });
});

describe('Home without a placement', () => {
  it('asks for a department instead of inventing a next class, and has no badge', () => {
    auth.status = 'signed-out';
    auth.user = null;
    ready({ announcements: [], buildings: [], timetable: null });

    const html = render();

    expect(html).not.toContain('badge-ring');
    expect(html).toContain('Add your department and level to see your next class here.');
    expect(html).toContain('Add your timetable');
    expect(html).toContain('No notice yet.');
    expect(html).not.toContain('Popular places');
  });

  it('shows the loading line while the cache is being read', () => {
    read.value = { state: 'loading' };

    expect(render()).toContain('Dey load');
  });
});
