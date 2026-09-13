import { describe, expect, it } from 'vitest';
import { createArsCharacter } from '../../src/games/ars-magica-definitive/create-character';
import {
  arsCharacterSchema,
  migrateArsCharacter,
} from '../../src/games/ars-magica-definitive/schema';
import { previewExposure } from '../../src/games/ars-magica-definitive/seasons';

function fixture() {
  const c = createArsCharacter();
  c.definition.traits = [];
  c.definition.traits.push(
    ...['Magic Theory', 'Creo'].map((name, i) => ({
      id: crypto.randomUUID(),
      definitionId: null,
      name,
      status: 'custom' as const,
      citation: null,
      notes: 'Retain this',
      scale: i ? ('art' as const) : ('ability' as const),
      experience: 0,
      specialty: '',
    })),
  );
  c.play.wounds.push({
    id: crypto.randomUUID(),
    severity: 'heavy',
    notes: 'Existing wound',
  });
  c.notes = 'Keep personal notes';
  return c;
}
describe('Ars Magica records and Exposure', () => {
  it('creates manual records for each role without fictional history', () => {
    for (const role of ['magus', 'companion', 'grog'] as const) {
      const c = createArsCharacter(role);
      expect(c.creation.baseline).toBeNull();
      expect(c.seasons).toEqual([]);
      expect(c.play.confidencePoints).toBe(role === 'grog' ? 0 : 3);
      expect(arsCharacterSchema.parse(JSON.parse(JSON.stringify(c)))).toEqual(
        c,
      );
    }
  });
  it('preserves unknown definition IDs and refuses unsupported versions', () => {
    const c = fixture();
    c.definition.traits[0].definitionId = 'future.unknown';
    c.definition.traits[0].status = 'unresolved';
    expect(migrateArsCharacter(c, 1)).toEqual(c);
    expect(() => migrateArsCharacter(c, 2)).toThrow('Unsupported');
    expect(() =>
      arsCharacterSchema.parse({ ...c, schemaVersion: 2 }),
    ).toThrow();
  });
  it('adds sheet-reference fields to older schema-one records without guessing values', () => {
    const legacy = JSON.parse(JSON.stringify(createArsCharacter())) as Record<
      string,
      unknown
    >;
    const definition = legacy.definition as Record<string, unknown>;
    const play = legacy.play as Record<string, unknown>;
    delete definition.reputations;
    delete definition.hermeticIdentity;
    delete definition.birthName;
    delete definition.currentYear;
    delete play.armor;
    delete play.weapons;
    delete play.rawVis;
    delete play.familiar;
    const migrated = migrateArsCharacter(legacy, 1);
    expect(migrated.definition.currentYear).toBe(1220);
    expect(migrated.definition.birthName).toBe('');
    expect(migrated.definition.reputations).toEqual([]);
    expect(migrated.play.weapons).toEqual([]);
    expect(migrated.play.rawVis).toEqual([]);
    expect(migrated.play.familiar.name).toBe('');
  });
  it('previews split Exposure without mutating resources or the original', () => {
    const c = fixture();
    const request = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      date: { year: 1220, season: 'spring' as const },
      traitIds: c.definition.traits.map((t) => t.id),
      explanation: 'Laboratory work throughout the season',
    };
    const result = previewExposure(c, request);
    expect(c.definition.traits[0].experience).toBe(0);
    expect(result.character.definition.traits.map((t) => t.experience)).toEqual(
      [1, 1],
    );
    expect(result.character.play).toEqual(c.play);
    expect(result.character.notes).toBe(c.notes);
    expect(() =>
      previewExposure(result.character, {
        ...request,
        id: crypto.randomUUID(),
      }),
    ).toThrow('already');
    expect(() =>
      previewExposure(result.character, {
        ...request,
        date: { year: 1221, season: 'spring' },
      }),
    ).toThrow('already');
  });
  it('rejects duplicate, absent, and empty targets', () => {
    const c = fixture();
    const request = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      date: { year: 1220, season: 'spring' as const },
      explanation: 'Work',
    };
    for (const traitIds of [
      [],
      ['missing'],
      [c.definition.traits[0].id, c.definition.traits[0].id],
    ])
      expect(() => previewExposure(c, { ...request, traitIds })).toThrow();
  });
});
