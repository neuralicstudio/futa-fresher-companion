// Reads the verify queue from the server and keeps it in step with what the admin does.
// This is live, private data (the server sends it no-store), so it is not kept in the offline
// cache: when the device is offline the screen says so. The list logic is in verifyView.ts.
import { useCallback, useEffect, useReducer, useState } from 'react';
import { ApiError, request } from '../api/client';
import type { VerifyQueue, VerifyQueueItem } from '../api/types';
import { initialQueue, needsRefill, queueProblem, queueReducer, type KindFilter } from './verifyView';
import { useOnline } from './useOnline';

const QUEUE = '/admin/verify/queue';

export function useVerifyQueue() {
  const [state, dispatch] = useReducer(queueReducer, undefined, () => initialQueue());
  const online = useOnline();
  const loading = state.phase === 'loading';

  // The first page of the chosen kind. Choosing another kind, or Try again, starts it over.
  useEffect(() => {
    if (!loading) return;
    const kind = state.kind;
    const controller = new AbortController();
    request<VerifyQueue>('GET', QUEUE, {
      query: { entity_type: kind === 'all' ? undefined : kind },
      auth: true,
      signal: controller.signal,
    }).then(
      (page) => dispatch({ type: 'loaded', kind, page }),
      (error) => {
        if (controller.signal.aborted) return;
        dispatch({ type: 'failed', kind, problem: queueProblem(error, navigator.onLine) });
      },
    );
    return () => controller.abort();
  }, [loading, state.kind]);

  const retry = useCallback(() => dispatch({ type: 'retry' }), []);

  const loadMore = useCallback(() => {
    if (!state.nextCursor || state.more === 'loading') return;
    const kind = state.kind;
    dispatch({ type: 'more-start' });
    request<VerifyQueue>('GET', QUEUE, {
      query: { entity_type: kind === 'all' ? undefined : kind, cursor: state.nextCursor },
      auth: true,
    }).then(
      (page) => dispatch({ type: 'more-loaded', kind, page }),
      (error) => {
        // A cursor the server no longer accepts (422) cannot be retried: start again instead.
        if (error instanceof ApiError && error.status === 422) dispatch({ type: 'retry' });
        else dispatch({ type: 'more-failed', kind });
      },
    );
  }, [state.nextCursor, state.more, state.kind]);

  // An empty list with more behind it (everything on this page was verified): fetch the next.
  useEffect(() => {
    if (needsRefill(state)) loadMore();
  }, [state, loadMore]);

  // The connection came back while the screen was showing the offline message.
  useEffect(() => {
    if (online && state.phase === 'problem' && state.problem?.kind === 'offline') retry();
  }, [online, state.phase, state.problem, retry]);

  const select = useCallback((kind: KindFilter) => dispatch({ type: 'select', kind }), []);
  const removed = useCallback(
    (item: VerifyQueueItem) => dispatch({ type: 'removed', item }),
    [],
  );

  return { state, online, select, retry, loadMore, removed };
}

/**
 * The number of records waiting, for the badge on the Admin centre tile. Null while unknown,
 * offline, or if the queue could not be read: the tile then simply shows no number.
 */
export function useQueueTotal(): number | null {
  const online = useOnline();
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!online) return;
    const controller = new AbortController();
    // One item is enough: the total counts everything, whatever the page size.
    request<VerifyQueue>('GET', QUEUE, {
      query: { limit: 1 },
      auth: true,
      signal: controller.signal,
    }).then(
      (page) => setTotal(page.total),
      () => {},
    );
    return () => controller.abort();
  }, [online]);

  return total;
}
