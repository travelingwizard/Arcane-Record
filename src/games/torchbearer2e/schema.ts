import { z } from 'zod';
import {
  torchbearer2eConditionIds,
  torchbearer2eGroupIds,
  torchbearer2eInventoryLocations,
} from './definitions';

const nonnegativeInteger = z.number().int().nonnegative();
const uuid = z.string().uuid();
const nullableDefinitionId = z.string().nullable();
const advancementSchema = z.object({
  rating: z.number().int().min(0).max(10),
  passed: z.number().int().min(0).max(99),
  failed: z.number().int().min(0).max(99),
});
const sourceSchema = z.object({
  sourceId: z.string(),
  source: z.string(),
  page: z.number().int().positive(),
});
const originSchema = z.object({
  type: z.enum(['manual', 'creation', 'migration', 'import']),
  choiceId: z.string().nullable(),
});
const groupIdSchema = z.enum(torchbearer2eGroupIds);
const groupOrderSchema = z
  .array(groupIdSchema)
  .length(torchbearer2eGroupIds.length)
  .refine((order) => new Set(order).size === torchbearer2eGroupIds.length, {
    message: 'Section order must contain every group exactly once.',
  });

export const torchbearerCreationRollSchema = z.object({
  id: uuid,
  method: z.enum(['roll', 'manual']),
  dice: z.array(z.number().int().min(1).max(6)),
  total: z.number().int().min(0).max(18),
  resultId: z.string(),
  createdAt: z.string().datetime(),
});

export const torchbearerCreationOverrideSchema = z.object({
  id: uuid,
  code: z.string(),
  reason: z.string(),
  createdAt: z.string().datetime(),
});

const creationBaselineSchema = z.object({
  abilityRatings: z.record(z.string(), z.number().int().nonnegative()),
  skillRatings: z.record(z.string(), z.number().int().nonnegative()),
  traitLevels: z.record(z.string(), z.number().int().nonnegative()),
  creatorRecordIds: z.array(uuid),
});

export const torchbearerCreationSchema = z.object({
  status: z.enum(['manual', 'draft', 'finalized']),
  currentStep: z.number().int().min(0).max(13),
  enforceRules: z.boolean(),
  overrides: z.array(torchbearerCreationOverrideSchema),
  classId: z
    .enum([
      'burglar',
      'magician',
      'outcast',
      'ranger',
      'theurge',
      'warrior',
      'bounder',
      'dreamwalker',
      'guide',
      'noble-scion',
      'sorcerer',
      'stoneteller',
      'shaman',
      'skald',
      'thief',
    ])
    .nullable(),
  classOption: z.object({
    type: z.enum(['none', 'dreamwalker-skill', 'dreamwalker-wise']),
    skillId: nullableDefinitionId,
  }),
  will: z.number().int().min(0).max(6),
  health: z.number().int().min(0).max(6),
  upbringingSkillId: nullableDefinitionId,
  homeId: nullableDefinitionId,
  homeSkillId: nullableDefinitionId,
  homeTraitId: nullableDefinitionId,
  socialSkillId: nullableDefinitionId,
  specialtySkillId: nullableDefinitionId,
  wiseNames: z.array(z.string()),
  natureAnswerIds: z.array(z.string()),
  relationshipChoices: z.object({
    loner: z.boolean(),
    friend: z.boolean(),
    parents: z.boolean(),
    mentor: z.boolean(),
    enemy: z.boolean(),
  }),
  resources: z.number().int().min(0).max(10),
  gearDefinitionIds: z.array(z.string()),
  containerDefinitionIds: z.array(z.string()),
  weaponDefinitionId: nullableDefinitionId,
  armorDefinitionId: nullableDefinitionId,
  takeHelmet: z.boolean(),
  takeShield: z.boolean(),
  magic: z.object({
    method: z.enum(['none', 'roll', 'manual']),
    selectedResultId: z.string().nullable(),
    selectedDefinitionIds: z.array(z.string()),
    rollHistory: z.array(torchbearerCreationRollSchema),
  }),
  finalizedAt: z.string().datetime().nullable(),
  baseline: creationBaselineSchema.nullable(),
  stockVariant: z.object({
    type: z.enum(['standard', 'troll-changeling']),
    apparentAge: z.string(),
    actualAge: z.string(),
  }),
  advancedStart: z.object({
    enabled: z.boolean(),
    targetLevel: z.number().int().min(1).max(10),
    method: z.enum(['manual', 'roll']),
    selections: z.array(
      z.object({
        id: uuid,
        level: z.number().int().min(2).max(10),
        definitionId: z.string(),
        name: z.string(),
        notes: z.string(),
      }),
    ),
    rollHistory: z.array(torchbearerCreationRollSchema),
  }),
});

