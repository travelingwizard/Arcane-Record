import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SpheresSection } from '../../src/components/character/SpheresSection';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';
import { useEditorStore } from '../../src/state/editor-store';

describe('Affinity Sphere editing', () => {
  beforeEach(() => {
    window.localStorage.clear();
    act(() => useEditorStore.getState().load(createBlankMageCharacter()));
  });

  afterEach(() => {
    act(() => useEditorStore.getState().clear());
  });

  it('selects an affinity and replaces the previous affinity', async () => {
    const user = userEvent.setup();
    render(<SpheresSection />);

    const forcesStar = screen.getByRole('button', {
      name: 'Mark Forces as Affinity Sphere',
    });
    expect(forcesStar).toHaveTextContent('☆');

    await user.click(forcesStar);
    expect(useEditorStore.getState().character?.affinitySphere).toBe('forces');
    expect(
      screen.getByRole('button', {
        name: 'Clear Forces as Affinity Sphere',
      }),
    ).toHaveTextContent('★');

    await user.click(
      screen.getByRole('button', {
        name: 'Mark Life as Affinity Sphere',
      }),
    );
    expect(useEditorStore.getState().character?.affinitySphere).toBe('life');
    expect(
      screen.getByRole('button', {
        name: 'Mark Forces as Affinity Sphere',
      }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('clears the current affinity', async () => {
    const user = userEvent.setup();
    render(<SpheresSection />);

    await user.click(
      screen.getByRole('button', {
        name: 'Mark Spirit as Affinity Sphere',
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: 'Clear Spirit as Affinity Sphere',
      }),
    );

    expect(useEditorStore.getState().character?.affinitySphere).toBeNull();
  });
});
