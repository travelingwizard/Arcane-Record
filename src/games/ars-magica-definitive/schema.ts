import { z } from 'zod';

const natural = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const id = z.string().min(1);
export const citationSchema = z.object({
  sourceId: id,
  book: id,
  printedPage: z.number().int().positive().nullable(),
  pdfPage: z.number().int().positive().nullable(),
});
const referenceSchema = z.object({
  id: z.string().uuid(),
  definitionId: z.string().nullable(),
  name: z.string(),
  status: z.enum(['verified', 'custom', 'unresolved']),
  citation: citationSchema.nullable(),
  notes: z.string(),
});
export const traitSchema = referenceSchema.extend({
  scale: z.enum(['art', 'ability']),
  experience: natural,
  specialty: z.string(),
});
export const seasonSchema = z.object({
  year: z.number().int(),
  season: z.enum(['spring', 'summer', 'autumn', 'winter']),
});
export const approvalSchema = z.object({
  id: z.string().uuid(),
  ruleId: id,
  reason: z.string().trim().min(1),
  approvedBy: id,
  at: z.string().datetime(),
});
export const characterDefinitionSchema = z.object({
  role: z.enum(['magus', 'companion', 'grog']),
  name: z.string(),
  player: z.string(),
  concept: z.string(),
  saga: z.string(),
  currentYear: z.number().int().default(1220),
  setting: z.string().default(''),
  houseId: z.string().nullable(),
  age: natural,
  apprenticeshipAge: natural,
  size: z.number().int().default(0),
  birthName: z.string().default(''),
  yearBorn: z.number().int().nullable().default(null),
  nationality: z.string().default(''),
  placeOfOrigin: z.string().default(''),
  religion: z.string().default(''),
  titleProfession: z.string().default(''),
  height: z.string().default(''),
  weight: z.string().default(''),
  hair: z.string().default(''),
  eyes: z.string().default(''),
  handedness: z.string().default(''),
  gender: z.string().default(''),
  characteristics: z.object({
    intelligence: z.number().int().min(-3).max(3),
    perception: z.number().int().min(-3).max(3),
    strength: z.number().int().min(-3).max(3),
    stamina: z.number().int().min(-3).max(3),
    presence: z.number().int().min(-3).max(3),
    communication: z.number().int().min(-3).max(3),
    dexterity: z.number().int().min(-3).max(3),
    quickness: z.number().int().min(-3).max(3),
  }),
  virtuesFlaws: z.array(
    referenceSchema.extend({
      kind: z.enum(['virtue', 'flaw']),
      points: natural,
      choice: z.string(),
    }),
  ),
  traits: z.array(traitSchema),
  spells: z.array(
    referenceSchema.extend({
      techniqueId: id,
      formId: id,
      level: natural,
      castingBonus: z.number().int().default(0),
      range: z.string().default(''),
      duration: z.string().default(''),
      target: z.string().default(''),
      masteryExperience: natural,
      masteryOptions: z.array(id).default([]),
      requisiteIds: z.array(id),
    }),
  ),
  socialStatus: z.string(),
  appearance: z.string(),
  personality: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      rating: z.number().int(),
    }),
  ),
  reputations: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        type: z.string(),
        score: z.number().int(),
        notes: z.string(),
      }),
    )
    .default([]),
  hermeticIdentity: z
    .object({
      domusMagna: z.string(),
      primus: z.string(),
      parens: z.string(),
      apprenticeshipCovenant: z.string(),
      wizardsSigil: z.string(),
    })
    .default({
      domusMagna: '',
      primus: '',
      parens: '',
      apprenticeshipCovenant: '',
      wizardsSigil: '',
    }),
});
export const seasonEventSchema = z.object({
  id: z.string().uuid(),
  at: z.string().datetime(),
  date: seasonSchema,
  activity: z.enum([
    'exposure',
    'adventure',
    'practice',
    'training',
    'teaching',
    'summa',
    'tractatus',
    'vis-study',
    'laboratory',
  ]),
  sourceRecordId: z.string().nullable(),
  explanation: z.string().trim().min(1),
  changes: z.array(
    z.object({
      traitId: id,
      before: natural,
      after: natural,
      sourceQuality: natural,
      advancementTotal: natural,
      awarded: natural,
    }),
  ),
  citation: citationSchema,
});
const creationExperienceAllocationSchema = z.object({
  id: z.string().uuid(),
  phase: z.enum([
    'native-language',
    'childhood',
    'later-life',
    'apprenticeship',
    'post-apprenticeship',
  ]),
  traitId: id,
  experience: natural,
  year: z.number().int().nullable().default(null),
});

const creationSpellAllocationSchema = z.object({
  id: z.string().uuid(),
  spellId: z.string().uuid(),
  phase: z.enum(['apprenticeship', 'post-apprenticeship']),
  levels: natural,
  year: z.number().int().nullable().default(null),
});

