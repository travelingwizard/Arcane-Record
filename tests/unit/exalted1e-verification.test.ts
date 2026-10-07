import { describe, expect, it } from 'vitest';
import { auditFamily } from '../../scripts/audit-exalted-sources.mjs';
import { plannedExaltedFamilies } from '../../src/games/exalted1e/definitions';
import {
  describeCatalog,
  evaluateCertification,
  getAllFamilyCertificationStatuses,
  getFamilyCertificationStatus,
  isFamilyAvailable,
} from '../../src/games/exalted1e/verification';
import {
  splatCertificationRecordSchema,
  type SplatCertificationRecord,
} from '../../src/games/exalted1e/certification/schema';
import { certificationRecords } from '../../src/games/exalted1e/certification';

function passingRecordFor(
  family: SplatCertificationRecord['family'],
): SplatCertificationRecord {
  return {
    family,
    catalog: {
      totalInventoryRows: 10,
      promotableEntries: 10,
      promotedEntries: 10,
      unresolvedEntries: 0,
      checksum: 'abc123',
    },
    rulesTests: 'pass',
    creatorTests: 'pass',
    migrationTests: 'pass',
    browserTests: 'pass',
    certifiedAt: '2026-01-01T00:00:00.000Z',
    blockers: [],
    notes: 'Fixture-only fully passing record.',
  };
}

