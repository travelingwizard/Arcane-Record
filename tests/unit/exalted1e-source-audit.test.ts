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

describe('auditFamily against the real repository (current pre-source state)', () => {
  it('reports every planned family as pending-source-material with zero errors', () => {
    for (const family of PLANNED_EXALTED_FAMILIES) {
      const report = auditFamily(family);
      expect(report.status).toBe('pending-source-material');
      expect(report.issues).toEqual([]);
      expect(report.inventoryRows).toBe(0);
    }
  });
});
