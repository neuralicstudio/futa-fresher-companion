// Pure helpers for the Notices screen. No Dexie or React imports, so Vitest can run them.
import type { Announcement } from '../api/types';
import { COPY } from '../copy/pidgin';
import { formatDay, SAVING_MESSAGE } from './academicsView';
import { notExpired } from './visibility';

/** Rows the device should show now: not expired, newest first. Expired rows stay in the cache. */
export function announcementsForDisplay(rows: readonly Announcement[], now: number): Announcement[] {
  return sortNewestFirst(notExpired(rows, now));
}

function publishedTime(row: Announcement): number {
  const time = Date.parse(row.published_at);
  return Number.isNaN(time) ? 0 : time;
}

/** Newest published first. Equal times put the larger id first, the same order as the API. */
export function sortNewestFirst(rows: readonly Announcement[]): Announcement[] {
  return [...rows].sort((a, b) => {
    const byTime = publishedTime(b) - publishedTime(a);
    if (byTime !== 0) return byTime;
    return b.id.localeCompare(a.id);
  });
}

/** Maps id to name, for looking up a school or department name from the cache. */
export function namesById(rows: readonly { id: string; name: string }[]): Map<string, string> {
  return new Map(rows.map((row) => [row.id, row.name]));
}

export type NoticeScope = Announcement['scope'];
export type NoticeFilter = 'all' | 'university' | 'sug' | 'school' | 'department';

/** The chips over the list, in the design's order. */
export const NOTICE_FILTERS: readonly NoticeFilter[] = [
  'all',
  'university',
  'sug',
  'school',
  'department',
];

export function filterLabel(filter: NoticeFilter): string {
  return COPY.notices.filters[filter];
}

/** The chip's word for a scope. "School", not "Faculty": that is what a FUTA student says. */
export function scopeName(scope: NoticeScope): string {
  switch (scope) {
    case 'university':
      return COPY.notices.scope.university;
    case 'sug':
      return COPY.notices.scope.sug;
    case 'faculty':
      return COPY.notices.scope.school;
    case 'department':
      return COPY.notices.scope.department;
    default:
      return COPY.notices.scope.university;
  }
}

/** The colour the design gives each scope: University gold, SUG red, School green, Dept indigo. */
export function scopeTone(scope: NoticeScope): 'gold' | 'red' | 'green' | 'indigo' {
  switch (scope) {
    case 'sug':
      return 'red';
    case 'faculty':
      return 'green';
    case 'department':
      return 'indigo';
    default:
      return 'gold';
  }
}

const NAME_UNKNOWN = 'name not available on this device';

/** The school or department the notice belongs to, from the cache. A missing name says so. */
export function scopeDetail(
  announcement: Announcement,
  faculties: ReadonlyMap<string, string>,
  departments: ReadonlyMap<string, string>,
): string {
  switch (announcement.scope) {
    case 'faculty':
      return faculties.get(announcement.faculty_id ?? '') ?? NAME_UNKNOWN;
    case 'department':
      return departments.get(announcement.department_id ?? '') ?? NAME_UNKNOWN;
    default:
      return scopeName(announcement.scope);
  }
}

/**
 * "From {source}". The trust line under a title: a notice names where it came from in its
 * verification, and the scope is the fallback when that is blank. There is no Verified tick.
 */
export function sourceLine(
  announcement: Announcement,
  faculties: ReadonlyMap<string, string>,
  departments: ReadonlyMap<string, string>,
): string {
  const source =
    announcement.verification?.source?.trim() ||
    scopeDetail(announcement, faculties, departments);
  return COPY.notices.from.replace('{source}', source);
}

/** The date under the chip, in the design's day-month-year form. A broken date shows nothing. */
export function noticeDate(iso: string): string {
  return formatDay(iso) ?? '';
}

/** Everything the search box looks at: the words the card shows, in lower case. */
export function searchableText(
  announcement: Announcement,
  faculties: ReadonlyMap<string, string>,
  departments: ReadonlyMap<string, string>,
): string {
  const source = sourceLine(announcement, faculties, departments);
  const detail = scopeDetail(announcement, faculties, departments);
  return `${announcement.title} ${announcement.body} ${source} ${detail}`.toLowerCase();
}

export interface NoticeQuery {
  filter: NoticeFilter;
  query: string;
  /** The student's own school and department, for "My school" and "My department". */
  facultyId: string | null;
  departmentId: string | null;
}

/**
 * The chips a student can use. "My school" and "My department" only appear when the profile
 * names one; a guest has no school of their own to filter by.
 */
export function filterChoices(
  facultyId: string | null,
  departmentId: string | null,
): NoticeFilter[] {
  return NOTICE_FILTERS.filter(
    (filter) =>
      (filter !== 'school' || !!facultyId) && (filter !== 'department' || !!departmentId),
  );
}

function inScope(announcement: Announcement, state: NoticeQuery): boolean {
  switch (state.filter) {
    case 'all':
      return true;
    case 'school':
      return !!state.facultyId && announcement.faculty_id === state.facultyId;
    case 'department':
      return !!state.departmentId && announcement.department_id === state.departmentId;
    default:
      return announcement.scope === state.filter;
  }
}

/** The rows the list shows: the chosen chip, then the search words. */
export function noticesFor(
  rows: readonly Announcement[],
  state: NoticeQuery,
  faculties: ReadonlyMap<string, string>,
  departments: ReadonlyMap<string, string>,
): Announcement[] {
  const words = state.query.trim().toLowerCase();
  return rows.filter(
    (row) =>
      inScope(row, state) &&
      (!words || searchableText(row, faculties, departments).includes(words)),
  );
}

/** The first part of a body, for a card that shows a shortened line. Counts characters. */
export function previewText(body: string, maxChars = 140): string {
  const chars = Array.from(body);
  if (chars.length <= maxChars) return body;
  return `${chars.slice(0, maxChars).join('').trimEnd()}…`;
}

/** What an empty list says under its title: saving first, then offline, then all caught up. */
export function emptyBody(progress: { running: boolean; firstRun: boolean }, online: boolean): string {
  if (progress.running && progress.firstRun) return SAVING_MESSAGE;
  if (!online) return COPY.notices.offlineBody;
  return COPY.notices.emptyBody;
}

/** "No notice from {scope} yet." names the school or department when the cache has its name. */
export function emptyFilteredText(
  filter: NoticeFilter,
  faculties: ReadonlyMap<string, string>,
  departments: ReadonlyMap<string, string>,
  facultyId: string | null,
  departmentId: string | null,
): string {
  const name =
    (filter === 'school' && facultyId && faculties.get(facultyId)) ||
    (filter === 'department' && departmentId && departments.get(departmentId)) ||
    filterLabel(filter);
  return COPY.notices.emptyFiltered.replace('{scope}', name);
}
