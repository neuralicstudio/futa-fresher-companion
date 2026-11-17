import { describe, expect, it } from 'vitest';
import type { Building } from '../api/types';
import {
  CATEGORIES,
  CATEGORY_ORDER,
  categoryOf,
  countLabel,
  filterPlaces,
  nearbyPlaces,
  placePhoto,
  projectPoint,
  sortPlaces,
  toMapPlace,
  type MapPlace,
} from './mapView';

const STAMP = '2026-10-25T09:00:00.000+01:00';
const UNCHECKED = { status: 'unverified' as const, source: 'OpenStreetMap' };

function building(over: Partial<Building>): Building {
  return {
    id: 'b1',
    name: 'Somewhere',
    type: 'other',
    description: null,
    lat: 7.303,
    lng: 5.137,
    verification: UNCHECKED,
    updated_at: STAMP,
    ...over,
  };
}

function place(over: Partial<MapPlace>): MapPlace {
  return {
    id: 'p1',
    name: 'Somewhere',
    category: 'building',
    type: 'other',
    verified: false,
    x: 0,
    y: 0,
    ...over,
  };
}

describe('projectPoint', () => {
  // Coordinates from data/collected/osm-campus/buildings.csv, paired with the x/y the design's
  // bake tool drew for the same place. A pin must land on its own building, not near it.
  it('lands each real place on the baked drawing', () => {
    const cases: [number, number, number, number][] = [
      // lat, lng, x, y: Albert Ilemobade Library
      [7.304011, 5.134428, 1309, 2098],
      // School of Computing (SOC)
      [7.30461, 5.132388, 859, 1966],
      // Centre for Continuing Education lecture hall
      [7.304434, 5.135629, 1574, 2005],
      // FUTA West Gate
      [7.294086, 5.136387, 1742, 4293],
      // Great Hall
      [7.296022, 5.146806, 4043, 3865],
    ];

    for (const [lat, lng, x, y] of cases) {
      const drawn = projectPoint(lat, lng);
      expect(Math.abs(drawn.x - x)).toBeLessThanOrEqual(3);
      expect(Math.abs(drawn.y - y)).toBeLessThanOrEqual(3);
    }
  });

  it('projects the south-east corner to the bottom-right of the drawing', () => {
    const corner = projectPoint(7.2925, 5.15);
    expect(corner.x).toBeCloseTo(4748, 0);
    expect(corner.y).toBeCloseTo(4644, 0);
  });
});

