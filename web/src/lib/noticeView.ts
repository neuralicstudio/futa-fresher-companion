// Pure helpers for one notice, for the detail screen. No Dexie or React imports, so Vitest can
// run them. The list's helpers (source line, scope chip, dates) live in announcementsView.
import type { Announcement } from '../api/types';
import { COPY } from '../copy/pidgin';
import { formatDay } from './academicsView';

/** "Posted 25 Oct 2026", the line beside the chip. An unreadable date shows nothing. */
export function postedLine(iso: string): string | null {
  const day = formatDay(iso);
  return day ? COPY.notices.posted.replace('{date}', day) : null;
}

/**
 * Who the notice is for, in the student's words: everyone for the whole campus, and their own
 * school or department for the rest. The copy is the same as the filter chips.
 */
export function audienceFor(scope: Announcement['scope']): string {
  switch (scope) {
    case 'faculty':
      return COPY.notices.filters.school;
    case 'department':
      return COPY.notices.filters.department;
    default:
      return COPY.notice.everyone;
  }
}

/**
 * The Expires value: the day it lapses, or "No expiry date". A notice whose date cannot be read
 * is already hidden by the expiry filter, so an unreadable value here falls back to the words.
 */
export function expiresText(iso: string | null | undefined): string {
  if (!iso) return COPY.notice.noExpiry;
  return formatDay(iso) ?? COPY.notice.noExpiry;
}

/**
 * The admin's text, one paragraph per blank line. Single newlines inside a paragraph are kept
 * by the CSS (`white-space: pre-line`), so what the admin wrote is what the student reads.
 */
export function paragraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}
