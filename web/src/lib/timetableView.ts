// Pure view logic for the timetable. No Dexie or React imports, so Vitest can run it.
import type { Building, TimetableEntry } from '../api/types';
import { COPY } from '../copy/pidgin';
import { emptyMessage } from './academicsView';
import { liveRows } from './departmentView';

// day_of_week in the schema: 1 = Monday ... 7 = Sunday.
const DAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const LEVEL_KEY = 'futa-timetable-level';
// The words the screen falls back to when a record is not in the cache. They live in the copy
// file, like every other word in the app, so a change of tone is one edit.
export const COURSE_MISSING = COPY.timetable.courseMissing;
export const VENUE_MISSING = COPY.timetable.venueMissing;
export const BUILDING_MISSING = COPY.timetable.buildingMissing;

/** Levels that have at least one live entry, lowest first. Only these are offered in the picker. */
export function levelsWithEntries(entries: readonly TimetableEntry[]): number[] {
  return [...new Set(liveRows(entries).map((entry) => entry.level))].sort((a, b) => a - b);
}

/** The remembered level if it still has entries, otherwise the lowest level, or null if none. */
export function chooseLevel(levels: readonly number[], remembered: number | null): number | null {
  if (remembered !== null && levels.includes(remembered)) return remembered;
  return levels[0] ?? null;
}

export function entriesForLevel(entries: readonly TimetableEntry[], level: number): TimetableEntry[] {
  return liveRows(entries).filter((entry) => entry.level === level);
}

export type Semester = 1 | 2;

/** The semesters this level runs in, first before second. Only these are offered in the picker. */
export function semestersWithEntries(
  entries: readonly TimetableEntry[],
  level: number,
): Semester[] {
  const seen = new Set(entriesForLevel(entries, level).map((entry) => entry.semester));
  return ([1, 2] as const).filter((semester) => seen.has(semester));
}

/** The semester the reader picked if it still has classes, otherwise the first one, or null. */
export function chooseSemester(
  available: readonly Semester[],
  picked: Semester | null,
): Semester | null {
  if (picked !== null && available.includes(picked)) return picked;
  return available[0] ?? null;
}

export function entriesForSemester(
  entries: readonly TimetableEntry[],
  level: number,
  semester: Semester,
): TimetableEntry[] {
  return entriesForLevel(entries, level).filter((entry) => entry.semester === semester);
}

/** One day's classes, earliest first. */
export function entriesOnDay(entries: readonly TimetableEntry[], day: number): TimetableEntry[] {
  return liveRows(entries)
    .filter((entry) => entry.day_of_week === day)
    .sort(startsBefore);
}

/** "First semester" / "Second semester", as the picker writes them. */
export function semesterLabel(semester: Semester): string {
  return semester === 1 ? COPY.timetable.semesters.first : COPY.timetable.semesters.second;
}

/** A day of the week the strip shows: the letter row, the date and whether it is today. */
export interface WeekDay {
  /** 1 = Monday ... 7 = Sunday, matching day_of_week. */
  day: number;
  short: string;
  date: number;
  month: string;
  /** "Tuesday, Oct 27", the heading over that day's classes. */
  label: string;
  today: boolean;
}

/** Monday to Sunday of the week that holds `now`, in the device's own time zone. */
export function weekDays(now: Date): WeekDay[] {
  const today = todayDayNumber(now) || 1;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (today - 1));
  return SHORT_DAYS.map((short, index) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index);
    const month = MONTHS[date.getMonth()];
    return {
      day: index + 1,
      short,
      date: date.getDate(),
      month,
      label: `${DAY_NAMES[index + 1]}, ${month} ${date.getDate()}`,
      today: index + 1 === today,
    };
  });
}

// Storage can be missing or blocked (private mode). Every access is guarded.
export function loadRememberedLevel(storage: Pick<Storage, 'getItem'> | undefined): number | null {
  try {
    const raw = storage?.getItem(LEVEL_KEY);
    if (raw === null || raw === undefined) return null;
    const level = Number(raw);
    return Number.isInteger(level) ? level : null;
  } catch {
    return null;
  }
}

export function rememberLevel(storage: Pick<Storage, 'setItem'> | undefined, level: number): void {
  try {
    storage?.setItem(LEVEL_KEY, String(level));
  } catch {
    // Not stored: the choice lasts until the page is left.
  }
}

// Kept here for the timetable's callers; the helper itself lives with the other browser APIs.
export { browserLocalStorage } from './storage';

function startsBefore(a: TimetableEntry, b: TimetableEntry): number {
  return a.start_time.localeCompare(b.start_time) || a.id.localeCompare(b.id);
}

/** "10:00" → "10:00 AM". Anything unexpected is returned as it came. */
export function formatClock(hhmm: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(hhmm);
  if (!match) return hhmm;
  const hours = Number(match[1]);
  const minutes = match[2];
  if (!Number.isInteger(hours) || hours > 23) return hhmm;
  const suffix = hours < 12 ? 'AM' : 'PM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutes} ${suffix}`;
}

/** Minutes from midnight, or null when the time is malformed. */
export function minutesOfDay(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(hhmm);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** The class that has not started yet today, and how long until it does. */
export interface NextClass {
  id: string;
  inMinutes: number;
}

/**
 * The next class today, from now onwards. A class that has already started is skipped: the
 * card is about what is next, and the countdown has to be positive.
 */
export function nextToday(entries: readonly TimetableEntry[], now: Date): NextClass | null {
  const today = todayDayNumber(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let best: NextClass | null = null;
  for (const entry of entriesOnDay(entries, today)) {
    const start = minutesOfDay(entry.start_time);
    if (start === null || start <= nowMinutes) continue;
    const inMinutes = start - nowMinutes;
    if (best === null || inMinutes < best.inMinutes) best = { id: entry.id, inMinutes };
  }
  return best;
}

/**
 * Day of week, 1 = Monday ... 7 = Sunday, for an instant in a time zone. Without a zone it uses
 * the device's own, so nothing is hardcoded. Returns 0 if the browser gives an unexpected name.
 */
export function todayDayNumber(now: Date, timeZone?: string): number {
  const name = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone }).format(now);
  const index = SHORT_DAYS.indexOf(name);
  return index === -1 ? 0 : index + 1;
}

/** Venue text. A building name from the cache when linked, else the note, else a plain message. */
export function venueText(
  entry: Pick<TimetableEntry, 'venue_building_id' | 'venue_note'>,
  buildings: ReadonlyMap<string, Pick<Building, 'name'>>,
): string {
  const note = entry.venue_note?.trim() || null;
  if (entry.venue_building_id) {
    const building = buildings.get(entry.venue_building_id);
    const name = building ? building.name : BUILDING_MISSING;
    return note ? `${name} · ${note}` : name;
  }
  return note ?? VENUE_MISSING;
}

export function buildingsById(
  buildings: readonly Pick<Building, 'id' | 'name'>[],
): Map<string, Pick<Building, 'id' | 'name'>> {
  return new Map(buildings.map((building) => [building.id, building]));
}

/** What an empty timetable says. A sync in progress takes priority, as on the other screens. */
export function timetableEmptyMessage(
  progress: { running: boolean; firstRun: boolean },
  text: string,
): string {
  return emptyMessage(progress, text);
}
