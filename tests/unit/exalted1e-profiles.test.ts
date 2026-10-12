import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import { exalted1eDefinition } from '../../src/games/exalted1e/definition';
import {
  exaltedCharacterProfiles,
  exaltedCharacterTypes,
} from '../../src/games/exalted1e/profiles';
import { migrateExalted1eCharacter } from '../../src/games/exalted1e/schema';
import type { Exalted1eCharacter } from '../../src/games/exalted1e/schema';
import {
  defaultExaltedSourceIds,
  exaltedSources,
} from '../../src/games/exalted1e/sources';

describe('Exalted character-family profiles', () => {
  it('defines one profile for every stable family ID', () => {
    expect(Object.keys(exaltedCharacterProfiles).sort()).toEqual(
      [...exaltedCharacterTypes].sort(),
    );
    for (const id of exaltedCharacterTypes) {
      const profile = exaltedCharacterProfiles[id];
      expect(profile.id).toBe(id);
      expect(profile.governingSourceId).toBeTruthy();
      expect(profile.capabilities.length).toBeGreaterThan(0);
    }
  });

  it('keeps source IDs unique and enables only core plus the governing family source', () => {
    expect(new Set(exaltedSources.map(({ id }) => id)).size).toBe(
      exaltedSources.length,
    );
    for (const type of exaltedCharacterTypes) {
      const defaults = defaultExaltedSourceIds(type);
      expect(defaults).toContain('core');
      expect(defaults).toContain(
        exaltedCharacterProfiles[type].governingSourceId,
      );
      expect(
        exaltedSources
          .filter(({ classification }) => classification === 'supplement')
          .some(({ id }) => defaults.includes(id)),
      ).toBe(false);
    }
  });

  it.each(exaltedCharacterTypes)(
    'creates valid isolated %s family state',
    (type) => {
      const character = createBlankExaltedCharacter(type, 'draft');
      expect(character.sheetType).toBe(type);
      expect(character.familyState.type).toBe(type);
      expect(character.creation.profileId).toBe(type);
      expect(character.sourcePreferences.enabledSourceIds).toContain('core');
      expect(character.sourcePreferences.enabledSourceIds).toContain(
        exaltedCharacterProfiles[type].governingSourceId,
      );
    },
  );

  it('makes every planned family available in production creation now that all five are certified', () => {
    // Phase 6's single final commit certified all five planned families
    // (Lunar, Abyssal, Sidereal, Alchemical, Fair Folk) together, so none
    // of them carry an `unavailableRequirement` anymore -- see
    // `exalted1e-verification.test.ts`/`exalted1e-family-rules.test.ts`
    // for the certification data itself.
    const variants = exalted1eDefinition.variants ?? [];
    expect(variants.map(({ id }) => id)).toEqual(exaltedCharacterTypes);
    expect(
      variants
        .filter(({ unavailableRequirement }) => unavailableRequirement)
        .map(({ id }) => id),
    ).toEqual([]);
  });

  it('migrates a v7 Solar without inferring creation history', () => {
    const legacy = createBlankExaltedCharacter('solar');
    const withoutV8 = structuredClone(legacy) as Record<string, unknown>;
    delete withoutV8.familyState;
    delete withoutV8.sourcePreferences;
    delete withoutV8.creation;
    const previousLayout = withoutV8.sheetLayout as {
      groupOrder: Exalted1eCharacter['sheetLayout']['groupOrder'];
    };
    const layout = { groupOrder: previousLayout.groupOrder };
    const migrated = migrateExalted1eCharacter(
      { ...withoutV8, sheetLayout: layout },
      7,
    );
    expect(migrated.creation.status).toBe('manual');
    expect(migrated.creation.initialPurchases).toEqual([]);
    expect(migrated.creation.bonusPurchases).toEqual([]);
    expect(migrated.familyState).toEqual({ type: 'solar' });
  });
});
