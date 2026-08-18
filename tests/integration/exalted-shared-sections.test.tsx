import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import type { Exalted1eCharacter } from '../../src/games/exalted1e/schema';
import { LanguagesSection } from '../../src/games/exalted1e/shared/languages/LanguagesSection';
import { ExperienceSection } from '../../src/games/exalted1e/shared/advancement/ExperienceSection';
import { DerangementsSection } from '../../src/games/exalted1e/shared/derangements/DerangementsSection';

function LanguageHarness() {
  const [languages, setLanguages] = useState<Exalted1eCharacter['languages']>(
    [],
  );
  return (
    <LanguagesSection
      languages={languages}
      linguistics={1}
      onChange={setLanguages}
    />
  );
}

function ExperienceHarness() {
  const [character, setCharacter] = useState(() =>
    createBlankExaltedCharacter('dragon-blooded'),
  );
  return <ExperienceSection character={character} onChange={setCharacter} />;
}

function DerangementHarness() {
  const [derangements, setDerangements] = useState<
    Exalted1eCharacter['derangements']
  >([]);
  return (
    <DerangementsSection
      derangements={derangements}
      onChange={setDerangements}
    />
  );
}

describe('shared Exalted character sections', () => {
  it('adds catalog, native, temporary, and custom languages', async () => {
    const user = userEvent.setup();
    render(<LanguageHarness />);
    await user.selectOptions(
      screen.getByLabelText('Catalog language'),
      'high-realm',
    );
    await user.selectOptions(screen.getByLabelText('Proficiency'), 'native');
    await user.click(screen.getByRole('button', { name: 'Add language' }));
    expect(
      screen.getByText('High Realm', { selector: 'strong' }),
    ).toBeVisible();

    await user.type(
      screen.getByLabelText('Custom language name'),
      'Harbor Cant',
    );
    await user.selectOptions(screen.getByLabelText('Proficiency'), 'temporary');
    await user.click(screen.getByRole('button', { name: 'Add language' }));
    expect(screen.getByText('Harbor Cant')).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Temporary Languages' }),
    ).toBeVisible();
  });

  it('records derangement duration and status separately from the Great Curse', async () => {
    const user = userEvent.setup();
    render(<DerangementHarness />);
    expect(screen.getByText(/Great Curse/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Add Derangement' }));
    await user.click(screen.getByText('Unnamed Derangement'));
    await user.type(screen.getByLabelText('Derangement name'), 'Night Terrors');
    await user.selectOptions(screen.getByLabelText('Duration'), 'permanent');
    await user.selectOptions(screen.getByLabelText('Status'), 'suppressed');
    expect(screen.getByText('suppressed · permanent')).toBeVisible();
  });

  it('handles awards, insufficient XP, no-cost advancement, and downtime records', async () => {
    const user = userEvent.setup();
    render(<ExperienceHarness />);
    await user.click(screen.getByRole('button', { name: 'Spend Experience' }));
    expect(screen.getByText(/Insufficient XP/)).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Add Without Spending XP' }),
    );
    expect(screen.getByText(/Current 2 · Proposed 3/)).toBeVisible();

    await user.type(screen.getByLabelText('Signed amount'), '25');
    await user.type(screen.getByLabelText('Description'), 'Story award');
    await user.click(screen.getByRole('button', { name: 'Add entry' }));
    expect(screen.getByText('Available XP: 25')).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Downtime Advancement' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Add downtime record' }),
    );
    expect(screen.getByText('Downtime advancement')).toBeVisible();
  });
});
