import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DotRating } from '../../src/components/controls/DotRating';

describe('DotRating', () => {
  it('sets a pointer-selected value and lowers the active highest dot', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <DotRating
        label="Strength"
        value={1}
        min={1}
        max={5}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Set Strength to 3' }));
    expect(onChange).toHaveBeenLastCalledWith(3);

    rerender(
      <DotRating
        label="Strength"
        value={3}
        min={1}
        max={5}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Set Strength to 3' }));
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it('sets a lower filled dot directly', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DotRating
        label="Forces"
        value={4}
        min={0}
        max={5}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Set Forces to 2' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('supports Arrow, Home, and End keyboard behavior', () => {
    const onChange = vi.fn();
    render(
      <DotRating
        label="Willpower"
        value={4}
        min={0}
        max={10}
        showBreakAfterFive
        onChange={onChange}
      />,
    );
    const control = screen.getByRole('group', {
      name: 'Willpower: 4 out of 10',
    });

    fireEvent.keyDown(control, { key: 'ArrowRight' });
    fireEvent.keyDown(control, { key: 'ArrowLeft' });
    fireEvent.keyDown(control, { key: 'Home' });
    fireEvent.keyDown(control, { key: 'End' });

    expect(onChange.mock.calls.map(([value]) => value)).toEqual([5, 3, 0, 10]);
  });

  it('enforces minimum and maximum keyboard limits', () => {
    const atMinimum = vi.fn();
    const { rerender } = render(
      <DotRating
        label="Strength"
        value={1}
        min={1}
        max={5}
        onChange={atMinimum}
      />,
    );
    fireEvent.keyDown(
      screen.getByRole('group', { name: 'Strength: 1 out of 5' }),
      { key: 'ArrowLeft' },
    );
    expect(atMinimum).toHaveBeenCalledWith(1);

    const atMaximum = vi.fn();
    rerender(
      <DotRating
        label="Strength"
        value={5}
        min={1}
        max={5}
        onChange={atMaximum}
      />,
    );
    fireEvent.keyDown(
      screen.getByRole('group', { name: 'Strength: 5 out of 5' }),
      { key: 'ArrowRight' },
    );
    expect(atMaximum).toHaveBeenCalledWith(5);
  });

  it('exposes the requested accessible value label', () => {
    render(
      <DotRating
        label="Strength"
        value={3}
        min={1}
        max={5}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('group', { name: 'Strength: 3 out of 5' }),
    ).toBeVisible();
  });

  it('does not change in disabled or read-only states', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <DotRating
        label="Arete"
        value={2}
        min={0}
        max={5}
        disabled
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('group')).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getByRole('button', { name: 'Set Arete to 3' }),
    ).toBeDisabled();

    rerender(
      <DotRating
        label="Arete"
        value={2}
        min={0}
        max={5}
        readOnly
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Set Arete to 3' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
