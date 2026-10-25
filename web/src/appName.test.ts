import { describe, expect, it } from 'vitest';

// Every file a student's screen, tab title or install prompt can come from. Tests and the
// generated API types are left out. Internal names such as the 'futa-companion' database name
// have a hyphen, so they do not match the patterns below.
const sources = import.meta.glob(
  [
    '/src/**/*.{ts,tsx,css}',
    '!/src/**/*.test.*',
    '!/src/api/schema.d.ts',
    '/index.html',
    '/vite.config.ts',
    '/brand.ts',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

// The names the app had before "Sabi". Use APP_NAME from src/appName.ts instead.
const OLD_NAMES = [/Fresher\s+Companion/i, /Campus\s+Companion/i, /FUTA\s+Companion/i];

describe('the app name', () => {
  it('finds the source files to check', () => {
    expect(Object.keys(sources)).toEqual(
      expect.arrayContaining(['/index.html', '/vite.config.ts', '/src/pages/Home.tsx']),
    );
  });

  it('would notice each old name', () => {
    for (const text of ['FUTA Fresher Companion', 'Campus Companion', 'FUTA companion']) {
      expect(OLD_NAMES.some((pattern) => pattern.test(text))).toBe(true);
    }
    expect(OLD_NAMES.some((pattern) => pattern.test('futa-companion'))).toBe(false);
  });

  it('is not written out as an old name in anything students see', () => {
    const found: string[] = [];
    for (const [path, text] of Object.entries(sources)) {
      for (const pattern of OLD_NAMES) {
        if (pattern.test(text)) found.push(`${path} matches ${pattern}`);
      }
    }

    expect(found).toEqual([]);
  });
});
