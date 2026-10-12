import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import {
  ExaltedPowersSection,
  type ExaltedPowerDefinition,
} from '../../src/games/exalted1e/DragonBloodedPowersSection';
import {
  alchemicalCharms,
  alchemicalWeavingProtocols,
  type AlchemicalWeavingProtocolDefinition,
} from '../../src/games/exalted1e/reference/alchemical-powers';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import type { Exalted1eCharacter } from '../../src/games/exalted1e/schema';

/**
 * Mirrors `Exalted1eEditor.tsx`'s own `alchemicalWeavingProtocolAsPower`
 * adapter and `alchemicalPowerDefinitions` wiring exactly (Phase 2a): all
 * 96 promoted Alchemical Charms plus all 38 promoted Weaving Protocols,
 * the latter adapted into the shared Charm/spell rendering shape since
 * Weaving Protocols are Clarity-gated rather than Ability/Essence-gated.
 */
function alchemicalWeavingProtocolAsPower(
  protocol: AlchemicalWeavingProtocolDefinition,
): ExaltedPowerDefinition {
  return {
    id: protocol.id,
    name: protocol.name,
    kind: 'weaving-protocol',
    exaltType: 'alchemical',
    echelon: protocol.echelon,
    summary: protocol.summary,
    description: protocol.description,
    cost: protocol.cost,
    duration: null,
    type: null,
    minimumRequirements: [
      { trait: 'Clarity', rating: protocol.minimumClarity },
    ],
    minimumEssence: null,
    prerequisiteCharms: [],
    prerequisiteText:
      [
        protocol.maximumClarity !== null
          ? `Maximum Clarity ${protocol.maximumClarity}.`
          : null,
        protocol.requirementsText,
      ]
        .filter((text): text is string => Boolean(text))
        .join(' ') || null,
    sourceDisplay: protocol.sourceDisplay,
    reviewStatus: protocol.reviewStatus,
    reviewFlags: protocol.reviewFlags,
  };
}

const alchemicalPowerDefinitions: readonly ExaltedPowerDefinition[] = [
  ...alchemicalCharms,
  ...alchemicalWeavingProtocols.map(alchemicalWeavingProtocolAsPower),
];

function Harness() {
  const [powers, setPowers] = useState<Exalted1eCharacter['powers']>({
    charms: [],
    spells: [],
  });
  return (
    <ExaltedPowersSection
      powers={powers}
      definitions={alchemicalPowerDefinitions}
      catalogId="alchemical-power-catalog"
      catalogDescription="Alchemical power catalog"
      showElementFilter={false}
      showCategory={false}
      spellsTabLabel="Weaving Protocols"
      sorceryAdvisory="Advisory: Weaving Protocols require an enabling Charm and a Minimum Clarity rating."
      onChange={setPowers}
    />
  );
}

