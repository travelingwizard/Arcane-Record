import { describe, expect, it } from 'vitest';
import { createArsCharacter } from '../../src/games/ars-magica-definitive/create-character';
import { validateCharacter } from '../../src/games/ars-magica-definitive/validation';

const setScore = (
  c: ReturnType<typeof createArsCharacter>,
  definitionId: string,
  xp: number,
) => {
  c.definition.traits.find((x) => x.definitionId === definitionId)!.experience =
    xp;
};
describe('Ars Magica creator validation', () => {
  it('distinguishes required Hermetic minimums from recommendations', () => {
    const c = createArsCharacter('magus', 'draft');
    c.definition.name = 'Maga';
    c.definition.houseId = 'ars.house.bonisagus';
    setScore(c, 'ars.ability.latin', 5);
    setScore(c, 'ars.ability.magic-theory', 5);
    setScore(c, 'ars.ability.parma-magica', 5);
    const issues = validateCharacter(c);
    expect(issues.filter((x) => x.kind === 'error')).toEqual([]);
    expect(
      issues.some((x) => x.id === 'magus.recommended' && x.kind === 'guidance'),
    ).toBe(true);
  });
  it('enforces budgets, roles, age caps, and specific approvals', () => {
    const c = createArsCharacter('grog', 'draft');
    c.definition.name = 'Grog';
    c.definition.virtuesFlaws.push({
      id: crypto.randomUUID(),
      definitionId: null,
      name: 'Major',
      status: 'custom',
      citation: null,
      notes: '',
      kind: 'flaw',
      points: 3,
      choice: '',
    });
    expect(validateCharacter(c).some((x) => x.id === 'grog.major')).toBe(true);
    c.creation.approvals.push({
      id: crypto.randomUUID(),
      ruleId: 'grog.major',
      reason: 'Troupe exception',
      approvedBy: 'Storyguide',
      at: new Date().toISOString(),
    });
    expect(validateCharacter(c).some((x) => x.id === 'grog.major')).toBe(false);
  });
});
