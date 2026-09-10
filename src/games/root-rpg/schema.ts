import { z } from 'zod';
import {
  ROOT_SCHEMA_VERSION,
  campaignGroupIds,
  vagabondGroupIds,
} from './definitions';
const uuid = z.string().uuid(),
  dt = z.string().datetime();
const layout = (ids: readonly string[]) =>
  z
    .array(z.enum(ids as [string, ...string[]]))
    .length(ids.length)
    .refine((x) => new Set(x).size === x.length);
const cited = z.object({
  id: uuid,
  definitionId: z.string().nullable(),
  name: z.string(),
  sourceId: z.string(),
  page: z.number().int().positive().nullable(),
  notes: z.string(),
  custom: z.boolean(),
});
const approval = z.object({
  id: uuid,
  ruleId: z.string(),
  reason: z.string(),
  approvedAt: dt,
});
const history = z.object({
  id: uuid,
  kind: z.string(),
  title: z.string(),
  description: z.string(),
  createdAt: dt,
});
const creation = z.object({
  status: z.enum(['draft', 'manual', 'finalized']),
  step: z.number().int().min(1).max(10),
  statBoost: z
    .enum(['charm', 'cunning', 'finesse', 'luck', 'might'])
    .nullable(),
  approvals: z.array(approval),
  baseline: z.unknown().nullable(),
  rebuildDraft: z.unknown().nullable(),
  finalizedAt: dt.nullable(),
});
const selected = cited.extend({
  origin: z.enum(['creation', 'advancement', 'custom', 'import']),
  active: z.boolean(),
});
const reputation = z.object({
  id: uuid,
  factionId: z.string().nullable(),
  name: z.string(),
  rating: z.number().int().min(-3).max(3),
  prestige: z.number().int().nonnegative(),
  notoriety: z.number().int().nonnegative(),
  sourceId: z.string(),
  custom: z.boolean(),
  notes: z.string(),
});
const equipment = cited.extend({
  value: z.number().int().nonnegative(),
  load: z.number().int().nonnegative(),
  wearCurrent: z.number().int().nonnegative(),
  wearMaximum: z.number().int().nonnegative(),
  tags: z.array(z.string()),
  state: z.enum(['carried', 'stored', 'lost', 'destroyed']),
  origin: z.enum(['creation', 'advancement', 'custom', 'import']),
});
const campaignSnapshot = z.object({
  campaignId: z.string(),
  name: z.string(),
  revision: z.number().int().nonnegative(),
  bandName: z.string(),
  capturedAt: dt,
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
  stat: z.enum([
    'charm',
    'cunning',
    'finesse',
    'luck',
    'might',
    'reputation',
    'none',
  ]),
  dice: z.tuple([
    z.number().int().min(1).max(6),
    z.number().int().min(1).max(6),
  ]),
  statValue: z.number().int().min(-3).max(3),
  modifier: z.number().int().min(-5).max(5),
  total: z.number().int(),
  outcome: z.enum(['miss', 'mixed', 'full']),
  choices: z.array(z.string()),
  costs: z.array(z.string()),
  context: z.string(),
  createdAt: dt,
});
export const rootVagabondSchema = z.object({
  schemaVersion: z.literal(ROOT_SCHEMA_VERSION),
  name: z.string(),
  player: z.string(),
  pronouns: z.string(),
  species: z.string(),
  look: z.string(),
  demeanor: z.string(),
  details: z.string(),
  concept: z.string(),
  playbookId: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({
    build: layout(vagabondGroupIds),
    play: layout(vagabondGroupIds),
  }),
  enabledSources: z.array(z.string()),
  showUnavailable: z.boolean(),
  creation,
  stats: z.object({
    charm: z.number().int().min(-3).max(3),
    cunning: z.number().int().min(-3).max(3),
    finesse: z.number().int().min(-3).max(3),
    luck: z.number().int().min(-3).max(3),
    might: z.number().int().min(-3).max(3),
  }),
  backgroundAnswers: z.array(cited),
  nature: selected.nullable(),
  drives: z.array(selected.extend({ advancedThisSession: z.boolean() })),
  moves: z.array(selected),
  roguishFeats: z.array(selected),
  weaponSkills: z.array(selected),
  masteries: z.array(selected),
  connections: z.array(
    cited.extend({ vagabondId: z.string().nullable(), active: z.boolean() }),
  ),
  reputation: z.array(reputation),
  equipment: z.array(equipment),
  value: z.number().int().min(0).max(999),
  load: z.object({
    current: z.number().int().min(0).max(99),
    burdened: z.number().int().min(0).max(99),
    maximum: z.number().int().min(0).max(99),
  }),
  harm: z.object({
    depletion: z.number().int().min(0).max(6),
    depletionMaximum: z.number().int().min(1).max(6),
    exhaustion: z.number().int().min(0).max(6),
    exhaustionMaximum: z.number().int().min(1).max(6),
    injury: z.number().int().min(0).max(6),
    injuryMaximum: z.number().int().min(1).max(6),
  }),
  job: z.object({
    name: z.string(),
    employer: z.string(),
    objective: z.string(),
    reward: z.string(),
    status: z.enum(['none', 'active', 'completed', 'failed']),
    notes: z.string(),
  }),
  temporaryEffects: z.array(cited),
  advancements: z.array(history),
  rollHistory: z.array(roll),
  history: z.array(history),
  notes: z.string(),
  totalExperience: z.number().int().nonnegative(),
  currentExperience: z.number().int().nonnegative(),
  campaign: campaignLink,
});
export type RootVagabond = z.infer<typeof rootVagabondSchema>;
const clearing = z.object({
  id: uuid,
  definitionId: z.string().nullable(),
  name: z.string(),
  controllingFactionId: z.string().nullable(),
  residents: z.array(cited),
  locations: z.array(cited),
  conflicts: z.string(),
  specialRules: z.string(),
  notes: z.string(),
  sourceId: z.string(),
  page: z.number().int().positive().nullable(),
  custom: z.boolean(),
});
const faction = z.object({
  id: uuid,
  definitionId: z.string().nullable(),
  name: z.string(),
  position: z.number().int().min(0).max(99),
  resources: z.number().int().min(0).max(99),
  reach: z.number().int().min(0).max(99),
  currentAction: z.string(),
  lastRoll: z.number().int().nullable(),
  notes: z.string(),
  sourceId: z.string(),
  page: z.number().int().positive().nullable(),
  custom: z.boolean(),
});
export const rootCampaignSchema = z.object({
  schemaVersion: z.literal(ROOT_SCHEMA_VERSION),
  name: z.string(),
  gm: z.string(),
  bandName: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({
    build: layout(campaignGroupIds),
    play: layout(campaignGroupIds),
  }),
  enabledSources: z.array(z.string()),
  showUnavailable: z.boolean(),
  revision: z.number().int().nonnegative(),
  creation,
  roster: z.array(
    z.object({
      id: uuid,
      vagabondId: z.string().nullable(),
      name: z.string(),
      playbookId: z.string(),
      status: z.enum(['active', 'retired', 'missing', 'dead']),
      notes: z.string(),
    }),
  ),
  clearings: z.array(clearing),
  factions: z.array(faction),
  jobs: z.array(
    z.object({
      id: uuid,
      name: z.string(),
      employer: z.string(),
      clearingId: z.string().nullable(),
      objective: z.string(),
      reward: z.string(),
      status: z.enum(['offered', 'active', 'completed', 'failed']),
      notes: z.string(),
      createdAt: dt,
    }),
  ),
  travel: z.object({
    from: z.string(),
    to: z.string(),
    route: z.string(),
    leader: z.string(),
    scout: z.string(),
    cook: z.string(),
    rolls: z.array(roll),
    notes: z.string(),
  }),
  clocks: z.array(
    z.object({
      id: uuid,
      name: z.string(),
      current: z.number().int().nonnegative(),
      maximum: z.number().int().positive(),
      notes: z.string(),
    }),
  ),
  sessions: z.array(
    z.object({
      id: uuid,
      title: z.string(),
      date: z.string(),
      summary: z.string(),
      notes: z.string(),
      createdAt: dt,
    }),
  ),
  history: z.array(history),
  notes: z.string(),
});
export type RootCampaign = z.infer<typeof rootCampaignSchema>;
export const migrateRootVagabond = (data: unknown) =>
  rootVagabondSchema.parse(data);
export const migrateRootCampaign = (data: unknown) =>
  rootCampaignSchema.parse(data);
