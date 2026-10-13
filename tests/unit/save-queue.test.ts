import { describe, expect, it, vi } from 'vitest';
import { createSaveQueue } from '../../src/features/character-editor/save-queue';

interface Snapshot {
  id: string;
  value: string;
}

describe('createSaveQueue', () => {
  it('serializes overlapping saves instead of letting a slow early write land after a faster later one', async () => {
    const order: string[] = [];
    const save = vi.fn(async (snapshot: Snapshot) => {
      // The first save intentionally resolves slower than the second,
      // simulating a slow network/IDB write for an older edit racing a
      // fast write for a newer one.
      const delayMs = snapshot.value === 'first' ? 20 : 0;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      order.push(snapshot.value);
      return snapshot;
    });
    const queue = createSaveQueue<Snapshot>({
      repository: { save },
      initialPersistedData: '',
      getPersistedData: (s) => JSON.stringify(s),
    });

    const firstSave = queue.save({ id: 'a', value: 'first' });
    const secondSave = queue.save({ id: 'a', value: 'second' });
    await Promise.all([firstSave, secondSave]);

    // Without the queue, "first" (20ms) would resolve after "second"
    // (0ms) and the save calls would run out of order; the queue forces
    // them to run -- and therefore complete -- in enqueue order.
    expect(order).toEqual(['first', 'second']);
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('uses saveIfUnchanged when the repository supports it, passing the live baseline', async () => {
    const saveIfUnchanged = vi.fn(async (snapshot: Snapshot) => snapshot);
    const save = vi.fn();
    const queue = createSaveQueue<Snapshot>({
      repository: { save, saveIfUnchanged },
      initialPersistedData: 'baseline-0',
      getPersistedData: (s) => `baseline-${s.value}`,
    });

    await queue.save({ id: 'a', value: '1' });
    expect(saveIfUnchanged).toHaveBeenCalledWith(
      { id: 'a', value: '1' },
      'baseline-0',
    );
    expect(save).not.toHaveBeenCalled();

    // The second save's expected baseline is whatever the first save
    // just wrote, not the original initialPersistedData.
    await queue.save({ id: 'a', value: '2' });
    expect(saveIfUnchanged).toHaveBeenLastCalledWith(
      { id: 'a', value: '2' },
      'baseline-1',
    );
  });

  it('falls back to plain save when the repository has no saveIfUnchanged', async () => {
    const save = vi.fn(async (snapshot: Snapshot) => snapshot);
    const queue = createSaveQueue<Snapshot>({
      repository: { save },
      initialPersistedData: '',
      getPersistedData: (s) => JSON.stringify(s),
    });

    await queue.save({ id: 'a', value: '1' });
    expect(save).toHaveBeenCalledWith({ id: 'a', value: '1' });
  });

  it('rejects this save and keeps the queue usable when saveIfUnchanged refuses a stale write', async () => {
    const saveIfUnchanged = vi
      .fn()
      .mockRejectedValueOnce(
        new Error('This record changed in another editor.'),
      )
      .mockResolvedValueOnce({ id: 'a', value: '2' });
    const queue = createSaveQueue<Snapshot>({
      repository: { save: vi.fn(), saveIfUnchanged },
      initialPersistedData: 'stale-baseline',
      getPersistedData: (s) => `baseline-${s.value}`,
    });

    await expect(queue.save({ id: 'a', value: '1' })).rejects.toThrow(
      'This record changed in another editor.',
    );

    // A failed save must not poison the queue for the next caller.
    await expect(queue.save({ id: 'a', value: '2' })).resolves.toEqual({
      id: 'a',
      value: '2',
    });
    expect(saveIfUnchanged).toHaveBeenCalledTimes(2);
  });

  it('updates the baseline again after resetBaseline is called', async () => {
    const saveIfUnchanged = vi.fn(async (snapshot: Snapshot) => snapshot);
    const queue = createSaveQueue<Snapshot>({
      repository: { save: vi.fn(), saveIfUnchanged },
      initialPersistedData: 'old-baseline',
      getPersistedData: (s) => JSON.stringify(s),
    });

    queue.resetBaseline('reloaded-baseline');
    await queue.save({ id: 'a', value: '1' });
    expect(saveIfUnchanged).toHaveBeenCalledWith(
      { id: 'a', value: '1' },
      'reloaded-baseline',
    );
  });
});
