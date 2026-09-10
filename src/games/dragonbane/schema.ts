import { z } from 'zod';
import { DRAGONBANE_SCHEMA_VERSION, dragonbaneGroupIds } from './definitions';
const uuid = z.string().uuid(),
  dt = z.string().datetime();
const layout = z
  .array(z.enum(dragonbaneGroupIds))
  .length(dragonbaneGroupIds.length)
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
const attributeKey = z.enum(['str', 'con', 'agl', 'int', 'wil', 'cha']);
const condition = z.enum([
  'exhausted',
  'sickly',
  'dazed',
  'angry',
  'scared',
  'disheartened',
]);
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
const item = cited.extend({
  quantity: z.number().nonnegative(),
  weight: z.number().nonnegative(),
  state: z.enum(['carried', 'equipped', 'stored', 'lost', 'destroyed']),
  tiny: z.boolean(),
  usesCurrent: z.number().int().nonnegative(),
  usesMaximum: z.number().int().nonnegative(),
  origin: z.enum(['creation', 'advancement', 'custom', 'import']),
});
export const dragonbaneCharacterSchema = z.object({
  schemaVersion: z.literal(DRAGONBANE_SCHEMA_VERSION),
  name: z.string(),
  player: z.string(),
  concept: z.string(),
  appearance: z.string(),
  nickname: z.string(),
  kinId: z.string(),
  professionId: z.string(),
  age: z.enum(['young', 'adult', 'old']),
  weakness: z.string(),
  memento: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({ build: layout, play: layout }),
  enabledSources: z.array(z.string()),
  showUnavailable: z.boolean(),
  creation: z.object({
    status: z.enum(['draft', 'manual', 'finalized']),
    step: z.number().int().min(1).max(11),
    attributeMethod: z.enum(['sequential', 'assign-after', 'pool', 'manual']),
    attributeRolls: z.array(
      z.object({
        id: uuid,
        dice: z.array(z.number().int().min(1).max(6)).length(4),
        kept: z.number().int().min(3).max(18),
        assignedTo: attributeKey.nullable(),
        createdAt: dt,
      }),
    ),
    swapped: z.boolean(),
    professionalSkillIds: z.array(z.string()),
    freeSkillIds: z.array(z.string()),
    gearPackage: z.number().int().min(0).max(2).nullable(),
    gearRoll: z.number().int().min(1).max(6).nullable(),
    approvals: z.array(approval),
    baseline: z.unknown().nullable(),
    rebuildDraft: z.unknown().nullable(),
    finalizedAt: dt.nullable(),
  }),
  attributes: z.record(attributeKey, z.number().int().min(1).max(18)),
  skills: z.array(
    cited.extend({
      attribute: attributeKey,
      rating: z.number().int().min(1).max(18),
      trained: z.boolean(),
      advancementMarked: z.boolean(),
      teacherEligible: z.boolean(),
      origin: z.enum(['creation', 'advancement', 'custom', 'import']),
    }),
  ),
  abilities: z.array(
    cited.extend({
      wpCost: z.number().int().nonnegative().nullable(),
      active: z.boolean(),
      origin: z.enum(['creation', 'advancement', 'custom', 'import']),
    }),
  ),
  magic: z.object({
    schoolId: z.string().nullable(),
    grimoire: z.boolean(),
    tricks: z.array(cited),
    spells: z.array(
      cited.extend({ rank: z.number().int().min(1).max(5), used: z.boolean() }),
    ),
    mishaps: z.array(history),
  }),
  resources: z.object({
    hpCurrent: z.number().int().min(0).max(99),
    hpMaximum: z.number().int().min(1).max(99),
    wpCurrent: z.number().int().min(0).max(99),
    wpMaximum: z.number().int().min(1).max(99),
    gold: z.number().int().nonnegative(),
    silver: z.number().int().nonnegative(),
    copper: z.number().int().nonnegative(),
  }),
  conditions: z.array(condition),
  death: z.object({
    successes: z.number().int().min(0).max(3),
    failures: z.number().int().min(0).max(3),
    rallied: z.boolean(),
  }),
  rests: z.object({ roundUsed: z.boolean(), stretchUsed: z.boolean() }),
  armor: z.object({
    name: z.string(),
    rating: z.number().int().nonnegative(),
    durability: z.number().int().nonnegative(),
    banes: z.array(z.string()),
    active: z.boolean(),
  }),
  helmet: z.object({
    name: z.string(),
    rating: z.number().int().nonnegative(),
    banes: z.array(z.string()),
    active: z.boolean(),
  }),
  weapons: z
    .array(
      cited.extend({
        grip: z.string(),
        range: z.string(),
        damage: z.string(),
        durabilityCurrent: z.number().int().nonnegative(),
        durabilityMaximum: z.number().int().nonnegative(),
        features: z.array(z.string()),
        ammunition: z.number().int().nonnegative(),
        ready: z.boolean(),
        origin: z.enum(['creation', 'custom', 'import']),
      }),
    )
    .max(20),
  inventory: z.array(item),
  tinyItems: z.array(item),
  mounts: z.array(cited),
  temporaryEffects: z.array(cited),
  injuries: z.array(cited),
  ailments: z.array(cited),
  adventure: z.object({
    title: z.string(),
    location: z.string(),
    objective: z.string(),
    notes: z.string(),
  }),
  advancement: z.array(history),
  rollHistory: z.array(
    z.object({
      id: uuid,
      kind: z.enum([
        'attribute',
        'skill',
        'opposed',
        'attack',
        'damage',
        'spell',
        'mishap',
        'death',
        'advancement',
      ]),
      name: z.string(),
      target: z.number().int().nullable(),
      dice: z.array(z.number().int()),
      selected: z.number().int().nullable(),
      boons: z.number().int().nonnegative(),
      banes: z.number().int().nonnegative(),
      outcome: z.string(),
      pushed: z.boolean(),
      condition: condition.nullable(),
      context: z.string(),
      createdAt: dt,
    }),
  ),
  history: z.array(history),
  notes: z.string(),
  totalExperience: z.number().int().nonnegative(),
  currentExperience: z.number().int().nonnegative(),
});
export type DragonbaneCharacter = z.infer<typeof dragonbaneCharacterSchema>;
export function migrateDragonbaneCharacter(data: unknown) {
  return dragonbaneCharacterSchema.parse(data);
}
