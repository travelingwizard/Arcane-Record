import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  getCharacterSectionPreferenceKey,
  readCharacterSectionPreferences,
  useCharacterSectionPreferences,
} from '../../src/features/character-editor/use-character-section-preferences';

describe('character section preferences', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('defaults to Identity and stores expansion separately per character', () => {
    const first = renderHook(() =>
      useCharacterSectionPreferences('character-one'),
    );
    expect([...first.result.current.expandedSections]).toEqual(['identity']);

    act(() => first.result.current.setSectionExpanded('backgrounds', true));
    expect(readCharacterSectionPreferences('character-one')).toEqual([
      'identity',
      'backgrounds',
    ]);
    expect(readCharacterSectionPreferences('character-two')).toBeNull();

    const second = renderHook(() =>
      useCharacterSectionPreferences('character-two'),
    );
    expect([...second.result.current.expandedSections]).toEqual(['identity']);
  });

  it('includes a valid initial hash and ignores removed section IDs', () => {
    window.history.replaceState(null, '', '/#spheres');
    localStorage.setItem(
      getCharacterSectionPreferenceKey('legacy-character'),
      JSON.stringify({
        characterId: 'legacy-character',
        expandedSections: ['identity', 'removed-section', 'health'],
      }),
    );

    expect(readCharacterSectionPreferences('legacy-character')).toEqual([
      'identity',
      'health',
    ]);
    const hashed = renderHook(() =>
      useCharacterSectionPreferences('hash-character'),
    );
    expect([...hashed.result.current.expandedSections]).toEqual([
      'identity',
      'spheres',
    ]);
  });

  it('supports Expand All and keeps one target open for Collapse All', () => {
    const preferences = renderHook(() =>
      useCharacterSectionPreferences('bulk-character'),
    );

    act(() => preferences.result.current.expandAllSections());
    expect(preferences.result.current.expandedSections.size).toBe(15);

    act(() => preferences.result.current.collapseAllSections('merits-flaws'));
    expect([...preferences.result.current.expandedSections]).toEqual([
      'merits-flaws',
    ]);
  });
});
