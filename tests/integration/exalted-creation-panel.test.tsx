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

function lunarDraft(): Exalted1eCharacter {
  return createBlankExaltedCharacter('lunar', 'draft');
}

function fairFolkDraft(): Exalted1eCharacter {
  return createBlankExaltedCharacter('fair-folk', 'draft');
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

/**
 * "creator tests" certification dimension for Lunar: exercises the same
 * shared `ExaltedCreationPanel` with a Lunar draft, mirroring the Abyssal
 * and Sidereal blocks above. Lunar's own "Casteless" rulesVariant is
 * distinct from the "Casteless" *identity* option in the Caste selector
 * below -- the former is a chargen-budget variant (tighter Attribute
 * budgets and fewer Charms, see `family-rules.ts`'s override for
 * `type === 'lunar' && variant === 'casteless'`), the latter is one of
 * the four selectable family-identity values 1st-edition Lunars have
 * (Full Moon/Changing Moon/No Moon/Casteless), both confirmed distinct
 * mechanics by the inventoried source.
 */
describe('ExaltedCreationPanel (Lunar guided creation, XP-rules phase follow-up)', () => {
  it('offers the Lunar-only "Casteless" creation profile alongside Standard', () => {
    render(<Harness initial={lunarDraft()} />);
    const select = screen.getByLabelText('Creation profile');
    const optionLabels = within(select)
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(optionLabels).toEqual(['Standard', 'Casteless']);
  });

  it('lists all four Lunar Castes (including the Casteless identity) in the Caste selector, sourced from the verified creation rules', () => {
    render(<Harness initial={lunarDraft()} />);
    const select = screen.getByLabelText('Caste');
    const optionLabels = within(select)
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(optionLabels).toEqual([
      'Choose…',
      'Full Moon',
      'Changing Moon',
      'No Moon',
      'Casteless',
    ]);
  });

  it('surfaces unresolved creation-budget requirements for a blank Lunar draft and gates Finalize on them', () => {
    render(<Harness initial={lunarDraft()} />);
    expect(screen.getByText(/requirements? remaining/)).toBeVisible();
    expect(screen.getByText(/Choose a Caste\./)).toBeVisible();
    expect(
      screen.getByText(/Allocate exactly 25 initial Ability dots/),
    ).toBeVisible();
    expect(
      screen.getByText(/Allocate Attribute categories as 9\/7\/5/),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Finalize character' }),
    ).toBeDisabled();
  });

  it('clears the Caste-selection requirement once a verified Lunar Caste is chosen', async () => {
    const user = userEvent.setup();
    render(<Harness initial={lunarDraft()} />);
    expect(screen.getByText(/Choose a Caste\./)).toBeVisible();
    await user.selectOptions(screen.getByLabelText('Caste'), 'full-moon');
    expect(screen.queryByText(/Choose a Caste\./)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/not in the verified catalog/),
    ).not.toBeInTheDocument();
  });

  it('cites Exalted: The Lunars p. 92 (PDF 95) as the creation-rules source', () => {
    render(<Harness initial={lunarDraft()} />);
    expect(screen.getByLabelText('Creation source')).toHaveValue(
      'lunars, p. 92 (PDF 95)',
    );
  });

  it("shows the Casteless-variant powers budget (6) rather than Standard's (9)", () => {
    const draft = lunarDraft();
    draft.creation.rulesVariant = 'casteless';
    render(<Harness initial={draft} />);
    expect(screen.getByText(/powers 6\./)).toBeVisible();
  });

  it('does not render at all for a manual (non-guided) Lunar sheet', () => {
    const { container } = render(
      <Harness initial={createBlankExaltedCharacter('lunar', 'manual')} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

/**
 * "creatorTests" certification dimension for Fair Folk (Phase 2c):
 * exercises the same shared `ExaltedCreationPanel` with a Fair Folk draft,
 * mirroring the Abyssal/Sidereal/Lunar blocks above. Unlike those three
 * families, Fair Folk's own Caste/variant wiring in `ExaltedCreationPanel.tsx`
 * and its `second-caste` validation rule in `family-rules.ts`'s
 * `validateExaltedCreation` both predate every Fair Folk catalog-promotion
 * phase in this project (added in the original five-family schema/rules
 * scaffold, `bb43a473` -- confirmed via `git log --follow` before writing
 * this block), so this phase's own job is to add real, rendered-UI test
 * coverage of already-built logic, not to build new creation-flow code.
 * Fair Folk's own "Creation profile" selector works differently from
 * Abyssal/Sidereal/Lunar's own Standard-plus-one-variant pattern: raksha
 * chargen has three tracks, not two -- Standard (a noble, the only track
 * with the Second Caste field below), Common raksha, and Heroic commoner
 * (the latter two sharing the same zero-Background/one-Favored-Ability
 * shape but different bonus-point totals, confirmed against
 * `family-rules.ts`'s own `['common', 'heroic-common'].includes(variant)`
 * override).
 */
describe('ExaltedCreationPanel (Fair Folk guided creation, Phase 2c)', () => {
  it('offers all three Fair Folk creation profiles: Standard (noble), Common raksha, and Heroic commoner', () => {
    render(<Harness initial={fairFolkDraft()} />);
    const select = screen.getByLabelText('Creation profile');
    const optionLabels = within(select)
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(optionLabels).toEqual([
      'Standard',
      'Common raksha',
      'Heroic commoner',
    ]);
  });

  it('lists all four Fair Folk base Castes in the Caste selector, sourced from the verified creation rules', () => {
    render(<Harness initial={fairFolkDraft()} />);
    const select = screen.getByLabelText('Caste');
    const optionLabels = within(select)
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(optionLabels).toEqual([
      'Choose…',
      'Diplomat',
      'Entertainer',
      'Warrior',
      'Worker',
    ]);
  });

  it('offers a "Second Caste" field only for the Standard (noble) profile, listing the same four Castes', () => {
    render(<Harness initial={fairFolkDraft()} />);
    expect(screen.getByLabelText('Second Caste')).toBeInTheDocument();
    const select = screen.getByLabelText('Second Caste');
    const optionLabels = within(select)
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(optionLabels).toEqual([
      'Choose…',
      'Diplomat',
      'Entertainer',
      'Warrior',
      'Worker',
    ]);
  });

  it('hides the "Second Caste" field for Common raksha and Heroic commoner, who have only one Caste', async () => {
    const user = userEvent.setup();
    render(<Harness initial={fairFolkDraft()} />);
    await user.selectOptions(
      screen.getByLabelText('Creation profile'),
      'common',
    );
    expect(screen.queryByLabelText('Second Caste')).not.toBeInTheDocument();
    await user.selectOptions(
      screen.getByLabelText('Creation profile'),
      'heroic-common',
    );
    expect(screen.queryByLabelText('Second Caste')).not.toBeInTheDocument();
  });

  it('surfaces unresolved creation-budget requirements for a blank Standard (noble) Fair Folk draft, including the distinct-Second-Caste rule, and gates Finalize on them', () => {
    render(<Harness initial={fairFolkDraft()} />);
    expect(screen.getByText(/requirements? remaining/)).toBeVisible();
    expect(screen.getByText(/Choose a Caste\./)).toBeVisible();
    expect(
      screen.getByText(/Allocate exactly 25 initial Ability dots/),
    ).toBeVisible();
    expect(
      screen.getByText(/Allocate Attribute categories as 10\/7\/4/),
    ).toBeVisible();
    expect(
      screen.getByText(/A noble raksha must choose a distinct second Caste\./),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Finalize character' }),
    ).toBeDisabled();
  });

  it('clears the distinct-Second-Caste requirement once two different verified Castes are chosen, but not when the same Caste is chosen twice', async () => {
    const user = userEvent.setup();
    render(<Harness initial={fairFolkDraft()} />);
    await user.selectOptions(screen.getByLabelText('Caste'), 'diplomat');
    await user.selectOptions(screen.getByLabelText('Second Caste'), 'diplomat');
    expect(
      screen.getByText(/A noble raksha must choose a distinct second Caste\./),
    ).toBeVisible();
    await user.selectOptions(screen.getByLabelText('Second Caste'), 'warrior');
    expect(
      screen.queryByText(
        /A noble raksha must choose a distinct second Caste\./,
      ),
    ).not.toBeInTheDocument();
  });

  it('cites Exalted: The Fair Folk p. 99 (PDF 100) as the creation-rules source', () => {
    render(<Harness initial={fairFolkDraft()} />);
    expect(screen.getByLabelText('Creation source')).toHaveValue(
      'fair-folk, p. 99 (PDF 100)',
    );
  });

  it("shows the Common-variant Backgrounds budget (0) rather than Standard's (10)", () => {
    const draft = fairFolkDraft();
    draft.creation.rulesVariant = 'common';
    render(<Harness initial={draft} />);
    expect(screen.getByText(/Backgrounds 0;/)).toBeVisible();
  });

  it("shows the Heroic-commoner-variant bonus points (33) rather than Standard's and Common raksha's shared 15", () => {
    const draft = fairFolkDraft();
    draft.creation.rulesVariant = 'heroic-common';
    render(<Harness initial={draft} />);
    expect(screen.getByText(/33 bonus points\./)).toBeVisible();
  });

  it('does not render at all for a manual (non-guided) Fair Folk sheet', () => {
    const { container } = render(
      <Harness initial={createBlankExaltedCharacter('fair-folk', 'manual')} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
