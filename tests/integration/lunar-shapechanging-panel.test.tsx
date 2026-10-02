import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { LunarShapechangingPanel } from '../../src/games/exalted1e/LunarShapechangingPanel';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import type { Exalted1eCharacter } from '../../src/games/exalted1e/schema';

type LunarFamilyState = Extract<
  Exalted1eCharacter['familyState'],
  { type: 'lunar' }
>;

function baseCharacter(overrides?: Partial<Exalted1eCharacter>) {
  return { ...createBlankExaltedCharacter('lunar'), ...overrides };
}

function Harness({
  initialCharacter,
  buildMode = true,
}: {
  initialCharacter: Exalted1eCharacter;
  buildMode?: boolean;
}) {
  const [character, setCharacter] = useState(initialCharacter);
  if (character.familyState.type !== 'lunar') {
    throw new Error('Harness requires a Lunar character.');
  }
  return (
    <LunarShapechangingPanel
      state={character.familyState}
      buildMode={buildMode}
      onChange={(state: LunarFamilyState) =>
        setCharacter((current) => ({ ...current, familyState: state }))
      }
    />
  );
}

describe('LunarShapechangingPanel (Phase 1c)', () => {
  it('reports no Heart’s Blood forms recorded on a blank character', () => {
    render(<Harness initialCharacter={baseCharacter()} />);
    expect(
      screen.getByText('No Heart\u2019s Blood forms recorded.'),
    ).toBeInTheDocument();
  });

  it('adds a new Heart’s Blood form by name', async () => {
    const user = userEvent.setup();
    render(<Harness initialCharacter={baseCharacter()} />);
    await user.type(screen.getByLabelText('New form name'), 'Grey Wolf');
    await user.click(screen.getByRole('button', { name: 'Add form' }));
    expect(screen.getByText('Grey Wolf')).toBeInTheDocument();
  });

  it('does not add a form when not in build mode', async () => {
    const user = userEvent.setup();
    render(<Harness initialCharacter={baseCharacter()} buildMode={false} />);
    expect(screen.getByLabelText('New form name')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add form' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Add form' }));
    expect(
      screen.getByText('No Heart\u2019s Blood forms recorded.'),
    ).toBeInTheDocument();
  });

  it('removes a recorded Heart’s Blood form', async () => {
    const user = userEvent.setup();
    const formId = crypto.randomUUID();
    const character = baseCharacter({
      familyState: {
        type: 'lunar',
        tell: '',
        tattooed: false,
        heartBloodForms: [{ id: formId, name: 'Grey Wolf', notes: '' }],
        activeFormId: null,
        primaryVirtueId: null,
      },
    });
    render(<Harness initialCharacter={character} />);
    const details = screen.getByText('Grey Wolf').closest('details');
    if (!details) throw new Error('Expected the Grey Wolf details element.');
    await user.click(details);
    await user.click(within(details).getByRole('button', { name: 'Remove' }));
    expect(
      screen.getByText('No Heart\u2019s Blood forms recorded.'),
    ).toBeInTheDocument();
  });

  it('shows the matching inner-beast thrall once a primary Virtue is declared', async () => {
    const user = userEvent.setup();
    render(<Harness initialCharacter={baseCharacter()} />);
    expect(
      screen.getByText((content) =>
        content.startsWith('Declare a primary Virtue'),
      ),
    ).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Primary Virtue'), 'valor');
    expect(
      screen.getAllByText('Curse of the Raging Bull').length,
    ).toBeGreaterThan(0);
  });

  it('renders all five Great Curse rows and the Shapechanging rules reference', () => {
    render(<Harness initialCharacter={baseCharacter()} />);
    expect(
      screen.getByRole('heading', { name: 'The Great Curse' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Curse of the Whipped Dog')).toBeInTheDocument();
    expect(
      screen.getByText('Curse of the Heartless Weasel'),
    ).toBeInTheDocument();
    expect(screen.getByText('Curse of the Drunken Monkey')).toBeInTheDocument();
    expect(screen.getByText('Curse of the Raging Bull')).toBeInTheDocument();
    expect(screen.getByText('Lunar Shapechanging')).toBeInTheDocument();
    expect(screen.getByText('The Tell')).toBeInTheDocument();
  });
});