/**
 * Mirrors `Exalted1eEditor.tsx`'s real `learnPowerWithExperience` handler
 * (Phase 2b) so this test exercises the actual production XP-spend path --
 * the "Learn Charm/Weaving Protocol (N XP)" button, `getPowerExperienceCost`
 * -> `getAlchemicalPowerExperienceCost` routing, and the resulting signed
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
            date: '2026-10-12',
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
      definitions={alchemicalPowerDefinitions}
      catalogId="alchemical-power-catalog"
      catalogDescription="Alchemical power catalog"
      showElementFilter={false}
      showCategory={false}
      spellsTabLabel="Weaving Protocols"
      sorceryAdvisory="Advisory: Weaving Protocols require an enabling Charm and a Minimum Clarity rating."
      onChange={(powers) => setCharacter((current) => ({ ...current, powers }))}
      onLearnWithExperience={learnPowerWithExperience}
    />
  );
}

function alchemicalCharacterWithXp(amount: number): Exalted1eCharacter {
  const character = createBlankExaltedCharacter('alchemical');
  // All 19 no-prerequisite-Charm rows in this catalog require Essence 2
  // (e.g. `aim-calibrating-sensors`); a blank character's default Essence
  // 1 would make every Charm ineligible regardless of XP available, so
  // raise it here the same way other Exalted integration tests set up a
  // character able to actually learn the power under test.
  character.essence.rating = 2;
  character.experienceLedger = [
    {
      id: crypto.randomUUID(),
      date: '2026-10-12',
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

describe('Alchemical Charms & Weaving Protocols editor (editor-UI phase 2a + XP-rules phase 2b)', () => {
  it('finds and selects an Alchemical Charm, showing its Charm category instead of an Ability/Style badge', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      'Tactical Analysis Engrams',
    );
    const card = screen
      .getByRole('heading', { name: 'Tactical Analysis Engrams' })
      .closest('article')!;
    await user.click(within(card).getByText('Full reference details'));
    expect(within(card).getByText('Charm category')).toBeVisible();
    expect(within(card).getByText('Close Combat Charms')).toBeVisible();
    await user.click(
      within(card).getByRole('button', { name: 'Add Without Spending XP' }),
    );
    expect(
      screen.getByRole('heading', {
        name: 'Tactical Analysis Engrams',
        level: 3,
      }),
    ).toBeVisible();
  });

  it('offers no Caste filter, since Alchemical Charms are organized by Charm category, not Caste', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    expect(screen.queryByLabelText('Caste')).not.toBeInTheDocument();
  });

  it('switches to the Weaving Protocols tab and finds a real protocol, labeled by its own kind rather than a Sorcery Circle', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('tab', { name: /Weaving Protocols/ }));
    await user.click(
      screen.getByRole('button', { name: 'Browse spells catalog' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      'Automaton Override Protocol',
    );
    const card = screen
      .getByRole('heading', { name: 'Automaton Override Protocol' })
      .closest('article')!;
    expect(within(card).getByText('Weaving Protocol')).toBeVisible();
    expect(within(card).getByText(/Clarity 3/)).toBeVisible();
    await user.click(
      within(card).getByRole('button', { name: 'Add Without Spending XP' }),
    );
    const selected = screen
      .getByRole('heading', {
        name: 'Automaton Override Protocol',
        level: 3,
      })
      .closest('article')!;
    expect(selected).toBeVisible();
    expect(within(selected).getByText('Weaving Protocol')).toBeVisible();
  });

  it('does not offer Alchemy Formulae in either catalog tab, since they stay a separate unautomated reference catalog', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      'Sweet Sleep Surrogate Syrup',
    );
    expect(
      screen.queryByRole('heading', { name: 'Sweet Sleep Surrogate Syrup' }),
    ).not.toBeInTheDocument();
  });

  describe('Learning Charms & Weaving Protocols with XP (Phase 2b: flat, echelon-keyed XP-cost wiring)', () => {
    it('charges the flat 6 XP rate for a new Charm, with no Favored/Unfavored split', async () => {
      const user = userEvent.setup();
      render(<XpHarness initialCharacter={alchemicalCharacterWithXp(20)} />);
      await user.click(
        screen.getByRole('button', { name: 'Browse charms catalog' }),
      );
      await user.type(
        screen.getByRole('searchbox', { name: 'Search' }),
        'Aim-Calibrating Sensors',
      );
      const card = screen
        .getByRole('heading', { name: 'Aim-Calibrating Sensors' })
        .closest('article')!;
      const learnButton = within(card).getByRole('button', {
        name: 'Learn Charm (6 XP)',
      });
      expect(learnButton).toBeEnabled();
      await user.click(learnButton);
      expect(
        screen.getByRole('heading', {
          name: 'Aim-Calibrating Sensors',
          level: 3,
        }),
      ).toBeVisible();
    });

    it('disables the Learn button when available XP is below the flat 6 XP Charm cost', async () => {
      const user = userEvent.setup();
      render(<XpHarness initialCharacter={alchemicalCharacterWithXp(5)} />);
      await user.click(
        screen.getByRole('button', { name: 'Browse charms catalog' }),
      );
      await user.type(
        screen.getByRole('searchbox', { name: 'Search' }),
        'Aim-Calibrating Sensors',
      );
      const card = screen
        .getByRole('heading', { name: 'Aim-Calibrating Sensors' })
        .closest('article')!;
      expect(
        within(card).getByRole('button', { name: 'Learn Charm (6 XP)' }),
      ).toBeDisabled();
    });

    it('charges 12 XP for a Man-Machine Weaving Protocol, labeled "Learn Weaving Protocol" rather than "Learn Spell"', async () => {
      const user = userEvent.setup();
      render(<XpHarness initialCharacter={alchemicalCharacterWithXp(20)} />);
      await user.click(screen.getByRole('tab', { name: /Weaving Protocols/ }));
      await user.click(
        screen.getByRole('button', { name: 'Browse spells catalog' }),
      );
      await user.type(
        screen.getByRole('searchbox', { name: 'Search' }),
        'Automaton Override Protocol',
      );
      const card = screen
        .getByRole('heading', { name: 'Automaton Override Protocol' })
        .closest('article')!;
      const learnButton = within(card).getByRole('button', {
        name: 'Learn Weaving Protocol (12 XP)',
      });
      expect(learnButton).toBeEnabled();
      await user.click(learnButton);
      expect(
        screen.getByRole('heading', {
          name: 'Automaton Override Protocol',
          level: 3,
        }),
      ).toBeVisible();
    });
  });
});
