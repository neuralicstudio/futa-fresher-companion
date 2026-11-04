import { describe, expect, it } from 'vitest';
import type { Announcement } from '../api/types';
import {
  announcementsForDisplay,
  emptyBody,
  emptyFilteredText,
  filterChoices,
  filterLabel,
  namesById,
  noticeDate,
  noticesFor,
  NOTICE_FILTERS,
  previewText,
  scopeDetail,
  scopeName,
  scopeTone,
  searchableText,
  sortNewestFirst,
  sourceLine,
} from './announcementsView';
import { SAVING_MESSAGE } from './academicsView';
import { COPY } from '../copy/pidgin';

const NOW = Date.parse('2026-10-21T12:00:00.000Z');
const HOUR = 60 * 60 * 1000;
const FACULTY = 'f-soc';
const DEPT = 'd-csc';

function announcement(overrides: Partial<Announcement> = {}): Announcement {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Registration opens',
    body: 'Register on the portal.',
    scope: 'university',
    faculty_id: null,
    department_id: null,
    author_id: '00000000-0000-4000-8000-0000000000aa',
    published_at: '2026-10-20T09:00:00.000Z',
    expires_at: null,
    verification: { status: 'verified', source: 'Registrar notice' },
    updated_at: '2026-10-20T09:00:00.000Z',
    ...overrides,
  };
}

const FACULTIES = namesById([{ id: FACULTY, name: 'School of Computing' }]);
const DEPARTMENTS = namesById([{ id: DEPT, name: 'Computer Science' }]);

describe('announcementsForDisplay: expired items', () => {
  it('hides an announcement whose expiry has passed', () => {
    const expired = announcement({
      id: 'a',
      expires_at: new Date(NOW - HOUR).toISOString(),
    });

    expect(announcementsForDisplay([expired], NOW)).toEqual([]);
  });

  it('keeps an announcement with no expiry, and one that expires later', () => {
    const open = announcement({ id: 'open', expires_at: null });
    const later = announcement({ id: 'later', expires_at: new Date(NOW + HOUR).toISOString() });

    expect(announcementsForDisplay([open, later], NOW).map((a) => a.id).sort()).toEqual([
      'later',
      'open',
    ]);
  });

  it('keeps expired rows in the input (they are hidden, not deleted)', () => {
    const rows = [announcement({ id: 'x', expires_at: new Date(NOW - HOUR).toISOString() })];

    announcementsForDisplay(rows, NOW);

    expect(rows).toHaveLength(1);
  });
});

describe('ordering', () => {
  it('sorts newest published first', () => {
    const older = announcement({ id: 'older', published_at: '2026-10-18T09:00:00.000Z' });
    const newest = announcement({ id: 'newest', published_at: '2026-10-21T08:00:00.000Z' });
    const middle = announcement({ id: 'middle', published_at: '2026-10-19T09:00:00.000Z' });

    expect(sortNewestFirst([older, newest, middle]).map((a) => a.id)).toEqual([
      'newest',
      'middle',
      'older',
    ]);
  });

  it('breaks equal publish times by id, larger first, the same order as the API', () => {
    const low = announcement({ id: '00000000-0000-4000-8000-000000000001' });
    const high = announcement({ id: '00000000-0000-4000-8000-000000000009' });

    expect(sortNewestFirst([low, high]).map((a) => a.id)).toEqual([high.id, low.id]);
  });

  it('does not change the input order', () => {
    const rows = [
      announcement({ id: 'a', published_at: '2026-10-18T00:00:00.000Z' }),
      announcement({ id: 'b', published_at: '2026-10-21T00:00:00.000Z' }),
    ];

    sortNewestFirst(rows);

    expect(rows.map((r) => r.id)).toEqual(['a', 'b']);
  });
});

