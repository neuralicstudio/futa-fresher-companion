import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Building, Course, Department, TimetableEntry, User } from '../api/types';

// The screen is rendered once, as the server would, against a faked cache read.
const cache: { value: unknown } = { value: null };
const auth: { status: 'loading' | 'signed-in' | 'signed-out'; user: User | null } = {
  status: 'signed-out',
  user: null,
};

vi.mock('../lib/useCachedRows', () => ({
  useCachedRows: () => ({
    result: cache.value,
    retry: () => {},
    progress: { running: false, firstRun: false, pages: 0 },
  }),
}));
vi.mock('../lib/auth', () => ({ useAuth: () => auth }));
vi.mock('../lib/offline', () => ({ readTimetableScreen: async () => ({}) }));

import Timetable from './Timetable';
import { COPY } from '../copy/pidgin';

const STAMP = '2026-10-20T09:00:00.000+01:00';
const FACULTY = 'f-soc';
const DEPT = 'd-csc';
const COURSE = 'c-csc101';
const HALL = 'b-lt1';
const VERIFICATION = { status: 'verified' as const, source: 'Department notice board' };

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

function entry(over: Partial<TimetableEntry> & { id: string }): TimetableEntry {
  return {
    department_id: DEPT,
    level: 100,
    semester: 1,
    course_id: COURSE,
    day_of_week: 2,
    start_time: '10:00',
    end_time: '11:00',
    venue_building_id: HALL,
    venue_note: null,
    verification: VERIFICATION,
    updated_at: STAMP,
    ...over,
  };
}

function course(over: Partial<Course> & { id: string }): Course {
  return {
    department_id: DEPT,
    code: 'CSC 101',
    title: 'Computer Science 101',
    units: 3,
    level: 100,
    semester: 1,
    verification: VERIFICATION,
    updated_at: STAMP,
    ...over,
  };
}

function building(over: Partial<Building> & { id: string }): Building {
  return {
    name: 'Lecture Theatre A1',
    type: 'lecture_hall',
    description: null,
    lat: 7.296,
    lng: 5.145,
    verification: VERIFICATION,
    updated_at: STAMP,
    ...over,
  };
}

function user(over: Partial<User> = {}): User {
  return {
    id: 'u-1',
    email: 'student@futa.edu.ng',
    full_name: 'Tola Ade',
    role: 'student',
    faculty_id: FACULTY,
    department_id: DEPT,
    level: 100,
    ...over,
  } as User;
}

function ready(
  entries: TimetableEntry[],
  over: { department?: Department | undefined; courses?: Course[]; buildings?: Building[] } = {},
) {
  return {
    state: 'ready',
    value: {
      department: 'department' in over ? over.department : department(),
      entries,
      courses: over.courses ?? [course({ id: COURSE })],
      buildings: over.buildings ?? [building({ id: HALL })],
    },
  };
}

function render(path = `/academics/${FACULTY}/${DEPT}/timetable`): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/academics/:facultyId/:departmentId/timetable" element={<Timetable />} />
      </Routes>
    </MemoryRouter>,
  );
}

