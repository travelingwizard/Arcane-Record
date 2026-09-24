import { describe, expect, it } from 'vitest';
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
      // Abyssal (Phase 1e) is the one exception: its rules/creator/
      // migration test dimensions now have real, passing coverage (see
      // `exalted-shared-records.test.ts`'s XP-cost tests,
      // `exalted-creation-panel.test.tsx`, and `exalted1e-abyssal.test.ts`'s
      // migration test) -- but its `browserTests` still can't run before
      // the family is unlocked, and its catalog still has 5 rows blocked
      // on source access (see its record's own `blockers`), so it remains
      // fully locked regardless. Every other family stays 'not-run' on all
      // four test dimensions.
      if (family === 'abyssal') {
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
      // Abyssal has additionally had its Backgrounds, universal
      // Merits/Flaws chapter, Charms, Necromancy spells, and Sorcery spells
      // promoted to real production catalogs (500 of its 503 promotable
      // rows -- see `SplatCatalogEvidence.promotableEntries`), and Sidereal
      // has had its Backgrounds, universal Merits/Flaws chapter, Charms,
      // and Sorcery spells promoted (360 rows: 12 Backgrounds + 82
      // Merits/Flaws + 193 Charms + 73 Sorcery spells), but that alone must
      // not unlock either family -- `checksum` stays empty until
      // schema/creator/editor work for the remaining catalog dimensions
      // (Sidereal's own Astrology/Colleges system; Abyssal's Artifacts,
      // Hearthstones, Warstriders, the nemissary system) lands too.
      expect(record.catalog.promotedEntries).toBe(
        family === 'abyssal' ? 500 : family === 'sidereal' ? 360 : 0,
      );
      expect(record.catalog.checksum).toBe('');
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
    // 500 = the 80 universal Players Guide Merits/Flaws rows, the 6 new
    // Abyssal-only Backgrounds, 225 Chapter Five Charms, 103 Necromancy
    // spells, and 86 Sorcery spells (55 Terrestrial-circle rows reused from
    // the shared Dragon-Blooded catalog plus 31 new Celestial-circle rows)
    // promoted to production catalogs so far -- short of the 503
    // `promotableEntries` target (which also counts 3 still-unreviewed
    // Charm/spell rows), and far short of the raw `totalInventoryRows`
    // (700), most of which is free-text-by-design
    // Artifacts/Hearthstones/Warstriders/nemissary content that is never
    // meant to become a catalog entry. Either way,
    // `isFamilyAvailable('abyssal')` must stay false.
    expect(record.catalog.promotedEntries).toBe(500);
    expect(record.catalog.promotableEntries).toBe(503);
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
      // Abyssal (Phase 1e) is the one family whose rules/creator/migration
      // dimensions now pass (see the previous test's comment); every other
      // family, and Abyssal's own still-not-run browser dimension, keeps
      // the generic 'not-run' wording.
      if (family === 'abyssal') {
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

  it('describes Abyssal as locked with its inventory-in-progress promotion count despite its passing test dimensions', () => {
    const status = getFamilyCertificationStatus('abyssal');
    expect(status.available).toBe(false);
    expect(status.blockReason).toContain('500/503 promoted');
    expect(status.blockReason).toContain('2 unresolved');
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
