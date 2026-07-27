import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CharacterEditor } from '../../src/features/character-editor/CharacterEditor';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';
import { useEditorStore } from '../../src/state/editor-store';
import type { CharacterRepository } from '../../src/storage/character-repository';
import type { MageCharacter } from '../../src/types/character';

function setNarrowLayout(narrow: boolean, reducedMotion = false) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('max-width')
        ? narrow
        : query.includes('prefers-reduced-motion')
          ? reducedMotion
          : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

function createRepository(character: MageCharacter): CharacterRepository {
  return {
    list: vi.fn(async () => [character]),
    get: vi.fn(async () => character),
    create: vi.fn(async (next = character) => next),
    save: vi.fn(async (next) => next),
    duplicate: vi.fn(async () => structuredClone(character)),
    delete: vi.fn(async () => undefined),
  };
}

function renderEditor(character = createBlankMageCharacter()) {
  act(() => useEditorStore.getState().load(character));
  return render(
    <CharacterEditor
      repository={createRepository(character)}
      onReturnToLibrary={vi.fn(async () => undefined)}
      onImported={vi.fn()}
    />,
  );
}

describe('character section navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      }),
    );
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    act(() => useEditorStore.getState().clear());
    vi.unstubAllGlobals();
  });

  it('renders grouped desktop anchors and tracks navigation and keyboard focus', async () => {
    setNarrowLayout(false);
    renderEditor();

    const navigation = screen.getByRole('navigation', {
      name: 'Character sheet sections',
    });
    const links = within(navigation).getAllByRole('link');
    expect(links).toHaveLength(14);
    expect(
      within(navigation).getByRole('link', { name: 'Identity' }),
    ).toHaveAttribute('aria-current', 'location');
    expect(
      within(navigation).getByRole('button', { name: 'Paradigm' }),
    ).toHaveAttribute('aria-expanded', 'true');
    await userEvent
      .setup()
      .click(within(navigation).getByRole('button', { name: 'Paradigm' }));
    expect(
      within(navigation).getByRole('button', { name: 'Paradigm' }),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(
      within(navigation).queryByRole('link', { name: 'Focus' }),
    ).not.toBeInTheDocument();
    await userEvent
      .setup()
      .click(within(navigation).getByRole('button', { name: 'Paradigm' }));

    await userEvent
      .setup()
      .click(within(navigation).getByRole('link', { name: 'Backgrounds' }));
    expect(window.location.hash).toBe('#backgrounds');
    expect(
      within(navigation).getByRole('link', { name: 'Backgrounds' }),
    ).toHaveAttribute('aria-current', 'location');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(document.getElementById('backgrounds-heading')).not.toHaveFocus();

    const spheresLink = within(navigation).getByRole('link', {
      name: 'Spheres',
    });
    fireEvent.click(spheresLink, { detail: 0 });
    await waitFor(() =>
      expect(document.getElementById('spheres-heading')).toHaveFocus(),
    );
  });

  it('switches modes and reorders group headings across the sheet and navigation', async () => {
    setNarrowLayout(false);
    renderEditor();
    const user = userEvent.setup();
    const modeSwitch = screen.getByRole('switch', {
      name: /Build mode.*Play mode/i,
    });

    await user.click(modeSwitch);
    expect(modeSwitch).toBeChecked();

    const sectionIds = [
      ...document.querySelectorAll('.character-sheet section'),
    ].map((section) => section.id);
    expect(sectionIds.slice(0, 4)).toEqual([
      'health',
      'spheres',
      'enlightenment',
      'attributes',
    ]);

    const navigation = screen.getByRole('navigation', {
      name: 'Character sheet sections',
    });
    await user.click(
      within(navigation).getByRole('button', {
        name: 'Move Character earlier',
      }),
    );

    const reorderedSectionIds = [
      ...document.querySelectorAll('.character-sheet section'),
    ].map((section) => section.id);
    expect(reorderedSectionIds.indexOf('identity')).toBeLessThan(
      reorderedSectionIds.indexOf('focus'),
    );
    expect(useEditorStore.getState().character?.sheetLayout).toMatchObject({
      mode: 'play',
      groupOrders: {
        play: [
          'condition',
          'magick',
          'traits',
          'gear',
          'advantages',
          'character',
          'paradigm',
          'records',
        ],
      },
    });
  });

  it('expands a valid initial hash and safely ignores an invalid one', () => {
    setNarrowLayout(true);
    window.history.replaceState(null, '', '/#spheres');
    const { unmount } = renderEditor();

    expect(
      screen.getByRole('button', { name: 'Collapse Spheres' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('group', { name: 'Forces: 0 out of 5' }),
    ).toBeVisible();

    unmount();
    act(() => useEditorStore.getState().clear());
    localStorage.clear();
    window.history.replaceState(null, '', '/#unsupported');
    renderEditor();
    expect(
      screen.getByRole('button', { name: 'Collapse Identity' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('button', { name: 'Expand Spheres' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('supports independent mobile disclosures without changing character data', async () => {
    setNarrowLayout(true);
    const user = userEvent.setup();
    const character = createBlankMageCharacter();
    renderEditor(character);

    const identityDisclosure = screen.getByRole('button', {
      name: 'Collapse Identity',
    });
    const attributesDisclosure = screen.getByRole('button', {
      name: 'Expand Attributes',
    });
    expect(screen.getByLabelText('Name', { exact: true })).toBeVisible();
    expect(
      screen.getByRole('group', {
        name: 'Strength: 1 out of 5',
        hidden: true,
      }),
    ).not.toBeVisible();

    await user.click(attributesDisclosure);
    await user.click(screen.getByRole('button', { name: 'Set Strength to 3' }));
    const collapseAttributes = screen.getByRole('button', {
      name: 'Collapse Attributes',
    });
    fireEvent.click(collapseAttributes);
    expect(collapseAttributes).toHaveFocus();
    expect(identityDisclosure).toHaveAttribute('aria-expanded', 'true');
    expect(collapseAttributes).toHaveAttribute('aria-expanded', 'false');
    expect(
      useEditorStore.getState().character?.attributes.physical.strength,
    ).toBe(3);

    await user.click(collapseAttributes);
    expect(
      screen.getByRole('group', { name: 'Strength: 3 out of 5' }),
    ).toBeVisible();
  }, 10_000);

  it('opens, traps, dismisses, and navigates from the mobile Sections sheet', async () => {
    setNarrowLayout(true);
    const user = userEvent.setup();
    renderEditor();

    const trigger = screen.getByRole('button', {
      name: /Sections Identity/,
    });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', {
      name: 'Character Sections',
    });
    expect(dialog).toBeVisible();
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    expect(
      screen.queryByRole('dialog', { name: 'Character Sections' }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('');

    await user.click(trigger);
    const reopened = screen.getByRole('dialog', {
      name: 'Character Sections',
    });
    await user.click(within(reopened).getByText('Expand all sections'));
    expect(
      screen.getByRole('button', { name: 'Collapse Health' }),
    ).toHaveAttribute('aria-expanded', 'true');
    await user.click(within(reopened).getByText('Collapse all sections'));
    expect(
      screen.getByRole('button', { name: 'Expand Health' }),
    ).toHaveAttribute('aria-expanded', 'false');

    await user.click(
      within(reopened).getByRole('link', { name: /Backgrounds/ }),
    );
    expect(
      screen.queryByRole('dialog', { name: 'Character Sections' }),
    ).not.toBeInTheDocument();
    expect(window.location.hash).toBe('#backgrounds');
    expect(
      screen.getByRole('button', { name: 'Collapse Backgrounds' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('backgrounds-heading')).toHaveFocus();
  }, 10_000);

  it('restores hash navigation after a browser history event', () => {
    setNarrowLayout(true);
    renderEditor();

    act(() => {
      window.history.pushState(null, '', '#health');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(
      screen.getByRole('button', { name: 'Collapse Health' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(window.location.hash).toBe('#health');
  });

  it('uses one observer, cleans it up, and respects reduced motion', async () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn(function IntersectionObserverMock() {
        return {
          observe,
          unobserve: vi.fn(),
          disconnect,
          takeRecords: vi.fn(() => []),
          root: null,
          rootMargin: '',
          thresholds: [],
        };
      }),
    );
    setNarrowLayout(false, true);
    const rendered = renderEditor();

    expect(IntersectionObserver).toHaveBeenCalledTimes(1);
    expect(observe).toHaveBeenCalledTimes(14);
    const navigation = screen.getByRole('navigation', {
      name: 'Character sheet sections',
    });
    await userEvent
      .setup()
      .click(within(navigation).getByRole('link', { name: 'Health' }));
    expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({
      behavior: 'auto',
      block: 'start',
    });

    rendered.unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('keeps point-limit warnings in collapsed section summaries', () => {
    setNarrowLayout(true);
    const character = createBlankMageCharacter();
    character.repeatableEntries.backgrounds = [
      {
        id: crypto.randomUUID(),
        definitionId: 'resources',
        displayName: 'Resources',
        rating: 7,
        notes: '',
        addedAt: new Date().toISOString(),
        pooled: false,
      },
      {
        id: crypto.randomUUID(),
        definitionId: 'totem',
        displayName: 'Totem',
        rating: 1,
        notes: '',
        addedAt: new Date().toISOString(),
        pooled: false,
      },
    ];
    character.repeatableEntries.flaws = [
      {
        id: crypto.randomUUID(),
        definitionId: 'addiction',
        chosenCost: 5,
        notes: '',
        addedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        definitionId: 'dark-secret',
        chosenCost: 3,
        notes: '',
        addedAt: new Date().toISOString(),
      },
    ];
    renderEditor(character);

    expect(
      screen.getByRole('button', { name: 'Expand Backgrounds' }),
    ).toHaveTextContent('2 points over standard allowance');
    expect(
      screen.getByRole('button', { name: 'Expand Merits & Flaws' }),
    ).toHaveTextContent('1 Flaw point exceeds the standard benefit');
  });
});
