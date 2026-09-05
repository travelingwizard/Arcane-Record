import { describe, expect, it } from 'vitest';
import {
  createCurseCharacter,
  migrateCurseCharacter,
} from '../../src/games/curseborne/schema';
import {
  createCityCharacter,
  migrateCityCharacter,
} from '../../src/games/city-of-mist/schema';
import {
  bleedCurseDice,
  resetCurseScene,
  resetCurseStory,
  advanceEntanglement,
} from '../../src/games/curseborne/resources';
import { cityMoves } from '../../src/games/city-of-mist/moves';

describe('new-sheet legacy migration', () => {
  it('retains old EXP amounts, notes and ratings without inventing history', () => {
    const old = {
      ...createCurseCharacter(),
      schemaVersion: 1,
      rolls: undefined,
      resourceHistory: undefined,
      notes: 'Keep this',
      experience: [
        {
          id: crypto.randomUUID(),
          kind: 'purchase',
          amount: -5,
          date: '2026-01-01',
          description: 'Historical price',
        },
      ],
    };
    const migrated = migrateCurseCharacter(old, 1);
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.notes).toBe(old.notes);
    expect(migrated.experience).toEqual(old.experience);
    expect(migrated.resourceHistory).toEqual([]);
    expect(() => migrateCurseCharacter(old, 5)).toThrow();
  });
  it('creates structured Curseborne views without deleting legacy records', () => {
    const base = createCurseCharacter();
    const legacyId = crypto.randomUUID();
    const old = {
      ...base,
      schemaVersion: 3,
      aspirationRecords: undefined,
      edges: undefined,
      contacts: undefined,
      bonds: undefined,
      gear: undefined,
      spells: undefined,
      entries: [
        {
          id: legacyId,
          definitionId: null,
          sourceId: null,
          kind: 'equipment' as const,
          name: 'Old satchel',
          rating: 2,
          notes: 'Do not parse this: sharp, hidden',
          source: 'Legacy file',
          page: 12,
          active: true,
        },
      ],
      layout: {
        build: ['identity', 'entries', 'records'],
        play: ['entries', 'health'],
      },
    };
    const migrated = migrateCurseCharacter(old, 3);
    expect(migrated.entries).toEqual(old.entries);
    expect(migrated.gear[0]).toMatchObject({
      name: 'Old satchel',
      legacyEntryId: legacyId,
      tags: [],
      state: 'equipped',
      notes: old.entries[0].notes,
    });
    expect(migrated.layout.build).toEqual([
      'identity',
      'connections',
      'gear',
      'spells',
      'records',
    ]);
  });
  it('preserves City free text and linked crew IDs without inferring structured play', () => {
    const old = {
      ...createCityCharacter(),
      schemaVersion: 1,
      playRecords: undefined,
      crew: { kind: 'linked', crewId: 'existing-crew' },
    };
    old.playState.clues = 'Three clues, maybe expired';
    const migrated = migrateCityCharacter(old, 1);
    expect(migrated.playState.clues).toBe(old.playState.clues);
    expect(migrated.crew).toEqual(old.crew);
    expect(migrated.playRecords.batches).toEqual([]);
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.player).toBe('');
    expect(migrated.layout.build).toContain('story');
    expect(migrated.layout.build).toContain('development');
    expect(migrated.development.claimedMoments).toEqual([]);
    expect(() => migrateCityCharacter(old, 5)).toThrow();
  });
});
describe('explicit Curseborne resource actions', () => {
  it('bleeds chosen counters without changing unrelated state', () => {
    const c = {
      ...createCurseCharacter(),
      curseDice: 4,
      temporaryCurseDice: 2,
      injuries: 3,
      notes: 'Keep',
    };
    const next = bleedCurseDice(c, 1, 2, 'Spell after roll');
    expect(next.curseDice).toBe(3);
    expect(next.temporaryCurseDice).toBe(0);
    expect(next.injuries).toBe(3);
    expect(next.notes).toBe('Keep');
    expect(next.resourceHistory).toHaveLength(1);
    expect(() => bleedCurseDice(c, 5, 0, 'Spell')).toThrow();
  });
  it('clears all held dice only for the unbled risky option at scene end', () => {
    const c = {
      ...createCurseCharacter(),
      curseDice: 4,
      temporaryCurseDice: 2,
    };
    expect(resetCurseScene(c).curseDice).toBe(4);
    expect(resetCurseScene({ ...c, temporaryDiceRisk: true }).curseDice).toBe(
      0,
    );
    expect(
      resetCurseScene({ ...c, temporaryDiceRisk: true, temporaryCurseDice: 0 })
        .curseDice,
    ).toBe(4);
    expect(resetCurseStory(c).curseDice).toBe(1);
    expect(resetCurseStory(c).temporaryCurseDice).toBe(0);
  });
  it('requires story agreement and never spends EXP for Entanglement', () => {
    const c = createCurseCharacter();
    expect(() => advanceEntanglement(c, 'Story', false)).toThrow();
    const next = advanceEntanglement(
      c,
      'Completed the story; crew agrees',
      true,
    );
    expect(next.entanglement).toBe(2);
    expect(next.experience).toEqual(c.experience);
    expect(() =>
      advanceEntanglement({ ...c, mode: 'play' }, 'Story', true),
    ).toThrow();
  });
});
it('has unique current move references with source pages and outcomes', () => {
  expect(cityMoves).toHaveLength(15);
  expect(new Set(cityMoves.map((m) => m.id)).size).toBe(15);
  expect(
    cityMoves.every(
      (m) => m.page >= 1 && m.page <= 2 && m.summary && m.options.length,
    ),
  ).toBe(true);
});
