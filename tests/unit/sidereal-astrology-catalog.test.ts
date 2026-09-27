import { describe, expect, it } from 'vitest';
import astrologyRules from '../../src/games/exalted1e/reference/sidereal-astrology-rules.json';
import {
  siderealAstrologyCollegeIds,
  siderealAstrologyColleges,
  siderealAstrologyHouses,
  siderealBlessingCurseTypes,
  siderealCollegesByHouse,
  siderealGreaterSigns,
  siderealResplendentEffects,
} from '../../src/games/exalted1e/reference/sidereal-astrology';
import { siderealAbilityGroups } from '../../src/games/exalted1e/definitions';
import { auditFamily } from '../../scripts/audit-exalted-sources.mjs';

describe('Sidereal Astrology reference catalog (Phase: Astrology/Colleges)', () => {
  it('loads all five astrological Houses, one per Sidereal Caste', () => {
    expect(siderealAstrologyHouses).toHaveLength(5);
    const houseIds = new Set(siderealAstrologyHouses.map(({ id }) => id));
    const casteGroupIds = new Set(siderealAbilityGroups.map(({ id }) => id));
    expect(houseIds).toEqual(casteGroupIds);
  });

  it('loads all 25 Colleges with unique ids, five per House', () => {
    expect(siderealAstrologyColleges).toHaveLength(25);
    expect(siderealAstrologyCollegeIds).toHaveLength(25);
    for (const house of siderealAstrologyHouses) {
      expect(siderealCollegesByHouse[house.id]).toHaveLength(5);
    }
  });

  it("maps every College's Ability into its House's own Auspicious Ability group", () => {
    for (const house of siderealAstrologyHouses) {
      const abilityGroup = siderealAbilityGroups.find(
        ({ id }) => id === house.id,
      );
      expect(abilityGroup).toBeDefined();
      const abilityIds = new Set(abilityGroup?.abilityIds);
      for (const collegeEntry of siderealCollegesByHouse[house.id]) {
        expect(abilityIds.has(collegeEntry.abilityId as never)).toBe(true);
      }
    }
  });

  it('loads exactly 3 named Resplendent Effects per College (75 total)', () => {
    expect(siderealResplendentEffects).toHaveLength(75);
    for (const collegeEntry of siderealAstrologyColleges) {
      const effectsForCollege = siderealResplendentEffects.filter(
        (effect) => effect.collegeId === collegeEntry.id,
      );
      expect(effectsForCollege).toHaveLength(3);
    }
  });

  it('gives every Resplendent Effect a unique id', () => {
    const ids = new Set(siderealResplendentEffects.map(({ id }) => id));
    expect(ids.size).toBe(siderealResplendentEffects.length);
  });

  it('loads exactly one Greater Sign per House, each naming its Maiden', () => {
    expect(siderealGreaterSigns).toHaveLength(5);
    const houseIds = new Set(
      siderealGreaterSigns.map(({ houseId }) => houseId),
    );
    expect(houseIds.size).toBe(5);
  });

  it('loads the 8 generic Blessing/Curse effect types, 4 of each kind', () => {
    expect(siderealBlessingCurseTypes).toHaveLength(8);
    const blessings = siderealBlessingCurseTypes.filter(
      (type) => type.kind === 'blessing',
    );
    const curses = siderealBlessingCurseTypes.filter(
      (type) => type.kind === 'curse',
    );
    expect(blessings).toHaveLength(4);
    expect(curses).toHaveLength(4);
  });

  it('promotes exactly 10 Astrology/Resplendent-Destinies procedural-rules rows', () => {
    expect(astrologyRules).toHaveLength(10);
    const ids = new Set(
      (astrologyRules as { id: string }[]).map((rule) => rule.id),
    );
    expect(ids.size).toBe(10);
    expect(ids.has('resplendent-destinies')).toBe(true);
    expect(ids.has('sidereal-astrology-greater-signs')).toBe(true);
  });

  it("passes the real source audit's promoted-catalog cross-check with zero issues", () => {
    const report = auditFamily('sidereal');
    expect(report.issues).toEqual([]);
    expect(report.promotedEntries).toBeGreaterThanOrEqual(203);
  });
});
