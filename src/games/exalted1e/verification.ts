import {
  plannedExaltedFamilies,
  type PlannedExaltedFamily,
} from './definitions';
import {
  certificationRecords,
  type SplatCertificationRecord,
} from './certification';

/**
 * Evidence-based release gate for the five planned Exalted 1e splats
 * (Lunar, Abyssal, Sidereal, Alchemical, Fair Folk). This module reads
 * checked-in certification records (`./certification/*.json`) instead of a
 * hand-maintained boolean per family. A family becomes available only when
 * every dimension below has independently passed:
 *
 * 1. Catalog — every inventoried entry for the family has been promoted to
 *    a production catalog with zero rows left `unresolved`, and a non-empty
 *    checksum is recorded (see `scripts/audit-exalted-sources.mjs`, which is
 *    the tool that actually recomputes and cross-checks that checksum
 *    against the catalog files on disk — this module trusts the checked-in
 *    value rather than re-hashing catalogs inside the app bundle).
 * 2. Rules tests (creation-rule + derived-calculation coverage) pass.
 * 3. Creator tests (guided creation/rebuild coverage) pass.
 * 4. Migration tests pass.
 * 5. Browser/E2E tests pass.
 *
 * Today none of the five families have a schema, catalog, or editor, so
 * every dimension is honestly `not-run` and every family is locked. This
 * module exists so unlocking a family later is a data change (updating its
 * certification record with real evidence) rather than a code change to a
 * pass/block switch.
 */

function catalogDimensionPasses(record: SplatCertificationRecord): boolean {
  const { catalog } = record;
  return (
    catalog.totalInventoryRows > 0 &&
    catalog.unresolvedEntries === 0 &&
    catalog.promotedEntries === catalog.totalInventoryRows &&
    catalog.checksum.length > 0
  );
}

export interface FamilyCertificationStatus {
  family: PlannedExaltedFamily;
  available: boolean;
  record: SplatCertificationRecord;
  /** Human-readable reason the family is locked, or null if available. */
  blockReason: string | null;
}

/**
 * Pure evaluation of a certification record, independent of where it came
 * from. Exported (rather than inlined into `isFamilyAvailable`) so tests can
 * exercise the real pass/fail rule against fixture records without
 * duplicating it.
 */
export function evaluateCertification(
  record: SplatCertificationRecord,
): boolean {
  return (
    record.certifiedAt !== null &&
    catalogDimensionPasses(record) &&
    record.rulesTests === 'pass' &&
    record.creatorTests === 'pass' &&
    record.migrationTests === 'pass' &&
    record.browserTests === 'pass'
  );
}

export function isFamilyAvailable(family: PlannedExaltedFamily): boolean {
  return evaluateCertification(certificationRecords[family]);
}

function describeCatalog(record: SplatCertificationRecord): string {
  const { catalog } = record;
  if (catalog.totalInventoryRows === 0) {
    return 'catalog not started';
  }
  return `catalog ${catalog.promotedEntries}/${catalog.totalInventoryRows} promoted, ${catalog.unresolvedEntries} unresolved`;
}

export function describeFamilyStatus(family: PlannedExaltedFamily): string {
  const record = certificationRecords[family];
  if (isFamilyAvailable(family)) {
    return `Certified ${record.certifiedAt}.`;
  }
  return [
    describeCatalog(record),
    `rules tests ${record.rulesTests}`,
    `creator tests ${record.creatorTests}`,
    `migration tests ${record.migrationTests}`,
    `browser tests ${record.browserTests}`,
  ].join(', ');
}

export function getFamilyCertificationStatus(
  family: PlannedExaltedFamily,
): FamilyCertificationStatus {
  const record = certificationRecords[family];
  const available = isFamilyAvailable(family);
  return {
    family,
    available,
    record,
    blockReason: available ? null : describeFamilyStatus(family),
  };
}

export function getAllFamilyCertificationStatuses(): FamilyCertificationStatus[] {
  return plannedExaltedFamilies.map((family) =>
    getFamilyCertificationStatus(family),
  );
}
