import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FocusSection } from '../../src/components/character/FocusSection';
import { RotesSection } from '../../src/components/character/RotesSection';
import { WondersSection } from '../../src/components/character/WondersSection';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';
import { useEditorStore } from '../../src/state/editor-store';

describe('Magick editor sections', () => {
  beforeEach(() => {
    act(() => useEditorStore.getState().load(createBlankMageCharacter()));
  });

  afterEach(() => {
    act(() => useEditorStore.getState().clear());
  });

  it('records catalog and custom Focus selections with advisory-only guidance', async () => {
    const user = userEvent.setup();
    render(<FocusSection />);

    await user.type(screen.getByLabelText('Custom name'), 'Inherited key');
    await user.selectOptions(
      screen.getByLabelText('Custom Focus entry type'),
      'instrument',
    );
    await user.click(screen.getByRole('button', { name: 'Add custom' }));
    await user.click(
      screen.getByRole('checkbox', { name: 'Significant to this mage' }),
    );
    await user.type(
      screen.getByLabelText('Personal need'),
      'To find hidden paths.',
    );

    await user.click(screen.getByRole('button', { name: 'Browse references' }));
    const catalog = screen.getByLabelText('Paradigms reference catalog');
    await user.type(
      within(catalog).getByRole('searchbox', {
        name: 'Search paradigms',
      }),
      'Everything is Data',
    );
    await user.click(within(catalog).getByRole('button', { name: 'Add' }));

    const focus = useEditorStore.getState().character?.repeatableEntries.focus;
    expect(focus?.instruments[0]).toMatchObject({
      customName: 'Inherited key',
      significant: true,
    });
    expect(focus?.paradigms[0].definitionId).toBe('everything-is-data');
    expect(focus?.need).toBe('To find hidden paths.');
    expect(
      screen.getByText(
        /Starting characters commonly begin with at least seven/,
      ),
    ).toBeVisible();
  });

  it('adds, edits, removes, and restores custom and catalog Wonders', async () => {
    const user = userEvent.setup();
    render(<WondersSection />);

    await user.type(
      screen.getByLabelText('Custom Wonder name'),
      'Copper Compass',
    );
    await user.click(screen.getByRole('button', { name: 'Add custom Wonder' }));
    await user.click(
      screen.getByRole('button', { name: 'Expand Copper Compass' }),
    );
    await user.type(
      screen.getByLabelText('Powers and Effects'),
      'Points toward lost people.',
    );

    await user.click(
      screen.getByRole('button', { name: 'Browse Wonder references' }),
    );
    const catalog = screen.getByLabelText('Wonders reference catalog');
    await user.type(
      within(catalog).getByRole('searchbox', { name: 'Search wonders' }),
      'Bafflejack',
    );
    await user.click(within(catalog).getByRole('button', { name: 'Add' }));

    expect(
      useEditorStore.getState().character?.repeatableEntries.wonders,
    ).toHaveLength(2);
    expect(
      useEditorStore.getState().character?.repeatableEntries.wonders[0],
    ).toMatchObject({
      name: 'Copper Compass',
      powers: 'Points toward lost people.',
    });

    await user.click(screen.getByRole('button', { name: 'Remove Wonder' }));
    expect(
      useEditorStore.getState().character?.repeatableEntries.wonders,
    ).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Undo removal' }));
    expect(
      useEditorStore.getState().character?.repeatableEntries.wonders,
    ).toHaveLength(2);
  });

  it('edits structured Rote requirements and preserves free-form alternatives', async () => {
    const user = userEvent.setup();
    render(<RotesSection />);

    await user.type(
      screen.getByLabelText('Custom Rote name'),
      'Find the Thread',
    );
    await user.click(screen.getByRole('button', { name: 'Add custom Rote' }));
    await user.click(
      screen.getByRole('button', { name: 'Expand Find the Thread' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Add Sphere requirement' }),
    );
    await user.selectOptions(screen.getByLabelText('Sphere'), 'correspondence');
    await user.clear(screen.getByLabelText('Minimum'));
    await user.type(screen.getByLabelText('Minimum'), '2');
    await user.type(
      screen.getByLabelText('Requirement notes'),
      'Entropy 2 may substitute.',
    );
    await user.type(
      screen.getByLabelText('Effect'),
      'Locates a person through a sympathetic connection.',
    );

    expect(
      useEditorStore.getState().character?.repeatableEntries.rotes[0],
    ).toMatchObject({
      name: 'Find the Thread',
      sphereRequirements: [{ sphereId: 'correspondence', minimum: 2 }],
      requirementNotes: 'Entropy 2 may substitute.',
      effect: 'Locates a person through a sympathetic connection.',
    });
  });
});
