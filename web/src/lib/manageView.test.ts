import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import type { Announcement, Department, User, UserRole } from '../api/types';
import {
  ALREADY_REMOVED,
  applyOverlay,
  attemptChange,
  buildChanges,
  changeError,
  editValuesOf,
  expiryToLocal,
  formatExpiry,
  isAlreadyRemoved,
  manageableAnnouncements,
  mayManage,
  NO_OVERLAY,
  validateEdit,
  withRemoved,
  withUpsert,
} from './manageView';
import { expiryToIso } from './composerView';

const F1 = '00000000-0000-4000-8000-000000000001';
const F2 = '00000000-0000-4000-8000-000000000002';
const D1 = '00000000-0000-4000-8000-000000000011'; // in F1
const D2 = '00000000-0000-4000-8000-000000000012'; // in F1
const D3 = '00000000-0000-4000-8000-000000000013'; // in F2

const verification = { status: 'unverified' as const };
const department = (id: string, faculty_id: string): Department => ({
  id,
  faculty_id,
  name: `Dept ${id.slice(-2)}`,
  verification,
  updated_at: '2026-01-01T00:00:00Z',
});
const departments = [department(D1, F1), department(D2, F1), department(D3, F2)];

let counter = 0;
function announcement(fields: Partial<Announcement> = {}): Announcement {
  counter += 1;
  return {
    id: `00000000-0000-4000-8000-0000000009${String(counter).padStart(2, '0')}`,
    title: 'Registration opens',
    body: 'Register on the portal.',
    scope: 'university',
    author_id: 'author',
    published_at: '2026-10-01T10:00:00Z',
    expires_at: null,
    verification,
    updated_at: '2026-10-01T10:00:00Z',
    ...fields,
  };
}

function admin(role: UserRole, extra: Partial<User> = {}): User {
  return { id: 'u1', full_name: 'A', email: 'a@b.co', role, ...extra };
}

const NOW = Date.parse('2026-10-22T12:00:00Z');

describe('mayManage', () => {
  const university = announcement({ scope: 'university' });
  const sug = announcement({ scope: 'sug' });
  const faculty1 = announcement({ scope: 'faculty', faculty_id: F1 });
  const faculty2 = announcement({ scope: 'faculty', faculty_id: F2 });
  const dept1 = announcement({ scope: 'department', department_id: D1 });
  const dept3 = announcement({ scope: 'department', department_id: D3 });
  const all = [university, sug, faculty1, faculty2, dept1, dept3];
  const manageable = (user: User, deps = departments) =>
    all.filter((row) => mayManage(user, row, deps));

  it('lets a super admin manage everything', () => {
    expect(manageable(admin('super_admin'))).toEqual(all);
  });

  it('lets SUG manage only SUG announcements', () => {
    expect(manageable(admin('sug'))).toEqual([sug]);
  });

  it('lets a faculty admin manage their faculty and its departments only', () => {
    expect(manageable(admin('faculty_admin', { faculty_id: F1 }))).toEqual([faculty1, dept1]);
    expect(manageable(admin('faculty_admin', { faculty_id: F2 }))).toEqual([faculty2, dept3]);
  });

  it('cannot tell a department\'s faculty when it is not in the cache, so hides it', () => {
    expect(manageable(admin('faculty_admin', { faculty_id: F1 }), [])).toEqual([faculty1]);
  });

  it('lets a department admin manage only their own department', () => {
    expect(manageable(admin('department_admin', { department_id: D1 }))).toEqual([dept1]);
    expect(manageable(admin('department_admin', { department_id: D2 }))).toEqual([]);
  });

  it('shows nothing to scoped admins whose account has no faculty or department', () => {
    expect(manageable(admin('faculty_admin'))).toEqual([]);
    expect(manageable(admin('department_admin'))).toEqual([]);
  });

  it('shows nothing to students and class reps', () => {
    expect(manageable(admin('student'))).toEqual([]);
    expect(manageable(admin('class_rep'))).toEqual([]);
  });
});

describe('manageableAnnouncements', () => {
  it('filters by role, drops expired rows and sorts newest first', () => {
    const older = announcement({ scope: 'sug', published_at: '2026-10-01T00:00:00Z' });
    const newer = announcement({ scope: 'sug', published_at: '2026-10-05T00:00:00Z' });
    const expired = announcement({ scope: 'sug', expires_at: '2026-10-10T00:00:00Z' });
    const university = announcement({ scope: 'university' });

    const result = manageableAnnouncements(
      admin('sug'),
      [older, expired, university, newer],
      departments,
      NOW,
    );

    expect(result).toEqual([newer, older]);
  });
});

