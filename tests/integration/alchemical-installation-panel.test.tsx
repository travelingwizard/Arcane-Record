import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { AlchemicalInstallationPanel } from '../../src/games/exalted1e/AlchemicalInstallationPanel';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import type { Exalted1eCharacter } from '../../src/games/exalted1e/schema';

type AlchemicalFamilyState = Extract<
  Exalted1eCharacter['familyState'],
  { type: 'alchemical' }
>;

function baseCharacter(overrides?: Partial<Exalted1eCharacter>) {
  return { ...createBlankExaltedCharacter('alchemical'), ...overrides };
}

function Harness({
  initialCharacter,
  buildMode = true,
}: {
  initialCharacter: Exalted1eCharacter;
  buildMode?: boolean;
}) {
  const [character, setCharacter] = useState(initialCharacter);
  if (character.familyState.type !== 'alchemical') {
    throw new Error('Harness requires an Alchemical character.');
  }
  return (
    <AlchemicalInstallationPanel
      character={character}
      state={character.familyState}
      buildMode={buildMode}
      onChange={(state: AlchemicalFamilyState) =>
        setCharacter((current) => ({ ...current, familyState: state }))
      }
    />
  );
}

function expectSlotSummary(expected: string) {
  expect(
    screen.getByText((_, element) => element?.textContent === expected, {
      selector: 'p',
    }),
  ).toBeInTheDocument();
}

function withOwnedCharm(
  character: Exalted1eCharacter,
  definitionId: string,
): Exalted1eCharacter {
  return {
    ...character,
    powers: {
      ...character.powers,
      charms: [
        ...character.powers.charms,
        {
          id: crypto.randomUUID(),
          definitionId,
          unresolvedReference: null,
          notes: '',
        },
      ],
    },
  };
}

