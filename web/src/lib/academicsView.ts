// Pure helpers for the Academics screens. No Dexie or React imports, so Vitest can run them.
import type { Department, Faculty } from '../api/types';
import type { IconName } from '../components/Icon';
import type { SceneVariant } from '../components/Scene';
import { COPY } from '../copy/pidgin';

/** How a row's verification status reads on screen. Text carries the meaning; the symbol is extra. */
const STATUS_LABELS: Record<string, { text: string; symbol: string }> = {
  verified: { text: 'Verified', symbol: '✓' },
  unverified: { text: 'Unverified', symbol: '○' },
  outdated: { text: 'May be outdated', symbol: '!' },
};

export function verificationLabel(status: string): { text: string; symbol: string } {
  return STATUS_LABELS[status] ?? { text: 'Status unknown', symbol: '?' };
}

// Nigerian local time, so an update late in the evening does not show as the next day.
const UPDATED_DATE = new Intl.DateTimeFormat('en-NG', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Africa/Lagos',
});

/** "21 Oct 2026" in Nigerian local time, or null when the value is not a date. */
export function formatDay(iso: string): string | null {
  const when = new Date(iso);
  return Number.isNaN(when.getTime()) ? null : UPDATED_DATE.format(when);
}

export function formatUpdated(iso: string): string {
  const day = formatDay(iso);
  return day ? `Updated ${day}` : 'Updated date unknown';
}

const NAME_ORDER = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/** A copy sorted A to Z by name. Case and accents do not change the order; numbers sort naturally. */
export function sortByName<T extends { name: string }>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => NAME_ORDER.compare(a.name, b.name));
}

export const SAVING_MESSAGE = 'Saving campus data, this list will appear shortly';

/**
 * What an empty list says. While the first full sync is running, the list is still filling
 * in, so say so. Otherwise say what is missing.
 */
export function emptyMessage(progress: { running: boolean; firstRun: boolean }, notSaved: string) {
  return progress.running && progress.firstRun ? SAVING_MESSAGE : notSaved;
}

// ---------------------------------------------------------------- the schools grid

/**
 * A school's symbol, from the mockup's set (academics-390). The data is the school's name, so
 * the icon follows the words; a school we do not know gets the plain school building.
 */
const SCHOOL_ICONS: [RegExp, IconName][] = [
  [/comput/i, 'desktop'],
  [/engineer/i, 'gear'],
  [/medic|health|nurs/i, 'stethoscope'],
  [/agric/i, 'plant'],
  [/environment/i, 'leaf'],
  [/earth|mineral|geolog/i, 'compass'],
  [/logist|innovation/i, 'buildings'],
  [/scien/i, 'lightbulb'],
];

export function schoolIcon(name: string): IconName {
  return SCHOOL_ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? 'bank';
}

/**
 * The drawn scene on a school's card. Photographs only exist for one school, so the rest carry a
 * drawing; alternating them, and mirroring one of each pair, keeps the grid from looking stamped.
 */
const SCHOOL_SCENES: [RegExp, SceneVariant, boolean][] = [
  [/engineer/i, 'block', false],
  [/medical|health|nurs/i, 'gate', false],
  [/environment/i, 'path', false],
  [/agric/i, 'path', true],
  [/earth|mineral|geolog/i, 'hall', false],
  [/logist|innovation/i, 'path', true],
  [/life/i, 'block', true],
  [/scien/i, 'hall', true],
];

export function schoolScene(name: string): { variant: SceneVariant; flip: boolean } {
  const match = SCHOOL_SCENES.find(([pattern]) => pattern.test(name));
  return match
    ? { variant: match[1], flip: match[2] }
    : { variant: 'block', flip: false };
}

/** How many saved departments belong to this school. */
export function departmentsIn(facultyId: string, departments: readonly Department[]): number {
  return departments.filter((department) => department.faculty_id === facultyId).length;
}

/** "4 Departments", or "1 Department" when there is only one. */
export function departmentsLabel(count: number): string {
  return count === 1
    ? COPY.academics.department1
    : COPY.academics.departments.replace('{n}', String(count));
}

/** "6 Schools", for the section header. */
export function schoolsLabel(count: number): string {
  return COPY.academics.schoolsCount.replace('{n}', String(count));
}

/**
 * The schools the search keeps. A word matches a school by its own name, or by any of its
 * departments' names, so "computer science" finds School of Computing without the student
 * knowing which school the department belongs to. Every word has to match.
 */
export function filterSchools(
  faculties: readonly Faculty[],
  departments: readonly Department[],
  query: string,
): Faculty[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...faculties];

  const byFaculty = new Map<string, string[]>();
  for (const department of departments) {
    const names = byFaculty.get(department.faculty_id) ?? [];
    names.push(`${department.name} ${department.short_name ?? ''}`.toLowerCase());
    byFaculty.set(department.faculty_id, names);
  }

  return faculties.filter((faculty) => {
    const haystack = [
      `${faculty.name} ${faculty.short_name ?? ''}`.toLowerCase(),
      ...(byFaculty.get(faculty.id) ?? []),
    ].join(' ');
    return words.every((word) => haystack.includes(word));
  });
}
