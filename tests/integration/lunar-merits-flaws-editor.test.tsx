import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ExaltedMeritsFlawsSection } from '../../src/games/exalted1e/DragonBloodedMeritsFlawsSection';
import {
  getSharedTraitCostPolicy,
  getSharedTraitRepeatLimit,
  lunarOnlyTraits,
  matchesDragonBloodedTraitSearch,
  storytellerApprovalTraitIds,
} from '../../src/games/exalted1e/reference/dragonblooded-merits-flaws';
import type { Exalted1eCharacter } from '../../src/games/exalted1e/schema';

// Mirrors the exact wiring built in `Exalted1eEditor.tsx`'s Lunar branch
// (editor-UI phase): the shared Exalted Player's Guide catalog filtered to
// `lunarOnlyTraits`, with `getSharedTraitCostPolicy`/
// `getSharedTraitRepeatLimit`/`matchesDragonBloodedTraitSearch`/
// `storytellerApprovalTraitIds` reused verbatim from Abyssal/Sidereal's own
// wiring -- all already generic across sheet types since Phase 1a.
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
      definitions={lunarOnlyTraits}
      getCostPolicy={(definition) =>
        getSharedTraitCostPolicy(definition, 'lunar')
      }
      getRepeatLimit={getSharedTraitRepeatLimit}
      matchesSearch={matchesDragonBloodedTraitSearch}
      approvalTraitIds={storytellerApprovalTraitIds}
      catalogId="lunar-trait-catalog"
      catalogDescription="Lunar shared catalog"
    />
  );
}

describe('Lunar Merits and Flaws editor (shared Players Guide catalog, Lunar-only cost caps)', () => {
  it('searches, selects a Lunar-only entry, and preserves source details', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse Merits & Flaws' }),
    );
    await user.click(screen.getByRole('tab', { name: /Browse Flaws/ }));
    await user.type(
      screen.getByRole('searchbox', { name: 'Search Merits and Flaws' }),
      'Chimera (Lunar)',
    );
    const card = screen
      .getByRole('heading', { name: 'Chimera (Lunar)' })
      .closest('article')!;
    await user.click(within(card).getByRole('button', { name: 'Add Flaw' }));
    expect(
      within(screen.getByRole('region', { name: 'Selected Flaws' })).getByText(
        'Chimera (Lunar)',
      ),
    ).toBeVisible();
  });

  it('does not offer Dragon-Blooded-only entries (Prodigy) in the Lunar catalog', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse Merits & Flaws' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search Merits and Flaws' }),
      'Prodigy',
    );
    expect(
      screen.queryByRole('heading', { name: 'Prodigy' }),
    ).not.toBeInTheDocument();
  });

  it("replaces Double-Jointed's standard 1-or-3 cost options with Lunar's own 1-or-2 (schema also caps it, but the UI must not even offer 3)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse Merits & Flaws' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search Merits and Flaws' }),
      'Double-Jointed',
    );
    const select = screen.getByLabelText('Double-Jointed chosen cost');
    const optionValues = within(select)
      .getAllByRole('option')
      .map((option) => (option as HTMLOptionElement).value)
      .filter((value) => value !== '');
    expect(optionValues).toEqual(['1', '2']);
  });

  it('auto-applies the single legal cost for Ambidextrous (Lunar collapses its 1-or-2 standard cost to a flat 1)', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse Merits & Flaws' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search Merits and Flaws' }),
      'Ambidextrous',
    );
    expect(
      screen.queryByLabelText('Ambidextrous chosen cost'),
    ).not.toBeInTheDocument();
    const card = screen
      .getByRole('heading', { name: 'Ambidextrous' })
      .closest('article')!;
    await user.click(within(card).getByRole('button', { name: 'Add Merit' }));
    expect(
      within(screen.getByRole('region', { name: 'Selected Merits' })).getByText(
        'Ambidextrous',
      ),
    ).toBeVisible();
  });
});
