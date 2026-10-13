import { describe, expect, it } from 'vitest';
import {
  auditInventoryRows,
  auditPromotedCatalog,
  computeChecksum,
  PLANNED_EXALTED_FAMILIES,
  auditFamily,
  type InventoryRow,
} from '../../scripts/audit-exalted-sources.mjs';

function baseRow(overrides: Partial<InventoryRow> = {}): InventoryRow {
  return {
    id: 'row-one',
    name: 'Row One',
    disposition: 'selectable',
    summary: 'A test row.',
    verificationState: 'reviewed',
    citation: { bookId: 'test-book', printedPage: 12 },
    ...overrides,
  };
}

describe('auditInventoryRows', () => {
  it('accepts a clean, well-formed inventory with no issues', () => {
    const issues = auditInventoryRows([baseRow(), baseRow({ id: 'row-two' })], {
      sourceManifestBookIds: new Set(['test-book']),
    });
    expect(issues).toEqual([]);
  });

  it('flags a duplicate id', () => {
    const issues = auditInventoryRows([baseRow(), baseRow()]);
    expect(
      issues.some((issue) => issue.message.includes('Duplicate inventory id')),
    ).toBe(true);
  });

  it('flags a missing disposition', () => {
    const issues = auditInventoryRows([baseRow({ disposition: undefined })]);
    expect(
      issues.some((issue) => issue.message.includes('no disposition')),
    ).toBe(true);
  });

  it('flags an unknown disposition', () => {
    const issues = auditInventoryRows([baseRow({ disposition: 'maybe' })]);
    expect(
      issues.some((issue) => issue.message.includes('unknown disposition')),
    ).toBe(true);
  });

  it('flags a missing citation', () => {
    const issues = auditInventoryRows([baseRow({ citation: undefined })]);
    expect(
      issues.some((issue) =>
        issue.message.includes('missing a source citation'),
      ),
    ).toBe(true);
  });

  it('flags a citation with a book ID not in the source manifest', () => {
    const issues = auditInventoryRows([baseRow()], {
      sourceManifestBookIds: new Set(['some-other-book']),
    });
    expect(
      issues.some((issue) => issue.message.includes('unknown source book')),
    ).toBe(true);
  });

  it('flags an invalid cross-reference', () => {
    const issues = auditInventoryRows([
      baseRow({ crossReferences: ['does-not-exist'] }),
    ]);
    expect(
      issues.some((issue) => issue.message.includes('unresolved/unknown id')),
    ).toBe(true);
  });

  it('accepts a valid cross-reference to another row in the same family', () => {
    const issues = auditInventoryRows([
      baseRow({ crossReferences: ['row-two'] }),
      baseRow({ id: 'row-two' }),
    ]);
    expect(issues).toEqual([]);
  });
});

describe('auditPromotedCatalog', () => {
  it('flags a promoted entry with no matching inventory row', () => {
    const issues = auditPromotedCatalog([{ id: 'ghost-entry' }], []);
    expect(
      issues.some((issue) =>
        issue.message.includes('no matching inventory row'),
      ),
    ).toBe(true);
  });

  it('flags a promoted entry whose inventory row is unreviewed', () => {
    const issues = auditPromotedCatalog(
      [{ id: 'row-one' }],
      [baseRow({ verificationState: 'unreviewed' })],
    );
    expect(
      issues.some((issue) =>
        issue.message.includes('not completed visual source review'),
      ),
    ).toBe(true);
  });

  it('flags a promoted entry whose disposition should not have been promoted', () => {
    const issues = auditPromotedCatalog(
      [{ id: 'row-one' }],
      [baseRow({ disposition: 'reference-only' })],
    );
    expect(
      issues.some((issue) => issue.message.includes('must not be promoted')),
    ).toBe(true);
  });

  it('accepts a promoted, reviewed, selectable entry', () => {
    const issues = auditPromotedCatalog([{ id: 'row-one' }], [baseRow()]);
    expect(issues).toEqual([]);
  });
});

describe('computeChecksum', () => {
  it('is deterministic for equal input', () => {
    const value = [{ id: 'a' }, { id: 'b' }];
    expect(computeChecksum(value)).toBe(computeChecksum(value));
  });

  it('differs for different input', () => {
    expect(computeChecksum([{ id: 'a' }])).not.toBe(
      computeChecksum([{ id: 'b' }]),
    );
  });
});

