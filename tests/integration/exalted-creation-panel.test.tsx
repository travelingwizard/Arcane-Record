import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ExaltedCreationPanel } from '../../src/games/exalted1e/ExaltedCreationPanel';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import type { Exalted1eCharacter } from '../../src/games/exalted1e/schema';

/**
 * Phase 1e "creator tests" dimension: exercises the shared, generic
 * `ExaltedCreationPanel` guided-creation wizard specifically with an
 * Abyssal draft character. No test file exercised this component's actual
 * rendered UI for any family before this (only `family-rules.ts`'s pure
 * budget/validation functions were unit-tested), so this is real, new
 * coverage of the guided-creation dimension, not a restatement of existing
 * coverage.
 */
function Harness({ initial }: { initial: Exalted1eCharacter }) {
  const [character, setCharacter] = useState(initial);
  return <ExaltedCreationPanel character={character} onChange={setCharacter} />;
}

function abyssalDraft(): Exalted1eCharacter {
  return createBlankExaltedCharacter('abyssal', 'draft');
}

function siderealDraft(): Exalted1eCharacter {
  return createBlankExaltedCharacter('sidereal', 'draft');
}

describe('ExaltedCreationPanel (Abyssal guided creation, Phase 1e)', () => {
  it('offers the Abyssal-only "Fugitive" creation profile alongside Standard', () => {
    render(<Harness initial={abyssalDraft()} />);
    const select = screen.getByLabelText('Creation profile');
    const optionLabels = within(select)
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(optionLabels).toEqual(['Standard', 'Fugitive']);
  });

  it('lists all five Abyssal Castes in the Caste selector, sourced from the verified creation rules', () => {
    render(<Harness initial={abyssalDraft()} />);
    const select = screen.getByLabelText('Caste');
    const optionLabels = within(select)
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(optionLabels).toEqual([
      'Choose…',
      'Dusk',
      'Midnight',
      'Daybreak',
      'Day',
      'Moonshadow',
    ]);
  });

  it('surfaces unresolved creation-budget requirements for a blank Abyssal draft and gates Finalize on them', () => {
    render(<Harness initial={abyssalDraft()} />);
    expect(screen.getByText(/requirements? remaining/)).toBeVisible();
    expect(screen.getByText(/Choose a Caste\./)).toBeVisible();
    expect(
      screen.getByText(/Allocate exactly 25 initial Ability dots/),
    ).toBeVisible();
    expect(
      screen.getByText(/Allocate Attribute categories as 8\/6\/4/),
    ).toBeVisible();
    // Finalize is not rendered as enabled/reachable until every
    // requirement is resolved AND the wizard is on its final step.
    expect(
      screen.queryByRole('button', { name: 'Finalize character' }),
    ).toBeDisabled();
  });

  it('clears the Caste-selection requirement once a verified Abyssal Caste is chosen', async () => {
    const user = userEvent.setup();
    render(<Harness initial={abyssalDraft()} />);
    expect(screen.getByText(/Choose a Caste\./)).toBeVisible();
    await user.selectOptions(screen.getByLabelText('Caste'), 'dusk');
    expect(screen.queryByText(/Choose a Caste\./)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/not in the verified catalog/),
    ).not.toBeInTheDocument();
  });

  it('cites Exalted: The Abyssals p. 124 (PDF 125) as the creation-rules source', () => {
    render(<Harness initial={abyssalDraft()} />);
    expect(screen.getByLabelText('Creation source')).toHaveValue(
      'abyssals, p. 124 (PDF 125)',
    );
  });

  it("shows the Fugitive-variant Backgrounds budget (5) rather than Standard's (13)", () => {
    const draft = abyssalDraft();
    draft.creation.rulesVariant = 'fugitive';
    render(<Harness initial={draft} />);
    expect(screen.getByText(/Backgrounds 5;/)).toBeVisible();
  });

  it('does not render at all for a manual (non-guided) Abyssal sheet', () => {
    const { container } = render(
      <Harness initial={createBlankExaltedCharacter('abyssal', 'manual')} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

/**
 * Phase 2d "creator tests" dimension: exercises the same shared
 * `ExaltedCreationPanel` with a Sidereal draft. `family-rules.ts`'s
 * Sidereal creation data (castes, the "Ronin" variant, XP/derived-value
 * math) was already in place from Phase 2a, but no test exercised the
 * panel's actual rendered UI against it -- this closes that gap the same
 * way the Abyssal block above did for its own family.
 */
describe('ExaltedCreationPanel (Sidereal guided creation, Phase 2d)', () => {
  it('offers the Sidereal-only "Ronin" creation profile alongside Standard', () => {
    render(<Harness initial={siderealDraft()} />);
    const select = screen.getByLabelText('Creation profile');
    const optionLabels = within(select)
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(optionLabels).toEqual(['Standard', 'Ronin']);
  });

  it('lists all five Sidereal Castes in the Caste selector, sourced from the verified creation rules', () => {
    render(<Harness initial={siderealDraft()} />);
    const select = screen.getByLabelText('Caste');
    const optionLabels = within(select)
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(optionLabels).toEqual([
      'Choose…',
      'Chosen of Journeys',
      'Chosen of Serenity',
      'Chosen of Battles',
      'Chosen of Secrets',
      'Chosen of Endings',
    ]);
  });

  it('surfaces unresolved creation-budget requirements for a blank Sidereal draft and gates Finalize on them', () => {
    render(<Harness initial={siderealDraft()} />);
    expect(screen.getByText(/requirements? remaining/)).toBeVisible();
    expect(screen.getByText(/Choose a Caste\./)).toBeVisible();
    expect(
      screen.getByText(/Allocate exactly 35 initial Ability dots/),
    ).toBeVisible();
    expect(
      screen.getByText(/Allocate Attribute categories as 8\/6\/4/),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Finalize character' }),
    ).toBeDisabled();
  });

  it('clears the Caste-selection requirement once a verified Sidereal Caste is chosen', async () => {
    const user = userEvent.setup();
    render(<Harness initial={siderealDraft()} />);
    expect(screen.getByText(/Choose a Caste\./)).toBeVisible();
    await user.selectOptions(screen.getByLabelText('Caste'), 'journeys');
    expect(screen.queryByText(/Choose a Caste\./)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/not in the verified catalog/),
    ).not.toBeInTheDocument();
  });

  it('cites Exalted: The Sidereals p. 100 (PDF 103) as the creation-rules source', () => {
    render(<Harness initial={siderealDraft()} />);
    expect(screen.getByLabelText('Creation source')).toHaveValue(
      'sidereals, p. 100 (PDF 103)',
    );
  });

  it("shows the Ronin-variant Backgrounds budget (7) rather than Standard's (15)", () => {
    const draft = siderealDraft();
    draft.creation.rulesVariant = 'ronin';
    render(<Harness initial={draft} />);
    expect(screen.getByText(/Backgrounds 7;/)).toBeVisible();
  });

  it('does not render at all for a manual (non-guided) Sidereal sheet', () => {
    const { container } = render(
      <Harness initial={createBlankExaltedCharacter('sidereal', 'manual')} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
