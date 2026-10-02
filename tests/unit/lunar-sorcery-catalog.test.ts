import { describe, expect, it } from 'vitest';
import {
  lunarSorcerySpellIds,
  lunarUnreviewedExcludedSpellIds,
} from '../../src/games/exalted1e/reference/lunar-powers';
import { sharedSorcerySpellById } from '../../src/games/exalted1e/reference/dragonblooded-powers';
import { auditFamily } from '../../scripts/audit-exalted-sources.mjs';

describe('Lunar Sorcery spell catalog (Phase 1d)', () => {
  it('promotes exactly 73 Sorcery spell ids, all distinct', () => {
    expect(lunarSorcerySpellIds.size).toBe(73);
  });

  it('excludes exactly 13 still-unreviewed Sorcery spell ids, disjoint from the promoted set', () => {
    expect(lunarUnreviewedExcludedSpellIds).toHaveLength(13);
    expect(new Set(lunarUnreviewedExcludedSpellIds).size).toBe(13);
    for (const id of lunarUnreviewedExcludedSpellIds) {
      expect(lunarSorcerySpellIds.has(id)).toBe(false);
    }
  });

  it('combines promoted and excluded ids to exactly the 86 Sorcery rows inventoried for Lunar', () => {
    const combined = new Set([
      ...lunarSorcerySpellIds,
      ...lunarUnreviewedExcludedSpellIds,
    ]);
    expect(combined.size).toBe(86);
  });

  it('resolves every promoted and excluded id against the real shared Sorcery catalog', () => {
    for (const id of lunarSorcerySpellIds) {
      expect(sharedSorcerySpellById.has(id)).toBe(true);
    }
    for (const id of lunarUnreviewedExcludedSpellIds) {
      expect(sharedSorcerySpellById.has(id)).toBe(true);
    }
  });

  it('includes both Terrestrial and Celestial Circle spells among the promoted set', () => {
    const circles = new Set(
      [...lunarSorcerySpellIds].map(
        (id) => sharedSorcerySpellById.get(id)?.circle,
      ),
    );
    expect(circles).toEqual(new Set(['terrestrial', 'celestial']));
  });

  it("includes the two Blood and Salt additions (Song of the Lintha, Water's Ally) among the promoted set", () => {
    expect(lunarSorcerySpellIds.has('song-of-the-lintha')).toBe(true);
    expect(lunarSorcerySpellIds.has('water-s-ally')).toBe(true);
  });

  it("passes the real source audit's promoted-catalog cross-check with zero issues", () => {
    // Sorcery spells reuse the shared dragonblooded-sorcery.json catalog
    // rather than a lunar-*.json file, so this audit script's file-glob
    // count is unaffected by this phase -- see exalted1e-source-audit.test.ts
    // for the full explanation of the 226-vs-399 distinction.
    const report = auditFamily('lunar');
    expect(report.issues).toEqual([]);
    expect(report.promotedEntries).toBeGreaterThanOrEqual(226);
  });
});
