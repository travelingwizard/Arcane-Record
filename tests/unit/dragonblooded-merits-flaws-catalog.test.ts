import { describe, expect, it } from 'vitest';
import {
  dragonBloodedTraitById,
  dragonBloodedTraitIds,
  dragonBloodedTraits,
  excludedDragonBloodedTraitNames,
  getDragonBloodedTraitCostPolicy,
  isLegalDragonBloodedTraitCost,
  matchesDragonBloodedTraitSearch,
} from '../../src/games/exalted1e/reference/dragonblooded-merits-flaws';

describe('Dragon-Blooded Merits and Flaws catalog', () => {
  it('loads all selectable entries with unique stable IDs', () => {
    expect(dragonBloodedTraits).toHaveLength(80);
    expect(dragonBloodedTraitIds.size).toBe(80);
    expect(
      dragonBloodedTraits.filter(({ kind }) => kind === 'merit'),
    ).toHaveLength(40);
    expect(
      dragonBloodedTraits.filter(({ kind }) => kind === 'flaw'),
    ).toHaveLength(40);
  });

  it('keeps every Dragon-Blooded exclusion out of the selectable catalog', () => {
    expect(excludedDragonBloodedTraitNames.size).toBe(10);
    const selectableNames = new Set(
      dragonBloodedTraits.map(({ name }) => name),
    );
    for (const name of excludedDragonBloodedTraitNames) {
      expect(selectableNames.has(name)).toBe(false);
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
