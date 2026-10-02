import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import {
  ExaltedPowersSection,
  type ExaltedPowerDefinition,
} from '../../src/games/exalted1e/DragonBloodedPowersSection';
import {
  lunarCharms,
  lunarSorcerySpellIds,
} from '../../src/games/exalted1e/reference/lunar-powers';
import { sharedSorcerySpellById } from '../../src/games/exalted1e/reference/dragonblooded-powers';
import type { Exalted1eCharacter } from '../../src/games/exalted1e/schema';

// Mirrors the exact `lunarPowerDefinitions` wiring built in
// `Exalted1eEditor.tsx`'s Lunar branch (editor-UI phase): all 219 promoted
// Lunar Charms plus exactly the 73 shared Sorcery spells
// `lunarSorcerySpellIds` confirms Lunar can reach.
const lunarPowerDefinitions: readonly ExaltedPowerDefinition[] = [
  ...lunarCharms,
  ...Array.from(sharedSorcerySpellById.values()).filter(({ id }) =>
    lunarSorcerySpellIds.has(id),
  ),
];

// Deliberately has no `character`/`onLearnWithExperience` props, matching
// the real Lunar editor wiring: `getPowerExperienceCost` in
// `DragonBloodedPowersSection.tsx` has no real Lunar XP-cost math yet (it
// throws if ever reached with a Lunar definition), so XP-based direct
// purchase stays disabled for Lunar until a dedicated XP-rules phase.
function Harness() {
  const [powers, setPowers] = useState<Exalted1eCharacter['powers']>({
    charms: [],
    spells: [],
  });
  return (
    <ExaltedPowersSection
      powers={powers}
      definitions={lunarPowerDefinitions}
      catalogId="lunar-power-catalog"
      catalogDescription="Lunar power catalog"
      showElementFilter={false}
      showCategory={false}
      spellsTabLabel="Sorcery"
      sorceryAdvisory="Lunar-specific advisory copy"
      onChange={setPowers}
    />
  );
}

describe('Lunar Charms & Sorcery editor (Charms + shared Sorcery, editor-UI phase)', () => {
  it('finds and selects a Lunar Charm, showing its Charm category instead of an Ability/Style badge', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      'Rat-Head Technique',
    );
    const card = screen
      .getByRole('heading', { name: 'Rat-Head Technique' })
      .closest('article')!;
    await user.click(within(card).getByText('Full reference details'));
    expect(within(card).getByText('Charm category')).toBeVisible();
    expect(within(card).getByText('Shapechanging III')).toBeVisible();
    await user.click(
      within(card).getByRole('button', { name: 'Add Without Spending XP' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Rat-Head Technique', level: 3 }),
    ).toBeVisible();
  });

  it('offers no Caste filter, since Lunar Charms are organized by Charm category, not Caste', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    expect(screen.queryByLabelText('Caste')).not.toBeInTheDocument();
  });

  it('never offers XP-based direct purchase (no real Lunar XP-cost math exists yet)', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: 'Browse charms catalog' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      'Rat-Head Technique',
    );
    expect(
      screen.queryByRole('button', { name: /^Learn Charm/ }),
    ).not.toBeInTheDocument();
  });

  it('labels the second tab "Sorcery" and shows the Lunar-specific advisory', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('tab', { name: 'Sorcery (0)' }));
    expect(screen.getByText('Lunar-specific advisory copy')).toBeVisible();
  });

  it("offers a shared Sorcery spell confirmed on Lunar's own reachable list", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('tab', { name: 'Sorcery (0)' }));
    await user.click(
      screen.getByRole('button', { name: 'Browse spells catalog' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      'Internal Flame',
    );
    expect(
      screen.getByRole('heading', { name: 'Internal Flame' }),
    ).toBeVisible();
  });

  it("does not offer a spell Lunar's own inventory never listed (Assassin's Fatal Touch)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('tab', { name: 'Sorcery (0)' }));
    await user.click(
      screen.getByRole('button', { name: 'Browse spells catalog' }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Search' }),
      "Assassin's Fatal Touch",
    );
    expect(
      screen.queryByRole('heading', { name: "Assassin's Fatal Touch" }),
    ).not.toBeInTheDocument();
  });
});
