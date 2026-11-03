// Paged /sync client. The storage is passed in, so this file has no IndexedDB dependency and
// can be tested in Node. offline.ts supplies the Dexie store.
import { ApiError } from '../api/client';
import type { SyncResponse } from '../api/types';

export const COLLECTIONS = [
  'faculties',
  'departments',
  'lecturers',
  'courses',
  'class_reps',
  'buildings',
  'timetable_entries',
  'announcements',
] as const;

export const LAST_SYNC_KEY = 'last_sync';
export const CURSOR_KEY = 'sync_cursor';

export type CollectionName = (typeof COLLECTIONS)[number];

export function emptyCounts(): Record<CollectionName, number> {
  return {
    faculties: 0,
    departments: 0,
    lecturers: 0,
    courses: 0,
    class_reps: 0,
    buildings: 0,
    timetable_entries: 0,
    announcements: 0,
  };
}

/** One page, written in a single transaction by the store. */
export interface PageWrite {
  page: SyncResponse;
  /** True only on the first page of a full sync: clear each collection before writing. */
  clear: boolean;
  /** The cursor to resume from next time, or null to remove the saved cursor. */
  cursor: string | null;
  /** Set only on the last page: the value to send as `since` next time. */
  lastSync?: string;
}

export interface PageStore {
  getMeta(key: string): Promise<string | undefined>;
  applyPage(write: PageWrite): Promise<void>;
  deleteMeta(key: string): Promise<void>;
}

// A type alias (not an interface) so it can be passed as apiGet's query record.
export type SyncQuery = {
  since?: string;
  cursor?: string;
};

export interface SyncProgress {
  running: boolean;
  /** True when the last run ended with an error. Cleared when a new run starts. */
  failed: boolean;
  /** True when no last_sync is stored yet: this is the first sync on this device. */
  firstRun: boolean;
  pages: number;
  rows: number;
  /**
   * Rows written per collection so far in this run, for the first-sync screen. The server does
   * not say how many rows a full sync has, so these are counts, never a fraction.
   */
  counts: Record<CollectionName, number>;
}

/** Longest time one /sync page may take before the request is given up. */
export const PAGE_TIMEOUT_MS = 20_000;

export interface SyncOptions {
  store: PageStore;
  /** The signal is aborted when the page times out. */
  fetchPage: (query: SyncQuery, signal: AbortSignal) => Promise<SyncResponse>;
  onProgress?: (progress: SyncProgress) => void;
  pageTimeoutMs?: number;
}

/**
 * Pull pages until the server has no next_cursor. Each page is written in one store
 * transaction together with its cursor. last_sync is written only with the last page.
 * A page that fails or times out is not applied, so the saved cursor stays where it was.
 */
export async function runSync({
  store,
  fetchPage,
  onProgress = () => {},
  pageTimeoutMs = PAGE_TIMEOUT_MS,
}: SyncOptions): Promise<void> {
  const lastSync = await store.getMeta(LAST_SYNC_KEY);
  let cursor = await store.getMeta(CURSOR_KEY);
  const progress: SyncProgress = {
    running: true,
    failed: false,
    firstRun: lastSync === undefined,
    pages: 0,
    rows: 0,
    counts: emptyCounts(),
  };
  onProgress({ ...progress, counts: { ...progress.counts } });
  let restarted = false;

  try {
    for (;;) {
      let page: SyncResponse;
      try {
        const query = cursor ? { cursor } : lastSync ? { since: lastSync } : {};
        page = await fetchWithTimeout(fetchPage, query, pageTimeoutMs);
      } catch (error) {
        if (cursor && !restarted && isCursorRejected(error)) {
          // The saved cursor expired or is malformed. Start again from the stored last_sync,
          // or from a full sync if there is none. Once only, so a second 422 surfaces.
          restarted = true;
          cursor = undefined;
          await store.deleteMeta(CURSOR_KEY);
          continue;
        }
        throw error;
      }

      const next = page.next_cursor;
      await store.applyPage({
        page,
        // The server sends full: true only on the first page of a full sync.
        clear: page.full === true,
        cursor: next || null,
        lastSync: next ? undefined : page.server_time,
      });

      progress.pages += 1;
      const counted = countRows(page);
      progress.rows += counted.total;
      for (const name of COLLECTIONS) progress.counts[name] += counted.counts[name];
      onProgress({ ...progress, counts: { ...progress.counts } });

      if (!next) return;
      cursor = next;
    }
  } catch (error) {
    progress.failed = true;
    throw error;
  } finally {
    onProgress({ ...progress, running: false, counts: { ...progress.counts } });
  }
}

// Rejects when the page takes longer than timeoutMs, even if fetchPage ignores the signal.
async function fetchWithTimeout(
  fetchPage: SyncOptions['fetchPage'],
  query: SyncQuery,
  timeoutMs: number,
): Promise<SyncResponse> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const error = new DOMException('Sync page timed out', 'TimeoutError');
      controller.abort(error);
      reject(error);
    }, timeoutMs);
  });
  try {
    return await Promise.race([fetchPage(query, controller.signal), timedOut]);
  } finally {
    clearTimeout(timer);
  }
}

function isCursorRejected(error: unknown): boolean {
  return error instanceof ApiError && error.status === 422;
}

function countRows(page: SyncResponse): {
  total: number;
  counts: Record<CollectionName, number>;
} {
  const counts = emptyCounts();
  let total = 0;
  for (const name of COLLECTIONS) {
    // The screen counts rows it can show; `rows` also counts deleted ids, so the two can differ.
    counts[name] = page[name].length;
    total += page[name].length + (page.deleted[name] ?? []).length;
  }
  return { total, counts };
}
