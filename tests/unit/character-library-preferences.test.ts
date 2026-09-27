import { describe, expect, it } from 'vitest';
import {
  defaultCharacterLibraryPreferences,
  readCharacterLibraryPreferences,
  reconcileCharacterLibraryPreferences,
  removeCharacterLibraryPreference,
  writeCharacterLibraryPreferences,
} from '../../src/features/character-library/character-library-preferences';

describe('character library preferences', () => {
  it('falls back safely when stored data is malformed', () => {
    expect(
      readCharacterLibraryPreferences({ getItem: () => '{broken' }),
    ).toEqual(defaultCharacterLibraryPreferences);
  });

  it('round-trips local organization without character data', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const preferences = {
      version: 1 as const,
      archivedIds: ['c'],
      favoriteIds: ['a'],
      favoriteOrderIds: ['a'],
      regularOrderIds: ['b'],
      archivedOrderIds: ['c'],
    };
    writeCharacterLibraryPreferences(preferences, storage);
    expect(readCharacterLibraryPreferences(storage)).toEqual(preferences);
  });

  it('reconciles new and stale record IDs into the correct tiers', () => {
    expect(
      reconcileCharacterLibraryPreferences(
        {
          version: 1,
          archivedIds: ['c', 'missing'],
          favoriteIds: ['a', 'c', 'missing'],
          favoriteOrderIds: ['a', 'missing'],
          regularOrderIds: [],
          archivedOrderIds: ['missing', 'c'],
        },
        ['a', 'b', 'c'],
      ),
    ).toEqual({
      version: 1,
      archivedIds: ['c'],
      favoriteIds: ['a', 'c'],
      favoriteOrderIds: ['a'],
      regularOrderIds: ['b'],
      archivedOrderIds: ['c'],
    });
  });

  it('removes deleted records from every organization list', () => {
    const result = removeCharacterLibraryPreference(
      {
        version: 1,
        archivedIds: ['a'],
        favoriteIds: ['a'],
        favoriteOrderIds: ['a'],
        regularOrderIds: ['a'],
        archivedOrderIds: ['a'],
      },
      'a',
    );
    expect(Object.values(result).flat()).not.toContain('a');
  });
});