describe('auditFamily against the real repository (current state)', () => {
  // All five planned families now have supplied source material and real
  // inventory rows (see docs/18-exalted1e-splat-release.md's status table).
  // This set exists so a future sixth family (none is planned) or a family
  // whose inventory directory is deleted would still be caught below as
  // pending-source-material instead of silently passing.
  const familiesWithInventory = new Set([
    'lunar',
    'abyssal',
    'sidereal',
    'alchemical',
    'fair-folk',
  ]);

  it('reports every planned family as having inventory now (none left pending-source-material)', () => {
    for (const family of PLANNED_EXALTED_FAMILIES) {
      if (familiesWithInventory.has(family)) continue;
      const report = auditFamily(family);
      expect(report.status).toBe('pending-source-material');
      expect(report.issues).toEqual([]);
      expect(report.inventoryRows).toBe(0);
    }
    expect(
      PLANNED_EXALTED_FAMILIES.every((family) =>
        familiesWithInventory.has(family),
      ),
    ).toBe(true);
  });

  it('reports Lunar as pending-certification with its real inventory rows and zero audit errors', () => {
    // An earlier, pre-governance raw OCR extraction with garbled ids that
    // don't match this family's real inventory still lives in
    // `./reference/ocr-drafts/lunar-charms.json` specifically so it falls
    // outside this audit script's `${family}-*.json` promoted-catalog glob
    // (which only scans `src/games/exalted1e/reference/` directly, not its
    // `ocr-drafts/` subdirectory) -- it was never promoted and is kept only
    // as a historical artifact. Phase 1b's own real, source-checked
    // `lunar-charms.json` (219 Charms, built from the reviewed inventory,
    // not that old draft) now lives at the top level and is the one this
    // audit script counts.
    const report = auditFamily('lunar');
    expect(report.status).toBe('pending-certification');
    expect(report.issues).toEqual([]);
    expect(report.inventoryRows).toBeGreaterThan(0);
    // 226 = 219 promoted Charms (lunar-charms.json) + 5 promoted Great
    // Curse rows (lunar-great-curse.json: the overview plus the four
    // Virtue-linked thralls) + 2 promoted Shapechanging rules rows
    // (lunar-shapechanging-rules.json: the innate Shapechanging power and
    // The Tell -- the Regions sidebar is deliberately excluded, since its
    // inventory `disposition` is `reference-only`, which this audit
    // script's own promotion check forbids promoting), as counted
    // directly from `src/games/exalted1e/reference/lunar-*.json` by this
    // audit script. This differs from `certification/lunar.json`'s own
    // `catalog.promotedEntries` (412), which also includes the 100
    // Phase 1a Backgrounds/Merits-Flaws rows (none of which live in a
    // `lunar-`-prefixed catalog file -- Backgrounds live in `definitions.ts`;
    // Merits/Flaws live in the shared `dragonblooded-merits-flaws.json`)
    // and all 86 Sorcery spells (Phase 1d's 73 plus the 13 the
    // `unreviewed_spells` follow-up phase later promoted), which also
    // reuse the shared `dragonblooded-sorcery.json` rather than a
    // `lunar-`-prefixed file (see `lunarSorcerySpellIds` in
    // `lunar-powers.ts`), so this audit script's file-glob does not count
    // either -- matching Abyssal's own 333-vs-505 and Sidereal's own
    // 203-vs-383 precedent above.
    expect(report.promotedEntries).toBe(226);
    expect(report.catalogChecksum).toHaveLength(8);
    expect(report.catalogChecksum).toMatch(/^[0-9a-f]{8}$/);
  });

  it('reports Abyssal as pending-certification with its real inventory rows and zero audit errors', () => {
    const report = auditFamily('abyssal');
    expect(report.status).toBe('pending-certification');
    expect(report.issues).toEqual([]);
    expect(report.inventoryRows).toBeGreaterThan(0);
    // 333 = 227 promoted Charms (abyssal-charms.json) + 106 promoted
    // Necromancy spells (abyssal-necromancy.json), as counted directly from
    // `src/games/exalted1e/reference/abyssal-*.json` by this audit script
    // (Phase 1e promoted the last 5 previously held-back rows: two
    // unreviewed Day Caste Charms, one unreviewed core-book spell, and two
    // unresolved-for-missing-cost Book of Bone and Ebony spells). This
    // differs from `certification/abyssal.json`'s own
    // `catalog.promotedEntries` (505), which also includes the 80 Phase 1a
    // Merits/Flaws rows, 6 Backgrounds rows, and 86 Phase 1c Sorcery-spell
    // rows that live in catalogs not prefixed `abyssal-` (e.g. the shared
    // `dragonblooded-merits-flaws.json`/`dragonblooded-sorcery.json`), so
    // this audit script's file-glob does not count them. `catalogChecksum`
    // covers only this narrower, file-glob-scoped 333-entry set for the
    // same reason -- see `certification/abyssal.json`'s notes.
    expect(report.promotedEntries).toBe(333);
    expect(report.catalogChecksum).toHaveLength(8);
    expect(report.catalogChecksum).toMatch(/^[0-9a-f]{8}$/);
  });

  it('reports Sidereal as pending-certification with its real inventory rows and zero audit errors', () => {
    const report = auditFamily('sidereal');
    expect(report.status).toBe('pending-certification');
    expect(report.issues).toEqual([]);
    expect(report.inventoryRows).toBeGreaterThan(0);
    // 203 = the 193 promoted Charms in sidereal-charms.json plus the 10
    // promoted Astrology/Colleges procedural-rules rows (Phase: Astrology/
    // Colleges) in sidereal-astrology-rules.json, as counted directly
    // from `src/games/exalted1e/reference/sidereal-*.json` by this audit
    // script. This differs from `certification/sidereal.json`'s own
    // `catalog.promotedEntries` (383), which also includes the 94
    // Phase 2a Backgrounds/Merits/Flaws rows and all 86 Sorcery spell rows
    // (Phase 2b's 73 plus the 13 the `sidereal_unreviewed_spells`
    // follow-up phase later promoted), none of which live in a
    // `sidereal-`-prefixed catalog file (Backgrounds/Merits/Flaws live in
    // `definitions.ts`/the shared `dragonblooded-merits-flaws.json`; the
    // Sorcery spells are a subset of the shared
    // `dragonblooded-sorcery.json`), so this audit script's file-glob does
    // not count them -- matching Abyssal's own 328-vs-500 precedent above.
    expect(report.promotedEntries).toBe(203);
    expect(report.catalogChecksum).toHaveLength(8);
    expect(report.catalogChecksum).toMatch(/^[0-9a-f]{8}$/);
  });

  it('reports Alchemical as pending-certification with its real inventory rows and zero audit errors', () => {
    // 137 = the 96 real, page-cited, visually-reviewed Charms promoted in
    // `alchemical-charms.json` (Phase 1b) plus the 38 Weaving Protocols in
    // `alchemical-weaving-protocols.json` and the 3 Alchemy Formulae in
    // `alchemical-formulae.json` (both Phase 1c), as counted directly from
    // `src/games/exalted1e/reference/alchemical-*.json` by this audit
    // script. The stale `./reference/ocr-drafts/alchemical-charms.json`
    // draft (87 rows, a majority sharing an identical generic description,
    // not real transcribed mechanics) remains outside this glob and
    // unwired, exactly as before. This differs from
    // `certification/alchemical.json`'s own `catalog.promotedEntries`
    // (214), which also includes Phase 1a's 77 Backgrounds/Merits-Flaws
    // rows, none of which live in an `alchemical-`-prefixed catalog file
    // (Backgrounds live in `definitions.ts`; Merits/Flaws are a subset of
    // the shared `dragonblooded-merits-flaws.json`), so this audit
    // script's file-glob does not count them -- matching Sidereal's and
    // Abyssal's own identical precedent above.
    const report = auditFamily('alchemical');
    expect(report.status).toBe('pending-certification');
    expect(report.issues).toEqual([]);
    expect(report.inventoryRows).toBeGreaterThan(0);
    expect(report.promotedEntries).toBe(137);
    expect(report.catalogChecksum).toHaveLength(8);
    expect(report.catalogChecksum).toMatch(/^[0-9a-f]{8}$/);
  });

  it('reports Fair Folk as pending-certification with its real inventory rows and zero audit errors', () => {
    // 234 = the 201 real, page-cited, visually-reviewed Charms promoted in
    // `fair-folk-charms.json` (19 Grace-Forging/Assumption from Phase 1b,
    // 25 Glamour/Grace-Forging/Mutation Charms from Phase 1c, 7
    // Dodge/Resistance Charms from Phase 1d, 19 Cup Combat Charms from
    // Phase 1e, 22 Ring Combat Charms/All-Consuming God-Monster Style
    // Charms from Phase 1f, 12 Laughing Monster Style/Society-Forging
    // Charms from Phase 1g, 27 Sword Combat Charms from Phase 1h, 12
    // more Mutation Charms from Phase 1i, 7 Name/Bedlam-Influencing
    // Charms from Phase 1j, 13 more Assumption/Elemental-Influence/
    // Emotional-Influence Charms from Phase 1k (Mad God Mien, the
    // three-branch Elemental Influence tree converging at Mercurial
    // Shape, and the two-branch Emotional Influence tree), 9 more
    // Feeding Charms from Phase 1l (the Cup's own tree, rooted at
    // Ravishing the Created Form and ending at the capstone
    // Demesne-Farming Art), 4 more Addiction Charms from Phase 1m (two
    // parallel roots, Shiftless Untamed Beauty and Maddening Summons,
    // converging at the capstone Whispers Behind the Eyes via
    // Compelling Presence), 11 more World-Shaping Charms from
    // Phase 1n (two independent roots, Gladdening Visage and Heaven
    // Rains Wisdom, converging through three shared prerequisites onto
    // twin capstones Abiding Gift/Curse of Definition), 5 more
    // Virtue-Shaping Charms from Phase 1o (rooted at Unsightly Rigor
    // Approach, branching into Wyld Prince Resilience and Manacles of
    // Virtue, the latter continuing to Chaotic Soul Sledgehammer and
    // the capstone Torn Spirit-Mending Technique -- this closes out
    // the entire Cup Grace tree), 8 more Body-Strengthening
    // Charms/Creation-Based Crafting Charms from Phase 1p (a 4-Charm
    // Body-Strengthening chain plus the standalone Ox-Body Technique,
    // and a Creation-Based Crafting tree rooted at Ordinary Object
    // Conjuration), and 1 more Way Charm from Phase 1q (the standalone
    // Perfect Reckoning Technique, the last Charm in Chapter Five,
    // gated on the exotic sixth Way Grace -- this closes out this
    // family's entire real Charm section)), the 6 Graces rows in
    // `fair-folk-graces.json`, the 5 Bedlam rows in
    // `fair-folk-bedlam.json` (all Phase 1b), the 7 Glamour Sorcery
    // rows in `fair-folk-glamour-sorcery.json` from Phase 1r (the
    // overview and countermagic-sidebar framework rows plus all 5
    // Circle tiers -- Waking/Dreaming/Desire/Samadhi/Shinma -- promoted
    // as reference-only documentation, since Glamour Sorcery is a
    // point-buy "build a custom spell with mutation points, bought via
    // the Artifact Background" system rather than a fixed spell list,
    // with no `definitionId`-style pick to make yet), the 7
    // Adjurations rows in `fair-folk-adjurations.json` from Phase 1s
    // (the general Oaths-mechanic row, the Adjurations-overview
    // framework row, and all 5 oath tiers -- Samhara/Sthiti/Anugraha/
    // Tirobhava/Srishti -- promoted the same reference-only way, since
    // Adjurations are structurally the same point-buy system as Glamour
    // Sorcery, just bound to oaths instead of spells), and the 4
    // Behemoths rows in `fair-folk-behemoths.json` from Phase 1t (the
    // Behemoths-overview framework row plus the three generic behemoth
    // tiers -- Fey Beast/Daikaiju/Deep Wyld Horror -- promoted the same
    // reference-only way, since Behemoths are structurally the same
    // point-buy system too, just bound to monsters instead of spells or
    // oaths; the unique, story-specific `ishiika` row stays unpromoted,
    // its `gm-only` disposition correctly excluded), and the 4 Wyld
    // Artifacts rows in a post-certification addition's
    // `fair-folk-wyld-artifacts.json` (the overview framework row plus
    // the three named items -- Resonant Chorus Bow/Hundred Color Shaping
    // Lens/Artifact Waypoint -- promoted the same reference-only way,
    // reversing Phase 1u's prior decision to exclude them once this
    // app's `exaltedWeaponCatalog` was found to have no per-family
    // restriction mechanism suitable for raksha-only items), as counted
    // directly from `src/games/exalted1e/reference/fair-folk-*.json` by
    // this audit script. The stale `./reference/ocr-drafts/fair-folk-charms.json`
    // draft (a raw OCR extraction with several garbled ids that don't
    // match this family's real inventory) remains outside this glob and
    // unwired, exactly matching Alchemical's own identical precedent
    // above. This differs from `certification/fair-folk.json`'s own
    // `catalog.promotedEntries` (322), which also includes Phase 1a's 88
    // Backgrounds/Merits-Flaws rows, none of which live in a
    // `fair-folk-`-prefixed catalog file (Backgrounds live in
    // `definitions.ts`; Merits/Flaws are a subset of the shared
    // `dragonblooded-merits-flaws.json`), so this audit script's
    // file-glob does not count them -- matching Sidereal's, Abyssal's,
    // and Alchemical's own identical precedent above.
    const report = auditFamily('fair-folk');
    expect(report.status).toBe('pending-certification');
    expect(report.issues).toEqual([]);
    expect(report.inventoryRows).toBeGreaterThan(0);
    expect(report.promotedEntries).toBe(234);
    expect(report.catalogChecksum).toHaveLength(8);
    expect(report.catalogChecksum).toMatch(/^[0-9a-f]{8}$/);
  });

  it('computes a stable catalog checksum for Abyssal that changes if the promoted catalog changes', () => {
    const first = auditFamily('abyssal');
    const second = auditFamily('abyssal');
    expect(first.catalogChecksum).toBe(second.catalogChecksum);
    expect(first.catalogChecksum).not.toBe(
      computeChecksum([{ id: 'not-the-real-catalog' }]),
    );
  });
});
