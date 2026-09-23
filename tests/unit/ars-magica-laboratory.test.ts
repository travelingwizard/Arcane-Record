import { describe, expect, it } from 'vitest';
import {
  advancementPipeline,
  teachingQuality,
  trainingQuality,
  visStudyCost,
} from '../../src/games/ars-magica-definitive/advancement';
import {
  covenantBuildPointCost,
  extractionPawns,
  laboratoryTotal,
  longevityBonus,
  projectProgress,
} from '../../src/games/ars-magica-definitive/laboratory';

describe('laboratory and Covenant arithmetic', () => {
  it('uses the lowest requisite and tracks project progress', () => {
    expect(
      laboratoryTotal({
        technique: 10,
        form: 8,
        intelligence: 3,
        magicTheory: 4,
        aura: 3,
        laboratory: 1,
        assistants: 2,
        specialization: 1,
        requisites: [5],
      }),
    ).toBe(19);
    expect(
      projectProgress({
        labTotal: 30,
        effectLevel: 20,
        current: 12,
        kind: 'invent-spell',
      }),
    ).toEqual({ gained: 10, after: 22, required: 20, complete: true });
    expect(extractionPawns(29)).toBe(2);
    expect(longevityBonus(34)).toBe(6);
  });
  it('prices every supported Covenant resource and checks book limits', () => {
    expect(
      covenantBuildPointCost({ kind: 'art-summa', level: 15, quality: 12 }),
    ).toBe(27);
    expect(
      covenantBuildPointCost({ kind: 'ability-summa', level: 5, quality: 15 }),
    ).toBe(30);
    expect(covenantBuildPointCost({ kind: 'tractatus', quality: 11 })).toBe(11);
    expect(covenantBuildPointCost({ kind: 'lab-text', levels: 21 })).toBe(5);
    expect(covenantBuildPointCost({ kind: 'casting-tablet', levels: 21 })).toBe(
      10,
    );
    expect(
      covenantBuildPointCost({ kind: 'vis-income', pawnsPerYear: 3 }),
    ).toBe(15);
    expect(covenantBuildPointCost({ kind: 'vis-stock', pawns: 11 })).toBe(3);
    expect(
      covenantBuildPointCost({ kind: 'enchanted-item', effectLevels: 21 }),
    ).toBe(10);
    expect(() =>
      covenantBuildPointCost({ kind: 'art-summa', level: 20, quality: 12 }),
    ).toThrow();
  });
});
describe('seasonal advancement stages', () => {
  it('keeps source and advancement modifiers in separate stages', () => {
    expect(
      advancementPipeline({
        sourceQuality: 10,
        sourceModifiers: [2],
        advancementModifiers: [6],
      }),
    ).toEqual({ sourceQuality: 10, advancementTotal: 12, awarded: 18 });
  });
  it('calculates teaching, training and vis requirements', () => {
    expect(
      teachingQuality({
        communication: 2,
        teaching: 3,
        students: 1,
        goodTeacher: 5,
      }),
    ).toBe(19);
    expect(trainingQuality(5)).toBe(8);
    expect([0, 1, 5, 6, 10, 11].map(visStudyCost)).toEqual([1, 1, 1, 2, 2, 3]);
  });
});
