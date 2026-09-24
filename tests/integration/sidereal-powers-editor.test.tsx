import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import {
  ExaltedPowersSection,
  type ExaltedPowerDefinition,
} from '../../src/games/exalted1e/DragonBloodedPowersSection';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import {
  siderealCastes,
  siderealCharms,
  siderealSorcerySpellIds,
} from '../../src/games/exalted1e/reference/sidereal-powers';
import { sharedSorcerySpellById } from '../../src/games/exalted1e/reference/dragonblooded-powers';
import type { Exalted1eCharacter } from '../../src/games/exalted1e/schema';

// Mirrors the exact `siderealPowerDefinitions` wiring built in
// `Exalted1eEditor.tsx`'s Sidereal branch (Phase 2d): all 193 promoted
// Charms (152 Caste-and-Auspicious-Ability + 41 Martial Arts style) plus
// exactly the 73 shared Sorcery spells `siderealSorcerySpellIds` confirms
// Sidereal can reach.
const siderealPowerDefinitions: readonly ExaltedPowerDefinition[] = [
  ...siderealCharms,
  ...Array.from(sharedSorcerySpellById.values()).filter(({ id }) =>
    siderealSorcerySpellIds.has(id),
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
      definitions={siderealPowerDefinitions}
      catalogId="sidereal-power-catalog"
      catalogDescription="Sidereal power catalog"
      showElementFilter={false}
      showCategory={false}
      showCasteFilter
      castes={siderealCastes}
      spellsTabLabel="Sorcery"
      sorceryAdvisory="Sidereal-specific advisory copy"
      onChange={setPowers}
    />
  );
}

