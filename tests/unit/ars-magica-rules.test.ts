import { describe, expect, it } from 'vitest';
import { resolveDie } from '../../src/games/ars-magica-definitive/dice';
import {
  characteristicCost,
  creationBudgets,
  olderMagusYearBudget,
  startingAbilityCap,
  startingSpellLimit,
} from '../../src/games/ars-magica-definitive/creation-rules';

describe('Definitive creation rules', () => {
  it('uses signed nonlinear Characteristic costs', () => {
    expect([-3, -2, -1, 0, 1, 2, 3].map(characteristicCost)).toEqual([
      -6, -3, -1, 0, 1, 3, 6,
    ]);
    expect(() => characteristicCost(4)).toThrow();
  });
  it('separates life stages and applies Companion-only wealth', () => {
    expect(creationBudgets('magus', 25)).toMatchObject({
      laterLife: 75,
      apprenticeship: 240,
      spellLevels: 120,
      postApprenticeshipYears: 0,
    });
    expect(creationBudgets('grog', 20)).toMatchObject({
      laterLife: 225,
      apprenticeship: 0,
      flawPoints: 3,
    });
    expect(creationBudgets('companion', 20, 10, 'wealthy').laterLife).toBe(300);
    expect(creationBudgets('companion', 20, 10, 'poor').laterLife).toBe(150);
    expect(() => creationBudgets('grog', 20, 10, 'wealthy')).toThrow();
    expect(() => creationBudgets('magus', 20)).toThrow();
  });
  it('uses all age boundaries and the laboratory year reduction', () => {
    expect([29, 30, 35, 36, 40, 41, 45, 46].map(startingAbilityCap)).toEqual([
      5, 6, 6, 7, 7, 8, 8, 9,
    ]);
    expect([0, 1, 2, 3, 4].map(olderMagusYearBudget)).toEqual([
      30, 20, 10, 0, 0,
    ]);
  });
  it('includes requisites in starting spell limits', () => {
    expect(
      startingSpellLimit({
        technique: 10,
        form: 8,
        intelligence: 3,
        magicTheory: 3,
        techniqueRequisites: [4],
      }),
    ).toBe(21);
  });
});

describe('Definitive simple and stress dice', () => {
  it('distinguishes simple zero, initial stress zero and exploding zero', () => {
    expect(resolveDie('simple', [0]).total).toBe(10);
    expect(resolveDie('stress', [0], [], 9).total).toBe(9);
    expect(resolveDie('stress', [1, 0]).total).toBe(20);
    expect(resolveDie('stress', [1, 1, 5], [], 9).total).toBe(29);
  });
  it('caps positive modifiers on botches and preserves negative ones', () => {
    expect(resolveDie('stress', [0], [0, 0, 4], 9)).toMatchObject({
      total: 0,
      botches: 2,
    });
    expect(resolveDie('stress', [0], [0], -3).total).toBe(-3);
  });
  it('rejects incomplete chains, extra dice and impossible botch checks', () => {
    for (const dice of [[], [1], [2, 3], [0, 1], [10]])
      expect(() => resolveDie('stress', dice)).toThrow();
    expect(() => resolveDie('stress', [5], [0])).toThrow();
    expect(() => resolveDie('simple', [1, 5])).toThrow();
  });
});
