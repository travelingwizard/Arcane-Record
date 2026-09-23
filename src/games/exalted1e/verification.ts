import {
  plannedExaltedFamilies,
  type PlannedExaltedFamily,
} from './definitions';
import type { ExaltedCharacterType } from './profiles';
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
 * A family's own certification record is the ONLY source of truth for
 * whether it may be unlocked. Nothing else — a populated catalog file, an
 * OCR extraction script's output, a `verified` label on an
 * `ExaltedCharacterProfile` (see `./profiles`), or a passing typecheck/build
 * — can promote a family implicitly. Today none of the five families have
 * passed every dimension, so every one of them is honestly locked. This
 * module exists so unlocking a family later is a data change (updating its
 * certification record with real evidence) rather than a code change to a
 * pass/block switch.
 */

function catalogDimensionPasses(record: SplatCertificationRecord): boolean {
  const { catalog } = record;
  return (
    catalog.totalInventoryRows > 0 &&
    catalog.unresolvedEntries === 0 &&
    // Compared against `promotableEntries` (the subset of inventory rows
    // that are meant to become a strict catalog entry), not the raw
    // `totalInventoryRows` — some rows are free-text-by-design (Artifacts,
    // Hearthstones, Manses, Warstriders, matching Solar/Dragon-Blooded
    // precedent) or permanently non-selectable, and can never be
    // "promoted" as a catalog entry. See `SplatCatalogEvidence`'s doc
    // comment on `promotableEntries` for the full rationale.
    catalog.promotedEntries === catalog.promotableEntries &&
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

/**
 * Exported (rather than kept private) purely so tests can exercise the
 * "catalog not started" / "N/M promoted" wording against fixture records.
 * No real planned family has zero inventory rows any more, so the
 * zero-row branch can otherwise only be exercised with a fixture.
 */
export function describeCatalog(record: SplatCertificationRecord): string {
  const { catalog } = record;
  if (catalog.totalInventoryRows === 0) {
    return 'catalog not started';
  }
  return `catalog ${catalog.promotedEntries}/${catalog.promotableEntries} promoted (${catalog.totalInventoryRows} total inventory rows), ${catalog.unresolvedEntries} unresolved`;
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

function isPlannedExaltedFamily(
  family: ExaltedCharacterType,
): family is PlannedExaltedFamily {
  return (plannedExaltedFamilies as readonly string[]).includes(family);
}

/**
 * Whole-character-type gate covering all seven `ExaltedCharacterType`
 * values (see `./profiles`), not just the five planned families. Solar and
 * Dragon-Blooded are already-shipped production sheet types with no
 * certification record of their own (they predate this evidence-based
 * gate) and are always available; every other type defers entirely to its
 * certification record above. This is the single function UI code (e.g.
 * `definition.tsx`'s `variants`, `ExaltedCreationPanel.tsx`) should call to
 * decide whether a given family may be created — there is intentionally no
 * second, independently-maintained boolean gate anywhere else in this
 * module.
 */
export function canCreateProductionExaltedCharacter(
  family: ExaltedCharacterType,
): boolean {
  if (!isPlannedExaltedFamily(family)) return true;
  return isFamilyAvailable(family);
}

/**
 * Human-readable reason a family can't be created yet, suitable for
 * surfacing in the create-character UI, or `undefined` once it's available.
 * Prefers the certification record's own short `blockers` list (see
 * `./certification/schema.ts`) when present, falling back to the more
 * technical `describeFamilyStatus` wording otherwise.
 */
export function getExaltedVerificationRequirement(
  family: ExaltedCharacterType,
): string | undefined {
  if (canCreateProductionExaltedCharacter(family)) return undefined;
  if (!isPlannedExaltedFamily(family)) return undefined;
  const record = certificationRecords[family];
  if (record.blockers.length > 0) {
    return `Source verification required: ${record.blockers.join(' ')}`;
  }
  return `Source verification required: ${describeFamilyStatus(family)}.`;
}
