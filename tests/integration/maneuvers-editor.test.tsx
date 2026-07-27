import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ManeuversSection } from '../../src/components/character/ManeuversSection';
import { CharacterSectionProvider } from '../../src/components/navigation/CharacterSectionProvider';
import { useEditorStore } from '../../src/state/editor-store';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';

describe('Maneuvers editor', () => {
  beforeEach(() => {
    act(() => useEditorStore.getState().load(createBlankMageCharacter()));
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

  it('shows Revised Do by default and exposes clearly labeled Legacy entries', async () => {
    const user = userEvent.setup();
    render(<ManeuversSection />);

    await user.click(screen.getByRole('tab', { name: 'Known Do Maneuvers' }));
    expect(screen.getByText('12 of 15 maneuvers')).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Dim Mak' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('The Final Blow', { exact: true }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Include 3 Legacy maneuvers'));
    expect(screen.getByText('15 of 15 maneuvers')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Dim Mak' })).toBeVisible();
  });

  it('adds, annotates, removes, restores, and creates Do maneuvers', async () => {
    const user = userEvent.setup();
    render(<ManeuversSection />);
    await user.click(screen.getByRole('tab', { name: 'Known Do Maneuvers' }));

    await user.type(screen.getByLabelText('Search Do maneuvers'), 'Iron Shirt');
    const catalogCard = screen
      .getByRole('heading', { name: 'Iron Shirt' })
      .closest('article');
    expect(catalogCard).not.toBeNull();
    await user.click(within(catalogCard!).getByRole('button', { name: 'Add' }));
    await user.click(screen.getByRole('button', { name: 'Expand Iron Shirt' }));
    await user.type(screen.getByLabelText('Notes'), 'Learned at the chantry.');
    await user.click(
      screen.getByRole('button', { name: 'Remove Do maneuver' }),
    );
    await user.click(screen.getByRole('button', { name: 'Undo removal' }));

    await user.type(
      screen.getByLabelText('Custom Do maneuver name'),
      'Falling Leaf',
    );
    await user.click(
      screen.getByRole('button', { name: 'Add custom Do maneuver' }),
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
  });
});
