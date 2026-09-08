import { z } from 'zod';
import {
  BOB_SCHEMA_VERSION,
  characterGroupIds,
  chosenGroupIds,
  legionGroupIds,
} from './definitions';
const uuid = z.string().uuid();
const rating = z.number().int().min(0).max(6);
const cited = z.object({
  definitionId: z.string().nullable(),
  name: z.string(),
  sourceId: z.string(),
  page: z.number().int().positive().nullable(),
  notes: z.string(),
});
const action = cited.extend({
  rating: rating,
  mastery: z.boolean(),
  xp: z.number().int().nonnegative(),
});
const item = cited.extend({
  load: z.number().int().nonnegative(),
  uses: z.number().int().nonnegative(),
  maximumUses: z.number().int().nonnegative(),
  equipped: z.boolean(),
  state: z.enum(['ready', 'spent', 'broken', 'lost']),
});
const history = z.object({
  id: uuid,
  kind: z.string(),
  title: z.string(),
  description: z.string(),
  createdAt: z.string().datetime(),
});
const approval = z.object({
  id: uuid,
  ruleId: z.string(),
  reason: z.string(),
  approvedAt: z.string().datetime(),
});
const roll = z.object({
  id: uuid,
  kind: z.enum([
    'action',
    'resistance',
    'fortune',
    'engagement',
    'campaign',
    'secondary-mission',
    'spy',
  ]),
  pool: z.number().int(),
  dice: z.array(z.number().int().min(1).max(6)),
  highest: z.number().int().min(0).max(6),
  outcome: z.enum(['critical', 'full', 'partial', 'bad', 'zero']),
  position: z.enum(['controlled', 'risky', 'desperate']).nullable(),
  effect: z
    .enum(['zero', 'limited', 'standard', 'great', 'extreme'])
    .nullable(),
  stressCost: z.number().int().nonnegative().nullable(),
  context: z.string(),
  consequence: z.string(),
  createdAt: z.string().datetime(),
});
const clock = z.object({
  id: uuid,
  name: z.string(),
  segments: z.number().int().min(2).max(24),
  filled: z.number().int().nonnegative(),
  notes: z.string(),
});
const layout = (ids: readonly string[]) =>
  z
    .array(z.enum(ids as [string, ...string[]]))
    .length(ids.length)
    .refine((x) => new Set(x).size === x.length);
const legionLink = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({
    kind: z.literal('linked'),
    legionId: z.string(),
    snapshot: z.object({
      legionId: z.string(),
      name: z.string(),
      revision: z.number().int().nonnegative(),
      capturedAt: z.string().datetime(),
    }),
  }),
]);
export const bobCharacterSchema = z.object({
  schemaVersion: z.literal(BOB_SCHEMA_VERSION),
  name: z.string(),
  player: z.string(),
  pronouns: z.string(),
  look: z.string(),
  background: z.string(),
  personality: z.string(),
  playbookId: z.string(),
  heritageId: z.string(),
  heritageName: z.string(),
  heritageTraits: z.array(z.string()).max(4),
  bonds: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({
    build: layout(characterGroupIds),
    play: layout(characterGroupIds),
  }),
  creation: z.object({
    status: z.enum(['draft', 'manual', 'finalized']),
    step: z.number().int().min(1).max(5),
    additionalRanks: z.number().int().min(0).max(4),
    approvals: z.array(approval),
    baseline: z.unknown().nullable(),
    rebuildDraft: z.unknown().nullable(),
    finalizedAt: z.string().datetime().nullable(),
  }),
  actions: z.array(action),
  specialAbilities: z.array(cited),
  specialistAction: z.object({
    name: z.string(),
    uses: z.number().int().nonnegative(),
    maximum: z.number().int().nonnegative(),
  }),
  stress: z.object({
    current: z.number().int().nonnegative(),
    maximum: z.number().int().min(6).max(10),
  }),
  trauma: z.array(z.string()),
  harm: z.array(
    z.object({
      id: uuid,
      level: z.number().int().min(1).max(4),
      description: z.string(),
      treated: z.boolean(),
    }),
  ),
  armor: z.object({
    normal: z.boolean(),
    heavy: z.boolean(),
    special: z.boolean(),
  }),
  corruption: z.number().int().min(0).max(9),
  blights: z.array(z.string()),
  load: z.enum(['light', 'normal', 'heavy']),
  items: z.array(item),
  mission: z.object({
    title: z.string(),
    role: z.string(),
    objective: z.string(),
    notes: z.string(),
  }),
  xp: z.object({
    playbook: z.number().int().nonnegative(),
    insight: z.number().int().nonnegative(),
    prowess: z.number().int().nonnegative(),
    resolve: z.number().int().nonnegative(),
  }),
  history: z.array(history),
  rollHistory: z.array(roll),
  notes: z.string(),
  legion: legionLink,
});
export type BobCharacter = z.infer<typeof bobCharacterSchema>;

