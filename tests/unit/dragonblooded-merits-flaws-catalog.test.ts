import { describe, expect, it } from 'vitest';
import {
  abyssalOnlyTraits,
  alchemicalOnlyTraits,
  dragonBloodedTraitById,
  dragonBloodedTraitIds,
  dragonBloodedTraits,
  excludedDragonBloodedTraitNames,
  fairFolkOnlyTraits,
  getDragonBloodedTraitCostPolicy,
  getSharedTraitCostPolicy,
  isLegalDragonBloodedTraitCost,
  isLegalSharedTraitCost,
  lunarOnlyTraits,
  matchesDragonBloodedTraitSearch,
  siderealOnlyTraits,
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
    expect(dragonBloodedTraits).toHaveLength(92);
    expect(dragonBloodedTraitIds.size).toBe(92);
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

  it("narrows Destiny's options to the same 1-2 cap for Sidereal", () => {
    const destiny = dragonBloodedTraitById.get('destiny')!;
    expect(getSharedTraitCostPolicy(destiny, 'sidereal')).toEqual({
      kind: 'options',
      options: [1, 2],
    });
  });

  it("replaces Permanent Caste Mark's options entirely for Sidereal (flat 1, not the shared flat 2)", () => {
    const permanentCasteMark = dragonBloodedTraitById.get(
      'permanent-caste-mark',
    )!;
    expect(getDragonBloodedTraitCostPolicy(permanentCasteMark)).toEqual({
      kind: 'options',
      options: [2],
    });
    expect(getSharedTraitCostPolicy(permanentCasteMark, 'sidereal')).toEqual({
      kind: 'options',
      options: [1],
    });
    expect(isLegalSharedTraitCost(permanentCasteMark, 1, 'sidereal')).toBe(
      true,
    );
    expect(isLegalSharedTraitCost(permanentCasteMark, 2, 'sidereal')).toBe(
      false,
    );
    expect(isLegalSharedTraitCost(permanentCasteMark, 2, 'abyssal')).toBe(true);
  });

  it('leaves non-overridden entries unchanged for Sidereal', () => {
    const commonSense = dragonBloodedTraitById.get('common-sense')!;
    expect(getSharedTraitCostPolicy(commonSense, 'sidereal')).toEqual(
      getDragonBloodedTraitCostPolicy(commonSense),
    );
  });
});

describe('siderealOnlyTraits (shared catalog subset for Sidereal)', () => {
  it('includes only entries whose appliesTo covers Sidereal', () => {
    expect(siderealOnlyTraits.length).toBeGreaterThan(0);
    for (const definition of siderealOnlyTraits) {
      expect(definition.appliesTo).toContain('sidereal');
    }
  });

  it('includes the three wholly new Sidereal-only entries', () => {
    const siderealOnlyIds = new Set(siderealOnlyTraits.map(({ id }) => id));
    for (const id of [
      'terrestrial-bloodline-sidereal',
      'greater-curse-sidereal',
      'known-anathema-sidereal',
    ]) {
      expect(siderealOnlyIds.has(id)).toBe(true);
    }
  });

  it('excludes Dragon-Blooded-only entries that do not apply to Sidereal (Terrestrial Bloodline)', () => {
    expect(
      siderealOnlyTraits.some(
        (definition) => definition.id === 'terrestrial-bloodline',
      ),
    ).toBe(false);
  });

  it('includes a broadly-shared entry that also applies to Dragon-Blooded and Abyssal (Selective Conception)', () => {
    const selectiveConception = dragonBloodedTraitById.get(
      'selective-conception',
    )!;
    expect(selectiveConception.appliesTo).toEqual(
      expect.arrayContaining(['dragon-blooded', 'abyssal', 'sidereal']),
    );
    expect(
      siderealOnlyTraits.some(
        (definition) => definition.id === 'selective-conception',
      ),
    ).toBe(true);
  });
});

