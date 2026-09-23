import { describe, expect, it } from 'vitest';
import {
  castingScore,
  formulaicResult,
  penetrationTotal,
  ritualResult,
  spontaneousResult,
  validateVisUse,
} from '../../src/games/ars-magica-definitive/magic';

describe('Ars Magica casting arithmetic', () => {
  it('calculates the casting score and two-points-per-pawn boost', () => {
    expect(
      castingScore({
        technique: 8,
        form: 5,
        stamina: 2,
        encumbrance: 1,
        aura: 3,
        voice: 0,
        gestures: 0,
        visBoostPawns: 2,
      }),
    ).toBe(21);
  });
  it.each([
    [20, true, 0],
    [19, true, 1],
    [10, true, 1],
    [9, false, 1],
  ])('resolves formulaic total %s', (total, cast, fatigueLost) => {
    expect(formulaicResult(total, 0, 20)).toMatchObject({
      total,
      cast,
      fatigueLost,
    });
  });
  it('resolves ritual bands, wounds, time-independent vis and penetration', () => {
    expect(
      ritualResult({
        score: 12,
        artesLiberales: 2,
        philosophiae: 1,
        die: 3,
        level: 30,
        availableFatigue: 2,
      }),
    ).toMatchObject({
      total: 18,
      cast: false,
      fatigueLost: 4,
      wound: 'medium',
      visRequired: 6,
    });
    expect(penetrationTotal(28, 5, 20)).toBe(13);
  });
  it('rounds spontaneous totals down', () => {
    expect(spontaneousResult(10, 5, true)).toBe(7);
    expect(spontaneousResult(14, 99, false)).toBe(2);
    expect(spontaneousResult(-3, 0, false)).toBe(-1);
  });
  it('enforces separate Art limits and ritual requirements', () => {
    expect(
      validateVisUse({
        techniqueScore: 5,
        formScore: 3,
        techniquePawns: 5,
        formPawns: 3,
        ritualRequired: 6,
      }),
    ).toEqual({ total: 8, additionalBotchDice: 8 });
    expect(() =>
      validateVisUse({
        techniqueScore: 5,
        formScore: 3,
        techniquePawns: 6,
        formPawns: 0,
      }),
    ).toThrow();
    expect(() =>
      validateVisUse({
        techniqueScore: 5,
        formScore: 3,
        techniquePawns: 2,
        formPawns: 2,
        ritualRequired: 6,
      }),
    ).toThrow();
  });
});
