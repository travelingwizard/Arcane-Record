import { z } from 'zod';
import {
  moduleIdSchema,
  moduleVersionSchema,
} from '../src/modules/schema/module-envelope';

export const registryRoleSchema = z.enum([
  'publisher',
  'reviewer',
  'registry-admin',
]);
export const registryClaimsSchema = z.strictObject({
  iss: z.string().min(1),
  aud: z.union([z.string(), z.array(z.string())]),
  sub: z.string().min(1).max(200),
  exp: z.number().int(),
  nbf: z.number().int().optional(),
  roles: z.array(registryRoleSchema).max(10),
  namespaces: z.array(moduleIdSchema).max(100).default([]),
  amr: z.array(z.string()).max(20).default([]),
  jti: z.string().min(1).max(200),
});
export type RegistryClaims = z.infer<typeof registryClaimsSchema>;

export const stagedRecordSchema = z.strictObject({
  id: z.string().uuid(),
  moduleId: moduleIdSchema,
  moduleVersion: moduleVersionSchema,
  checksum: z.string().regex(/^[a-f0-9]{64}$/),
  stagedBy: z.string().min(1),
  stagedAt: z.string().datetime(),
  status: z.enum(['staged', 'rejected', 'published']),
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().datetime().optional(),
  reason: z.string().max(2000).optional(),
});
export type StagedRecord = z.infer<typeof stagedRecordSchema>;

export const publishedRecordSchema = z.strictObject({
  moduleId: moduleIdSchema,
  moduleVersion: moduleVersionSchema,
  checksum: z.string().regex(/^[a-f0-9]{64}$/),
  publishedAt: z.string().datetime(),
  publishedBy: z.string(),
  reviewedBy: z.string(),
  deprecatedAt: z.string().datetime().optional(),
  deprecatedBy: z.string().optional(),
  deprecationReason: z.string().max(2000).optional(),
});
export type PublishedRecord = z.infer<typeof publishedRecordSchema>;

export const registryMetadataSchema = z.strictObject({
  formatVersion: z.literal(1),
  stages: z.array(stagedRecordSchema),
  published: z.array(publishedRecordSchema),
  recommendedVersions: z.record(moduleIdSchema, moduleVersionSchema),
  revokedTokenIds: z.array(z.string()).default([]),
});
export type RegistryMetadata = z.infer<typeof registryMetadataSchema>;
