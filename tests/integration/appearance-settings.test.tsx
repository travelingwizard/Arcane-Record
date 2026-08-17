import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { AppearanceProvider } from '../../src/features/settings/AppearanceProvider';
import { AppearanceSettings } from '../../src/features/settings/AppearanceSettings';
import { useAppearance } from '../../src/features/settings/appearance-context';
import {
  appearanceStorageKey,
  baseThemeOptions,
  identityOverlayOptions,
} from '../../src/features/settings/appearance-preferences';

function renderSettings() {
  return render(
    <AppearanceProvider>
      <AppearanceSettings />
    </AppearanceProvider>,
  );
}

function ScopeHarness() {
  const [selectedId, setSelectedId] = useState('character-one');
  const { setActiveCharacterId } = useAppearance();
  const select = (characterId: string) => {
    setSelectedId(characterId);
    setActiveCharacterId(characterId);
  };
  return (
    <>
      <button onClick={() => select('character-one')}>Character one</button>
      <button onClick={() => select('character-two')}>Character two</button>
      <button onClick={() => select('character-three')}>Character three</button>
      <output>{selectedId}</output>
      <AppearanceSettings gameLabel="Test sheet" />
    </>
  );
}

describe('Appearance Settings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme-choice');
    document.documentElement.removeAttribute('data-overlay');
    document.documentElement.removeAttribute('data-reduce-motion');
    document.documentElement.style.removeProperty('color-scheme');
  });

  it('shows every theme and overlay with a complete live sample', async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const dialog = screen.getByRole('dialog', { name: 'Settings' });

    expect(within(dialog).getAllByRole('radio', { name: /.+/ })).toHaveLength(
      baseThemeOptions.length + identityOverlayOptions.length,
    );
    expect(
      within(dialog).getByRole('heading', { name: 'Section heading' }),
    ).toBeVisible();
    expect(within(dialog).getByLabelText('Input field')).toBeVisible();
    expect(
      within(dialog).getByRole('button', { name: 'Primary action' }),
    ).toBeVisible();
    expect(within(dialog).getByText(/Warning message/)).toBeVisible();
    expect(within(dialog).getByText('Willpower')).toBeVisible();
    expect(within(dialog).getByText('Quintessence')).toBeVisible();
    expect(within(dialog).getByText('Paradox')).toBeVisible();
  });

  it('applies, persists, restores, and resets appearance immediately', async () => {
    const user = userEvent.setup();
    const firstRender = renderSettings();
    await user.click(screen.getByRole('button', { name: 'Settings' }));

    await user.click(
      screen.getByRole('radio', { name: /Midnight Quintessence/ }),
    );
    expect(document.documentElement).toHaveAttribute(
      'data-theme',
      'midnight-quintessence',
    );
    await user.click(screen.getByRole('radio', { name: /Order of Hermes/ }));
    await user.click(
      screen.getByRole('switch', { name: /Reduce decorative motion/ }),
    );

    expect(document.documentElement).toHaveAttribute(
      'data-overlay',
      'order-of-hermes',
    );
    expect(document.documentElement).toHaveAttribute(
      'data-reduce-motion',
      'true',
    );
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(appearanceStorageKey) ?? '{}'),
      ).toEqual({
        version: 2,
        defaultAppearance: {
          baseTheme: 'midnight-quintessence',
          identityOverlay: 'order-of-hermes',
          reduceMotion: true,
          customBackground: null,
        },
        characterAppearances: {},
      }),
    );

    await user.click(screen.getByRole('button', { name: 'Close Settings' }));
    firstRender.unmount();
    renderSettings();
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(
      screen.getByRole('radio', { name: /Midnight Quintessence/ }),
    ).toBeChecked();
    expect(
      screen.getByRole('radio', { name: /Order of Hermes/ }),
    ).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Reset Default' }));
    expect(document.documentElement).toHaveAttribute(
      'data-theme',
      'arcane-ledger',
    );
    expect(document.documentElement).toHaveAttribute('data-overlay', 'neutral');
    expect(document.documentElement).toHaveAttribute(
      'data-reduce-motion',
      'false',
    );
    expect(screen.getByRole('radio', { name: /Arcane Ledger/ })).toBeChecked();
  });

  it('isolates character themes and supports default and universal actions', async () => {
    const user = userEvent.setup();
    render(
      <AppearanceProvider>
        <ScopeHarness />
      </AppearanceProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Character one' }));
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('radio', { name: /^Navy/ }));
    await user.click(screen.getByRole('button', { name: 'Close Settings' }));

    await user.click(screen.getByRole('button', { name: 'Character two' }));
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('radio', { name: /Arcane Ledger/ })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: /^Crimson/ }));
    await user.click(screen.getByRole('button', { name: 'Set as Default' }));
    await user.click(screen.getByRole('button', { name: 'Close Settings' }));

    await user.click(screen.getByRole('button', { name: 'Character three' }));
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('radio', { name: /^Crimson/ })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Apply Universally' }));
    await user.click(
      screen.getByRole('button', { name: 'Confirm Apply Universally' }),
    );
    await user.click(screen.getByRole('button', { name: 'Close Settings' }));

    await user.click(screen.getByRole('button', { name: 'Character one' }));
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('radio', { name: /^Crimson/ })).toBeChecked();
  });
});
