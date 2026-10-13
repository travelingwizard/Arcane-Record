/**
 * Shared "safe autosave" primitive for character editors that persist
 * through IndexedDB on a short debounce.
 *
 * Two protections, proven first in `LocalSheet.tsx`'s own hand-rolled
 * `useLocalSheet` queue and extracted here so other editors (starting
 * with Mage's `useAutosave`) can reuse the same guarantees instead of
 * re-deriving them:
 *
 * 1. A strict FIFO queue: if a new save is requested while a previous
 *    one for the same record is still in flight (e.g. the user kept
 *    typing through the debounce window), the new save waits its turn
 *    rather than racing the old one. Without this, a slow earlier write
 *    can resolve after a faster later one and silently overwrite newer
 *    data with stale data.
 * 2. Optimistic concurrency ("compare and swap"): when the underlying
 *    repository exposes `saveIfUnchanged`, every queued save is rejected
 *    if the stored record no longer matches the last data this queue
 *    itself wrote (or was told to assume as a starting baseline), instead
 *    of blindly overwriting whatever is there now. Repositories without
 *    `saveIfUnchanged` fall back to a plain `save`, matching this
 *    project's existing per-game repository capabilities.
 *
 * This module only encodes those two guarantees. Debounce scheduling,
 * UI status transitions, and "is this save for the still-current edit"
 * revision bookkeeping remain the caller's responsibility (see
 * `useAutosave.ts` for Mage's own Zustand-backed version of that).
 */

/** Debounce delay shared by every character editor's autosave trigger. */
export const AUTOSAVE_DELAY_MS = 500;

export interface SaveQueueRepository<Snapshot> {
  save(snapshot: Snapshot): Promise<Snapshot>;
  saveIfUnchanged?(snapshot: Snapshot, expectedData: string): Promise<Snapshot>;
}

export interface SaveQueue<Snapshot> {
  /**
   * Enqueue a save for `snapshot`. Resolves with the stored result once
   * this save's own turn has run (even if an earlier queued save
   * failed), or rejects if this save itself failed -- including a
   * rejection when `saveIfUnchanged` is available and the record no
   * longer matches this queue's baseline.
   */
  save(snapshot: Snapshot): Promise<Snapshot>;
  /**
   * Re-establish the "last known persisted" baseline, e.g. right after
   * loading a record fresh from storage. Safe to call redundantly --
   * loading a record that already matches the current baseline is a
   * no-op in effect.
   */
  resetBaseline(persistedData: string): void;
}

export function createSaveQueue<Snapshot>(options: {
  repository: SaveQueueRepository<Snapshot>;
  initialPersistedData: string;
  getPersistedData: (snapshot: Snapshot) => string;
}): SaveQueue<Snapshot> {
  let persisted = options.initialPersistedData;
  let queue: Promise<unknown> = Promise.resolve();

  const save = (snapshot: Snapshot): Promise<Snapshot> => {
    const run = queue
      .catch(() => undefined)
      .then(async () => {
        const expected = persisted;
        const stored = options.repository.saveIfUnchanged
          ? await options.repository.saveIfUnchanged(snapshot, expected)
          : await options.repository.save(snapshot);
        persisted = options.getPersistedData(stored);
        return stored;
      });
    // The queue chain itself must never reject (a failed save should not
    // poison every save queued after it), but the promise handed back to
    // this caller must still reject so they learn their own save failed.
    queue = run.catch(() => undefined);
    return run;
  };

  return {
    save,
    resetBaseline(data) {
      persisted = data;
    },
  };
}