export const arsCharacterSchema = z.object({
  schemaVersion: z.literal(2),
  name: z.string(),
  mode: z.enum(['build', 'play']),
  definition: characterDefinitionSchema,
  creation: z.object({
    status: z.enum(['manual', 'draft', 'complete']),
    step: natural,
    approvals: z.array(approvalSchema),
    baseline: characterDefinitionSchema.nullable(),
    draft: characterDefinitionSchema.nullable(),
    finalizedAt: z.string().datetime().nullable().default(null),
    templateId: z.string().nullable().default(null),
    method: z.enum(['guided', 'template', 'manual']).default('guided'),
    wealth: z.enum(['normal', 'wealthy', 'poor']).default('normal'),
    experienceAllocations: z
      .array(creationExperienceAllocationSchema)
      .default([]),
    spellAllocations: z.array(creationSpellAllocationSchema).default([]),
    allocations: z
      .object({
        nativeLanguageSpent: natural,
        childhoodSpent: natural,
        laterLifeSpent: natural,
        apprenticeshipSpent: natural,
        apprenticeshipSpellLevelsSpent: natural,
        postApprenticeshipYears: z.array(
          z.object({
            year: z.number().int(),
            studyPointsSpent: natural,
            spellLevelsSpent: natural,
            laboratorySeasons: natural.max(4),
            agingResolved: z.boolean(),
          }),
        ),
      })
      .default({
        nativeLanguageSpent: 0,
        childhoodSpent: 0,
        laterLifeSpent: 0,
        apprenticeshipSpent: 0,
        apprenticeshipSpellLevelsSpent: 0,
        postApprenticeshipYears: [],
      }),
  }),
  play: z.object({
    fatigue: natural,
    confidenceScore: natural,
    confidencePoints: natural,
    warpingPoints: natural,
    decrepitudePoints: natural,
    apparentAge: natural.default(0),
    agingPoints: z
      .record(
        z.enum([
          'intelligence',
          'perception',
          'strength',
          'stamina',
          'presence',
          'communication',
          'dexterity',
          'quickness',
        ]),
        natural,
      )
      .default({
        intelligence: 0,
        perception: 0,
        strength: 0,
        stamina: 0,
        presence: 0,
        communication: 0,
        dexterity: 0,
        quickness: 0,
      }),
    twilight: z
      .array(
        z.object({
          id: z.string().uuid(),
          at: z.string().datetime(),
          controlled: z.boolean().nullable(),
          warpingGained: natural,
          duration: z.string(),
          effect: z.string(),
          notes: z.string(),
        }),
      )
      .default([]),
    wounds: z.array(
      z.object({
        id: z.string().uuid(),
        severity: z.enum([
          'light',
          'medium',
          'heavy',
          'incapacitating',
          'dead',
        ]),
        notes: z.string(),
      }),
    ),
    effects: z.array(referenceSchema),
    armor: z
      .object({
        name: z.string(),
        soak: z.number().int(),
        load: natural,
        notes: z.string(),
        equipped: z.boolean(),
      })
      .default({ name: '', soak: 0, load: 0, notes: '', equipped: false }),
    combatModifiers: z.string().default(''),
    weapons: z
      .array(
        z.object({
          id: z.string().uuid(),
          name: z.string(),
          abilityId: z.string().nullable(),
          initiative: z.number().int(),
          attack: z.number().int(),
          defense: z.number().int(),
          damage: z.number().int(),
          load: natural,
          range: z.string(),
          notes: z.string(),
          readied: z.boolean(),
        }),
      )
      .default([]),
    rawVis: z
      .array(
        z.object({
          id: z.string().uuid(),
          artId: id,
          pawns: natural,
          physicalForm: z.string(),
        }),
      )
      .default([]),
    longevityRitual: z
      .object({
        labTotal: z.number().int(),
        ageRollModifier: z.number().int(),
        notes: z.string(),
      })
      .default({ labTotal: 0, ageRollModifier: 0, notes: '' }),
    familiar: z
      .object({
        name: z.string(),
        description: z.string(),
        might: natural,
        size: z.number().int(),
        bronzeCord: z.number().int(),
        silverCord: z.number().int(),
        goldCord: z.number().int(),
        qualities: z.string(),
        notes: z.string(),
        intelligenceCunning: z.number().int(),
        perception: z.number().int(),
        strength: z.number().int(),
        stamina: z.number().int(),
        presence: z.number().int(),
        communication: z.number().int(),
        dexterity: z.number().int(),
        quickness: z.number().int(),
        soak: z.number().int(),
        fatigue: z.number().int(),
        initiative: z.number().int(),
        attack: z.number().int(),
        defense: z.number().int(),
        damage: z.number().int(),
      })
      .default({
        name: '',
        description: '',
        might: 0,
        size: 0,
        bronzeCord: 0,
        silverCord: 0,
        goldCord: 0,
        qualities: '',
        notes: '',
        intelligenceCunning: 0,
        perception: 0,
        strength: 0,
        stamina: 0,
        presence: 0,
        communication: 0,
        dexterity: 0,
        quickness: 0,
        soak: 0,
        fatigue: 0,
        initiative: 0,
        attack: 0,
        defense: 0,
        damage: 0,
      }),
  }),
  inventory: z.array(
    referenceSchema.extend({
      quantity: natural,
      equipped: z.boolean(),
      load: natural.default(0),
      carried: z.boolean().default(true),
    }),
  ),
  covenantId: z.string().nullable(),
  covenantSnapshot: z
    .object({
      id,
      name: z.string(),
      updatedAt: z.string().datetime(),
      aura: z.number().int(),
      calendar: seasonSchema,
    })
    .nullable(),
  seasons: z.array(seasonEventSchema),
  history: z.array(
    z.object({
      id: z.string().uuid(),
      at: z.string().datetime(),
      kind: id,
      explanation: z.string(),
      before: z.json(),
      after: z.json(),
    }),
  ),
  rolls: z.array(
    z.object({
      id: z.string().uuid(),
      at: z.string().datetime(),
      kind: z.enum(['simple', 'stress']),
      dice: z.array(natural),
      botchDice: z.array(natural),
      modifier: z.number().int(),
      total: z.number().int(),
      context: z.string(),
      provenance: z.enum(['manual', 'generated']),
      purpose: z
        .enum(['general', 'casting', 'combat', 'recovery', 'aging', 'twilight'])
        .default('general'),
    }),
  ),
  layout: z.object({ build: z.array(id), play: z.array(id) }),
  notes: z.string(),
});
export type ArsCharacter = z.infer<typeof arsCharacterSchema>;
export type CharacterDefinition = z.infer<typeof characterDefinitionSchema>;
export type SeasonEvent = z.infer<typeof seasonEventSchema>;

