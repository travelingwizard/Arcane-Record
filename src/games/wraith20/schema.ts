import { z } from 'zod';
import {
  WR20_SCHEMA_VERSION,
  WR20_SHADOW_SCHEMA_VERSION,
  defaultWr20Order,
  wr20GroupIds,
} from './definitions';
const uuid = z.string().uuid();
const rating = z.number().int().min(0).max(10);
const trait = z.object({
  id: uuid,
  definitionId: z.string().nullable(),
  name: z.string(),
  category: z.string(),
  rating,
  notes: z.string(),
  sourceId: z.string(),
  page: z.number().int().positive().nullable(),
  origin: z.enum(['creator', 'freebie', 'manual', 'advancement', 'import']),
});
const passion = z.object({
  id: uuid,
  statement: z.string(),
  emotion: z.string(),
  rating: rating.max(5),
  resolved: z.boolean(),
  notes: z.string(),
});
const link = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({ kind: z.literal('linked'), shadowId: z.string().min(1) }),
]);
const ledger = z.object({
  id: uuid,
  date: z.string(),
  kind: z.enum(['award', 'purchase', 'refund', 'adjustment', 'story']),
  amount: z.number().int(),
  targetId: z.string().nullable(),
  targetName: z.string(),
  previousRating: z.number().int().nullable(),
  newRating: z.number().int().nullable(),
  description: z.string(),
  reversedEntryId: z.string().nullable(),
  createdAt: z.string().datetime(),
});
const roll = z.object({
  id: uuid,
  pool: z.number().int().min(0).max(100),
  shadowDice: z.number().int().min(0).max(5),
  difficulty: z.number().int().min(2).max(10),
  dice: z.array(z.number().int().min(1).max(10)),
  successes: z.number().int(),
  shadowOnes: z.number().int().nonnegative(),
  result: z.enum(['botch', 'failure', 'success']),
  context: z.string(),
  createdAt: z.string().datetime(),
});
const order = z
  .array(z.enum(wr20GroupIds as [string, ...string[]]))
  .length(wr20GroupIds.length)
  .refine((x) => new Set(x).size === x.length);
export const wr20CharacterSchema = z.object({
  schemaVersion: z.literal(WR20_SCHEMA_VERSION),
  characterType: z.enum(['wraith', 'medium', 'spectre']),
  name: z.string(),
  player: z.string(),
  chronicle: z.string(),
  concept: z.string(),
  nature: z.string(),
  demeanor: z.string(),
  life: z.string(),
  death: z.string(),
  regret: z.string(),
  appearance: z.string(),
  history: z.string(),
  notes: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({ build: order, play: order }),
  enabledSources: z.array(z.string()),
  showUnavailableSources: z.boolean(),
  creation: z.object({
    status: z.enum(['draft', 'manual', 'finalized']),
    step: z.number().int().min(1).max(13),
    attributePriorities: z
      .array(z.enum(['physical', 'social', 'mental']))
      .length(3),
    abilityPriorities: z
      .array(z.enum(['talents', 'skills', 'knowledges']))
      .length(3),
    freebieSpent: z.number().int().nonnegative(),
    shadowFreebieAdjustment: z.number().int().min(-15).max(7),
    matureContent: z.boolean(),
    storytellerApproved: z.boolean(),
    approvalReason: z.string(),
    finalizedAt: z.string().datetime().nullable(),
    baseline: z.unknown().nullable(),
    rebuildDraft: z.unknown().nullable(),
  }),
  attributes: z.array(trait),
  abilities: z.array(trait),
  backgrounds: z.array(trait),
  arcanoi: z.array(trait),
  passions: z.array(passion),
  fetters: z.array(passion),
  merits: z.array(trait),
  flaws: z.array(trait),
  corpus: z.object({
    maximum: z.number().int().min(1).max(20),
    current: z.number().int().min(0).max(20),
    damage: z.array(z.enum(['bashing', 'lethal', 'aggravated'])),
  }),
  pathos: z.object({ maximum: rating, current: rating }),
  willpower: z.object({ permanent: rating, current: rating }),
  shadow: link,
  risen: z.object({
    active: z.boolean(),
    sourceEnabled: z.boolean(),
    bodyCondition: z.string(),
    overridingBehavior: z.string(),
    notes: z.string(),
  }),
  circleName: z.string(),
  faction: z.string(),
  guild: z.string(),
  legion: z.string(),
  haunts: z.array(trait),
  possessions: z.array(trait),
  conditions: z.array(trait),
  temporaryEffects: z.string(),
  experienceLedger: z.array(ledger),
  rollHistory: z.array(roll),
  sessionNotes: z.string(),
});
export type Wr20Character = z.infer<typeof wr20CharacterSchema>;
export type Wr20Trait = z.infer<typeof trait>;
export type Wr20Roll = z.infer<typeof roll>;
export const wr20DefaultLayout = {
  build: [...defaultWr20Order],
  play: [
    'resources',
    'conditions',
    'advantages',
    'traits',
    'society',
    'character',
    'advancement',
    'records',
  ],
};
export const wr20ShadowSchema = z.object({
  schemaVersion: z.literal(WR20_SHADOW_SCHEMA_VERSION),
  name: z.string(),
  psycheCharacterId: z.string().nullable(),
  psycheName: z.string(),
  shadowguidePlayer: z.string(),
  archetype: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({ build: z.array(z.string()), play: z.array(z.string()) }),
  permanentAngst: rating,
  temporaryAngst: rating,
  darkPassions: z.array(passion),
  thorns: z.array(trait),
  catharsisActive: z.boolean(),
  catharsisHistory: z.array(trait),
  harrowingNotes: z.string(),
  boundaries: z.string(),
  notes: z.string(),
  experienceLedger: z.array(ledger),
});
export type Wr20Shadow = z.infer<typeof wr20ShadowSchema>;
export function migrateWr20Character(data: unknown): Wr20Character {
  return wr20CharacterSchema.parse(data);
}
export function migrateWr20Shadow(data: unknown): Wr20Shadow {
  return wr20ShadowSchema.parse(data);
}