describe('lunarOnlyTraits (shared catalog subset for Lunar)', () => {
  it('includes only entries whose appliesTo covers Lunar', () => {
    expect(lunarOnlyTraits.length).toBeGreaterThan(0);
    for (const definition of lunarOnlyTraits) {
      expect(definition.appliesTo).toContain('lunar');
    }
  });

  it('has 87 entries, matching Lunar Phase 1a promotion', () => {
    expect(lunarOnlyTraits).toHaveLength(87);
    expect(lunarOnlyTraits.filter(({ kind }) => kind === 'merit')).toHaveLength(
      40,
    );
    expect(lunarOnlyTraits.filter(({ kind }) => kind === 'flaw')).toHaveLength(
      47,
    );
  });

  it('includes the wholly new Lunar-only entries (Chimera, Limited Forms, Greater Curse)', () => {
    const lunarOnlyIds = new Set(lunarOnlyTraits.map(({ id }) => id));
    for (const id of ['chimera', 'limited-forms', 'greater-curse-lunar']) {
      expect(lunarOnlyIds.has(id)).toBe(true);
    }
  });

  it('excludes Dragon-Blooded-only entries that do not apply to Lunar (Prodigy, Legendary Breeding)', () => {
    for (const id of ['prodigy', 'taints-warning', 'legendary-breeding']) {
      expect(lunarOnlyTraits.some((definition) => definition.id === id)).toBe(
        false,
      );
    }
  });

  it('includes the two entries renamed from their former "(Sidereal)"-only naming once reclassified as Celestial-Exalted-wide', () => {
    const lunarOnlyIds = new Set(lunarOnlyTraits.map(({ id }) => id));
    for (const id of [
      'terrestrial-bloodline-sidereal',
      'known-anathema-sidereal',
    ]) {
      expect(lunarOnlyIds.has(id)).toBe(true);
      const definition = dragonBloodedTraitById.get(id)!;
      expect(definition.appliesTo).toContain('sidereal');
      expect(definition.appliesTo).toContain('lunar');
    }
  });

  it("overrides Ambidextrous's cost to a flat 1 point and Double-Jointed's to 1 or 2 points for Lunar", () => {
    const ambidextrous = dragonBloodedTraitById.get('ambidextrous')!;
    expect(getSharedTraitCostPolicy(ambidextrous, 'lunar')).toEqual({
      kind: 'options',
      options: [1],
    });
    expect(isLegalSharedTraitCost(ambidextrous, 1, 'lunar')).toBe(true);

    const doubleJointed = dragonBloodedTraitById.get('double-jointed')!;
    expect(getSharedTraitCostPolicy(doubleJointed, 'lunar')).toEqual({
      kind: 'options',
      options: [1, 2],
    });
    expect(isLegalSharedTraitCost(doubleJointed, 3, 'lunar')).toBe(false);
  });
});

describe('alchemicalOnlyTraits (shared catalog subset for Alchemical)', () => {
  it('includes only entries whose appliesTo covers Alchemical', () => {
    expect(alchemicalOnlyTraits.length).toBeGreaterThan(0);
    for (const definition of alchemicalOnlyTraits) {
      expect(definition.appliesTo).toContain('alchemical');
    }
  });

  it('has 71 entries, matching Alchemical Phase 1a promotion', () => {
    expect(alchemicalOnlyTraits).toHaveLength(71);
    expect(
      alchemicalOnlyTraits.filter(({ kind }) => kind === 'merit'),
    ).toHaveLength(34);
    expect(
      alchemicalOnlyTraits.filter(({ kind }) => kind === 'flaw'),
    ).toHaveLength(37);
  });

  it('includes the Favor Merit/Flaw split pair (derived from the single inventoried "Favor" row)', () => {
    const alchemicalOnlyIds = new Set(alchemicalOnlyTraits.map(({ id }) => id));
    expect(alchemicalOnlyIds.has('favor-merit')).toBe(true);
    expect(alchemicalOnlyIds.has('favor-flaw')).toBe(true);
  });

  it('creates no wholly new Alchemical-only entries (every row maps onto an existing shared entry)', () => {
    for (const definition of alchemicalOnlyTraits) {
      expect(definition.appliesTo.length).toBeGreaterThan(1);
    }
  });

  it('excludes entries that do not apply to Alchemical (Selective Conception, Prodigy)', () => {
    for (const id of ['selective-conception', 'prodigy']) {
      expect(
        alchemicalOnlyTraits.some((definition) => definition.id === id),
      ).toBe(false);
    }
  });

  it('uses the shared Dragon-Blooded-derived 1-5 point range for Destiny, with no Alchemical-specific override (unlike Abyssal/Sidereal)', () => {
    const destiny = dragonBloodedTraitById.get('destiny')!;
    expect(destiny.appliesTo).toContain('alchemical');
    expect(getSharedTraitCostPolicy(destiny, 'alchemical')).toEqual({
      kind: 'options',
      options: [1, 2, 3, 4, 5],
    });
    expect(isLegalSharedTraitCost(destiny, 5, 'alchemical')).toBe(true);
  });
});

