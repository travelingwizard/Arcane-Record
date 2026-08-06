import { describe, expect, it } from 'vitest';
import {
  appearanceStorageKey,
  applyAppearancePreferences,
  defaultAppearancePreferences,
  readAppearancePreferences,
  resolveBaseTheme,
} from '../../src/features/settings/appearance-preferences';

describe('appearance preferences', () => {
  it('uses Arcane Ledger defaults when no valid preference exists', () => {
    const emptyStorage = { getItem: () => null };
    const invalidStorage = {
      getItem: () =>
        JSON.stringify({
          baseTheme: 'unknown-theme',
          identityOverlay: 'neutral',
          reduceMotion: false,
        }),
    };

    expect(readAppearancePreferences(emptyStorage)).toEqual(
      defaultAppearancePreferences,
    );
    expect(readAppearancePreferences(invalidStorage)).toEqual(
      defaultAppearancePreferences,
    );
  });

  it('validates and reads a complete stored preference', () => {
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
      baseTheme: 'umbral-dreamscape',
      identityOverlay: 'verbena',
      reduceMotion: true,
    });
  });

  it('resolves system appearance and applies semantic root attributes', () => {
    const root = document.createElement('html');
    const preferences = {
      baseTheme: 'system' as const,
      identityOverlay: 'order-of-hermes' as const,
      reduceMotion: true,
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
});
