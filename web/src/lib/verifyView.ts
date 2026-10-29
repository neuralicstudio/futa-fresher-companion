// Pure logic for the Verify Data screen. No React, fetch or storage imports.
// The server decides who may verify what (docs/DECISIONS.md decisions 9 and 10). This file only
// shapes the queue the server sent and the words shown for each outcome.
import { ApiError } from '../api/client';
import type {
  VerifiableEntityType,
  VerifyQueue,
  VerifyQueueCounts,
  VerifyQueueItem,
  VerifyRequest,
} from '../api/types';
import { COPY, fill } from './adminCopy';

/** The kinds, in the order of the contract (VerifiableEntityType). Tabs follow this order. */
export const KINDS: readonly VerifiableEntityType[] = [
  'faculties',
  'departments',
  'lecturers',
  'courses',
  'class_reps',
  'buildings',
  'timetable_entries',
  'announcements',
];

export type KindFilter = 'all' | VerifiableEntityType;

/** The server stores at most this many characters of a source (decision 9). */
export const SOURCE_MAX = 300;

// ----------------------------------------------------------------- the list

export type QueueProblemKind = 'offline' | 'forbidden' | 'busy' | 'error';

export interface QueueProblem {
  kind: QueueProblemKind;
  /** Seconds the server asked us to wait (503 only). */
  retryAfter?: number;
}

export interface QueueView {
  kind: KindFilter;
  /** `loading` until the first page of the chosen kind arrives. */
  phase: 'loading' | 'ready' | 'problem';
  problem: QueueProblem | null;
  items: VerifyQueueItem[];
  /** From the last good response; kept while another kind loads, so the tabs do not blink. */
  counts: VerifyQueueCounts | null;
  total: number | null;
  nextCursor: string | null;
  more: 'idle' | 'loading' | 'problem';
}

export function initialQueue(kind: KindFilter = 'all'): QueueView {
  return {
    kind,
    phase: 'loading',
    problem: null,
    items: [],
    counts: null,
    total: null,
    nextCursor: null,
    more: 'idle',
  };
}

export type QueueAction =
  | { type: 'select'; kind: KindFilter }
  | { type: 'retry' }
  | { type: 'loaded'; kind: KindFilter; page: VerifyQueue }
  | { type: 'failed'; kind: KindFilter; problem: QueueProblem }
  | { type: 'more-start' }
  | { type: 'more-loaded'; kind: KindFilter; page: VerifyQueue }
  | { type: 'more-failed'; kind: KindFilter }
  | { type: 'removed'; item: VerifyQueueItem };

/**
 * Every change to the list goes through here. An answer for a kind that is no longer chosen is
 * ignored (a slow response must not overwrite the tab the admin moved to).
 */
export function queueReducer(state: QueueView, action: QueueAction): QueueView {
  switch (action.type) {
    case 'select':
      if (action.kind === state.kind && state.phase !== 'problem') return state;
      return { ...initialQueue(action.kind), counts: state.counts, total: state.total };
    case 'retry':
      return { ...initialQueue(state.kind), counts: state.counts, total: state.total };
    case 'loaded':
      if (action.kind !== state.kind) return state;
      return {
        ...state,
        phase: 'ready',
        problem: null,
        items: action.page.items,
        counts: action.page.counts,
        total: action.page.total,
        nextCursor: action.page.next_cursor,
        more: 'idle',
      };
    case 'failed':
      if (action.kind !== state.kind) return state;
      return { ...state, phase: 'problem', problem: action.problem, items: [], nextCursor: null };
    case 'more-start':
      return state.nextCursor ? { ...state, more: 'loading' } : state;
    case 'more-loaded': {
      if (action.kind !== state.kind) return state;
      const seen = new Set(state.items.map((item) => itemKey(item)));
      const fresh = action.page.items.filter((item) => !seen.has(itemKey(item)));
      return {
        ...state,
        items: [...state.items, ...fresh],
        counts: action.page.counts,
        total: action.page.total,
        nextCursor: action.page.next_cursor,
        more: 'idle',
      };
    }
    case 'more-failed':
      return action.kind === state.kind ? { ...state, more: 'problem' } : state;
    case 'removed':
      return removeItem(state, action.item);
  }
}