describe('scope chip', () => {
  it('names the four scopes as the design does', () => {
    expect(scopeName('university')).toBe('University');
    expect(scopeName('sug')).toBe('SUG');
    expect(scopeName('faculty')).toBe('School');
    expect(scopeName('department')).toBe('Department');
  });

  it('gives each scope the design colour', () => {
    expect(scopeTone('university')).toBe('gold');
    expect(scopeTone('sug')).toBe('red');
    expect(scopeTone('faculty')).toBe('green');
    expect(scopeTone('department')).toBe('indigo');
  });

  it('names the school or department from the cache', () => {
    expect(
      scopeDetail(announcement({ scope: 'faculty', faculty_id: FACULTY }), FACULTIES, DEPARTMENTS),
    ).toBe('School of Computing');
    expect(
      scopeDetail(
        announcement({ scope: 'department', department_id: DEPT }),
        FACULTIES,
        DEPARTMENTS,
      ),
    ).toBe('Computer Science');
  });

  it('says so when the name is not in the cache, instead of showing an id', () => {
    const label = scopeDetail(
      announcement({ scope: 'faculty', faculty_id: 'f-unknown' }),
      FACULTIES,
      DEPARTMENTS,
    );

    expect(label).toBe('name not available on this device');
    expect(label).not.toContain('f-unknown');
  });

  it('falls back to the scope word for the two whole-campus scopes', () => {
    expect(scopeDetail(announcement({ scope: 'university' }), FACULTIES, DEPARTMENTS)).toBe(
      'University',
    );
    expect(scopeDetail(announcement({ scope: 'sug' }), FACULTIES, DEPARTMENTS)).toBe('SUG');
  });
});

describe('the trust line', () => {
  it('names the source the notice carries', () => {
    expect(sourceLine(announcement(), FACULTIES, DEPARTMENTS)).toBe('From Registrar notice');
  });

  it('falls back to the scope when the source is blank', () => {
    const item = announcement({
      scope: 'faculty',
      faculty_id: FACULTY,
      verification: { status: 'unverified', source: '   ' },
    });

    expect(sourceLine(item, FACULTIES, DEPARTMENTS)).toBe('From School of Computing');
  });
});

describe('noticeDate', () => {
  it('shows the Nigerian date in the design form', () => {
    expect(noticeDate('2026-10-20T23:30:00Z')).toBe('21 Oct 2026');
  });

  it('shows nothing for a value that is not a date', () => {
    expect(noticeDate('nope')).toBe('');
  });
});

describe('the filter chips', () => {
  it('runs in the design order', () => {
    expect(NOTICE_FILTERS).toEqual(['all', 'university', 'sug', 'school', 'department']);
  });

  it('labelled from the copy file', () => {
    expect(filterLabel('school')).toBe(COPY.notices.filters.school);
    expect(filterLabel('department')).toBe(COPY.notices.filters.department);
  });

  it('offers only the whole-campus chips to a guest', () => {
    expect(filterChoices(null, null)).toEqual(['all', 'university', 'sug']);
  });

  it('adds "My school" once the profile names a school', () => {
    expect(filterChoices(FACULTY, null)).toEqual(['all', 'university', 'sug', 'school']);
  });

  it('adds both when both are known', () => {
    expect(filterChoices(FACULTY, DEPT)).toEqual([
      'all',
      'university',
      'sug',
      'school',
      'department',
    ]);
  });
});