describe('AlchemicalInstallationPanel (Clarity and Charm-Slot tracking)', () => {
  it('starts a blank character at 0 Clarity, 0 Slots, and 0 of 0 installed', () => {
    render(<Harness initialCharacter={baseCharacter()} />);
    expect(
      screen.getByRole('group', { name: 'Permanent Clarity: 0 out of 10' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Temporary Clarity: 0 out of 10' }),
    ).toBeInTheDocument();
    expectSlotSummary(
      '0 of 0 Slots installed · 0 installation motes committed',
    );
  });

  it('raises Permanent Clarity by clicking a dot', async () => {
    const user = userEvent.setup();
    render(<Harness initialCharacter={baseCharacter()} />);
    await user.click(
      screen.getByRole('button', { name: 'Set Permanent Clarity to 4' }),
    );
    expect(
      screen.getByRole('group', { name: 'Permanent Clarity: 4 out of 10' }),
    ).toBeInTheDocument();
  });

  it('clamps each Clarity rating so their sum can never exceed 10', async () => {
    const user = userEvent.setup();
    const character = baseCharacter({
      familyState: {
        type: 'alchemical',
        clarityPermanent: 0,
        clarityTemporary: 7,
        installedCharmIds: [],
        dedicatedSlots: 0,
        generalSlots: 0,
      },
    });
    render(<Harness initialCharacter={character} />);
    // Permanent Clarity's own max is clamped to 10 - 7 = 3, so only 3 dot
    // buttons exist; attempting to reach dot 4 is simply not renderable.
    expect(
      screen.queryByRole('button', { name: 'Set Permanent Clarity to 4' }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Set Permanent Clarity to 3' }),
    );
    expect(
      screen.getByRole('group', { name: 'Permanent Clarity: 3 out of 3' }),
    ).toBeInTheDocument();
  });

  it('updates Dedicated and General Slot counts', async () => {
    const user = userEvent.setup();
    render(<Harness initialCharacter={baseCharacter()} />);
    const dedicated = screen.getByLabelText('Dedicated Slots');
    const general = screen.getByLabelText('General Slots');
    await user.clear(dedicated);
    await user.type(dedicated, '4');
    await user.clear(general);
    await user.type(general, '4');
    expectSlotSummary(
      '0 of 8 Slots installed · 0 installation motes committed',
    );
  });

  it('only lists owned Charms, by real catalog name, as installable checkboxes', () => {
    const character = withOwnedCharm(
      baseCharacter(),
      'man-machine-weaving-engine',
    );
    render(<Harness initialCharacter={character} />);
    expect(
      screen.getByRole('checkbox', { name: 'Man-Machine Weaving Engine' }),
    ).toBeInTheDocument();
  });

  it('installs an owned Charm, counting it toward installed Slots and installation motes', async () => {
    const user = userEvent.setup();
    const character = withOwnedCharm(
      baseCharacter({
        familyState: {
          type: 'alchemical',
          clarityPermanent: 0,
          clarityTemporary: 0,
          installedCharmIds: [],
          dedicatedSlots: 0,
          generalSlots: 1,
        },
      }),
      'man-machine-weaving-engine',
    );
    render(<Harness initialCharacter={character} />);
    await user.click(
      screen.getByRole('checkbox', { name: 'Man-Machine Weaving Engine' }),
    );
    // Man-Machine Weaving Engine's own cost text ends "Installation Cost:
    // 1 mote."
    expectSlotSummary(
      '1 of 1 Slots installed · 1 installation motes committed',
    );
  });

  it('disables installing further Charms once at Slot capacity', () => {
    let character = withOwnedCharm(
      baseCharacter(),
      'man-machine-weaving-engine',
    );
    character = withOwnedCharm(character, 'auxiliary-essence-storage-unit');
    character = {
      ...character,
      familyState: {
        type: 'alchemical',
        clarityPermanent: 0,
        clarityTemporary: 0,
        installedCharmIds: ['man-machine-weaving-engine'],
        dedicatedSlots: 0,
        generalSlots: 1,
      },
    };
    render(<Harness initialCharacter={character} />);
    expect(
      screen.getByRole('checkbox', { name: 'Man-Machine Weaving Engine' }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole('checkbox', { name: 'Auxiliary Essence Storage Unit' }),
    ).toBeDisabled();
  });

  it('disables Dedicated/General Slot inputs outside build mode but leaves Clarity editable', () => {
    render(<Harness initialCharacter={baseCharacter()} buildMode={false} />);
    expect(screen.getByLabelText('Dedicated Slots')).toBeDisabled();
    expect(screen.getByLabelText('General Slots')).toBeDisabled();
    expect(
      screen.getByRole('group', { name: 'Permanent Clarity: 0 out of 10' }),
    ).not.toHaveAttribute('aria-disabled');
  });
});

describe('AlchemicalInstallationPanel (Alchemy Formulae reference, Phase 2a)', () => {
  it('shows all 3 Alchemy Formulae as reference-only, collapsed entries', async () => {
    const user = userEvent.setup();
    render(<Harness initialCharacter={baseCharacter()} />);
    expect(
      screen.getByRole('heading', { name: 'Alchemy Formulae reference' }),
    ).toBeInTheDocument();
    const summary = screen.getByText("The Maker's Inertial Bile");
    expect(summary).toBeInTheDocument();
    expect(screen.getByText('Sweet Sleep Surrogate Syrup')).toBeInTheDocument();
    expect(
      screen.getByText('Friction Banishing Preparation'),
    ).toBeInTheDocument();
    const details = summary.closest('details')!;
    await user.click(summary);
    expect(details).toHaveAttribute('open');
    expect(within(details).getByText(/p\. 161/)).toBeInTheDocument();
  });

  it('never offers an "Add" or purchase control for Formulae, since this app does not model the Alchemy trait or automate dice rolls', () => {
    render(<Harness initialCharacter={baseCharacter()} />);
    const card = screen
      .getByRole('heading', { name: 'Alchemy Formulae reference' })
      .closest('article')!;
    expect(
      within(card).queryByRole('button', { name: /Add/ }),
    ).not.toBeInTheDocument();
  });
});
