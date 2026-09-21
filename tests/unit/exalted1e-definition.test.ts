import { describe, expect, it } from 'vitest';
import { gameSystemRegistry } from '../../src/games/registry';
import { plannedExaltedFamilies } from '../../src/games/exalted1e/definitions';
import { exaltedSheetTypes } from '../../src/games/exalted1e/definitions';

describe('Exalted First Edition definition', () => {
  it('exposes one locked Unavailable card per planned splat', () => {
    const definition = gameSystemRegistry.get('exalted1e');
    const choices = definition?.unavailableSheetChoices ?? [];
    expect(choices).toHaveLength(plannedExaltedFamilies.length);
    expect(choices.map((choice) => choice.id).sort()).toEqual(
      [...plannedExaltedFamilies].sort(),
    );
  });

  it('gives every locked card a non-generic, evidence-based requirement string', () => {
    const definition = gameSystemRegistry.get('exalted1e');
    const choices = definition?.unavailableSheetChoices ?? [];
    for (const choice of choices) {
      expect(choice.requirement).toContain('Locked pending certification');
      expect(choice.requirement).toContain('rules tests');
      expect(choice.requirement).toContain('creator tests');
      expect(choice.requirement).toContain('migration tests');
      expect(choice.requirement).toContain('browser tests');
    }
  });

  it('does not expose any planned family as a selectable creation variant', () => {
    const definition = gameSystemRegistry.get('exalted1e');
    const variantIds = (definition?.variants ?? []).map(({ id }) => id);
    for (const family of plannedExaltedFamilies) {
      expect(variantIds).not.toContain(family);
    }
    expect(variantIds).toEqual(['solar', 'dragon-blooded']);
  });

  it('registers Abyssal as a legal stored sheetType without unlocking it', () => {
    // Abyssal is the sole exception, and only at the schema layer: it is a
    // legal stored `sheetType` (so a blank Abyssal character can be
    // validated ahead of its creator/editor UI), but it still is not a
    // selectable creation variant (see the test above) and every other
    // planned family remains fully unregistered as a sheet type too.
    expect(exaltedSheetTypes).toEqual(['solar', 'dragon-blooded', 'abyssal']);
    for (const family of plannedExaltedFamilies) {
      if (family === 'abyssal') continue;
      expect(
        (exaltedSheetTypes as readonly string[]).includes(family),
      ).toBe(false);
    }
  });
});
