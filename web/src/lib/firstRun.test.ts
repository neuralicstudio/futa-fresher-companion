import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hasSeenWelcome, markWelcomeSeen } from './firstRun';

// The tests run in Node, which has no localStorage. A small Map stands in for the browser's.
function mapStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
    key: () => null,
    get length() {
      return data.size;
    },
  } as Storage;
}

beforeEach(() => {
  vi.stubGlobal('localStorage', mapStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the Welcome flag', () => {
  it('is unset on a fresh phone, so Welcome shows', () => {
    expect(hasSeenWelcome()).toBe(false);
  });

  it('stays set after the student starts', () => {
    markWelcomeSeen();
    expect(hasSeenWelcome()).toBe(true);
  });

  it('only accepts its own value', () => {
    localStorage.setItem('sabi-welcomed', 'maybe');
    expect(hasSeenWelcome()).toBe(false);
  });

  it('treats blocked storage as already seen, so Welcome cannot loop', () => {
    vi.stubGlobal('localStorage', {
      getItem() {
        throw new Error('blocked');
      },
    });
    expect(hasSeenWelcome()).toBe(true);
  });
});
