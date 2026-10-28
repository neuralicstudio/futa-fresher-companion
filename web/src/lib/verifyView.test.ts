import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import type { VerifyQueue, VerifyQueueCounts, VerifyQueueItem } from '../api/types';
import { COPY } from './adminCopy';
import {
  addedLine,
  badgeText,
  buildVerifyRequest,
  busyBody,
  checkSource,
  emptyMessage,
  formatDate,
  initialQueue,
  itemKey,
  KINDS,
  needsRefill,
  placeLine,
  queueProblem,
  queueReducer,
  queueTabs,
  SOURCE_MAX,
  sourceCount,
  sourceLine,
  updatedLine,
  verifiedByLine,
  verifyItem,
  verifyProblem,
  waitingLabel,
  type QueueView,
} from './verifyView';

const ZERO: VerifyQueueCounts = {
  faculties: 0,
  departments: 0,
  lecturers: 0,
  courses: 0,
  class_reps: 0,
  buildings: 0,
  timetable_entries: 0,
  announcements: 0,
};

function item(over: Partial<VerifyQueueItem> = {}): VerifyQueueItem {
  return {
    entity_type: 'courses',
    id: 'c1',
    name: 'CSC101 Intro',
    belongs_to: { faculty: null, department: null },
    source: null,
    created_at: '2026-10-12T12:00:00Z',
    updated_at: '2026-10-12T12:00:00Z',
    ...over,
  };
}

function page(items: VerifyQueueItem[], over: Partial<VerifyQueue> = {}): VerifyQueue {
  return {
    items,
    next_cursor: null,
    counts: { ...ZERO, courses: items.length },
    total: items.length,
    ...over,
  };
}

function ready(items: VerifyQueueItem[], over: Partial<QueueView> = {}): QueueView {
  const loaded = queueReducer(initialQueue(), {
    type: 'loaded',
    kind: 'all',
    page: page(items, { counts: { ...ZERO, courses: 2, lecturers: 1 }, total: 3 }),
  });
  return { ...loaded, ...over };
}

describe('the kinds', () => {
  it('are the eight of the contract, each with words', () => {
    expect([...KINDS].sort()).toEqual(Object.keys(ZERO).sort());
    expect(Object.keys(COPY.kinds).sort()).toEqual(Object.keys(ZERO).sort());
  });
});

