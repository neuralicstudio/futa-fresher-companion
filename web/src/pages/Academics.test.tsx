import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Department, Faculty } from '../api/types';

// The Academics screen is rendered once, as the server would, against a faked cache and a
// controllable read result.
const cache: { value: unknown } = { value: null };
vi.mock('../lib/useCachedRows', () => ({ useCachedRows: () => ({ result: cache.value }) }));
vi.mock('../lib/offline', () => ({
  readFaculties: async () => [],
  readAllDepartments: async () => [],
}));
vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    status: 'signed-out',
    user: null,
    signIn: async () => {},
    signOut: () => {},
  }),
}));

import Academics from './Academics';

const STAMP = '2026-10-25T09:00:00.000+01:00';

function faculty(over: Partial<Faculty>): Faculty {
  return {
    id: 'f',
    name: 'School of Something',
    short_name: null,
    verification: { status: 'unverified', source: 'campustimesng.com' },
    updated_at: STAMP,
    ...over,
  };
}

function department(over: Partial<Department>): Department {
  return {
    id: 'd',
    faculty_id: 'f',
    name: 'Some Department',
    short_name: null,
    verification: { status: 'unverified', source: 'campustimesng.com' },
    updated_at: STAMP,
    ...over,
  };
}

const FACULTIES: Faculty[] = [
  faculty({ id: 'f-soc', name: 'School of Computing', short_name: 'SOC' }),
  faculty({
    id: 'f-saat',
    name: 'School of Agriculture and Agricultural Technology',
    short_name: 'SAAT',
  }),
  faculty({ id: 'f-one', name: 'School of Physical Sciences', short_name: 'SPS' }),
];

const DEPARTMENTS: Department[] = [
  department({ id: 'd-csc', faculty_id: 'f-soc', name: 'Computer Science', short_name: 'CSC' }),
  department({ id: 'd-cys', faculty_id: 'f-soc', name: 'Cyber Security', short_name: 'CYS' }),
  department({ id: 'd-ifs', faculty_id: 'f-soc', name: 'Information Systems', short_name: 'IFS' }),
  department({ id: 'd-ift', faculty_id: 'f-soc', name: 'Information Technology', short_name: 'IFT' }),
  department({
    id: 'd-aec',
    faculty_id: 'f-saat',
    name: 'Agricultural Extension and Communication Technology',
  }),
  department({ id: 'd-phy', faculty_id: 'f-one', name: 'Physics' }),
];

function render(path = '/academics'): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Academics />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  cache.value = { state: 'ready', value: { faculties: FACULTIES, departments: DEPARTMENTS } };
});

describe('Academics', () => {
  it('opens on the hero, its own header and the search field', () => {
    const html = render();

    expect(html).toContain('Your academics,');
    expect(html).toContain('no');
    expect(html).toContain('stress!');
    expect(html).toContain('Browse FUTA');
    expect(html).toContain('schools, departments, courses and lecturers. Find what you need, fast.');
    expect(html).toContain('app-header');
    expect(html).toContain('/photos/library-l.webp');
    expect(html).toContain('Search for a school, department, course or lecturer');
    expect(html).toContain('id="academics-q"');
  });

  it('lists every saved school as one whole-card link', () => {
    const html = render();

    expect(html).toContain('FUTA Schools');
    expect(html).toContain('3 Schools');
    expect(html.match(/class="school"/g)).toHaveLength(3);
    expect(html).toContain('/academics/f-soc');
    expect(html).toContain('/academics/f-saat');
    expect(html).toContain('School of Agriculture and Agricultural Technology');
  });

  it('says how many departments each school has, counting from the cache', () => {
    const html = render();

    expect(html).toContain('4 Departments');
    expect(html).toContain('1 Department');
  });

  it('shows a photo where the pack has one, and draws the rest', () => {
    const html = render();

    expect(html).toContain('/photos/computing-s.webp');
    expect(html).toContain('/photos/sps-s.webp');
    // Two photos, but a drawing for the school with no photo of its own.
    expect(html.match(/class="scene"/g)).toHaveLength(1);
  });

  it('gives every card an arrow, marked as decoration', () => {
    const html = render();

    expect(html.match(/class="school__go" aria-hidden="true"/g)).toHaveLength(3);
  });

  it('narrows the grid as the student types, and counts what is left', () => {
    const html = render('/academics?q=computing');

    expect(html).toContain('1 Schools');
    expect(html.match(/class="school"/g)).toHaveLength(1);
    expect(html).not.toContain('School of Agriculture');
  });

  it('finds a school by a department the student knows', () => {
    const html = render('/academics?q=computer%20science');

    expect(html).toContain('School of Computing');
    expect(html.match(/class="school"/g)).toHaveLength(1);
  });

  it('says nothing matched, rather than pretending the search was empty', () => {
    const html = render('/academics?q=stadium');

    expect(html).toContain('Nothing match');
    expect(html).toContain('Try another word.');
    expect(html.match(/class="school"/g)).toBeNull();
  });

  it('keeps the query in the field, so it is not lost on a reload', () => {
    const html = render('/academics?q=anatomy');

    expect(html).toContain('value="anatomy"');
  });

  it('says there are no schools yet, and what to do about it', () => {
    cache.value = { state: 'ready', value: { faculties: [], departments: [] } };

    const html = render();

    expect(html).toContain('No school dey here yet');
    expect(html).toContain('Connect to data once, and Sabi go save the list for offline.');
    expect(html).not.toContain('FUTA Schools');
  });

  it('waits, in the shape of the cards, while the cache is read', () => {
    cache.value = { state: 'loading' };

    const html = render();

    expect(html).toContain('Dey load schools');
    expect(html.match(/skeleton__row/g)).toHaveLength(4);
    expect(html).not.toContain('No school dey here yet');
  });

  it('says something went wrong, and offers to try again', () => {
    cache.value = { state: 'error' };

    const html = render();

    expect(html).toContain('We no fit read the schools for this phone');
    expect(html).toContain('Try again. If e still no work, check your storage.');
    expect(html).toContain('Try again');
    expect(html).not.toContain('No school dey here yet');
  });

  it('sends the reader to the photo credits from the footer', () => {
    const html = render();

    expect(html).toContain('href="/credits"');
    expect(html).toContain('Photo credits');
  });
});
