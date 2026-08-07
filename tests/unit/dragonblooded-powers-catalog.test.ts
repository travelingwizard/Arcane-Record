import { describe, expect, it } from 'vitest';
import {
  dragonBloodedCharmIds,
  dragonBloodedCharms,
  dragonBloodedSpellIds,
  dragonBloodedSpells,
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
  });
});
