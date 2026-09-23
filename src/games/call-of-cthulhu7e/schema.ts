import { z } from 'zod';
import { COC7E_SCHEMA_VERSION, coc7eGroupIds } from './definitions';
const uuid = z.string().uuid(),
  dt = z.string().datetime();
const layout = z
  .array(z.enum(coc7eGroupIds as [string, ...string[]]))
  .length(coc7eGroupIds.length)
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
const creationRoll = z.object({
  id: uuid,
  characteristic: z.string(),
  method: z.enum(['rolled', 'manual', 'array', 'allocation', 'adjustment']),
  dice: z.array(z.number().int()),
  total: z.number().int(),
  createdAt: dt,
});
const characteristic = z.number().int().min(0).max(200);
const skill = cited.extend({
  rating: z.number().int().min(0).max(999),
  baseChance: z.number().int().min(0).max(100),
  occupationPoints: z.number().int().nonnegative(),
  personalPoints: z.number().int().nonnegative(),
  experienceChecked: z.boolean(),
  training: z.boolean(),
  specialty: z.string(),
  family: z.string().nullable(),
  origin: z.enum(['catalog', 'creation', 'custom', 'keeper', 'import']),
});
const roll = z.object({
  id: uuid,
  kind: z.enum([
    'skill',
    'characteristic',
    'luck',
    'opposed',
    'combat',
    'damage',
    'sanity',
    'reality-check',
  ]),
  label: z.string(),
  goal: z.string(),
  target: z.number().int().nullable(),
  difficulty: z.enum(['regular', 'hard', 'extreme']),
  bonusPenalty: z.number().int().min(-2).max(2),
  ones: z.number().int().min(0).max(9).nullable(),
  tens: z.array(z.number().int().min(0).max(9)),
  selectedTotal: z.number().int(),
  level: z.enum([
    'critical',
    'extreme',
    'hard',
    'regular',
    'failure',
    'fumble',
  ]),
  pushed: z.boolean(),
  pushedFromRollId: uuid.nullable(),
  pushJustification: z.string(),
  context: z.string(),
  createdAt: dt,
});
const history = z.object({
  id: uuid,
  kind: z.string(),
  title: z.string(),
  description: z.string(),
  createdAt: dt,
});

