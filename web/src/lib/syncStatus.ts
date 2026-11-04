// Sync state for the UI. A tiny module, so App can import it without loading Dexie.
import { useSyncExternalStore } from 'react';
import { emptyCounts, type SyncProgress } from './sync';

const DISMISS_KEY = 'futa-first-sync-dismissed';

export interface SyncView {
  progress: SyncProgress;
  /** The user chose "Continue without saving" in this browser session. */
  dismissed: boolean;
  /**
   * A first run has ended in this session. Keeps the screen up for its "You're set!" or
   * "Network no strong" state until the student taps the button.
   */
  finished: boolean;
}

const IDLE: SyncProgress = {
  running: false,
  failed: false,
  firstRun: false,
  pages: 0,
  rows: 0,
  counts: emptyCounts(),
};
let view: SyncView = { progress: IDLE, dismissed: readDismissed(), finished: false };
const listeners = new Set<() => void>();

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === 'yes';
  } catch {
    // Storage can be blocked (for example in private mode). The choice then lasts until reload.
    return false;
  }
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function setSyncProgress(progress: SyncProgress): void {
  // The first run's last update turns `running` off: that is when the done or failed state
  // shows. A later run (a retry, or the usual update) leaves `finished` alone.
  const justFinished = view.progress.running && view.progress.firstRun && !progress.running;
  view = { ...view, progress, finished: view.finished || justFinished };
  notify();
}

/** Hides the first-run screen for this session. The sync itself keeps running. */
export function dismissFirstSync(): void {
  view = { ...view, dismissed: true };
  try {
    sessionStorage.setItem(DISMISS_KEY, 'yes');
  } catch {
    // Not stored: the screen stays hidden until the page reloads.
  }
  notify();
}

/**
 * The blocking first-run screen shows while a first sync runs, and stays up afterwards with its
 * done or failed state until the student taps the button. One that was never started (IDLE) or
 * that is already dismissed shows nothing.
 */
export function showFirstSyncScreen(state: SyncView): boolean {
  if (state.dismissed) return false;
  return (state.progress.running && state.progress.firstRun) || state.finished;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSyncView(): SyncView {
  return view;
}

export function useSyncView(): SyncView {
  return useSyncExternalStore(subscribe, () => view);
}
