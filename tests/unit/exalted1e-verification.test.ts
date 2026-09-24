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
      // Abyssal (Phase 1e) and Sidereal (Phase 2d) are the two exceptions:
      // their rules/creator/migration test dimensions now have real,
      // passing coverage (see `exalted-shared-records.test.ts`'s XP-cost
      // tests, `exalted-creation-panel.test.tsx`, and each family's own
      // schema-migration test) -- but `browserTests` still can't run
      // before either family is unlocked, and each still has real catalog
      // gaps of its own (see each record's own `blockers`), so both remain
      // fully locked regardless. Every other family stays 'not-run' on all
      // four test dimensions.
      if (family === 'abyssal' || family === 'sidereal') {
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
      // Abyssal (Phase 1e) has now had every one of its promotable rows
      // promoted to real production catalogs (505 of 505: Backgrounds,
      // universal Merits/Flaws chapter, all 227 Chapter Five Charms, all
      // 106 Necromancy spells, and 86 Sorcery spells -- see
      // `SplatCatalogEvidence.promotableEntries`). Sidereal has had its
      // Backgrounds, universal Merits/Flaws chapter, Charms, and Sorcery
      // spells promoted (360 rows: 12 Backgrounds + 82 Merits/Flaws + 193
      // Charms + 73 Sorcery spells), but that alone must not unlock it --
      // its own Astrology/Colleges system (5 more promotable rows) still
      // isn't promoted, so `promotedEntries` (360) stays short of
      // `promotableEntries` (365) even though `catalog.checksum` is now a
      // real, non-empty value for both families (each computed by
      // `scripts/audit-exalted-sources.mjs`'s family-prefixed-file scan,
      // not a placeholder). Even with a fully or partially satisfied
      // catalog dimension, `certifiedAt` stays null and both families stay
      // locked: `browserTests` can't run before either family is unlocked,
      // and Phase 6's rule requires all five families to reach
      // `certifiedAt !== null` together.
      expect(record.catalog.promotedEntries).toBe(
        family === 'abyssal' ? 505 : family === 'sidereal' ? 360 : 0,
      );
      if (family === 'abyssal' || family === 'sidereal') {
        // Cross-check against the audit script's own live computation
        // rather than hardcoding the hash, so this test can't silently go
        // stale if the promoted catalog changes.
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

  it('reflects Lunar source intake in progress without unlocking the family', () => {
    const record = certificationRecords.lunar;
    expect(record.catalog.totalInventoryRows).toBeGreaterThan(0);
    expect(record.catalog.promotedEntries).toBe(0);
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
    // 360 = 12 Backgrounds (siderealBackgrounds) + 82 shared Merits/Flaws
    // catalog rows now carrying 'sidereal' in appliesTo (79 extended
    // existing entries plus 3 wholly new Sidereal-only entries) + 193
    // Chapter Five Charms (sidereal-charms.json/sidereal-powers.ts) + 73
    // Sorcery spells (siderealSorcerySpellIds, a subset of the shared
    // dragonblooded-sorcery.json catalog) -- short of the 365
    // `promotableEntries` estimate (which also counts the still-unreviewed
    // Sorcery spell rows and the not-yet-scoped Astrology/Colleges
    // system), and far short of the raw `totalInventoryRows` (583). Either
    // way, `isFamilyAvailable('sidereal')` must stay false.
    expect(record.catalog.promotedEntries).toBe(360);
    expect(isFamilyAvailable('sidereal')).toBe(false);
  });

  it('reflects Alchemical source intake in progress without unlocking the family', () => {
    const record = certificationRecords.alchemical;
    expect(record.catalog.totalInventoryRows).toBeGreaterThan(0);
    expect(record.catalog.promotedEntries).toBe(0);
    expect(isFamilyAvailable('alchemical')).toBe(false);
  });

  it('reflects Fair Folk source intake in progress without unlocking the family', () => {
    const record = certificationRecords['fair-folk'];
    expect(record.catalog.totalInventoryRows).toBeGreaterThan(0);
    expect(record.catalog.promotedEntries).toBe(0);
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
      // Abyssal (Phase 1e) and Sidereal (Phase 2d) are the two families
      // whose rules/creator/migration dimensions now pass (see the
      // previous test's comment); every other family, and both families'
      // own still-not-run browser dimension, keeps the generic 'not-run'
      // wording.
      if (family === 'abyssal' || family === 'sidereal') {
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

  it('describes a locked family with inventory in progress by its promotion count, not "catalog not started"', () => {
    const status = getFamilyCertificationStatus('lunar');
    expect(status.available).toBe(false);
    expect(status.blockReason).toContain('0/390 promoted');
    expect(status.blockReason).toContain('0 unresolved');
    expect(status.blockReason).toContain('rules tests not-run');
  });

  it('describes Abyssal as locked with its now-complete catalog dimension despite its passing test dimensions', () => {
    const status = getFamilyCertificationStatus('abyssal');
    expect(status.available).toBe(false);
    expect(status.blockReason).toContain('505/505 promoted');
    expect(status.blockReason).toContain('0 unresolved');
    expect(status.blockReason).toContain('rules tests pass');
    expect(status.blockReason).toContain('browser tests not-run');
  });

  it('describes Sidereal as locked with its still-incomplete catalog dimension despite its passing test dimensions', () => {
    const status = getFamilyCertificationStatus('sidereal');
    expect(status.available).toBe(false);
    // Unlike Abyssal, Sidereal's catalog dimension is NOT yet fully
    // resolved (5 of 365 promotable rows -- its own Astrology/Colleges
    // system -- remain unpromoted), even though rulesTests/creatorTests/
    // migrationTests all pass (Phase 2d).
    expect(status.blockReason).toContain('360/365 promoted');
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
