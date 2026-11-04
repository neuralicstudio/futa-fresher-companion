import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Course, Department, Faculty, Lecturer } from '../api/types';

// The department panel is rendered once, as the server would, against a faked cache read.
const cache: { value: unknown } = { value: null };
vi.mock('../lib/useCachedRows', () => ({
  useCachedRows: () => ({
    result: cache.value,
    retry: () => {},
    progress: { running: false, firstRun: false, pages: 0 },
  }),
}));
vi.mock('../lib/offline', () => ({
  readDepartmentScreen: async () => ({ department: undefined, courses: [], lecturers: [] }),
  readFaculty: async () => null,
}));

import DepartmentDetail from './DepartmentDetail';

const STAMP = '2026-10-25T09:00:00.000+01:00';
const FACULTY = 'f-soc';
const DEPT = 'd-csc';

function faculty(over: Partial<Faculty> = {}): Faculty {
  return {
    id: FACULTY,
    name: 'School of Computing',
    short_name: 'SOC',
    verification: { status: 'unverified', source: 'campustimesng.com' },
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
    hod_name: 'Adaeze Okafor',
    office_location: 'SOC 201',
    verification: { status: 'verified', source: 'Department notice board' },
    updated_at: STAMP,
    ...over,
  };
}

function course(over: Partial<Course> & { id: string }): Course {
  return {
    department_id: DEPT,
    code: 'CSC 101',
    title: 'Introduction to Computing',
    units: 3,
    level: 100,
    semester: 1,
    verification: { status: 'verified', source: 'Department notice board' },
    updated_at: STAMP,
    ...over,
  };
}

function lecturer(over: Partial<Lecturer> & { id: string }): Lecturer {
  return {
    department_id: DEPT,
    full_name: 'Bola Adeyemi',
    title: null,
    rank: 'Lecturer I',
    email: null,
    office_location: null,
    verification: { status: 'verified', source: 'Department notice board' },
    updated_at: STAMP,
    ...over,
  };
}

const COURSES: Course[] = [
  course({ id: 'c1', code: 'CSC 101', title: 'Introduction to Computing' }),
  course({ id: 'c2', code: 'CSC 201', title: 'Data Structures', units: 2, level: 200 }),
  course({ id: 'c3', code: 'CSC 202', title: 'Algorithms', level: 200 }),
];

const LECTURERS: Lecturer[] = [
  lecturer({ id: 'l1', full_name: 'Adaeze Okafor', title: 'Prof.' }),
  lecturer({ id: 'l2', full_name: 'Bola Adeyemi' }),
  lecturer({ id: 'l3', full_name: 'Chidi Nwosu', email: 'chidi@futa.edu.ng' }),
  lecturer({ id: 'l4', full_name: 'Dayo Fashola' }),
];

/** The markup of one pane, since the hidden panes are rendered too and would double every row. */
function pane(html: string, id: string): string {
  const start = html.indexOf(`id="pane-${id}"`);
  const next = html.indexOf('role="tabpanel"', start + 1);
  return html.slice(start, next === -1 ? undefined : next);
}

function render(path = `/academics/${FACULTY}/${DEPT}`): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/academics/:facultyId/:departmentId" element={<DepartmentDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  cache.value = {
    state: 'ready',
    value: {
      screen: { department: department(), courses: COURSES, lecturers: LECTURERS },
      faculty: faculty(),
    },
  };
});

