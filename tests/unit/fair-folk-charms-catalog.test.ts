import { describe, expect, it } from 'vitest';
import {
  fairFolkCharmById,
  fairFolkCharmCategories,
  fairFolkCharmIds,
  fairFolkCharms,
} from '../../src/games/exalted1e/reference/fair-folk-powers';

describe('Fair Folk Charm catalog (Phase 1b)', () => {
  it('loads all promoted Charm rows with unique stable IDs', () => {
    expect(fairFolkCharms).toHaveLength(19);
    expect(fairFolkCharmIds.size).toBe(19);
    expect(fairFolkCharmById.size).toBe(19);
  });

  it('assigns every Charm a valid category from the two documented Fair Folk Charm categories', () => {
    for (const charm of fairFolkCharms) {
      expect(fairFolkCharmCategories).toContain(charm.charmCategory);
    }
  });

  it('distributes Charms across the two categories with the expected counts', () => {
    const categoryCounts = new Map<string, number>();
    for (const charm of fairFolkCharms) {
      categoryCounts.set(
        charm.charmCategory,
        (categoryCounts.get(charm.charmCategory) ?? 0) + 1,
      );
    }
    expect(categoryCounts.get('Grace Forging')).toBe(11);
    expect(categoryCounts.get('Assumption')).toBe(8);
    expect(
      Array.from(categoryCounts.values()).reduce(
        (sum, count) => sum + count,
        0,
      ),
    ).toBe(19);
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

  it('keys every Grace Forging Charm to a Ring Grace minimum of 0 or 2, and every Assumption Charm to no Grace minimum at all', () => {
    for (const charm of fairFolkCharms) {
      if (charm.charmCategory === 'Grace Forging') {
        expect(charm.minimumRequirements).toHaveLength(1);
        expect(charm.minimumRequirements[0]?.trait).toBe('Ring');
        expect([0, 2]).toContain(charm.minimumRequirements[0]?.rating);
      } else {
        expect(charm.minimumRequirements).toEqual([]);
      }
    }
  });

  it("keeps forging-the-heart-grace's real prerequisite (Shape-Forged Servant) as advisory text only, since it falls outside this phase's 19-entry scope", () => {
    const heartGrace = fairFolkCharmById.get('forging-the-heart-grace');
    expect(heartGrace).toBeDefined();
    expect(heartGrace?.prerequisiteCharms).toEqual([]);
    expect(heartGrace?.prerequisiteText).toBe('Shape-Forged Servant');
    expect(heartGrace?.reviewFlags.length).toBeGreaterThan(0);
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

  it('marks every Charm source-checked with no outstanding ordinary review gaps beyond the two explicitly flagged ones', () => {
    for (const charm of fairFolkCharms) {
      expect(charm.reviewStatus).toBe('source-checked');
    }
    const flagged = fairFolkCharms.filter(
      (charm) => charm.reviewFlags.length > 0,
    );
    expect(flagged.map((charm) => charm.id).sort()).toEqual(
      [
        'assumption-of-dreams-and-passion',
        'assumption-of-elemental-shape',
        'assumption-of-the-lands-heart',
        'assumption-of-the-wyld-tainted-land',
        'forging-the-heart-grace',
        'forging-the-way-grace',
      ].sort(),
    );
  });
});