describe('the overlay of changes made here', () => {
  const a = announcement({ title: 'From the server' });
  const b = announcement({ title: 'Other' });

  it('keeps a row published here that a stale server list does not have yet', () => {
    const created = announcement({ title: 'Just published' });

    const rows = applyOverlay([a, b], withUpsert(NO_OVERLAY, created));

    expect(rows.map((r) => r.title)).toEqual(['From the server', 'Other', 'Just published']);
  });

  it('shows the edited version over a stale server row', () => {
    const edited = { ...a, title: 'Edited here' };

    const rows = applyOverlay([a, b], withUpsert(NO_OVERLAY, edited));

    expect(rows.map((r) => r.title)).toEqual(['Edited here', 'Other']);
  });

  it('keeps a deleted row out even when a stale server list still has it', () => {
    const rows = applyOverlay([a, b], withRemoved(NO_OVERLAY, a.id));

    expect(rows).toEqual([b]);
  });

  it('forgets an upsert once the row is removed, and the reverse', () => {
    const removed = withRemoved(withUpsert(NO_OVERLAY, a), a.id);
    expect(removed.upserts).toEqual([]);
    expect(removed.removed).toEqual([a.id]);
    expect(withUpsert(removed, a).removed).toEqual([]);
  });
});

describe('expiryToLocal', () => {
  it('is the device-time value the datetime-local field shows, and round-trips', () => {
    const local = '2026-11-02T09:30';
    const iso = expiryToIso(local) as string;

    expect(expiryToLocal(iso)).toBe(local);
  });

  it('is empty for no expiry or an unreadable one', () => {
    expect(expiryToLocal(null)).toBe('');
    expect(expiryToLocal(undefined)).toBe('');
    expect(expiryToLocal('garbage')).toBe('');
  });
});

describe('validateEdit', () => {
  const original = announcement({ expires_at: '2026-11-02T08:30:00Z' });

  it('accepts the unchanged values', () => {
    expect(validateEdit(original, editValuesOf(original), NOW)).toEqual({});
  });

  it('uses the composer limits: title 3 to 200, body 1 to 4000', () => {
    const base = editValuesOf(original);

    expect(validateEdit(original, { ...base, title: 'ab' }, NOW).title).toBeDefined();
    expect(validateEdit(original, { ...base, title: 'x'.repeat(201) }, NOW).title).toBeDefined();
    expect(validateEdit(original, { ...base, title: 'x'.repeat(200) }, NOW).title).toBeUndefined();
    expect(validateEdit(original, { ...base, body: '   ' }, NOW).body).toBeDefined();
    expect(validateEdit(original, { ...base, body: 'x'.repeat(4001) }, NOW).body).toBeDefined();
    expect(validateEdit(original, { ...base, body: 'x'.repeat(4000) }, NOW).body).toBeUndefined();
  });

  it('needs a changed expiry to be in the future', () => {
    const base = editValuesOf(original);

    expect(validateEdit(original, { ...base, expires: '2020-01-01T09:00' }, NOW).expires).toBe(
      'The expiry must be in the future.',
    );
    expect(validateEdit(original, { ...base, expires: '2099-01-01T09:00' }, NOW).expires).toBeUndefined();
  });

  it('does not re-check an expiry that was left alone, so a typo can still be fixed', () => {
    const lapsed = announcement({ expires_at: '2026-10-10T00:00:00Z' });

    expect(validateEdit(lapsed, { ...editValuesOf(lapsed), title: 'Fixed typo' }, NOW)).toEqual({});
  });

  it('allows clearing the expiry', () => {
    expect(validateEdit(original, { ...editValuesOf(original), expires: '' }, NOW)).toEqual({});
  });
});

