import { z } from 'zod';

export const combatProfileSchema = z.enum(['classic', 'power-combat']);
export const equipmentQualitySchema = z.enum([
  'poor',
  'normal',
  'exceptional',
  'perfect',
  'custom',
]);
export const magicalMaterialSchema = z.enum([
  'none',
  'orichalcum',
  'moonsilver',
  'jade',
  'starmetal',
  'soulsteel',
]);

export const ownedEquipmentSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(['weapon', 'armor', 'shield', 'ammunition']),
  definitionId: z.string().nullable(),
  customName: z.string(),
  modeId: z.string().nullable(),
  quality: equipmentQualitySchema,
  qualityAdjustments: z.object({
    speed: z.number().int().min(-9).max(9),
    accuracy: z.number().int().min(-9).max(9),
    damage: z.number().int().min(-9).max(9),
    defense: z.number().int().min(-9).max(9),
    rate: z.number().int().min(-9).max(9),
    range: z.number().int().min(-999).max(999),
  }),
  material: magicalMaterialSchema,
  equipped: z.boolean(),
  attuned: z.boolean(),
  committedEssence: z.number().int().nonnegative(),
  ammunition: z.object({
    current: z.number().int().nonnegative().nullable(),
    typeId: z.string().nullable(),
  }),
  enhancements: z.array(
    z.object({ id: z.string().uuid(), label: z.string(), notes: z.string() }),
  ),
  notes: z.string(),
});
