import { describe, expect, it } from 'vitest';
import type { Announcement, Building, Course, TimetableEntry } from '../api/types';
import {
  formatClock,
  latestNotice,
  nextClass,
  noticeDate,
  noticeSource,
  placePhoto,
  popularPlaces,
  whenText,
} from './homeView';

const DEPT = '33333333-3333-4333-8333-333333333333';
const COURSE = '44444444-4444-4444-8444-444444444444';
const BUILDING = '55555555-5555-4555-8555-555555555555';
const STAMP = '2026-10-20T09:00:00.000Z';
const VERIFICATION = { status: 'verified' as const, source: 'Timetable notice' };

// Tuesday 3 November 2026, 09:00 local time. day_of_week 2 is Tuesday.
const TUESDAY_9 = new Date(2026, 10, 3, 9, 0, 0);

function entry(overrides: Partial<TimetableEntry> & { id: string }): TimetableEntry {
  return {
    department_id: DEPT,
    level: 100,
    semester: 1,
    course_id: COURSE,
    day_of_week: 2,
    start_time: '11:00',
    end_time: '13:00',
    venue_building_id: null,
    venue_note: null,
    verification: VERIFICATION,
    updated_at: STAMP,
    ...overrides,
  };
}

function course(overrides: Partial<Course> & { id: string }): Course {
  return {
    department_id: DEPT,
    code: 'CSC 101',
    title: 'Introduction to Computing',
    units: 3,
    level: 100,
    semester: 1,
    verification: VERIFICATION,
    updated_at: STAMP,
    ...overrides,
  };
}

function building(overrides: Partial<Building> & { id: string; name: string }): Building {
  return {
    type: 'lecture_hall',
    description: null,
    lat: 7.296,
    lng: 5.145,
    verification: VERIFICATION,
    updated_at: STAMP,
    ...overrides,
  };
}

function announcement(overrides: Partial<Announcement> & { id: string }): Announcement {
  return {
    title: 'SUG registration now open',
    body: 'All freshers should complete their SUG registration.',
    scope: 'sug',
    faculty_id: null,
    department_id: null,
    author_id: '00000000-0000-4000-8000-0000000000aa',
    published_at: '2026-10-25T09:00:00.000Z',
    expires_at: null,
    verification: { status: 'verified', source: 'SUG notice' },
    updated_at: '2026-10-25T09:00:00.000Z',
    ...overrides,
  };
}

describe('formatClock', () => {
  it('prints the 12-hour clock the timetable cards use', () => {
    expect(formatClock('10:00')).toBe('10:00 AM');
    expect(formatClock('09:07')).toBe('9:07 AM');
    expect(formatClock('12:00')).toBe('12:00 PM');
    expect(formatClock('13:05')).toBe('1:05 PM');
    expect(formatClock('00:05')).toBe('12:05 AM');
    expect(formatClock('23:59')).toBe('11:59 PM');
  });

  it('leaves a malformed time alone instead of inventing one', () => {
    expect(formatClock('25:00')).toBe('25:00');
    expect(formatClock('morning')).toBe('morning');
  });
});

describe('nextClass', () => {
  it('takes the next class today and skips one that already started', () => {
    const started = entry({ id: 'started', start_time: '08:00', end_time: '10:00' });
    const next = entry({ id: 'next' });

    const result = nextClass([started, next], [course({ id: COURSE })], [], TUESDAY_9);

    expect(result).toMatchObject({
      id: 'next',
      code: 'CSC 101',
      day: 2,
      dayOffset: 0,
      startsInMinutes: 120,
      time: '11:00 AM to 1:00 PM',
    });
  });

  it('rolls over to the next day when today has no class left', () => {
    const tomorrow = entry({ id: 'wed', day_of_week: 3, start_time: '08:00', end_time: '10:00' });

    const result = nextClass([tomorrow], [], [], TUESDAY_9);

    expect(result).toMatchObject({ id: 'wed', dayOffset: 1, startsInMinutes: 1380 });
    expect(result && whenText(result)).toBe('Tomorrow, 8:00 AM to 10:00 AM');
  });

  it('picks the earliest of the coming classes, not the first in the list', () => {
    const later = entry({ id: 'later', day_of_week: 3, start_time: '12:00' });
    const sooner = entry({ id: 'sooner', day_of_week: 3, start_time: '07:00' });

    expect(nextClass([later, sooner], [], [], TUESDAY_9)?.id).toBe('sooner');
  });

  it('says "Course" when the course is not saved on this device', () => {
    const result = nextClass([entry({ id: 'one' })], [], [], TUESDAY_9);

    expect(result).toMatchObject({ code: 'Course', title: '' });
  });

  it('names the venue from the building and the note', () => {
    const place = building({ id: BUILDING, name: 'Lecture Theatre A1', type: 'lecture_hall' });
    const result = nextClass(
      [entry({ id: 'one', venue_building_id: BUILDING, venue_note: 'First floor' })],
      [],
      [place],
      TUESDAY_9,
    );

    expect(result?.venue).toBe('Lecture Theatre A1 · First floor');
  });

  it('has nothing to show for an empty timetable or a malformed time', () => {
    expect(nextClass([], [], [], TUESDAY_9)).toBeNull();
    expect(nextClass([entry({ id: 'bad', start_time: 'soon' })], [], [], TUESDAY_9)).toBeNull();
  });

  it('leaves a class with no day label for today, and names the day for later in the week', () => {
    const friday = entry({ id: 'fri', day_of_week: 5, start_time: '08:00', end_time: '09:00' });
    const result = nextClass([friday], [], [], TUESDAY_9);

    expect(result && whenText(result)).toBe('Friday, 8:00 AM to 9:00 AM');
  });
});

