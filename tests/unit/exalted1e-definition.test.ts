import { describe, expect, it } from 'vitest';
import { gameSystemRegistry } from '../../src/games/registry';
import { plannedExaltedFamilies } from '../../src/games/exalted1e/definitions';
import { exaltedSheetTypes } from '../../src/games/exalted1e/definitions';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';

describe('Exalted First Edition definition', () => {
  it('exposes one variant card per planned splat, alongside Solar and Dragon-Blooded', () => {
    // Every `ExaltedCharacterType` (all seven) is a `variants` entry --
    // gating happens per-variant via `unavailableRequirement` (see
    // `CreateCharacterPage.tsx`, which disables the "Choose"/"Open blank
    // sheet" buttons whenever it's set), not by omitting families from
    // `variants` entirely.
    const definition = gameSystemRegistry.get('exalted1e');
    const variantIds = (definition?.variants ?? []).map(({ id }) => id);
    expect(variantIds.sort()).toEqual(
      ['solar', 'dragon-blooded', ...plannedExaltedFamilies].sort(),
    );
  });

  it('unlocks every planned family as a selectable creation variant, now that all five are certified', () => {
    // Phase 6's single final commit set `certifiedAt` on all five planned
    // families' certification records simultaneously, once every one of
    // them had real, passing evidence on every testable dimension -- see
    // `exalted1e-verification.test.ts`/`exalted1e-family-rules.test.ts`
    // for that evidence itself. Every variant, planned or not, now has no
    // `unavailableRequirement`.
    const definition = gameSystemRegistry.get('exalted1e');
    const variants = definition?.variants ?? [];
    for (const type of [
      'solar',
      'dragon-blooded',
      ...plannedExaltedFamilies,
    ] as const) {
      const variant = variants.find(({ id }) => id === type);
      expect(variant?.unavailableRequirement).toBeUndefined();
    }
  });

  it('registers every planned family as a legal stored sheetType', () => {
    // All seven `ExaltedCharacterType` values are legal stored
    // `sheetType`s (so a blank character of any planned family can be
    // validated ahead of its creator/editor UI, and so `familyState`'s
    // discriminated union in `schema.ts` has somewhere to live).
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
