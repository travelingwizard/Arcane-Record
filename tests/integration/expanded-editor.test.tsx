import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AbilitiesSection } from '../../src/components/character/AbilitiesSection';
import { EnlightenmentSection } from '../../src/components/character/EnlightenmentSection';
import { HealthSection } from '../../src/components/character/HealthSection';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';
import { useEditorStore } from '../../src/state/editor-store';

describe('expanded character editor', () => {
  beforeEach(() => {
    act(() => useEditorStore.getState().load(createBlankMageCharacter()));
  });

  afterEach(() => {
    act(() => useEditorStore.getState().clear());
  });

  it('edits Abilities and Enlightenment ratings', async () => {
    const user = userEvent.setup();
    render(
      <>
        <AbilitiesSection />
        <EnlightenmentSection />
      </>,
    );

    await user.click(
      screen.getByRole('button', { name: 'Set Alertness to 3' }),
    );
    await user.click(screen.getByRole('button', { name: 'Set Arete to 4' }));
    await user.click(
      screen.getByRole('button', { name: 'Set Quintessence to 3' }),
    );

    const character = useEditorStore.getState().character;
    expect(character?.abilities.talents.alertness).toBe(3);
    expect(character?.enlightenment.arete).toBe(4);
    expect(character?.enlightenment.quintessence).toBe(3);
  });

  it('cycles sequential Health damage and truncates cleared boxes', async () => {
    const user = userEvent.setup();
    render(<HealthSection />);

    const bruised = screen.getByRole('button', {
      name: 'Bruised: Unmarked damage',
    });
    expect(
      screen.getByRole('button', { name: 'Hurt: Unmarked damage' }),
    ).toBeDisabled();

    await user.click(bruised);
    await user.click(
      screen.getByRole('button', { name: 'Bruised: Bashing damage' }),
    );
    expect(useEditorStore.getState().character?.health.damage).toEqual([
      'lethal',
    ]);

    await user.click(
      screen.getByRole('button', { name: 'Hurt: Unmarked damage' }),
    );
    expect(useEditorStore.getState().character?.health.damage).toEqual([
      'lethal',
      'bashing',
    ]);

    await user.click(
      screen.getByRole('button', { name: 'Bruised: Lethal damage' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Bruised: Aggravated damage' }),
    );
    expect(useEditorStore.getState().character?.health.damage).toEqual([]);
  });
});
