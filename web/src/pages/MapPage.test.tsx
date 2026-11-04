import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Building } from '../api/types';

// The Map screen is rendered once, as the server would, against a faked cache and connection.
// The drawing comes from the same baked OpenStreetMap module the real screen uses.
const cache: { value: unknown } = { value: null };
let online = true;
vi.mock('../lib/useCachedRows', () => ({ useCachedRows: () => ({ result: cache.value }) }));
vi.mock('../lib/useOnline', () => ({ useOnline: () => online }));
vi.mock('../lib/offline', () => ({ readBuildings: async () => [] }));
vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    status: 'signed-out',
    user: null,
    signIn: async () => {},
    signOut: () => {},
  }),
}));

import MapPage from './MapPage';

const STAMP = '2026-10-25T09:00:00.000+01:00';

function building(over: Partial<Building>): Building {
  return {
    id: 'b',
    name: 'Somewhere',
    type: 'other',
    description: null,
    lat: 7.303,
    lng: 5.137,
    verification: { status: 'unverified', source: 'OpenStreetMap' },
    updated_at: STAMP,
    ...over,
  };
}

const BUILDINGS: Building[] = [
  building({
    id: 'b-bukar',
    name: 'Bukar Ibrahim Lecture Theatre',
    type: 'lecture_hall',
    lat: 7.298038,
    lng: 5.136172,
  }),
  building({
    id: 'b-lib',
    name: 'Albert Ilemobade Library',
    type: 'library',
    lat: 7.304011,
    lng: 5.134428,
  }),
  building({ id: 'b-top', name: 'Toppers Restaurant', type: 'food', lat: 7.302658, lng: 5.135029 }),
  building({
    id: 'b-soc',
    name: 'School of Computing (SOC)',
    type: 'department',
    lat: 7.30461,
    lng: 5.132388,
  }),
  building({
    id: 'b-west',
    name: 'FUTA West Gate',
    type: 'gate',
    lat: 7.294086,
    lng: 5.136387,
  }),
];

function render(path = '/map'): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <MapPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  online = true;
  cache.value = { state: 'ready', value: BUILDINGS };
});

describe('Campus Map', () => {
  it('opens with the hero, its own header and the search field', () => {
    const html = render();

    expect(html).toContain('Find your way!');
    expect(html).toContain('Campus');
    expect(html).toContain('>Map<');
    expect(html).toContain('app-header');
    expect(html).toContain('Search for a building, lecture theatre or place');
    expect(html).toContain('Find your way');
  });

  it('offers the seven quick categories as real toggle buttons', () => {
    const html = render();

    expect(html).toContain('Quick categories');
    expect(html).toContain('Lecture theatres');
    expect(html).toContain('Food and drinks');
    expect(html).toContain('Hostels');
    expect(html).not.toContain('<span>Gates</span>');
    expect(html.match(/class="cat"/g)).toHaveLength(7);
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(7);
  });

  it('draws the campus map with its attribution, never a routing hint', () => {
    const html = render();

    expect(html).toContain('Campus map. Use the list below if you prefer.');
    expect(html).toContain('OpenStreetMap contributors');
    expect(html).toContain('https://www.openstreetmap.org/copyright');
    expect(html).toContain('Licence: ODbL');
    expect(html).toContain('My location');
    expect(html).toContain('Zoom in');
    expect(html).toContain('North is up');
    expect(html).toContain('Directions no dey yet');
    expect(html).not.toMatch(/walking|directions button|route/i);
  });

  it('lists every place in category order with a count', () => {
    const html = render();

    expect(html).toContain('5 places');
    // Libraries first, then lectures, then buildings, then food, then gates.
    expect(html.indexOf('Albert Ilemobade Library')).toBeLessThan(
      html.indexOf('Bukar Ibrahim Lecture Theatre'),
    );
    expect(html.indexOf('Bukar Ibrahim Lecture Theatre')).toBeLessThan(
      html.indexOf('School of Computing (SOC)'),
    );
    expect(html.indexOf('School of Computing (SOC)')).toBeLessThan(
      html.indexOf('Toppers Restaurant'),
    );
    expect(html.indexOf('Toppers Restaurant')).toBeLessThan(html.indexOf('FUTA West Gate'));
    expect(html).toContain('/place/b-bukar');
  });

  it('shows the first place in the card, with its source and hours and two ways out', () => {
    const html = render();

    expect(html).toContain('sel__body');
    expect(html).toContain('Albert Ilemobade Library');
    expect(html).toContain('Source: OpenStreetMap, not yet checked by FUTA');
    expect(html).toContain('Opening hours no dey');
    expect(html).toContain('Books, e-resources and quiet place to study.');
    expect(html).toContain('See details');
    expect(html).toContain('View on map');
  });

  it('filters both the list and the pins from the URL search', () => {
    const html = render('/map?q=library');

    expect(html).toContain('1 place');
    expect(html).toContain('Albert Ilemobade Library');
    expect(html).not.toContain('Bukar Ibrahim Lecture Theatre');
    expect(html).not.toContain('FUTA West Gate');
  });

  it('says nothing matched, and suggests what to do next, when the word is wrong', () => {
    const html = render('/map?q=stadium');

    expect(html).toContain('0 places');
    expect(html).toContain('No place match');
    expect(html).toContain('stadium');
    expect(html).toContain('Check the spelling, try a shorter word, or pick a category.');
    expect(html).not.toContain('place-row');
  });

  it('says the map works offline when the phone has no network', () => {
    online = false;
    const html = render();

    expect(html).toContain('Map dey work offline. E no need data.');
    expect(html).not.toContain('Directions no dey yet');
  });

  it('shows "Verified" only for a place an admin actually checked', () => {
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

    expect(html).toContain('Verified');
    expect(html).not.toContain('Source: OpenStreetMap, not yet checked by FUTA');
  });

  it('asks for a sync instead of showing an empty map', () => {
    cache.value = { state: 'ready', value: [] };

    const html = render();

    expect(html).toContain('No place dey saved yet');
    expect(html).toContain('Connect to data once, and Sabi go save the list.');
  });

  it('shows the loading line while the cache is being read', () => {
    cache.value = { state: 'loading' };

    const html = render();

    expect(html).toContain('Dey load');
    expect(html).not.toContain('mapcard');
  });
});
