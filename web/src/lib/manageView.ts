// Pure logic for managing (editing and deleting) announcements in the Admin page.
// No React, Dexie or storage imports, so Vitest can run it.
import { ApiError } from '../api/client';
import type { Announcement, AnnouncementUpdate, Department, User } from '../api/types';
import type { FieldErrors } from './authView';
import { friendlyError } from './authView';
import { bodyError, expiryError, expiryToIso, titleError } from './composerView';
import { sortNewestFirst } from './announcementsView';
import { notExpired } from './visibility';

/**
 * Whether the server would let this admin change the announcement. The same rules as the
 * server's publish check and the composer (scopesForRole / targetPicker). It only decides what
 * to list: the server decides again on every change, and may still say 403.
 */
export function mayManage(
  user: User,
  announcement: Announcement,
  departments: readonly Department[],
): boolean {
  switch (user.role) {
    case 'super_admin':
      return true;
    case 'sug':
      return announcement.scope === 'sug';
    case 'faculty_admin': {
      const own = user.faculty_id;
      if (!own) return false;
      if (announcement.scope === 'faculty') return announcement.faculty_id === own;
      if (announcement.scope === 'department') {
        // A department's faculty comes from the cache. Not saved yet means we cannot tell.
        const department = departments.find((d) => d.id === announcement.department_id);
        return department?.faculty_id === own;
      }
      return false;
    }
    case 'department_admin': {
      const own = user.department_id;
      return Boolean(own) && announcement.scope === 'department' && announcement.department_id === own;
    }
    default:
      return false;
  }
}

/** What this admin sees under "Your announcements": manageable, not expired, newest first. */
export function manageableAnnouncements(
  user: User,
  rows: readonly Announcement[],
  departments: readonly Department[],
  now: number,
): Announcement[] {
  const live = notExpired(rows, now).filter((row) => mayManage(user, row, departments));
  return sortNewestFirst(live);
}

/**
 * Changes made on this device, laid over the list the server sent. The public list can be up
 * to about 30 seconds behind (shared cache), so without this a row just published, edited or
 * deleted here would flip back until the cache catches up.
 */
export interface Overlay {
  /** Rows created or edited here, newest version. */
  upserts: Announcement[];
  /** Ids deleted here, or found to be already gone. */
  removed: string[];
}

export const NO_OVERLAY: Overlay = { upserts: [], removed: [] };

export function withUpsert(overlay: Overlay, row: Announcement): Overlay {
  return {
    upserts: [...overlay.upserts.filter((r) => r.id !== row.id), row],
    removed: overlay.removed.filter((id) => id !== row.id),
  };
}

export function withRemoved(overlay: Overlay, id: string): Overlay {
  return {
    upserts: overlay.upserts.filter((r) => r.id !== id),
    removed: overlay.removed.includes(id) ? overlay.removed : [...overlay.removed, id],
  };
}

export function applyOverlay(server: readonly Announcement[], overlay: Overlay): Announcement[] {
  const upserted = new Map(overlay.upserts.map((row) => [row.id, row]));
  const kept = server
    .filter((row) => !overlay.removed.includes(row.id))
    .map((row) => upserted.get(row.id) ?? row);
  const known = new Set(kept.map((row) => row.id));
  return [...kept, ...overlay.upserts.filter((row) => !known.has(row.id))];
}

// ---------------------------------------------------------------- the edit form

export interface EditValues {
  title: string;
  body: string;
  /** A datetime-local value (device time), or empty for no expiry. */
  expires: string;
}

export type EditField = 'title' | 'body' | 'expires';

/** An ISO time as a datetime-local value in the device's time, minutes only. Empty for none. */
export function expiryToLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export function editValuesOf(announcement: Announcement): EditValues {
  return {
    title: announcement.title,
    body: announcement.body,
    expires: expiryToLocal(announcement.expires_at),
  };
}

function expiryChanged(original: Announcement, values: EditValues): boolean {
  // Compared as the form shows it. The field has no seconds, so an untouched expiry is "same".
  return values.expires !== expiryToLocal(original.expires_at);
}

/**
 * The same length and expiry rules as the composer. An expiry the admin did not touch is not
 * checked again, so fixing a typo in the title is still possible after the expiry has passed.
 */
export function validateEdit(
  original: Announcement,
  values: EditValues,
  now: number,
): FieldErrors<EditField> {
  const errors: FieldErrors<EditField> = {};
  const title = titleError(values.title);
  if (title) errors.title = title;
  const body = bodyError(values.body);
  if (body) errors.body = body;
  if (expiryChanged(original, values)) {
    const expires = expiryError(values.expires, now);
    if (expires) errors.expires = expires;
  }
  return errors;
}

/**
 * The PATCH body: only the fields that changed. Null when nothing changed, so the page sends
 * nothing. A cleared expiry is sent as null, which removes it. Call validateEdit first.
 */
export function buildChanges(original: Announcement, values: EditValues): AnnouncementUpdate | null {
  const changes: AnnouncementUpdate = {};
  const title = values.title.trim();
  if (title !== original.title.trim()) changes.title = title;
  const body = values.body.trim();
  if (body !== original.body.trim()) changes.body = body;
  if (expiryChanged(original, values)) {
    changes.expires_at = values.expires ? expiryToIso(values.expires) : null;
  }
  return Object.keys(changes).length > 0 ? changes : null;
}

// ---------------------------------------------------------------- showing and failing

export const NO_CHANGES = 'No changes';
export const CONFIRM_DELETE = 'Delete this announcement? Students will stop seeing it.';
export const ALREADY_REMOVED = 'It was already removed.';

/** "No expiry", or the expiry in the device's own time (the same time the edit field shows). */
export function formatExpiry(iso: string | null | undefined): string {
  if (!iso) return 'No expiry';
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return 'Expiry date unknown';
  const text = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(
    when,
  );
  return `Expires ${text}`;
}

/** A 404 on a change means the announcement is gone, so the page drops it from the list. */
export function isAlreadyRemoved(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/**
 * Friendly text for a failed edit or delete. A 401 has already signed the user out (the client
 * does that), so its text is only a fallback. The rest shares the wording used elsewhere.
 */
export function changeError(error: unknown, online: boolean): string {
  if (online && error instanceof ApiError) {
    if (error.status === 401) return 'Your session has ended. Log in again to make changes.';
    if (error.status === 403) return 'You cannot change this announcement.';
    if (error.status === 404) return ALREADY_REMOVED;
  }
  return friendlyError(error, online);
}

export type Outcome<T> =
  | { kind: 'ok'; value: T }
  /** 404: it is already gone, so the page drops it from the list. */
  | { kind: 'gone' }
  | { kind: 'failed'; message: string };

/**
 * Runs one PATCH or DELETE exactly once and says what happened. Offline, nothing is sent.
 * There is no retry here or anywhere below it: a write that did get through must not be
 * applied twice, so the person reads the message and chooses to try again.
 */
export async function attemptChange<T>(
  send: () => Promise<T>,
  online: () => boolean,
): Promise<Outcome<T>> {
  if (!online()) return { kind: 'failed', message: changeError(new Error('offline'), false) };
  try {
    return { kind: 'ok', value: await send() };
  } catch (error) {
    // A 401 has already signed the user out (the client does that).
    if (isAlreadyRemoved(error)) return { kind: 'gone' };
    return { kind: 'failed', message: changeError(error, online()) };
  }
}
