import { describe, expect, it } from 'vitest';
import { gameSystemRegistry } from '../../src/games/registry';
import { plannedExaltedFamilies } from '../../src/games/exalted1e/definitions';
import { exaltedSheetTypes } from '../../src/games/exalted1e/definitions';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';

describe('Exalted First Edition definition', () => {
  it('exposes one locked variant card per planned splat, alongside Solar and Dragon-Blooded', () => {
    // Every `ExaltedCharacterType` (all seven) is a `variants` entry --
    // gating happens per-variant via `unavailableRequirement` (see
    // `CreateCharacterPage.tsx`, which disables the "Choose"/"Open blank
    // sheet" buttons whenever it's set), not by omitting locked families
    // from `variants` entirely.
    const definition = gameSystemRegistry.get('exalted1e');
    const variantIds = (definition?.variants ?? []).map(({ id }) => id);
    expect(variantIds.sort()).toEqual(
      ['solar', 'dragon-blooded', ...plannedExaltedFamilies].sort(),
    );
  });

  it('gives every locked variant a non-generic, evidence-based requirement string', () => {
    const definition = gameSystemRegistry.get('exalted1e');
    const variants = definition?.variants ?? [];
    for (const family of plannedExaltedFamilies) {
      const variant = variants.find(({ id }) => id === family);
      expect(variant?.unavailableRequirement).toContain(
        'Source verification required:',
      );
    }
  });

  it('does not unlock any planned family as a selectable creation variant', () => {
    const definition = gameSystemRegistry.get('exalted1e');
    const variants = definition?.variants ?? [];
    for (const family of plannedExaltedFamilies) {
      const variant = variants.find(({ id }) => id === family);
      expect(variant?.unavailableRequirement).toBeTruthy();
    }
    const solar = variants.find(({ id }) => id === 'solar');
    const dragonBlooded = variants.find(({ id }) => id === 'dragon-blooded');
    expect(solar?.unavailableRequirement).toBeUndefined();
    expect(dragonBlooded?.unavailableRequirement).toBeUndefined();
  });

  it('registers every planned family as a legal stored sheetType without unlocking any of them', () => {
    // All seven `ExaltedCharacterType` values are legal stored
    // `sheetType`s (so a blank character of any planned family can be
    // validated ahead of its creator/editor UI, and so `familyState`'s
    // discriminated union in `schema.ts` has somewhere to live) -- see the
    // tests above for what actually keeps each one locked out of
    // character creation (the `unavailableRequirement` gate), which is
    // completely independent of this schema-level registration.
    expect([...exaltedSheetTypes].sort()).toEqual(
      ['solar', 'dragon-blooded', ...plannedExaltedFamilies].sort(),
    );
  });

  it('labels an Abyssal character "Abyssal", not "Dragon-Blooded" (sheetLabel three-way fix)', () => {
    // sheetLabel() previously used `sheetType === 'solar' ? 'Solar' :
    // 'Dragon-Blooded'`, silently mislabeling Abyssal (only reachable via
    // createBlankExaltedCharacter('abyssal') today, since Abyssal has no
    // variants entry). getDisplayName/getSummary both route through it.
    const definition = gameSystemRegistry.get('exalted1e')!;
    const abyssal = createBlankExaltedCharacter('abyssal');
    expect(definition.getDisplayName(abyssal)).toBe('Untitled Abyssal');
    expect(definition.getSummary(abyssal)).toBe('Abyssal');

    const solar = createBlankExaltedCharacter('solar');
    expect(definition.getDisplayName(solar)).toBe('Untitled Solar');
    const dragonBlooded = createBlankExaltedCharacter('dragon-blooded');
    expect(definition.getDisplayName(dragonBlooded)).toBe(
      'Untitled Dragon-Blooded',
    );

    const sidereal = createBlankExaltedCharacter('sidereal');
    expect(definition.getDisplayName(sidereal)).toBe('Untitled Sidereal');
    expect(definition.getSummary(sidereal)).toBe('Sidereal');
  });
});
