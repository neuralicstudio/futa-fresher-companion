// The Map screen's logic: which places the pins and the list show, and where a place sits on the
// baked campus drawing. Pure functions only, so the screen, the component and the tests share one
// source of truth. Nothing here reads the DOM or the network.
//
// The drawings are OpenStreetMap data (© OpenStreetMap contributors, ODbL 1.0). A place's position
// comes from its coordinates in the offline cache, projected the same way the design's bake tool
// projects the map itself, so a pin lands on its own building.
import type { CSSProperties } from 'react';
import type { Building } from '../api/types';
import { CAMPUS_MAP } from '../components/map/campusMapData';
import type { IconName } from '../components/Icon';
import { COPY } from '../copy/pidgin';

/**
 * The eight pin categories. They are the design's map categories, not the database's building
 * types: several types share one pin (a faculty, a department and an admin block are all
 * "Buildings"), so the chips stay few enough to tap.
 */
export type MapCategory =
  | 'lecture'
  | 'building'
  | 'food'
  | 'library'
  | 'sports'
  | 'health'
  | 'hostel'
  | 'gate';

/**
 * The quick categories, in the design's order (screenshots `map-390`). Gates are left out of the
 * chips because a fresher looks for a gate by name; the pins and the list still carry them.
 */
export const CATEGORY_ORDER: MapCategory[] = [
  'lecture',
  'building',
  'food',
  'library',
  'sports',
  'health',
  'hostel',
];

/**
 * The order of the place list and the pins (screenshot map-390). It is the chip order with
 * libraries moved to the front: the screen opens on the library at the middle of campus, so the
 * first thing a fresher sees is the landmark, not a lecture theatre on the edge of the drawing.
 */
const LIST_ORDER: MapCategory[] = [
  'library',
  ...CATEGORY_ORDER.filter((category) => category !== 'library'),
  'gate',
];

/** The Phosphor icon and the pin colour token for each category (docs/design/tokens.css). */
export const CATEGORIES: Record<MapCategory, { icon: IconName; color: string }> = {
  lecture: { icon: 'graduationCap', color: 'var(--color-pin-lecture)' },
  building: { icon: 'buildings', color: 'var(--color-pin-building)' },
  food: { icon: 'forkKnife', color: 'var(--color-pin-food)' },
  library: { icon: 'bookOpenText', color: 'var(--color-pin-library)' },
  sports: { icon: 'soccerBall', color: 'var(--color-pin-sports)' },
  health: { icon: 'firstAidKit', color: 'var(--color-pin-health)' },
  hostel: { icon: 'houseLine', color: 'var(--color-pin-hostel)' },
  gate: { icon: 'compass', color: 'var(--color-pin-gate)' },
};

/** A place as the map and the list need it: a name, a pin kind and a point on the drawing. */
export interface MapPlace {
  id: string;
  /** Exactly as written in OpenStreetMap or on the sign. Never tidied up. */
  name: string;
  category: MapCategory;
  /** The database type, kept for the blurb. */
  type: Building['type'];
  /** True only when an admin has actually checked this place (never assumed). */
  verified: boolean;
  /** Position on the baked drawing, in half-metre units from the top-left corner. */
  x: number;
  y: number;
}

/** Which pin a building gets. The database's twelve types fold into the design's eight pins. */
export function categoryOf(type: Building['type']): MapCategory {
  switch (type) {
    case 'lecture_hall':
      return 'lecture';
    case 'library':
      return 'library';
    case 'food':
      return 'food';
    case 'sports':
      return 'sports';
    case 'health':
      return 'health';
    case 'hostel':
      return 'hostel';
    case 'gate':
      return 'gate';
    // Faculties, departments, admin blocks, places of worship and everything untyped read as
    // "Buildings": the design has no chip for them, and a wrong chip is worse than a broad one.
    default:
      return 'building';
  }
}

const [SOUTH, WEST, NORTH] = CAMPUS_MAP.bbox;
/** Metres per degree at the campus latitude, the same constants the bake tool uses. */
const KX = 111320 * Math.cos((((SOUTH + NORTH) / 2) * Math.PI) / 180);
const KY = 110574;

/** A coordinate on the drawing, in the map's own units. */
export function projectPoint(lat: number, lng: number): { x: number; y: number } {
  return {
    x: ((lng - WEST) * KX) / CAMPUS_MAP.unit,
    y: ((NORTH - lat) * KY) / CAMPUS_MAP.unit,
  };
}

/** The middle of the drawing, for a map with nothing to centre on yet. */
export function campusCentre(): { x: number; y: number } {
  return { x: CAMPUS_MAP.size[0] / 2, y: CAMPUS_MAP.size[1] / 2 };
}

