import { z } from 'zod';
import {
  defaultShadowrun1eOrder,
  shadowrun1eGroupIds,
  SHADOWRUN1E_SCHEMA_VERSION,
} from './definitions';

const uuid = z.string().uuid();
const rating = z.number().int().min(0).max(20);
const priority = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);
const sourceRef = z.object({
  definitionId: z.string().nullable(),
  sourceId: z.string(),
  page: z.number().int().positive().nullable(),
  unresolved: z.boolean(),
});
const namedRating = sourceRef.extend({
  id: uuid,
  name: z.string(),
  rating,
  notes: z.string(),
});
const item = sourceRef.extend({
  id: uuid,
  name: z.string(),
  category: z.string(),
  rating: rating,
  quantity: z.number().int().min(1),
  cost: z.number().int().nonnegative(),
  active: z.boolean(),
  notes: z.string(),
});
const groupOrder = z
  .array(z.enum(shadowrun1eGroupIds as [string, ...string[]]))
  .length(shadowrun1eGroupIds.length)
  .refine((value) => new Set(value).size === value.length);

export const shadowrun1eCharacterSchema = z.object({
  schemaVersion: z.literal(SHADOWRUN1E_SCHEMA_VERSION),
  name: z.string(),
  player: z.string(),
  streetName: z.string(),
  metatype: z.enum(['human', 'elf', 'dwarf', 'ork', 'troll', 'custom']),
  archetype: z.string(),
  age: z.string(),
  sex: z.string(),
  height: z.string(),
  weight: z.string(),
  description: z.string(),
  notes: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({ build: groupOrder, play: groupOrder }),
  creation: z.object({
    status: z.enum(['draft', 'manual', 'finalized']),
    priorities: z.object({
      magic: priority,
      attributes: priority,
      skills: priority,
      tech: priority,
      race: priority,
    }),
    gmApproved: z.boolean(),
    approvalNotes: z.string(),
    finalizedAt: z.string().datetime().nullable(),
  }),
  enabledSources: z.array(z.string()),
  showUnavailableSources: z.boolean(),
  attributes: z.object({
    body: rating,
    quickness: rating,
    strength: rating,
    charisma: rating,
    intelligence: rating,
    willpower: rating,
    essence: z.number().min(0).max(6),
    magic: rating,
  }),
  pools: z.object({
    combat: rating,
    hacking: rating,
    magic: rating,
    astral: rating,
    defense: rating,
  }),
  skills: z.array(namedRating.extend({ specialization: z.string() })),
  spells: z.array(
    namedRating.extend({
      category: z.string(),
      force: rating,
      drain: z.string(),
    }),
  ),
  cyberware: z.array(item.extend({ essenceCost: z.number().nonnegative() })),
  gear: z.array(item),
  contacts: z.array(
    z.object({
      id: uuid,
      name: z.string(),
      relationship: z.string(),
      notes: z.string(),
    }),
  ),
  matrix: z.object({
    deck: z.string(),
    persona: z.object({
      body: rating,
      evasion: rating,
      masking: rating,
      sensors: rating,
    }),
    programs: z.array(item),
    notes: z.string(),
  }),
  combat: z.object({
    armorBallistic: rating,
    armorImpact: rating,
    damagePhysical: z.number().int().min(0).max(10),
    damageStun: z.number().int().min(0).max(10),
    initiativeDice: z.number().int().min(1).max(10),
    initiativeBonus: z.number().int().min(-20).max(50),
    currentInitiative: z.number().int().min(-100).max(200),
    conditions: z.string(),
  }),
  experience: z.object({
    total: z.number().int().nonnegative(),
    current: z.number().int().nonnegative(),
  }),
});

export type Shadowrun1eCharacter = z.infer<typeof shadowrun1eCharacterSchema>;

export function migrateShadowrun1eCharacter(
  data: unknown,
): Shadowrun1eCharacter {
  const parsed = shadowrun1eCharacterSchema.safeParse(data);
  if (parsed.success) return parsed.data;
  throw new Error('This Shadowrun character cannot be migrated safely.');
}

export const shadowrun1eDefaultLayout = {
  build: [...defaultShadowrun1eOrder],
  play: [
    'combat',
    'traits',
    'magic',
    'resources',
    'character',
    'advancement',
    'records',
    'creation',
  ],
};