export type TorchbearerCreationState = z.infer<
  typeof torchbearerCreationSchema
>;

export const emptyTorchbearerCreationState = (
  status: TorchbearerCreationState['status'] = 'draft',
): TorchbearerCreationState => ({
  status,
  currentStep: 0,
  enforceRules: true,
  overrides: [],
  classId: null,
  classOption: { type: 'none', skillId: null },
  will: 0,
  health: 0,
  upbringingSkillId: null,
  homeId: null,
  homeSkillId: null,
  homeTraitId: null,
  socialSkillId: null,
  specialtySkillId: null,
  wiseNames: [],
  natureAnswerIds: [],
  relationshipChoices: {
    loner: false,
    friend: false,
    parents: false,
    mentor: false,
    enemy: false,
  },
  resources: 0,
  gearDefinitionIds: [],
  containerDefinitionIds: [],
  weaponDefinitionId: null,
  armorDefinitionId: null,
  takeHelmet: false,
  takeShield: false,
  magic: {
    method: 'none',
    selectedResultId: null,
    selectedDefinitionIds: [],
    rollHistory: [],
  },
  finalizedAt: null,
  baseline: null,
  stockVariant: { type: 'standard', apparentAge: '', actualAge: '' },
  advancedStart: {
    enabled: false,
    targetLevel: 1,
    method: 'manual',
    selections: [],
    rollHistory: [],
  },
});

const scholarPlayStateSchema = z.object({
  phase: z.enum(['adventure', 'camp', 'town', 'respite']),
  adventureTurns: nonnegativeInteger,
  checks: z.object({
    available: nonnegativeInteger,
    spent: nonnegativeInteger,
  }),
  lights: z.array(
    z.object({
      id: uuid,
      name: z.string(),
      status: z.enum(['active', 'spent', 'extinguished']),
      remainingTurns: nonnegativeInteger,
      maximumTurns: nonnegativeInteger,
    }),
  ),
  campTown: z.object({
    campType: z.string(),
    townName: z.string(),
    townType: z.string(),
    lifestyle: nonnegativeInteger,
    respiteNotes: z.string(),
  }),
  recovery: z.array(
    z.object({
      id: uuid,
      date: z.string(),
      condition: z.string(),
      method: z.string(),
      obstacle: nonnegativeInteger,
      outcome: z.enum(['pending', 'success', 'failure', 'condition', 'twist']),
      notes: z.string(),
    }),
  ),
  conflict: z.object({
    active: z.boolean(),
    type: z.string(),
    captain: z.string(),
    participants: z.string(),
    maximumDisposition: nonnegativeInteger,
    currentDisposition: nonnegativeInteger,
    round: nonnegativeInteger,
    actions: z.array(
      z.object({
        id: uuid,
        action: z.string(),
        actor: z.string(),
        notes: z.string(),
      }),
    ),
    equipment: z.string(),
    result: z.string(),
    compromise: z.string(),
  }),
  rewardLog: z.array(
    z.object({
      id: uuid,
      date: z.string(),
      type: z.enum(['fate', 'persona']),
      amount: z.number().int(),
      context: z.string(),
      notes: z.string(),
    }),
  ),
});

