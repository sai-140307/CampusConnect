import { useSyncExternalStore } from 'react';
import { now, onClockOffsetChange, syncClock } from '../utils/campusTime';

/**
 * One shared ticker for the whole app.
 *
 * Every component that shows a time ("3m ago", "Starts in 2h") reads the same
 * `tick` value, so they all update together instead of each running its own
 * interval and drifting apart. The ticker:
 *   - fires on minute boundaries, so labels change exactly when the minute does
 *   - stops while the tab is hidden and catches up the moment it is shown again
 *   - re-syncs with the server clock when the tab regains focus or goes online
 */

const TICK_MS = 30_000;

let tick = now();
let timer: ReturnType<typeof setTimeout> | null = null;
const subscribers = new Set<() => void>();
let detachGlobalListeners: (() => void) | null = null;

function emit() {
  tick = now();
  subscribers.forEach((fn) => fn());
}

function schedule() {
  if (timer) clearTimeout(timer);
  // Align to the next 30-second boundary of the synced clock.
  const delay = TICK_MS - (now() % TICK_MS) + 25;
  timer = setTimeout(() => {
    emit();
    schedule();
  }, delay);
}

function stop() {
  if (timer) clearTimeout(timer);
  timer = null;
}

function start() {
  const refresh = () => {
    if (document.visibilityState === 'hidden') {
      stop();
      return;
    }
    emit();
    schedule();
    void syncClock();
  };

  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('focus', refresh);
  window.addEventListener('online', refresh);
  const offOffset = onClockOffsetChange(() => {
    emit();
    schedule();
  });

  schedule();
  void syncClock();

  detachGlobalListeners = () => {
    document.removeEventListener('visibilitychange', refresh);
    window.removeEventListener('focus', refresh);
    window.removeEventListener('online', refresh);
    offOffset();
    stop();
  };
}

function subscribe(listener: () => void): () => void {
  subscribers.add(listener);
  if (subscribers.size === 1) start();
  return () => {
    subscribers.delete(listener);
    if (subscribers.size === 0 && detachGlobalListeners) {
      detachGlobalListeners();
      detachGlobalListeners = null;
    }
  };
}

const getSnapshot = () => tick;

/** Synced current time in epoch ms. Re-renders the caller every 30 seconds. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
