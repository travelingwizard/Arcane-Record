import { describe, expect, it } from 'vitest';
import { gameSystemRegistry } from '../../src/games/registry';
import { ModuleRegistry } from '../../src/modules/registry/module-registry';
import { createSyntheticModule } from '../fixtures/synthetic-module';
import {
  buildGameChooserEntries,
  getGameChooserMetadata,
  matchingLabels,
  normalizeGameSearch,
} from '../../src/features/game-chooser/game-chooser-catalog';
import {
  defaultGameChooserPreferences,
  gameChooserPreferenceKey,
  readGameChooserPreferences,
  writeGameChooserPreferences,
} from '../../src/features/game-chooser/game-chooser-preferences';

describe('game chooser catalog', () => {
  it('has curated engine and capability metadata for every top-level entry', () => {
    const topLevelIds = [
      ...gameSystemRegistry.listFamilies().map(({ id }) => id),
      ...gameSystemRegistry
        .list()
        .filter(({ parentSystemId, familyId }) => !parentSystemId && !familyId)
        .map(({ id }) => id),
    ];
    topLevelIds.forEach((id) => {
      expect(getGameChooserMetadata(id), id).toMatchObject({
        engineId: expect.any(String),
        creationSupport: expect.stringMatching(
          /^(builder-and-sheet|builder-only|sheet-only)$/,
        ),
      });
    });
    const entries = buildGameChooserEntries(gameSystemRegistry);
    expect(entries).toHaveLength(topLevelIds.length);
    expect(new Set(entries.map(({ id }) => id)).size).toBe(entries.length);
  });

  it.each([
    ['Solar', 'exalted1e', 'Solar'],
    ['Lunar', 'exalted1e', 'Lunar'],
    ['Ghoul', 'vampire20', 'Ghoul'],
    ['Revenant', 'vampire20', 'Revenant'],
    ['Guardmouse', 'mouse-guard2e', 'Guardmouse'],
    ['Keeper', 'call-of-cthulhu', 'Keeper'],
    ['Seventh Edition', 'call-of-cthulhu', 'Seventh Edition'],
  ])('finds %s through the %s hierarchy', (query, id, match) => {
    const entry = buildGameChooserEntries(gameSystemRegistry).find(
      (candidate) => candidate.id === id,
    );
    expect(entry?.searchText).toContain(normalizeGameSearch(query));
    expect(matchingLabels(entry!, query)).toContain(match);
  });

  it('classifies the requested shared engines', () => {
    const entries = buildGameChooserEntries(gameSystemRegistry);
    const byId = Object.fromEntries(entries.map((entry) => [entry.id, entry]));
    expect(byId.mage20.engine.label).toBe('World of Darkness');
    expect(byId.vampire20.engine.label).toBe('World of Darkness');
    expect(byId['blades-in-the-dark'].engine.label).toBe('Forged in the Dark');
    expect(byId['band-of-blades'].engine.label).toBe('Forged in the Dark');
    expect(byId['burning-wheel'].engine.label).toBe('Burning Wheel');
    expect(byId['mouse-guard2e'].engine.label).toBe('Burning Wheel');
    expect(byId.torchbearer2e.engine.label).toBe('Burning Wheel');
  });

  it('indexes installed declarative modules as local sheet-only entries', () => {
    const modules = new ModuleRegistry().register(createSyntheticModule());
    const moduleEntry = buildGameChooserEntries(
      gameSystemRegistry,
      modules,
    ).find(({ kind }) => kind === 'module');
    expect(moduleEntry).toMatchObject({
      kind: 'module',
      creationSupport: 'sheet-only',
      engine: { label: 'Local Modules' },
    });
    expect(moduleEntry?.searchText).toContain('synthetic');
  });
});

describe('game chooser preferences', () => {
  it('falls back safely when stored data is malformed', () => {
    const storage = { getItem: () => '{broken' };
    expect(readGameChooserPreferences(storage)).toEqual(
      defaultGameChooserPreferences,
    );
  });

  it('round-trips settings and retains unknown hidden IDs', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    writeGameChooserPreferences(
      {
        version: 2,
        sort: 'engine',
        capability: 'builder',
        hiddenIds: ['future-game', 'module:missing:node:sheet'],
        favoriteIds: ['mage20', 'future-game'],
      },
      storage,
    );
    expect(values.has(gameChooserPreferenceKey)).toBe(true);
    expect(readGameChooserPreferences(storage)).toMatchObject({
      sort: 'engine',
      capability: 'builder',
      hiddenIds: ['future-game', 'module:missing:node:sheet'],
      favoriteIds: ['mage20', 'future-game'],
    });
  });

  it('migrates version one preferences with an empty favorite order', () => {
    const storage = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          sort: 'name-asc',
          capability: 'all',
          hiddenIds: ['future-game'],
        }),
    };
    expect(readGameChooserPreferences(storage)).toEqual({
      version: 2,
      sort: 'name-asc',
      capability: 'all',
      hiddenIds: ['future-game'],
      favoriteIds: [],
    });
  });
});
