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
  abyssalCharms,
  abyssalNecromancySpells,
} from '../../src/games/exalted1e/reference/abyssal-powers';
import { sharedSorcerySpellById } from '../../src/games/exalted1e/reference/dragonblooded-powers';
import type { Exalted1eCharacter } from '../../src/games/exalted1e/schema';

// Mirrors the exact `abyssalPowerDefinitions` wiring built in
// `Exalted1eEditor.tsx`'s Abyssal branch: Charms + Necromancy spells + every
// Terrestrial/Celestial Sorcery spell Abyssal can legally reach.
const abyssalPowerDefinitions: readonly ExaltedPowerDefinition[] = [
  ...abyssalCharms,
  ...abyssalNecromancySpells,
  ...Array.from(sharedSorcerySpellById.values()),
];

function Harness() {
  const [powers, setPowers] = useState<Exalted1eCharacter['powers']>({
    charms: [],
    spells: [],
  });
  return (
    <ExaltedPowersSection
      powers={powers}
      definitions={abyssalPowerDefinitions}
      catalogId="abyssal-power-catalog"
      catalogDescription="Abyssal power catalog"
      showElementFilter={false}
      showCategory={false}
      showCasteFilter
      spellsTabLabel="Spells"
      sorceryAdvisory="Abyssal-specific advisory copy"
      onChange={setPowers}
    />
  );
}

