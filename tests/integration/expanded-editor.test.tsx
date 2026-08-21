import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AbilitiesSection } from '../../src/components/character/AbilitiesSection';
import { EnlightenmentSection } from '../../src/components/character/EnlightenmentSection';
import { ExperienceSection } from '../../src/components/character/ExperienceSection';
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
    await user.click(screen.getByRole('button', { name: 'Set Do* to 2' }));
    await user.click(screen.getByRole('button', { name: 'Set Arete to 4' }));
    await user.click(
      screen.getByRole('button', {
        name: 'Set Temporary Willpower to 3',
      }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Set Quintessence to 3' }),
    );

    const character = useEditorStore.getState().character;
    expect(character?.abilities.talents.alertness).toBe(3);
    expect(character?.abilities.skills.do).toBe(2);
    expect(character?.enlightenment.arete).toBe(4);
    expect(character?.enlightenment.willpowerTemporary).toBe(3);
    expect(character?.enlightenment.quintessence).toBe(3);
  });

  it('keeps play resources editable while locking permanent ratings', async () => {
    const user = userEvent.setup();
    act(() => useEditorStore.getState().setSheetLayoutMode('play'));
    render(
      <>
        <EnlightenmentSection />
        <HealthSection />
      </>,
    );

    expect(
      screen.getByRole('button', { name: 'Set Arete to 3' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Set Willpower to 6' }),
    ).toBeDisabled();

    const temporaryWillpower = screen.getByRole('button', {
      name: 'Set Temporary Willpower to 3',
    });
    const quintessence = screen.getByRole('button', {
      name: 'Set Quintessence to 3',
    });
    const paradox = screen.getByRole('button', {
      name: 'Set Paradox to 3',
    });
    const health = screen.getByRole('button', {
      name: 'Bruised: Unmarked damage',
    });

    expect(temporaryWillpower).toBeEnabled();
    expect(quintessence).toBeEnabled();
    expect(paradox).toBeEnabled();
    expect(health).toBeEnabled();

    await user.click(temporaryWillpower);
    await user.click(quintessence);
    await user.click(paradox);
    await user.click(health);

    expect(useEditorStore.getState().character?.enlightenment).toMatchObject({
      willpowerTemporary: 3,
      quintessence: 3,
      paradox: 3,
    });
    expect(useEditorStore.getState().character?.health.damage).toEqual([
      'bashing',
    ]);
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

  it('records total and current experience independently', async () => {
    const user = userEvent.setup();
    render(<ExperienceSection />);

    const total = screen.getByLabelText('Total Experience');
    const current = screen.getByLabelText('Current Experience');
    await user.clear(total);
    await user.type(total, '24');
    await user.clear(current);
    await user.type(current, '9');

    expect(useEditorStore.getState().character?.experience).toEqual({
      total: 24,
      current: 9,
    });
  });
});
