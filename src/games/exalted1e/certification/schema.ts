import { z } from 'zod';
import { plannedExaltedFamilies } from '../definitions';

/**
 * A test dimension's status. `not-run` is the only honest default for a
 * family with no implementation yet — it is treated as a failure by
 * `isFamilyAvailable`, never as a pass.
 */
export const certificationTestStatusSchema = z.enum([
  'not-run',
  'pass',
  'fail',
]);
export type CertificationTestStatus = z.infer<
  typeof certificationTestStatusSchema
>;

export const splatCatalogEvidenceSchema = z
  .object({
    /** Total rows across every source-book inventory for this family. */
    totalInventoryRows: z.number().int().nonnegative(),
    /**
     * The subset of `totalInventoryRows` that is actually meant to become a
     * strict, `definitionId`-referenced production catalog entry (Charms,
     * Spells/Sorcery/Necromancy/Astrology-equivalents, Merits/Flaws,
     * Backgrounds — anything validated by `schema.ts`). This is
     * intentionally smaller than `totalInventoryRows`: some inventory rows
     * are never meant to reach a catalog by design, matching the existing
     * Solar/Dragon-Blooded precedent of representing named Artifacts,
     * Hearthstones, Manses, and Warstriders as free-text `possessions`
     * entries (see `shared/possessions/schema.ts`) rather than a strict
     * catalog, plus rows that are permanently non-selectable (`reference-only`,
     * `gm-only`, `excluded`, `calculated` dispositions) or still
     * `unresolved`. The catalog dimension passes only once `promotedEntries`
     * reaches this number, not the raw inventory total — see
     * `verification.ts`'s `catalogDimensionPasses`.
     */
    promotableEntries: z.number().int().nonnegative(),
    /** Inventory rows promoted into a production catalog file. */
    promotedEntries: z.number().int().nonnegative(),
    /** Inventory rows still marked `unresolved` (see source-audit disposition). */
    unresolvedEntries: z.number().int().nonnegative(),
    /**
     * Hash of the promoted production catalog file(s), computed by
     * `scripts/audit-exalted-sources.mjs`. Empty string means no production
     * catalog file exists yet. `verification.ts` trusts this value at runtime;
     * the audit script is what actually recomputes and cross-checks it
     * against the catalog files on disk.
     */
    checksum: z.string(),
  })
  .refine((catalog) => catalog.promotableEntries <= catalog.totalInventoryRows, {
    message: 'promotableEntries cannot exceed totalInventoryRows.',
  })
  .refine((catalog) => catalog.promotedEntries <= catalog.promotableEntries, {
    message: 'promotedEntries cannot exceed promotableEntries.',
  });
export type SplatCatalogEvidence = z.infer<typeof splatCatalogEvidenceSchema>;

export const splatCertificationRecordSchema = z.object({
  family: z.enum(plannedExaltedFamilies),
  catalog: splatCatalogEvidenceSchema,
  rulesTests: certificationTestStatusSchema,
  creatorTests: certificationTestStatusSchema,
  migrationTests: certificationTestStatusSchema,
  browserTests: certificationTestStatusSchema,
  /** Set only once every dimension below has passed. Null while locked. */
  certifiedAt: z.string().datetime().nullable(),
  notes: z.string(),
});
export type SplatCertificationRecord = z.infer<
  typeof splatCertificationRecordSchema
>;