/** A cached building as a place on the map. */
export function toMapPlace(building: Building): MapPlace {
  const { x, y } = projectPoint(building.lat, building.lng);
  return {
    id: building.id,
    name: building.name,
    category: categoryOf(building.type),
    type: building.type,
    verified: building.verification.status === 'verified',
    x,
    y,
  };
}

/** The author and licence of a photo, as docs/design/CREDITS.md records them. */
export interface PhotoCredit {
  author: string;
  licence: string;
}

/** The three MediaMOF pictures share one author and licence. */
const MEDIAMOF: PhotoCredit = { author: 'MediaMOF', licence: 'CC BY-SA 4.0' };

/**
 * The photo that shows this very place, or nothing (CREDITS.md says which building each
 * picture's sign names). A word match is not enough on a list of real places: the library photo
 * is Albert Ilemobade's frontage, so it cannot stand in for SEET or SAAT, and the gate photo is
 * the main gate, which no row is. A place with no photo shows its category icon.
 */
const PLACE_PHOTOS: { match: RegExp; photo: string; credit: PhotoCredit }[] = [
  {
    match: /^albert ilemobade library$/i,
    photo: 'library',
    credit: MEDIAMOF,
  },
  {
    match: /^school of computing$/i,
    photo: 'computing',
    credit: MEDIAMOF,
  },
  // "CRC OBAKEKERE" is another site, so only the full name or the bare abbreviation counts.
  { match: /^(crc|computer resource cent(re|er).*)$/i, photo: 'crc', credit: MEDIAMOF },
  {
    // The sign reads "Centre for Continuing Education, Multi-purpose Hall".
    match: /multipurpose hall|continuing education/i,
    photo: 'hall',
    credit: MEDIAMOF,
  },
];

/** `s` is the 384 px row picture, `l` the 768 px hero (CREDITS.md keeps both). */
export type PhotoSize = 's' | 'l';

export function placePhoto(name: string, size: PhotoSize = 's'): string | undefined {
  const photo = PLACE_PHOTOS.find((entry) => entry.match.test(name.trim()))?.photo;
  return photo ? `/photos/${photo}-${size}.webp` : undefined;
}

/** The author and licence for the photo `placePhoto` gives, as CREDITS.md records them. */
export function placePhotoCredit(name: string): PhotoCredit | undefined {
  return PLACE_PHOTOS.find((entry) => entry.match.test(name.trim()))?.credit;
}

/**
 * The closest other places on the drawing, nearest first — the three rows under "Nearby"
 * (screenshot place-390). Distances are in the drawing's units, so they compare like-for-like.
 */
export function nearbyPlaces(places: MapPlace[], id: string, count = 3): MapPlace[] {
  const here = places.find((place) => place.id === id);
  if (!here) return [];
  return places
    .filter((place) => place.id !== id)
    .map((place) => ({ place, away: Math.hypot(place.x - here.x, place.y - here.y) }))
    .sort((a, b) => a.away - b.away)
    .slice(0, count)
    .map((entry) => entry.place);
}

/**
 * All places in the design's order (screenshot map-390): libraries, lecture theatres, buildings,
 * food, sports, health, hostels, then gates, alphabetical inside each group. The same order
 * drives the list and the first place the screen selects.
 */
export function sortPlaces(places: MapPlace[]): MapPlace[] {
  const rank = (place: MapPlace) => LIST_ORDER.indexOf(place.category);
  return [...places].sort(
    (a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
  );
}

export interface PlaceFilter {
  /** What the student typed in the search field. Empty means everything. */
  q?: string;
  /** The chosen chip, or null for "all categories". */
  category?: MapCategory | null;
}

/** The places the pins and the list show. Search is a plain case-insensitive name match. */
export function filterPlaces(places: MapPlace[], { q, category }: PlaceFilter = {}): MapPlace[] {
  const needle = (q ?? '').trim().toLowerCase();
  return places.filter(
    (place) =>
      (!category || place.category === category) &&
      (!needle || place.name.toLowerCase().includes(needle)),
  );
}

/** "25 places" / "1 place", from the design's count line. */
export function countLabel(count: number): string {
  const template = count === 1 ? COPY.map.resultsCountOne : COPY.map.resultsCount;
  return template.replace('{n}', String(count));
}

/** The one-line description under a place, from the map's category copy. */
export function categoryBlurb(category: MapCategory): string {
  return COPY.map.blurbs[category];
}

/** The category's name in words, as the chip and the list label it. */
export function categoryName(category: MapCategory): string {
  return COPY.map.categories[category];
}

/** The category's colour, handed to CSS through a custom property (`--c`). */
export function categoryStyle(category: MapCategory): CSSProperties {
  return { '--c': CATEGORIES[category].color } as CSSProperties;
}
