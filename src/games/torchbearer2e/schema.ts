import { z } from 'zod';
import {
  torchbearer2eConditionIds,
  torchbearer2eGroupIds,
  torchbearer2eInventoryLocations,
} from './definitions';

const nonnegativeInteger = z.number().int().nonnegative();
const uuid = z.string().uuid();
const advancementSchema = z.object({
  rating: z.number().int().min(0).max(10),
  passed: z.number().int().min(0).max(99),
  failed: z.number().int().min(0).max(99),
});
const groupIdSchema = z.enum(torchbearer2eGroupIds);
const groupOrderSchema = z
  .array(groupIdSchema)
  .length(torchbearer2eGroupIds.length)
  .refine((order) => new Set(order).size === torchbearer2eGroupIds.length, {
    message: 'Section order must contain every group exactly once.',
  });

export const torchbearer2eCharacterSchema = z.object({
  identity: z.object({
    name: z.string(),
    stock: z.string(),
    class: z.string(),
    age: z.string(),
    home: z.string(),
    raiment: z.string(),
    parents: z.string(),
    mentor: z.string(),
    friend: z.string(),
    enemy: z.string(),
    level: z.number().int().min(1).max(99),
  }),
  drives: z.object({
    belief: z.string(),
    creed: z.string(),
    goal: z.string(),
    instinct: z.string(),
  }),
  traits: z.array(
    z.object({
      id: uuid,
      name: z.string(),
      level: z.number().int().min(1).max(3),
      beneficialUses: z.number().int().min(0).max(3),
      checks: z.number().int().min(0).max(3),
      notes: z.string(),
    }),
  ),
  rewards: z.object({
    fate: z.object({
      current: nonnegativeInteger,
      total: nonnegativeInteger,
      totalSpent: nonnegativeInteger,
    }),
    persona: z.object({
      current: nonnegativeInteger,
      total: nonnegativeInteger,
      totalSpent: nonnegativeInteger,
    }),
  }),
  conditions: z.object(
    Object.fromEntries(
      torchbearer2eConditionIds.map((id) => [id, z.boolean()]),
    ) as Record<(typeof torchbearer2eConditionIds)[number], z.ZodBoolean>,
  ),
  abilities: z.object({
    will: advancementSchema,
    health: advancementSchema,
    nature: advancementSchema.extend({
      current: z.number().int().min(0).max(7),
      descriptors: z.array(z.string()).length(3),
    }),
    resources: advancementSchema,
    circles: advancementSchema,
    precedence: z.number().int().min(0).max(7),
    might: z.number().int().min(0).max(8),
  }),
  skills: z.array(
    z.object({
      id: uuid,
      definitionId: z.string().nullable(),
      name: z.string(),
      beginnersLuckRoot: z.enum(['will', 'health']),
      rating: z.number().int().min(0).max(6),
      passed: z.number().int().min(0).max(99),
      failed: z.number().int().min(0).max(99),
      notes: z.string(),
    }),
  ),
  wises: z.array(
    z.object({
      id: uuid,
      name: z.string(),
      uses: z.object({
        pass: z.boolean(),
        fail: z.boolean(),
        fate: z.boolean(),
        persona: z.boolean(),
      }),
      notes: z.string(),
    }),
  ),
  inventory: z.array(
    z.object({
      id: uuid,
      name: z.string(),
      location: z.enum(torchbearer2eInventoryLocations),
      slots: z.number().int().min(0).max(12),
      quantity: z.number().int().min(1).max(999),
      status: z.enum(['carried', 'dropped', 'lost', 'cached']),
      damaged: z.boolean(),
      weariness: z.boolean(),
      notes: z.string(),
    }),
  ),
  relationships: z.array(
    z.object({
      id: uuid,
      name: z.string(),
      kind: z.enum(['ally', 'enemy']),
      location: z.string(),
      status: z.string(),
      notes: z.string(),
    }),
  ),
  magic: z.object({
    urdr: nonnegativeInteger,
    burden: nonnegativeInteger,
    memoryPalace: nonnegativeInteger,
    relics: z.array(
      z.object({
        id: uuid,
        name: z.string(),
        inventory: z.string(),
        invocationName: z.string(),
        circle: nonnegativeInteger,
        notes: z.string(),
      }),
    ),
    spells: z.array(
      z.object({
        id: uuid,
        name: z.string(),
        obstacle: nonnegativeInteger,
        library: z.boolean(),
        spellBook: z.boolean(),
        memorized: z.boolean(),
        cast: z.boolean(),
        scroll: z.boolean(),
        supplies: z.boolean(),
        effect: z.string(),
      }),
    ),
  }),
  advancement: z.object({
    experience: z.object({
      total: nonnegativeInteger,
      current: nonnegativeInteger,
    }),
    levelBenefit: z.string(),
    history: z.string(),
  }),
  notes: z.string(),
  sheetLayout: z.object({ groupOrder: groupOrderSchema }),
});

export type Torchbearer2eCharacter = z.infer<
  typeof torchbearer2eCharacterSchema
>;

export function migrateTorchbearer2eCharacter(
  data: unknown,
  fromVersion: number,
) {
  void fromVersion;
  return torchbearer2eCharacterSchema.parse(data);
}
