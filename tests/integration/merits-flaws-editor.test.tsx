import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MeritsFlawsSection } from '../../src/components/character/MeritsFlawsSection';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';
import { useEditorStore } from '../../src/state/editor-store';

describe('Merits and Flaws editor', () => {
  beforeEach(() => {
    act(() => useEditorStore.getState().load(createBlankMageCharacter()));
  });

  afterEach(() => {
    act(() => useEditorStore.getState().clear());
  });

  it('adds variable-cost entries, previews details, and updates totals', async () => {
    const user = userEvent.setup();
    render(<MeritsFlawsSection />);

    expect(screen.getByText('No Merits selected.')).toBeVisible();
    expect(screen.getByText('No Flaws selected.')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Open catalog' }));
    const search = screen.getByRole('searchbox', { name: 'Search catalog' });
    await user.type(search, 'Acute Senses');

    const preview = screen.getByRole('button', {
      name: 'Preview description for Acute Senses',
    });
    await user.click(preview);
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'Reduces the difficulty',
    );
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    const expand = screen.getByRole('button', {
      name: 'Expand description for Acute Senses',
    });
    await user.click(expand);
    expect(expand).toHaveAttribute('aria-expanded', 'true');

    const add = screen.getByRole('button', { name: 'Add' });
    expect(add).toBeDisabled();
    await user.selectOptions(screen.getByLabelText('Choose cost'), '3');
    expect(screen.getByText('Merits 3 · Flaws 0/7 · Net 3')).toBeVisible();
    await user.click(add);

    const meritsTotal = screen
      .getAllByText('Merits 3 · Flaws 0/7 · Net 3')[0]
      .parentElement?.querySelector('.merit-flaw-summary__details > div');
    expect(meritsTotal).not.toBeNull();
    expect(
      within(meritsTotal as HTMLElement).getByText('3 points'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'View selected' })).toBeVisible();
    expect(
      useEditorStore.getState().character?.repeatableEntries.merits[0],
    ).toMatchObject({ definitionId: 'acute-senses', chosenCost: 3 });
  });

  it('changes legal costs, removes, and restores cost and notes through Undo', async () => {
    const user = userEvent.setup();
    act(() => {
      useEditorStore.getState().addMeritFlaw('merit', 'acute-senses', 3);
    });
    render(<MeritsFlawsSection />);

    const selectedCard = screen
      .getByRole('heading', { name: 'Acute Senses' })
      .closest('article');
    expect(selectedCard).not.toBeNull();
    const selected = within(selectedCard!);
    await user.click(
      selected.getByRole('button', {
        name: 'Expand selected Acute Senses',
      }),
    );
    await user.type(selected.getByLabelText('Character notes'), 'Keen hearing');
    await user.selectOptions(selected.getByLabelText('Selected cost'), '1');
    expect(
      useEditorStore.getState().character?.repeatableEntries.merits[0],
    ).toMatchObject({ chosenCost: 1, notes: 'Keen hearing' });

    await user.click(selected.getByRole('button', { name: 'Remove' }));
    expect(screen.getByText('No Merits selected.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Undo last change' }));

    expect(
      useEditorStore.getState().character?.repeatableEntries.merits[0],
    ).toMatchObject({ chosenCost: 1, notes: 'Keen hearing' });
  });

  it('warns above the standard Flaw allowance without blocking edits', () => {
    act(() => {
      useEditorStore.getState().addMeritFlaw('flaw', 'aging', 8);
    });
    render(<MeritsFlawsSection />);

    expect(screen.getByText(/selected 8 points of Flaws/)).toBeVisible();
    expect(screen.getByText('Excess Flaws: 1 point')).toBeVisible();
    expect(
      useEditorStore.getState().character?.repeatableEntries.flaws,
    ).toHaveLength(1);
  });
});
