import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import pkg from '../../package.json';

// The screen is rendered once, as the server would, against faked cache and auth.
const cache: { value: unknown } = { value: null };
const auth: { status: 'loading' | 'signed-in' | 'signed-out'; user: unknown } = {
  status: 'signed-out',
  user: null,
};

vi.mock('../lib/useCachedRows', () => ({
  useCachedRows: () => ({
    result: cache.value,
    retry: () => {},
    progress: { running: false, firstRun: false, pages: 0 },
  }),
}));
vi.mock('../lib/auth', () => ({ useAuth: () => auth }));
vi.mock('../lib/offline', () => ({
  readSettingsScreen: async () => ({}),
  syncReferenceData: async () => {},
}));

import Settings from './Settings';
import { COPY } from '../copy/pidgin';

function render(): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/settings']}>
      <Settings />
    </MemoryRouter>,
  );
}

function ready(over: { lastSaved?: string | null; departmentName?: string | null } = {}) {
  return {
    state: 'ready',
    value: {
      lastSaved: '2026-10-25T08:12:00Z',
      departmentName: 'Computer Science',
      ...over,
    },
  };
}

function signedInUser(over: Record<string, unknown> = {}) {
  return {
    id: 'u-1',
    full_name: 'Sade Falana',
    email: 'sade@example.com',
    role: 'student',
    matric_no: null,
    faculty_id: 'f-1',
    department_id: 'd-1',
    level: 100,
    ...over,
  };
}

beforeEach(() => {
  auth.status = 'signed-out';
  auth.user = null;
  cache.value = ready();
});

describe('Settings', () => {
  it('opens on the short tree hero, with the one handwritten line', () => {
    const html = render();

    expect(html).toContain('hero--short');
    expect(html).toContain('hero--settings');
    expect(html).toContain('/photos/tree-l.webp');
    expect(html).toContain(COPY.settings.kicker);
    expect(html).toContain(COPY.settings.lead);
    // The name is still the h1 for a screen reader.
    expect(html).toContain('<h1 id="hero-title">Settings</h1>');
  });

  it('asks a guest to log in, and offers no log out', () => {
    const html = render();

    expect(html).toContain('card card--profile');
    expect(html).toContain('href="/login"');
    expect(html).toContain(COPY.profile.guest);
    expect(html).toContain(COPY.settings.profileGuest);
    expect(html).not.toContain(COPY.settings.logout);
  });

  it('shows a signed-in student their name and department, and the way out', () => {
    auth.status = 'signed-in';
    auth.user = signedInUser();

    const html = render();

    expect(html).toContain('SF');
    expect(html).toContain('Sade Falana');
    expect(html).toContain('Computer Science, 100 Level');
    // There is no edit-profile screen yet, so there is no link that goes nowhere.
    expect(html).not.toContain(COPY.settings.profileEdit);
    expect(html).toContain(COPY.settings.logout);
    expect(html).toContain(COPY.settings.logoutBody);
    expect(html).toContain('srow--danger');
  });

  it('says when the data was last saved, in the row under Offline data', () => {
    const html = render();

    expect(html).toContain(COPY.settings.offlineTitle);
    expect(html).toContain('Last saved: Sun 25 Oct 2026, 09:12 am');
  });

  it('says never yet when nothing is saved', () => {
    cache.value = ready({ lastSaved: null });

    expect(render()).toContain(`Last saved: ${COPY.settings.neverSaved}`);
  });

  it('offers Check for updates, and says when the cache cannot be read', () => {
    cache.value = { state: 'error' };

    const html = render();

    expect(html).toContain(COPY.settings.check);
    expect(html).toContain(COPY.settings.savedUnknown);
    expect(html).toContain(COPY.states.retry);
  });

  it('says it is still reading while the cache opens', () => {
    cache.value = { state: 'loading' };

    expect(render()).toContain(COPY.settings.loadingSaved);
  });

  it('shows the real version, and that Sabi is unofficial', () => {
    const html = render();

    expect(html).toContain(COPY.settings.aboutTitle);
    expect(html).toContain(`Version ${pkg.version}.`);
    expect(html).toContain(COPY.app.unofficial);
  });

  it('leaves the storage figure out when the browser will not say', () => {
    // The effect never runs in this render, so the figure is unknown, not invented.
    const html = render();

    expect(html).not.toContain(COPY.settings.storage);
  });

  it('says the profile is loading before the account arrives', () => {
    auth.status = 'loading';

    const html = render();

    expect(html).toContain(COPY.states.loadingTitle);
    expect(html).not.toContain('href="/login"');
    expect(html).not.toContain(COPY.settings.logout);
  });

  it('sends the reader to the photo credits from the About card and the footer', () => {
    const html = render();

    expect(html).toContain(COPY.settings.creditsTitle);
    expect(html).toContain(COPY.settings.creditsBody);
    // One row in the About card, one link in the footer every screen ends with.
    expect(html.match(/href="\/credits"/g)).toHaveLength(2);
  });
});
