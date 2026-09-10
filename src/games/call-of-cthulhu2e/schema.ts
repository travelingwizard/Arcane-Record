import { z } from 'zod';
import {
  COC2E_SCHEMA_VERSION,
  investigatorGroupIds,
  keeperGroupIds,
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
const creationRoll = z.object({
  id: uuid,
  characteristic: z.string(),
  method: z.enum(['rolled', 'manual']),
  dice: z.array(z.number().int().min(1).max(6)),
  modifier: z.number().int(),
  total: z.number().int(),
  createdAt: dt,
});
const creation = z.object({
  status: z.enum(['draft', 'manual', 'finalized']),
  step: z.number().int().min(1).max(10),
  occupationId: z.string(),
  occupationPointsSpent: z.number().int().nonnegative(),
  personalPointsSpent: z.number().int().nonnegative(),
  previousExperience: z.boolean(),
  rolls: z.array(creationRoll),
  approvals: z.array(approval),
  baseline: z.unknown().nullable(),
  rebuildDraft: z.unknown().nullable(),
  finalizedAt: dt.nullable(),
});
const characteristic = z.number().int().min(0).max(99);
const skill = cited.extend({
  rating: z.number().int().min(0).max(100),
  baseChance: z.number().int().min(0).max(100),
  occupationPoints: z.number().int().nonnegative(),
  personalPoints: z.number().int().nonnegative(),
  experienceChecked: z.boolean(),
  specialty: z.string(),
  origin: z.enum(['catalog', 'creation', 'custom', 'keeper', 'import']),
});
const weapon = cited.extend({
  attack: z.number().int().min(0).max(100),
  damage: z.string(),
  impale: z.boolean(),
  parry: z.number().int().min(0).max(100),
  hitPoints: z.number().int().min(0).max(99),
  ammunition: z.number().int().min(0).max(999),
  readied: z.boolean(),
});
const roll = z.object({
  id: uuid,
  kind: z.enum([
    'skill',
    'idea',
    'know',
    'luck',
    'resistance',
    'damage',
    'sanity',
    'improvement',
  ]),
  label: z.string(),
  dice: z.array(z.number().int().positive()),
  target: z.number().int().nullable(),
  modifier: z.number().int(),
  total: z.number().int(),
  success: z.boolean().nullable(),
  impale: z.boolean(),
  context: z.string(),
  createdAt: dt,
});
const campaignSnapshot = z.object({
  campaignId: z.string(),
  name: z.string(),
  revision: z.number().int().nonnegative(),
  era: z.string(),
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

export const coc2eInvestigatorSchema = z.object({
  schemaVersion: z.literal(COC2E_SCHEMA_VERSION),
  name: z.string(),
  player: z.string(),
  sex: z.string(),
  age: z.number().int().min(0).max(200),
  nationality: z.string(),
  residence: z.string(),
  era: z.string(),
  concept: z.string(),
  occupationName: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({
    build: layout(investigatorGroupIds),
    play: layout(investigatorGroupIds),
  }),
  enabledSources: z.array(z.string()),
  showUnavailable: z.boolean(),
  creation,
  characteristics: z.object({
    str: characteristic,
    con: characteristic,
    siz: characteristic,
    dex: characteristic,
    app: characteristic,
    int: characteristic,
    pow: characteristic,
    edu: characteristic,
  }),
  resources: z.object({
    sanityCurrent: z.number().int().min(0).max(99),
    sanityMaximum: z.number().int().min(0).max(99),
    magicPoints: z.number().int().min(0).max(99),
    hitPoints: z.number().int().min(-99).max(99),
    temporaryInsanity: z.boolean(),
    indefiniteInsanity: z.boolean(),
    insanityDescription: z.string(),
    injuries: z.array(cited),
  }),
  skills: z.array(skill),
  weapons: z.array(weapon),
  equipment: z.array(
    cited.extend({
      quantity: z.number().int().min(0).max(999),
      state: z.enum(['carried', 'stored', 'lost', 'consumed']),
    }),
  ),
  spells: z.array(cited),
  tomes: z.array(cited),
  mythosDiscoveries: z.array(cited),
  clues: z.array(cited),
  contacts: z.array(cited),
  income: z.string(),
  savings: z.string(),
  schools: z.string(),
  degrees: z.string(),
  historyText: z.string(),
  notes: z.string(),
  totalExperience: z.number().int().nonnegative(),
  currentExperience: z.number().int().nonnegative(),
  rollHistory: z.array(roll),
  history: z.array(history),
  campaign: campaignLink,
});
export type Coc2eInvestigator = z.infer<typeof coc2eInvestigatorSchema>;

const investigation = z.object({
  id: uuid,
  name: z.string(),
  concept: z.string(),
  hook: z.string(),
  status: z.enum(['planned', 'active', 'resolved', 'abandoned']),
  locations: z.array(cited),
  npcs: z.array(cited),
  clues: z.array(cited.extend({ revealed: z.boolean() })),
  timeline: z.string(),
  notes: z.string(),
  createdAt: dt,
});
export const coc2eKeeperSchema = z.object({
  schemaVersion: z.literal(COC2E_SCHEMA_VERSION),
  name: z.string(),
  keeper: z.string(),
  era: z.string(),
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
      investigatorId: z.string().nullable(),
      name: z.string(),
      occupation: z.string(),
      status: z.enum(['active', 'retired', 'dead', 'missing']),
      notes: z.string(),
    }),
  ),
  investigations: z.array(investigation),
  mythos: z.array(
    cited.extend({
      kind: z.enum(['spell', 'tome', 'entity', 'artifact', 'other']),
      sanityLoss: z.string(),
      grantedTo: z.array(z.string()),
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
  privateNotes: z.string(),
});
export type Coc2eKeeper = z.infer<typeof coc2eKeeperSchema>;
export const migrateCoc2eInvestigator = (data: unknown) =>
  coc2eInvestigatorSchema.parse(data);
export const migrateCoc2eKeeper = (data: unknown) =>
  coc2eKeeperSchema.parse(data);
