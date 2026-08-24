import { z } from 'zod';
import {
  arcaneModuleEnvelopeSchema,
  moduleIdSchema,
  moduleVersionSchema,
} from '../schema/module-envelope';

export const moduleOriginSchema = z.enum([
  'bundled',
  'published',
  'local',
  'overlay',
  'fork',
]);

export const modulePackageRecordSchema = z.strictObject({
  moduleId: moduleIdSchema,
  moduleVersion: moduleVersionSchema,
  checksum: z.string().min(1),
  origin: moduleOriginSchema,
  installedAt: z.string().datetime(),
  envelope: arcaneModuleEnvelopeSchema,
});

export type ModulePackageRecord = z.infer<typeof modulePackageRecordSchema>;

export const moduleInstallationRecordSchema = z.strictObject({
  moduleId: moduleIdSchema,
  activeVersion: moduleVersionSchema,
  origin: moduleOriginSchema,
  enabled: z.boolean(),
  enabledOverlayRefs: z.array(
    z.strictObject({
      moduleId: moduleIdSchema,
      moduleVersion: moduleVersionSchema,
    }),
  ),
  updatedAt: z.string().datetime(),
});

export type ModuleInstallationRecord = z.infer<
  typeof moduleInstallationRecordSchema
>;

export const moduleDraftRecordSchema = z.strictObject({
  id: z.string().uuid(),
  moduleId: moduleIdSchema.optional(),
  name: z.string().max(200),
  updatedAt: z.string().datetime(),
  draft: z.unknown(),
  diagnostics: z.array(z.unknown()),
});

export type ModuleDraftRecord = z.infer<typeof moduleDraftRecordSchema>;

export const moduleLockRecordSchema = z.strictObject({
  id: z.string().uuid(),
  moduleId: moduleIdSchema,
  moduleVersion: moduleVersionSchema,
  dependencies: z.array(
    z.strictObject({
      moduleId: moduleIdSchema,
      moduleVersion: moduleVersionSchema,
      checksum: z.string().min(1),
    }),
  ),
  createdAt: z.string().datetime(),
});

export type ModuleLockRecord = z.infer<typeof moduleLockRecordSchema>;
