import { describe, expect, it } from 'vitest';
import {
  alchemicalCharmById,
  alchemicalCharmCategories,
  alchemicalCharmIds,
  alchemicalCharms,
} from '../../src/games/exalted1e/reference/alchemical-powers';

describe('Alchemical Charm catalog (Phase 1b)', () => {
  it('loads all promoted Charm rows with unique stable IDs', () => {
    expect(alchemicalCharms).toHaveLength(96);
    expect(alchemicalCharmIds.size).toBe(96);
    expect(alchemicalCharmById.size).toBe(96);
  });

  it('assigns every Charm a valid category from the documented Alchemical Charm categories', () => {
    for (const charm of alchemicalCharms) {
      expect(alchemicalCharmCategories).toContain(charm.charmCategory);
    }
  });

  it('distributes Charms across all documented categories with the expected counts', () => {
    const categoryCounts = new Map<string, number>();
    for (const charm of alchemicalCharms) {
      categoryCounts.set(
        charm.charmCategory,
        (categoryCounts.get(charm.charmCategory) ?? 0) + 1,
      );
    }
    expect(categoryCounts.get('General Charms')).toBe(2);
    expect(categoryCounts.get('Close Combat Charms')).toBe(15);
    expect(categoryCounts.get('Ranged Combat Charms')).toBe(11);
    expect(categoryCounts.get('Might and Mobility Charms')).toBe(14);
    expect(categoryCounts.get('Social Charms')).toBe(12);
    expect(categoryCounts.get('Stealth and Disguise Charms')).toBe(9);
    expect(categoryCounts.get('Sensory and Spiritual Charms')).toBe(10);
    expect(categoryCounts.get('Medical Charms')).toBe(11);
    expect(categoryCounts.get('Cognitive Charms')).toBe(9);
    expect(categoryCounts.get('Essence and Weaving Charms')).toBe(3);
    expect(
      Array.from(categoryCounts.values()).reduce(
        (sum, count) => sum + count,
        0,
      ),
    ).toBe(96);
  });

  it('resolves every prerequisiteCharms entry to another id in the same catalog (no dangling references)', () => {
    for (const charm of alchemicalCharms) {
      for (const prerequisiteId of charm.prerequisiteCharms) {
        expect(alchemicalCharmById.has(prerequisiteId)).toBe(true);
      }
    }
  });

  it('never lists a Charm as its own prerequisite', () => {
    for (const charm of alchemicalCharms) {
      expect(charm.prerequisiteCharms).not.toContain(charm.id);
    }
  });

  it('keeps category/element/style/ability as fixed placeholders for shape parity', () => {
    for (const charm of alchemicalCharms) {
      expect(charm.category).toBe('native');
      expect(charm.element).toBeNull();
      expect(charm.ability).toBeNull();
      expect(charm.style).toBeNull();
    }
  });

  it('keys every Charm but one to a governing Attribute rather than an Ability', () => {
    const attributes = new Set([
      'Strength',
      'Dexterity',
      'Stamina',
      'Charisma',
      'Manipulation',
      'Appearance',
      'Perception',
      'Intelligence',
      'Wits',
      '(Attribute)',
    ]);
    const abilityKeyed = alchemicalCharms.filter(
      (charm) =>
        !charm.minimumRequirements.every((req) => attributes.has(req.trait)),
    );
    expect(abilityKeyed.map((charm) => charm.id)).toEqual([
      'perfected-lotus-matrix',
    ]);
    expect(abilityKeyed[0]?.minimumRequirements).toEqual([
      { trait: 'Martial Arts', rating: 2 },
    ]);
  });

  it('collapses the templated per-Attribute Augmentation Charms into single rows rather than fabricating nine near-duplicates each', () => {
    for (const id of [
      'transitory-augmentation-of-attribute',
      'sustained-augmentation-of-attribute',
    ]) {
      const charm = alchemicalCharmById.get(id);
      expect(charm).toBeDefined();
      expect(charm?.minimumRequirements).toEqual([
        { trait: '(Attribute)', rating: id.startsWith('transitory') ? 1 : 2 },
      ]);
    }
    const materialCharm = alchemicalCharmById.get(
      'material-synthesis-wave-emitter',
    );
    expect(materialCharm).toBeDefined();
    expect(materialCharm?.description).toContain('six Charms in one family');
  });

  it('assigns Array-eligibility Combo rules to every Charm', () => {
    for (const charm of alchemicalCharms) {
      expect(charm.comboRules).toBeDefined();
      expect(typeof charm.comboRules.eligible).toBe('boolean');
    }
  });

  it('marks the explicitly Array-barred Charms ineligible', () => {
    for (const id of [
      'perfected-lotus-matrix',
      'auxiliary-essence-storage-unit',
      'man-machine-weaving-engine',
      'god-machine-weaving-engine',
    ]) {
      const charm = alchemicalCharmById.get(id);
      expect(charm).toBeDefined();
      expect(charm?.comboRules.eligible).toBe(false);
    }
  });

  it('defaults every other Charm to Array-eligible', () => {
    const barred = new Set([
      'perfected-lotus-matrix',
      'auxiliary-essence-storage-unit',
      'man-machine-weaving-engine',
      'god-machine-weaving-engine',
    ]);
    for (const charm of alchemicalCharms) {
      if (barred.has(charm.id)) continue;
      expect(charm.comboRules.eligible).toBe(true);
    }
  });

  it('gates the two Essence and Weaving "engine" Charms behind the correct prerequisite and Clarity cost', () => {
    const manMachine = alchemicalCharmById.get('man-machine-weaving-engine');
    const godMachine = alchemicalCharmById.get('god-machine-weaving-engine');
    expect(manMachine).toBeDefined();
    expect(godMachine).toBeDefined();
    expect(manMachine?.prerequisiteCharms).toEqual([]);
    expect(godMachine?.prerequisiteCharms).toEqual(
      expect.arrayContaining([
        'auxiliary-essence-storage-unit',
        'man-machine-weaving-engine',
      ]),
    );
    expect(manMachine?.description).toContain('permanent Clarity');
    expect(godMachine?.description).toContain('permanent Clarity');
  });

  it('resolves "Transitory or Sustained Augmentation of (Attribute)" prerequisites to both templated Charm ids', () => {
    const charm = alchemicalCharmById.get('tactical-analysis-engrams');
    expect(charm).toBeDefined();
    expect(charm?.prerequisiteCharms).toEqual(
      expect.arrayContaining([
        'transitory-augmentation-of-attribute',
        'sustained-augmentation-of-attribute',
      ]),
    );
  });

  it('cites Exalted: The Autochthonians as the source for every Charm', () => {
    for (const charm of alchemicalCharms) {
      expect(charm.sources[0]?.bookId).toBe('exalted-the-autochthonians');
      expect(charm.sourceDisplay).toContain('Exalted: The Autochthonians');
    }
  });
});
