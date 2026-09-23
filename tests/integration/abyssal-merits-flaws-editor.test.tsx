import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ExaltedMeritsFlawsSection } from '../../src/games/exalted1e/DragonBloodedMeritsFlawsSection';
import {
  abyssalOnlyTraits,
  getSharedTraitCostPolicy,
  getSharedTraitRepeatLimit,
  matchesDragonBloodedTraitSearch,
  storytellerApprovalTraitIds,
} from '../../src/games/exalted1e/reference/dragonblooded-merits-flaws';
import type { Exalted1eCharacter } from '../../src/games/exalted1e/schema';

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
      definitions={abyssalOnlyTraits}
      getCostPolicy={(definition) =>
        getSharedTraitCostPolicy(definition, 'abyssal')
      }
      getRepeatLimit={getSharedTraitRepeatLimit}
      matchesSearch={matchesDragonBloodedTraitSearch}
      approvalTraitIds={storytellerApprovalTraitIds}
      catalogId="abyssal-trait-catalog"
      catalogDescription="Abyssal shared catalog"
    />
  );
}

describe('Abyssal Merits and Flaws editor (shared Players Guide catalog, Abyssal-only cost caps)', () => {
  it('searches, selects an Abyssal-only entry, and preserves source details', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse Merits & Flaws' }),
    );
    await user.click(screen.getByRole('tab', { name: /Browse Flaws/ }));
    await user.type(
      screen.getByRole('searchbox', { name: 'Search Merits and Flaws' }),
      'Death-Taint',
    );
    const card = screen
      .getByRole('heading', { name: 'Death-Taint' })
      .closest('article')!;
    await user.click(within(card).getByRole('button', { name: 'Add Flaw' }));
    expect(
      within(screen.getByRole('region', { name: 'Selected Flaws' })).getByText(
        'Death-Taint',
      ),
    ).toBeVisible();
  });

  it('does not offer Dragon-Blooded-only entries (Prodigy) in the Abyssal catalog', async () => {
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

  it("caps Destiny's chosen-cost dropdown at 2 for Abyssal (schema also caps it, but the UI must not even offer 3-5)", async () => {
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
    expect(optionValues.sort()).toEqual(['1', '2']);
  });
});