describe('exalted1e verification gate', () => {
  it('locks every planned family by default', () => {
    for (const family of plannedExaltedFamilies) {
      expect(isFamilyAvailable(family)).toBe(false);
    }
  });

  it('reports honest test evidence and an empty checksum for every planned family, even where inventory intake, catalog promotion, or test-dimension work has started', () => {
    for (const family of plannedExaltedFamilies) {
      const record = certificationRecords[family];
      expect(record.certifiedAt).toBeNull();
      // Abyssal (Phase 1e), Sidereal (Phase 2d), and Lunar (the
      // "rules_creator_tests" follow-up phase) are the three exceptions:
      // their rules/creator/migration test dimensions now have real,
      // passing coverage (see `exalted-shared-records.test.ts`'s XP-cost
      // tests, `exalted-creation-panel.test.tsx`, and each family's own
      // schema-migration test) -- but `browserTests` still can't run
      // before any family is unlocked, and each still has real catalog
      // gaps of its own (see each record's own `blockers`), so all three
      // remain fully locked regardless. Every other family stays
      // 'not-run' on all four test dimensions.
      if (family === 'abyssal' || family === 'sidereal' || family === 'lunar') {
        expect(record.rulesTests).toBe('pass');
        expect(record.creatorTests).toBe('pass');
        expect(record.migrationTests).toBe('pass');
        expect(record.browserTests).toBe('not-run');
      } else {
        expect(record.rulesTests).toBe('not-run');
        expect(record.creatorTests).toBe('not-run');
        expect(record.migrationTests).toBe('not-run');
        expect(record.browserTests).toBe('not-run');
      }
      // All five families have started source intake (inventory rows > 0).
      // Abyssal (Phase 1e), Sidereal (Phase: Astrology/Colleges plus the
      // later `sidereal_unreviewed_spells` follow-up), Lunar (the
      // `unreviewed_spells` follow-up), and now Alchemical (Phase 1c) have
      // each had every one of their promotable rows promoted to real
      // production catalogs (Abyssal: 505 of 505 -- Backgrounds, universal
      // Merits/Flaws chapter, all 227 Chapter Five Charms, all 106
      // Necromancy spells, and 86 Sorcery spells; Sidereal: 383 of 383 --
      // 12 Backgrounds + 82 Merits/Flaws + 193 Charms + 86 Sorcery spells +
      // 10 Astrology/Colleges procedural-rules rows; Lunar: 412 of 412;
      // Alchemical: 214 of 214 -- 6 Backgrounds + 71 Merits/Flaws + 96
      // Charms + 38 Weaving Protocols + 3 Alchemy Formulae -- see
      // `SplatCatalogEvidence.promotableEntries`), so `catalogDimensionPasses`
      // now returns true for all four. Even with a fully satisfied
      // catalog dimension, `certifiedAt` stays null and every family stays
      // locked: `browserTests` can't run before a family is unlocked, and
      // Phase 6's rule requires all five families to reach
      // `certifiedAt !== null` together.
      expect(record.catalog.promotedEntries).toBe(
        family === 'abyssal'
          ? 505
          : family === 'sidereal'
            ? 383
            : family === 'lunar'
              ? 412
              : family === 'alchemical'
                ? 214
                : family === 'fair-folk'
                  ? 191
                  : 0,
      );
      if (
        family === 'abyssal' ||
        family === 'sidereal' ||
        family === 'lunar' ||
        family === 'alchemical' ||
        family === 'fair-folk'
      ) {
        // Cross-check against the audit script's own live computation
        // rather than hardcoding the hash, so this test can't silently go
        // stale if the promoted catalog changes. Lunar's catalog
        // dimension closed this same way as Abyssal's/Sidereal's own did,
        // via the `unreviewed_spells` follow-up phase (see
        // `lunar.json`'s notes). Alchemical's own checksum first became
        // non-empty in Phase 1b, once `alchemical-charms.json` became the
        // family's first `alchemical-`-prefixed catalog file; its catalog
        // dimension fully closed in Phase 1c (214 of 214 promotable), once
        // `alchemical-weaving-protocols.json`/`alchemical-formulae.json`
        // joined it under the same glob -- matching Abyssal/Sidereal/
        // Lunar's own fully-closed catalogs. Fair Folk's own checksum
        // first became non-empty in Phase 1b, once
        // `fair-folk-charms.json`/`fair-folk-graces.json`/
        // `fair-folk-bedlam.json` became the family's first
        // `fair-folk-`-prefixed catalog files (30 of 279 promotable);
        // Phase 1c grew `fair-folk-charms.json` from 19 to 44 rows (55 of
        // 279 promotable); Phase 1d grew it again to 51 rows (62 of 279
        // promotable); Phase 1e grew it again to 70 rows (81 of 279
        // promotable); Phase 1f grew it again to 92 rows (103 of 279
        // promotable now -- the catalog dimension stays far from closed).
        expect(record.catalog.checksum).toBe(
          auditFamily(family).catalogChecksum,
        );
        expect(record.catalog.checksum.length).toBeGreaterThan(0);
      } else {
        expect(record.catalog.checksum).toBe('');
      }
    }
  });

  it('reports every planned family with a positive inventory row count (all five have supplied source material)', () => {
    for (const family of plannedExaltedFamilies) {
      expect(
        certificationRecords[family].catalog.totalInventoryRows,
      ).toBeGreaterThan(0);
    }
  });

  it('reflects Lunar with its catalog dimension now fully resolved without unlocking the family', () => {
    const record = certificationRecords.lunar;
    expect(record.catalog.totalInventoryRows).toBeGreaterThan(0);
    // 412 = 13 Backgrounds + 87 shared Merits/Flaws catalog rows now
    // carrying 'lunar' in appliesTo (Phase 1a) + 219 Charms (Phase 1b:
    // every Chapter Five Charm-page row except the 10 Beastman
    // Transformation "gift" sub-options, plus the Storyteller's
    // Companion's 5 Sample Charms) + 5 Great Curse rows + 2 Shapechanging
    // rules rows (Phase 1c) + 86 Sorcery spells (Phase 1d promoted 73 of
    // 86; the `unreviewed_spells` follow-up phase then promoted the
    // remaining 13 summon-type rows, all from Savant and Sorcerer, after
    // a direct visual rendered-page re-check of their embedded creature
    // stat blocks/tables confirmed zero discrepancies from the existing
    // transcription -- see `lunar.json`'s certification notes). A per-
    // species Heart's Blood Form stat catalog remains intentionally
    // unpromoted (the source imposes no closed species list, so it stays
    // player-recorded free text by design, not a gap). `promotedEntries`
    // (412) now exactly equals `promotableEntries` (412), so
    // `catalogDimensionPasses` returns true for Lunar for the first time.
    // Even with the catalog dimension fully satisfied, `isFamilyAvailable`
    // must stay false: `browserTests` can't run before the family is
    // unlocked, and Phase 6's rule requires all five families to reach
    // `certifiedAt !== null` together -- exactly mirroring Abyssal's and
    // Sidereal's own already-resolved catalog dimensions.
    expect(record.catalog.promotedEntries).toBe(412);
    expect(record.catalog.promotableEntries).toBe(412);
    expect(record.catalog.unresolvedEntries).toBe(0);
    expect(record.catalog.checksum.length).toBeGreaterThan(0);
    expect(isFamilyAvailable('lunar')).toBe(false);
  });

  it('reflects Abyssal source intake in progress without unlocking the family', () => {
    const record = certificationRecords.abyssal;
    expect(record.catalog.totalInventoryRows).toBeGreaterThan(0);
    // 505 = the 80 universal Players Guide Merits/Flaws rows, the 6 new
    // Abyssal-only Backgrounds, all 227 Chapter Five Charms, all 106
    // Necromancy spells, and 86 Sorcery spells (55 Terrestrial-circle rows
    // reused from the shared Dragon-Blooded catalog plus 31 new
    // Celestial-circle rows) -- every one of Abyssal's `promotableEntries`
    // (Phase 1e closed the last gap: 2 previously-unresolved Necromancy
    // spells with no printed mote cost, and 3 previously-unreviewed
    // Charm/spell rows, all resolved by direct source re-check). This is
    // far short of the raw `totalInventoryRows` (700), most of which is
    // free-text-by-design Artifacts/Hearthstones/Warstriders/nemissary
    // content that is never meant to become a catalog entry -- and even a
    // fully-satisfied catalog dimension must not unlock the family, since
    // `browserTests` and Phase 6's all-five-together rule remain.
    // `isFamilyAvailable('abyssal')` must stay false.
    expect(record.catalog.promotedEntries).toBe(505);
    expect(record.catalog.promotableEntries).toBe(505);
    expect(record.catalog.unresolvedEntries).toBe(0);
    expect(isFamilyAvailable('abyssal')).toBe(false);
  });

  it('reflects Sidereal source intake in progress without unlocking the family', () => {
    const record = certificationRecords.sidereal;
    expect(record.catalog.totalInventoryRows).toBeGreaterThan(0);
    // 383 = 12 Backgrounds (siderealBackgrounds) + 82 shared Merits/Flaws
    // catalog rows now carrying 'sidereal' in appliesTo (79 extended
    // existing entries plus 3 wholly new Sidereal-only entries) + 193
    // Chapter Five Charms (sidereal-charms.json/sidereal-powers.ts) + 86
    // Sorcery spells (siderealSorcerySpellIds, a subset of the shared
    // dragonblooded-sorcery.json catalog -- Phase 2b promoted 73; the
    // `sidereal_unreviewed_spells` follow-up phase later promoted the
    // remaining 13 summon-type rows, all from Savant and Sorcerer, after a
    // direct visual rendered-page re-check confirmed zero discrepancies
    // from the existing transcription, identical to Lunar's own
    // `unreviewed_spells` phase for the byte-for-byte identical rows) + 10
    // Astrology/Colleges procedural-rules rows
    // (sidereal-astrology-rules.json) -- this now equals the 383
    // `promotableEntries`, and is far short of the raw
    // `totalInventoryRows` (583). Even with the catalog dimension fully
    // satisfied, `isFamilyAvailable('sidereal')` must stay false:
    // `browserTests` can't run before the family is unlocked, and Phase
    // 6's rule requires all five families to reach `certifiedAt !== null`
    // together.
    expect(record.catalog.promotedEntries).toBe(383);
    expect(record.catalog.promotableEntries).toBe(383);
    expect(record.catalog.unresolvedEntries).toBe(0);
    expect(isFamilyAvailable('sidereal')).toBe(false);
  });

  it('reflects Alchemical Phase 1a/1b/1c catalog promotion without unlocking the family', () => {
    const record = certificationRecords.alchemical;
    expect(record.catalog.totalInventoryRows).toBeGreaterThan(0);
    expect(record.catalog.promotedEntries).toBe(214);
    // Phase 1c closed Alchemical's catalog dimension (214 of 214
    // promotable, same as Abyssal/Sidereal/Lunar's own fully-closed
    // catalogs), but `certifiedAt` stays null and the family stays locked:
    // all four test dimensions are still `'not-run'`, and Phase 6's rule
    // requires all five planned families to reach `certifiedAt !== null`
    // together.
    expect(record.catalog.promotedEntries).toBe(
      record.catalog.promotableEntries,
    );
    expect(record.certifiedAt).toBeNull();
    expect(isFamilyAvailable('alchemical')).toBe(false);
  });

  it('reflects Fair Folk Phase 1a/1b/1c/1d/1e/1f catalog promotion without unlocking the family', () => {
    const record = certificationRecords['fair-folk'];
    expect(record.catalog.totalInventoryRows).toBeGreaterThan(0);
    // 191 = Phase 1a's 88 (13 Backgrounds (fairFolkBackgrounds) + 75 shared
    // Merits/Flaws catalog entries now carrying 'fair-folk' in appliesTo --
    // 73 inventoried pg-merit-*/pg-flaw-* rows resolving one-for-one,
    // except the two dual merit/flaw split pairs -- mutation-merit/
    // mutation-flaw and favor-merit/favor-flaw -- each counted twice at
    // the catalog-entry level) plus Phase 1b's 30 (6 Graces rows in
    // fair-folk-graces.json + 5 Bedlam rows in fair-folk-bedlam.json + 19
    // Grace-Forging/Assumption Charms in fair-folk-charms.json) plus
    // Phase 1c's 25 more Charms (the 14-row Glamour Charms section, the
    // remaining 8-row Greater Arts of Glamour tail including
    // Behemoth-Forging Meditation, and the 3 standalone Pox/Affliction/
    // Blight Charms) plus Phase 1d's 7 more Charms (the Heart Grace's
    // Dodge Charms and Resistance Charms, its only combat-flavored
    // Charm trees) plus Phase 1e's 19 more Charms (the full Cup Combat
    // Charms tree) plus Phase 1f's 22 more Charms (the full Ring Combat
    // Charms tree and its sequel All-Consuming God-Monster Style),
    // extending fair-folk-charms.json from 19 to 92 rows. This is far
    // short of the 279 preliminary `promotableEntries` estimate (flagged
    // as approximate pending this family's own remaining
    // Charm/Sorcery/Artifact catalog phases). Phase 1b's three new
    // `fair-folk-`-prefixed catalog files were the first ones this audit
    // script's glob picked up, so the catalog checksum is no longer empty
    // -- exactly matching Alchemical's own Phase 1a -> 1b transition
    // (checksum stayed empty until its own Phase 1b added a real
    // `alchemical-`-prefixed file); Phase 1c, Phase 1d, Phase 1e, and
    // Phase 1f each changed the checksum again simply by growing the same
    // `fair-folk-charms.json` file.
    expect(record.catalog.promotedEntries).toBe(191);
    expect(record.catalog.checksum.length).toBeGreaterThan(0);
    expect(isFamilyAvailable('fair-folk')).toBe(false);
  });

  it('every checked-in certification record validates against the schema', () => {
    for (const family of plannedExaltedFamilies) {
      expect(() =>
        splatCertificationRecordSchema.parse(certificationRecords[family]),
      ).not.toThrow();
    }
  });

  it('rejects a promotableEntries value that exceeds totalInventoryRows', () => {
    const record = passingRecordFor('lunar');
    expect(() =>
      splatCertificationRecordSchema.parse({
        ...record,
        catalog: { ...record.catalog, promotableEntries: 11 },
      }),
    ).toThrow(/promotableEntries cannot exceed totalInventoryRows/);
  });

  it('rejects a promotedEntries value that exceeds promotableEntries', () => {
    const record = passingRecordFor('lunar');
    expect(() =>
      splatCertificationRecordSchema.parse({
        ...record,
        catalog: { ...record.catalog, promotableEntries: 8 },
      }),
    ).toThrow(/promotedEntries cannot exceed promotableEntries/);
  });

  it('every planned family keeps promotableEntries within [promotedEntries, totalInventoryRows]', () => {
    for (const family of plannedExaltedFamilies) {
      const { totalInventoryRows, promotableEntries, promotedEntries } =
        certificationRecords[family].catalog;
      expect(promotableEntries).toBeLessThanOrEqual(totalInventoryRows);
      expect(promotedEntries).toBeLessThanOrEqual(promotableEntries);
    }
  });

  it('describes a locked family with no inventory yet with concrete evidence, not a generic message', () => {
    // No real planned family has zero inventory rows any more (all five have
    // supplied source material), so the "catalog not started" wording is
    // exercised directly against a fixture record instead of real data.
    const zeroRowRecord: SplatCertificationRecord = {
      ...passingRecordFor('sidereal'),
      catalog: {
        totalInventoryRows: 0,
        promotableEntries: 0,
        promotedEntries: 0,
        unresolvedEntries: 0,
        checksum: '',
      },
      rulesTests: 'not-run',
      creatorTests: 'not-run',
      migrationTests: 'not-run',
      browserTests: 'not-run',
      certifiedAt: null,
    };
    expect(describeCatalog(zeroRowRecord)).toBe('catalog not started');
    expect(evaluateCertification(zeroRowRecord)).toBe(false);
  });

  it('describes each real planned family locked with concrete promotion-count evidence, not a generic message', () => {
    for (const family of plannedExaltedFamilies) {
      const status = getFamilyCertificationStatus(family);
      const {
        totalInventoryRows,
        promotableEntries,
        promotedEntries,
        unresolvedEntries,
      } = certificationRecords[family].catalog;
      expect(status.available).toBe(false);
      expect(status.blockReason).toContain(
        `catalog ${promotedEntries}/${promotableEntries} promoted (${totalInventoryRows} total inventory rows), ${unresolvedEntries} unresolved`,
      );
      // Abyssal (Phase 1e), Sidereal (Phase 2d), and Lunar (the
      // "rules_creator_tests" follow-up phase) are the three families
      // whose rules/creator/migration dimensions now pass (see the
      // previous test's comment); every other family, and all three
      // families' own still-not-run browser dimension, keeps the generic
      // 'not-run' wording.
      if (family === 'abyssal' || family === 'sidereal' || family === 'lunar') {
        expect(status.blockReason).toContain('rules tests pass');
        expect(status.blockReason).toContain('creator tests pass');
        expect(status.blockReason).toContain('migration tests pass');
        expect(status.blockReason).toContain('browser tests not-run');
      } else {
        expect(status.blockReason).toContain('rules tests not-run');
        expect(status.blockReason).toContain('creator tests not-run');
        expect(status.blockReason).toContain('migration tests not-run');
        expect(status.blockReason).toContain('browser tests not-run');
      }
    }
  });

  it('describes Lunar as locked with its now-complete catalog dimension despite its passing test dimensions', () => {
    const status = getFamilyCertificationStatus('lunar');
    expect(status.available).toBe(false);
    expect(status.blockReason).toContain('412/412 promoted');
    expect(status.blockReason).toContain('0 unresolved');
    expect(status.blockReason).toContain('rules tests pass');
    expect(status.blockReason).toContain('creator tests pass');
    expect(status.blockReason).toContain('migration tests pass');
    expect(status.blockReason).toContain('browser tests not-run');
  });

  it('describes Abyssal as locked with its now-complete catalog dimension despite its passing test dimensions', () => {
    const status = getFamilyCertificationStatus('abyssal');
    expect(status.available).toBe(false);
    expect(status.blockReason).toContain('505/505 promoted');
    expect(status.blockReason).toContain('0 unresolved');
    expect(status.blockReason).toContain('rules tests pass');
    expect(status.blockReason).toContain('browser tests not-run');
  });

  it('describes Sidereal as locked with its now-complete catalog dimension despite its passing test dimensions', () => {
    const status = getFamilyCertificationStatus('sidereal');
    expect(status.available).toBe(false);
    // Like Abyssal, Sidereal's catalog dimension is now fully resolved
    // (383 of 383 promotable rows, including its own Astrology/Colleges
    // system's 10 procedural-rules rows and all 86 Sorcery spells after
    // the `sidereal_unreviewed_spells` follow-up phase), and
    // rulesTests/creatorTests/migrationTests all pass (Phase 2d) -- the
    // family stays locked only for browserTests (not-run) and Phase 6's
    // all-five-together rule.
    expect(status.blockReason).toContain('383/383 promoted');
    expect(status.blockReason).toContain('0 unresolved');
    expect(status.blockReason).toContain('rules tests pass');
    expect(status.blockReason).toContain('browser tests not-run');
  });

  it('returns one status entry per planned family', () => {
    const statuses = getAllFamilyCertificationStatuses();
    expect(statuses.map((status) => status.family)).toEqual([
      ...plannedExaltedFamilies,
    ]);
    expect(statuses.every((status) => !status.available)).toBe(true);
  });

  describe('evaluateCertification against a hypothetical fully-passing record (fixture only, not real evidence)', () => {
    it('requires every dimension and a non-empty checksum simultaneously', () => {
      const record = passingRecordFor('lunar');
      expect(evaluateCertification(record)).toBe(true);
      expect(evaluateCertification({ ...record, rulesTests: 'not-run' })).toBe(
        false,
      );
      expect(evaluateCertification({ ...record, certifiedAt: null })).toBe(
        false,
      );
      expect(
        evaluateCertification({
          ...record,
          catalog: { ...record.catalog, unresolvedEntries: 1 },
        }),
      ).toBe(false);
      expect(
        evaluateCertification({
          ...record,
          catalog: { ...record.catalog, checksum: '' },
        }),
      ).toBe(false);
      expect(
        evaluateCertification({
          ...record,
          catalog: { ...record.catalog, promotedEntries: 5 },
        }),
      ).toBe(false);
    });
  });
});
