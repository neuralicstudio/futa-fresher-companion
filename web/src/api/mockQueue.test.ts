import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VerifyQueue } from './types';

afterEach(() => {
  vi.resetModules();
});

// The mock remembers what was verified for as long as the module lives, so each test loads it fresh.
async function loadMock() {
  vi.resetModules();
  const { mockRequest } = await import('./mock');
  const { ApiError } = await import('./client');
  const queue = (query: Record<string, string | number> = {}) =>
    mockRequest('GET', '/admin/verify/queue', query) as Promise<VerifyQueue>;
  return { mockRequest, queue, ApiError };
}

describe('mock GET /admin/verify/queue', () => {
  it('returns the contract shape: items, next_cursor, counts for all eight kinds, total', async () => {
    const { queue } = await loadMock();

    const page = await queue();

    expect(Object.keys(page).sort()).toEqual(['counts', 'items', 'next_cursor', 'total']);
    expect(Object.keys(page.counts).sort()).toEqual([
      'announcements',
      'buildings',
      'class_reps',
      'courses',
      'faculties',
      'departments',
      'lecturers',
      'timetable_entries',
    ].sort());
    expect(page.total).toBe(Object.values(page.counts).reduce((a, b) => a + b, 0));
    for (const item of page.items) {
      expect(Object.keys(item).sort()).toEqual(
        ['belongs_to', 'created_at', 'entity_type', 'id', 'name', 'source', 'updated_at'].sort(),
      );
    }
  });

  it('pages 25 at a time by default, and the cursor leads to the rest with no repeats', async () => {
    const { queue } = await loadMock();

    const first = await queue();
    expect(first.items).toHaveLength(25);
    expect(first.next_cursor).not.toBeNull();

    const seen = [...first.items];
    let cursor = first.next_cursor;
    let pages = 1;
    while (cursor) {
      const next = await queue({ cursor });
      seen.push(...next.items);
      cursor = next.next_cursor;
      pages += 1;
    }

    expect(pages).toBeGreaterThan(1);
    expect(seen).toHaveLength(first.total);
    expect(new Set(seen.map((i) => i.id)).size).toBe(seen.length);
  });

  it('narrows by kind, and the counts do not change', async () => {
    const { queue } = await loadMock();
    const all = await queue();

    const courses = await queue({ entity_type: 'courses', limit: 200 });

    expect(courses.items.every((i) => i.entity_type === 'courses')).toBe(true);
    expect(courses.items).toHaveLength(all.counts.courses);
    expect(courses.counts).toEqual(all.counts);
    expect(courses.total).toBe(all.total);
  });
});

describe('mock POST /admin/verify', () => {
  it('refuses without a source, like the API', async () => {
    const { mockRequest, queue, ApiError } = await loadMock();
    const [first] = (await queue()).items;

    const attempt = mockRequest('POST', '/admin/verify', undefined, {
      entity_type: first.entity_type,
      entity_id: first.id,
      status: 'verified',
    });

    await expect(attempt).rejects.toBeInstanceOf(ApiError);
    await expect(attempt).rejects.toMatchObject({ status: 422 });
  });

  it('answers 404 for a record that is not there', async () => {
    const { mockRequest } = await loadMock();

    await expect(
      mockRequest('POST', '/admin/verify', undefined, {
        entity_type: 'courses',
        entity_id: '00000000-0000-4000-8000-00000000dead',
        status: 'verified',
        source: 'HOD office',
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('takes a verified record out of the queue and lowers the counts', async () => {
    const { mockRequest, queue } = await loadMock();
    const before = await queue({ limit: 200 });
    const target = before.items.find((i) => i.entity_type === 'courses')!;

    const result = await mockRequest('POST', '/admin/verify', undefined, {
      entity_type: target.entity_type,
      entity_id: target.id,
      status: 'verified',
      source: 'HOD office',
    });

    const after = await queue({ limit: 200 });
    expect(result).toBeUndefined();
    expect(after.items.map((i) => i.id)).not.toContain(target.id);
    expect(after.counts.courses).toBe(before.counts.courses - 1);
    expect(after.total).toBe(before.total - 1);
  });
});
