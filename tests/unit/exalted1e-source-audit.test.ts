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
    // 219 = the promoted Charms in lunar-charms.json, as counted directly
    // from `src/games/exalted1e/reference/lunar-*.json` by this audit
    // script. This differs from `certification/lunar.json`'s own
    // `catalog.promotedEntries` (319), which also includes the 100
    // Phase 1a Backgrounds/Merits-Flaws rows, none of which live in a
    // `lunar-`-prefixed catalog file (Backgrounds live in `definitions.ts`;
    // Merits/Flaws live in the shared `dragonblooded-merits-flaws.json`),
    // so this audit script's file-glob does not count them -- matching
    // Abyssal's own 333-vs-505 and Sidereal's own 203-vs-370 precedent
    // above.
    expect(report.promotedEntries).toBe(219);
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
    // `catalog.promotedEntries` (370), which also includes the 94
    // Phase 2a Backgrounds/Merits/Flaws rows and the 73 Phase 2b Sorcery
    // spell rows, none of which live in a `sidereal-`-prefixed catalog
    // file (Backgrounds/Merits/Flaws live in `definitions.ts`/the shared
    // `dragonblooded-merits-flaws.json`; the 73 Sorcery spells are a
    // subset of the shared `dragonblooded-sorcery.json`), so this audit
    // script's file-glob does not count them -- matching Abyssal's own
    // 328-vs-500 precedent above.
    expect(report.promotedEntries).toBe(203);
    expect(report.catalogChecksum).toHaveLength(8);
    expect(report.catalogChecksum).toMatch(/^[0-9a-f]{8}$/);
  });

  it('reports Alchemical as pending-certification with its real inventory rows and zero audit errors', () => {
    // `alchemical-charms.json`, an OCR extraction with a majority of
    // entries sharing an identical generic description (not real
    // transcribed mechanics), lives in `./reference/ocr-drafts/` so it
    // falls outside this audit script's `${family}-*.json` promoted-
    // catalog glob, exactly like Lunar's own pre-Phase-1b draft (see the
    // comment above) -- Alchemical has no real promoted catalog yet.
    const report = auditFamily('alchemical');
    expect(report.status).toBe('pending-certification');
    expect(report.issues).toEqual([]);
    expect(report.inventoryRows).toBeGreaterThan(0);
    expect(report.promotedEntries).toBe(0);
    expect(report.catalogChecksum).toBe('');
  });

  it('reports Fair Folk as pending-certification with its real inventory rows and zero audit errors', () => {
    // `fair-folk-charms.json`, an OCR extraction with several garbled ids
    // that don't match this family's real inventory, lives in
    // `./reference/ocr-drafts/` so it falls outside this audit script's
    // `${family}-*.json` promoted-catalog glob, exactly like Lunar's own
    // pre-Phase-1b draft (see the comment above) -- Fair Folk has no real
    // promoted catalog yet.
    const report = auditFamily('fair-folk');
    expect(report.status).toBe('pending-certification');
    expect(report.issues).toEqual([]);
    expect(report.inventoryRows).toBeGreaterThan(0);
    expect(report.promotedEntries).toBe(0);
    expect(report.catalogChecksum).toBe('');
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
