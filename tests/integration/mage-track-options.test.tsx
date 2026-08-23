import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnlightenmentSection } from '../../src/components/character/EnlightenmentSection';
import { setTemporaryWillpowerDots } from '../../src/games/mage20/mage-sheet-preferences';
import { MageSheetSettingsPanel } from '../../src/games/mage20/MageSheetSettingsPanel';
import { useEditorStore } from '../../src/state/editor-store';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';

describe('Mage Quintessence, Paradox, and Willpower tracks', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setTemporaryWillpowerDots(false);
    act(() => useEditorStore.getState().load(createBlankMageCharacter()));
  });

  afterEach(() => {
    setTemporaryWillpowerDots(false);
    act(() => useEditorStore.getState().clear());
  });

  it('moves Quintessence up, moves Paradox down, and gives Paradox precedence', async () => {
    const user = userEvent.setup();
    act(() => {
      for (let index = 0; index < 10; index += 1) {
        useEditorStore
          .getState()
          .updateEnlightenment('quintessence', index + 1);
      }
      useEditorStore.getState().updateEnlightenment('paradox', 1);
    });
    const { container } = render(<EnlightenmentSection />);

    const marker = (position: number) =>
      container.querySelector(`[data-position="${position}"]`);
    expect(marker(0)).toHaveAttribute('data-marker', 'paradox');
    expect(marker(0)).toHaveAttribute('data-overlap', 'true');
    expect(marker(1)).toHaveAttribute('data-marker', 'quintessence');
    expect(marker(9)).toHaveAttribute('data-marker', 'quintessence');
    expect(marker(10)).toHaveAttribute('data-marker', 'empty');
    expect(marker(19)).toHaveAttribute('data-marker', 'empty');
    expect(container.querySelectorAll('[data-position]')).toHaveLength(20);

    await user.click(screen.getByRole('button', { name: 'Subtract Paradox' }));

    expect(marker(0)).toHaveAttribute('data-marker', 'quintessence');
    expect(screen.getByLabelText('Paradox rating')).toHaveTextContent('0 / 10');
  });

  it('keeps Temporary Willpower boxes by default and switches to dots in Mage settings', async () => {
    const user = userEvent.setup();
    render(
      <>
        <MageSheetSettingsPanel />
        <EnlightenmentSection />
      </>,
    );

    const track = screen.getByTestId('rating-temporary-willpower');
    const toggle = screen.getByRole('switch', {
      name: /Temporary Willpower dots/,
    });
    expect(track).toHaveClass('dot-rating--boxes');
    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    expect(track).toHaveClass('dot-rating--dots');
    expect(toggle).toBeChecked();
    expect(
      window.localStorage.getItem('arcane-ledger:temporary-willpower-dots'),
    ).toBe('true');
  });
});
