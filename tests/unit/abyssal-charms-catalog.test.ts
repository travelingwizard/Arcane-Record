import { describe, expect, it } from 'vitest';
import {
  abyssalCastes,
  abyssalCharmById,
  abyssalCharmIds,
  abyssalCharms,
  abyssalNecromancySpellById,
  abyssalNecromancySpellIds,
  abyssalNecromancySpells,
  abyssalUnresolvedNecromancySpellIds,
  abyssalUnreviewedExcludedCharmIds,
  abyssalUnreviewedExcludedSpellIds,
} from '../../src/games/exalted1e/reference/abyssal-powers';

describe('Abyssal Charm and Necromancy spell catalogs (Phase 1b)', () => {
  it('loads all promoted Charm rows with unique stable IDs', () => {
    expect(abyssalCharms).toHaveLength(225);
    expect(abyssalCharmIds.size).toBe(225);
    expect(abyssalCharmById.size).toBe(225);
  });

  it('loads all promoted Necromancy spell rows with unique stable IDs', () => {
    expect(abyssalNecromancySpells).toHaveLength(103);
    expect(abyssalNecromancySpellIds.size).toBe(103);
    expect(abyssalNecromancySpellById.size).toBe(103);
  });

  it('assigns every Charm a valid Caste from the five documented Abyssal Castes', () => {
    for (const charm of abyssalCharms) {
      expect(charm.caste === null || abyssalCastes.includes(charm.caste)).toBe(
        true,
      );
    }
  });

  it('distributes Charms across all five Castes with the expected counts', () => {
    const casteCounts = new Map<string, number>();
    for (const charm of abyssalCharms) {
      if (!charm.caste) continue;
      casteCounts.set(charm.caste, (casteCounts.get(charm.caste) ?? 0) + 1);
    }
    expect(casteCounts.get('Dusk')).toBe(65);
    expect(casteCounts.get('Midnight')).toBe(42);
    expect(casteCounts.get('Daybreak')).toBe(41);
    expect(casteCounts.get('Day')).toBe(38);
    expect(casteCounts.get('Moonshadow')).toBe(39);
    expect(
      Array.from(casteCounts.values()).reduce((sum, count) => sum + count, 0),
    ).toBe(225);
  });

  it('resolves every prerequisiteCharms entry to another id in the same catalog (no dangling references)', () => {
    for (const charm of abyssalCharms) {
      for (const prerequisiteId of charm.prerequisiteCharms) {
        expect(abyssalCharmById.has(prerequisiteId)).toBe(true);
      }
    }
  });

  it('never lists a Charm as its own prerequisite', () => {
    for (const charm of abyssalCharms) {
      expect(charm.prerequisiteCharms).not.toContain(charm.id);
    }
  });

  it('deliberately excludes the two unresolved (missing mote cost) spell rows', () => {
    for (const id of abyssalUnresolvedNecromancySpellIds) {
      expect(abyssalNecromancySpellById.has(id)).toBe(false);
      expect(abyssalCharmById.has(id)).toBe(false);
    }
  });

  it('deliberately excludes the still-unreviewed Charm rows', () => {
    for (const id of abyssalUnreviewedExcludedCharmIds) {
      expect(abyssalCharmById.has(id)).toBe(false);
    }
  });

  it('deliberately excludes the still-unreviewed spell row', () => {
    for (const id of abyssalUnreviewedExcludedSpellIds) {
      expect(abyssalNecromancySpellById.has(id)).toBe(false);
    }
  });

  it('assigns Combo rules to every Charm', () => {
    for (const charm of abyssalCharms) {
      expect(charm.comboRules).toBeDefined();
      expect(typeof charm.comboRules.eligible).toBe('boolean');
    }
  });

  it('marks the three circle-enabling Charms ineligible for Combos', () => {
    for (const id of [
      'shadowlands-circle-necromancy',
      'labyrinth-circle-necromancy',
      'void-circle-necromancy',
    ]) {
      const charm = abyssalCharmById.get(id);
      expect(charm).toBeDefined();
      expect(charm?.comboRules.eligible).toBe(false);
    }
  });

  it('distributes Necromancy spells across all three circles with the expected counts', () => {
    const circleCounts = new Map<string, number>();
    for (const spell of abyssalNecromancySpells) {
      circleCounts.set(
        spell.circle,
        (circleCounts.get(spell.circle) ?? 0) + 1,
      );
    }
    expect(circleCounts.get('shadowlands')).toBe(44);
    expect(circleCounts.get('labyrinth')).toBe(34);
    expect(circleCounts.get('void')).toBe(25);
    expect(
      Array.from(circleCounts.values()).reduce((sum, count) => sum + count, 0),
    ).toBe(103);
  });

  it('gates every spell behind its circle-appropriate enabling Charm', () => {
    const enablingCharmByCircle: Record<string, string> = {
      shadowlands: 'shadowlands-circle-necromancy',
      labyrinth: 'labyrinth-circle-necromancy',
      void: 'void-circle-necromancy',
    };
    for (const spell of abyssalNecromancySpells) {
      const expectedEnabler = enablingCharmByCircle[spell.circle];
      expect(spell.prerequisiteCharms).toContain(expectedEnabler);
    }
  });
});
