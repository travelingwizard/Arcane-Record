import { describe, expect, it } from 'vitest';
import {
  fairFolkCharmById,
  fairFolkCharmCategories,
  fairFolkCharmIds,
  fairFolkCharms,
} from '../../src/games/exalted1e/reference/fair-folk-powers';

describe('Fair Folk Charm catalog (Phase 1b + Phase 1c + Phase 1d)', () => {
  it('loads all promoted Charm rows with unique stable IDs', () => {
    expect(fairFolkCharms).toHaveLength(51);
    expect(fairFolkCharmIds.size).toBe(51);
    expect(fairFolkCharmById.size).toBe(51);
  });

  it('assigns every Charm a valid category from the six documented Fair Folk Charm categories', () => {
    for (const charm of fairFolkCharms) {
      expect(fairFolkCharmCategories).toContain(charm.charmCategory);
    }
  });

  it('distributes Charms across the six categories with the expected counts', () => {
    const categoryCounts = new Map<string, number>();
    for (const charm of fairFolkCharms) {
      categoryCounts.set(
        charm.charmCategory,
        (categoryCounts.get(charm.charmCategory) ?? 0) + 1,
      );
    }
    expect(categoryCounts.get('Grace Forging')).toBe(19);
    expect(categoryCounts.get('Assumption')).toBe(8);
    expect(categoryCounts.get('Glamour Charms')).toBe(14);
    expect(categoryCounts.get('Mutation Charms')).toBe(3);
    expect(categoryCounts.get('Dodge Charms')).toBe(4);
    expect(categoryCounts.get('Resistance Charms')).toBe(3);
    expect(
      Array.from(categoryCounts.values()).reduce(
        (sum, count) => sum + count,
        0,
      ),
    ).toBe(51);
  });

  it('resolves every prerequisiteCharms entry to another id in the same catalog (no dangling references)', () => {
    for (const charm of fairFolkCharms) {
      for (const prerequisiteId of charm.prerequisiteCharms) {
        expect(fairFolkCharmById.has(prerequisiteId)).toBe(true);
      }
    }
  });

  it('never lists a Charm as its own prerequisite', () => {
    for (const charm of fairFolkCharms) {
      expect(charm.prerequisiteCharms).not.toContain(charm.id);
    }
  });

  it('keeps category/element/ability/style as fixed placeholders for shape parity', () => {
    for (const charm of fairFolkCharms) {
      expect(charm.category).toBe('native');
      expect(charm.element).toBeNull();
      expect(charm.ability).toBeNull();
      expect(charm.style).toBeNull();
    }
  });

  it('keys every Grace Forging/Glamour/Dodge/Resistance Charm to the Grace trait and rating actually named in its own requirements text, and every Assumption Charm to no Grace minimum at all', () => {
    for (const charm of fairFolkCharms) {
      if (
        charm.charmCategory === 'Grace Forging' ||
        charm.charmCategory === 'Glamour Charms'
      ) {
        expect(charm.minimumRequirements).toHaveLength(1);
        expect(['Ring', 'Staff']).toContain(
          charm.minimumRequirements[0]?.trait,
        );
      } else if (charm.charmCategory === 'Mutation Charms') {
        expect(charm.minimumRequirements).toHaveLength(1);
        expect(charm.minimumRequirements[0]?.trait).toBe('Sword');
      } else if (
        charm.charmCategory === 'Dodge Charms' ||
        charm.charmCategory === 'Resistance Charms'
      ) {
        expect(charm.minimumRequirements).toHaveLength(1);
        expect(charm.minimumRequirements[0]?.trait).toBe('Heart');
      } else {
        expect(charm.minimumRequirements).toEqual([]);
      }
    }
  });

  it('gates the three cross-Grace crossover Charms on Minimum Staff despite being diagrammed under the Ring tree', () => {
    const crossoverStaffMinimums: [string, number][] = [
      ['tainted-creature-command', 3],
      ['monstrous-conceit', 4],
      ['akshata-sexual-methodology', 2],
    ];
    for (const [id, rating] of crossoverStaffMinimums) {
      const charm = fairFolkCharmById.get(id);
      expect(charm).toBeDefined();
      expect(charm?.minimumRequirements).toEqual([{ trait: 'Staff', rating }]);
    }
  });

  it("resolves forging-the-heart-grace's real prerequisite (Shape-Forged Servant) now that Phase 1c promotes it into the same catalog", () => {
    const heartGrace = fairFolkCharmById.get('forging-the-heart-grace');
    expect(heartGrace).toBeDefined();
    expect(heartGrace?.prerequisiteCharms).toEqual(['shape-forged-servant']);
    expect(heartGrace?.prerequisiteText).toBe('Shape-Forged Servant');
    expect(heartGrace?.reviewFlags).toEqual([]);
  });

  it("keeps monstrous-conceit's other real prerequisite (Undetectable Lie) as advisory text only, since it falls outside this catalog's scope entirely", () => {
    const monstrousConceit = fairFolkCharmById.get('monstrous-conceit');
    expect(monstrousConceit).toBeDefined();
    expect(monstrousConceit?.prerequisiteCharms).toEqual(['glamour-charm']);
    expect(monstrousConceit?.prerequisiteText).toBe(
      'Undetectable Lie, Glamour',
    );
    expect(monstrousConceit?.reviewFlags.length).toBeGreaterThan(0);
  });

  it('chains the five parallel Freehold-anchor Charms off Forging the Arcane Redoubt and its paired Grace-Forging Charm', () => {
    const pairs: [string, string][] = [
      ['forging-the-stronghold', 'forging-the-sword-grace'],
      ['forging-the-glory', 'forging-the-cup-grace'],
      ['forging-the-fountainhead', 'forging-the-ring-grace'],
      ['forging-the-throne-room', 'forging-the-staff-grace'],
    ];
    for (const [anchorId, graceId] of pairs) {
      const anchor = fairFolkCharmById.get(anchorId);
      expect(anchor).toBeDefined();
      expect(anchor?.prerequisiteCharms).toEqual(
        expect.arrayContaining([graceId, 'forging-the-arcane-redoubt']),
      );
    }
  });

  it("chains the Assumption of the Land's/City's Heart line correctly", () => {
    expect(
      fairFolkCharmById.get('assumption-of-the-citys-heart')
        ?.prerequisiteCharms,
    ).toEqual(['assumption-of-the-lands-heart']);
    expect(
      fairFolkCharmById.get('assumption-of-the-living-kingdom')
        ?.prerequisiteCharms,
    ).toEqual(['assumption-of-the-lands-heart']);
    expect(
      fairFolkCharmById.get('assumption-of-the-wyld-tainted-land')
        ?.prerequisiteCharms,
    ).toEqual(['assumption-of-the-citys-heart']);
  });

  it('chains the Glamour Charms tree (Essence-/Gossamer-Forging Art roots converging on Glamour)', () => {
    expect(
      fairFolkCharmById.get('principle-of-worlds')?.prerequisiteCharms,
    ).toEqual(['essence-forging-art']);
    expect(
      fairFolkCharmById.get('gossamer-forging-art')?.prerequisiteCharms,
    ).toEqual(['essence-forging-art']);
    expect(
      fairFolkCharmById.get('translucent-dream-sheathing-technology')
        ?.prerequisiteCharms,
    ).toEqual(
      expect.arrayContaining(['gossamer-forging-art', 'principle-of-worlds']),
    );
    expect(fairFolkCharmById.get('glamour-charm')?.prerequisiteCharms).toEqual(
      expect.arrayContaining([
        'translucent-dream-sheathing-technology',
        'shape-forged-servant',
      ]),
    );
    expect(
      fairFolkCharmById.get('shape-forged-servant')?.prerequisiteCharms,
    ).toEqual(['awakened-dream-manufacture']);
  });

  it('chains the Greater Arts of Glamour tail Charms (Gaping Virtue Mouth branches, Great Works/Unshaped Transformation line, Behemoth-Forging Meditation capstone)', () => {
    expect(
      fairFolkCharmById.get('gaping-virtue-mouth')?.prerequisiteCharms,
    ).toEqual(
      expect.arrayContaining([
        'forging-the-cup-grace',
        'forging-the-ring-grace',
        'forging-the-staff-grace',
        'forging-the-sword-grace',
      ]),
    );
    for (const id of [
      'iron-nightmare-muzzle',
      'ecstatic-reproduction-style',
      'akshata-sexual-methodology',
    ]) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([
        'gaping-virtue-mouth',
      ]);
    }
    expect(
      fairFolkCharmById.get('great-works-of-the-grace')?.prerequisiteCharms,
    ).toEqual(['forging-the-heart-grace']);
    expect(
      fairFolkCharmById.get('unshaped-grace-transformation')
        ?.prerequisiteCharms,
    ).toEqual(['great-works-of-the-grace']);
    expect(
      fairFolkCharmById.get('extinction-of-desire')?.prerequisiteCharms,
    ).toEqual(['unshaped-grace-transformation']);
    expect(
      fairFolkCharmById.get('behemoth-forging-meditation')?.prerequisiteCharms,
    ).toEqual(
      expect.arrayContaining([
        'shape-forged-servant',
        'unshaped-grace-transformation',
      ]),
    );
  });

  it('keeps the three Pox/Affliction/Blight Charms independently purchasable with no prerequisites', () => {
    for (const id of ['pox-charm', 'affliction-charm', 'blight-charm']) {
      const charm = fairFolkCharmById.get(id);
      expect(charm).toBeDefined();
      expect(charm?.prerequisiteCharms).toEqual([]);
      expect(charm?.prerequisiteText).toBe('None');
    }
  });

  it("chains the Heart's Dodge Charms tree (Ill-Approving Eyes root converging through two branches into Howling Dream Consumption Prana)", () => {
    expect(
      fairFolkCharmById.get('ill-approving-eyes')?.prerequisiteCharms,
    ).toEqual([]);
    for (const id of [
      'assertion-of-a-greater-vision',
      'sapphire-emptiness-kata',
    ]) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([
        'ill-approving-eyes',
      ]);
    }
    expect(
      fairFolkCharmById.get('howling-dream-consumption-prana')
        ?.prerequisiteCharms,
    ).toEqual(
      expect.arrayContaining([
        'assertion-of-a-greater-vision',
        'sapphire-emptiness-kata',
      ]),
    );
  });

  it("chains the Heart's Resistance Charms tree (Writhing Ego Evasion root branching into two independent leaves)", () => {
    expect(
      fairFolkCharmById.get('writhing-ego-evasion')?.prerequisiteCharms,
    ).toEqual([]);
    for (const id of ['swallowed-grace-defense', 'pyre-of-dreams-defense']) {
      expect(fairFolkCharmById.get(id)?.prerequisiteCharms).toEqual([
        'writhing-ego-evasion',
      ]);
    }
  });

  it('assigns Combo-eligibility rules to every Charm, defaulting to eligible with no explicit overrides this phase', () => {
    for (const charm of fairFolkCharms) {
      expect(charm.comboRules).toBeDefined();
      expect(charm.comboRules.eligible).toBe(true);
      expect(charm.comboRules.restrictions).toEqual([]);
    }
  });

  it('cites Exalted: The Fair Folk as the source for every Charm', () => {
    for (const charm of fairFolkCharms) {
      expect(charm.sources[0]?.bookId).toBe('exalted-the-fair-folk');
      expect(charm.sourceDisplay).toContain('Exalted: The Fair Folk');
    }
  });

  it('marks every Charm source-checked with no outstanding ordinary review gaps beyond the explicitly flagged ones', () => {
    for (const charm of fairFolkCharms) {
      expect(charm.reviewStatus).toBe('source-checked');
    }
    const flagged = fairFolkCharms.filter(
      (charm) => charm.reviewFlags.length > 0,
    );
    expect(flagged.map((charm) => charm.id).sort()).toEqual(
      [
        'affliction-charm',
        'akshata-sexual-methodology',
        'assumption-of-dreams-and-passion',
        'assumption-of-elemental-shape',
        'assumption-of-the-lands-heart',
        'assumption-of-the-wyld-tainted-land',
        'blight-charm',
        'burden-ghost-glamour',
        'extinction-of-desire',
        'forging-the-way-grace',
        'glamour-charm',
        'great-works-of-the-grace',
        'monstrous-conceit',
        'pox-charm',
        'tainted-creature-command',
        'unshaped-grace-transformation',
      ].sort(),
    );
  });
});
