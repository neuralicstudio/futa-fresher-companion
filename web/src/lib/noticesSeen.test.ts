import { describe, expect, it } from 'vitest';
import { loadSeenIds, rememberSeen, SEEN_KEY, unreadIds } from './noticesSeen';

/** A stand-in for localStorage that keeps its values in memory. */
function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(SEEN_KEY, initial);
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe('the seen list', () => {
  it('starts empty on a phone that has shown nothing', () => {
    expect(loadSeenIds(memoryStorage()).size).toBe(0);
  });

  it('reads back the ids it wrote', () => {
    const storage = memoryStorage();

    rememberSeen(['a', 'b'], storage);

    expect([...loadSeenIds(storage)]).toEqual(['a', 'b']);
  });

  it('treats damaged or blocked storage as nothing seen', () => {
    expect(loadSeenIds(memoryStorage('not json')).size).toBe(0);
    expect(loadSeenIds(memoryStorage('{"a":1}')).size).toBe(0);
    expect(loadSeenIds(memoryStorage('["a",2,null]')).size).toBe(1);
    expect(loadSeenIds(undefined).size).toBe(0);
  });

  it('says whether anything changed, so the screen does not write twice', () => {
    const storage = memoryStorage();

    expect(rememberSeen(['a'], storage)).toBe(true);
    expect(rememberSeen(['a'], storage)).toBe(false);
    expect(rememberSeen(['a', 'b'], storage)).toBe(true);
  });

  it('keeps the newest ids when the list is long', () => {
    const storage = memoryStorage();
    const ids = Array.from({ length: 250 }, (_, index) => `id-${index}`);

    rememberSeen(ids, storage);
    const seen = [...loadSeenIds(storage)];

    expect(seen).toHaveLength(200);
    expect(seen[0]).toBe('id-50');
    expect(seen[199]).toBe('id-249');
  });

  it('does not throw when the phone refuses the write', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
    };

    const result = rememberSeen(['a'], storage);

    // The ids were new, so the list changed even though the write failed.
    expect(result).toBe(true);
  });
});

describe('unreadIds', () => {
  it('is the rows that are not in the seen list', () => {
    const rows = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

    expect([...unreadIds(rows, new Set(['b']))]).toEqual(['a', 'c']);
  });

  it('is empty when the phone has seen everything', () => {
    expect(unreadIds([{ id: 'a' }], new Set(['a'])).size).toBe(0);
  });
});