/**
 * Mirrors `Exalted1eEditor.tsx`'s real `learnPowerWithExperience` handler
 * (shared verbatim across Dragon-Blooded/Abyssal/Sidereal) so this test
 * exercises the actual production XP-spend path -- the "Learn Charm
 * (N XP)" button, `getPowerExperienceCost` -> `getSiderealPowerExperienceCost`
 * routing, and the resulting signed `experienceLedger` purchase entry.
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
            date: '2026-09-24',
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
      definitions={siderealPowerDefinitions}
      catalogId="sidereal-power-catalog"
      catalogDescription="Sidereal power catalog"
      showElementFilter={false}
      showCategory={false}
      showCasteFilter
      castes={siderealCastes}
      spellsTabLabel="Sorcery"
      sorceryAdvisory="Sidereal-specific advisory copy"
      onChange={(powers) => setCharacter((current) => ({ ...current, powers }))}
      onLearnWithExperience={learnPowerWithExperience}
    />
  );
}

function siderealCharacterWithXp(
  caste: string,
  amount: number,
): Exalted1eCharacter {
  const character = createBlankExaltedCharacter('sidereal');
  character.identity.caste = caste;
  // Ox-Body Technique (Sidereal)'s real minimum requirements are Essence 1
  // and Endurance 1 (see `sidereal-powers.ts`); a blank character already
  // starts at Essence 1, so only Endurance needs raising to satisfy the
  // editor UI's own `prerequisitesMet` gate.
  character.abilities.endurance = 1;
  character.experienceLedger = [
    {
      id: crypto.randomUUID(),
      date: '2026-09-24',
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

describe('Sidereal Charms & Sorcery editor (Charms + shared Sorcery, Phase 2d)', () => {
  it('finds and selects a Sidereal Charm, showing its Caste badge', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      'Ox-Body Technique (Sidereal)',
    );
    const card = screen
      .getByRole('heading', { name: 'Ox-Body Technique (Sidereal)' })
      .closest('article')!;
    expect(within(card).getByText('Journeys')).toBeVisible();
    await user.click(
      within(card).getByRole('button', { name: 'Add Without Spending XP' }),
    );
    expect(
      screen.getByRole('heading', {
        name: 'Ox-Body Technique (Sidereal)',
        level: 3,
      }),
    ).toBeVisible();
  });

  it("filters Charms by Sidereal's own five Castes", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    const select = screen.getByLabelText('Caste');
    const optionLabels = within(select)
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(optionLabels).toEqual([
      'All Castes',
      'Journeys',
      'Serenity',
      'Battles',
      'Secrets',
      'Endings',
    ]);
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      'Ox-Body Technique (Sidereal)',
    );
    await user.selectOptions(select, 'Serenity');
    expect(
      screen.queryByRole('heading', { name: 'Ox-Body Technique (Sidereal)' }),
    ).not.toBeInTheDocument();
    await user.selectOptions(select, 'Journeys');
    expect(
      screen.getByRole('heading', { name: 'Ox-Body Technique (Sidereal)' }),
    ).toBeVisible();
  });

  it('finds a Martial Arts style Charm alongside Caste-based Charms in the same catalog', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      'Unnatural Many-Step Stride',
    );
    const card = screen
      .getByRole('heading', { name: 'Unnatural Many-Step Stride' })
      .closest('article')!;
    // Style Charms have no Caste (`caste: null`), so no Caste badge renders.
    expect(within(card).queryByText('Journeys')).not.toBeInTheDocument();
  });

  it('labels the second tab "Sorcery" and shows the Sidereal-specific advisory', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('tab', { name: 'Sorcery (0)' }));
    expect(screen.getByText('Sidereal-specific advisory copy')).toBeVisible();
  });

  it("offers a shared Sorcery spell confirmed on Sidereal's own reachable list", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('tab', { name: 'Sorcery (0)' }));
    await user.click(
      screen.getByRole('button', { name: 'Browse spells catalog' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      'Spirit of Might',
    );
    expect(
      screen.getByRole('heading', { name: 'Spirit of Might' }),
    ).toBeVisible();
  });

  describe('Learning Charms with XP (Phase 2d: Charm XP-cost wiring)', () => {
    it('charges the Favored/Auspicious rate (10 XP) for a Journeys-Caste Charm on a Journeys Sidereal', async () => {
      // Ox-Body Technique (Sidereal)'s ability is Endurance, one of
      // Journeys' five Auspicious Abilities (see `siderealAbilityGroups`/
      // `family-rules.ts`'s Sidereal `abilityCastes` call).
      const user = userEvent.setup();
      render(
        <XpHarness
          initialCharacter={siderealCharacterWithXp('Journeys', 20)}
        />,
      );
      await user.click(
        screen.getByRole('button', { name: 'Browse charms catalog' }),
      );
      await user.type(
        screen.getByRole('searchbox', { name: 'Search' }),
        'Ox-Body Technique (Sidereal)',
      );
      const card = screen
        .getByRole('heading', { name: 'Ox-Body Technique (Sidereal)' })
        .closest('article')!;
      const learnButton = within(card).getByRole('button', {
        name: 'Learn Charm (10 XP)',
      });
      expect(learnButton).toBeEnabled();
      await user.click(learnButton);
      expect(
        screen.getByRole('heading', {
          name: 'Ox-Body Technique (Sidereal)',
          level: 3,
        }),
      ).toBeVisible();
    });

    it('charges the Unfavored rate (12 XP) for the same Charm on a non-Journeys Sidereal', async () => {
      const user = userEvent.setup();
      render(
        <XpHarness initialCharacter={siderealCharacterWithXp('Battles', 20)} />,
      );
      await user.click(
        screen.getByRole('button', { name: 'Browse charms catalog' }),
      );
      await user.type(
        screen.getByRole('searchbox', { name: 'Search' }),
        'Ox-Body Technique (Sidereal)',
      );
      const card = screen
        .getByRole('heading', { name: 'Ox-Body Technique (Sidereal)' })
        .closest('article')!;
      expect(
        within(card).getByRole('button', { name: 'Learn Charm (12 XP)' }),
      ).toBeEnabled();
    });

    it('disables the Learn button when available XP is below the computed cost', async () => {
      const user = userEvent.setup();
      render(
        <XpHarness initialCharacter={siderealCharacterWithXp('Battles', 5)} />,
      );
      await user.click(
        screen.getByRole('button', { name: 'Browse charms catalog' }),
      );
      await user.type(
        screen.getByRole('searchbox', { name: 'Search' }),
        'Ox-Body Technique (Sidereal)',
      );
      const card = screen
        .getByRole('heading', { name: 'Ox-Body Technique (Sidereal)' })
        .closest('article')!;
      expect(
        within(card).getByRole('button', { name: 'Learn Charm (12 XP)' }),
      ).toBeDisabled();
    });
  });
});
