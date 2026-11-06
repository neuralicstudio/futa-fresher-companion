import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

// The bar reads the account for the profile button; this screen does not depend on it.
vi.mock('../lib/auth', () => ({
  useAuth: () => ({ status: 'signed-out', user: null, signOut: () => {} }),
}));

import { COPY } from '../copy/pidgin';
import { PHOTOS } from '../lib/creditsView';
import Credits from './Credits';

/** React escapes the quotes in the alt text, so compare against what the markup holds. */
function text(value: string): string {
  return value.replace(/"/g, '&quot;');
}

function render(): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/credits']}>
      <Credits />
    </MemoryRouter>,
  );
}

describe('Credits', () => {
  it('opens with the plain bar, back to Settings, and the one handwritten line', () => {
    const html = render();

    expect(html).toContain('href="/settings"');
    expect(html).toContain('Photo credits');
    expect(html).toContain(COPY.credits.kicker);
    expect(html).toContain(COPY.credits.lead);
  });

  it('lists every photo the app ships, numbered, with its picture', () => {
    const html = render();

    expect(html.match(/class="card credit"/g)).toHaveLength(PHOTOS.length);
    for (const photo of PHOTOS) {
      expect(html).toContain(`/photos/${photo.id}-s.webp`);
      expect(html).toContain(text(photo.alt));
      expect(html).toContain(COPY.credits.used.replace('{where}', photo.used));
      expect(html).toContain(COPY.credits.author.replace('{author}', photo.author));
      expect(html).toContain(COPY.credits.licence.replace('{licence}', photo.licence));
      expect(html).toContain(photo.page);
    }
    // The numbers run down the side, 1 to the last row.
    expect(html).toContain('>1</span>');
    expect(html).toContain(`>${PHOTOS.length}</span>`);
  });

  it('sends each row to its Commons file page in a new tab, safely', () => {
    const html = render();

    expect(html.match(/href="https:\/\/commons\.wikimedia\.org\/wiki\/File:/g)).toHaveLength(
      PHOTOS.length,
    );
    expect(html.match(/target="_blank"/g)).toHaveLength(PHOTOS.length + 1);
    expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(PHOTOS.length + 1);
    // The icon alone means nothing, so the link names the photo it credits.
    for (const photo of PHOTOS) {
      expect(html).toContain(`aria-label="${COPY.credits.source}: ${text(photo.alt)}"`);
    }
  });

  it('credits the map, the icons and the fonts', () => {
    const html = render();

    expect(html).toContain(COPY.credits.mapTitle);
    expect(html).toContain(COPY.credits.mapBody);
    expect(html).toContain('https://www.openstreetmap.org/copyright');
    expect(html).toContain(COPY.credits.mapLink);
    expect(html).toContain(COPY.credits.iconsTitle);
    expect(html).toContain(COPY.credits.iconsBody);
    expect(html).toContain(COPY.credits.fontsTitle);
    expect(html).toContain(COPY.credits.fontsBody);
  });

  it('says what the drawings are, and closes with the licence note and the sign-off', () => {
    const html = render();

    expect(html).toContain(COPY.credits.placeholdersTitle);
    expect(html).toContain(COPY.credits.placeholdersBody);
    expect(html).toContain(COPY.credits.attribution);
    expect(html).toContain(COPY.credits.footer);
  });

  it('ends with the footer, and the way back to this screen from it', () => {
    const html = render();

    expect(html).toContain(COPY.app.footer);
    expect(html).toContain(COPY.app.unofficial);
    expect(html).toContain('href="/credits"');
    expect(html).toContain(COPY.credits.title);
  });
});
