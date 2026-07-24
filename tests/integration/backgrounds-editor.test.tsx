import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BackgroundsSection } from '../../src/components/character/BackgroundsSection';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';
import { useEditorStore } from '../../src/state/editor-store';

describe('Background editor', () => {
  beforeEach(() => {
    act(() => useEditorStore.getState().load(createBlankMageCharacter()));
  });

  afterEach(() => {
    act(() => useEditorStore.getState().clear());
  });

  it('previews, expands, adds, rates, and totals one- and two-point entries', async () => {
    const user = userEvent.setup();
    render(<BackgroundsSection />);

    expect(screen.getByText('No Backgrounds selected.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Open catalog' }));
    const search = screen.getByRole('searchbox', {
      name: 'Search Backgrounds',
    });
    await user.type(search, 'Resources');

    const preview = screen.getByRole('button', {
      name: 'Preview description for Resources',
    });
    await user.hover(preview);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Financial assets');
    await user.unhover(preview);
    preview.focus();
    fireEvent.focus(preview);
    expect(screen.getByRole('tooltip')).toBeVisible();
    fireEvent.keyDown(preview, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    const resourcesResult = screen
      .getByRole('heading', { name: 'Resources' })
      .closest('article')!;
    await user.click(
      within(resourcesResult).getByRole('button', {
        name: 'Expand description for Resources',
      }),
    );
    expect(screen.getByText('Mage 20, p. 322')).toBeVisible();
    await user.click(
      within(resourcesResult).getByRole('button', { name: /^Add$/ }),
    );
    const selectedResources = screen
      .getAllByRole('heading', { name: 'Resources' })
      .at(0)!
      .closest('article')!;
    await waitFor(() => expect(selectedResources).toHaveFocus());
    await user.click(
      screen.getByRole('button', { name: 'Set Resources to 3' }),
    );
    expect(screen.getByText('Backgrounds 3/7 · 4 remaining')).toBeVisible();

    await user.clear(search);
    await user.type(search, 'Enhancement');
    const enhancementResult = screen
      .getByRole('heading', { name: 'Enhancement' })
      .closest('article')!;
    await user.click(
      within(enhancementResult).getByRole('button', { name: /^Add$/ }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Set Enhancement to 2' }),
    );
    expect(screen.getByText('Backgrounds 7/7 · 0 remaining')).toBeVisible();
    expect(
      useEditorStore.getState().character?.repeatableEntries.backgrounds,
    ).toMatchObject([
      { definitionId: 'resources', rating: 3 },
      { definitionId: 'enhancement', rating: 2 },
    ]);
  });

  it('supports multiple instances and prevents accidental single duplicates', () => {
    const store = useEditorStore.getState();
    const firstAlly = store.addBackground('allies');
    const secondAlly = store.addBackground('allies');
    const resources = store.addBackground('resources');
    const duplicateResources = store.addBackground('resources');

    expect(firstAlly).not.toBeNull();
    expect(secondAlly).not.toBeNull();
    expect(resources).not.toBeNull();
    expect(duplicateResources).toBeNull();
    expect(
      useEditorStore
        .getState()
        .character?.repeatableEntries.backgrounds.filter(
          ({ definitionId }) => definitionId === 'allies',
        ),
    ).toHaveLength(2);
  });

  it('edits extended ratings, names, notes, pooling, and restores removal', async () => {
    const user = userEvent.setup();
    act(() => {
      useEditorStore.getState().addBackground('resources');
      useEditorStore.getState().addBackground('chantry-construct');
    });
    render(<BackgroundsSection />);

    const resources = screen
      .getByRole('heading', { name: 'Resources' })
      .closest('article')!;
    await user.click(
      within(resources).getByRole('button', {
        name: 'Expand selected Resources',
      }),
    );
    const extendedRating = within(resources).getByRole('spinbutton');
    fireEvent.change(extendedRating, { target: { value: '7' } });
    expect(
      within(resources).getByText(
        'Extended rating — Storyteller approval recommended.',
      ),
    ).toBeVisible();

    const chantry = screen
      .getByRole('heading', { name: 'Chantry / Construct' })
      .closest('article')!;
    await user.click(
      within(chantry).getByRole('button', {
        name: 'Expand selected Chantry / Construct',
      }),
    );
    await user.clear(within(chantry).getByLabelText('Character label'));
    await user.type(
      within(chantry).getByLabelText('Character label'),
      'Shared Horizon Room',
    );
    await user.type(
      within(chantry).getByLabelText('Character notes'),
      'Pooled with the cabal.',
    );
    await user.click(
      within(chantry).getByRole('checkbox', {
        name: 'Mark as pooled with other characters',
      }),
    );
    await user.click(within(chantry).getByRole('button', { name: 'Remove' }));
    await user.click(
      screen.getByRole('button', { name: 'Undo last Background change' }),
    );

    expect(
      useEditorStore
        .getState()
        .character?.repeatableEntries.backgrounds.find(
          ({ definitionId }) => definitionId === 'chantry-construct',
        ),
    ).toMatchObject({
      displayName: 'Shared Horizon Room',
      notes: 'Pooled with the cabal.',
      pooled: true,
    });
  });

  it('shows warning-only restrictions and over-allowance totals', async () => {
    const user = userEvent.setup();
    act(() => {
      const store = useEditorStore.getState();
      const resources = store.addBackground('resources')!;
      store.updateBackground(resources, { rating: 7 });
      store.addBackground('totem');
    });
    render(<BackgroundsSection />);

    expect(screen.getByText('Backgrounds 9/7 · 2 over')).toBeVisible();
    expect(
      screen.getByText(
        'This character has spent 9 Background points. Standard Mage M20 character creation normally provides 7 points.',
      ),
    ).toBeVisible();

    const totem = screen
      .getByRole('heading', { name: 'Totem' })
      .closest('article')!;
    await user.click(
      within(totem).getByRole('button', {
        name: 'Expand selected Totem',
      }),
    );
    expect(within(totem).getByRole('note')).toHaveTextContent(
      'Intended for suitable shamanic characters.',
    );
    expect(
      useEditorStore
        .getState()
        .character?.repeatableEntries.backgrounds.some(
          ({ definitionId }) => definitionId === 'totem',
        ),
    ).toBe(true);
  });

  it('preserves and repairs an unresolved imported reference', async () => {
    const user = userEvent.setup();
    const character = createBlankMageCharacter();
    character.repeatableEntries.backgrounds.push({
      id: crypto.randomUUID(),
      definitionId: 'legacy-network',
      displayName: 'Old network',
      rating: 3,
      notes: 'Imported contact web',
      addedAt: new Date().toISOString(),
      pooled: false,
      unresolvedDefinitionName: 'Old Network',
    });
    act(() => useEditorStore.getState().load(character));
    render(<BackgroundsSection />);

    expect(
      screen.getByText(
        '1 unresolved reference is not included in the point total.',
      ),
    ).toBeVisible();
    await user.click(
      screen.getByRole('button', {
        name: 'Expand selected Old network',
      }),
    );
    await user.selectOptions(
      screen.getByLabelText('Repair reference'),
      'resources',
    );

    expect(screen.getByText('Backgrounds 3/7 · 4 remaining')).toBeVisible();
    expect(
      useEditorStore.getState().character?.repeatableEntries.backgrounds[0],
    ).toMatchObject({
      definitionId: 'resources',
      displayName: 'Old network',
      rating: 3,
    });
  });
});