describe('DepartmentDetail', () => {
  it('opens on the head card, with a way back to the school', () => {
    const html = render();

    expect(html).toContain('head-card');
    expect(html).toContain('Computer Science');
    expect(html).toContain('School of Computing in FUTA');
    expect(html).toContain('Back to Departments');
    expect(html).toContain('href="/academics/f-soc"');
  });

  it('shows the department seal beside its name', () => {
    const html = render();

    expect(html).toContain('seal--verified');
    expect(html).toContain('Verified');
  });

  it('offers the three tabs, with courses open first', () => {
    const html = render();

    expect(html).toContain('role="tablist"');
    expect(html.match(/role="tab"/g)).toHaveLength(3);
    expect(html).toContain('aria-selected="true"');
    expect(html.match(/aria-selected="false"/g)).toHaveLength(2);
    expect(html).toContain('id="tab-courses"');
    expect(html).toContain('id="tab-lecturers"');
    expect(html).toContain('id="tab-about"');
  });

  it('keeps the other two panes out of sight but in the page', () => {
    const html = render();

    expect(html).toMatch(/id="pane-courses"[^>]*aria-labelledby="tab-courses"/);
    expect(html).toMatch(/id="pane-lecturers"[^>]*hidden/);
    expect(html).toMatch(/id="pane-about"[^>]*hidden/);
  });

  it('groups the courses by level, with the code, units and semester', () => {
    const html = render();

    expect(html).toContain('All courses');
    expect(html).toContain('100 Level');
    expect(html).toContain('200 Level');
    expect(html).toContain('CSC 101');
    expect(html).toContain('Introduction to Computing');
    expect(html).toContain('3 units');
    expect(html).toContain('2 units');
    // Non-breaking, so "Semester 1" never splits over two lines.
    expect(html).toContain('Semester 1');
  });

  it('shows the first three lecturers under key lecturers, with a way to the rest', () => {
    const courses = pane(render(), 'courses');
    const all = pane(render(), 'lecturers');

    expect(courses).toContain('Key lecturers');
    expect(courses.match(/class="row row--person"/g)).toHaveLength(3);
    expect(courses).toContain('View all');
    expect(courses).not.toContain('Dayo Fashola');
    expect(all.match(/class="row row--person"/g)).toHaveLength(4);
    expect(all).toContain('Dayo Fashola');
  });

  it('gives each lecturer initials and the rank, with the head of department starred', () => {
    const courses = pane(render(), 'courses');

    expect(courses).toContain('class="avatar avatar--gold"');
    expect(courses).toContain('AO');
    expect(courses).toContain('BA');
    expect(courses).toContain('Lecturer I');
    expect(courses).toContain('Prof. Adaeze Okafor');
    expect(courses).toContain('row__star');
    expect(courses.match(/row__star/g)).toHaveLength(1);
  });

  it('shows the official email where the record has one, and nothing where it has none', () => {
    const all = pane(render(), 'lecturers');

    expect(all).toContain('chidi@futa.edu.ng');
    // The whole row is the tap target, so the address is not a 19 px link of its own.
    expect(all).toContain('href="mailto:chidi@futa.edu.ng"');
    expect(all.match(/<a class="row row--person"/g)).toHaveLength(1);
    expect(all.match(/<div class="row row--person"/g)).toHaveLength(3);
  });

  it('lays the facts and the seal in the About pane, with the way to the timetable', () => {
    const html = render();

    expect(html).toContain('About this department');
    expect(html).toContain('Head of Department');
    expect(html).toContain('Adaeze Okafor');
    expect(html).toContain('SOC 201');
    expect(html).toContain('Department notice board');
    expect(html).toContain('href="/academics/f-soc/d-csc/timetable"');
  });

  it('says the courses and lecturers are not added yet, rather than showing nothing', () => {
    cache.value = {
      state: 'ready',
      value: { screen: { department: department(), courses: [], lecturers: [] }, faculty: faculty() },
    };

    const html = render();

    expect(html).toContain('No course don dey added for this department yet.');
    expect(html).toContain('No lecturer don dey added for this department yet.');
    expect(html).not.toContain('View all');
  });

  it('says the about facts are missing when the record has none', () => {
    cache.value = {
      state: 'ready',
      value: {
        screen: { department: department({ hod_name: null, office_location: null }), courses: [], lecturers: [] },
        faculty: faculty(),
      },
    };

    const html = render();

    expect(html).toContain('Office and head of department never dey saved yet.');
  });

  it('waits while the cache is read', () => {
    cache.value = { state: 'loading' };

    const html = render();

    expect(html).toContain('Dey load');
    expect(html).toContain('Back to Departments');
    expect(html).not.toContain('head-card');
  });

  it('says something went wrong, and offers to try again', () => {
    cache.value = { state: 'error' };

    const html = render();

    expect(html).toContain('Something spoil small');
    expect(html).toContain('Try again');
  });

  it('says the department is not on this phone when the cache has none', () => {
    cache.value = {
      state: 'ready',
      value: { screen: { department: undefined, courses: [], lecturers: [] }, faculty: faculty() },
    };

    const html = render();

    expect(html).toContain('We no see am');
    expect(html).toContain('This department no dey saved on this phone.');
    expect(html).not.toContain('head-card');
  });

  it('treats a department from another school as not found', () => {
    cache.value = {
      state: 'ready',
      value: {
        screen: {
          department: department({ faculty_id: 'f-other' }),
          courses: [],
          lecturers: [],
        },
        faculty: faculty(),
      },
    };

    expect(render()).toContain('This department no dey saved on this phone.');
  });

  it('names the photo licence when the school has a photo', () => {
    expect(render()).toContain('Photos: Kaizenify (public domain)');

    cache.value = {
      state: 'ready',
      value: {
        screen: { department: department(), courses: [], lecturers: [] },
        faculty: faculty({ name: 'School of Basic Medical Sciences' }),
      },
    };

    expect(render()).not.toContain('Photos: Kaizenify');
  });
});
