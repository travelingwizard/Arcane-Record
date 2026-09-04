import { describe, expect, it } from 'vitest';
import {
  curseborneSources,
  experienceCosts,
  experienceTotals,
  higherStartBenefits,
  injuryLevels,
  ruleClarifications,
} from '../src/games/curseborne/rules';

describe('Curseborne foundation', () => {
  it('keeps the core required and the adventure source optional', () => {
    expect(curseborneSources.map((source) => source.required)).toEqual([
      true,
      false,
    ]);
  });
  it('uses the detailed four-level injury track', () => {
    expect(injuryLevels.map((level) => level.boxes)).toEqual([2, 2, 2, 1]);
    expect(injuryLevels.reduce((sum, level) => sum + level.boxes, 0)).toBe(7);
  });
  it('records stable, source-cited clarifications', () => {
    expect(new Set(ruleClarifications.map((rule) => rule.id)).size).toBe(3);
    expect(ruleClarifications.every((rule) => rule.page > 0)).toBe(true);
  });
  it('does not stack higher-start packages or silently approve ambiguous Edges', () => {
    expect(higherStartBenefits(1).spells).toBe(0);
    expect(higherStartBenefits(2).requiresEdgeRuling).toBe(false);
    expect(higherStartBenefits(3).requiresEdgeRuling).toBe(true);
    expect(higherStartBenefits(4)).toEqual({
      skillDots: 9,
      attributeDots: 3,
      proposedEdgeDots: 1,
      spells: 6,
      requiredLineageSpells: 3,
      requiresEdgeRuling: true,
    });
    for (const invalid of [0, 5, 1.5, NaN])
      expect(() => higherStartBenefits(invalid)).toThrow();
  });
  it('keeps Entanglement out of EXP prices', () => {
    expect(experienceCosts).toEqual({
      skill: 4,
      attribute: 6,
      contact: 3,
      edge: 4,
      motif: 5,
      accessibleSpell: 5,
      sharedSpell: 6,
      spellAdvance: 5,
    });
  });
  it('does not count refunds or balance corrections as earned EXP', () => {
    expect(
      experienceTotals([
        { id: '1', kind: 'award', amount: 10 },
        { id: '2', kind: 'purchase', amount: -4 },
        { id: '3', kind: 'refund', amount: 4 },
        { id: '4', kind: 'adjustment', amount: -1 },
      ]),
    ).toEqual({ current: 9, total: 10 });
    expect(() =>
      experienceTotals([{ id: 'bad', kind: 'purchase', amount: 4 }]),
    ).toThrow();
  });
});
