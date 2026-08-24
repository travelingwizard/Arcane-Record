import { z } from 'zod';
import {
  moduleIdSchema,
  moduleVersionRefSchema,
  moduleVersionSchema,
} from '../modules/schema/module-envelope';

export const ARCANE_MODULE_SYSTEM_ID = 'arcane-module' as const;

export const characterModuleRefSchema = z.strictObject({
  moduleId: moduleIdSchema,
  moduleVersion: moduleVersionSchema,
  gameNodeId: z.string().min(1),
  sheetTemplateId: z.string().min(1),
  sheetTemplateVersion: z.number().int().positive(),
  dependencyLockId: z.string().uuid(),
  enabledOverlayRefs: z.array(moduleVersionRefSchema).default([]),
  convertedFromCharacterId: z.string().min(1).optional(),
});

export const characterHomebrewSchema = z.strictObject({
  customDefinitions: z
    .array(
      z.strictObject({
        id: z.string().uuid(),
        kind: z.string().min(1).max(100),
        name: z.string().min(1).max(200),
        data: z.record(z.string(), z.json()).default({}),
      }),
    )
    .max(1_000)
    .default([]),
  definitionOverrides: z
    .array(
      z.strictObject({
        id: z.string().uuid(),
        definitionId: z.string().min(1).max(260),
        fields: z.record(z.string(), z.json()),
        notes: z.string().max(2_000).default(''),
      }),
    )
    .max(1_000)
    .default([]),
});

export const storedCharacterSchema = z
  .object({
    id: z.string().min(1),
    systemId: z.string().min(1),
    systemVersion: z.number().int().nonnegative(),
    name: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    data: z.unknown(),
    moduleRef: characterModuleRefSchema.optional(),
    homebrew: characterHomebrewSchema.optional(),
  })
  .superRefine((record, context) => {
    if (
      (record.moduleRef && record.systemId !== ARCANE_MODULE_SYSTEM_ID) ||
      (!record.moduleRef && record.systemId === ARCANE_MODULE_SYSTEM_ID)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['systemId'],
        message:
          'Module-backed characters must use the reserved arcane-module interpreter ID.',
      });
    }
  });

export type StoredCharacter = z.infer<typeof storedCharacterSchema>;

export type CharacterAvailability =
  | { status: 'available'; record: StoredCharacter }
  | {
      status: 'unavailable' | 'invalid';
      record: StoredCharacter;
      message: string;
    };
