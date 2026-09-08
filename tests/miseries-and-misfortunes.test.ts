import { describe, expect, it } from 'vitest';
import {
  abilities,
  coreSkills,
  lifepaths,
} from '../src/games/miseries-and-misfortunes/catalog';
import {
  createMmCampaign,
  createMmCharacter,
} from '../src/games/miseries-and-misfortunes/create-character';
import {
  abilityModifier,
  skillStep,
} from '../src/games/miseries-and-misfortunes/rules';
import {
  mmCampaignSchema,
  mmCharacterSchema,
} from '../src/games/miseries-and-misfortunes/schema';
describe('Miseries & Misfortunes', () => {
  it('provides stable core catalogs', () => {
    expect(abilities).toHaveLength(6);
    expect(coreSkills).toHaveLength(8);
    expect(lifepaths).toHaveLength(13);
    expect(
      new Set([...abilities, ...coreSkills, ...lifepaths].map((x) => x.id))
        .size,
    ).toBe(27);
  });
  it('creates valid protagonist and campaign records', () => {
    expect(
      mmCharacterSchema.parse(createMmCharacter()).creation.startingLevel,
    ).toBe(3);
    expect(mmCampaignSchema.parse(createMmCampaign()).year).toBe(1648);
  });
  it('uses published ability modifier bands', () => {
    expect([3, 6, 9, 13, 16, 18].map(abilityModifier)).toEqual([
      -2, 0, 1, 2, 3, 4,
    ]);
  });
  it('advances rated skills across die steps', () => {
    expect(skillStep({ numerator: 5, die: '6' }, 1)).toEqual({
      numerator: 7,
      die: '8',
    });
    expect(skillStep({ numerator: 19, die: '20' }, 1)).toEqual({
      numerator: 19,
      die: '20',
    });
  });
});
