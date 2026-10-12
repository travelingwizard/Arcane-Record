import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ExaltedMeritsFlawsSection } from '../../src/games/exalted1e/DragonBloodedMeritsFlawsSection';
import {
  alchemicalOnlyTraits,
  getSharedTraitCostPolicy,
  getSharedTraitRepeatLimit,
  matchesDragonBloodedTraitSearch,
  storytellerApprovalTraitIds,
} from '../../src/games/exalted1e/reference/dragonblooded-merits-flaws';
import type { Exalted1eCharacter } from '../../src/games/exalted1e/schema';

// Mirrors the exact wiring built in `Exalted1eEditor.tsx`'s Alchemical
// branch (Phase 2a): the shared Exalted Player's Guide catalog filtered to
// `alchemicalOnlyTraits`, with `getSharedTraitCostPolicy`/
// `getSharedTraitRepeatLimit`/`matchesDragonBloodedTraitSearch`/
// `storytellerApprovalTraitIds` reused verbatim from Abyssal/Sidereal/
// Lunar/Fair Folk's own wiring -- all already generic across sheet types
// since Phase 1a.
function Harness() {
  const [traits, setTraits] = useState<Exalted1eCharacter['meritsFlaws']>({
    merits: [],
    flaws: [],
  });
  const [derangements, setDerangements] = useState<
    Exalted1eCharacter['derangements']
  >([]);
  return (
    <ExaltedMeritsFlawsSection
      traits={traits}
      onChange={setTraits}
      derangements={derangements}
      onDerangementsChange={setDerangements}
      definitions={alchemicalOnlyTraits}
      getCostPolicy={(definition) =>
        getSharedTraitCostPolicy(definition, 'alchemical')
      }
      getRepeatLimit={getSharedTraitRepeatLimit}
      matchesSearch={matchesDragonBloodedTraitSearch}
      approvalTraitIds={storytellerApprovalTraitIds}
      catalogId="alchemical-trait-catalog"
      catalogDescription="Alchemical shared catalog"
    />
  );
}

describe('Alchemical Merits and Flaws editor (shared Players Guide catalog, Phase 2a)', () => {
  it('searches, selects a shared entry (Virtue Specialty), and preserves source details', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse Merits & Flaws' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search Merits and Flaws' }),
      'Virtue Specialty',
    );
    const card = screen
      .getByRole('heading', { name: 'Virtue Specialty' })
      .closest('article')!;
    await user.selectOptions(
      within(card).getByLabelText('Virtue Specialty chosen cost'),
      '4',
    );
    await user.type(
      within(card).getByLabelText('Virtue Specialty choice or label'),
      'Conviction (protecting the vats)',
    );
    await user.click(within(card).getByRole('button', { name: 'Add Merit' }));
    expect(
      within(screen.getByRole('region', { name: 'Selected Merits' })).getByText(
        'Virtue Specialty',
        { exact: false },
      ),
    ).toBeVisible();
  });

  it('does not offer an excluded shared entry (Legendary Breeding, requires blood lineage a vat-built construct lacks) in the Alchemical catalog', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse Merits & Flaws' }),
    );
    await user.click(screen.getByRole('tab', { name: /Browse Flaws/ }));
    await user.type(
      screen.getByRole('searchbox', { name: 'Search Merits and Flaws' }),
      'Legendary Breeding',
    );
    expect(
      screen.queryByRole('heading', { name: 'Legendary Breeding' }),
    ).not.toBeInTheDocument();
  });

  it('offers Destiny at the full uncapped 1-5 range, unlike Abyssal/Sidereal\u2019s own 1-2 cap', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse Merits & Flaws' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search Merits and Flaws' }),
      'Destiny',
    );
    const select = screen.getByLabelText('Destiny chosen cost');
    const optionValues = within(select)
      .getAllByRole('option')
      .map((option) => (option as HTMLOptionElement).value)
      .filter((value) => value !== '');
    expect(optionValues).toEqual(['1', '2', '3', '4', '5']);
  });

  it("computes Addiction's formula-based cost (base rating - 1) the same way every other family's shared catalog wiring does", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse Merits & Flaws' }),
    );
    await user.click(screen.getByRole('tab', { name: /Browse Flaws/ }));
    await user.type(
      screen.getByRole('searchbox', { name: 'Search Merits and Flaws' }),
      'Addiction',
    );
    const input = screen.getByLabelText('Base addiction rating');
    await user.type(input, '3');
    expect(screen.getByText('Final cost: 2')).toBeVisible();
  });
});
