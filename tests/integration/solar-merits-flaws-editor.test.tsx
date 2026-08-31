import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ExaltedMeritsFlawsSection } from '../../src/games/exalted1e/DragonBloodedMeritsFlawsSection';
import {
  getSolarTraitCostPolicy,
  getSolarTraitRepeatLimit,
  matchesSolarTraitSearch,
  solarStorytellerApprovalTraitIds,
  solarTraits,
} from '../../src/games/exalted1e/reference/solar-merits-flaws';
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
      definitions={solarTraits}
      getCostPolicy={(definition) =>
        getSolarTraitCostPolicy(definition, 'Twilight')
      }
      getRepeatLimit={getSolarTraitRepeatLimit}
      matchesSearch={matchesSolarTraitSearch}
      approvalTraitIds={solarStorytellerApprovalTraitIds}
      catalogId="solar-trait-catalog"
      catalogDescription="Solar workbook catalog"
    />
  );
}

describe('Solar Merits and Flaws editor', () => {
  it('searches, applies Twilight cost, selects, and preserves source details', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse Merits & Flaws' }),
    );
    expect(screen.queryByText('Prodigy')).not.toBeInTheDocument();
    await user.type(
      screen.getByRole('searchbox', { name: 'Search Merits and Flaws' }),
      "Brigid's Heir",
    );
    const card = screen
      .getByRole('heading', { name: "Brigid's Heir" })
      .closest('article')!;
    expect(
      within(card).getByText("Exalted Player's Guide, p. 30"),
    ).toBeVisible();
    expect(
      within(card).getByText('Storyteller approval recommended'),
    ).toBeVisible();
    await user.click(within(card).getByRole('button', { name: 'Add Merit' }));
    expect(screen.getByText('Merit points: 4')).toBeVisible();
    expect(
      within(screen.getByRole('region', { name: 'Selected Merits' })).getByText(
        "Brigid's Heir",
      ),
    ).toBeVisible();
  });
});
