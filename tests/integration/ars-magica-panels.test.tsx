import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TraitsPanel } from '../../src/games/ars-magica-definitive/TraitsPanel';
import { createArsCharacter } from '../../src/games/ars-magica-definitive/create-character';

describe('Ars Magica semantic Trait controls', () => {
  it('adds explicitly custom records in Build mode', () => {
    const onChange = vi.fn();
    render(
      <TraitsPanel
        character={createArsCharacter()}
        onChange={onChange}
        scale="ability"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add custom Ability' }));
    expect(onChange.mock.calls[0][0].definition.traits.at(-1)).toMatchObject({
      status: 'custom',
      definitionId: null,
      experience: 0,
    });
  });
  it('locks permanent XP in Play while retaining shared field/card markup', () => {
    const c = createArsCharacter();
    c.definition.traits = [];
    c.mode = 'play';
    c.definition.traits.push({
      id: crypto.randomUUID(),
      name: 'Test',
      definitionId: null,
      status: 'custom',
      citation: null,
      notes: '',
      scale: 'ability',
      experience: 75,
      specialty: '',
    });
    const { container } = render(
      <TraitsPanel character={c} onChange={vi.fn()} scale="ability" />,
    );
    expect(
      screen.getByRole('spinbutton', { name: 'Earned experience' }),
    ).toHaveAttribute('readonly');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(
      container.querySelector('.sheet-card .sheet-field-grid .sheet-field'),
    ).not.toBeNull();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