describe('fairFolkOnlyTraits (shared catalog subset for Fair Folk)', () => {
  it('includes only entries whose appliesTo covers Fair Folk', () => {
    expect(fairFolkOnlyTraits.length).toBeGreaterThan(0);
    for (const definition of fairFolkOnlyTraits) {
      expect(definition.appliesTo).toContain('fair-folk');
    }
  });

  it('has 75 entries, matching Fair Folk Phase 1a promotion (73 inventoried rows, with the Mutation and Favor dual merit/flaw pairs each counted twice)', () => {
    expect(fairFolkOnlyTraits).toHaveLength(75);
    expect(
      fairFolkOnlyTraits.filter(({ kind }) => kind === 'merit'),
    ).toHaveLength(36);
    expect(
      fairFolkOnlyTraits.filter(({ kind }) => kind === 'flaw'),
    ).toHaveLength(39);
  });

  it('includes both dual merit/flaw split pairs (Mutation and Favor)', () => {
    const fairFolkOnlyIds = new Set(fairFolkOnlyTraits.map(({ id }) => id));
    for (const id of [
      'mutation-merit',
      'mutation-flaw',
      'favor-merit',
      'favor-flaw',
    ]) {
      expect(fairFolkOnlyIds.has(id)).toBe(true);
    }
  });

  it('creates no wholly new Fair-Folk-only entries (every row maps onto an existing shared entry)', () => {
    for (const definition of fairFolkOnlyTraits) {
      expect(definition.appliesTo.length).toBeGreaterThan(1);
    }
  });

  it('includes Prodigy by analogy to Dragon-Blooded/Sidereal (unlike Alchemical, which excludes it)', () => {
    const prodigy = dragonBloodedTraitById.get('prodigy')!;
    expect(prodigy.appliesTo).toContain('fair-folk');
    expect(prodigy.appliesTo).not.toContain('alchemical');
  });

  it('excludes entries that do not apply to Fair Folk (the 15 Celestial-Exalted/blood-lineage/Sorcery-gated names, 17 catalog entries after the Eternal Vow/Greater Curse splits)', () => {
    for (const id of [
      'terrestrial-bloodline-sidereal',
      'past-lives',
      'sworn-brotherhood',
      'taints-warning',
      'legendary-breeding',
      'eternal-vow-merit',
      'eternal-vow-flaw',
      'brigids-heir',
      'limited-forms',
      'known-anathema-sidereal',
      'chimera',
      'permanent-caste-mark',
      'greater-curse-lunar',
      'greater-curse-sidereal',
      'beacon-of-power',
      'death-taint',
      'throwback',
    ]) {
      expect(
        fairFolkOnlyTraits.some((definition) => definition.id === id),
      ).toBe(false);
    }
  });

  it('uses the shared Dragon-Blooded-derived 1-5 point range for Destiny, with no Fair-Folk-specific override (unlike Abyssal/Sidereal)', () => {
    const destiny = dragonBloodedTraitById.get('destiny')!;
    expect(destiny.appliesTo).toContain('fair-folk');
    expect(getSharedTraitCostPolicy(destiny, 'fair-folk')).toEqual({
      kind: 'options',
      options: [1, 2, 3, 4, 5],
    });
    expect(isLegalSharedTraitCost(destiny, 5, 'fair-folk')).toBe(true);
  });
});