describe('latestNotice', () => {
  it('takes the newest notice that has not expired', () => {
    const older = announcement({ id: 'older', published_at: '2026-10-20T09:00:00.000Z' });
    const newest = announcement({ id: 'newest', published_at: '2026-10-25T09:00:00.000Z' });
    const expired = announcement({
      id: 'expired',
      published_at: '2026-10-26T09:00:00.000Z',
      expires_at: '2026-10-27T09:00:00.000Z',
    });

    const result = latestNotice([older, expired, newest], new Date(2026, 10, 3, 9, 0));

    expect(result?.id).toBe('newest');
  });

  it('has nothing when every notice has expired', () => {
    const expired = announcement({ id: 'old', expires_at: '2026-10-27T09:00:00.000Z' });

    expect(latestNotice([expired], new Date(2026, 10, 3, 9, 0))).toBeNull();
  });
});

describe('notice source and date', () => {
  it('names the source without a Verified badge', () => {
    expect(noticeSource(announcement({ id: 'sug' }))).toBe('SUG');
    expect(noticeSource(announcement({ id: 'uni', scope: 'university' }))).toBe('FUTA');
    expect(noticeSource(announcement({ id: 'fac', scope: 'faculty' }))).toBe('your school');
    expect(noticeSource(announcement({ id: 'dep', scope: 'department' }))).toBe(
      'your department',
    );
  });

  it('prints the publish day in Nigerian time', () => {
    expect(noticeDate(announcement({ id: 'sug' }))).toBe('25 Oct 2026');
  });
});

describe('placePhoto', () => {
  it('uses a credited photo only where the name matches it', () => {
    expect(placePhoto('Main gate')).toBe('/photos/gate-s.webp');
    expect(placePhoto('Albert Ilemobade Library')).toBe('/photos/library-s.webp');
    expect(placePhoto('School of Computing')).toBe('/photos/computing-s.webp');
    expect(placePhoto('Department of Physics')).toBe('/photos/physics-s.webp');
    expect(placePhoto('Computer Resource Centre')).toBe('/photos/crc-s.webp');
    expect(placePhoto('Multipurpose Hall')).toBe('/photos/hall-s.webp');
    expect(placePhoto('Industrial Design Studios')).toBe('/photos/studios-s.webp');
  });

  it('has no photo for a place the pack does not cover', () => {
    expect(placePhoto('Senate Building')).toBeUndefined();
  });
});

describe('popularPlaces', () => {
  const rows: Building[] = [
    building({ id: 'b1', name: 'Main gate', type: 'gate' }),
    building({ id: 'b2', name: 'Albert Ilemobade Library', type: 'library' }),
    building({ id: 'b3', name: 'Zebra Hall', type: 'lecture_hall' }),
    building({ id: 'b4', name: 'Another Hall', type: 'lecture_hall' }),
    building({ id: 'b5', name: 'Department of Physics', type: 'department' }),
    building({ id: 'b6', name: 'Cafeteria', type: 'food' }),
  ];

  it('takes one place per type, in the design order, not four lecture halls', () => {
    expect(popularPlaces(rows).map((row) => row.name)).toEqual([
      'Main gate',
      'Albert Ilemobade Library',
      'Another Hall',
      'Department of Physics',
    ]);
  });

  it('honours the limit and keeps the typed picks first', () => {
    expect(popularPlaces(rows, 2).map((row) => row.name)).toEqual([
      'Main gate',
      'Albert Ilemobade Library',
    ]);
  });

  it('fills the rail with the rest of the buildings by name when types run out', () => {
    const few = [
      building({ id: 'b1', name: 'Main gate', type: 'gate' }),
      building({ id: 'b2', name: 'Zenith Block', type: 'other' }),
      building({ id: 'b3', name: 'Alpha Block', type: 'other' }),
    ];

    expect(popularPlaces(few).map((row) => row.name)).toEqual([
      'Main gate',
      'Alpha Block',
      'Zenith Block',
    ]);
  });

  it('has nothing for an empty cache', () => {
    expect(popularPlaces([])).toEqual([]);
  });
});
