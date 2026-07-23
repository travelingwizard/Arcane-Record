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
    await act(async () => vi.advanceTimersByTimeAsync(550));

    expect(useEditorStore.getState().saveStatus).toBe('saved');
    expect(save).toHaveBeenCalledOnce();
    expect(useEditorStore.getState().character?.identity.name).toBe(
      'Mara Voss',
    );
  });
});