const coc7eInvestigatorV2Schema = z.object({
  schemaVersion: z.literal(COC7E_SCHEMA_VERSION),
  name: z.string(),
  player: z.string(),
  pronouns: z.string(),
  age: z.number().int().min(0).max(200),
  birthplace: z.string(),
  residence: z.string(),
  era: z.enum(['1920s', 'modern', 'other']),
  campaignPremise: z.string(),
  concept: z.string(),
  occupationName: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({ build: layout, play: layout }),
  enabledSources: z.array(z.string()),
  creation: z.object({
    status: z.enum(['draft', 'manual', 'finalized']),
    method: z.enum([
      'standard',
      'quick-fire',
      'restart',
      'low-roll-adjustment',
      'placed-rolls',
      'point-buy',
      'custom',
    ]),
    step: z.number().int().min(1).max(11),
    occupationId: z.string(),
    occupationPointsSpent: z.number().int().nonnegative(),
    personalPointsSpent: z.number().int().nonnegative(),
    ageDeductions: z.object({
      physical: z.number().int().nonnegative(),
      education: z.number().int().nonnegative(),
      appearance: z.number().int().nonnegative(),
      movement: z.number().int().nonnegative(),
    }),
    eduChecks: z.array(creationRoll),
    rolls: z.array(creationRoll),
    experiencePackageId: z.string(),
    experienceSanLoss: z.number().int().nonnegative(),
    experienceSkillPoints: z.number().int().nonnegative(),
    optionalRules: z.object({
      startingSkillCap: z.boolean(),
      skillCap: z.number().int().min(50).max(99),
      transferableSpecializations: z.boolean(),
      humanPotential: z.boolean(),
    }),
    approvals: z.array(approval),
    baseline: z.unknown().nullable(),
    rebuildDraft: z.unknown().nullable(),
    finalizedAt: dt.nullable(),
  }),
  characteristics: z.object({
    str: characteristic,
    con: characteristic,
    dex: characteristic,
    app: characteristic,
    pow: characteristic,
    siz: characteristic,
    int: characteristic,
    edu: characteristic,
  }),
  resources: z.object({
    luckCurrent: z.number().int().min(0).max(999),
    luckMaximum: z.number().int().min(0).max(999),
    sanityCurrent: z.number().int().min(0).max(999),
    sanityMaximum: z.number().int().min(0).max(999),
    magicPointsCurrent: z.number().int().min(0).max(999),
    hitPointsCurrent: z.number().int().min(-99).max(999),
    dailySanityStart: z.number().int().min(0).max(999),
    dailySanityLoss: z.number().int().min(0).max(999),
    temporaryInsanity: z.boolean(),
    indefiniteInsanity: z.boolean(),
    boutActive: z.boolean(),
  }),
  skills: z.array(skill),
  creditRating: z.number().int().min(0).max(999),
  spendingLevel: z.string(),
  cash: z.string(),
  assets: z.string(),
  backstory: z.object({
    personalDescription: z.string(),
    ideology: z.string(),
    significantPeople: z.string(),
    meaningfulLocations: z.string(),
    treasuredPossessions: z.string(),
    traits: z.string(),
    keyConnection: z.string(),
  }),
  organizations: z.array(cited),
  contacts: z.array(cited),
  phobiasManias: z.array(cited),
  injuries: z.array(cited),
  clues: z.array(cited),
  mythosRecords: z.array(cited),
  equipment: z.array(
    cited.extend({
      quantity: z.number().int().nonnegative(),
      state: z.enum(['carried', 'stored', 'lost', 'consumed']),
      category: z.string(),
      priceLabel: z.string(),
      priceMinimumCents: z.number().int().nonnegative().nullable(),
      priceMaximumCents: z.number().int().nonnegative().nullable(),
      pricingUnit: z.string(),
      era: z.string(),
      sourceUrl: z.string(),
      unresolved: z.boolean(),
    }),
  ),
  spells: z.array(
    cited.extend({
      category: z.string(),
      aliases: z.array(z.string()),
      summary: z.string(),
      reference: z.string(),
      sourceUrl: z.string(),
      keeperGrantedAt: dt.nullable(),
      keeperGrantNote: z.string(),
      unresolved: z.boolean(),
    }),
  ),
  weapons: z.array(
    cited.extend({
      skillId: z.string(),
      damage: z.string(),
      ammunition: z.number().int().nonnegative(),
      readied: z.boolean(),
    }),
  ),
  temporaryEffects: z.array(cited),
  notes: z.string(),
  totalExperience: z.number().int().nonnegative(),
  currentExperience: z.number().int().nonnegative(),
  rollHistory: z.array(roll),
  rollerSettings: z.object({
    historyMode: z.enum(['bounded', 'continuous']),
    historyLimit: z.number().int().min(1).max(100),
  }),
  history: z.array(history),
});

function migrateToV2(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const record = data as Record<string, unknown>;
  if (record.schemaVersion !== 1) return data;
  const equipment = Array.isArray(record.equipment)
    ? record.equipment.map((entry) => ({
        ...(entry as Record<string, unknown>),
        category: 'custom',
        priceLabel: '',
        priceMinimumCents: null,
        priceMaximumCents: null,
        pricingUnit: '',
        era: 'custom',
        sourceUrl: '',
        unresolved: true,
      }))
    : [];
  const rollHistory = Array.isArray(record.rollHistory)
    ? record.rollHistory.map((entry) => ({
        ...(entry as Record<string, unknown>),
        pushedFromRollId: null,
        pushJustification: '',
      }))
    : [];
  return {
    ...record,
    schemaVersion: 2,
    equipment,
    spells: [],
    rollHistory,
    rollerSettings: { historyMode: 'bounded', historyLimit: 10 },
  };
}

export const coc7eInvestigatorSchema = z.preprocess(
  migrateToV2,
  coc7eInvestigatorV2Schema,
);
export type Coc7eInvestigator = z.infer<typeof coc7eInvestigatorV2Schema>;
export const migrateCoc7eInvestigator = (data: unknown) =>
  coc7eInvestigatorSchema.parse(data);
