// Pure view logic for Home. No Dexie or React imports, so Vitest can run it.
import type { Announcement, Building, Course, TimetableEntry } from '../api/types';
import { formatDay } from './academicsView';
import { announcementsForDisplay } from './announcementsView';
import { liveRows } from './departmentView';
import { buildingsById, formatClock, minutesOfDay, venueText } from './timetableView';

export interface HomeClass {
  id: string;
  /** Course code, or a plain word when the course is not saved on this device. */
  code: string;
  title: string;
  venue: string;
  /** 1 = Monday ... 7 = Sunday, matching day_of_week. */
  day: number;
  /** 0 today, 1 tomorrow, and so on. */
  dayOffset: number;
  /** Whole minutes from now to the start. */
  startsInMinutes: number;
  /** "10:00 AM to 11:00 AM". */
  time: string;
}

const NO_COURSE = 'Course';
const DAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

/** 1 = Monday ... 7 = Sunday, matching day_of_week. */
function dayNumber(now: Date): number {
  const day = now.getDay();
  return day === 0 ? 7 : day;
}

/**
 * The next class in the saved timetable, from now onwards. A class that already started today
 * is skipped: the card is about what is next, and the countdown has to be positive.
 *
 * The caller passes the entries for the student's level; this function keeps no level logic of
 * its own, so the same timetable can be read at any level.
 */
export function nextClass(
  entries: readonly TimetableEntry[],
  courses: readonly Course[],
  buildings: readonly Building[],
  now: Date,
): HomeClass | null {
  const today = dayNumber(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const courseById = new Map(liveRows(courses).map((course) => [course.id, course]));
  const buildingById = buildingsById(liveRows(buildings));

  let best: HomeClass | null = null;
  for (const entry of liveRows(entries)) {
    const start = minutesOfDay(entry.start_time);
    const end = minutesOfDay(entry.end_time);
    if (start === null || end === null) continue;

    const dayOffset = (entry.day_of_week - today + 7) % 7;
    if (dayOffset === 0 && start <= nowMinutes) continue;

    const startsInMinutes = dayOffset * 24 * 60 + start - nowMinutes;
    if (best !== null && startsInMinutes >= best.startsInMinutes) continue;

    const course = courseById.get(entry.course_id);
    best = {
      id: entry.id,
      code: course?.code ?? NO_COURSE,
      title: course?.title ?? '',
      venue: venueText(entry, buildingById),
      day: entry.day_of_week,
      dayOffset,
      startsInMinutes,
      time: `${formatClock(entry.start_time)} to ${formatClock(entry.end_time)}`,
    };
  }
  return best;
}

/** "10:00 AM to 11:00 AM" today, "Tomorrow, 10:00 AM to 11:00 AM" later in the week. */
export function whenText(entry: HomeClass): string {
  if (entry.dayOffset === 0) return entry.time;
  const day = entry.dayOffset === 1 ? 'Tomorrow' : (DAY_NAMES[entry.day] ?? 'Later');
  return `${day}, ${entry.time}`;
}

/** The newest notice that has not expired, or null. */
export function latestNotice(rows: readonly Announcement[], now: Date): Announcement | null {
  return announcementsForDisplay(rows, now.getTime())[0] ?? null;
}

/** "From SUG". Notices carry their source, never "Verified". */
export function noticeSource(announcement: Announcement): string {
  switch (announcement.scope) {
    case 'sug':
      return 'SUG';
    case 'university':
      return 'FUTA';
    case 'faculty':
      return 'your school';
    case 'department':
      return 'your department';
    default:
      return 'FUTA';
  }
}

export function noticeDate(announcement: Announcement): string | null {
  return formatDay(announcement.published_at);
}

/**
 * The photo pack's file for a place, when its name matches one of the credited photos.
 * Nothing is invented for a place we have no photo of: the card shows its category icon.
 */
const PHOTOS: { match: RegExp; file: string }[] = [
  // The Resource Centre name also contains "computer", so it is matched before Computing.
  { match: /resource cent(re|er)|crc/i, file: '/photos/crc-s.webp' },
  { match: /gate/i, file: '/photos/gate-s.webp' },
  { match: /library/i, file: '/photos/library-s.webp' },
  { match: /comput/i, file: '/photos/computing-s.webp' },
  { match: /physics/i, file: '/photos/physics-s.webp' },
  { match: /multipurpose|hall/i, file: '/photos/hall-s.webp' },
  { match: /studio/i, file: '/photos/studios-s.webp' },
];

export function placePhoto(name: string): string | undefined {
  return PHOTOS.find((entry) => entry.match.test(name))?.file;
}

// The building types, in the order the rail prefers them: one gate, one library, then the
// places a fresher asks about first. This is not the OpenStreetMap sort order.
const TYPE_ORDER = [
  'gate',
  'library',
  'lecture_hall',
  'department',
  'faculty',
  'admin',
  'food',
  'health',
  'sports',
  'hostel',
  'worship',
  'other',
];

const NAME_ORDER = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/**
 * Four places for the rail: one from each type that has a building, so the rail is not four
 * lecture halls in a row, then the rest by name to fill the gap.
 */
export function popularPlaces(buildings: readonly Building[], limit = 4): Building[] {
  const rows = liveRows(buildings).sort((a, b) => NAME_ORDER.compare(a.name, b.name));
  const picked: Building[] = [];
  const seen = new Set<string>();

  for (const type of TYPE_ORDER) {
    if (picked.length >= limit) break;
    const first = rows.find((row) => row.type === type && !seen.has(row.id));
    if (first) {
      picked.push(first);
      seen.add(first.id);
    }
  }

  const rest = rows.filter((row) => !seen.has(row.id));
  return [...picked, ...rest].slice(0, limit);
}
