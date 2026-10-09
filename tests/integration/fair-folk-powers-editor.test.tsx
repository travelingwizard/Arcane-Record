import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import {
  ExaltedPowersSection,
  type ExaltedPowerDefinition,
} from '../../src/games/exalted1e/DragonBloodedPowersSection';
import { fairFolkCharms } from '../../src/games/exalted1e/reference/fair-folk-powers';
import type { Exalted1eCharacter } from '../../src/games/exalted1e/schema';

// Mirrors the exact `fairFolkPowerDefinitions` wiring built in
// `Exalted1eEditor.tsx`'s Fair Folk branch (Phase 2a): all 201 promoted
// Fair Folk Charms, no spells tab (Glamour Sorcery has no definitionId-
// style catalog -- see `fairFolkPowerDefinitions`'s own doc comment), and
// no `character`/`onLearnWithExperience` yet (deferred to a later
// XP-rules phase, matching Lunar's own editor-UI-phase-then-XP-rules-phase
// precedent).
const fairFolkPowerDefinitions: readonly ExaltedPowerDefinition[] = [
  ...fairFolkCharms,
];

function Harness() {
  const [powers, setPowers] = useState<Exalted1eCharacter['powers']>({
    charms: [],
    spells: [],
  });
  return (
    <ExaltedPowersSection
      powers={powers}
      definitions={fairFolkPowerDefinitions}
      catalogId="fair-folk-power-catalog"
      catalogDescription="Fair Folk power catalog"
      showSpells={false}
      showElementFilter={false}
      showCategory={false}
      onChange={setPowers}
    />
  );
}

describe('Fair Folk Charms editor (Phase 2a: Charm catalog wired, no XP purchase yet)', () => {
  it('finds and selects a Fair Folk Charm, showing its Charm category instead of an Ability/Style badge', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      'Forging the Heart Grace',
    );
    const card = screen
      .getByRole('heading', { name: 'Forging the Heart Grace' })
      .closest('article')!;
    await user.click(within(card).getByText('Full reference details'));
    expect(within(card).getByText('Charm category')).toBeVisible();
    expect(within(card).getByText('Grace Forging')).toBeVisible();
    await user.click(
      within(card).getByRole('button', { name: 'Add Without Spending XP' }),
    );
    expect(
      screen.getByRole('heading', {
        name: 'Forging the Heart Grace',
        level: 3,
      }),
    ).toBeVisible();
  });

  it('offers no Caste filter, since Fair Folk Charms are organized by Charm category, not Caste', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    expect(screen.queryByLabelText('Caste')).not.toBeInTheDocument();
  });

  it('offers no Sorcery/spells tab, since Glamour Sorcery has no definitionId-style catalog yet', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    expect(
      screen.queryByRole('tab', { name: /Sorcery/ }),
    ).not.toBeInTheDocument();
  });

  it('never offers XP-based purchase (no Learn Charm button), matching this phase\u2019s deliberate scope', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      'Forging the Heart Grace',
    );
    const card = screen
      .getByRole('heading', { name: 'Forging the Heart Grace' })
      .closest('article')!;
    expect(
      within(card).queryByRole('button', { name: /Learn Charm/ }),
    ).not.toBeInTheDocument();
  });
});
