import { describe, expect, it } from 'vitest';
import greatCurse from '../../src/games/exalted1e/reference/lunar-great-curse.json';
import shapechangingRules from '../../src/games/exalted1e/reference/lunar-shapechanging-rules.json';
import { exaltedVirtues } from '../../src/games/exalted1e/definitions';
import { auditFamily } from '../../scripts/audit-exalted-sources.mjs';

describe('Lunar Great Curse / Shapechanging rules catalogs (Phase 1c)', () => {
  it('promotes exactly 5 Great Curse rows: the overview plus the four Virtue-linked thralls', () => {
    expect(greatCurse).toHaveLength(5);
    const ids = new Set((greatCurse as { id: string }[]).map((e) => e.id));
    expect(ids.size).toBe(5);
    expect(ids.has('the-great-curse')).toBe(true);
  });

  it('assigns each thrall a unique Virtue id covering all four Virtues, and leaves the overview row unassigned', () => {
    const entries = greatCurse as { id: string; virtueId: string | null }[];
    const overview = entries.find((e) => e.id === 'the-great-curse');
    expect(overview?.virtueId).toBeNull();
    const thrallVirtueIds = entries
      .filter((e) => e.id !== 'the-great-curse')
      .map((e) => e.virtueId);
    expect(new Set(thrallVirtueIds)).toEqual(
      new Set(exaltedVirtues.map((v) => v.id)),
    );
  });

  it('cites Exalted: The Lunars for every Great Curse row', () => {
    for (const entry of greatCurse as { citation: { bookId: string } }[]) {
      expect(entry.citation.bookId).toBe('exalted-the-lunars');
    }
  });

  it('promotes exactly 2 Shapechanging rules rows, excluding the reference-only Regions sidebar', () => {
    expect(shapechangingRules).toHaveLength(2);
    const ids = new Set(
      (shapechangingRules as { id: string }[]).map((e) => e.id),
    );
    expect(ids).toEqual(new Set(['lunar-shapechanging', 'the-tell']));
    expect(ids.has('lunar-regions-guide')).toBe(false);
  });

  it("passes the real source audit's promoted-catalog cross-check with zero issues", () => {
    const report = auditFamily('lunar');
    expect(report.issues).toEqual([]);
    expect(report.promotedEntries).toBeGreaterThanOrEqual(226);
  });
});