describe('categoryOf', () => {
  it('folds the twelve database types into the eight pins', () => {
    expect(categoryOf('lecture_hall')).toBe('lecture');
    expect(categoryOf('library')).toBe('library');
    expect(categoryOf('food')).toBe('food');
    expect(categoryOf('sports')).toBe('sports');
    expect(categoryOf('health')).toBe('health');
    expect(categoryOf('hostel')).toBe('hostel');
    expect(categoryOf('gate')).toBe('gate');
    expect(categoryOf('faculty')).toBe('building');
    expect(categoryOf('department')).toBe('building');
    expect(categoryOf('admin')).toBe('building');
    expect(categoryOf('worship')).toBe('building');
    expect(categoryOf('other')).toBe('building');
  });

  it('gives every chip a pin colour and an icon', () => {
    for (const category of CATEGORY_ORDER) {
      expect(CATEGORIES[category].icon).toBeTruthy();
      expect(CATEGORIES[category].color).toMatch(/^var\(--color-pin-/);
    }
  });

  it('keeps gates out of the chips, so a fresher still gets seven quick choices', () => {
    expect(CATEGORY_ORDER).toHaveLength(7);
    expect(CATEGORY_ORDER).not.toContain('gate');
  });
});

describe('toMapPlace', () => {
  it('carries the place name as written and its verification', () => {
    const checked = toMapPlace(
      building({
        id: 'lib',
        name: 'Albert Ilemobade Library',
        type: 'library',
        lat: 7.304011,
        lng: 5.134428,
        verification: { status: 'verified', source: 'FUTA facilities' },
      }),
    );

    expect(checked.name).toBe('Albert Ilemobade Library');
    expect(checked.category).toBe('library');
    expect(checked.verified).toBe(true);
    expect(Math.round(checked.x)).toBe(1309);
  });

  it('never calls an unchecked place verified', () => {
    const unchecked = toMapPlace(building({ verification: { status: 'outdated' } }));
    expect(unchecked.verified).toBe(false);
  });
});

describe('sortPlaces', () => {
  it('opens on a library, then lectures, buildings and gates in the design order', () => {
    const sorted = sortPlaces([
      place({ id: 'g1', name: 'FUTA West Gate', category: 'gate' }),
      place({ id: 'b2', name: 'Senate Building' }),
      place({ id: 'b1', name: 'Akindeko Hall' }),
      place({ id: 'l2', name: 'Bukar Lecture Theatre', category: 'lecture' }),
      place({ id: 'l1', name: '2 IN 1 Lecture Theatre', category: 'lecture' }),
      place({ id: 'lib2', name: 'SEET Library', category: 'library' }),
      place({ id: 'lib1', name: 'Albert Ilemobade Library', category: 'library' }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual([
      'lib1',
      'lib2',
      'l1',
      'l2',
      'b1',
      'b2',
      'g1',
    ]);
  });

  it('does not reorder the array it was given', () => {
    const given = [place({ id: 'g', category: 'gate' }), place({ id: 'l', category: 'lecture' })];
    sortPlaces(given);
    expect(given.map((item) => item.id)).toEqual(['g', 'l']);
  });
});

describe('filterPlaces', () => {
  const places = [
    place({ id: 'lib', name: 'Albert Ilemobade Library', category: 'library' }),
    place({ id: 'seet', name: 'SEET Library', category: 'library' }),
    place({ id: 'food', name: 'Toppers Restaurant', category: 'food' }),
  ];

  it('matches the name, ignoring case and stray spaces', () => {
    expect(filterPlaces(places, { q: '  library ' }).map((item) => item.id)).toEqual([
      'lib',
      'seet',
    ]);
    expect(filterPlaces(places, { q: 'TOPPERS' }).map((item) => item.id)).toEqual(['food']);
  });

  it('filters by chip and by word together', () => {
    expect(filterPlaces(places, { q: 'library', category: 'food' })).toEqual([]);
    expect(filterPlaces(places, { category: 'library' }).map((item) => item.id)).toEqual([
      'lib',
      'seet',
    ]);
  });

  it('returns everything when the field is empty and no chip is on', () => {
    expect(filterPlaces(places)).toHaveLength(3);
    expect(filterPlaces(places, { q: '   ', category: null })).toHaveLength(3);
  });
});

describe('countLabel', () => {
  it('says one place for one, places for the rest', () => {
    expect(countLabel(0)).toBe('0 places');
    expect(countLabel(1)).toBe('1 place');
    expect(countLabel(163)).toBe('163 places');
  });
});

describe('placePhoto', () => {
  it('shows a photo only for the place the picture actually documents', () => {
    expect(placePhoto('Albert Ilemobade Library')).toBe('/photos/library-s.webp');
    expect(placePhoto('School of Computing')).toBe('/photos/computing-s.webp');
    expect(placePhoto('CRC')).toBe('/photos/crc-s.webp');
    expect(placePhoto('Computer Resource Center( CRC)')).toBe('/photos/crc-s.webp');
    expect(placePhoto('FUTA MULTIPURPOSE HALL')).toBe('/photos/hall-s.webp');
  });

  it('leaves a near-name without a photo, rather than borrowing another place’s', () => {
    // The picture's sign says Albert Ilemobade, so the other two libraries get their icon.
    expect(placePhoto('SAAT Library')).toBeUndefined();
    expect(placePhoto('SEET Library')).toBeUndefined();
    // The gate photo is the main gate; no row here is the main gate.
    expect(placePhoto('FUTA North Gate')).toBeUndefined();
    expect(placePhoto('CRC OBAKEKERE')).toBeUndefined();
    expect(placePhoto('ABIOLAHALL1')).toBeUndefined();
    expect(placePhoto('School of Computing (SOC)')).toBeUndefined();
  });

  it('shows each school whose building the team photographed', () => {
    expect(placePhoto('School of Electrical and Systems Engineering')).toBe(
      '/photos/sese-s.webp',
    );
    expect(
      placePhoto('School of Infrastructural, Minerals and Manufacturing Engineering'),
    ).toBe('/photos/simme-s.webp');
    expect(placePhoto('School of Earth and Mineral Sciences')).toBe('/photos/sems-s.webp');
    expect(placePhoto('School of Environmental Technology')).toBe('/photos/set-s.webp');
    expect(placePhoto('School of Physical Sciences')).toBe('/photos/sps-s.webp');
  });

  it('draws the four schools it has no photo of', () => {
    expect(placePhoto('School of Agriculture and Agricultural Technology')).toBeUndefined();
    expect(placePhoto('School of Basic Medical Sciences')).toBeUndefined();
    expect(placePhoto('School of Logistics and Innovation Technology')).toBeUndefined();
    expect(placePhoto('School of Life Sciences')).toBeUndefined();
  });

  it('gives a place its own screen the wide copy of the same picture', () => {
    expect(placePhoto('Albert Ilemobade Library', 'l')).toBe('/photos/library-l.webp');
    expect(placePhoto('School of Computing', 'l')).toBe('/photos/computing-l.webp');
    expect(placePhoto('CRC', 'l')).toBe('/photos/crc-l.webp');
    expect(placePhoto('FUTA MULTIPURPOSE HALL', 'l')).toBe('/photos/hall-l.webp');
    expect(placePhoto('School of Physical Sciences', 'l')).toBe('/photos/sps-l.webp');
    expect(placePhoto('SAAT Library', 'l')).toBeUndefined();
  });
});

describe('nearbyPlaces', () => {
  const place = (id: string, x: number, y: number): MapPlace => ({
    id,
    name: id,
    category: 'building',
    type: 'other',
    x,
    y,
    verified: false,
  });

  const PLACES = [
    place('here', 100, 100),
    place('far', 900, 900),
    place('next-door', 120, 110),
    place('down-road', 400, 100),
    place('up-road', 100, 300),
  ];

  it('gives the three closest other places, nearest first', () => {
    expect(nearbyPlaces(PLACES, 'here').map((item) => item.id)).toEqual([
      'next-door',
      'up-road',
      'down-road',
    ]);
  });

  it('never includes the place itself, and stops at the count it is given', () => {
    const nearby = nearbyPlaces(PLACES, 'here', 2);

    expect(nearby.map((item) => item.id)).toEqual(['next-door', 'up-road']);
    expect(nearby).not.toContainEqual(expect.objectContaining({ id: 'here' }));
  });

  it('says nothing when the place is not on the drawing', () => {
    expect(nearbyPlaces(PLACES, 'gone')).toEqual([]);
  });
});
