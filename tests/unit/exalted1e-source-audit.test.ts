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
    const report = auditFamily('lunar');
    expect(report.status).toBe('pending-certification');
    expect(report.issues).toEqual([]);
    expect(report.inventoryRows).toBeGreaterThan(0);
    expect(report.promotedEntries).toBe(0);
  });

  it('reports Abyssal as pending-certification with its real inventory rows and zero audit errors', () => {
    const report = auditFamily('abyssal');
    expect(report.status).toBe('pending-certification');
    expect(report.issues).toEqual([]);
    expect(report.inventoryRows).toBeGreaterThan(0);
    // 328 = 225 promoted Charms (abyssal-charms.json) + 103 promoted
    // Necromancy spells (abyssal-necromancy.json), as counted directly from
    // `src/games/exalted1e/reference/abyssal-*.json` by this audit script.
    // This differs from `certification/abyssal.json`'s own
    // `catalog.promotedEntries` (414), which also includes the 86 Phase 1a
    // Backgrounds/Merits/Flaws rows that live in catalogs not prefixed
    // `abyssal-` (e.g. the shared `dragonblooded-merits-flaws.json`), so
    // this audit script's file-glob does not count them.
    expect(report.promotedEntries).toBe(328);
  });

  it('reports Sidereal as pending-certification with its real inventory rows and zero audit errors', () => {
    const report = auditFamily('sidereal');
    expect(report.status).toBe('pending-certification');
    expect(report.issues).toEqual([]);
    expect(report.inventoryRows).toBeGreaterThan(0);
    expect(report.promotedEntries).toBe(0);
  });

  it('reports Alchemical as pending-certification with its real inventory rows and zero audit errors', () => {
    const report = auditFamily('alchemical');
    expect(report.status).toBe('pending-certification');
    expect(report.issues).toEqual([]);
    expect(report.inventoryRows).toBeGreaterThan(0);
    expect(report.promotedEntries).toBe(0);
  });

  it('reports Fair Folk as pending-certification with its real inventory rows and zero audit errors', () => {
    const report = auditFamily('fair-folk');
    expect(report.status).toBe('pending-certification');
    expect(report.issues).toEqual([]);
    expect(report.inventoryRows).toBeGreaterThan(0);
    expect(report.promotedEntries).toBe(0);
  });
});
