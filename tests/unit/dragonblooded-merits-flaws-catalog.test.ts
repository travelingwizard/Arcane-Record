import { describe, expect, it } from 'vitest';
import {
  abyssalOnlyTraits,
  dragonBloodedTraitById,
  dragonBloodedTraitIds,
  dragonBloodedTraits,
  excludedDragonBloodedTraitNames,
  getDragonBloodedTraitCostPolicy,
  getSharedTraitCostPolicy,
  isLegalDragonBloodedTraitCost,
  isLegalSharedTraitCost,
  matchesDragonBloodedTraitSearch,
} from '../../src/games/exalted1e/reference/dragonblooded-merits-flaws';

// This catalog is now shared between Dragon-Blooded and Abyssal (see
// `dragonblooded-merits-flaws.ts`); `dragonBloodedTraits` therefore covers
// every shared entry, while this filtered subset is the one that actually
// applies to Dragon-Blooded characters.
const dragonBloodedOnlyTraits = dragonBloodedTraits.filter((definition) =>
  definition.appliesTo.includes('dragon-blooded'),
);

describe('Dragon-Blooded Merits and Flaws catalog', () => {
  it('loads all selectable entries with unique stable IDs', () => {
    expect(dragonBloodedTraits).toHaveLength(86);
    expect(dragonBloodedTraitIds.size).toBe(86);
    expect(dragonBloodedOnlyTraits).toHaveLength(80);
    expect(
      dragonBloodedOnlyTraits.filter(({ kind }) => kind === 'merit'),
    ).toHaveLength(40);
    expect(
      dragonBloodedOnlyTraits.filter(({ kind }) => kind === 'flaw'),
    ).toHaveLength(40);
  });

  it('keeps every Dragon-Blooded exclusion out of the Dragon-Blooded-applicable subset', () => {
    // 5 of the original 10 Dragon-Blooded exclusions are now present in the
    // shared catalog for Abyssal only (see below); the remaining 5
    // (Terrestrial Bloodline, Limited Forms, Known Anathema, Chimera,
    // Greater Curse) are still excluded from the catalog entirely.
    expect(excludedDragonBloodedTraitNames.size).toBe(5);
    const dragonBloodedApplicableNames = new Set(
      dragonBloodedOnlyTraits.map(({ name }) => name),
    );
    for (const name of excludedDragonBloodedTraitNames) {
      expect(dragonBloodedApplicableNames.has(name)).toBe(false);
    }
  });

  it('adds Abyssal-only entries for Players Guide rows restricted away from Dragon-Blooded', () => {
    const namesNowAbyssalOnly = [
      "Taint's Warning",
      'Eternal Vow',
      'Permanent Caste Mark',
      'Death-Taint',
      'Throwback',
    ];
    for (const name of namesNowAbyssalOnly) {
      const entries = dragonBloodedTraits.filter(
        (definition) => definition.name === name,
      );
      expect(entries.length).toBeGreaterThan(0);
      for (const entry of entries) {
        expect(entry.appliesTo).toContain('abyssal');
        expect(entry.appliesTo).not.toContain('dragon-blooded');
      }
    }
  });

  it('supports search aliases and category filtering', () => {
    const byAlias = dragonBloodedTraits.filter((definition) =>
      matchesDragonBloodedTraitSearch(definition, 'Legacy of Hesiesh'),
    );
    expect(byAlias.map(({ id }) => id)).toContain('brigids-heir');
    const physicalMerits = dragonBloodedTraits.filter(
      ({ kind, category }) => kind === 'merit' && category === 'physical',
    );
    expect(physicalMerits.length).toBeGreaterThan(0);
    expect(
      physicalMerits.every(
        ({ kind, category }) => kind === 'merit' && category === 'physical',
      ),
    ).toBe(true);
  });

  it('uses fixed, variable, and Dragon-Blooded-specific costs from the catalog', () => {
    const commonSense = dragonBloodedTraitById.get('common-sense')!;
    expect(getDragonBloodedTraitCostPolicy(commonSense)).toEqual({
      kind: 'options',
      options: [1],
    });
    expect(isLegalDragonBloodedTraitCost(commonSense, 1)).toBe(true);
    expect(isLegalDragonBloodedTraitCost(commonSense, 2)).toBe(false);

    const prodigy = dragonBloodedTraitById.get('prodigy')!;
    expect(getDragonBloodedTraitCostPolicy(prodigy)).toEqual({
      kind: 'options',
      options: [2, 3, 5],
    });
    expect(isLegalDragonBloodedTraitCost(prodigy, 4)).toBe(false);

    const addiction = dragonBloodedTraitById.get('addiction')!;
    expect(isLegalDragonBloodedTraitCost(addiction, 0)).toBe(true);
    expect(isLegalDragonBloodedTraitCost(addiction, 4)).toBe(true);
    expect(isLegalDragonBloodedTraitCost(addiction, 5)).toBe(false);

    const meritMutation = dragonBloodedTraitById.get('mutation-merit')!;
    const flawMutation = dragonBloodedTraitById.get('mutation-flaw')!;
    expect(isLegalDragonBloodedTraitCost(meritMutation, 3)).toBe(true);
    expect(isLegalDragonBloodedTraitCost(meritMutation, 2)).toBe(false);
    expect(isLegalDragonBloodedTraitCost(flawMutation, 2)).toBe(true);
    expect(isLegalDragonBloodedTraitCost(flawMutation, 1)).toBe(false);
  });
});

