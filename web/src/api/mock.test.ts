import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  announcements,
  buildings,
  courses,
  departments,
  faculties,
  lecturers,
  timetableEntries,
} from '../mocks/fixtures';
import type { SyncResponse } from './types';
import { runSync, type PageStore, type PageWrite, type SyncQuery } from '../lib/sync';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadMock(pageSize: string) {
  vi.stubEnv('VITE_MOCK_SYNC_PAGE_SIZE', pageSize);
  vi.resetModules();
  return import('./mock');
}

// Records what the engine writes, so the test can count the rows it received.
function recordingStore() {
  const meta = new Map<string, string>();
  const writes: PageWrite[] = [];
  const store: PageStore = {
    async getMeta(key) {
      return meta.get(key);
    },
    async deleteMeta(key) {
      meta.delete(key);
    },
    async applyPage(write) {
      writes.push(write);
      if (write.cursor) meta.set('sync_cursor', write.cursor);
      else meta.delete('sync_cursor');
      if (write.lastSync) meta.set('last_sync', write.lastSync);
    },
  };
  return { store, meta, writes };
}

describe('mock /sync', () => {
  it('returns one page when no page size is set', async () => {
    const { mockRequest } = await loadMock('');

    const page = (await mockRequest('GET', '/sync', {})) as SyncResponse;

    expect(page.next_cursor).toBeNull();
    expect(page.full).toBe(true);
    expect(page.faculties).toHaveLength(faculties.length);
  });

  it('pages through every row with the engine and sends full only on the first page', async () => {
    const { mockRequest } = await loadMock('2');
    const { store, writes } = recordingStore();
    const fetchPage = (query: SyncQuery) =>
      mockRequest('GET', '/sync', query) as Promise<SyncResponse>;

    await runSync({ store, fetchPage });

    const totalRows =
      faculties.length +
      departments.length +
      lecturers.length +
      courses.length +
      timetableEntries.length +
      buildings.length +
      announcements.length;
    const received = writes.reduce(
      (sum, w) =>
        sum + [
            'faculties',
            'departments',
            'lecturers',
            'courses',
            'timetable_entries',
            'buildings',
            'announcements',
          ].reduce(
          (n, name) => n + w.page[name as 'faculties'].length,
          0,
        ),
      0,
    );
    expect(writes.length).toBeGreaterThan(1);
    expect(received).toBe(totalRows);
    expect(writes.map((w) => w.clear)[0]).toBe(true);
    expect(writes.slice(1).every((w) => !w.clear)).toBe(true);
    expect(writes.at(-1)?.lastSync).toBeDefined();
  });
});

describe('mock announcements', () => {
  it('edits only the sent fields, clears an expiry with null, and deletes', async () => {
    const { mockRequest } = await loadMock('');
    const id = announcements[2].id; // the sample with an expiry

    const edited = (await mockRequest('PATCH', `/announcements/${id}`, undefined, {
      title: 'Edited sample',
    })) as { title: string; body: string; expires_at: string | null };
    expect(edited.title).toBe('Edited sample');
    expect(edited.body).toBe(announcements[2].body);
    // Not sent, so kept. (The module is reloaded per test, so compare to "not cleared".)
    expect(edited.expires_at).not.toBeNull();

    const cleared = (await mockRequest('PATCH', `/announcements/${id}`, undefined, {
      expires_at: null,
    })) as { title: string; expires_at: string | null };
    expect(cleared.expires_at).toBeNull();
    expect(cleared.title).toBe('Edited sample');

    expect(await mockRequest('DELETE', `/announcements/${id}`)).toBeUndefined();
    const listed = (await mockRequest('GET', '/announcements', { limit: 50 })) as { id: string }[];
    expect(listed.some((row) => row.id === id)).toBe(false);
  });

  it('answers 404 for an id that is not there, and does not change the fixtures', async () => {
    const { mockRequest } = await loadMock('');

    await expect(
      mockRequest('DELETE', '/announcements/00000000-0000-4000-8000-0000000000aa'),
    ).rejects.toMatchObject({ status: 404 });
    expect(announcements.map((row) => row.title)).not.toContain('Edited sample');
  });
});
