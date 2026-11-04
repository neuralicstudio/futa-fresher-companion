import { describe, expect, it } from 'vitest';
import type { Building, TimetableEntry } from '../api/types';
import {
  BUILDING_MISSING,
  buildingsById,
  chooseLevel,
  chooseSemester,
  entriesForLevel,
  entriesForSemester,
  entriesOnDay,
  formatClock,
  LEVEL_KEY,
  levelsWithEntries,
  loadRememberedLevel,
  minutesOfDay,
  nextToday,
  rememberLevel,
  semesterLabel,
  semestersWithEntries,
  timetableEmptyMessage,
  todayDayNumber,
  VENUE_MISSING,
  venueText,
  weekDays,
} from './timetableView';
import { SAVING_MESSAGE } from './academicsView';

const DEPT = '33333333-3333-4333-8333-333333333333';
const COURSE = '44444444-4444-4444-8444-444444444444';
const BUILDING = '55555555-5555-4555-8555-555555555555';
const STAMP = '2026-10-20T09:00:00.000Z';
const VERIFICATION = { status: 'verified' as const, source: 'Timetable notice' };

function entry(overrides: Partial<TimetableEntry> & { id: string }): TimetableEntry {
  return {
    department_id: DEPT,
    level: 100,
    semester: 1,
    course_id: COURSE,
    day_of_week: 1,
    start_time: '08:00',
    end_time: '10:00',
    venue_building_id: null,
    venue_note: null,
    verification: VERIFICATION,
    updated_at: STAMP,
    ...overrides,
  };
}

function building(overrides: Partial<Building> = {}): Building {
  return {
    id: BUILDING,
    name: 'Lecture Theatre 2',
    type: 'lecture_hall',
    description: null,
    lat: 7.296,
    lng: 5.145,
    verification: VERIFICATION,
    updated_at: STAMP,
    ...overrides,
  };
}

describe('level filter and the remembered level', () => {
  const entries = [
    entry({ id: 'a', level: 200 }),
    entry({ id: 'b', level: 100 }),
    entry({ id: 'c', level: 200 }),
  ];

  it('lists only levels that have entries, lowest first, once each', () => {
    expect(levelsWithEntries(entries)).toEqual([100, 200]);
  });

  it('keeps only the entries of the chosen level', () => {
    expect(entriesForLevel(entries, 200).map((e) => e.id)).toEqual(['a', 'c']);
  });

  it('uses the remembered level when it still has entries', () => {
    expect(chooseLevel([100, 200], 200)).toBe(200);
  });

  it('falls back to the lowest level when the remembered one has no entries', () => {
    expect(chooseLevel([100, 200], 500)).toBe(100);
    expect(chooseLevel([100, 200], null)).toBe(100);
  });

  it('has no level when there are no entries', () => {
    expect(chooseLevel([], 100)).toBeNull();
  });

  it('reads a remembered level from storage, and ignores anything else', () => {
    expect(loadRememberedLevel({ getItem: () => '300' })).toBe(300);
    expect(loadRememberedLevel({ getItem: () => 'abc' })).toBeNull();
    expect(loadRememberedLevel({ getItem: () => null })).toBeNull();
    expect(loadRememberedLevel(undefined)).toBeNull();
  });

  it('treats blocked storage as no remembered level, without throwing', () => {
    const blocked = {
      getItem: () => {
        throw new DOMException('blocked', 'SecurityError');
      },
    };

    expect(loadRememberedLevel(blocked)).toBeNull();
  });

  it('writes the chosen level, and does not throw when storage is blocked', () => {
    const written: Record<string, string> = {};
    rememberLevel({ setItem: (key, value) => (written[key] = value) }, 300);

    expect(written[LEVEL_KEY]).toBe('300');
    expect(() =>
      rememberLevel(
        {
          setItem: () => {
            throw new DOMException('full', 'QuotaExceededError');
          },
        },
        200,
      ),
    ).not.toThrow();
  });
});