describe('abyssalOnlyTraits (shared catalog subset for Abyssal)', () => {
  it('includes only entries whose appliesTo covers Abyssal', () => {
    expect(abyssalOnlyTraits.length).toBeGreaterThan(0);
    for (const definition of abyssalOnlyTraits) {
      expect(definition.appliesTo).toContain('abyssal');
    }
  });

  it('includes the Abyssal-only entries excluded from dragonBloodedOnlyTraits', () => {
    const abyssalOnlyNames = new Set(abyssalOnlyTraits.map(({ name }) => name));
    for (const name of [
      "Taint's Warning",
      'Eternal Vow',
      'Permanent Caste Mark',
      'Death-Taint',
      'Throwback',
    ]) {
      expect(abyssalOnlyNames.has(name)).toBe(true);
    }
  });

  it('excludes Dragon-Blooded-only entries that do not apply to Abyssal (Prodigy)', () => {
    expect(
      abyssalOnlyTraits.some((definition) => definition.id === 'prodigy'),
    ).toBe(false);
    expect(
      dragonBloodedTraits
        .find((definition) => definition.id === 'prodigy')
        ?.appliesTo.includes('abyssal'),
    ).toBe(false);
  });
});

describe('getSharedTraitCostPolicy', () => {
  it('returns the exact same policy as getDragonBloodedTraitCostPolicy for Dragon-Blooded', () => {
    for (const definition of dragonBloodedTraits) {
      expect(getSharedTraitCostPolicy(definition, 'dragon-blooded')).toEqual(
        getDragonBloodedTraitCostPolicy(definition),
      );
    }
  });

  it("narrows Destiny's options to the Abyssal cap (1-2, not 1-5)", () => {
    const destiny = dragonBloodedTraitById.get('destiny')!;
    expect(getDragonBloodedTraitCostPolicy(destiny)).toEqual({
      kind: 'options',
      options: [1, 2, 3, 4, 5],
    });
    expect(getSharedTraitCostPolicy(destiny, 'abyssal')).toEqual({
      kind: 'options',
      options: [1, 2],
    });
    const abyssalPolicy = getSharedTraitCostPolicy(destiny, 'abyssal');
    if (abyssalPolicy.kind === 'options') {
      for (const option of abyssalPolicy.options) {
        expect(isLegalSharedTraitCost(destiny, option, 'abyssal')).toBe(true);
      }
    }
  });

  it('leaves non-overridden entries unchanged for Abyssal', () => {
    const commonSense = dragonBloodedTraitById.get('common-sense')!;
    expect(getSharedTraitCostPolicy(commonSense, 'abyssal')).toEqual(
      getDragonBloodedTraitCostPolicy(commonSense),
    );
  });
});
