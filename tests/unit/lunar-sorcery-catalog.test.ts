import { describe, expect, it } from 'vitest';
import { lunarSorcerySpellIds } from '../../src/games/exalted1e/reference/lunar-powers';
import { sharedSorcerySpellById } from '../../src/games/exalted1e/reference/dragonblooded-powers';
import { auditFamily } from '../../scripts/audit-exalted-sources.mjs';

describe('Lunar Sorcery spell catalog (Phase 1d; fully closed by the unreviewed_spells follow-up phase)', () => {
  it('promotes exactly 86 Sorcery spell ids, all distinct', () => {
    expect(lunarSorcerySpellIds.size).toBe(86);
  });

  it('resolves every promoted id against the real shared Sorcery catalog', () => {
    for (const id of lunarSorcerySpellIds) {
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

  it('promotes the 13 previously-unreviewed summon-type spell rows (unreviewed_spells follow-up phase)', () => {
    // These were held back from Phase 1d pending a direct visual
    // (rendered-page) re-check of their embedded creature stat blocks and
    // boxed tables -- see `lunar.json`'s certification notes for the full
    // page-by-page verification record. The re-check found zero
    // discrepancies from the existing transcription; all 13 are now
    // ordinary promoted entries like any other row, and the exclusion
    // list export (`lunarUnreviewedExcludedSpellIds`) that used to hold
    // them was removed once empty, mirroring Abyssal's own Phase 1e
    // precedent for the identical kind of gap.
    for (const id of [
      'dance-of-the-smoke-cobras',
      'the-horse-that-travels-earth-and-water',
      'hound-of-the-five-winds',
      'plague-of-bronze-snakes',
      'ritual-of-elemental-empowerment',
      'sprouting-shackles-of-doom',
      'the-spy-who-walks-in-darkness',
      'summoning-the-lesser-minions-of-the-eyeless-face',
      'bone-lion',
      'imbue-amalgam',
      'the-princes-of-the-fallen-tower',
      'servant-of-infallible-location',
      'swift-spirit-of-winged-transportation',
    ]) {
      expect(lunarSorcerySpellIds.has(id)).toBe(true);
      expect(sharedSorcerySpellById.has(id)).toBe(true);
    }
  });

  it("passes the real source audit's promoted-catalog cross-check with zero issues", () => {
    // Sorcery spells reuse the shared dragonblooded-sorcery.json catalog
    // rather than a lunar-*.json file, so this audit script's file-glob
    // count is unaffected by this phase (and by the unreviewed_spells
    // follow-up phase that closed the last 13-spell gap) -- see
    // exalted1e-source-audit.test.ts for the full explanation of the
    // 226-vs-412 distinction.
    const report = auditFamily('lunar');
    expect(report.issues).toEqual([]);
    expect(report.promotedEntries).toBeGreaterThanOrEqual(226);
  });
});
