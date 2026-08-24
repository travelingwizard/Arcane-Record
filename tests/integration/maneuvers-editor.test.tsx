import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ManeuversSection } from '../../src/components/character/ManeuversSection';
import { CharacterSectionProvider } from '../../src/components/navigation/CharacterSectionProvider';
import { useEditorStore } from '../../src/state/editor-store';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';
import {
  characterSectionGroups,
  characterSections,
  defaultGroupOrderByMode,
} from '../../src/systems/mage-m20/character-sections';

describe('Maneuvers editor', () => {
  beforeEach(() => {
    const character = createBlankMageCharacter();
    character.abilities.skills.do = 5;
    act(() => useEditorStore.getState().load(character));
  });

  afterEach(() => {
    act(() => useEditorStore.getState().clear());
  });

  it('searches, filters, favorites, and creates custom combat references', async () => {
    const user = userEvent.setup();
    render(<ManeuversSection />);

    await user.type(screen.getByLabelText('Search combat maneuvers'), 'Dodge');
    expect(screen.getByRole('heading', { name: 'Dodge' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: '☆ Favorite' }));

    await user.clear(screen.getByLabelText('Search combat maneuvers'));
    await user.selectOptions(screen.getByLabelText('Category'), 'defensive');
    expect(screen.getByText('4 maneuvers shown')).toBeVisible();

    await user.selectOptions(screen.getByLabelText('Category'), 'all');
    await user.type(
      screen.getByLabelText('Custom combat maneuver name'),
      'Cabal Cover Drill',
    );
    await user.type(
      screen.getByLabelText('Custom combat description'),
      'Move together between cover.',
    );
    await user.click(
      screen.getByRole('button', { name: 'Add custom combat maneuver' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Expand Cabal Cover Drill' }),
    );
    await user.type(screen.getByLabelText('Notes'), 'Practice monthly.');

    expect(
      useEditorStore.getState().character?.repeatableEntries.maneuvers,
    ).toMatchObject({
      favoriteCombatManeuverIds: ['combat-dodge'],
      customCombatManeuvers: [
        {
          name: 'Cabal Cover Drill',
          description: 'Move together between cover.',
          notes: 'Practice monthly.',
        },
      ],
    });
  });

  it('collapses on desktop to its heading alone', async () => {
    const user = userEvent.setup();
    render(
      <CharacterSectionProvider
        value={{
          activeSection: 'maneuvers',
          expandedSections: new Set(['maneuvers']),
          isNarrowLayout: false,
          summaries: {
            identity: { primary: '' },
            attributes: { primary: '' },
            abilities: { primary: '' },
            maneuvers: { primary: '1 favorite' },
            backgrounds: { primary: '' },
            'merits-flaws': { primary: '' },
            spheres: { primary: '' },
            enlightenment: { primary: '' },
            focus: { primary: '' },
            wonders: { primary: '' },
            rotes: { primary: '' },
            equipment: { primary: '' },
            health: { primary: '' },
            'import-export': { primary: '' },
          },
          setSectionExpanded: () => undefined,
          navigateToSection: () => undefined,
          expandAllSections: () => undefined,
          collapseAllSections: () => undefined,
          sections: characterSections,
          groups: characterSectionGroups,
          groupOrder: defaultGroupOrderByMode.build,
          canCollapseSections: true,
          moveGroup: () => undefined,
        }}
      >
        <ManeuversSection />
      </CharacterSectionProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: 'Collapse Maneuvers' }),
    );

    expect(
      screen.getByRole('button', { name: 'Expand Maneuvers' }),
    ).toBeVisible();
    expect(screen.queryByText('1 favorite')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: 'Combat Reference' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Maneuvers')).toBeVisible();
  });

  it('shows only the nine official techniques and searches alternate names', async () => {
    const user = userEvent.setup();
    render(<ManeuversSection />);

    await user.click(
      screen.getByRole('tab', { name: 'Special Do Techniques' }),
    );
    expect(screen.getByText('9 of 9 official techniques')).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Dim Mak' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('The Final Blow', { exact: true }),
    ).not.toBeInTheDocument();

    await user.type(
      screen.getByLabelText('Search Special Do Techniques'),
      'Iron Shout',
    );
    expect(screen.getByText('1 of 9 official techniques')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Kiaijutsu' })).toBeVisible();
    const disclosure = screen.getByRole('button', {
      name: 'Expand rules for Kiaijutsu',
    });
    disclosure.focus();
    await user.keyboard('{Enter}');
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Also known as:/)).toBeVisible();
  });

  it('adds, annotates, removes, restores, and creates Do maneuvers', async () => {
    const user = userEvent.setup();
    render(<ManeuversSection />);
    act(() => useEditorStore.getState().updateAbility('skills', 'do', 3));
    await user.click(
      screen.getByRole('tab', { name: 'Special Do Techniques' }),
    );

    await user.type(
      screen.getByLabelText('Search Special Do Techniques'),
      'Iron Shirt',
    );
    const catalogCard = screen
      .getByRole('heading', { name: 'Iron Shirt' })
      .closest('article');
    expect(catalogCard).not.toBeNull();
    await user.click(within(catalogCard!).getByRole('button', { name: 'Add' }));
    expect(useEditorStore.getState().addDoManeuver('do-iron-shirt')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Expand Iron Shirt' }));
    await user.type(screen.getByLabelText('Notes'), 'Learned at the chantry.');
    await user.click(
      screen.getByRole('button', { name: 'Remove Special Do Technique' }),
    );
    await user.click(screen.getByRole('button', { name: 'Undo removal' }));

    await user.click(screen.getByText('Add a custom technique'));
    const customForm = screen.getByText('Add a custom technique').parentElement;
    expect(customForm).not.toBeNull();
    await user.type(within(customForm!).getByLabelText('Name'), 'Falling Leaf');
    await user.type(
      within(customForm!).getByLabelText('Summary'),
      'Yield and redirect.',
    );
    await user.type(
      within(customForm!).getByLabelText('Roll'),
      'Dexterity + Do',
    );
    await user.type(within(customForm!).getByLabelText('Difficulty'), '7');
    await user.type(within(customForm!).getByLabelText('Damage'), 'N/A');
    await user.type(within(customForm!).getByLabelText('Actions'), '1');
    await user.type(
      within(customForm!).getByLabelText('Source page'),
      'House rule',
    );
    await user.click(
      within(customForm!).getByRole('button', { name: 'Add custom technique' }),
    );

    expect(
      useEditorStore.getState().character?.repeatableEntries.maneuvers
        .selectedDoManeuvers,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          definitionId: 'do-iron-shirt',
          notes: 'Learned at the chantry.',
        }),
        expect.objectContaining({ customName: 'Falling Leaf' }),
      ]),
    );
    expect(
      useEditorStore.getState().addDoManeuver('do-arrow-cutting'),
    ).toBeNull();

    act(() => useEditorStore.getState().updateAbility('skills', 'do', 2));
    expect(screen.getByRole('alert')).toHaveTextContent('Over limit');
    expect(
      useEditorStore.getState().character?.repeatableEntries.maneuvers
        .selectedDoManeuvers,
    ).toHaveLength(2);
  });

  it('preserves and labels saved legacy and unresolved techniques', async () => {
    const character = createBlankMageCharacter();
    character.repeatableEntries.maneuvers.selectedDoManeuvers = [
      {
        id: crypto.randomUUID(),
        definitionId: 'do-dim-mak',
        notes: '',
        addedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        definitionId: 'do-retired-form',
        unresolvedDefinitionName: 'Retired Form',
        notes: '',
        addedAt: new Date().toISOString(),
      },
    ];
    act(() => useEditorStore.getState().load(character));
    const user = userEvent.setup();
    render(<ManeuversSection />);

    await user.click(
      screen.getByRole('tab', { name: 'Special Do Techniques' }),
    );

    expect(screen.getAllByText('Legacy')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Dim Mak' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Retired Form' })).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Over limit');
  });
});
