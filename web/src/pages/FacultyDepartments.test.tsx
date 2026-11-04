import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Department, Faculty } from '../api/types';

// The school page is rendered once, as the server would, against a faked cache read.
const cache: { value: unknown } = { value: null };
vi.mock('../lib/useCachedRows', () => ({
  useCachedRows: () => ({
    result: cache.value,
    retry: () => {},
    progress: { running: false, firstRun: false, pages: 0 },
  }),
}));
vi.mock('../lib/offline', () => ({
  readFaculty: async () => null,
  readDepartments: async () => [],
}));

import FacultyDepartments from './FacultyDepartments';

const STAMP = '2026-10-25T09:00:00.000+01:00';
const FACULTY = 'f-soc';

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

function department(over: Partial<Department> & { id: string }): Department {
  return {
    faculty_id: FACULTY,
    name: 'Some Department',
    short_name: null,
    verification: { status: 'unverified', source: 'campustimesng.com' },
    updated_at: STAMP,
    ...over,
  };
}

const DEPARTMENTS: Department[] = [
  department({ id: 'd-csc', name: 'Computer Science', short_name: 'CSC' }),
  department({ id: 'd-cys', name: 'Cyber Security', short_name: 'CYS' }),
  department({ id: 'd-ift', name: 'Information Technology' }),
];

function render(path = `/academics/${FACULTY}`): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/academics/:facultyId" element={<FacultyDepartments />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  cache.value = {
    state: 'ready',
    value: { faculty: faculty(), departments: DEPARTMENTS },
  };
});

describe('FacultyDepartments', () => {
  it('opens on the school card, with a way back to the grid', () => {
    const html = render();

    expect(html).toContain('head-card');
    expect(html).toContain('School of Computing');
    expect(html).toContain('Back to Schools');
    expect(html).toContain('href="/academics"');
  });

  it('names the school symbol and how many departments it runs', () => {
    const html = render();

    expect(html).toContain('head-card__icon');
    expect(html.match(/3 Departments/g)).toHaveLength(2);
  });

  it('shows the school photo where one exists, and draws the rest', () => {
    const photo = render();
    expect(photo).toContain('/photos/computing-l.webp');
    expect(photo).not.toContain('class="scene"');

    cache.value = {
      state: 'ready',
      value: { faculty: faculty({ name: 'School of Basic Medical Sciences' }), departments: [] },
    };

    const drawn = render();
    expect(drawn).not.toContain('/photos/');
    expect(drawn).toContain('class="scene"');
  });

  it('carries the school seal and its date', () => {
    const html = render();

    expect(html).toContain('seal--unverified');
    expect(html).toContain('Not verified yet');
    expect(html).toContain('head-card__body');
    expect(html).toContain('Updated 25 Oct 2026');
    expect(html).toContain('Source');
  });

  it('lists every department as a row that opens it', () => {
    const html = render();

    expect(html).toContain('Departments');
    expect(html.match(/class="row"/g)).toHaveLength(3);
    expect(html).toContain('href="/academics/f-soc/d-csc"');
    expect(html).toContain('Computer Science');
    expect(html).toContain('CSC');
    expect(html).toContain('Information Technology');
  });

  it('says so when the school has no departments yet', () => {
    cache.value = { state: 'ready', value: { faculty: faculty(), departments: [] } };

    const html = render();

    expect(html).toContain('No department don dey added for this school yet.');
    expect(html.match(/class="row"/g)).toBeNull();
  });

  it('waits while the cache is read', () => {
    cache.value = { state: 'loading' };

    const html = render();

    expect(html).toContain('Dey load');
    expect(html).toContain('Back to Schools');
    expect(html).not.toContain('School of Computing');
  });

  it('says something went wrong, and offers to try again', () => {
    cache.value = { state: 'error' };

    const html = render();

    expect(html).toContain('Something spoil small');
    expect(html).toContain('Try again. If e still no work, restart Sabi.');
    expect(html).toContain('Try again');
  });

  it('says the school is not on this phone, rather than drawing an empty one', () => {
    cache.value = { state: 'ready', value: { faculty: null, departments: [] } };

    const html = render();

    expect(html).toContain('We no see am');
    expect(html).toContain('E fit don commot or e never dey saved on this phone.');
    expect(html).not.toContain('head-card');
  });

  it('names the photo licence when it shows a photo', () => {
    expect(render()).toContain('Photos: Kaizenify (public domain)');

    cache.value = {
      state: 'ready',
      value: { faculty: faculty({ name: 'School of Basic Medical Sciences' }), departments: [] },
    };

    expect(render()).not.toContain('Photos: Kaizenify');
  });
});