/**
 * Mirrors `Exalted1eEditor.tsx`'s real `learnPowerWithExperience` handler
 * (Phase 1e) so this test exercises the actual production XP-spend path --
 * `ExaltedPowersSection`'s "Learn Charm/Spell (N XP)" button, its
 * `getPowerExperienceCost` -> `getAbyssalPowerExperienceCost` routing, and
 * the resulting signed `experienceLedger` purchase entry -- rather than a
 * simplified stand-in.
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
            date: '2026-09-23',
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
      definitions={abyssalPowerDefinitions}
      catalogId="abyssal-power-catalog"
      catalogDescription="Abyssal power catalog"
      showElementFilter={false}
      showCategory={false}
      showCasteFilter
      spellsTabLabel="Spells"
      sorceryAdvisory="Abyssal-specific advisory copy"
      onChange={(powers) => setCharacter((current) => ({ ...current, powers }))}
      onLearnWithExperience={learnPowerWithExperience}
    />
  );
}

function abyssalCharacterWithXp(
  caste: string,
  amount: number,
): Exalted1eCharacter {
  const character = createBlankExaltedCharacter('abyssal');
  character.identity.caste = caste;
  // Bloodthirsty Arrow's real minimum requirements are Essence 2 and
  // Archery 2 (see `exalted1e-abyssal.test.ts`'s "does not enforce
  // minimumEssence" test, which starts from the same blank character
  // specifically to show the *schema* layer doesn't check them); the
  // editor UI's own `prerequisitesMet` gate does check them, so this
  // harness needs both set to exercise the Learn button itself rather
  // than its prerequisite gate.
  character.essence.rating = 2;
  character.abilities.archery = 2;
  character.experienceLedger = [
    {
      id: crypto.randomUUID(),
      date: '2026-09-23',
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

describe('Abyssal Charms & Spells editor (Charms + Necromancy + shared Sorcery)', () => {
  it('finds and selects an Abyssal Charm, showing its Caste badge', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      'Bloodthirsty Arrow',
    );
    const card = screen
      .getByRole('heading', { name: 'Bloodthirsty Arrow' })
      .closest('article')!;
    expect(within(card).getByText('Dusk')).toBeVisible();
    await user.click(
      within(card).getByRole('button', { name: 'Add Without Spending XP' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Bloodthirsty Arrow', level: 3 }),
    ).toBeVisible();
  });

  it('filters Charms by Caste', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      'Bloodthirsty Arrow',
    );
    expect(
      screen.getByRole('heading', { name: 'Bloodthirsty Arrow' }),
    ).toBeVisible();
    await user.selectOptions(screen.getByLabelText('Caste'), 'Midnight');
    expect(
      screen.queryByRole('heading', { name: 'Bloodthirsty Arrow' }),
    ).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Caste'), 'Dusk');
    expect(
      screen.getByRole('heading', { name: 'Bloodthirsty Arrow' }),
    ).toBeVisible();
  });

  it('labels the second tab "Spells" (not "Sorcery") and shows the Abyssal-specific advisory', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('tab', { name: 'Spells (0)' }));
    expect(screen.getByText('Abyssal-specific advisory copy')).toBeVisible();
  });

  it('offers both a Necromancy spell and a shared Sorcery spell in the same spells catalog', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('tab', { name: 'Spells (0)' }));
    await user.click(
      screen.getByRole('button', { name: 'Browse spells catalog' }),
    );
    const search = screen.getByRole('searchbox', { name: 'Search' });

    await user.type(search, 'Hungry Creeping Shadow');
    expect(
      screen.getByRole('heading', { name: 'Hungry Creeping Shadow' }),
    ).toBeVisible();

    await user.clear(search);
    await user.type(search, "Assassin's Fatal Touch");
    expect(
      screen.getByRole('heading', { name: "Assassin's Fatal Touch" }),
    ).toBeVisible();
  });

  describe('Learning Charms/spells with XP (Phase 1e: Charm/spell XP-cost wiring)', () => {
    it('charges the Favored/Caste rate (10 XP) for a Dusk-Caste Charm on a Dusk Abyssal', async () => {
      // Bloodthirsty Arrow's ability is Archery, one of Dusk's five Caste
      // Abilities (see `abyssalAbilityGroups`/family-rules.ts's Abyssal
      // `abilityCastes` call).
      const user = userEvent.setup();
      render(
        <XpHarness initialCharacter={abyssalCharacterWithXp('Dusk', 20)} />,
      );
      await user.click(
        screen.getByRole('button', { name: 'Browse charms catalog' }),
      );
      await user.type(
        screen.getByRole('searchbox', { name: 'Search' }),
        'Bloodthirsty Arrow',
      );
      const card = screen
        .getByRole('heading', { name: 'Bloodthirsty Arrow' })
        .closest('article')!;
      const learnButton = within(card).getByRole('button', {
        name: 'Learn Charm (10 XP)',
      });
      expect(learnButton).toBeEnabled();
      await user.click(learnButton);
      expect(
        screen.getByRole('heading', { name: 'Bloodthirsty Arrow', level: 3 }),
      ).toBeVisible();
    });

    it('charges the Unfavored rate (12 XP) for the same Charm on a non-Dusk Abyssal', async () => {
      const user = userEvent.setup();
      render(
        <XpHarness initialCharacter={abyssalCharacterWithXp('Midnight', 20)} />,
      );
      await user.click(
        screen.getByRole('button', { name: 'Browse charms catalog' }),
      );
      await user.type(
        screen.getByRole('searchbox', { name: 'Search' }),
        'Bloodthirsty Arrow',
      );
      const card = screen
        .getByRole('heading', { name: 'Bloodthirsty Arrow' })
        .closest('article')!;
      expect(
        within(card).getByRole('button', { name: 'Learn Charm (12 XP)' }),
      ).toBeEnabled();
    });

    it('disables the Learn button when available XP is below the computed cost', async () => {
      const user = userEvent.setup();
      render(
        <XpHarness initialCharacter={abyssalCharacterWithXp('Midnight', 5)} />,
      );
      await user.click(
        screen.getByRole('button', { name: 'Browse charms catalog' }),
      );
      await user.type(
        screen.getByRole('searchbox', { name: 'Search' }),
        'Bloodthirsty Arrow',
      );
      const card = screen
        .getByRole('heading', { name: 'Bloodthirsty Arrow' })
        .closest('article')!;
      expect(
        within(card).getByRole('button', { name: 'Learn Charm (12 XP)' }),
      ).toBeDisabled();
    });

    it('charges the flat 10/12 XP Occult rate for a Necromancy spell regardless of Charm-ability Caste routing', async () => {
      const user = userEvent.setup();
      const character = abyssalCharacterWithXp('Daybreak', 20);
      // Hungry Creeping Shadow's real minimum requirements (Essence 3,
      // Occult 3, and the Shadowlands Circle Necromancy prerequisite
      // Charm) must be met for the editor's own `prerequisitesMet` gate,
      // separately from the XP-cost math under test here.
      character.essence.rating = 3;
      character.abilities.occult = 3;
      character.powers.charms = [
        {
          id: crypto.randomUUID(),
          definitionId: 'shadowlands-circle-necromancy',
          unresolvedReference: null,
          notes: '',
        },
      ];
      render(<XpHarness initialCharacter={character} />);
      // Occult is one of Daybreak's five Caste Abilities, and
      // `getAbyssalPowerExperienceCost` always keys spells off Occult.
      await user.click(screen.getByRole('tab', { name: 'Spells (0)' }));
      await user.click(
        screen.getByRole('button', { name: 'Browse spells catalog' }),
      );
      await user.type(
        screen.getByRole('searchbox', { name: 'Search' }),
        'Hungry Creeping Shadow',
      );
      const card = screen
        .getByRole('heading', { name: 'Hungry Creeping Shadow' })
        .closest('article')!;
      const learnButton = within(card).getByRole('button', {
        name: 'Learn Spell (10 XP)',
      });
      await user.click(learnButton);
      expect(
        screen.getByRole('heading', {
          name: 'Hungry Creeping Shadow',
          level: 3,
        }),
      ).toBeVisible();
    });
  });
});
