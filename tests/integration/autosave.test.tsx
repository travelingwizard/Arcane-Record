import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAutosave } from '../../src/features/character-editor/use-autosave';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';
import { useEditorStore } from '../../src/state/editor-store';
import type { CharacterRepository } from '../../src/storage/character-repository';

function AutosaveHarness({ repository }: { repository: CharacterRepository }) {
  useAutosave(repository);
  return null;
}

function FlushHarness({
  repository,
  onFlush,
}: {
  repository: CharacterRepository;
  onFlush: (flush: () => Promise<void>) => void;
}) {
  const { flush } = useAutosave(repository);
  onFlush(flush);
  return null;
}

describe('autosave', () => {
  afterEach(() => {
    vi.useRealTimers();
    act(() => useEditorStore.getState().clear());
  });

  it('moves from unsaved through saving to saved', async () => {
    vi.useFakeTimers();
    const character = createBlankMageCharacter();
    const save = vi.fn(async (candidate: typeof character) => ({
      ...candidate,
      updatedAt: '2026-07-23T12:00:00.000Z',
    }));
    const repository: CharacterRepository = {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      save,
      duplicate: vi.fn(),
      delete: vi.fn(),
    };

    act(() => useEditorStore.getState().load(character));
    render(<AutosaveHarness repository={repository} />);
    act(() => useEditorStore.getState().updateIdentity('name', 'Mara Voss'));

    expect(useEditorStore.getState().saveStatus).toBe('unsaved');
    await act(async () => vi.advanceTimersByTimeAsync(500));

    expect(useEditorStore.getState().saveStatus).toBe('saved');
    expect(save).toHaveBeenCalledOnce();
    expect(useEditorStore.getState().character?.identity.name).toBe(
      'Mara Voss',
    );
  });

  it('serializes overlapping saves so a slow earlier write cannot overwrite a faster later one', async () => {
    vi.useFakeTimers();
    const character = createBlankMageCharacter();
    const callOrder: string[] = [];
    let resolveFirstSave: (() => void) | undefined;
    const save = vi.fn(async (candidate: typeof character) => {
      // Record invocation order immediately, before awaiting anything --
      // this is what distinguishes "started" from "resolved" below.
      callOrder.push(candidate.identity.name);
      if (candidate.identity.name === 'First edit') {
        await new Promise<void>((resolve) => {
          resolveFirstSave = resolve;
        });
      }
      return { ...candidate, updatedAt: new Date().toISOString() };
    });
    const repository: CharacterRepository = {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      save,
      duplicate: vi.fn(),
      delete: vi.fn(),
    };

    act(() => useEditorStore.getState().load(character));
    render(<AutosaveHarness repository={repository} />);

    act(() => useEditorStore.getState().updateIdentity('name', 'First edit'));
    await act(async () => vi.advanceTimersByTimeAsync(500));
    expect(callOrder).toEqual(['First edit']);

    // The first save is now in flight (deliberately held open). Edit
    // again before it resolves so a second save gets debounced and
    // queued behind it.
    act(() => useEditorStore.getState().updateIdentity('name', 'Second edit'));
    await act(async () => vi.advanceTimersByTimeAsync(500));
    // Still only the first call: the second save is queued but cannot
    // start its own `save()` call until the first one's turn finishes.
    expect(callOrder).toEqual(['First edit']);

    await act(async () => {
      resolveFirstSave?.();
      await vi.advanceTimersByTimeAsync(0);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(callOrder).toEqual(['First edit', 'Second edit']);
    expect(useEditorStore.getState().saveStatus).toBe('saved');
    expect(useEditorStore.getState().character?.identity.name).toBe(
      'Second edit',
    );
  });

  it('fails the save (without crashing the queue) when saveIfUnchanged detects a stale write', async () => {
    vi.useFakeTimers();
    const character = createBlankMageCharacter();
    const saveIfUnchanged = vi
      .fn()
      .mockRejectedValue(
        new Error('This character changed or was deleted in another editor.'),
      );
    const repository: CharacterRepository = {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      saveIfUnchanged,
      duplicate: vi.fn(),
      delete: vi.fn(),
    };

    act(() => useEditorStore.getState().load(character));
    render(<AutosaveHarness repository={repository} />);
    act(() => useEditorStore.getState().updateIdentity('name', 'Mara Voss'));
    await act(async () => vi.advanceTimersByTimeAsync(500));

    expect(saveIfUnchanged).toHaveBeenCalledOnce();
    expect(useEditorStore.getState().saveStatus).toBe('error');
  });

  it('prompts before unload while unsaved, and not once saved', async () => {
    vi.useFakeTimers();
    const character = createBlankMageCharacter();
    const repository: CharacterRepository = {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      save: vi.fn(async (candidate) => candidate),
      duplicate: vi.fn(),
      delete: vi.fn(),
    };

    act(() => useEditorStore.getState().load(character));
    render(<AutosaveHarness repository={repository} />);

    const dispatchBeforeUnload = () => {
      const event = new Event('beforeunload', {
        cancelable: true,
      }) as BeforeUnloadEvent;
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };

    expect(dispatchBeforeUnload()).toBe(false);

    act(() => useEditorStore.getState().updateIdentity('name', 'Mara Voss'));
    expect(dispatchBeforeUnload()).toBe(true);

    await act(async () => vi.advanceTimersByTimeAsync(500));
    expect(useEditorStore.getState().saveStatus).toBe('saved');
    expect(dispatchBeforeUnload()).toBe(false);
  });

  it('flush saves immediately through the same queue and is a no-op when already saved', async () => {
    const character = createBlankMageCharacter();
    const save = vi.fn(async (candidate: typeof character) => ({
      ...candidate,
      updatedAt: '2026-07-23T12:00:00.000Z',
    }));
    const repository: CharacterRepository = {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      save,
      duplicate: vi.fn(),
      delete: vi.fn(),
    };

    act(() => useEditorStore.getState().load(character));
    let flush: (() => Promise<void>) | undefined;
    render(
      <FlushHarness
        repository={repository}
        onFlush={(fn) => {
          flush = fn;
        }}
      />,
    );

    // Nothing unsaved yet: flush should not call the repository.
    await act(async () => flush?.());
    expect(save).not.toHaveBeenCalled();

    act(() => useEditorStore.getState().updateIdentity('name', 'Mara Voss'));
    await act(async () => flush?.());

    expect(save).toHaveBeenCalledOnce();
    expect(useEditorStore.getState().saveStatus).toBe('saved');
  });
});
