import { describe, expect, it } from 'vitest';
import {
  allDefinitions,
  keeperMythos,
  occupations,
  skills,
} from '../src/games/call-of-cthulhu2e/catalog';
import {
  createCoc2eInvestigator,
  createCoc2eKeeper,
} from '../src/games/call-of-cthulhu2e/create-character';
import {
  applyImprovement,
  creationBudgets,
  damageBonus,
  derivedValues,
  isImpale,
  parseDiceExpression,
  resistanceTarget,
  rollCharacteristic,
} from '../src/games/call-of-cthulhu2e/rules';
import {
  coc2eInvestigatorSchema,
  coc2eKeeperSchema,
} from '../src/games/call-of-cthulhu2e/schema';

describe('Call of Cthulhu Second Edition module', () => {
  it('has stable cited definitions and keeps Mythos in a separate Keeper catalog', () => {
    expect(new Set(allDefinitions.map((x) => x.id)).size).toBe(
      allDefinitions.length,
    );
    expect(
      allDefinitions.every((x) => x.page > 0 && x.summary && x.verified),
    ).toBe(true);
    expect(occupations.some((x) => x.sourceId === 'coc2e.1920s')).toBe(true);
    expect(skills.find((x) => x.name === 'Cthulhu Mythos')?.summary).toContain(
      'cannot',
    );
    expect(
      keeperMythos.every((x) => x.kind === 'spell' || x.kind === 'tome'),
    ).toBe(true);
  });
  it('creates schema-valid local records with optional sources disabled', () => {
    const investigator = createCoc2eInvestigator(),
      keeper = createCoc2eKeeper();
    expect(coc2eInvestigatorSchema.parse(investigator)).toEqual(investigator);
    expect(coc2eKeeperSchema.parse(keeper)).toEqual(keeper);
    expect(investigator.enabledSources).toEqual(['coc2e.core']);
    expect(keeper.enabledSources).toEqual(['coc2e.core']);
  });
  it('calculates creation rolls, budgets, and derived characteristics', () => {
    let c = createCoc2eInvestigator('manual');
    c = {
      ...c,
      characteristics: {
        str: 12,
        con: 13,
        siz: 14,
        dex: 11,
        app: 10,
        int: 15,
        pow: 9,
        edu: 16,
      },
    };
    expect(rollCharacteristic('str', [3, 4, 5])).toBe(12);
    expect(rollCharacteristic('siz', [4, 5])).toBe(15);
    expect(rollCharacteristic('edu', [4, 5, 6])).toBe(18);
    expect(creationBudgets(c)).toEqual({ occupation: 240, personal: 75 });
    expect(derivedValues(c)).toMatchObject({
      education: 16,
      idea: 75,
      know: 80,
      luck: 45,
      magicPointsMaximum: 9,
      hitPointsMaximum: 14,
      damageBonus: '+1D4',
    });
  });
  it('applies the age education increase to budgets and Know', () => {
    const c = {
      ...createCoc2eInvestigator('manual'),
      age: 45,
      characteristics: {
        str: 10,
        con: 10,
        siz: 10,
        dex: 10,
        app: 10,
        int: 10,
        pow: 10,
        edu: 12,
      },
    };
    expect(derivedValues(c)).toMatchObject({
      educationBonus: 2,
      education: 14,
      know: 70,
    });
    expect(creationBudgets(c).occupation).toBe(210);
  });
  it('handles damage bonus boundaries and resistance rolls', () => {
    expect(damageBonus(12)).toBe('-1D6');
    expect(damageBonus(16)).toBe('-1D4');
    expect(damageBonus(24)).toBe('None');
    expect(damageBonus(32)).toBe('+1D4');
    expect(damageBonus(40)).toBe('+1D6');
    expect(damageBonus(41)).toBe('+2D6');
    expect(resistanceTarget(12, 10)).toBe(60);
    expect(resistanceTarget(1, 30)).toBe(0);
  });
  it('uses classic impale and improvement rules', () => {
    expect(isImpale(10, 50, true)).toBe(true);
    expect(isImpale(11, 50, true)).toBe(false);
    expect(applyImprovement(55, 60, 4)).toEqual({ eligible: true, rating: 59 });
    expect(applyImprovement(55, 40, 6)).toEqual({
      eligible: false,
      rating: 55,
    });
  });
  it('parses fixed and rolled Sanity loss expressions', () => {
    expect(parseDiceExpression('3', () => 1)).toEqual({
      dice: [],
      modifier: 0,
      total: 3,
    });
    expect(parseDiceExpression('2d6+1', () => 4)).toEqual({
      dice: [4, 4],
      modifier: 1,
      total: 9,
    });
    expect(() => parseDiceExpression('bad', () => 1)).toThrow();
  });
});
