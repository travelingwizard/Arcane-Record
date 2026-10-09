import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import {
  ExaltedPowersSection,
  type ExaltedPowerDefinition,
} from '../../src/games/exalted1e/DragonBloodedPowersSection';
import { fairFolkCharms } from '../../src/games/exalted1e/reference/fair-folk-powers';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import type { Exalted1eCharacter } from '../../src/games/exalted1e/schema';

// Mirrors the exact `fairFolkPowerDefinitions` wiring built in
// `Exalted1eEditor.tsx`'s Fair Folk branch: all 201 promoted Fair Folk
// Charms, no spells tab (Glamour Sorcery has no definitionId-style catalog
// -- see `fairFolkPowerDefinitions`'s own doc comment).
const fairFolkPowerDefinitions: readonly ExaltedPowerDefinition[] = [
  ...fairFolkCharms,
];

function Harness() {
  const [powers, setPowers] = useState<Exalted1eCharacter['powers']>({
    charms: [],
    spells: [],
  });
  return (
    <ExaltedPowersSection
      powers={powers}
      definitions={fairFolkPowerDefinitions}
      catalogId="fair-folk-power-catalog"
      catalogDescription="Fair Folk power catalog"
      showSpells={false}
      showElementFilter={false}
      showCategory={false}
      onChange={setPowers}
    />
  );
}

/**
 * Mirrors `Exalted1eEditor.tsx`'s real `learnPowerWithExperience` handler
 * (Phase 2b) so this test exercises the actual production XP-spend path --
 * the "Learn Charm (N XP)" button, `getPowerExperienceCost` ->
 * `getFairFolkPowerExperienceCost` routing, and the resulting signed
 * `experienceLedger` purchase entry.
 */
function XpHarness({
  initialCharacter,
}: {
  initialCharacter: Exalted1eCharacter;
}) {
  const [character, setCharacter] = useState(initialCharacter);
  const learnPowerWithExperience = (
    definition: ExaltedPowerDefinition,
    cost: number,
    explanation: string,
  ) =>
    setCharacter((current) => {
      const available = current.experienceLedger.reduce(
        (sum, entry) => sum + entry.amount,
        0,
      );
      if (
        current.powers.charms.some(
          ({ definitionId }) => definitionId === definition.id,
        ) ||
        available < cost
      ) {
        return current;
      }
      return {
        ...current,
        powers: {
          ...current.powers,
          charms: [
            ...current.powers.charms,
            { id: crypto.randomUUID(), definitionId: definition.id, notes: '' },
          ],
        },
        experienceLedger: [
          ...current.experienceLedger,
          {
            id: crypto.randomUUID(),
            date: '2026-10-07',
            session: '',
            type: 'purchase' as const,
            amount: -cost,
            category: 'Charm',
            targetId: definition.id,
            targetName: definition.name,
            previousRating: null,
            newRating: null,
            description: explanation,
            notes: '',
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });
  return (
    <ExaltedPowersSection
      powers={character.powers}
      character={character}
      definitions={fairFolkPowerDefinitions}
      catalogId="fair-folk-power-catalog"
      catalogDescription="Fair Folk power catalog"
      showSpells={false}
      showElementFilter={false}
      showCategory={false}
      onChange={(powers) => setCharacter((current) => ({ ...current, powers }))}
      onLearnWithExperience={learnPowerWithExperience}
    />
  );
}

function fairFolkCharacterWithXp(amount: number): Exalted1eCharacter {
  const character = createBlankExaltedCharacter('fair-folk');
  // Assumption of Elemental Shape only requires Essence 1 (see
  // `fair-folk-charms.json`), already satisfied by a blank character's
  // default Essence rating, and has no prerequisite Charms.
  character.experienceLedger = [
    {
      id: crypto.randomUUID(),
      date: '2026-10-07',
      session: '1',
      type: 'award',
      amount,
      category: 'Session',
      targetId: null,
      targetName: '',
      previousRating: null,
      newRating: null,
      description: 'Starting award',
      notes: '',
      createdAt: new Date().toISOString(),
    },
  ];
  return character;
}

describe('Fair Folk Charms editor (editor-UI phase 2a + XP-rules phase 2b)', () => {
  it('finds and selects a Fair Folk Charm, showing its Charm category instead of an Ability/Style badge', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      'Forging the Heart Grace',
    );
    const card = screen
      .getByRole('heading', { name: 'Forging the Heart Grace' })
      .closest('article')!;
    await user.click(within(card).getByText('Full reference details'));
    expect(within(card).getByText('Charm category')).toBeVisible();
    expect(within(card).getByText('Grace Forging')).toBeVisible();
    await user.click(
      within(card).getByRole('button', { name: 'Add Without Spending XP' }),
    );
    expect(
      screen.getByRole('heading', {
        name: 'Forging the Heart Grace',
        level: 3,
      }),
    ).toBeVisible();
  });

  it('offers no Caste filter, since Fair Folk Charms are organized by Charm category, not Caste', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    expect(screen.queryByLabelText('Caste')).not.toBeInTheDocument();
  });

  it('offers no Sorcery/spells tab, since Glamour Sorcery has no definitionId-style catalog yet', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    expect(
      screen.queryByRole('tab', { name: /Sorcery/ }),
    ).not.toBeInTheDocument();
  });

  describe('Learning Charms with XP (Phase 2b: flat-cost Charm XP-cost wiring)', () => {
    it('always charges the flat 6 XP rate, with no Favored/Unfavored split', async () => {
      const user = userEvent.setup();
      render(<XpHarness initialCharacter={fairFolkCharacterWithXp(20)} />);
      await user.click(
        screen.getByRole('button', { name: 'Browse charms catalog' }),
      );
      await user.type(
        screen.getByRole('searchbox', { name: 'Search' }),
        'Assumption of Elemental Shape',
      );
      const card = screen
        .getByRole('heading', { name: 'Assumption of Elemental Shape' })
        .closest('article')!;
      const learnButton = within(card).getByRole('button', {
        name: 'Learn Charm (6 XP)',
      });
      expect(learnButton).toBeEnabled();
      await user.click(learnButton);
      expect(
        screen.getByRole('heading', {
          name: 'Assumption of Elemental Shape',
          level: 3,
        }),
      ).toBeVisible();
    });

    it('disables the Learn button when available XP is below the flat 6 XP cost', async () => {
      const user = userEvent.setup();
      render(<XpHarness initialCharacter={fairFolkCharacterWithXp(5)} />);
      await user.click(
        screen.getByRole('button', { name: 'Browse charms catalog' }),
      );
      await user.type(
        screen.getByRole('searchbox', { name: 'Search' }),
        'Assumption of Elemental Shape',
      );
      const card = screen
        .getByRole('heading', { name: 'Assumption of Elemental Shape' })
        .closest('article')!;
      expect(
        within(card).getByRole('button', { name: 'Learn Charm (6 XP)' }),
      ).toBeDisabled();
    });
  });
});
