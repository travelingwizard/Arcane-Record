import { describe, expect, it } from 'vitest';
import {
  dragonBloodedCharmIds,
  dragonBloodedCharms,
  dragonBloodedSpellIds,
  dragonBloodedSpells,
  sharedSorcerySpellById,
  sharedSorcerySpellIds,
} from '../../src/games/exalted1e/reference/dragonblooded-powers';

describe('Dragon-Blooded power catalog', () => {
  it('loads the complete catalog with unique stable IDs', () => {
    expect(dragonBloodedCharms).toHaveLength(320);
    expect(dragonBloodedSpells).toHaveLength(99);
    expect(dragonBloodedCharmIds.size).toBe(320);
    expect(dragonBloodedSpellIds.size).toBe(99);
    expect(
      [...dragonBloodedCharmIds].filter((id) => dragonBloodedSpellIds.has(id)),
    ).toEqual([]);
  });

  it('contains the standard Terrestrial Circle sorcery access Charm', () => {
    expect(dragonBloodedCharms).toContainEqual(
      expect.objectContaining({
        id: 'terrestrial-circle-sorcery',
        name: 'Terrestrial Circle Sorcery',
        minimumEssence: 3,
      }),
    );
    expect(
      dragonBloodedSpells.every((spell) =>
        spell.prerequisiteCharms.includes('Terrestrial Circle Sorcery'),
      ),
    ).toBe(true);
    // Dragon-Blooded's own spell export stays Terrestrial-only even though
    // the underlying sorcery-spell file (dragonblooded-sorcery.json) now
    // also holds Celestial-circle spells for Abyssal's use (Phase 1c) --
    // see `sharedSorcerySpellIds` below for the broader set.
    expect(dragonBloodedSpells.every((spell) => spell.circle === 'terrestrial')).toBe(
      true,
    );
  });

  describe('sharedSorcerySpellIds (Phase 1c: splat-agnostic alias covering both circles)', () => {
    it('covers 130 spells total: the 99 pre-existing Terrestrial spells plus 31 new Celestial spells', () => {
      expect(sharedSorcerySpellIds.size).toBe(130);
      const celestialSpells = [...sharedSorcerySpellById.values()].filter(
        (spell) => spell.circle === 'celestial',
      );
      expect(celestialSpells).toHaveLength(31);
      expect(celestialSpells.every((spell) => spell.alternateCircleName === 'Sapphire Circle')).toBe(
        true,
      );
      expect(
        celestialSpells.every((spell) =>
          spell.prerequisiteCharms.includes('Celestial Circle Sorcery'),
        ),
      ).toBe(true);
    });

    it('is a strict superset of the Terrestrial-only dragonBloodedSpellIds set', () => {
      expect(
        [...dragonBloodedSpellIds].every((id) => sharedSorcerySpellIds.has(id)),
      ).toBe(true);
    });

    it('has no id collisions between the new Celestial rows and the existing 99 Terrestrial rows', () => {
      const terrestrialIds = new Set(dragonBloodedSpellIds);
      const celestialIds = [...sharedSorcerySpellById.values()]
        .filter((spell) => spell.circle === 'celestial')
        .map((spell) => spell.id);
      expect(new Set(celestialIds).size).toBe(celestialIds.length);
      expect(celestialIds.some((id) => terrestrialIds.has(id))).toBe(false);
    });
  });
});
