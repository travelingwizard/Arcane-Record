import { z } from 'zod';
import {
  defaultKultOrder,
  KULT_SCHEMA_VERSION,
  kultGroupIds,
  stabilityStates,
} from './definitions';

const uuid = z.string().uuid();
const citation = z.object({
  sourceId: z.string(),
  page: z.number().int().positive().nullable(),
});
const provenance = citation.extend({
  definitionId: z.string().nullable(),
  custom: z.boolean(),
  unresolved: z.boolean(),
  origin: z.enum(['manual', 'suggestion', 'import', 'transition']),
});
const traitRecord = provenance.extend({
  id: uuid,
  name: z.string(),
  summary: z.string(),
  trigger: z.string(),
  notes: z.string(),
});
const attribute = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['passive', 'active']),
  rating: z.number().int().min(-5).max(5),
  notes: z.string(),
});
const relation = provenance.extend({
  id: uuid,
  name: z.string(),
  description: z.string(),
  strength: z.number().int().min(-2).max(3),
  tags: z.array(z.string()),
  state: z.string(),
  notes: z.string(),
});
const wound = z.object({
  id: uuid,
  severity: z.enum(['serious', 'critical']),
  slot: z.number().int().min(1).max(4),
  description: z.string(),
  stabilized: z.boolean(),
  ongoingEffect: z.string(),
  penalty: z.number().int().min(-5).max(0),
});
const hook = z.object({
  id: uuid,
  description: z.string(),
  status: z.enum(['active', 'resolved', 'abandoned']),
  resolution: z.string(),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
});
const gear = provenance.extend({
  id: uuid,
  kind: z.enum(['gear', 'weapon']),
  name: z.string(),
  tags: z.array(z.string()),
  harm: z.string(),
  ammunition: z.number().int().nonnegative().nullable(),
  uses: z.number().int().nonnegative().nullable(),
  carried: z.boolean(),
  notes: z.string(),
});
const advancement = citation.extend({
  id: uuid,
  optionId: z.string(),
  label: z.string(),
  status: z.enum(['marked', 'claimed']),
  note: z.string(),
  createdAt: z.string().datetime(),
  claimedAt: z.string().datetime().nullable(),
});
const transitionArchive = z.object({
  id: uuid,
  from: z.enum(['general', 'sleeper', 'aware', 'enlightened']),
  to: z.enum(['aware', 'enlightened']),
  previousArchetype: z.string(),
  note: z.string(),
  advancements: z.array(advancement),
  createdAt: z.string().datetime(),
});
const historyEntry = z.object({
  id: uuid,
  kind: z.enum(['advancement', 'transition', 'correction', 'session']),
  summary: z.string(),
  createdAt: z.string().datetime(),
});
const order = z
  .array(z.enum(kultGroupIds as [string, ...string[]]))
  .length(kultGroupIds.length)
  .refine((items) => new Set(items).size === items.length);

export const kultCharacterSchema = z.object({
  schemaVersion: z.literal(KULT_SCHEMA_VERSION),
  sheetType: z.enum(['general', 'sleeper', 'aware', 'enlightened']),
  name: z.string(),
  player: z.string(),
  pronouns: z.string(),
  archetype: z.string(),
  archetypeDefinitionId: z.string().nullable(),
  occupation: z.string(),
  appearance: z.string(),
  concept: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({ build: order, play: order }),
  settings: z.object({
    matureSuggestions: z.boolean(),
    showUnavailableSuggestions: z.boolean(),
  }),
  attributes: z.array(attribute).length(10),
  darkSecrets: z.array(traitRecord),
  disadvantages: z.array(traitRecord),
  advantages: z.array(traitRecord),
  relations: z.array(relation),
  wounds: z.array(wound).length(5),
  stability: z.object({
    position: z
      .number()
      .int()
      .min(0)
      .max(stabilityStates.length - 1),
    stressEffects: z.string(),
    notes: z.string(),
  }),
  dramaticHooks: z.array(hook),
  gear: z.array(gear),
  advancements: z.array(advancement),
  transitionArchives: z.array(transitionArchive),
  transitionDraft: z
    .object({
      target: z.enum(['aware', 'enlightened']),
      newArchetype: z.string(),
      note: z.string(),
    })
    .nullable(),
  approvals: z.array(
    z.object({
      id: uuid,
      ruleId: z.string(),
      reason: z.string(),
      approvedAt: z.string().datetime(),
    }),
  ),
  notes: z.string(),
  sessionNotes: z.string(),
  history: z.array(historyEntry),
});

export type KultCharacter = z.infer<typeof kultCharacterSchema>;
export type KultTrait = KultCharacter['advantages'][number];
export type KultRelation = KultCharacter['relations'][number];
export type KultGear = KultCharacter['gear'][number];

export const kultDefaultLayout = {
  build: [...defaultKultOrder],
  play: [
    'conditions',
    'connections',
    'possessions',
    'traits',
    'character',
    'advancement',
    'records',
  ],
};

export function migrateKultCharacter(data: unknown): KultCharacter {
  const parsed = kultCharacterSchema.safeParse(data);
  if (parsed.success) return parsed.data;
  throw new Error('This KULT character cannot be migrated safely.');
}
