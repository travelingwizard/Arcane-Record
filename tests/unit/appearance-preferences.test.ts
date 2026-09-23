import { describe, expect, it } from 'vitest';
import {
  appearanceStorageKey,
  applyAppearancePreferences,
  baseThemeOptions,
  defaultAppearancePreferenceStore,
  getEffectiveAppearance,
  readAppearancePreferences,
  resolveBaseTheme,
} from '../../src/features/settings/appearance-preferences';

const earthdawnThemeIds = [
  'barsaive-twilight',
  'dragons-horn',
  'blood-wood',
  'horror-taint',
  'astral-thread',
] as const;

describe('appearance preferences', () => {
  it('uses Arcane Ledger defaults when no valid preference exists', () => {
    const emptyStorage = { getItem: () => null };
    const invalidStorage = {
      getItem: () => JSON.stringify({ baseTheme: 'unknown-theme' }),
    };

    expect(readAppearancePreferences(emptyStorage)).toEqual(
      defaultAppearancePreferenceStore,
    );
    expect(readAppearancePreferences(invalidStorage)).toEqual(
      defaultAppearancePreferenceStore,
    );
  });

  it('migrates the legacy single preference into the default', () => {
    const storage = {
      getItem: (key: string) =>
        key === appearanceStorageKey
          ? JSON.stringify({
              baseTheme: 'umbral-dreamscape',
              identityOverlay: 'verbena',
              reduceMotion: true,
            })
          : null,
    };

    expect(readAppearancePreferences(storage)).toEqual({
      version: 2,
      defaultAppearance: {
        baseTheme: 'umbral-dreamscape',
        identityOverlay: 'verbena',
        reduceMotion: true,
        customBackground: null,
      },
      characterAppearances: {},
    });
  });

  it('resolves a character override before the default', () => {
    const override = {
      baseTheme: 'simple-navy' as const,
      identityOverlay: 'neutral' as const,
      reduceMotion: false,
      customBackground: null,
    };
    const store = {
      ...defaultAppearancePreferenceStore,
      characterAppearances: { characterId: override },
    };

    expect(getEffectiveAppearance(store, 'characterId')).toEqual(override);
    expect(getEffectiveAppearance(store, 'anotherId')).toEqual(
      store.defaultAppearance,
    );
  });

  it('resolves system appearance and applies semantic root attributes', () => {
    const root = document.createElement('html');
    const preferences = {
      baseTheme: 'system' as const,
      identityOverlay: 'order-of-hermes' as const,
      reduceMotion: true,
      customBackground: null,
    };

    expect(resolveBaseTheme('system', false)).toBe('arcane-ledger');
    expect(resolveBaseTheme('system', true)).toBe('midnight-quintessence');

    applyAppearancePreferences(preferences, root, true);
    expect(root).toHaveAttribute('data-theme', 'midnight-quintessence');
    expect(root).toHaveAttribute('data-theme-choice', 'system');
    expect(root).toHaveAttribute('data-overlay', 'order-of-hermes');
    expect(root).toHaveAttribute('data-reduce-motion', 'true');
    expect(root.style.colorScheme).toBe('dark');
  });

  it('applies and removes a validated custom background variable', () => {
    const root = document.createElement('html');
    applyAppearancePreferences(
      {
        baseTheme: 'custom-background',
        identityOverlay: 'neutral',
        reduceMotion: false,
        customBackground: '#123456',
      },
      root,
    );
    expect(root).toHaveAttribute('data-theme', 'custom-background');
    expect(root.style.getPropertyValue('--custom-app-background')).toBe(
      '#123456',
    );

    applyAppearancePreferences(
      defaultAppearancePreferenceStore.defaultAppearance,
      root,
    );
    expect(root.style.getPropertyValue('--custom-app-background')).toBe('');
  });

  it('registers and applies every Earthdawn-inspired theme as a dark theme', () => {
    expect(
      baseThemeOptions
        .filter((theme) => theme.category === 'earthdawn')
        .map((theme) => theme.id),
    ).toEqual(earthdawnThemeIds);

    for (const baseTheme of earthdawnThemeIds) {
      const root = document.createElement('html');
      applyAppearancePreferences(
        {
          baseTheme,
          identityOverlay: 'neutral',
          reduceMotion: false,
          customBackground: null,
        },
        root,
      );
      expect(root).toHaveAttribute('data-theme', baseTheme);
      expect(root.style.colorScheme).toBe('dark');
    }
  });
});
