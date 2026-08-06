import { z } from 'zod';
import {
  defaultExaltedSectionGroupOrder,
  dragonBloodedBackgrounds,
  exaltedAbilities,
  exaltedSectionGroupIds,
  exaltedSheetTypes,
  exaltedVirtues,
  solarBackgrounds,
} from './definitions';

const fivePointRating = z.number().int().min(0).max(5);
const attributeRating = z.number().int().min(1).max(5);
const exaltedSectionGroupIdSchema = z.enum(exaltedSectionGroupIds);
const exaltedSectionGroupOrderSchema = z
  .array(exaltedSectionGroupIdSchema)
  .length(exaltedSectionGroupIds.length)
  .refine((order) => new Set(order).size === exaltedSectionGroupIds.length, {
    message: 'Section order must contain every group exactly once.',
  });

const abilitiesShape = Object.fromEntries(
  exaltedAbilities.map((ability) => [ability.id, fivePointRating]),
) as Record<(typeof exaltedAbilities)[number]['id'], typeof fivePointRating>;

const virtuesShape = Object.fromEntries(
  exaltedVirtues.map((virtue) => [virtue.id, fivePointRating]),
) as Record<(typeof exaltedVirtues)[number]['id'], typeof fivePointRating>;

export const exaltedAbilityIdSchema = z.enum(
  exaltedAbilities.map((ability) => ability.id),
);

export const exaltedBackgroundIdSchema = z.enum(
  Array.from(
    new Set(
      [...solarBackgrounds, ...dragonBloodedBackgrounds].map(
        (background) => background.id,
      ),
    ),
  ),
);

const solarBackgroundIds = new Set<string>(
  solarBackgrounds.map((background) => background.id),
);
const dragonBloodedBackgroundIds = new Set<string>(
  dragonBloodedBackgrounds.map((background) => background.id),
);

export const exalted1eCharacterSchema = z
  .object({
    sheetType: z.enum(exaltedSheetTypes),
    identity: z.object({
      name: z.string(),
      player: z.string(),
      concept: z.string(),
      nature: z.string(),
      caste: z.string(),
      aspect: z.string(),
      house: z.string(),
      anima: z.string(),
    }),
    attributes: z.object({
      physical: z.object({
        strength: attributeRating,
        dexterity: attributeRating,
        stamina: attributeRating,
      }),
      social: z.object({
        charisma: attributeRating,
        manipulation: attributeRating,
        appearance: attributeRating,
      }),
      mental: z.object({
        perception: attributeRating,
        intelligence: attributeRating,
        wits: attributeRating,
      }),
    }),
    abilities: z.object(abilitiesShape),
    favoredAbilities: z.array(exaltedAbilityIdSchema),
    backgrounds: z.array(
      z.object({
        id: z.string().uuid(),
        definitionId: exaltedBackgroundIdSchema,
        rating: fivePointRating,
        notes: z.string(),
      }),
    ),
    virtues: z.object(virtuesShape),
    willpower: z.object({
      permanent: z.number().int().min(0).max(10),
      temporary: z.number().int().min(0).max(10),
    }),
    essence: z.object({
      rating: z.number().int().min(1).max(6),
      personal: z.number().int().min(0).max(999),
      peripheral: z.number().int().min(0).max(999),
      committed: z.number().int().min(0).max(999),
    }),
    limit: z.object({
      rating: z.number().int().min(0).max(10),
      virtueFlaw: z.string(),
    }),
    notes: z.object({
      anima: z.string(),
      weapons: z.string(),
      experience: z.string(),
    }),
    sheetLayout: z.object({
      groupOrder: exaltedSectionGroupOrderSchema,
    }),
  })
  .superRefine((character, context) => {
    const allowedBackgroundIds =
      character.sheetType === 'solar'
        ? solarBackgroundIds
        : dragonBloodedBackgroundIds;
    character.backgrounds.forEach((background, index) => {
      if (!allowedBackgroundIds.has(background.definitionId)) {
        context.addIssue({
          code: 'custom',
          message: `Background is not available to ${character.sheetType} sheets.`,
          path: ['backgrounds', index, 'definitionId'],
        });
      }
    });
  });

export type Exalted1eCharacter = z.infer<typeof exalted1eCharacterSchema>;

export function migrateExalted1eCharacter(data: unknown, fromVersion: number) {
  const candidate =
    fromVersion < 2 && data && typeof data === 'object' && !Array.isArray(data)
      ? {
          ...data,
          sheetLayout: {
            groupOrder: [...defaultExaltedSectionGroupOrder],
          },
        }
      : data;
  return exalted1eCharacterSchema.parse(candidate);
}
