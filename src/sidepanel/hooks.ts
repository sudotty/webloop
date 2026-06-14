import { useCallback } from 'react';
import { useStore } from './store';

/** Wraps async click handlers so any thrown error surfaces as a toast instead
 *  of an unhandled rejection — mirrors the original bindActions try/catch. */
export function useGuard() {
  const { showToast } = useStore();
  return useCallback(
    (fn: () => unknown | Promise<unknown>) =>
      () => {
        try {
          const r = fn();
          if (r instanceof Promise) r.catch((err) => showToast((err as Error).message || String(err)));
        } catch (err) {
          showToast((err as Error).message || String(err));
        }
      },
    [showToast]
  );
}
