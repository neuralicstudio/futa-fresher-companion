// Which notices this phone has already put on screen.
//
// The API has no read flag on an announcement, so "Unread" is a local promise: a notice is new
// until the Notices screen has drawn it once. The ids are kept on the phone only, never sent,
// and the list is capped so it cannot grow without end. Clearing the app's data makes every
// saved notice new again, which is honest — the student has not seen them on this phone.
import { browserLocalStorage } from './storage';

export const SEEN_KEY = 'futa-notices-seen';
/** Fired after the seen list changes, so the tab bar can drop its dot. */
export const SEEN_EVENT = 'futa-notices-seen';
/** Only the newest ids matter: an announcement older than this is not shown as new anyway. */
const KEEP = 200;

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

/** The ids already seen on this phone. A missing, blocked or damaged entry means "none". */
export function loadSeenIds(storage: StorageLike | undefined = browserLocalStorage()): Set<string> {
  try {
    const raw = storage?.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

/**
 * Adds the ids to the seen list. Returns true when something changed, so the screen only fires
 * the event and writes storage when it has news. A blocked or full storage is not an error.
 */
export function rememberSeen(
  ids: readonly string[],
  storage: StorageLike | undefined = browserLocalStorage(),
): boolean {
  const seen = loadSeenIds(storage);
  let added = false;
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      added = true;
    }
  }
  if (!added) return false;

  try {
    storage?.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-KEEP)));
  } catch {
    // The phone is full: the labels simply show again next time.
  }
  return true;
}

/** The ids of these rows that have not been on screen yet. */
export function unreadIds(
  rows: readonly { id: string }[],
  seen: ReadonlySet<string>,
): Set<string> {
  return new Set(rows.filter((row) => !seen.has(row.id)).map((row) => row.id));
}