export const emptyScholarPlayState = () => ({
  phase: 'adventure' as const,
  adventureTurns: 0,
  checks: { available: 0, spent: 0 },
  lights: [],
  campTown: {
    campType: '',
    townName: '',
    townType: '',
    lifestyle: 0,
    respiteNotes: '',
  },
  recovery: [],
  conflict: {
    active: false,
    type: '',
    captain: '',
    participants: '',
    maximumDisposition: 0,
    currentDisposition: 0,
    round: 0,
    actions: [],
    equipment: '',
    result: '',
    compromise: '',
  },
  rewardLog: [],
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
  creation: torchbearerCreationSchema,
  playState: scholarPlayStateSchema,
  terriblePrice: z.array(
    z.object({
      id: uuid,
      date: z.string(),
      trigger: z.string(),
      optionId: z.string(),
      optionName: z.string(),
      affectedRecordIds: z.array(z.string()),
      rolls: z.array(torchbearerCreationRollSchema),
      notes: z.string(),
      createdAt: z.string().datetime(),
    }),
  ),
  traits: z.array(
    z.object({
      id: uuid,
      definitionId: nullableDefinitionId,
      name: z.string(),
      level: z.number().int().min(1).max(3),
      startingLevel: z.number().int().min(0).max(3),
      beneficialUses: z.number().int().min(0).max(3),
      checks: z.number().int().min(0).max(3),
      notes: z.string(),
      source: sourceSchema.nullable(),
      origin: originSchema,
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
      definitionId: nullableDefinitionId,
      name: z.string(),
      beginnersLuckRoot: z.enum(['will', 'health']),
      rating: z.number().int().min(0).max(6),
      startingRating: z.number().int().min(0).max(6),
      passed: z.number().int().min(0).max(99),
      failed: z.number().int().min(0).max(99),
      notes: z.string(),
      source: sourceSchema.nullable(),
      origin: originSchema,
    }),
  ),
  wises: z.array(
    z.object({
      id: uuid,
      definitionId: nullableDefinitionId,
      name: z.string(),
      uses: z.object({
        pass: z.boolean(),
        fail: z.boolean(),
        fate: z.boolean(),
        persona: z.boolean(),
      }),
      notes: z.string(),
      source: sourceSchema.nullable(),
      origin: originSchema,
    }),
  ),
  inventory: z.array(
    z.object({
      id: uuid,
      definitionId: nullableDefinitionId,
      name: z.string(),
      location: z.enum(torchbearer2eInventoryLocations),
      slots: z.number().int().min(0).max(12),
      quantity: z.number().int().min(1).max(999),
      status: z.enum(['carried', 'dropped', 'lost', 'cached']),
      damaged: z.boolean(),
      weariness: z.boolean(),
      notes: z.string(),
      source: sourceSchema.nullable(),
      origin: originSchema,
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
      origin: originSchema,
    }),
  ),
  magic: z.object({
    urdr: nonnegativeInteger,
    burden: nonnegativeInteger,
    memoryPalace: nonnegativeInteger,
    relics: z.array(
      z.object({
        id: uuid,
        definitionId: nullableDefinitionId,
        name: z.string(),
        inventory: z.string(),
        invocationName: z.string(),
        circle: nonnegativeInteger,
        notes: z.string(),
        source: sourceSchema.nullable(),
        origin: originSchema,
      }),
    ),
    spells: z.array(
      z.object({
        id: uuid,
        definitionId: nullableDefinitionId,
        name: z.string(),
        obstacle: nonnegativeInteger,
        library: z.boolean(),
        spellBook: z.boolean(),
        memorized: z.boolean(),
        cast: z.boolean(),
        scroll: z.boolean(),
        supplies: z.boolean(),
        effect: z.string(),
        source: sourceSchema.nullable(),
        origin: originSchema,
      }),
    ),
  }),
  advancement: z.object({
    experience: z.object({
      total: nonnegativeInteger,
      current: nonnegativeInteger,
    }),
    levelBenefit: z.string(),
    levelBenefits: z.array(
      z.object({
        id: uuid,
        definitionId: nullableDefinitionId,
        name: z.string(),
        level: z.number().int().min(1).max(99),
        notes: z.string(),
        source: sourceSchema.nullable(),
        origin: originSchema,
      }),
    ),
    history: z.string(),
  }),
  notes: z.string(),
  sheetLayout: z.object({
    mode: z.enum(['edit', 'play']),
    groupOrder: groupOrderSchema,
  }),
});

export type Torchbearer2eCharacter = z.infer<
  typeof torchbearer2eCharacterSchema
>;

const migratedOrigin = { type: 'migration' as const, choiceId: null };