describe('the list reducer', () => {
  it('starts loading, and the first page makes it ready', () => {
    const state = queueReducer(initialQueue(), {
      type: 'loaded',
      kind: 'all',
      page: page([item()], { next_cursor: 'abc' }),
    });

    expect(state.phase).toBe('ready');
    expect(state.items).toHaveLength(1);
    expect(state.nextCursor).toBe('abc');
    expect(state.total).toBe(1);
  });

  it('ignores a slow answer for a kind that is no longer chosen', () => {
    const chosen = queueReducer(initialQueue('all'), { type: 'select', kind: 'courses' });

    const state = queueReducer(chosen, { type: 'loaded', kind: 'all', page: page([item()]) });

    expect(state.phase).toBe('loading');
    expect(state.items).toEqual([]);
    expect(queueReducer(chosen, { type: 'failed', kind: 'all', problem: { kind: 'error' } })).toBe(
      chosen,
    );
  });

  it('keeps the tab counts while another kind loads', () => {
    const state = queueReducer(ready([item()]), { type: 'select', kind: 'lecturers' });

    expect(state.phase).toBe('loading');
    expect(state.items).toEqual([]);
    expect(state.counts?.courses).toBe(2);
    expect(state.total).toBe(3);
  });

  it('does nothing when the chosen kind is chosen again', () => {
    const state = ready([item()]);
    expect(queueReducer(state, { type: 'select', kind: 'all' })).toBe(state);
  });

  it('shows a problem, and Try again loads from the start', () => {
    const failed = queueReducer(initialQueue(), {
      type: 'failed',
      kind: 'all',
      problem: { kind: 'offline' },
    });

    expect(failed.phase).toBe('problem');
    expect(failed.problem).toEqual({ kind: 'offline' });
    expect(queueReducer(failed, { type: 'retry' }).phase).toBe('loading');
  });

  it('adds the next page after the first, with no repeats, and takes the newest counts', () => {
    const first = ready([item({ id: 'a' }), item({ id: 'b' })], { nextCursor: 'next' });
    const loading = queueReducer(first, { type: 'more-start' });
    expect(loading.more).toBe('loading');

    const state = queueReducer(loading, {
      type: 'more-loaded',
      kind: 'all',
      page: page([item({ id: 'b' }), item({ id: 'c' })], {
        counts: { ...ZERO, courses: 3 },
        total: 3,
      }),
    });

    expect(state.items.map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(state.nextCursor).toBeNull();
    expect(state.more).toBe('idle');
    expect(state.total).toBe(3);
  });

  it('keeps what is shown when loading more fails', () => {
    const first = ready([item({ id: 'a' })], { nextCursor: 'next', more: 'loading' });

    const state = queueReducer(first, { type: 'more-failed', kind: 'all' });

    expect(state.more).toBe('problem');
    expect(state.items).toHaveLength(1);
    expect(state.nextCursor).toBe('next');
  });

  it('does not start loading more when there is nothing more', () => {
    const state = ready([item()]);
    expect(queueReducer(state, { type: 'more-start' })).toBe(state);
  });

  it('removes a verified card and lowers its kind and the total by one', () => {
    const state = ready([item({ id: 'a' }), item({ id: 'b' })]);

    const after = queueReducer(state, { type: 'removed', item: item({ id: 'a' }) });

    expect(after.items.map((i) => i.id)).toEqual(['b']);
    expect(after.counts?.courses).toBe(1);
    expect(after.counts?.lecturers).toBe(1);
    expect(after.total).toBe(2);
  });

  it('removes only that kind and id, and never counts below zero', () => {
    const lecturer = item({ id: 'a', entity_type: 'lecturers', name: 'Dr X' });
    const state = ready([item({ id: 'a' }), lecturer], {
      counts: { ...ZERO, courses: 1, lecturers: 0 },
      total: 0,
    });

    const after = queueReducer(state, { type: 'removed', item: lecturer });

    expect(after.items.map(itemKey)).toEqual(['courses:a']);
    expect(after.counts?.lecturers).toBe(0);
    expect(after.total).toBe(0);
  });

  it('ignores removing a card that is not in the list', () => {
    const state = ready([item({ id: 'a' })]);
    expect(queueReducer(state, { type: 'removed', item: item({ id: 'zzz' }) })).toBe(state);
  });

  it('asks for the next page when everything shown was verified but more is waiting', () => {
    const state = ready([item({ id: 'a' })], { nextCursor: 'next' });
    const emptied = queueReducer(state, { type: 'removed', item: item({ id: 'a' }) });

    expect(needsRefill(emptied)).toBe(true);
    expect(needsRefill(queueReducer(emptied, { type: 'more-start' }))).toBe(false);
    expect(needsRefill({ ...emptied, nextCursor: null })).toBe(false);
    expect(needsRefill(state)).toBe(false);
  });
});

describe('the tabs', () => {
  const counts = { ...ZERO, courses: 12, buildings: 1 };

  it('start with All and its total, then only the kinds that have records', () => {
    const tabs = queueTabs(counts, 13, 'all');

    expect(tabs.map((t) => [t.kind, t.label, t.count])).toEqual([
      ['all', 'All', 13],
      ['courses', 'Courses', 12],
      ['buildings', 'Buildings', 1],
    ]);
  });

  it('follow the order of the contract', () => {
    const kinds = queueTabs({ ...ZERO, announcements: 1, faculties: 1, lecturers: 1 }, 3, 'all').map(
      (t) => t.kind,
    );
    expect(kinds).toEqual(['all', 'faculties', 'lecturers', 'announcements']);
  });

  it('keep the chosen kind even when it has none left', () => {
    const tabs = queueTabs({ ...ZERO, courses: 0 }, 0, 'courses');
    expect(tabs.map((t) => t.kind)).toEqual(['all', 'courses']);
  });

  it('are empty until the first answer', () => {
    expect(queueTabs(null, null, 'all')).toEqual([]);
  });
});

describe('what a card says', () => {
  it('puts department and faculty on a record of a department', () => {
    const lecturer = item({
      entity_type: 'lecturers',
      belongs_to: {
        department: { id: 'd', name: 'Computer Science' },
        faculty: { id: 'f', name: 'Engineering' },
      },
    });
    expect(placeLine(lecturer)).toBe('Computer Science · Engineering');
  });

  it('puts the faculty on a department', () => {
    const department = item({
      entity_type: 'departments',
      belongs_to: { faculty: { id: 'f', name: 'Engineering' }, department: null },
    });
    expect(placeLine(department)).toBe('Engineering');
  });

  it('says who an announcement is for, and where', () => {
    const notice = item({
      entity_type: 'announcements',
      belongs_to: {
        scope: 'department',
        department: { id: 'd', name: 'Biology' },
        faculty: { id: 'f', name: 'Science' },
      },
    });
    expect(placeLine(notice)).toBe('Department · Biology');
    expect(placeLine(item({ entity_type: 'announcements', belongs_to: { scope: 'sug', faculty: null, department: null } }))).toBe('SUG');
    expect(
      placeLine(
        item({
          entity_type: 'announcements',
          belongs_to: { scope: 'faculty', faculty: { id: 'f', name: 'Science' }, department: null },
        }),
      ),
    ).toBe('School · Science');
  });

  it('says nothing where there is no place (faculties, buildings)', () => {
    expect(placeLine(item({ entity_type: 'buildings' }))).toBeNull();
  });

  it('shows the source only when there is one', () => {
    expect(sourceLine(item({ source: 'HOD office' }))).toBe('Source: HOD office');
    expect(sourceLine(item({ source: '   ' }))).toBeNull();
    expect(sourceLine(item({ source: null }))).toBeNull();
    expect(sourceLine(item({ source: undefined }))).toBeNull();
  });

  it('shows when it was added, and when it changed later', () => {
    const changed = item({ updated_at: '2026-10-20T12:00:00Z' });
    expect(addedLine(changed)).toBe('Added 12 Oct 2026');
    expect(updatedLine(changed)).toBe('Updated 20 Oct 2026');
    expect(updatedLine(item())).toBeNull();
  });

  it('formats dates plainly, and an unreadable date as nothing', () => {
    expect(formatDate('2026-01-05T12:00:00Z')).toBe('5 Jan 2026');
    expect(formatDate('yesterday')).toBe('');
  });

  it('counts and badges', () => {
    expect(waitingLabel(12)).toBe('12 waiting');
    expect(badgeText(null)).toBeNull();
    expect(badgeText(0)).toBeNull();
    expect(badgeText(7)).toBe('7');
    expect(badgeText(99)).toBe('99');
    expect(badgeText(100)).toBe('99+');
  });

  it('has its own empty message for one kind', () => {
    expect(emptyMessage('all')).toEqual({
      title: 'Nothing to verify',
      body: 'Your queue don clean. You don try!',
    });
    expect(emptyMessage('courses').body).toBe(COPY.verify.emptyKind);
  });
});

describe('the source', () => {
  it('is required: empty or only spaces is refused', () => {
    expect(checkSource('')).toEqual({ ok: false, error: COPY.verify.needSource });
    expect(checkSource('   \n ')).toEqual({ ok: false, error: COPY.verify.needSource });
  });

  it('is trimmed, and a link or words are both fine', () => {
    expect(checkSource('  https://futa.edu.ng/cs  ')).toEqual({
      ok: true,
      source: 'https://futa.edu.ng/cs',
    });
    expect(checkSource('HOD office, 12 Oct')).toEqual({ ok: true, source: 'HOD office, 12 Oct' });
  });

  it('can be at most the length the server keeps', () => {
    expect(checkSource('a'.repeat(SOURCE_MAX)).ok).toBe(true);
    const long = checkSource('a'.repeat(SOURCE_MAX + 1));
    expect(long.ok).toBe(false);
    if (!long.ok) expect(long.error).toContain(String(SOURCE_MAX));
  });

  it('counts characters, not UTF-16 units', () => {
    expect(sourceCount('')).toBe(`0 / ${SOURCE_MAX} characters`);
    expect(sourceCount('😀😀')).toBe(`2 / ${SOURCE_MAX} characters`);
    expect(checkSource('😀'.repeat(SOURCE_MAX)).ok).toBe(true);
  });

  it('goes to the server as a verified request for that record', () => {
    expect(buildVerifyRequest(item({ entity_type: 'lecturers', id: 'x1' }), 'HOD office')).toEqual({
      entity_type: 'lecturers',
      entity_id: 'x1',
      status: 'verified',
      source: 'HOD office',
    });
    expect(verifiedByLine('Ada Obi')).toBe('Verified by: Ada Obi');
  });
});

describe('reading the queue went wrong', () => {
  it('says offline when the device is offline', () => {
    expect(queueProblem(new Error('x'), false)).toEqual({ kind: 'offline' });
  });

  it('says forbidden for a 403', () => {
    expect(queueProblem(new ApiError(403, 'Admins only'), true)).toEqual({ kind: 'forbidden' });
  });

  it('says busy for a 503 and keeps the wait', () => {
    expect(queueProblem(new ApiError(503, 'busy', 5), true)).toEqual({ kind: 'busy', retryAfter: 5 });
    expect(busyBody(5)).toBe('Wait 5 seconds and try again.');
    expect(busyBody(undefined)).toBe('Wait small and try again.');
  });

  it('says error for anything else, including a request that never got an answer', () => {
    expect(queueProblem(new ApiError(500, 'x'), true)).toEqual({ kind: 'error' });
    expect(queueProblem(new TypeError('Failed to fetch'), true)).toEqual({ kind: 'error' });
  });
});

describe('verifying went wrong', () => {
  it('offline: says so', () => {
    expect(verifyProblem(new Error('x'), false).message).toBe(COPY.verify.offlineBody);
  });

  it('422: shows the server\'s own words under ours', () => {
    const problem = verifyProblem(
      new ApiError(422, 'A record needs a source before it can be verified. Send a source.'),
      true,
    );
    expect(problem.message).toBe(COPY.verify.needSource);
    expect(problem.serverMessage).toBe(
      'A record needs a source before it can be verified. Send a source.',
    );
  });

  it('422 with no specific words: a general failure, not a wrong guess about the source', () => {
    expect(verifyProblem(new ApiError(422, 'Unprocessable Entity'), true)).toEqual({
      message: COPY.verify.verifyFailed,
    });
    expect(verifyProblem(new ApiError(422, ''), true).serverMessage).toBeUndefined();
  });

  it('403: says the admin may not verify this record', () => {
    const problem = verifyProblem(new ApiError(403, 'You cannot verify this record'), true);
    expect(problem.message).toBe(COPY.verify.forbiddenVerify);
    expect(problem.serverMessage).toBe('You cannot verify this record');
  });

  it('404: the record is gone', () => {
    expect(verifyProblem(new ApiError(404, 'Record not found'), true)).toEqual({
      message: COPY.verify.gone,
      gone: true,
    });
  });

  it('503: busy; other errors: general; no answer at all: general', () => {
    expect(verifyProblem(new ApiError(503, 'x', 5), true).message).toBe(COPY.verify.verifyBusy);
    expect(verifyProblem(new ApiError(500, 'Internal Server Error'), true)).toEqual({
      message: COPY.verify.verifyFailed,
    });
    expect(verifyProblem(new TypeError('Failed to fetch'), true).message).toBe(
      COPY.verify.verifyFailed,
    );
  });

  it('401: says the session ended', () => {
    expect(verifyProblem(new ApiError(401, 'Invalid or expired token'), true).message).toBe(
      COPY.verify.sessionEnded,
    );
  });
});

describe('pressing "Mark verified"', () => {
  const online = () => true;

  it('never sends without a source', async () => {
    const send = vi.fn();

    for (const source of ['', '   ']) {
      const outcome = await verifyItem(item(), source, online, send);
      expect(outcome).toEqual({ kind: 'invalid', error: COPY.verify.needSource });
    }
    expect(send).not.toHaveBeenCalled();
  });

  it('never sends while offline', async () => {
    const send = vi.fn();

    const outcome = await verifyItem(item(), 'HOD office', () => false, send);

    expect(outcome).toEqual({
      kind: 'failed',
      problem: { message: COPY.verify.offlineBody },
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('sends that record with the trimmed source, and reports it verified', async () => {
    const send = vi.fn().mockResolvedValue(undefined);

    const outcome = await verifyItem(item({ id: 'c9' }), '  HOD office ', online, send);

    expect(outcome).toEqual({ kind: 'verified', source: 'HOD office' });
    expect(send).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith({
      entity_type: 'courses',
      entity_id: 'c9',
      status: 'verified',
      source: 'HOD office',
    });
  });

  it('turns a refused call into a message the screen can show', async () => {
    const send = vi.fn().mockRejectedValue(new ApiError(403, 'You cannot verify this record'));

    const outcome = await verifyItem(item(), 'HOD office', online, send);

    expect(outcome).toEqual({
      kind: 'failed',
      problem: {
        message: COPY.verify.forbiddenVerify,
        serverMessage: 'You cannot verify this record',
      },
    });
  });

  it('reports a record that is gone, so the card can leave the list', async () => {
    const send = vi.fn().mockRejectedValue(new ApiError(404, 'Record not found'));

    const outcome = await verifyItem(item(), 'HOD office', online, send);

    expect(outcome).toMatchObject({ kind: 'failed', problem: { gone: true } });
  });

  it('tells a lost connection apart from a refusal', async () => {
    let up = true;
    const send = vi.fn().mockImplementation(async () => {
      up = false;
      throw new TypeError('Failed to fetch');
    });

    const outcome = await verifyItem(item(), 'HOD office', () => up, send);

    expect(outcome).toEqual({ kind: 'failed', problem: { message: COPY.verify.offlineBody } });
  });
});
