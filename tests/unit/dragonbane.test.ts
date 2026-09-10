import { describe, expect, it } from 'vitest';
import {
  dragonbaneKin,
  dragonbaneProfessions,
  dragonbaneSkills,
} from '../../src/games/dragonbane/catalog';
import { createDragonbaneCharacter } from '../../src/games/dragonbane/create-character';
import {
  baseChance,
  creationIssues,
  damageBonus,
  derived,
  rollD20,
  trainedSkillCount,
} from '../../src/games/dragonbane/rules';
import { dragonbaneCharacterSchema } from '../../src/games/dragonbane/schema';
import { gameSystemRegistry } from '../../src/games/registry';

describe('Dragonbane module', () => {
  it('registers the character-only entry actions', () => {
    const system = gameSystemRegistry.get('dragonbane');
    expect(system?.creationActions?.map((x) => x.id)).toEqual([
      'build',
      'blank',
    ]);
  });

  it('contains the complete core kin, profession, and Skill inventories', () => {
    expect(dragonbaneKin).toHaveLength(6);
    expect(dragonbaneProfessions).toHaveLength(10);
    expect(dragonbaneSkills).toHaveLength(30);
    const all = [
      ...dragonbaneKin,
      ...dragonbaneProfessions,
      ...dragonbaneSkills,
    ];
    expect(new Set(all.map((x) => x.id)).size).toBe(all.length);
    expect(
      all.every((x) => x.sourceId === 'dragonbane.core' && x.page > 0),
    ).toBe(true);
  });

  it('implements base chances, damage bonuses, and age Skill counts', () => {
    expect([1, 5, 6, 8, 9, 12, 13, 15, 16, 18].map(baseChance)).toEqual([
      3, 3, 4, 4, 5, 5, 6, 6, 7, 7,
    ]);
    expect([damageBonus(12), damageBonus(13), damageBonus(17)]).toEqual([
      '—',
      'D4',
      'D6',
    ]);
    expect([
      trainedSkillCount('young'),
      trainedSkillCount('adult'),
      trainedSkillCount('old'),
    ]).toEqual([8, 10, 12]);
  });

  it('calculates movement, HP, WP, and encumbrance', () => {
    const c = createDragonbaneCharacter('manual');
    c.kinId = dragonbaneKin.find((x) => x.name === 'Wolfkin')!.id;
    c.attributes = { str: 13, con: 11, agl: 16, int: 10, wil: 12, cha: 9 };
    const result = derived(c);
    expect(result).toMatchObject({
      movement: 16,
      hp: 11,
      wp: 12,
      encumbrance: 7,
    });
  });

  it('selects the best boon die, worst bane die, dragons, and demons', () => {
    expect(rollD20(10, 1, 0, [14, 6]).outcome).toBe('success');
    expect(rollD20(10, 0, 1, [6, 14]).outcome).toBe('failure');
    expect(rollD20(10, 0, 0, [1])).toMatchObject({ outcome: 'dragon' });
    expect(rollD20(18, 0, 0, [20])).toMatchObject({ outcome: 'demon' });
  });

  it('validates new manual records without inventing creation history', () => {
    const c = createDragonbaneCharacter('manual');
    expect(c.creation.attributeRolls).toEqual([]);
    expect(c.creation.baseline).toBeNull();
    expect(dragonbaneCharacterSchema.parse(c)).toEqual(c);
    expect(creationIssues(c)).toContain('Choose a Kin.');
  });
});