describe('buildChanges (the PATCH body)', () => {
  const original = announcement({ expires_at: '2026-11-02T08:30:00Z' });

  it('is null when nothing changed, so nothing is sent', () => {
    expect(buildChanges(original, editValuesOf(original))).toBeNull();
  });

  it('is null when the only difference is surrounding spaces', () => {
    const values = { ...editValuesOf(original), title: `  ${original.title}  ` };

    expect(buildChanges(original, values)).toBeNull();
  });

  it('sends only the title when only the title changed, trimmed', () => {
    const values = { ...editValuesOf(original), title: '  New title  ' };

    expect(buildChanges(original, values)).toEqual({ title: 'New title' });
  });

  it('sends only the body when only the body changed', () => {
    const values = { ...editValuesOf(original), body: 'New body' };

    expect(buildChanges(original, values)).toEqual({ body: 'New body' });
  });

  it('sends an untouched expiry as no change, even though the field has no seconds', () => {
    const withSeconds = announcement({ expires_at: '2026-11-02T08:30:45Z' });

    expect(buildChanges(withSeconds, editValuesOf(withSeconds))).toBeNull();
  });

  it('sends a changed expiry as an ISO time with a time zone', () => {
    const values = { ...editValuesOf(original), expires: '2099-01-01T09:00' };

    expect(buildChanges(original, values)).toEqual({ expires_at: expiryToIso('2099-01-01T09:00') });
  });

  it('sends null when the expiry is cleared', () => {
    const values = { ...editValuesOf(original), expires: '' };

    expect(buildChanges(original, values)).toEqual({ expires_at: null });
  });

  it('sends nothing for the expiry when there was none and it is still empty', () => {
    const none = announcement({ expires_at: null });

    expect(buildChanges(none, { ...editValuesOf(none), title: 'Another title' })).toEqual({
      title: 'Another title',
    });
  });

  it('never includes scope, ids or published_at', () => {
    const values = { title: 'A new title', body: 'A new body', expires: '2099-01-01T09:00' };

    expect(Object.keys(buildChanges(original, values) ?? {}).sort()).toEqual([
      'body',
      'expires_at',
      'title',
    ]);
  });
});

describe('changeError and isAlreadyRemoved', () => {
  it('maps 401, 403, 404, 422 and 503', () => {
    expect(changeError(new ApiError(401, 'x'), true)).toMatch(/session has ended/);
    expect(changeError(new ApiError(403, 'x'), true)).toBe('You cannot change this announcement.');
    expect(changeError(new ApiError(404, 'x'), true)).toBe(ALREADY_REMOVED);
    expect(changeError(new ApiError(422, 'x'), true)).toMatch(/not valid/);
    expect(changeError(new ApiError(503, 'x', 5), true)).toMatch(/5 seconds/);
  });

  it('says offline when offline, whatever the error', () => {
    expect(changeError(new ApiError(403, 'x'), false)).toMatch(/offline/);
  });

  it('handles a network failure', () => {
    expect(changeError(new TypeError('Failed to fetch'), true)).toMatch(/Could not reach/);
  });

  it('knows only a 404 means already removed', () => {
    expect(isAlreadyRemoved(new ApiError(404, 'x'))).toBe(true);
    expect(isAlreadyRemoved(new ApiError(403, 'x'))).toBe(false);
    expect(isAlreadyRemoved(new Error('x'))).toBe(false);
  });
});

describe('attemptChange', () => {
  const online = () => true;

  it('returns the value of a request that worked, after exactly one call', async () => {
    const send = vi.fn(async () => 'saved');

    expect(await attemptChange(send, online)).toEqual({ kind: 'ok', value: 'saved' });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('treats a 404 as gone', async () => {
    const send = vi.fn(async () => {
      throw new ApiError(404, 'Announcement not found');
    });

    expect(await attemptChange(send, online)).toEqual({ kind: 'gone' });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it.each([
    [403, 'You cannot change this announcement.'],
    [422, 'Some details are not valid. Check the form and try again.'],
    [503, 'The service is busy right now. Try again shortly.'],
  ])('reports a %i as a message and does not call again', async (status, message) => {
    const send = vi.fn(async () => {
      throw new ApiError(status, 'x');
    });

    expect(await attemptChange(send, online)).toEqual({ kind: 'failed', message });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('never repeats a request that failed with a busy 503 and a Retry-After', async () => {
    const send = vi.fn(async () => {
      throw new ApiError(503, 'busy', 1);
    });

    const outcome = await attemptChange(send, online);

    expect(outcome.kind).toBe('failed');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('sends nothing when offline', async () => {
    const send = vi.fn(async () => 'saved');

    const outcome = await attemptChange(send, () => false);

    expect(outcome).toEqual({
      kind: 'failed',
      message: 'You appear to be offline. Connect to the internet and try again.',
    });
    expect(send).not.toHaveBeenCalled();
  });
});

describe('formatExpiry', () => {
  it('says so when there is no expiry', () => {
    expect(formatExpiry(null)).toBe('No expiry');
    expect(formatExpiry(undefined)).toBe('No expiry');
  });

  it('shows an expiry date and flags an unreadable one', () => {
    expect(formatExpiry('2026-11-02T08:30:00Z')).toMatch(/^Expires .*2026/);
    expect(formatExpiry('garbage')).toBe('Expiry date unknown');
  });
});