describe('semester filter', () => {
  const entries = [
    entry({ id: 'a', level: 100, semester: 1 }),
    entry({ id: 'b', level: 100, semester: 2 }),
    entry({ id: 'c', level: 200, semester: 2 }),
  ];

  it('offers only the semesters this level runs in, first before second', () => {
    expect(semestersWithEntries(entries, 100)).toEqual([1, 2]);
    expect(semestersWithEntries(entries, 200)).toEqual([2]);
    expect(semestersWithEntries(entries, 300)).toEqual([]);
  });

  it('keeps the picked semester when this level has it, otherwise the first', () => {
    expect(chooseSemester([1, 2], 2)).toBe(2);
    expect(chooseSemester([2], 1)).toBe(2);
    expect(chooseSemester([1, 2], null)).toBe(1);
    expect(chooseSemester([], 1)).toBeNull();
  });

  it('keeps only the entries of the chosen level and semester', () => {
    expect(entriesForSemester(entries, 100, 2).map((e) => e.id)).toEqual(['b']);
  });

  it('names the two semesters as the picker does', () => {
    expect(semesterLabel(1)).toBe('First semester');
    expect(semesterLabel(2)).toBe('Second semester');
  });
});

describe('one day at a time', () => {
  const entries = [
    entry({ id: 'late', day_of_week: 2, start_time: '14:00', end_time: '16:00' }),
    entry({ id: 'early', day_of_week: 2, start_time: '08:00', end_time: '10:00' }),
    entry({ id: 'mid', day_of_week: 2, start_time: '11:00', end_time: '12:00' }),
    entry({ id: 'other', day_of_week: 3, start_time: '08:00', end_time: '10:00' }),
  ];

  it('keeps one day, earliest first', () => {
    expect(entriesOnDay(entries, 2).map((e) => e.id)).toEqual(['early', 'mid', 'late']);
  });

  it('breaks equal start times by id', () => {
    const tied = [
      entry({ id: 'b', day_of_week: 1, start_time: '08:00' }),
      entry({ id: 'a', day_of_week: 1, start_time: '08:00' }),
    ];

    expect(entriesOnDay(tied, 1).map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('has nothing for a day with no class', () => {
    expect(entriesOnDay(entries, 7)).toEqual([]);
  });
});

describe('the week strip', () => {
  // 21 October 2026 is a Wednesday in the device's own time zone.
  const now = new Date(2026, 9, 21, 10, 0);

  it('runs Monday to Sunday around today', () => {
    const week = weekDays(now);

    expect(week.map((day) => day.short)).toEqual([
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ]);
    expect(week.map((day) => day.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('dates each day, starting on the Monday of this week', () => {
    const week = weekDays(now);

    expect(week.map((day) => day.date)).toEqual([19, 20, 21, 22, 23, 24, 25]);
    expect(week[2]).toMatchObject({ month: 'Oct', label: 'Wednesday, Oct 21' });
  });

  it('marks today and nothing else', () => {
    const week = weekDays(now);

    expect(week.filter((day) => day.today).map((day) => day.short)).toEqual(['Wed']);
  });

  it('moves the whole strip when today is Sunday', () => {
    const week = weekDays(new Date(2026, 9, 25, 10, 0));

    expect(week[0].date).toBe(19);
    expect(week[6]).toMatchObject({ short: 'Sun', date: 25, today: true });
  });
});

describe('the next class today', () => {
  // Tuesday 20 October 2026, 09:48 in the device's own time zone.
  const now = new Date(2026, 9, 20, 9, 48);

  function todayEntries() {
    return [
      entry({ id: 'started', day_of_week: 2, start_time: '09:00', end_time: '10:00' }),
      entry({ id: 'soon', day_of_week: 2, start_time: '10:00', end_time: '11:00' }),
      entry({ id: 'later', day_of_week: 2, start_time: '14:00', end_time: '16:00' }),
      entry({ id: 'another-day', day_of_week: 3, start_time: '10:00', end_time: '11:00' }),
    ];
  }

  it('finds the next class and how long until it starts', () => {
    expect(nextToday(todayEntries(), now)).toEqual({ id: 'soon', inMinutes: 12 });
  });

  it('skips a class that has already started', () => {
    const started = todayEntries().filter((item) => item.id !== 'soon');

    expect(nextToday(started, now)).toEqual({ id: 'later', inMinutes: 252 });
  });

  it('has nothing when today is done', () => {
    const late = new Date(2026, 9, 20, 20, 0);

    expect(nextToday(todayEntries(), late)).toBeNull();
  });

  it('ignores a malformed start time instead of guessing', () => {
    const odd = [entry({ id: 'odd', day_of_week: 2, start_time: 'soon', end_time: '' })];

    expect(nextToday(odd, now)).toBeNull();
  });
});

describe('the clock', () => {
  it('prints the 12-hour time the cards show', () => {
    expect(formatClock('08:00')).toBe('8:00 AM');
    expect(formatClock('10:00')).toBe('10:00 AM');
    expect(formatClock('13:05')).toBe('1:05 PM');
    expect(formatClock('00:00')).toBe('12:00 AM');
    expect(formatClock('12:30')).toBe('12:30 PM');
  });

  it('returns an unexpected time as it came', () => {
    expect(formatClock('soon')).toBe('soon');
    expect(formatClock('25:00')).toBe('25:00');
  });

  it('counts minutes from midnight, or nothing when the time is malformed', () => {
    expect(minutesOfDay('10:00')).toBe(600);
    expect(minutesOfDay('00:00')).toBe(0);
    expect(minutesOfDay('23:59')).toBe(1439);
    expect(minutesOfDay('24:00')).toBeNull();
    expect(minutesOfDay('9:5')).toBeNull();
    expect(minutesOfDay('late')).toBeNull();
  });
});

describe('venue fallbacks', () => {
  it('shows the building name when it is linked and cached', () => {
    const buildings = buildingsById([building()]);

    expect(venueText(entry({ id: 'x', venue_building_id: BUILDING }), buildings)).toBe(
      'Lecture Theatre 2',
    );
  });

  it('adds the venue note after the building name', () => {
    const buildings = buildingsById([building()]);
    const item = entry({ id: 'x', venue_building_id: BUILDING, venue_note: 'Ground floor' });

    expect(venueText(item, buildings)).toBe('Lecture Theatre 2 · Ground floor');
  });

  it('says so when a linked building is not in the cache', () => {
    expect(venueText(entry({ id: 'x', venue_building_id: BUILDING }), buildingsById([]))).toBe(
      BUILDING_MISSING,
    );
  });

  it('uses the venue note when there is no building', () => {
    expect(venueText(entry({ id: 'x', venue_note: 'Room 4, Block C' }), buildingsById([]))).toBe(
      'Room 4, Block C',
    );
  });

  it('says the venue is not given when neither is set', () => {
    expect(venueText(entry({ id: 'x' }), buildingsById([]))).toBe(VENUE_MISSING);
  });
});

describe('deleted rows', () => {
  it('hides soft-deleted entries from the days, the levels and the filters', () => {
    const entries = [
      entry({ id: 'live', level: 100, day_of_week: 1, semester: 1 }),
      {
        ...entry({ id: 'gone', level: 300, day_of_week: 2, semester: 2 }),
        deleted_at: STAMP,
      } as TimetableEntry,
    ];

    expect(levelsWithEntries(entries)).toEqual([100]);
    expect(entriesForLevel(entries, 300)).toEqual([]);
    expect(semestersWithEntries(entries, 300)).toEqual([]);
    expect(entriesForSemester(entries, 100, 1).map((e) => e.id)).toEqual(['live']);
    expect(entriesOnDay(entries, 2)).toEqual([]);
  });
});

describe('today highlight', () => {
  // 2026-10-21 is a Wednesday. 2026-10-25 is a Sunday.
  it('gives the day number, Monday = 1 ... Sunday = 7', () => {
    expect(todayDayNumber(new Date('2026-10-21T10:00:00Z'), 'UTC')).toBe(3);
    expect(todayDayNumber(new Date('2026-10-25T10:00:00Z'), 'UTC')).toBe(7);
  });

  it('depends on the time zone: the same instant can be a different day', () => {
    // 23:30 UTC on Tuesday 20 October is 00:30 on Wednesday 21 October in Lagos (UTC+1).
    const instant = new Date('2026-10-20T23:30:00Z');

    expect(todayDayNumber(instant, 'UTC')).toBe(2);
    expect(todayDayNumber(instant, 'Africa/Lagos')).toBe(3);
  });
});

describe('timetable empty state', () => {
  it('says the list is coming while the first sync runs', () => {
    expect(timetableEmptyMessage({ running: true, firstRun: true }, 'x')).toBe(SAVING_MESSAGE);
  });

  it('otherwise says what is missing', () => {
    expect(
      timetableEmptyMessage(
        { running: false, firstRun: false },
        'The timetable has not been added yet.',
      ),
    ).toBe('The timetable has not been added yet.');
  });
});
