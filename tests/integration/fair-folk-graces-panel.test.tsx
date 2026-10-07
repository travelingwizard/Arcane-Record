import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { FairFolkGracesPanel } from '../../src/games/exalted1e/FairFolkGracesPanel';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import type { Exalted1eCharacter } from '../../src/games/exalted1e/schema';

type FairFolkFamilyState = Extract<
  Exalted1eCharacter['familyState'],
  { type: 'fair-folk' }
>;

function baseCharacter(overrides?: Partial<Exalted1eCharacter>) {
  return { ...createBlankExaltedCharacter('fair-folk'), ...overrides };
}

function Harness({
  initialCharacter,
  buildMode = true,
}: {
  initialCharacter: Exalted1eCharacter;
  buildMode?: boolean;
}) {
  const [character, setCharacter] = useState(initialCharacter);
  if (character.familyState.type !== 'fair-folk') {
    throw new Error('Harness requires a Fair Folk character.');
  }
  return (
    <FairFolkGracesPanel
      state={character.familyState}
      buildMode={buildMode}
      onChange={(state: FairFolkFamilyState) =>
        setCharacter((current) => ({ ...current, familyState: state }))
      }
    />
  );
}

describe('FairFolkGracesPanel (Phase 1b)', () => {
  it('shows no active Curse on a blank character', () => {
    render(<Harness initialCharacter={baseCharacter()} />);
    expect(
      screen.getByText((content) =>
        content.startsWith('Declare a Virtue above'),
      ),
    ).toBeInTheDocument();
  });

  it('shows the matching Curse once a Virtue is declared in bedlam', async () => {
    const user = userEvent.setup();
    render(<Harness initialCharacter={baseCharacter()} />);
    await user.selectOptions(
      screen.getByLabelText('Virtue in bedlam'),
      'compassion',
    );
    expect(
      screen.getAllByText((content) => content.includes('Curse of Hubris'))
        .length,
    ).toBeGreaterThan(0);
  });

  it('does not allow declaring a Virtue when not in build mode', () => {
    render(<Harness initialCharacter={baseCharacter()} buildMode={false} />);
    expect(screen.getByLabelText('Virtue in bedlam')).toBeDisabled();
  });

  it('renders all five Graces reference entries and the Bedlam overview', () => {
    render(<Harness initialCharacter={baseCharacter()} />);
    expect(screen.getByText('Bedlam')).toBeInTheDocument();
    expect(screen.getByText('Graces reference')).toBeInTheDocument();
    expect(screen.getByText('Curse of Hubris')).toBeInTheDocument();
    expect(screen.getByText('Curse of Namelessness')).toBeInTheDocument();
    expect(screen.getByText('Curse of Alienation')).toBeInTheDocument();
    expect(
      screen.getByText('Curse of Meekness (also called the Curse of Terror)'),
    ).toBeInTheDocument();
  });

  it("shows a non-zero Grace's current dot rating in its reference badge", () => {
    const character = baseCharacter({
      familyState: {
        type: 'fair-folk',
        graces: { cup: 3 },
        feedingNotes: '',
        activeAssumption: '',
        oaths: [],
        bedlamVirtueId: null,
      },
    });
    render(<Harness initialCharacter={character} />);
    expect(screen.getByText('3 dots')).toBeInTheDocument();
  });
});
