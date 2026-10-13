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

  it('renders the Glamour Sorcery reference section with all five Circle tiers (Phase 1r)', () => {
    render(<Harness initialCharacter={baseCharacter()} />);
    expect(screen.getByText('Glamour Sorcery reference')).toBeInTheDocument();
    expect(screen.getByText('Waking Circle Spell')).toBeInTheDocument();
    expect(screen.getByText('Dreaming Circle Spell')).toBeInTheDocument();
    expect(screen.getByText('Desire Circle Spell')).toBeInTheDocument();
    expect(screen.getByText('Samadhi Circle Spell')).toBeInTheDocument();
    expect(screen.getByText('Shinma Circle Spell')).toBeInTheDocument();
    expect(screen.getAllByText('Artifact 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Artifact 5').length).toBeGreaterThan(0);
  });

  it('renders the Adjurations reference section with all five oath tiers (Phase 1s)', () => {
    render(<Harness initialCharacter={baseCharacter()} />);
    expect(screen.getByText('Adjurations reference')).toBeInTheDocument();
    expect(screen.getByText('Samhara Oath (Sword oath)')).toBeInTheDocument();
    expect(screen.getByText('Sthiti Oath (Ring oath)')).toBeInTheDocument();
    expect(screen.getByText('Anugraha Oath (Cup oath)')).toBeInTheDocument();
    expect(screen.getByText('Tirobhava Oath (Staff oath)')).toBeInTheDocument();
    expect(screen.getByText('Srishti Oath (Heart oath)')).toBeInTheDocument();
    expect(screen.getAllByText('Artifact 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Artifact 5').length).toBeGreaterThan(0);
  });

  it('renders the Behemoths reference section with all three behemoth tiers (Phase 1t)', () => {
    render(<Harness initialCharacter={baseCharacter()} />);
    expect(screen.getByText('Behemoths reference')).toBeInTheDocument();
    expect(screen.getByText('Fey Beast')).toBeInTheDocument();
    expect(screen.getByText('Daikaiju')).toBeInTheDocument();
    expect(screen.getByText('Deep Wyld Horror')).toBeInTheDocument();
    expect(screen.getByText('Artifact 1-2')).toBeInTheDocument();
    expect(screen.getAllByText('Artifact 3').length).toBeGreaterThan(0);
    expect(screen.getByText('Artifact 4-5')).toBeInTheDocument();
  });

  it('renders the Wyld Artifacts reference section with all three named items', () => {
    render(<Harness initialCharacter={baseCharacter()} />);
    expect(screen.getByText('Wyld Artifacts reference')).toBeInTheDocument();
    expect(screen.getByText('Resonant Chorus Bow')).toBeInTheDocument();
    expect(screen.getByText('Hundred Color Shaping Lens')).toBeInTheDocument();
    expect(screen.getByText('Artifact Waypoint')).toBeInTheDocument();
    // "Artifact 1"/"Artifact 2" also appear on the Glamour Sorcery/
    // Adjurations reference cards' own Circle/Oath-tier badges, so these
    // scope to at least one match rather than assuming uniqueness,
    // matching those sections' own "Artifact 3" assertion above.
    expect(screen.getAllByText('Artifact 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Artifact 2').length).toBeGreaterThan(0);
    expect(screen.getByText('Artifact 3+')).toBeInTheDocument();
  });
});
