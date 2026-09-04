import { describe, it, expect } from 'vitest';
import {
  createCurseCharacter,
  curseCharacterSchema,
} from '../../src/games/curseborne/schema';
import {
  rollCurseDice,
  curseDiceLimit,
  type CurseRollInput,
} from '../../src/games/curseborne/dice';
import {
  purchaseCurseAdvance,
  refundCurseAdvance,
  quoteCurseAdvance,
} from '../../src/games/curseborne/advancement';
import { experienceTotals } from '../../src/games/curseborne/rules';

const input: CurseRollInput = {
  pool: 4,
  held: 2,
  difficulty: 2,
  enhancement: 3,
  stackingEnhancement: 3,
  preRollHits: 0,
  doubleNines: false,
  checkAltered: true,
  context: 'Test',
};
const funded = () => ({
  ...createCurseCharacter(),
  experience: [
    {
      id: crypto.randomUUID(),
      kind: 'award' as const,
      amount: 20,
      date: new Date().toISOString(),
      description: 'Session awards',
    },
  ],
});
describe('Curseborne dice', () => {
  it('replaces ordinary dice and doubles tens without explosions', () => {
    const faces = [10, 8, 9, 1];
    const roll = rollCurseDice(input, () => faces.shift()!);
    expect(roll.dice.map((d) => d.curse)).toEqual([true, true, false, false]);
    expect(roll.rolledHits).toBe(4);
    expect(roll.curseHits).toBe(3);
    expect(roll.appliedEnhancement).toBe(5);
    expect(roll.total).toBe(9);
    expect(roll.remainingHits).toBe(7);
  });
  it('requires a hit for Enhancement but difficulty zero still succeeds', () => {
    const result = rollCurseDice({ ...input, difficulty: 0 }, () => 1);
    expect(result.success).toBe(true);
    expect(result.appliedEnhancement).toBe(0);
    expect(rollCurseDice({ ...input, preRollHits: 1 }, () => 1).total).toBe(6);
  });
  it('supports effect-granted double nines and more held dice than the pool', () => {
    const result = rollCurseDice(
      { ...input, held: 10, doubleNines: true },
      () => 9,
    );
    expect(result.curseHits).toBe(8);
    expect(result.dice).toHaveLength(4);
    expect(() => rollCurseDice(input, () => 11)).toThrow();
  });
  it('does not invent high-Entanglement caps', () => {
    expect([1, 2, 3, 4, 5].map(curseDiceLimit)).toEqual([5, 7, 7, 9, null]);
  });
});
describe('Curseborne confirmed advancement', () => {
  it('prices Attributes at six and Skills at four, updating Traits and ledger together', () => {
    const c = funded();
    const next = purchaseCurseAdvance(
      c,
      { category: 'attribute', id: 'Might' },
      'Session end',
    );
    expect(next.attributes.Might).toBe(2);
    expect(experienceTotals(next.experience)).toEqual({
      total: 20,
      current: 14,
    });
    expect(c.attributes.Might).toBe(1);
    expect(
      quoteCurseAdvance(c, { category: 'skill', id: 'Artistry' }).cost,
    ).toBe(4);
  });
  it('guards funds, unknown targets, Build/Play and rating range', () => {
    expect(() =>
      purchaseCurseAdvance(
        createCurseCharacter(),
        { category: 'skill', id: 'Artistry' },
        'Training',
      ),
    ).toThrow('Insufficient');
    expect(() =>
      quoteCurseAdvance(funded(), { category: 'skill', id: 'Invented' }),
    ).toThrow('Unknown');
    expect(() =>
      purchaseCurseAdvance(
        { ...funded(), mode: 'play' },
        { category: 'skill', id: 'Artistry' },
        'Training',
      ),
    ).toThrow('Build');
    const c = funded();
    c.skills.Artistry = 5;
    expect(() =>
      purchaseCurseAdvance(
        c,
        { category: 'skill', id: 'Artistry' },
        'Training',
      ),
    ).toThrow('five');
  });
  it('refunds exact historical cost once without rewriting history', () => {
    const bought = purchaseCurseAdvance(
      funded(),
      { category: 'attribute', id: 'Might' },
      'Training',
    );
    const id = bought.experience[1]!.id;
    const refunded = refundCurseAdvance(bought, id, 'Correction');
    expect(refunded.attributes.Might).toBe(1);
    expect(refunded.experience[1]).toEqual(bought.experience[1]);
    expect(experienceTotals(refunded.experience)).toEqual({
      total: 20,
      current: 20,
    });
    expect(() => refundCurseAdvance(refunded, id, 'Again')).toThrow('already');
    bought.attributes.Might = 3;
    expect(() => refundCurseAdvance(bought, id, 'Correction')).toThrow(
      'changed',
    );
  });
  it('preserves legacy purchases and defaults empty roll history', () => {
    const old = funded();
    old.experience.push({
      id: crypto.randomUUID(),
      kind: 'award',
      amount: 1,
      date: '',
      description: 'Legacy',
    });
    const raw = { ...old, rolls: undefined };
    expect(curseCharacterSchema.parse(raw).rolls).toEqual([]);
    expect(curseCharacterSchema.parse(JSON.parse(JSON.stringify(old)))).toEqual(
      old,
    );
  });
});