export function itemKey(item: Pick<VerifyQueueItem, 'entity_type' | 'id'>): string {
  return `${item.entity_type}:${item.id}`;
}

/** The card leaves the list, and the counts and the total go down by one (never below zero). */
function removeItem(state: QueueView, item: VerifyQueueItem): QueueView {
  const key = itemKey(item);
  if (!state.items.some((other) => itemKey(other) === key)) return state;
  const down = (n: number) => Math.max(0, n - 1);
  return {
    ...state,
    items: state.items.filter((other) => itemKey(other) !== key),
    counts: state.counts
      ? { ...state.counts, [item.entity_type]: down(state.counts[item.entity_type]) }
      : state.counts,
    total: state.total === null ? null : down(state.total),
  };
}

/** True when the list is empty but the server has more: the screen asks for the next page. */
export function needsRefill(state: QueueView): boolean {
  return (
    state.phase === 'ready' &&
    state.items.length === 0 &&
    state.nextCursor !== null &&
    state.more === 'idle'
  );
}

export interface QueueTab {
  kind: KindFilter;
  label: string;
  count: number;
}

/** "All" first, then the kinds that have records waiting (and the chosen kind, even at zero). */
export function queueTabs(
  counts: VerifyQueueCounts | null,
  total: number | null,
  selected: KindFilter,
): QueueTab[] {
  if (!counts) return [];
  const tabs: QueueTab[] = [{ kind: 'all', label: COPY.verify.filterAll, count: total ?? 0 }];
  for (const kind of KINDS) {
    if (counts[kind] > 0 || kind === selected) {
      tabs.push({ kind, label: COPY.kinds[kind].many, count: counts[kind] });
    }
  }
  return tabs;
}

/** The empty-queue message depends on whether the whole queue or one kind is empty. */
export function emptyMessage(selected: KindFilter): { title: string; body: string } {
  return {
    title: COPY.verify.emptyTitle,
    body: selected === 'all' ? COPY.verify.emptyBody : COPY.verify.emptyKind,
  };
}

/** The number on the Admin centre tile. Nothing when there is nothing waiting. */
export function badgeText(total: number | null): string | null {
  if (total === null || total <= 0) return null;
  return total > 99 ? '99+' : String(total);
}

export function waitingLabel(total: number): string {
  return fill(COPY.verify.queueCount, { n: total });
}

// ----------------------------------------------------------------- one card