const person = z.object({
  id: uuid,
  name: z.string(),
  playbook: z.string(),
  status: z.enum([
    'rookie',
    'soldier',
    'specialist',
    'wounded',
    'dead',
    'missing',
  ]),
  characterId: z.string().nullable(),
  notes: z.string(),
});
const squad = z.object({
  id: uuid,
  name: z.string(),
  quality: z.number().int().min(0).max(3),
  members: z.array(z.string()),
  wounded: z.boolean(),
  broken: z.boolean(),
  notes: z.string(),
});
const mission = z.object({
  id: uuid,
  type: z.enum(['Assault', 'Recon', 'Religious', 'Supply']),
  title: z.string(),
  objective: z.string(),
  primary: z.boolean(),
  personnel: z.array(z.string()),
  engagement: z.string(),
  reward: z.string(),
  penalty: z.string(),
  status: z.enum(['proposed', 'selected', 'resolved']),
  outcome: z.string(),
  notes: z.string(),
});
const role = z.object({
  player: z.string(),
  abilities: z.array(z.string()),
  notes: z.string(),
});
export const bobLegionSchema = z.object({
  schemaVersion: z.literal(BOB_SCHEMA_VERSION),
  name: z.string(),
  gm: z.string(),
  year: z.number().int(),
  mode: z.enum(['build', 'play']),
  layout: z.object({
    build: layout(legionGroupIds),
    play: layout(legionGroupIds),
  }),
  revision: z.number().int().nonnegative(),
  creation: z.object({
    status: z.enum(['draft', 'manual', 'finalized']),
    step: z.number().int().min(1).max(6),
    baseline: z.unknown().nullable(),
    finalizedAt: z.string().datetime().nullable(),
  }),
  chosenId: z.string(),
  chosenRecordId: z.string().nullable(),
  brokenId: z.string(),
  location: z.string(),
  pressure: z.number().int().min(0).max(6),
  time: z.number().int().nonnegative(),
  advance: z.number().int().nonnegative(),
  morale: z.number().int().min(0).max(10),
  supply: z.number().int().min(0).max(10),
  intel: z.number().int().min(0).max(10),
  roles: z.record(z.string(), role),
  personnel: z.array(person),
  squads: z.array(squad),
  missions: z.array(mission),
  materiel: z.array(item),
  annals: z.array(history),
  fallen: z.array(z.string()),
  spies: z.array(
    z.object({
      id: uuid,
      definitionId: z.string().nullable(),
      name: z.string(),
      training: z.enum(['trained', 'master']),
      wounded: z.boolean(),
      assignment: z.string(),
      clock: z.number().int().nonnegative(),
      notes: z.string(),
    }),
  ),
  clocks: z.array(clock),
  brokenNotes: z.string(),
  history: z.array(history),
  rollHistory: z.array(roll),
  notes: z.string(),
});
export type BobLegion = z.infer<typeof bobLegionSchema>;

export const bobChosenSchema = z.object({
  schemaVersion: z.literal(BOB_SCHEMA_VERSION),
  name: z.string(),
  chosenId: z.string(),
  player: z.string(),
  look: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({
    build: layout(chosenGroupIds),
    play: layout(chosenGroupIds),
  }),
  favor: z.number().int().nonnegative(),
  abilities: z.array(cited),
  relationships: z.string(),
  startingMission: z.string(),
  advancement: z.array(history),
  notes: z.string(),
  legion: legionLink,
});
export type BobChosen = z.infer<typeof bobChosenSchema>;
export const migrateBobCharacter = (x: unknown) => bobCharacterSchema.parse(x);
export const migrateBobLegion = (x: unknown) => bobLegionSchema.parse(x);
export const migrateBobChosen = (x: unknown) => bobChosenSchema.parse(x);
