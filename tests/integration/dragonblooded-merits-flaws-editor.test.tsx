import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { DragonBloodedMeritsFlawsSection } from '../../src/games/exalted1e/DragonBloodedMeritsFlawsSection';
import type { Exalted1eCharacter } from '../../src/games/exalted1e/schema';

function Harness() {
  const [traits, setTraits] = useState<Exalted1eCharacter['meritsFlaws']>({
    merits: [],
    flaws: [],
  });
  return (
    <DragonBloodedMeritsFlawsSection traits={traits} onChange={setTraits} />
  );
}

describe('Dragon-Blooded Merits and Flaws editor', () => {
  it('adds fixed and variable-cost Traits, shows citations, and supports remove/undo', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const search = screen.getByRole('searchbox', {
      name: 'Search Merits and Flaws',
    });
    await user.selectOptions(screen.getByLabelText('Category'), 'property');
    expect(
      screen.getByRole('heading', { name: 'Legendary Artifact' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Common Sense' }),
    ).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Category'), 'all');
    await user.type(search, 'Common Sense');
    expect(screen.getByText("Exalted Player's Guide, p. 20")).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Add Merit' }));
    expect(screen.getByText('Merit points: 1')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Selected' })).toBeDisabled();

    const selectedMerits = screen.getByRole('region', {
      name: 'Selected Merits',
    });
    await user.click(
      within(selectedMerits).getByRole('button', { name: 'Remove' }),
    );
    expect(screen.getByText('Merit points: 0')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByText('Merit points: 1')).toBeVisible();

    await user.clear(search);
    await user.type(search, 'Prodigy');
    await user.selectOptions(screen.getByLabelText('Prodigy chosen cost'), '5');
    await user.type(screen.getByLabelText('Prodigy choice or label'), 'Occult');
    await user.click(screen.getByRole('button', { name: 'Add Merit' }));
    expect(screen.getByText('Merit points: 6')).toBeVisible();
    expect(within(selectedMerits).getByText('Prodigy — Occult')).toBeVisible();
  });

  it('prevents ordinary duplicates but permits labeled repeat purchases', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const search = screen.getByRole('searchbox', {
      name: 'Search Merits and Flaws',
    });

    await user.type(search, 'Acute Sense');
    const acuteSenseCard = screen
      .getByRole('heading', { name: 'Acute Sense' })
      .closest('article')!;
    await user.selectOptions(
      within(acuteSenseCard).getByLabelText('Acute Sense chosen cost'),
      '1',
    );
    const label = within(acuteSenseCard).getByLabelText(
      'Acute Sense choice or label',
    );
    await user.type(label, 'Hearing');
    await user.click(
      within(acuteSenseCard).getByRole('button', { name: 'Add Merit' }),
    );
    await user.type(label, 'Sight');
    await user.click(
      within(acuteSenseCard).getByRole('button', { name: 'Add Merit' }),
    );

    const selectedMerits = screen.getByRole('region', {
      name: 'Selected Merits',
    });
    expect(
      within(selectedMerits).getByText('Acute Sense — Hearing'),
    ).toBeVisible();
    expect(
      within(selectedMerits).getByText('Acute Sense — Sight'),
    ).toBeVisible();
    expect(screen.getByText('Merit points: 2')).toBeVisible();
  });
});
