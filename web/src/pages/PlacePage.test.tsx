import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Building } from '../api/types';

// Place detail, rendered once as the server would, against a faked cache. The drawing comes from
// the same baked OpenStreetMap module the real screen uses.
const cache: { value: unknown } = { value: null };
vi.mock('../lib/useCachedRows', () => ({ useCachedRows: () => ({ result: cache.value }) }));
vi.mock('../lib/online', () => ({ useOnline: () => true }));
vi.mock('../lib/offline', () => ({ readBuildings: async () => [] }));
vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    status: 'signed-out',
    user: null,
    signIn: async () => {},
    signOut: () => {},
  }),
}));

import PlacePage from './PlacePage';

const STAMP = '2026-10-25T09:00:00.000+01:00';

function building(over: Partial<Building>): Building {
  return {
    id: 'b',
    name: 'Somewhere',
    type: 'other',
    description: null,
    lat: 7.303,
    lng: 5.137,
    verification: { status: 'unverified', source: 'OpenStreetMap node 1, not yet checked by FUTA' },
    updated_at: STAMP,
    ...over,
  };
}

const LIBRARY = building({
  id: 'b-lib',
  name: 'Albert Ilemobade Library',
  type: 'library',
  lat: 7.304011,
  lng: 5.134428,
});

const BUILDINGS: Building[] = [
  LIBRARY,
  building({
    id: 'b-cce',
    name: 'Center for Continuing Education Lecture hall (CCE)',
    type: 'lecture_hall',
    lat: 7.3044,
    lng: 5.1339,
  }),
  building({ id: 'b-top', name: 'Toppers Restaurant', type: 'food', lat: 7.302658, lng: 5.135029 }),
  building({
    id: 'b-saat',
    name: 'SAAT Library',
    type: 'library',
    lat: 7.2941,
    lng: 5.1364,
  }),
];

function render(path = '/place/b-lib'): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/place/:id" element={<PlacePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  cache.value = { state: 'ready', value: BUILDINGS };
});

describe('Place detail', () => {
  it('opens on the place’s own photo, name, category and a way back to the map', () => {
    const html = render();

    expect(html).toContain('hero--std');
    expect(html).toContain('/photos/library-l.webp');
    expect(html).toContain('See this place');
    expect(html).toContain('Albert Ilemobade Library');
    expect(html).toContain('Libraries');
    expect(html).toContain('Back to map');
    expect(html).toContain('/map');
  });

  it('states the facts, the blurb, the seal and the source', () => {
    const html = render();

    expect(html).toContain('Type');
    expect(html).toContain('Where');
    expect(html).toContain('Source: OpenStreetMap, not yet checked by FUTA');
    expect(html).toContain('Opening hours no dey');
    expect(html).toContain('Books, e-resources and quiet place to study.');
    // Never verified by itself: an unchecked record reads "Not verified yet".
    expect(html).toContain('Not verified yet');
    expect(html).toContain('Updated 25 Oct 2026');
    expect(html).toContain('OpenStreetMap node 1, not yet checked by FUTA');
  });

  it('says "Verified" only for a record an admin actually checked', () => {
    cache.value = {
      state: 'ready',
      value: [
        building({
          id: 'b-lib',
          name: 'Albert Ilemobade Library',
          type: 'library',
          verification: { status: 'verified', source: 'FUTA facilities' },
        }),
      ],
    };

    const html = render();

    expect(html).toContain('seal--verified');
    expect(html).toContain('Verified');
    expect(html).not.toContain('Not verified yet');
  });

  it('offers the locator map, with its attribution and no routing', () => {
    const html = render();

    expect(html).toContain('mapcard--small');
    expect(html).toContain('Campus map. Use the list below if you prefer.');
    expect(html).toContain('OpenStreetMap contributors');
    // A locator, not the tool: no compass, zoom or sample dot.
    expect(html).not.toContain('Zoom in');
    expect(html).not.toContain('North is up');
    expect(html).not.toContain('My location');
  });

  it('points every way into the map, and never into directions', () => {
    const html = render();

    expect(html).toContain('View on map');
    expect(html).toContain('/map?place=b-lib');
    expect(html).not.toMatch(/walking|get directions|route/i);
  });

  it('lists the three closest places, each a link to its own screen', () => {
    const html = render();

    expect(html).toContain('Nearby');
    expect(html.match(/place-row place-row--link/g)).toHaveLength(3);
    expect(html).toContain('/place/b-cce');
    // Never the place itself.
    expect(html).not.toContain('/place/b-lib');
  });

  it('credits the photo it shows, by author and licence', () => {
    const html = render();

    expect(html).toContain('Photo: MediaMOF, CC BY-SA 4.0');
  });

  it('asks for a photo, and draws a building, when there is none for this place', () => {
    const html = render('/place/b-saat');

    expect(html).toContain('card--empty-photo');
    expect(html).toContain('Photo dey come');
    expect(html).toContain('Anybody get correct photo of this place?');
    expect(html).toContain('place-scene');
    // The hero falls back to the drawing; the rows below still show their own pictures.
    expect(html).not.toContain('library-l.webp');
    expect(html).not.toContain('Photo: MediaMOF');
  });

  it('says the place is not saved here, and offers the map, when the id is unknown', () => {
    const html = render('/place/nope');

    expect(html).toContain('This place no dey saved on this phone');
    expect(html).toContain('Connect to data once, and Sabi go save the list.');
    expect(html).toContain('hero--short');
    expect(html).toContain('place-scene');
    expect(html).toContain('Back to map');
    expect(html).not.toContain('Nearby');
  });

  it('waits, and says so, while the cache is still being read', () => {
    cache.value = { state: 'loading' };
    const html = render();

    expect(html).toContain('Dey load');
    expect(html).not.toContain('Nearby');
    expect(html).not.toContain('This place no dey saved on this phone');
  });

  it('says something went wrong instead of pretending the place is missing', () => {
    cache.value = { state: 'error' };
    const html = render();

    expect(html).toContain('Something spoil small');
    expect(html).toContain('Try again. If e still no work, restart Sabi.');
    expect(html).not.toContain('This place no dey saved on this phone');
  });
});
