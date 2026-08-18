import { z } from 'zod';

export const possessionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  kind: z.enum([
    'mundane',
    'weapon',
    'armor',
    'shield',
    'ammunition',
    'artifact',
    'hearthstone',
    'consumable',
    'other',
  ]),
  quantity: z.number().int().min(1),
  carried: z.boolean(),
  equipped: z.boolean(),
  stored: z.boolean(),
  lost: z.boolean(),
  loaned: z.boolean(),
  notes: z.string(),
  linkedEquipmentId: z.string().uuid().nullable(),
  linkedBackgroundIds: z.array(z.string().uuid()),
  artifact: z
    .object({
      rating: z.number().int().min(0).max(5),
      material: z.string(),
      attuned: z.boolean(),
      attunementCost: z.number().int().nonnegative(),
      committedEssence: z.number().int().nonnegative(),
      powers: z.string(),
      source: z.string(),
    })
    .nullable(),
  createdAt: z.string().datetime(),
});

export const manseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  rating: z.number().int().min(0).max(5),
  aspect: z.string(),
  location: z.string(),
  description: z.string(),
  powers: z.string(),
  source: z.string(),
  linkedBackgroundIds: z.array(z.string().uuid()),
  createdAt: z.string().datetime(),
});

export const hearthstoneSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  rating: z.number().int().min(0).max(5),
  aspect: z.string(),
  powers: z.string(),
  source: z.string(),
  notes: z.string(),
  linkedManseId: z.string().uuid().nullable(),
  socketedPossessionId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});