type LegacyRecord = Record<string, unknown>;
type LegacyTorchbearerCharacter = LegacyRecord & {
  traits?: LegacyRecord[];
  skills?: LegacyRecord[];
  wises?: LegacyRecord[];
  inventory?: LegacyRecord[];
  relationships?: LegacyRecord[];
  magic?: LegacyRecord & {
    relics?: LegacyRecord[];
    spells?: LegacyRecord[];
  };
  advancement?: LegacyRecord;
};

const withVersionFiveFields = (legacy: LegacyRecord) => ({
  ...legacy,
  creation: {
    ...(legacy.creation as LegacyRecord),
    stockVariant: { type: 'standard', apparentAge: '', actualAge: '' },
    advancedStart: {
      enabled: false,
      targetLevel: 1,
      method: 'manual',
      selections: [],
      rollHistory: [],
    },
  },
  playState: emptyScholarPlayState(),
  terriblePrice: [],
});

export function migrateTorchbearer2eCharacter(
  data: unknown,
  fromVersion: number,
) {
  if (fromVersion >= 5) return torchbearer2eCharacterSchema.parse(data);

  if (fromVersion === 4) {
    const versionFour = data as LegacyTorchbearerCharacter;
    return torchbearer2eCharacterSchema.parse({
      ...versionFour,
      creation: {
        ...(versionFour.creation as LegacyRecord),
        stockVariant: { type: 'standard', apparentAge: '', actualAge: '' },
        advancedStart: {
          enabled: false,
          targetLevel: 1,
          method: 'manual',
          selections: [],
          rollHistory: [],
        },
      },
      playState: emptyScholarPlayState(),
      terriblePrice: [],
    });
  }

  if (fromVersion === 3) {
    const versionThree = data as LegacyTorchbearerCharacter;
    return torchbearer2eCharacterSchema.parse(
      withVersionFiveFields({
        ...versionThree,
        creation: {
          ...(versionThree.creation as LegacyRecord),
          classOption: { type: 'none', skillId: null },
        },
      }),
    );
  }

  if (fromVersion === 2) {
    const versionTwo = data as LegacyTorchbearerCharacter;
    return torchbearer2eCharacterSchema.parse(
      withVersionFiveFields({
        ...versionTwo,
        creation: {
          ...(versionTwo.creation as LegacyRecord),
          classOption: { type: 'none', skillId: null },
        },
        sheetLayout: {
          ...(versionTwo.sheetLayout as LegacyRecord),
          mode: 'edit',
        },
      }),
    );
  }

  const legacy = data as LegacyTorchbearerCharacter;
  const migrated = {
    ...legacy,
    creation: emptyTorchbearerCreationState('manual'),
    traits: (legacy.traits ?? []).map((record) => ({
      ...record,
      definitionId: null,
      startingLevel: typeof record.level === 'number' ? record.level : 0,
      source: null,
      origin: migratedOrigin,
    })),
    skills: (legacy.skills ?? []).map((record) => ({
      ...record,
      startingRating: typeof record.rating === 'number' ? record.rating : 0,
      source: null,
      origin: migratedOrigin,
    })),
    wises: (legacy.wises ?? []).map((record) => ({
      ...record,
      definitionId: null,
      source: null,
      origin: migratedOrigin,
    })),
    inventory: (legacy.inventory ?? []).map((record) => ({
      ...record,
      definitionId: null,
      source: null,
      origin: migratedOrigin,
    })),
    relationships: (legacy.relationships ?? []).map((record) => ({
      ...record,
      origin: migratedOrigin,
    })),
    magic: {
      ...legacy.magic,
      relics: (legacy.magic?.relics ?? []).map((record) => ({
        ...record,
        definitionId: null,
        source: null,
        origin: migratedOrigin,
      })),
      spells: (legacy.magic?.spells ?? []).map((record) => ({
        ...record,
        definitionId: null,
        source: null,
        origin: migratedOrigin,
      })),
    },
    advancement: { ...legacy.advancement, levelBenefits: [] },
    sheetLayout: {
      ...(legacy.sheetLayout as LegacyRecord),
      mode: 'edit',
    },
  };

  return torchbearer2eCharacterSchema.parse(withVersionFiveFields(migrated));
}
