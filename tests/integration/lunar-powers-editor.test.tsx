import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import {
  ExaltedPowersSection,
  type ExaltedPowerDefinition,
} from '../../src/games/exalted1e/DragonBloodedPowersSection';
import {
  lunarCharms,
  lunarSorcerySpellIds,
} from '../../src/games/exalted1e/reference/lunar-powers';
import { sharedSorcerySpellById } from '../../src/games/exalted1e/reference/dragonblooded-powers';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import type { Exalted1eCharacter } from '../../src/games/exalted1e/schema';

// Mirrors the exact `lunarPowerDefinitions` wiring built in
// `Exalted1eEditor.tsx`'s Lunar branch (editor-UI phase): all 219 promoted
// Lunar Charms plus exactly the 73 shared Sorcery spells
// `lunarSorcerySpellIds` confirms Lunar can reach.
const lunarPowerDefinitions: readonly ExaltedPowerDefinition[] = [
  ...lunarCharms,
  ...Array.from(sharedSorcerySpellById.values()).filter(({ id }) =>
    lunarSorcerySpellIds.has(id),
  ),
];

function Harness() {
  const [powers, setPowers] = useState<Exalted1eCharacter['powers']>({
    charms: [],
    spells: [],
  });
  return (
    <ExaltedPowersSection
      powers={powers}
      definitions={lunarPowerDefinitions}
      catalogId="lunar-power-catalog"
      catalogDescription="Lunar power catalog"
      showElementFilter={false}
      showCategory={false}
      spellsTabLabel="Sorcery"
      sorceryAdvisory="Lunar-specific advisory copy"
      onChange={setPowers}
    />
  );
}