/** Where the record sits, in words: "Computer Science · Engineering", or null when nowhere. */
export function placeLine(item: VerifyQueueItem): string | null {
  const { faculty, department, scope } = item.belongs_to;
  const parts: string[] = [];
  if (item.entity_type === 'announcements') {
    if (scope) parts.push(COPY.scopes[scope]);
    const where = department?.name ?? faculty?.name;
    if (where) parts.push(where);
  } else {
    if (department) parts.push(department.name);
    if (faculty) parts.push(faculty.name);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "12 Oct 2026", in the device's time zone. An unreadable date gives an empty string. */
export function formatDate(iso: string): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return '';
  const date = new Date(time);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function sourceLine(item: VerifyQueueItem): string | null {
  const source = item.source?.trim();
  return source ? fill(COPY.verify.source, { source }) : null;
}

export function addedLine(item: VerifyQueueItem): string {
  return fill(COPY.verify.added, { date: formatDate(item.created_at) });
}

/** "Updated 14 Oct 2026", only when the record changed on a later day than it was added. */
export function updatedLine(item: VerifyQueueItem): string | null {
  const added = formatDate(item.created_at);
  const updated = formatDate(item.updated_at);
  return updated && updated !== added ? fill(COPY.verify.updated, { date: updated }) : null;
}

// ----------------------------------------------------------------- verifying

export type SourceCheck = { ok: true; source: string } | { ok: false; error: string };

/** The admin must type the source they checked. The server stores up to SOURCE_MAX characters. */
export function checkSource(raw: string): SourceCheck {
  const source = raw.trim();
  if (!source) return { ok: false, error: COPY.verify.needSource };
  if (Array.from(source).length > SOURCE_MAX) {
    return { ok: false, error: fill(COPY.verify.sourceTooLong, { max: SOURCE_MAX }) };
  }
  return { ok: true, source };
}

export function sourceCount(raw: string): string {
  return fill(COPY.verify.sourceCount, { n: Array.from(raw).length, max: SOURCE_MAX });
}

export function buildVerifyRequest(item: VerifyQueueItem, source: string): VerifyRequest {
  return { entity_type: item.entity_type, entity_id: item.id, status: 'verified', source };
}

/** The success panel: who verified, and when, from this device. */
export function verifiedByLine(who: string): string {
  return fill(COPY.verify.verifiedBy, { who });
}

// ----------------------------------------------------------------- errors

/** Why the queue could not be read. 401 never gets here: the client has already signed out. */
export function queueProblem(error: unknown, online: boolean): QueueProblem {
  if (!online) return { kind: 'offline' };
  if (error instanceof ApiError) {
    if (error.status === 403) return { kind: 'forbidden' };
    if (error.status === 503) return { kind: 'busy', retryAfter: error.retryAfter };
  }
  return { kind: 'error' };
}

export function busyBody(retryAfter: number | undefined): string {
  return retryAfter ? fill(COPY.verify.busyBodyIn, { n: retryAfter }) : COPY.verify.busyBody;
}

export interface VerifyProblem {
  message: string;
  /** What the server said, when it said something specific. Shown under the message. */
  serverMessage?: string;
  /** The record is gone (404): it should leave the list. */
  gone?: boolean;
}

const GENERIC_STATUS_TEXT = /^(bad request|unauthorized|forbidden|not found|unprocessable (content|entity)|service unavailable|internal server error)?$/i;

/** The server's own words, only if they say something (not a bare status name). */
function serverSays(error: ApiError): string | undefined {
  const message = error.message.trim();
  return GENERIC_STATUS_TEXT.test(message) ? undefined : message;
}

/** Why a verify failed, in the admin's words, with the server's message when it is specific. */
export function verifyProblem(error: unknown, online: boolean): VerifyProblem {
  if (!online) return { message: COPY.verify.offlineBody };
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return { message: COPY.verify.sessionEnded };
      case 403:
        return { message: COPY.verify.forbiddenVerify, serverMessage: serverSays(error) };
      case 404:
        return { message: COPY.verify.gone, gone: true };
      case 422: {
        // The one rule the server can break here is the source rule, and it says so in words.
        const said = serverSays(error);
        return said
          ? { message: COPY.verify.needSource, serverMessage: said }
          : { message: COPY.verify.verifyFailed };
      }
      case 503:
        return { message: COPY.verify.verifyBusy };
      default:
        return { message: COPY.verify.verifyFailed, serverMessage: serverSays(error) };
    }
  }
  return { message: COPY.verify.verifyFailed };
}

export type VerifyOutcome =
  | { kind: 'invalid'; error: string }
  | { kind: 'failed'; problem: VerifyProblem }
  | { kind: 'verified'; source: string };

/**
 * Everything that happens when the admin presses "Mark verified", except the network call itself
 * (`send`), so it can be tested. A missing source or no connection never reaches `send`.
 */
export async function verifyItem(
  item: VerifyQueueItem,
  rawSource: string,
  online: () => boolean,
  send: (body: VerifyRequest) => Promise<void>,
): Promise<VerifyOutcome> {
  const checked = checkSource(rawSource);
  if (!checked.ok) return { kind: 'invalid', error: checked.error };
  if (!online()) return { kind: 'failed', problem: verifyProblem(new Error('offline'), false) };
  try {
    await send(buildVerifyRequest(item, checked.source));
    return { kind: 'verified', source: checked.source };
  } catch (error) {
    return { kind: 'failed', problem: verifyProblem(error, online()) };
  }
}

export function serverSaysLine(message: string): string {
  return fill(COPY.verify.serverSays, { message });
}