describe('the list under the chips and the search box', () => {
  const faculty = announcement({
    id: 'fac',
    scope: 'faculty',
    faculty_id: FACULTY,
    title: 'Orientation week',
    body: 'Bring your admission letter.',
    verification: { status: 'verified', source: 'School of Computing' },
  });
  const otherFaculty = announcement({
    id: 'other-fac',
    scope: 'faculty',
    faculty_id: 'f-other',
    title: 'Other school news',
    verification: { status: 'unverified', source: 'Another school' },
  });
  const department = announcement({
    id: 'dept',
    scope: 'department',
    department_id: DEPT,
    title: 'CSC 101 venue change',
    body: 'Lecture Theatre A1 is now A2.',
    verification: { status: 'verified', source: 'Computer Science department' },
  });
  const sug = announcement({
    id: 'sug',
    scope: 'sug',
    title: 'SUG registration open',
    verification: { status: 'unverified', source: 'SUG' },
  });
  const university = announcement({ id: 'uni', scope: 'university', title: 'Academic calendar' });
  const rows = [university, sug, department, faculty, otherFaculty];
  const guest = { filter: 'all' as const, query: '', facultyId: null, departmentId: null };
  const student = { ...guest, facultyId: FACULTY, departmentId: DEPT };

  it('shows everything under All', () => {
    expect(noticesFor(rows, guest, FACULTIES, DEPARTMENTS)).toHaveLength(rows.length);
  });

  it('keeps one scope for University and SUG', () => {
    const state = { ...guest, filter: 'university' as const };
    expect(noticesFor(rows, state, FACULTIES, DEPARTMENTS).map((r) => r.id)).toEqual(['uni']);
  });

  it('keeps only the student s own school under "My school"', () => {
    const state = { ...student, filter: 'school' as const };
    expect(noticesFor(rows, state, FACULTIES, DEPARTMENTS).map((r) => r.id)).toEqual(['fac']);
  });

  it('keeps only the student s own department under "My department"', () => {
    const state = { ...student, filter: 'department' as const };
    expect(noticesFor(rows, state, FACULTIES, DEPARTMENTS).map((r) => r.id)).toEqual(['dept']);
  });

  it('shows nothing for a personal chip when the profile has no id', () => {
    const state = { ...guest, filter: 'school' as const };
    expect(noticesFor(rows, state, FACULTIES, DEPARTMENTS)).toEqual([]);
  });

  it('searches the title, the body, the source and the school name', () => {
    const state = { ...student, query: 'venue' };
    expect(noticesFor(rows, state, FACULTIES, DEPARTMENTS).map((r) => r.id)).toEqual(['dept']);

    expect(
      noticesFor(rows, { ...guest, query: 'registrar' }, FACULTIES, DEPARTMENTS).map((r) => r.id),
    ).toEqual(['uni']);
    expect(
      noticesFor(rows, { ...guest, query: 'computing' }, FACULTIES, DEPARTMENTS).map((r) => r.id),
    ).toEqual(['fac']);
  });

  it('ignores case and surrounding spaces', () => {
    const state = { ...guest, query: '  ACADEMIC  ' };
    expect(noticesFor(rows, state, FACULTIES, DEPARTMENTS).map((r) => r.id)).toEqual(['uni']);
  });

  it('puts the chip and the search together', () => {
    const state = { ...student, filter: 'school' as const, query: 'lecture' };
    expect(noticesFor(rows, state, FACULTIES, DEPARTMENTS)).toEqual([]);
  });

  it('builds the searchable text from what the card shows', () => {
    const text = searchableText(department, FACULTIES, DEPARTMENTS);

    expect(text).toContain('csc 101 venue change');
    expect(text).toContain('lecture theatre a1 is now a2');
    expect(text).toContain('computer science');
  });
});

describe('what an empty list says', () => {
  it('says the list is coming while the first sync runs', () => {
    expect(emptyBody({ running: true, firstRun: true }, true)).toBe(SAVING_MESSAGE);
  });

  it('explains an empty cache when offline', () => {
    expect(emptyBody({ running: false, firstRun: false }, false)).toBe(COPY.notices.offlineBody);
  });

  it('says there is nothing new when online and all caught up', () => {
    expect(emptyBody({ running: false, firstRun: false }, true)).toBe(COPY.notices.emptyBody);
  });

  it('names the school in the filtered empty line', () => {
    expect(emptyFilteredText('school', FACULTIES, DEPARTMENTS, FACULTY, DEPT)).toBe(
      'No notice from School of Computing yet.',
    );
  });

  it('names the department in the filtered empty line', () => {
    expect(emptyFilteredText('department', FACULTIES, DEPARTMENTS, FACULTY, DEPT)).toBe(
      'No notice from Computer Science yet.',
    );
  });

  it('uses the chip word when the name is not cached', () => {
    expect(emptyFilteredText('school', new Map(), new Map(), null, null)).toBe(
      'No notice from My school yet.',
    );
  });
});

describe('previewText', () => {
  it('leaves a short body as it is', () => {
    expect(previewText('Short body.', 140)).toBe('Short body.');
  });

  it('cuts a long body and adds an ellipsis', () => {
    const preview = previewText('a'.repeat(200), 140);

    expect(preview).toBe(`${'a'.repeat(140)}…`);
  });

  it('counts characters, not UTF-16 units, so an emoji is not split', () => {
    const body = '😀'.repeat(10);

    expect(previewText(body, 5)).toBe(`${'😀'.repeat(5)}…`);
  });

  it('keeps HTML as plain text. Nothing here parses it.', () => {
    const body = '<img src=x onerror="alert(1)"><b>bold</b>';

    expect(previewText(body)).toBe(body);
  });
});
