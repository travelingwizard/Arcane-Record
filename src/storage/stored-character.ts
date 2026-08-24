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
