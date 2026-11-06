import { describe, expect, it } from 'vitest';
import { COPY } from '../copy/pidgin';
import {
  formatBytes,
  lastSavedText,
  profileLine,
  savedAt,
  storagePercent,
  storageText,
} from './settingsView';

describe('savedAt', () => {
  it('writes the day and time in Nigerian local time, in the mockup order', () => {
    // 08:12 UTC is 09:12 in Lagos.
    expect(savedAt('2026-10-25T08:12:00Z')).toBe('Sun 25 Oct 2026, 09:12 am');
  });

  it('has nothing to say about a missing or broken date', () => {
    expect(savedAt(null)).toBeNull();
    expect(savedAt('')).toBeNull();
    expect(savedAt('yesterday')).toBeNull();
  });
});

describe('lastSavedText', () => {
  it('fills the saved day into the line', () => {
    expect(lastSavedText('2026-10-25T08:12:00Z')).toBe(
      'Last saved: Sun 25 Oct 2026, 09:12 am',
    );
  });

  it('says never yet on a phone that has not synced', () => {
    expect(lastSavedText(null)).toBe(`Last saved: ${COPY.settings.neverSaved}`);
  });
});

describe('formatBytes', () => {
  it('uses the unit a phone would use', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(142 * 1024 * 1024)).toBe('142 MB');
    expect(formatBytes(42 * 1024 * 1024 * 1024)).toBe('42 GB');
  });

  it('gives nothing for a number that is not a size', () => {
    expect(formatBytes(-1)).toBe('');
    expect(formatBytes(Number.NaN)).toBe('');
  });
});

describe('storageText', () => {
  it('reads used of total', () => {
    expect(storageText(142 * 1024 * 1024, 500 * 1024 * 1024)).toBe('142 MB of 500 MB');
  });

  it('stays quiet when the browser will not say, or there is no room', () => {
    expect(storageText(null, 500)).toBeNull();
    expect(storageText(10, null)).toBeNull();
    expect(storageText(10, 0)).toBeNull();
    expect(storageText(Number.NaN, 100)).toBeNull();
  });
});

describe('storagePercent', () => {
  it('draws the share of the quota', () => {
    expect(storagePercent(50, 100)).toBe(50);
    expect(storagePercent(150, 100)).toBe(100);
  });

  it('keeps a sliver for a tiny use, and nothing for none', () => {
    expect(storagePercent(0, 100)).toBe(0);
    expect(storagePercent(0.0001, 100)).toBe(1);
  });

  it('has nothing to draw without both numbers', () => {
    expect(storagePercent(null, 100)).toBe(0);
    expect(storagePercent(10, 0)).toBe(0);
  });
});

describe('profileLine', () => {
  it('names the department and the level', () => {
    expect(profileLine('Computer Science', 100)).toBe('Computer Science, 100 Level');
  });

  it('says only what it knows', () => {
    expect(profileLine('Computer Science', null)).toBe('Computer Science');
    expect(profileLine(null, 200)).toBe('200 Level');
    expect(profileLine(null, null)).toBe('');
  });
});
