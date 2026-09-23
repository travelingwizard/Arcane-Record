import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import {
  ExaltedPowersSection,
  type ExaltedPowerDefinition,
} from '../../src/games/exalted1e/DragonBloodedPowersSection';
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
});
