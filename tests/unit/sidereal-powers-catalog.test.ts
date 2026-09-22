import { describe, expect, it } from 'vitest';
import {
  siderealCastes,
  siderealCharmById,
  siderealCharmIds,
  siderealCharms,
  siderealSorcerySpellIds,
  siderealUnreviewedExcludedSpellIds,
} from '../../src/games/exalted1e/reference/sidereal-powers';
import { sharedSorcerySpellById } from '../../src/games/exalted1e/reference/dragonblooded-powers';

describe('Sidereal Charm and Sorcery-spell catalogs (Phase 2b)', () => {
  it('loads all promoted Charm rows with unique stable IDs', () => {
    expect(siderealCharms).toHaveLength(193);
    expect(siderealCharmIds.size).toBe(193);
    expect(siderealCharmById.size).toBe(193);
  });

  it('assigns every Charm exactly one of caste or style, never both, never neither', () => {
    for (const charm of siderealCharms) {
      const hasCaste = charm.caste !== null;
      const hasStyle = charm.style !== null;
      expect(hasCaste !== hasStyle).toBe(true);
    }
  });

  it('assigns every caste Charm a valid Caste from the five documented Sidereal Castes', () => {
    for (const charm of siderealCharms) {
      if (charm.caste === null) continue;
      expect(siderealCastes.includes(charm.caste)).toBe(true);
    }
  });

  it('distributes the 152 Caste-and-Auspicious-Ability Charms across all five Castes with the expected counts', () => {
    const casteCounts = new Map<string, number>();
    for (const charm of siderealCharms) {
      if (!charm.caste) continue;
      casteCounts.set(charm.caste, (casteCounts.get(charm.caste) ?? 0) + 1);
    }
    expect(casteCounts.get('Journeys')).toBe(29);
    expect(casteCounts.get('Serenity')).toBe(30);
    expect(casteCounts.get('Battles')).toBe(31);
    expect(casteCounts.get('Secrets')).toBe(32);
    expect(casteCounts.get('Endings')).toBe(30);
    expect(
      Array.from(casteCounts.values()).reduce((sum, count) => sum + count, 0),
    ).toBe(152);
  });

  it('covers all 25 documented Caste-and-Auspicious-Ability trees (one per distinct Ability among caste Charms)', () => {
    const abilities = new Set(
      siderealCharms
        .filter((charm) => charm.caste !== null)
        .map((charm) => charm.ability),
    );
    expect(abilities.size).toBe(25);
  });

  it('distributes the 41 secret Martial Arts style Charms across the three named styles with the expected counts', () => {
    const styleCounts = new Map<string, number>();
    for (const charm of siderealCharms) {
      if (!charm.style) continue;
      styleCounts.set(charm.style, (styleCounts.get(charm.style) ?? 0) + 1);
    }
    expect(styleCounts.get('Charcoal March of Spiders')).toBe(12);
    expect(styleCounts.get('Prismatic Arrangement of Creation')).toBe(16);
    expect(styleCounts.get('Citrine Poxes of Contagion')).toBe(13);
    expect(
      Array.from(styleCounts.values()).reduce((sum, count) => sum + count, 0),
    ).toBe(41);
  });

  it('resolves every prerequisiteCharms entry to another id in the same catalog (no dangling references)', () => {
    for (const charm of siderealCharms) {
      for (const prerequisiteId of charm.prerequisiteCharms) {
        expect(siderealCharmById.has(prerequisiteId)).toBe(true);
      }
    }
  });

  it('never lists a Charm as its own prerequisite', () => {
    for (const charm of siderealCharms) {
      expect(charm.prerequisiteCharms).not.toContain(charm.id);
    }
  });

  it('assigns Combo rules to every Charm', () => {
    for (const charm of siderealCharms) {
      expect(charm.comboRules).toBeDefined();
      expect(typeof charm.comboRules.eligible).toBe('boolean');
    }
  });

  it('grants explicit cross-Ability Combo permission to the 6 Charms whose own text states it', () => {
    for (const id of [
      'trouble-reduction-strategy',
      'heart-brightening-presentation-style',
      'hot-eyed-snake-whispering',
      'harmony-of-blows',
      'avoiding-the-truth-technique',
      'life-severing-blow',
    ]) {
      const charm = siderealCharmById.get(id);
      expect(charm).toBeDefined();
      expect(charm?.comboRules.crossAbilityAllowed).toBe(true);
    }
  });

  it('marks the two circle-enabling Charms and Grandmother Spider Mastery ineligible for Combos', () => {
    for (const id of [
      'terrestrial-circle-sorcery',
      'celestial-circle-sorcery',
      'grandmother-spider-mastery',
    ]) {
      const charm = siderealCharmById.get(id);
      expect(charm).toBeDefined();
      expect(charm?.comboRules.eligible).toBe(false);
    }
  });

  it('exposes 73 shared Sorcery spell ids that all resolve in the shared Dragon-Blooded catalog', () => {
    expect(siderealSorcerySpellIds.size).toBe(73);
    for (const id of siderealSorcerySpellIds) {
      expect(sharedSorcerySpellById.has(id)).toBe(true);
    }
  });

  it('deliberately excludes the 13 still-unreviewed Sorcery spell rows', () => {
    expect(siderealUnreviewedExcludedSpellIds).toHaveLength(13);
    for (const id of siderealUnreviewedExcludedSpellIds) {
      expect(siderealSorcerySpellIds.has(id)).toBe(false);
    }
  });

  it('does not promote Spell-Shattering Palm as a spell despite its inventory id prefix (it is a Martial Arts Charm)', () => {
    expect(siderealCharmById.has('spell-shattering-palm')).toBe(true);
    expect(siderealSorcerySpellIds.has('spell-shattering-palm')).toBe(false);
  });
});
