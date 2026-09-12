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

  it('does not register any planned family as a real, creatable sheet type', () => {
    for (const family of plannedExaltedFamilies) {
      expect((exaltedSheetTypes as readonly string[]).includes(family)).toBe(
        false,
      );
    }
    expect(exaltedSheetTypes).toEqual(['solar', 'dragon-blooded']);
  });
});
