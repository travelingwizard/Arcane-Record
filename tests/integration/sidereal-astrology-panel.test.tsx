import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { SiderealAstrologyPanel } from '../../src/games/exalted1e/SiderealAstrologyPanel';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import type { Exalted1eCharacter } from '../../src/games/exalted1e/schema';

type SiderealFamilyState = Extract<
  Exalted1eCharacter['familyState'],
  { type: 'sidereal' }
>;

function baseCharacter(overrides?: Partial<Exalted1eCharacter>) {
  const character = createBlankExaltedCharacter('sidereal');
  character.identity.caste = 'Journeys';
  return { ...character, ...overrides };
}

function Harness({
  initialCharacter,
  buildMode = true,
}: {
  initialCharacter: Exalted1eCharacter;
  buildMode?: boolean;
}) {
  const [character, setCharacter] = useState(initialCharacter);
  if (character.familyState.type !== 'sidereal') {
    throw new Error('Harness requires a Sidereal character.');
  }
  return (
    <SiderealAstrologyPanel
      character={character}
      state={character.familyState}
      buildMode={buildMode}
      onChange={(state: SiderealFamilyState) =>
        setCharacter((current) => ({ ...current, familyState: state }))
      }
    />
  );
}

describe('SiderealAstrologyPanel (Phase: Astrology/Colleges)', () => {
  it('renders all five astrological Houses with their five Colleges each', () => {
    render(<Harness initialCharacter={baseCharacter()} />);
    expect(
      screen.getByRole('heading', { name: 'The House of Journeys (Mercury)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'The House of Endings (Saturn)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: /The Captain: 0 out of 5/ }),
    ).toBeInTheDocument();
  });

  it('raises a College rating via its dot control', async () => {
    const user = userEvent.setup();
    render(<Harness initialCharacter={baseCharacter()} />);
    const captainRating = screen.getByRole('group', {
      name: /The Captain: 0 out of 5/,
    });
    await user.click(
      within(captainRating).getByRole('button', {
        name: 'Set The Captain to 2',
      }),
    );
    expect(
      screen.getByRole('group', { name: /The Captain: 2 out of 5/ }),
    ).toBeInTheDocument();
  });

  it('does not let a College rating change when not in build mode', async () => {
    const user = userEvent.setup();
    render(<Harness initialCharacter={baseCharacter()} buildMode={false} />);
    const captainRating = screen.getByRole('group', {
      name: /The Captain: 0 out of 5/,
    });
    await user.click(
      within(captainRating).getByRole('button', {
        name: 'Set The Captain to 2',
      }),
    );
    expect(
      screen.getByRole('group', { name: /The Captain: 0 out of 5/ }),
    ).toBeInTheDocument();
  });

  it('offers only initiated Colleges when adding a Resplendent Destiny, then records it', async () => {
    const user = userEvent.setup();
    const character = baseCharacter({
      familyState: {
        type: 'sidereal',
        division: '',
        paradox: 0,
        colleges: { 'journeys-the-captain': 2 },
        destinies: [],
      },
    });
    render(<Harness initialCharacter={character} />);
    expect(
      screen.queryByText(
        'Raise a College rating above to record a Resplendent Destiny.',
      ),
    ).not.toBeInTheDocument();
    const select = screen.getByLabelText('College');
    expect(
      within(select).getByRole('option', { name: 'The Captain' }),
    ).toBeInTheDocument();
    expect(
      within(select).queryByRole('option', { name: 'The Gull' }),
    ).not.toBeInTheDocument();

    await user.selectOptions(select, 'journeys-the-captain');
    await user.click(screen.getByRole('button', { name: 'Add destiny' }));

    const destinyRow = screen.getByText('Dormant').closest('details');
    expect(destinyRow).toBeInTheDocument();
    expect(
      within(destinyRow as HTMLElement).getByText('The Captain'),
    ).toBeInTheDocument();
  });

  it('enforces at most one active Resplendent Destiny at a time', async () => {
    const user = userEvent.setup();
    const character = baseCharacter({
      familyState: {
        type: 'sidereal',
        division: '',
        paradox: 0,
        colleges: { 'journeys-the-captain': 2, 'journeys-the-gull': 2 },
        destinies: [
          {
            id: crypto.randomUUID(),
            collegeId: 'journeys-the-captain',
            name: '',
            active: true,
            notes: '',
          },
          {
            id: crypto.randomUUID(),
            collegeId: 'journeys-the-gull',
            name: '',
            active: false,
            notes: '',
          },
        ],
      },
    });
    render(<Harness initialCharacter={character} />);
    // The Gull's destiny row is the dormant one; Captain's starts active.
    const gullDetails = screen.getByText('Dormant').closest('details');
    if (!gullDetails) throw new Error('Expected The Gull details element.');
    await user.click(within(gullDetails).getByRole('checkbox'));

    const activeBadges = screen.getAllByText('Active');
    expect(activeBadges).toHaveLength(1);
    expect(within(gullDetails).getByRole('checkbox')).toBeChecked();
  });

  it('reports a Greater Sign as not yet eligible until Caste, Essence, and all five College ratings are met', () => {
    const character = baseCharacter({
      familyState: {
        type: 'sidereal',
        division: '',
        paradox: 0,
        colleges: {},
        destinies: [],
      },
    });
    render(<Harness initialCharacter={character} />);
    const mercurySign = screen
      .getByText('Greater Sign of Mercury (Sign of Travel)')
      .closest('li');
    if (!mercurySign) throw new Error('Expected the Mercury Greater Sign row.');
    expect(
      within(mercurySign).getByText('Not yet eligible'),
    ).toBeInTheDocument();
  });

  it('reports a Greater Sign as eligible once Caste, Essence 4+, and all five House Colleges at 3+ are met', () => {
    const character = baseCharacter({
      essence: { rating: 4, personal: 0, peripheral: 0, committed: 0 },
      familyState: {
        type: 'sidereal',
        division: '',
        paradox: 0,
        colleges: {
          'journeys-the-captain': 3,
          'journeys-the-gull': 3,
          'journeys-the-mast': 3,
          'journeys-the-messenger': 3,
          'journeys-the-ships-wheel': 3,
        },
        destinies: [],
      },
    });
    render(<Harness initialCharacter={character} />);
    const mercurySign = screen
      .getByText('Greater Sign of Mercury (Sign of Travel)')
      .closest('li');
    if (!mercurySign) throw new Error('Expected the Mercury Greater Sign row.');
    expect(within(mercurySign).getByText('Eligible')).toBeInTheDocument();
  });

  it('renders the Astrology rules reference, including Paradox and Resplendent Destinies', async () => {
    const user = userEvent.setup();
    render(<Harness initialCharacter={baseCharacter()} />);
    const paradoxSummary = screen.getByText('Sidereal Astrology Paradox');
    await user.click(paradoxSummary);
    expect(
      screen.getByText(/reaching 10 or more Paradox triggers pattern bite/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Resplendent Destinies' }),
    ).toBeInTheDocument();
  });
});
