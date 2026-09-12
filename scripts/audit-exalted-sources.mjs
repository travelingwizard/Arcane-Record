#!/usr/bin/env node
// Audits the per-family source inventories for the five planned Exalted 1e
// splats (Lunar, Abyssal, Sidereal, Alchemical, Fair Folk). See
// docs/18-exalted1e-splat-release.md for the inventory/disposition model
// this script enforces.
//
// The pure functions below are also imported directly by
// tests/unit/exalted1e-source-audit.test.ts, so keep them side-effect-free
// and importable without triggering the CLI runner at the bottom.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PLANNED_EXALTED_FAMILIES = [
  'lunar',
  'abyssal',
  'sidereal',
  'alchemical',
  'fair-folk',
];

export const VALID_DISPOSITIONS = new Set([
  'selectable',
  'calculated',
  'reference-only',
  'unresolved',
  'gm-only',
  'excluded',
]);

/** Deterministic, non-cryptographic 32-bit hash (FNV-1a) for drift detection. */
export function computeChecksum(value) {
  const json = JSON.stringify(value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < json.length; i += 1) {
    hash ^= json.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Audits a family's raw inventory rows: duplicate IDs, missing/unknown
 * disposition, missing citations, unknown source book IDs, and
 * unresolved/invalid cross-references.
 */
export function auditInventoryRows(rows, { sourceManifestBookIds } = {}) {
  const issues = [];
  const seenIds = new Set();
  const idSet = new Set(rows.map((row) => row.id));

  for (const row of rows) {
    if (!row.id) {
      issues.push({
        severity: 'error',
        message: 'Inventory row is missing an id.',
      });
      continue;
    }
    if (seenIds.has(row.id)) {
      issues.push({
        severity: 'error',
        message: `Duplicate inventory id: ${row.id}`,
        id: row.id,
      });
    }
    seenIds.add(row.id);

    if (!row.disposition) {
      issues.push({
        severity: 'error',
        message: `Inventory row ${row.id} has no disposition.`,
        id: row.id,
      });
    } else if (!VALID_DISPOSITIONS.has(row.disposition)) {
      issues.push({
        severity: 'error',
        message: `Inventory row ${row.id} has unknown disposition "${row.disposition}".`,
        id: row.id,
      });
    }

    if (!row.citation || !row.citation.bookId) {
      issues.push({
        severity: 'error',
        message: `Inventory row ${row.id} is missing a source citation.`,
        id: row.id,
      });
    } else if (
      sourceManifestBookIds &&
      !sourceManifestBookIds.has(row.citation.bookId)
    ) {
      issues.push({
        severity: 'error',
        message: `Inventory row ${row.id} cites unknown source book "${row.citation.bookId}". Add it to source-manifest.json first.`,
        id: row.id,
      });
    }

    for (const ref of row.crossReferences ?? []) {
      if (!idSet.has(ref)) {
        issues.push({
          severity: 'error',
          message: `Inventory row ${row.id} references unresolved/unknown id "${ref}".`,
          id: row.id,
        });
      }
    }
  }

  return issues;
}

/**
 * Cross-checks a family's promoted production catalog entries against its
 * inventory: every promoted entry must have a matching, visually-reviewed
 * inventory row with a promotable disposition.
 */
export function auditPromotedCatalog(promotedEntries, inventoryRows) {
  const issues = [];
  const inventoryById = new Map(inventoryRows.map((row) => [row.id, row]));

  for (const entry of promotedEntries) {
    const inventoryRow = inventoryById.get(entry.id);
    if (!inventoryRow) {
      issues.push({
        severity: 'error',
        message: `Promoted catalog entry ${entry.id} has no matching inventory row.`,
        id: entry.id,
      });
      continue;
    }
    if (inventoryRow.verificationState !== 'reviewed') {
      issues.push({
        severity: 'error',
        message: `Promoted catalog entry ${entry.id} has not completed visual source review.`,
        id: entry.id,
      });
    }
    if (
      inventoryRow.disposition !== 'selectable' &&
      inventoryRow.disposition !== 'calculated'
    ) {
      issues.push({
        severity: 'error',
        message: `Promoted catalog entry ${entry.id} has disposition "${inventoryRow.disposition}", which must not be promoted.`,
        id: entry.id,
      });
    }
  }

  return issues;
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Audits one family end to end by reading its inventory files, source
 * manifest, and any already-promoted production catalog files from disk.
 * A family with no inventory directory yet is reported as
 * `pending-source-material`, not an error — that is the expected state
 * until source books are supplied.
 */
export function auditFamily(family, { repoRoot } = {}) {
  const root =
    repoRoot ?? resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const familyDocsDir = join(root, 'docs/references/exalted1e', family);
  const inventoryDir = join(familyDocsDir, 'inventory');

  if (!existsSync(inventoryDir)) {
    return {
      family,
      status: 'pending-source-material',
      inventoryRows: 0,
      promotedEntries: 0,
      issues: [],
    };
  }

  const manifestPath = join(familyDocsDir, 'source-manifest.json');
  const manifest = existsSync(manifestPath) ? loadJson(manifestPath) : null;
  const sourceManifestBookIds = manifest
    ? new Set((manifest.sources ?? []).map((source) => source.bookId))
    : undefined;

  const inventoryFiles = readdirSync(inventoryDir).filter((file) =>
    file.endsWith('.json'),
  );
  const rows = inventoryFiles.flatMap((file) =>
    loadJson(join(inventoryDir, file)),
  );
  const issues = auditInventoryRows(rows, { sourceManifestBookIds });

  const referenceDir = join(root, 'src/games/exalted1e/reference');
  const catalogFiles = existsSync(referenceDir)
    ? readdirSync(referenceDir).filter(
        (file) => file.startsWith(`${family}-`) && file.endsWith('.json'),
      )
    : [];
  const promotedEntries = catalogFiles.flatMap((file) =>
    loadJson(join(referenceDir, file)),
  );
  issues.push(...auditPromotedCatalog(promotedEntries, rows));

  return {
    family,
    status: issues.some((issue) => issue.severity === 'error')
      ? 'failing'
      : 'pending-certification',
    inventoryRows: rows.length,
    promotedEntries: promotedEntries.length,
    issues,
  };
}

export function auditAllFamilies(options) {
  return PLANNED_EXALTED_FAMILIES.map((family) => auditFamily(family, options));
}

function isRunAsCli() {
  return (
    typeof process.argv[1] === 'string' &&
    resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  );
}

if (isRunAsCli()) {
  const reports = auditAllFamilies();
  let hasErrors = false;

  for (const report of reports) {
    console.log(
      `\n${report.family}: ${report.status} (${report.inventoryRows} inventory rows, ${report.promotedEntries} promoted)`,
    );
    for (const issue of report.issues) {
      console.log(`  [${issue.severity}] ${issue.message}`);
      if (issue.severity === 'error') hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error('\naudit:exalted-sources found errors above.');
    process.exit(1);
  }

  console.log(
    '\naudit:exalted-sources: no inventory errors. All five splats remain locked pending source material and certification (see docs/18-exalted1e-splat-release.md).',
  );
}
