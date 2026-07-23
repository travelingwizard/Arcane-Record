import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SpheresSection } from '../../src/components/character/SpheresSection';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';
import { useEditorStore } from '../../src/state/editor-store';

describe('Desktop Sphere wheel', () => {
  beforeEach(() => {
    window.localStorage.clear();
    act(() => useEditorStore.getState().load(createBlankMageCharacter()));
  });

  afterEach(() => {
    act(() => useEditorStore.getState().clear());
  });

  it('toggles the wheel and edits the same Sphere data as the list', async () => {
    const user = userEvent.setup();
    render(<SpheresSection />);

    const toggle = screen.getByRole('checkbox', {
      name: 'Desktop Sphere wheel',
    });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    expect(toggle).toBeChecked();
    expect(
      window.localStorage.getItem('arcane-ledger:desktop-sphere-wheel'),
    ).toBe('true');

    const wheel = screen.getByLabelText('Desktop Sphere wheel editor');
    expect(within(wheel).getAllByRole('heading', { level: 3 })).toHaveLength(9);

    await user.click(
      within(wheel).getByRole('button', {
        name: 'Mark Forces as Affinity Sphere',
      }),
    );
    await user.click(
      within(wheel).getByRole('button', {
        name: 'Set Forces to 3',
      }),
    );

    expect(useEditorStore.getState().character?.affinitySphere).toBe('forces');
    expect(useEditorStore.getState().character?.spheres.forces).toBe(3);

    await user.click(toggle);

    expect(
      screen.queryByLabelText('Desktop Sphere wheel editor'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Forces: 3 out of 5' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', {
        name: 'Clear Forces as Affinity Sphere',
      }),
    ).toHaveTextContent('★');
  });
});
