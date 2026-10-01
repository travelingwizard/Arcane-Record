import { describe, expect, it } from 'vitest';
import {
  lunarCharmById,
  lunarCharmCategories,
  lunarCharmIds,
  lunarCharms,
} from '../../src/games/exalted1e/reference/lunar-powers';

describe('Lunar Charm catalog (Phase 1b)', () => {
  it('loads all promoted Charm rows with unique stable IDs', () => {
    expect(lunarCharms).toHaveLength(219);
    expect(lunarCharmIds.size).toBe(219);
    expect(lunarCharmById.size).toBe(219);
  });

  it('assigns every Charm a valid category from the documented Lunar Charm categories', () => {
    for (const charm of lunarCharms) {
      expect(lunarCharmCategories).toContain(charm.charmCategory);
    }
  });

  it('distributes Charms across all documented categories with the expected counts', () => {
    const categoryCounts = new Map<string, number>();
    for (const charm of lunarCharms) {
      categoryCounts.set(
        charm.charmCategory,
        (categoryCounts.get(charm.charmCategory) ?? 0) + 1,
      );
    }
    expect(categoryCounts.get('Sample Charms')).toBe(5);
    expect(categoryCounts.get('Shapechanging I')).toBe(7);
    expect(categoryCounts.get('Shapechanging II')).toBe(7);
    expect(categoryCounts.get('Shapechanging III')).toBe(3);
    expect(categoryCounts.get('Body Enhancement I')).toBe(5);
    expect(categoryCounts.get('Body Enhancement II')).toBe(6);
    expect(categoryCounts.get('Unarmed Combat')).toBe(36);
    expect(categoryCounts.get('Melee Combat')).toBe(26);
    expect(categoryCounts.get('Ranged Combat')).toBe(17);
    expect(categoryCounts.get('Defensive')).toBe(21);
    expect(categoryCounts.get('Survival and Healing')).toBe(22);
    expect(categoryCounts.get('Perception')).toBe(25);
    expect(categoryCounts.get('Stealth')).toBe(6);
    expect(categoryCounts.get('Interaction and Knowledge')).toBe(24);
    expect(categoryCounts.get('Spirit and Sorcery')).toBe(9);
    expect(
      Array.from(categoryCounts.values()).reduce(
        (sum, count) => sum + count,
        0,
      ),
    ).toBe(219);
  });

  it('resolves every prerequisiteCharms entry to another id in the same catalog (no dangling references)', () => {
    for (const charm of lunarCharms) {
      for (const prerequisiteId of charm.prerequisiteCharms) {
        expect(lunarCharmById.has(prerequisiteId)).toBe(true);
      }
    }
  });

  it('never lists a Charm as its own prerequisite', () => {
    for (const charm of lunarCharms) {
      expect(charm.prerequisiteCharms).not.toContain(charm.id);
    }
  });

  it('excludes the ten Beastman Transformation "gift" sub-options as independently-purchasable Charms', () => {
    for (const giftId of [
      'horrifying-might',
      'bestial-reflexes',
      'lightning-speed',
      'spider-foot-climbing',
      'glue-foot-climbing',
      'gift-of-hands',
      'arm-array',
      'terrible-beast-claws',
      'savage-moonsilver-talons',
      'resilience-of-nature',
    ]) {
      expect(lunarCharmById.has(giftId)).toBe(false);
    }
    expect(lunarCharmById.has('deadly-beastman-transformation')).toBe(true);
  });

  it('handles the Ox-Body Technique "varies" minimum requirement with a documented baseline', () => {
    const ox = lunarCharmById.get('ox-body-technique');
    expect(ox).toBeDefined();
    expect(ox?.minimumRequirements).toEqual([{ trait: 'Stamina', rating: 1 }]);
    expect(ox?.reviewFlags.length).toBeGreaterThan(0);
  });

  it('resolves the Heightened (Sense) Method umbrella prerequisite for all three sensory-aspect dependents', () => {
    for (const id of [
      'fish-eye-technique',
      'night-is-day',
      'rabbit-ear-method',
      'comprehending-ears-meditation',
      'blood-kin-sense',
      'blood-on-the-wind',
      'emotion-revealing-scent',
    ]) {
      const charm = lunarCharmById.get(id);
      expect(charm).toBeDefined();
      expect(charm?.prerequisiteCharms).toContain('heightened-sense-method');
    }
  });

  it('strips the parenthetical tree annotation from the Coiled Cobra Stance prerequisite', () => {
    const charm = lunarCharmById.get('coiled-cobra-stance');
    expect(charm).toBeDefined();
    expect(charm?.prerequisiteCharms).toEqual(
      expect.arrayContaining(['snake-body-technique', 'deadly-viper-strike']),
    );
  });

  it('assigns Combo rules to every Charm', () => {
    for (const charm of lunarCharms) {
      expect(charm.comboRules).toBeDefined();
      expect(typeof charm.comboRules.eligible).toBe('boolean');
    }
  });

  it('marks the two Sorcery-circle-enabling Charms ineligible for Combos', () => {
    for (const id of [
      'terrestrial-circle-sorcery',
      'celestial-circle-sorcery',
    ]) {
      const charm = lunarCharmById.get(id);
      expect(charm).toBeDefined();
      expect(charm?.comboRules.eligible).toBe(false);
    }
  });

  it("includes the five Exalted Storyteller's Companion Sample Charms", () => {
    for (const id of [
      'tentacles',
      'summon-wild-beasts',
      'acid-spit',
      'mighty-thews',
      'strides-of-the-panther',
    ]) {
      const charm = lunarCharmById.get(id);
      expect(charm).toBeDefined();
      expect(charm?.charmCategory).toBe('Sample Charms');
      expect(charm?.sources[0]?.bookId).toBe('exalted-storytellers-companion');
    }
  });

  it('keeps category/element/style/ability as fixed placeholders for shape parity', () => {
    for (const charm of lunarCharms) {
      expect(charm.category).toBe('native');
      expect(charm.element).toBeNull();
      expect(charm.ability).toBeNull();
      expect(charm.style).toBeNull();
    }
  });
});
