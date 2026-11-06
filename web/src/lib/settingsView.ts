// Pure helpers for the Settings screen. No Dexie, React or storage imports, so Vitest can run
// them. The screen itself supplies the numbers: this file only turns them into the words.
import { COPY } from '../copy/pidgin';

// Nigerian local time, so "last saved" is the time the student saw on their phone, not UTC.
const SAVED_FORMAT = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Africa/Lagos',
});

/** "Sun 25 Oct 2026, 09:12 am", the mockup's order. Null when the value is not a date. */
export function savedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return null;

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    SAVED_FORMAT.formatToParts(when).find((item) => item.type === type)?.value ?? '';
  const weekday = part('weekday');
  if (!weekday) return null;

  return (
    `${weekday} ${part('day')} ${part('month')} ${part('year')}, ` +
    `${part('hour')}:${part('minute')} ${part('dayPeriod').toLowerCase()}`
  );
}

/** "Last saved: Sun 25 Oct 2026, 09:12 am", or "Last saved: Never yet" before the first sync. */
export function lastSavedText(iso: string | null | undefined): string {
  const when = savedAt(iso);
  return COPY.settings.lastSaved.replace('{when}', when ?? COPY.settings.neverSaved);
}

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/** Bytes in the words a phone shows: "842 KB", "1.2 MB", "42 GB". */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  // One decimal only when it adds something: below 10, and not for plain bytes.
  const text = unit > 0 && value < 10 ? value.toFixed(1) : String(Math.round(value));
  return `${text} ${UNITS[unit]}`;
}

/** "142 MB of 500 MB", or null when the browser cannot say how much room there is. */
export function storageText(used: number | null, total: number | null): string | null {
  if (used === null || total === null) return null;
  if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) return null;
  return COPY.settings.storageValue
    .replace('{used}', formatBytes(used))
    .replace('{total}', formatBytes(total));
}

/** How full the bar is, 0 to 100. A tiny use still shows a sliver, so the bar is not dead. */
export function storagePercent(used: number | null, total: number | null): number {
  if (used === null || total === null || !Number.isFinite(used) || !Number.isFinite(total)) {
    return 0;
  }
  if (total <= 0 || used <= 0) return 0;
  return Math.max(1, Math.min(100, (used / total) * 100));
}

/**
 * "Computer Science, 100 Level". When the cache has no department yet, the level alone is still
 * true; when neither is known, the line is left out.
 */
export function profileLine(departmentName: string | null, level: number | null): string {
  if (departmentName && level !== null) {
    return COPY.profile.levelLine
      .replace('{department}', departmentName)
      .replace('{level}', String(level));
  }
  if (departmentName) return departmentName;
  if (level !== null) return `${level} Level`;
  return '';
}
