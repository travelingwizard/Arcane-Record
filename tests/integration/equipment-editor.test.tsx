import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EquipmentSection } from '../../src/components/character/EquipmentSection';
import { useEditorStore } from '../../src/state/editor-store';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';

describe('Equipment editor', () => {
  beforeEach(() => {
    act(() => useEditorStore.getState().load(createBlankMageCharacter()));
  });

  afterEach(() => {
    act(() => useEditorStore.getState().clear());
  });

  it('adds and edits custom equipment with name and description', async () => {
    const user = userEvent.setup();
    render(<EquipmentSection />);

    await user.type(
      screen.getByLabelText('Custom equipment name'),
      'Silver compass',
    );
    await user.type(
      screen.getByLabelText('Custom description'),
      'Points toward safe places.',
    );
    await user.click(
      screen.getByRole('button', { name: 'Add custom equipment' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Expand Silver compass' }),
    );
    await user.click(screen.getByLabelText('Quantity'));
    await user.keyboard('{Control>}a{/Control}2');
    await user.click(screen.getByLabelText('Equipped or readied'));

    expect(
      useEditorStore.getState().character?.repeatableEntries.equipment[0],
    ).toMatchObject({
      name: 'Silver compass',
      description: 'Points toward safe places.',
      category: 'gear',
      quantity: 2,
      equipped: true,
    });
  });

  it('adds catalog equipment, displays statistics, and restores removal', async () => {
    const user = userEvent.setup();
    render(<EquipmentSection />);

    await user.click(
      screen.getByRole('button', { name: 'Browse equipment catalog' }),
    );
    const catalog = screen.getByLabelText('Equipment reference catalog');
    await user.type(
      within(catalog).getByRole('searchbox', { name: 'Search equipment' }),
      'Kevlar Vest',
    );
    await user.click(within(catalog).getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Armor 3; Dexterity -1')).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Expand Kevlar Vest' }),
    );
    await user.click(screen.getByRole('button', { name: 'Remove equipment' }));
    expect(
      useEditorStore.getState().character?.repeatableEntries.equipment,
    ).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Undo removal' }));
    expect(
      useEditorStore.getState().character?.repeatableEntries.equipment[0],
    ).toMatchObject({
      definitionId: 'kevlar-vest',
      category: 'armor',
    });
  });

  it('keeps equipment editable in Play mode', async () => {
    const user = userEvent.setup();
    act(() => useEditorStore.getState().setSheetLayoutMode('play'));
    render(<EquipmentSection />);

    await user.type(screen.getByLabelText('Custom equipment name'), 'Torch');
    await user.type(
      screen.getByLabelText('Custom description'),
      'A dependable light source.',
    );
    await user.click(
      screen.getByRole('button', { name: 'Add custom equipment' }),
    );

    expect(
      useEditorStore.getState().character?.repeatableEntries.equipment[0],
    ).toMatchObject({ name: 'Torch', quantity: 1 });
  });
});