export const covenantSchema = z.object({
  schemaVersion: z.literal(1),
  name: z.string(),
  mode: z.enum(['build', 'play']),
  saga: z.string(),
  location: z.string(),
  aura: z.number().int(),
  covenantSeason: z.enum(['spring', 'summer', 'autumn', 'winter']),
  calendar: seasonSchema,
  memberIds: z.array(id),
  buildPointBudget: natural,
  vis: z.array(z.object({ artId: id, pawns: natural, annualIncome: natural })),
  library: z.array(
    referenceSchema.extend({
      type: z.enum(['summa', 'tractatus', 'lab-text', 'casting-tablet']),
      subjectId: id,
      quality: natural,
      level: natural,
      language: z.string(),
      authorId: z.string().nullable(),
    }),
  ),
  laboratories: z.array(
    referenceSchema.extend({
      ownerId: z.string().nullable(),
      quality: z.number().int(),
      size: z.number().int(),
      upkeep: z.number().int(),
    }),
  ),
  specialists: z.array(
    referenceSchema.extend({ abilityId: id, rating: natural, cost: natural }),
  ),
  enchantedItems: z.array(
    referenceSchema.extend({
      effectLevel: natural,
      buildPointCost: natural,
      uses: z.string(),
    }),
  ),
  projects: z.array(
    z.object({
      id: z.string().uuid(),
      kind: z.enum([
        'setup-laboratory',
        'customize-laboratory',
        'learn-spell',
        'invent-spell',
        'extract-vis',
        'lesser-enchantment',
        'invested-enchantment',
        'talisman',
        'familiar',
        'longevity-ritual',
        'assist',
        'apprentice',
      ]),
      ownerId: id,
      status: z.enum(['planned', 'active', 'complete', 'abandoned']),
      labTotal: z.number().int(),
      effectLevel: natural,
      progress: natural,
      visCost: natural,
      visSpent: natural,
      seasons: z.array(seasonSchema),
      notes: z.string(),
      citation: citationSchema,
    }),
  ),
  boonsHooks: z.array(
    referenceSchema.extend({ kind: z.enum(['boon', 'hook']), points: natural }),
  ),
  history: z.array(
    z.object({
      id: z.string().uuid(),
      at: z.string().datetime(),
      kind: id,
      explanation: z.string(),
    }),
  ),
  notes: z.string(),
  layout: z.object({ build: z.array(id), play: z.array(id) }),
});
export type ArsCovenant = z.infer<typeof covenantSchema>;

export function migrateArsCharacter(data: unknown, fromVersion: number) {
  if (fromVersion === 1 && data && typeof data === 'object') {
    const migrated = structuredClone(data) as Record<string, unknown>;
    migrated.schemaVersion = 2;
    const creation = (migrated.creation ?? {}) as Record<string, unknown>;
    creation.method =
      creation.status === 'manual'
        ? 'manual'
        : creation.templateId
          ? 'template'
          : 'guided';
    creation.wealth = 'normal';
    creation.experienceAllocations = [];
    creation.spellAllocations = [];
    migrated.creation = creation;
    return arsCharacterSchema.parse(migrated);
  }
  if (fromVersion !== 2)
    throw new Error(
      'Unsupported Ars Magica version. Keep the original file; no conversion was attempted.',
    );
  return arsCharacterSchema.parse(data);
}

export function migrateArsCovenant(data: unknown, fromVersion: number) {
  if (fromVersion !== 1)
    throw new Error(
      'Unsupported Ars Magica Covenant version. Keep the original file; no conversion was attempted.',
    );
  return covenantSchema.parse(data);
}