// Tuesday 20 October 2026, 09:48 in the device's own time zone: 12 minutes before the class.
const TUESDAY = new Date(2026, 9, 20, 9, 48);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(TUESDAY);
  auth.status = 'signed-out';
  auth.user = null;
  cache.value = ready([entry({ id: 'e1' })]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Timetable', () => {
  it('opens on the week, with the count of what is next', () => {
    const html = render();

    expect(html).toContain(COPY.timetable.kicker);
    expect(html).toContain(COPY.timetable.title);
    expect(html).toContain('See your classes for the week, know what');
    expect(html).toContain('>100 Level<');
    expect(html).toContain('>First semester<');
    expect(html).toContain('>Tuesday, Oct 20<');
    expect(html).toContain(COPY.timetable.nextClass);
    expect(html).toContain('>CSC 101<');
    expect(html).toContain('>Computer Science 101<');
    expect(html).toContain('10:00 AM to 11:00 AM');
    expect(html).toContain('Next up, in 12 min');
    expect(html).toContain('Lecture Theatre A1');
  });

  it('marks today on the strip and selects it to begin with', () => {
    const html = render();
    const beforeTuesday = html.slice(0, html.indexOf('>Tue<'));
    const tuesday = beforeTuesday.slice(beforeTuesday.lastIndexOf('<button'));

    expect(tuesday).toContain('aria-current="date"');
    expect(tuesday).toContain('aria-pressed="true"');
  });

  it('shows the next day too, with a rest card when it is empty', () => {
    const html = render();

    expect(html).toContain('>Wednesday, Oct 21<');
    expect(html).toContain(COPY.timetable.emptyDayTitle);
    expect(html).toContain(COPY.timetable.emptyDayBody);
  });

  it('offers every level and semester the department runs', () => {
    cache.value = ready([
      entry({ id: 'e1', level: 100, semester: 1 }),
      entry({ id: 'e2', level: 100, semester: 2 }),
      entry({ id: 'e3', level: 200, semester: 2 }),
    ]);

    const html = render();

    expect(html).toContain('>100 Level<');
    expect(html).toContain('>200 Level<');
    expect(html).toContain('>First semester<');
    expect(html).toContain('>Second semester<');
  });

  it('says so when a class has no course or venue saved on this phone', () => {
    cache.value = ready(
      [entry({ id: 'e1', course_id: 'missing', venue_building_id: null, venue_note: null })],
      { courses: [], buildings: [] },
    );

    const html = render();

    expect(html).toContain(COPY.timetable.courseMissing);
    expect(html).toContain(COPY.timetable.venueMissing);
  });

  it('sends the reader to the photo credits from the footer', () => {
    expect(render()).toContain('href="/credits"');
  });

  it('shows the shape of the screen while the cache is read', () => {
    cache.value = { state: 'loading' };
    const html = render();

    expect(html).toContain(COPY.timetable.loading);
    expect(html).toContain('skeleton');
  });

  it('offers a retry when the cache cannot be read', () => {
    cache.value = { state: 'error' };
    const html = render();

    expect(html).toContain(COPY.timetable.errorTitle);
    expect(html).toContain(COPY.timetable.errorBody);
    expect(html).toContain(COPY.timetable.retry);
  });

  it('says so when the department is not saved on this phone', () => {
    cache.value = ready([], { department: undefined });
    const html = render();

    expect(html).toContain(COPY.states.notFoundTitle);
    expect(html).toContain(COPY.academics.notFound);
  });

  it('points a department with no timetable at its own screen', () => {
    cache.value = ready([]);
    const html = render();

    expect(html).toContain(COPY.timetable.notAddedTitle);
    expect(html).toContain(`href="/academics/${FACULTY}/${DEPT}"`);
    expect(html).toContain(COPY.timetable.contactDept);
    expect(html).not.toContain('class="days"');
  });

  it('uses the signed-in student’s department on its own tab', () => {
    auth.status = 'signed-in';
    auth.user = user();

    const html = render('/timetable');

    expect(html).toContain('>CSC 101<');
    expect(html).toContain(COPY.timetable.nextClass);
  });

  it('asks a guest for a department first', () => {
    const html = render('/timetable');

    expect(html).toContain(COPY.timetable.chooseDepartmentTitle);
    expect(html).toContain(`href="/register"`);
    expect(html).toContain(COPY.timetable.chooseDepartment);
  });

  it('sends a signed-in student with no department to the schools list', () => {
    auth.status = 'signed-in';
    auth.user = user({ department_id: null });

    const html = render('/timetable');

    expect(html).toContain(COPY.timetable.chooseDepartmentTitle);
    expect(html).toContain('href="/academics"');
  });

  it('waits for the profile before asking a signed-in student for a department', () => {
    auth.status = 'loading';
    const html = render('/timetable');

    expect(html).toContain(COPY.timetable.loading);
    expect(html).not.toContain(COPY.timetable.chooseDepartmentTitle);
  });
});