/**
 * Mirrors `Exalted1eEditor.tsx`'s real `learnPowerWithExperience` handler
 * (XP-rules phase) so this test exercises the actual production XP-spend
 * path -- the "Learn Charm (N XP)" button, `getPowerExperienceCost` ->
 * `getLunarPowerExperienceCost` routing, and the resulting signed
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
      const key =
        definition.kind === 'charm' ? ('charms' as const) : ('spells' as const);
      const available = current.experienceLedger.reduce(
        (sum, entry) => sum + entry.amount,
        0,
      );
      if (
        current.powers[key].some(
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
          [key]: [
            ...current.powers[key],
            { id: crypto.randomUUID(), definitionId: definition.id, notes: '' },
          ],
        },
        experienceLedger: [
          ...current.experienceLedger,
          {
            id: crypto.randomUUID(),
            date: '2026-10-05',
            session: '',
            type: 'purchase' as const,
            amount: -cost,
            category: definition.kind === 'charm' ? 'Charm' : 'Spell',
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
      definitions={lunarPowerDefinitions}
      catalogId="lunar-power-catalog"
      catalogDescription="Lunar power catalog"
      showElementFilter={false}
      showCategory={false}
      spellsTabLabel="Sorcery"
      sorceryAdvisory="Lunar-specific advisory copy"
      onChange={(powers) => setCharacter((current) => ({ ...current, powers }))}
      onLearnWithExperience={learnPowerWithExperience}
    />
  );
}

function lunarCharacterWithXp(
  favoredAbilities: Exalted1eCharacter['favoredAbilities'],
  amount: number,
): Exalted1eCharacter {
  const character = createBlankExaltedCharacter('lunar');
  character.favoredAbilities = favoredAbilities;
  // Tentacles (Exalted Storyteller's Companion Sample Charm) requires
  // Brawl 3 and Essence 1 (see `lunar-charms.json`); a blank character
  // already starts at Essence 1, so only Brawl needs raising to satisfy
  // the editor UI's own `prerequisitesMet` gate.
  character.abilities.brawl = 3;
  character.experienceLedger = [
    {
      id: crypto.randomUUID(),
      date: '2026-10-05',
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

describe('Lunar Charms & Sorcery editor (Charms + shared Sorcery, editor-UI phase)', () => {
  it('finds and selects a Lunar Charm, showing its Charm category instead of an Ability/Style badge', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      'Rat-Head Technique',
    );
    const card = screen
      .getByRole('heading', { name: 'Rat-Head Technique' })
      .closest('article')!;
    await user.click(within(card).getByText('Full reference details'));
    expect(within(card).getByText('Charm category')).toBeVisible();
    expect(within(card).getByText('Shapechanging III')).toBeVisible();
    await user.click(
      within(card).getByRole('button', { name: 'Add Without Spending XP' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Rat-Head Technique', level: 3 }),
    ).toBeVisible();
  });

  it('offers no Caste filter, since Lunar Charms are organized by Charm category, not Caste', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    expect(screen.queryByLabelText('Caste')).not.toBeInTheDocument();
  });

  describe('Learning Charms with XP (XP-rules phase: Charm XP-cost wiring)', () => {
    it('charges the Favored rate (10 XP) for Tentacles (Brawl 3) when Brawl is a chosen Favored Ability', async () => {
      const user = userEvent.setup();
      render(
        <XpHarness initialCharacter={lunarCharacterWithXp(['brawl'], 20)} />,
      );
      await user.click(
        screen.getByRole('button', { name: 'Browse charms catalog' }),
      );
      await user.type(
        screen.getByRole('searchbox', { name: 'Search' }),
        'Tentacles',
      );
      const card = screen
        .getByRole('heading', { name: 'Tentacles' })
        .closest('article')!;
      const learnButton = within(card).getByRole('button', {
        name: 'Learn Charm (10 XP)',
      });
      expect(learnButton).toBeEnabled();
      await user.click(learnButton);
      expect(
        screen.getByRole('heading', { name: 'Tentacles', level: 3 }),
      ).toBeVisible();
    });

    it('charges the Unfavored rate (12 XP) for the same Charm when Brawl is not a chosen Favored Ability', async () => {
      const user = userEvent.setup();
      render(
        <XpHarness initialCharacter={lunarCharacterWithXp(['survival'], 20)} />,
      );
      await user.click(
        screen.getByRole('button', { name: 'Browse charms catalog' }),
      );
      await user.type(
        screen.getByRole('searchbox', { name: 'Search' }),
        'Tentacles',
      );
      const card = screen
        .getByRole('heading', { name: 'Tentacles' })
        .closest('article')!;
      expect(
        within(card).getByRole('button', { name: 'Learn Charm (12 XP)' }),
      ).toBeEnabled();
    });

    it('always charges the Unfavored rate for an Attribute-only Charm (Hide of the Cunning Hunter, Manipulation 1), regardless of Favored Abilities', async () => {
      const user = userEvent.setup();
      // Hide of the Cunning Hunter's own minimum requirements are
      // Manipulation 1 and Essence 1 (see `lunar-charms.json`), both
      // already satisfied by a blank character, and it has no
      // prerequisite Charms -- unlike Rat-Head Technique, which would
      // need its own prerequisite Charm added first.
      render(
        <XpHarness
          initialCharacter={lunarCharacterWithXp(
            ['brawl', 'survival', 'occult', 'athletics', 'stealth'],
            20,
          )}
        />,
      );
      await user.click(
        screen.getByRole('button', { name: 'Browse charms catalog' }),
      );
      await user.type(
        screen.getByRole('searchbox', { name: 'Search' }),
        'Hide of the Cunning Hunter',
      );
      const card = screen
        .getByRole('heading', { name: 'Hide of the Cunning Hunter' })
        .closest('article')!;
      expect(
        within(card).getByRole('button', { name: 'Learn Charm (12 XP)' }),
      ).toBeEnabled();
    });

    it('disables the Learn button when available XP is below the computed cost', async () => {
      const user = userEvent.setup();
      render(
        <XpHarness initialCharacter={lunarCharacterWithXp(['brawl'], 5)} />,
      );
      await user.click(
        screen.getByRole('button', { name: 'Browse charms catalog' }),
      );
      await user.type(
        screen.getByRole('searchbox', { name: 'Search' }),
        'Tentacles',
      );
      const card = screen
        .getByRole('heading', { name: 'Tentacles' })
        .closest('article')!;
      expect(
        within(card).getByRole('button', { name: 'Learn Charm (10 XP)' }),
      ).toBeDisabled();
    });
  });

  it('labels the second tab "Sorcery" and shows the Lunar-specific advisory', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('tab', { name: 'Sorcery (0)' }));
    expect(screen.getByText('Lunar-specific advisory copy')).toBeVisible();
  });

  it("offers a shared Sorcery spell confirmed on Lunar's own reachable list", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('tab', { name: 'Sorcery (0)' }));
    await user.click(
      screen.getByRole('button', { name: 'Browse spells catalog' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      'Internal Flame',
    );
    expect(
      screen.getByRole('heading', { name: 'Internal Flame' }),
    ).toBeVisible();
  });

  it("does not offer a spell Lunar's own inventory never listed (Assassin's Fatal Touch)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('tab', { name: 'Sorcery (0)' }));
    await user.click(
      screen.getByRole('button', { name: 'Browse spells catalog' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      "Assassin's Fatal Touch",
    );
    expect(
      screen.queryByRole('heading', { name: "Assassin's Fatal Touch" }),
    ).not.toBeInTheDocument();
  });
});
