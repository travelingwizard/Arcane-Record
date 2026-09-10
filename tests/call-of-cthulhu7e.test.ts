import { describe, expect, it } from 'vitest';
import {
  coc7eCatalogManifest,
  coc7eOccupations,
  coc7eSkills,
} from '../src/games/call-of-cthulhu7e/catalog';
import { createCoc7eInvestigator } from '../src/games/call-of-cthulhu7e/create-character';
import {
  ageRequirements,
  damageBuild,
  derived,
  half,
  fifth,
  occupationBudget,
  percentileLevel,
  selectPercentile,
} from '../src/games/call-of-cthulhu7e/rules';
import { coc7eInvestigatorSchema } from '../src/games/call-of-cthulhu7e/schema';
import { gameSystemRegistry } from '../src/games/registry';

describe('Call of Cthulhu Seventh Edition', () => {
  it('registers an edition family without changing Second Edition IDs', () => {
    expect(gameSystemRegistry.getFamily('call-of-cthulhu')?.name).toBe(
      'Call of Cthulhu',
    );
    expect(gameSystemRegistry.get('call-of-cthulhu-2e')?.familyId).toBe(
      'call-of-cthulhu',
    );
    expect(
      gameSystemRegistry.get('call-of-cthulhu-7e')?.unavailableSheetChoices?.[0]
        ?.name,
    ).toBe('Keeper workspace');
    expect(
      gameSystemRegistry.get('call-of-cthulhu-2e-keeper')?.parentSystemId,
    ).toBe('call-of-cthulhu-2e');
  });
  it('has unique, cited player catalog entries', () => {
    const ids = [...coc7eOccupations, ...coc7eSkills].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(coc7eCatalogManifest.occupations).toBeGreaterThan(20);
    expect(
      coc7eOccupations.every((x) => x.page > 0 && x.sourceId && x.verified),
    ).toBe(true);
    expect(coc7eSkills.every((x) => x.page > 0 && x.base >= 0)).toBe(true);
  });
  it('creates strict standard, Quick-Fire, and manual records', () => {
    expect(
      coc7eInvestigatorSchema.parse(createCoc7eInvestigator()),
    ).toBeTruthy();
    const quick = createCoc7eInvestigator('draft', 'quick-fire');
    expect(Object.values(quick.characteristics).sort((a, b) => a - b)).toEqual([
      40, 50, 50, 50, 60, 60, 70, 80,
    ]);
    expect(createCoc7eInvestigator('manual', 'custom').creation.status).toBe(
      'manual',
    );
  });
  it('calculates derived values and occupation budgets from full percentages', () => {
    const c = {
      ...createCoc7eInvestigator('manual'),
      age: 45,
      characteristics: {
        str: 60,
        con: 50,
        dex: 70,
        app: 55,
        pow: 65,
        siz: 60,
        int: 75,
        edu: 80,
      },
    };
    expect(half(65)).toBe(32);
    expect(fifth(65)).toBe(13);
    expect(occupationBudget(c, 'edu2-dex2')).toBe(300);
    expect(derived(c)).toMatchObject({
      hp: 11,
      mp: 13,
      san: 65,
      mov: 7,
      damageBonus: 'None',
      build: 0,
    });
    expect(damageBuild(100, 105)).toEqual({ damageBonus: '+1d6', build: 2 });
  });
  it('applies every age band boundary', () => {
    expect(ageRequirements(17)).toMatchObject({
      physical: 5,
      edu: 5,
      luckTwice: true,
    });
    expect(ageRequirements(25).eduChecks).toBe(1);
    expect(ageRequirements(45)).toMatchObject({
      physical: 5,
      app: 5,
      mov: 1,
      eduChecks: 2,
    });
    expect(ageRequirements(85)).toMatchObject({
      physical: 80,
      app: 25,
      mov: 5,
      eduChecks: 4,
    });
  });
  it('resolves 7E percentile levels and bonus/penalty tens', () => {
    expect(percentileLevel(1, 50)).toBe('critical');
    expect(percentileLevel(10, 50)).toBe('extreme');
    expect(percentileLevel(25, 50)).toBe('hard');
    expect(percentileLevel(50, 50)).toBe('regular');
    expect(percentileLevel(96, 49)).toBe('fumble');
    expect(percentileLevel(96, 50)).toBe('failure');
    expect(selectPercentile(7, [8, 2], 1)).toBe(27);
    expect(selectPercentile(7, [8, 2], -1)).toBe(87);
  });
});
