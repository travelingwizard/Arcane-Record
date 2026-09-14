import { describe, expect, it } from 'vitest';
import { backgrounds } from '../../src/games/dogs-in-the-vineyard/catalog';
import {
  createDitvCharacter,
  createDitvTown,
} from '../../src/games/dogs-in-the-vineyard/create-character';
import {
  addDice,
  arenaStats,
  classifySee,
  creationIssues,
  falloutSummary,
  generateProtoBatch,
  singleSize,
} from '../../src/games/dogs-in-the-vineyard/rules';
import {
  ditvCharacterSchema,
  ditvTownSchema,
} from '../../src/games/dogs-in-the-vineyard/schema';

describe('Dogs in the Vineyard rules', () => {
  it('contains the five exact background allocations', () => {
    expect(backgrounds).toHaveLength(5);
    expect(backgrounds.map((x) => x.statD6)).toEqual([17, 13, 15, 13, 15]);
    expect(backgrounds[0]?.traits).toEqual({ d4: 1, d6: 4, d8: 2, d10: 0 });
    expect(backgrounds[4]?.relationships).toEqual({
      d4: 4,
      d6: 2,
      d8: 2,
      d10: 2,
    });
    expect(new Set(backgrounds.map((x) => x.id)).size).toBe(5);
  });

  it('uses the published arena Stat pairs and See classifications', () => {
    expect(arenaStats.talking).toEqual(['acuity', 'heart']);
    expect(arenaStats.physical).toEqual(['body', 'heart']);
    expect(arenaStats.fighting).toEqual(['body', 'will']);
    expect(arenaStats.gunfighting).toEqual(['acuity', 'will']);
    expect(classifySee(1)).toBe('reverse');
    expect(classifySee(2)).toBe('block-or-dodge');
    expect(classifySee(3)).toBe('take-the-blow');
  });

  it('classifies Fallout thresholds and experience independently', () => {
    expect(falloutSummary([4, 3])).toMatchObject({
      sum: 7,
      shortTerm: true,
      experienceEligible: false,
    });
    expect(falloutSummary([4, 4, 1])).toMatchObject({
      sum: 8,
      lasting: true,
      experienceEligible: true,
    });
    expect(falloutSummary([6, 6])).toMatchObject({
      injured: true,
      badlyInjured: false,
    });
    expect(falloutSummary([8, 8])).toMatchObject({
      badlyInjured: true,
      dead: false,
    });
    expect(falloutSummary([10, 10])).toMatchObject({ dead: true });
  });

  it('validates single-size records and creation allocations', () => {
    expect(singleSize({ d4: 0, d6: 2, d8: 0, d10: 0 })).toBe(true);
    expect(singleSize({ d4: 1, d6: 1, d8: 0, d10: 0 })).toBe(false);
    const c = createDitvCharacter();
    expect(creationIssues(c)).toContain('Record the Dog’s name.');
    c.creation.status = 'manual';
    expect(creationIssues(c)).toEqual([]);
  });

  it('generates six structured proto-NPCs and shared Free Dice', () => {
    const values = [0, 0.11, 0.22, 0.33, 0.44, 0.55, 0.66, 0.77, 0.88, 0.99];
    let index = 0;
    const batch = generateProtoBatch(() => values[index++ % values.length]!);
    expect(batch.npcs).toHaveLength(6);
    expect(batch.npcs.every((x) => x.status === 'proto')).toBe(true);
    expect(
      batch.npcs.every((x) => x.relationships.some((r) => r.name === 'Blood')),
    ).toBe(true);
    expect(
      Object.values(batch.freeDice).reduce((a, b) => a + b, 0),
    ).toBeGreaterThan(0);
  });

  it('round-trips fresh character and Town schemas', () => {
    expect(ditvCharacterSchema.parse(createDitvCharacter())).toBeTruthy();
    expect(ditvTownSchema.parse(createDitvTown())).toBeTruthy();
    expect(
      addDice({ d4: 1, d6: 0, d8: 0, d10: 0 }, { d4: 0, d6: 2, d8: 0, d10: 0 }),
    ).toEqual({ d4: 1, d6: 2, d8: 0, d10: 0 });
  });
});
