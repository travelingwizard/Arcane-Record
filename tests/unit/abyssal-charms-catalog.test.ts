import { describe, expect, it } from 'vitest';
import {
  abyssalCastes,
  abyssalCharmById,
  abyssalCharmIds,
  abyssalCharms,
  abyssalNecromancySpellById,
  abyssalNecromancySpellIds,
  abyssalNecromancySpells,
} from '../../src/games/exalted1e/reference/abyssal-powers';

describe('Abyssal Charm and Necromancy spell catalogs (Phase 1b)', () => {
  it('loads all promoted Charm rows with unique stable IDs', () => {
    expect(abyssalCharms).toHaveLength(227);
    expect(abyssalCharmIds.size).toBe(227);
    expect(abyssalCharmById.size).toBe(227);
  });

  it('loads all promoted Necromancy spell rows with unique stable IDs', () => {
    expect(abyssalNecromancySpells).toHaveLength(106);
    expect(abyssalNecromancySpellIds.size).toBe(106);
    expect(abyssalNecromancySpellById.size).toBe(106);
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
    expect(casteCounts.get('Day')).toBe(40);
    expect(casteCounts.get('Moonshadow')).toBe(39);
    expect(
      Array.from(casteCounts.values()).reduce((sum, count) => sum + count, 0),
    ).toBe(227);
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

  it('promotes the two previously-unreviewed Day Caste Charms (Phase 1e)', () => {
    for (const id of ['soaring-raptor-prana', 'striking-snake-grab']) {
      const charm = abyssalCharmById.get(id);
      expect(charm).toBeDefined();
      expect(charm?.caste).toBe('Day');
      expect(charm?.reviewStatus).toBe('source-checked');
    }
  });

  it('promotes the previously-unreviewed core-book spell row (Phase 1e)', () => {
    const spell = abyssalNecromancySpellById.get('iron-countermagic');
    expect(spell).toBeDefined();
    expect(spell?.circle).toBe('shadowlands');
    expect(spell?.cost).not.toBeNull();
  });

  it('promotes the two previously-unresolved Book of Bone and Ebony spell rows with an honestly-null cost (Phase 1e)', () => {
    const brickByBrickSolitude = abyssalNecromancySpellById.get(
      'brick-by-brick-solitude',
    );
    const barredTomb = abyssalNecromancySpellById.get('barred-tomb');
    for (const spell of [brickByBrickSolitude, barredTomb]) {
      expect(spell).toBeDefined();
      expect(spell?.cost).toBeNull();
      expect(spell?.reviewFlags.length).toBeGreaterThan(0);
    }
    expect(brickByBrickSolitude?.circle).toBe('labyrinth');
    expect(barredTomb?.circle).toBe('void');
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
    expect(circleCounts.get('shadowlands')).toBe(45);
    expect(circleCounts.get('labyrinth')).toBe(35);
    expect(circleCounts.get('void')).toBe(26);
    expect(
      Array.from(circleCounts.values()).reduce((sum, count) => sum + count, 0),
    ).toBe(106);
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
