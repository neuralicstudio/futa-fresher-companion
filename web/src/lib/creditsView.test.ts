import { describe, expect, it } from 'vitest';
import { PHOTOS, photoSrc } from './creditsView';

// Vite resolves these at test time, so a row whose file is missing fails here, not in the browser.
const FILES = Object.keys(
  import.meta.glob('../../public/photos/*-s.webp', { eager: true, query: '?url', import: 'default' }),
).map((path) => path.replace(/^.*\//, '').replace(/-s\.webp$/, ''));

describe('PHOTOS', () => {
  it('lists the photos the app ships, in the design order', () => {
    expect(PHOTOS.map((photo) => photo.id)).toEqual([
      'gate',
      'library',
      'computing',
      'physics',
      'hall',
      'crc',
      'studios',
      'road',
      'tree',
    ]);
  });

  it('has no duplicate ids', () => {
    const ids = PHOTOS.map((photo) => photo.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every row has a 384 px file in web/public/photos', () => {
    for (const photo of PHOTOS) {
      expect(FILES, photo.id).toContain(photo.id);
    }
  });

  it('gives every photo what a credit needs: what it shows, who took it and the licence', () => {
    for (const photo of PHOTOS) {
      expect(photo.alt.trim(), photo.id).not.toBe('');
      expect(photo.author.trim(), photo.id).not.toBe('');
      expect(photo.used.trim(), photo.id).not.toBe('');
      expect(['Public domain', 'CC BY-SA 4.0'], photo.id).toContain(photo.licence);
    }
  });

  it('links every photo to the Commons file page its licence can be checked on', () => {
    for (const photo of PHOTOS) {
      expect(photo.page, photo.id).toMatch(
        /^https:\/\/commons\.wikimedia\.org\/wiki\/File:[^ ]+$/,
      );
    }
  });

  it('never names a building the photo does not show', () => {
    // Only photos whose sign uses the name may carry it in the alt text (CREDITS.md).
    const library = PHOTOS.find((photo) => photo.id === 'library');
    const computing = PHOTOS.find((photo) => photo.id === 'computing');
    expect(library?.alt).toContain('Albert Ilemobade Library');
    expect(computing?.alt).toContain('School of Computing');
    // The tree and the road show no sign, so they say only what is visible.
    expect(PHOTOS.find((photo) => photo.id === 'tree')?.alt).not.toMatch(/school of/i);
    expect(PHOTOS.find((photo) => photo.id === 'road')?.alt).not.toMatch(/school of/i);
  });
});

describe('photoSrc', () => {
  it('points at the 384 px file a row shows', () => {
    expect(photoSrc('gate')).toBe('/photos/gate-s.webp');
    expect(photoSrc('tree')).toBe('/photos/tree-s.webp');
  });
});
