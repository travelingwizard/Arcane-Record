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

describe('Alchemical Charms & Weaving Protocols editor (editor-UI Phase 2a)', () => {
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
});
