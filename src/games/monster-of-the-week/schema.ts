import { z } from 'zod';
import {
  MOTW_SCHEMA_VERSION,
  hunterGroupIds,
  keeperGroupIds,
} from './definitions';

const uuid = z.string().uuid();
const approval = z.object({
  id: uuid,
  ruleId: z.string(),
  reason: z.string(),
  approvedAt: z.string().datetime(),
});
const cited = z.object({
  id: uuid,
  definitionId: z.string().nullable(),
  name: z.string(),
  sourceId: z.string(),
  page: z.number().int().positive().nullable(),
  notes: z.string(),
  custom: z.boolean(),
});
const history = z.object({
  id: uuid,
  kind: z.string(),
  title: z.string(),
  description: z.string(),
  createdAt: z.string().datetime(),
});
const layout = (ids: readonly string[]) =>
  z
    .array(z.enum(ids as [string, ...string[]]))
    .length(ids.length)
    .refine((x) => new Set(x).size === x.length);
const creation = z.object({
  status: z.enum(['draft', 'manual', 'finalized']),
  step: z.number().int().min(1).max(10),
  ratingPackageIndex: z.number().int().min(0).max(4).nullable(),
  approvals: z.array(approval),
  baseline: z.unknown().nullable(),
  rebuildDraft: z.unknown().nullable(),
  finalizedAt: z.string().datetime().nullable(),
});
const campaignSnapshot = z.object({
  campaignId: z.string(),
  name: z.string(),
  revision: z.number().int().nonnegative(),
  teamConcept: z.string(),
  capturedAt: z.string().datetime(),
});
const campaignLink = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none'), snapshot: campaignSnapshot.nullable() }),
  z.object({
    kind: z.literal('linked'),
    campaignId: z.string(),
    snapshot: campaignSnapshot,
  }),
]);
const roll = z.object({
  id: uuid,
  moveId: z.string().nullable(),
  moveName: z.string(),
  rating: z.enum(['charm', 'cool', 'sharp', 'tough', 'weird', 'none']),
  dice: z.tuple([
    z.number().int().min(1).max(6),
    z.number().int().min(1).max(6),
  ]),
  ratingValue: z.number().int().min(-3).max(5),
  forward: z.number().int().min(-5).max(5),
  ongoing: z.number().int().min(-5).max(5),
  total: z.number().int(),
  outcome: z.enum(['miss', 'mixed', 'full', 'advanced']),
  choices: z.array(z.string()),
  context: z.string(),
  experienceMarked: z.boolean(),
  createdAt: z.string().datetime(),
});
const selected = cited.extend({
  state: z.enum(['available', 'active', 'spent', 'lost']),
  origin: z.enum(['creation', 'advancement', 'custom', 'import']),
});

export const motwHunterSchema = z.object({
  schemaVersion: z.literal(MOTW_SCHEMA_VERSION),
  name: z.string(),
  player: z.string(),
  pronouns: z.string(),
  look: z.string(),
  concept: z.string(),
  playbookId: z.string(),
  teamConceptId: z.string(),
  customTeamConcept: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({
    build: layout(hunterGroupIds),
    play: layout(hunterGroupIds),
  }),
  enabledSources: z.array(z.string()),
  showUnavailable: z.boolean(),
  creation,
  ratings: z.object({
    charm: z.number().int().min(-3).max(3),
    cool: z.number().int().min(-3).max(3),
    sharp: z.number().int().min(-3).max(3),
    tough: z.number().int().min(-3).max(3),
    weird: z.number().int().min(-3).max(3),
  }),
  moves: z.array(selected),
  playbookFeatures: z.array(selected),
  gear: z.array(selected),
  histories: z.array(cited.extend({ hunterId: z.string().nullable() })),
  luck: z.object({
    current: z.number().int().min(0).max(9),
    maximum: z.number().int().min(0).max(9),
    special: z.string(),
  }),
  harm: z.object({
    current: z.number().int().min(0).max(7),
    unstable: z.boolean(),
    armor: z.number().int().min(0).max(4),
    notes: z.string(),
  }),
  experienceMarks: z.number().int().min(0).max(5),
  levelUps: z.number().int().nonnegative(),
  improvements: z.array(selected),
  advancedMoves: z.array(z.string()),
  retired: z.boolean(),
  mystery: z.object({
    name: z.string(),
    clues: z.array(cited),
    questions: z.array(cited),
    holds: z.number().int().min(0).max(99),
    temporaryEffects: z.array(cited),
    notes: z.string(),
  }),
  rollHistory: z.array(roll),
  history: z.array(history),
  notes: z.string(),
  campaign: campaignLink,
});
export type MotwHunter = z.infer<typeof motwHunterSchema>;

const threat = z.object({
  id: uuid,
  mysteryId: z.string().nullable(),
  name: z.string(),
  kind: z.enum(['monster', 'minion', 'bystander', 'location', 'phenomenon']),
  type: z.string(),
  motivation: z.string(),
  powers: z.string(),
  weaknesses: z.string(),
  attacks: z.string(),
  armor: z.number().int().min(0).max(10),
  harmCapacity: z.number().int().min(0).max(99),
  harm: z.number().int().min(0).max(99),
  customMoves: z.string(),
  notes: z.string(),
  sourceId: z.string(),
  page: z.number().int().positive().nullable(),
});
const mystery = z.object({
  id: uuid,
  name: z.string(),
  concept: z.string(),
  hook: z.string(),
  countdown: z.object({
    day: z.string(),
    shadows: z.string(),
    dusk: z.string(),
    sunset: z.string(),
    nightfall: z.string(),
    midnight: z.string(),
  }),
  currentStage: z.enum([
    'none',
    'day',
    'shadows',
    'dusk',
    'sunset',
    'nightfall',
    'midnight',
  ]),
  status: z.enum(['planned', 'active', 'resolved', 'abandoned']),
  revealedClues: z.array(z.string()),
  hunterQuestions: z.array(z.string()),
  outcome: z.string(),
  notes: z.string(),
  createdAt: z.string().datetime(),
});
export const motwKeeperSchema = z.object({
  schemaVersion: z.literal(MOTW_SCHEMA_VERSION),
  name: z.string(),
  keeper: z.string(),
  teamConcept: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({
    build: layout(keeperGroupIds),
    play: layout(keeperGroupIds),
  }),
  enabledSources: z.array(z.string()),
  showUnavailable: z.boolean(),
  revision: z.number().int().nonnegative(),
  creation,
  roster: z.array(
    z.object({
      id: uuid,
      hunterId: z.string().nullable(),
      name: z.string(),
      playbookId: z.string(),
      status: z.enum(['active', 'retired', 'missing']),
      notes: z.string(),
    }),
  ),
  mysteries: z.array(mystery),
  threats: z.array(threat),
  arcs: z.array(cited),
  customMoves: z.array(cited),
  session: z.object({
    title: z.string(),
    date: z.string(),
    notes: z.string(),
    answers: z.array(z.boolean()).length(4),
    awardsReviewed: z.boolean(),
  }),
  history: z.array(history),
  notes: z.string(),
});
export type MotwKeeper = z.infer<typeof motwKeeperSchema>;

export const migrateMotwHunter = (data: unknown) =>
  motwHunterSchema.parse(data);
export const migrateMotwKeeper = (data: unknown) =>
  motwKeeperSchema.parse(data);
