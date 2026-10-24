import { z } from 'zod';
import { earthdawn4eGroupIds } from './definitions';
import { earthdawnDefinitionById, earthdawnSources } from './catalog';
import { earthdawnPathById } from './path-profiles';

const uuid = z.string().uuid();
const nonnegative = z.number().int().nonnegative();
const denomination = z.enum(['cp', 'sp', 'gp']);
const moneyAmount = z.object({ amount: nonnegative, denomination });
const nullableSource = z.object({
  definitionId: z.string().nullable(),
  sourceId: z.string().nullable(),
  source: z.string().nullable(),
  page: z.number().int().positive().nullable(),
  unresolved: z.boolean(),
});
const attributeId = z.enum([
  'dexterity',
  'strength',
  'toughness',
  'perception',
  'willpower',
  'charisma',
]);
export const magicEffectTarget = z.enum([
  'attribute.dexterity',
  'attribute.strength',
  'attribute.toughness',
  'attribute.perception',
  'attribute.willpower',
  'attribute.charisma',
  'physicalDefense',
  'mysticDefense',
  'socialDefense',
  'initiative',
  'physicalArmor',
  'mysticArmor',
  'movement',
  'carryingCapacity',
  'woundThreshold',
  'unconsciousness',
  'death',
  'recovery',
  'attack',
  'damage',
]);
const ranked = nullableSource.extend({
  id: uuid,
  name: z.string(),
  rank: z.number().int().min(0).max(15),
  freeRank: z.number().int().min(0).max(15),
  attribute: attributeId,
  bonus: z.number().int(),
  notes: z.string(),
});
const groupOrder = z
  .array(z.enum(earthdawn4eGroupIds))
  .length(earthdawn4eGroupIds.length)
  .refine((value) => new Set(value).size === value.length);
const roll = z.object({
  id: uuid,
  step: z.number().int(),
  modifier: z.number().int(),
  targetNumber: nonnegative,
  context: z.string(),
  dice: z.string(),
  rolls: z.array(
    z.object({
      sides: z.number().int(),
      values: z.array(z.number().int()),
    }),
  ),
  total: z.number().int(),
  successLevel: nonnegative,
  createdAt: z.string().datetime(),
});

export const earthdawn4eCharacterSchema = z.object({
  identity: z.object({
    name: z.string(),
    player: z.string(),
    raceId: z.string().nullable(),
    raceName: z.string(),
    gender: z.string(),
    age: z.string(),
    height: z.string(),
    weight: z.string(),
    hair: z.string(),
    skin: z.string(),
    eyes: z.string(),
    passion: z.string(),
    traits: z.string(),
    description: z.string(),
  }),
  portrait: z
    .object({
      dataUrl: z.string().startsWith('data:image/'),
      mimeType: z.enum(['image/webp', 'image/png', 'image/jpeg']),
      width: z.number().int().positive().max(1024),
      height: z.number().int().positive().max(1024),
      source: z.enum(['file', 'url']),
    })
    .nullable()
    .default(null),
  raceSnapshot: z
    .object({
      definitionId: z.string(),
      name: z.string(),
      movement: z.string(),
      karmaModifier: nonnegative,
      abilities: z.array(z.string()),
      weaponSizeNotes: z.string(),
      armorCostMultiplier: z.number().positive(),
      armorWeightMultiplier: z.number().positive(),
    })
    .nullable()
    .default(null),
  creation: z.object({
    status: z.enum(['draft', 'finalized', 'manual']),
    currentStep: z.number().int().min(0).max(7),
    profile: z.enum(['adept', 'adept-questor', 'questor']),
    specializedPathId: z.string().nullable().default(null),
    specializedPathRank: z.number().int().min(0).max(10).default(0),
    enforceRules: z.boolean(),
    overrides: z.array(
      z.object({
        id: uuid,
        code: z.string(),
        reason: z.string(),
        createdAt: z.string().datetime(),
      }),
    ),
    attributePoints: z.record(z.string(), z.number().int().min(-2).max(8)),
    talentPoints: z.record(z.string(), nonnegative),
    finalizationVersion: nonnegative.default(0),
    purchaseTotalCopper: nonnegative.default(0),
    finalizationSnapshot: z
      .object({
        finalizedAt: z.string().datetime(),
        walletCopperBefore: nonnegative,
        grantedEquipmentIds: z.array(uuid),
        grantedWeaponIds: z.array(uuid),
        activityEntryIds: z.array(uuid),
        pathAbilityId: uuid.nullable(),
        karmaCurrentBefore: nonnegative,
        karmaMaximumBefore: nonnegative,
        bloodMagicDamageBefore: nonnegative,
      })
      .nullable()
      .default(null),
    revisionHistory: z
      .array(
        z.object({
          id: uuid,
          reopenedAt: z.string().datetime(),
          priorFinalizedAt: z.string().datetime(),
        }),
      )
      .default([]),
    skillPoints: z.object({
      general: nonnegative,
      knowledge: nonnegative,
      artisan: nonnegative,
      language: nonnegative,
    }),
    finalizedAt: z.string().datetime().nullable(),
  }),
  sources: z.object({
    enabledSourceIds: z.array(z.string()),
    showUnavailable: z.boolean(),
    defaultsVersion: z.number().int().nonnegative().default(0),
  }),
  disciplines: z.array(
    nullableSource.extend({
      id: uuid,
      sourceIds: z.array(z.string()).optional(),
      pageEnd: z.number().int().positive().nullable().optional(),
      disciplineId: z.string().nullable(),
      name: z.string(),
      circle: z.number().int().min(1).max(15),
      startedAtCircle: z.number().int().min(1).max(15),
      questor: z.boolean(),
      custom: z.boolean(),
    }),
  ),
  questor: z.object({
    patronId: z.string().nullable(),
    patronName: z.string(),
    rank: z.number().int().min(0).max(12),
    tier: z.enum(['none', 'follower', 'adherent', 'exemplar']),
    outOfFavor: z.boolean(),
    notes: z.string(),
  }),
  questorPaths: z.array(
    z.object({
      id: uuid,
      patronId: z.string().nullable(),
      patronName: z.string(),
      rank: z.number().int().min(0).max(12),
      tier: z.enum(['none', 'follower', 'adherent', 'exemplar']),
      outOfFavor: z.boolean(),
      gmOverride: z.boolean(),
      notes: z.string(),
    }),
  ),
  mysticPaths: z
    .array(
      z.object({
        id: uuid,
        definitionId: z.string(),
        name: z.string(),
        rank: z.number().int().min(1).max(10),
        active: z.boolean(),
        suspendedReason: z.string(),
        initiationEntryId: uuid.nullable(),
        bloodMagicDamage: nonnegative,
        sourceId: z.string().nullable(),
        source: z.string(),
        page: z.number().int().positive().nullable(),
        pageEnd: z.number().int().positive().nullable(),
        unresolved: z.boolean(),
        overrideReason: z.string(),
        optionTalentIds: z.array(uuid),
      }),
    )
    .default([]),
  attributes: z.record(
    attributeId,
    z.object({
      racial: z.number().int().min(1).max(30),
      purchased: z.number().int().min(-2).max(8),
      increases: nonnegative,
      temporaryBonus: z.number().int().min(-20).max(20),
    }),
  ),
  talents: z.array(
    ranked.extend({
      action: z.string(),
      strain: nonnegative,
      attributeText: z.string().default(''),
      effectText: z.string().default(''),
      descriptionText: z.string().default(''),
      actionText: z.string().default(''),
      strainText: z.string().default(''),
      citationText: z.string().default(''),
      metadataOverrides: z.array(z.string()).default([]),
      disciplineSources: z.array(z.string()),
      optional: z.boolean(),
      originCircle: z.number().int().min(1).max(15).nullable(),
      originDisciplineId: z.string().nullable(),
      creationOwned: z.boolean(),
      pathOriginId: uuid.optional(),
      pathCostTier: z.enum(['journeyman', 'warden', 'master']).optional(),
    }),
  ),
  skills: z.array(
    ranked.extend({
      category: z.enum(['general', 'knowledge', 'artisan', 'language']),
      action: z.string(),
      strain: nonnegative,
      creationOwned: z.boolean(),
    }),
  ),
  knacks: z.array(
    nullableSource.extend({
      id: uuid,
      name: z.string(),
      talentId: z.string().nullable(),
      minimumRank: nonnegative,
      action: z.string(),
      strain: nonnegative,
      notes: z.string(),
      variantKey: z.string().nullable().default(null),
      association: z.string().default(''),
      description: z.string().default(''),
      mechanicsText: z.string().default(''),
      actionText: z.string().default(''),
      strainText: z.string().default(''),
      minimumRankKnown: z.boolean().default(true),
      knackCircle: z.number().int().min(1).max(15).nullable().optional(),
      discipline: z.string().optional(),
      disciplineCircle: z.number().int().min(1).max(15).nullable().optional(),
      requiredSpells: z.array(z.string()).optional(),
      requiredTalentRanks: z
        .array(z.object({ name: z.string(), rank: nonnegative }))
        .optional(),
      bloodMagicDamage: nonnegative.optional(),
      matrixRestriction: z.enum(['squeeze']).nullable().optional(),
    }),
  ),
  abilities: z.array(
    nullableSource.extend({
      id: uuid,
      name: z.string(),
      kind: z.enum(['racial', 'discipline', 'questor', 'path', 'other']),
      notes: z.string(),
    }),
  ),
  magic: z.object({
    spells: z.array(
      nullableSource.extend({
        id: uuid,
        name: z.string(),
        discipline: z.string(),
        circle: z.number().int().min(1).max(15),
        threads: nonnegative,
        weaving: z.string(),
        casting: z.string(),
        range: z.string(),
        duration: z.string(),
        effect: z.string(),
        learned: z.boolean(),
        notes: z.string(),
        variantKey: z.string().nullable().optional(),
        variantSourceId: z.string().nullable().optional(),
        variantPageEnd: z.number().int().positive().nullable().optional(),
        description: z.string().optional(),
        threadsText: z.string().optional(),
        difficultyText: z.string().optional(),
        weavingDifficulty: nonnegative.nullable().optional(),
        reattuningDifficulty: nonnegative.nullable().optional(),
        castingDifficulty: nonnegative.nullable().optional(),
        area: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        detailedEffects: z.string().optional(),
        successLevels: z.string().optional(),
        extraThreads: z.string().optional(),
        formKey: z.string().nullable().optional(),
        formLabel: z.string().nullable().optional(),
        creationOwned: z.boolean().optional(),
      }),
    ),
    matrices: z.array(
      z.object({
        id: uuid,
        name: z.string(),
        type: z.enum([
          'standard',
          'enhanced',
          'armored',
          'shared',
          'object',
          'blood-charm',
          'elemental',
          'spirit',
          'blood-and-bone',
          'illusory',
        ]),
        source: z.string(),
        rank: nonnegative,
        spellId: z.string().nullable(),
        spellIds: z.array(z.string()),
        prewovenThreads: nonnegative,
        damage: nonnegative,
        deathRating: nonnegative,
        active: z.boolean(),
        temporaryUntil: z.string(),
        restriction: z.string(),
        reattuning: z.object({
          inProgress: z.boolean(),
          difficulty: nonnegative,
          strainPaid: nonnegative,
        }),
        used: z.boolean(),
        notes: z.string(),
        originType: z
          .enum(['talent', 'free-discipline', 'item', 'temporary', 'custom'])
          .optional(),
        talentId: uuid.nullable().optional(),
        divided: z.boolean().default(false),
      }),
    ),
    effects: z.array(
      nullableSource.extend({
        id: uuid,
        name: z.string(),
        target: z.string(),
        rank: nonnegative,
        applicable: z.boolean(),
        effects: z.string(),
        kind: z.enum(['thread', 'blood', 'pattern']),
        notes: z.string(),
        modifierTarget: magicEffectTarget.nullable().default(null),
        modifierValue: z.number().int().default(0),
      }),
    ),
  }),
  equipment: z.array(
    nullableSource.extend({
      id: uuid,
      name: z.string(),
      type: z.string(),
      description: z.string(),
      category: z.string().default('equipment'),
      quantity: z.number().int().min(1),
      value: z.string(),
      costSilver: z.number(),
      price: moneyAmount.default({ amount: 0, denomination: 'sp' }),
      weight: z.number().nonnegative(),
      inUse: z.boolean(),
      physicalArmor: nonnegative,
      mysticArmor: nonnegative,
      physicalDefense: nonnegative,
      mysticDefense: nonnegative,
      initiativePenalty: nonnegative,
      shatterThreshold: nonnegative,
      forgedBonus: nonnegative,
      availability: z.string().default(''),
      size: nonnegative.default(0),
      modifiers: z
        .array(
          z.object({
            id: uuid,
            target: z.string(),
            label: z.string(),
            value: z.number().int(),
          }),
        )
        .default([]),
      metadataOverrides: z.array(z.string()).default([]),
      details: z
        .object({
          rank: nonnegative.optional(),
          enchantingDifficulty: nonnegative.optional(),
          designAspects: z.string().optional(),
          feedCost: z.string().optional(),
          stableCost: z.string().optional(),
          carryingCapacity: z.string().optional(),
          speed: z.string().optional(),
          lifespan: z.string().optional(),
          costUnit: z.string().optional(),
          maximumThreads: nonnegative.optional(),
          tier: z.string().optional(),
        })
        .default({}),
      notes: z.string(),
      creationOwned: z.boolean().optional(),
      creationAcquisition: z
        .enum(['purchase', 'starting-kit'])
        .nullable()
        .optional(),
      creationPriceCopper: nonnegative.nullable().optional(),
      creationFitting: z
        .enum(['standard', 'tail-opening', 'full-tail', 'windling-balanced'])
        .nullable()
        .optional(),
    }),
  ),
  weapons: z.array(
    nullableSource.extend({
      id: uuid,
      name: z.string(),
      strengthMinimum: nonnegative,
      damageStep: z.number().int(),
      range: z.string(),
      quantity: z.number().int().min(1),
      costSilver: z.number(),
      price: moneyAmount.default({ amount: 0, denomination: 'sp' }),
      weight: z.number().nonnegative().default(0),
      inUse: z.boolean(),
      weaponType: z.enum(['melee', 'missile', 'throwing']).default('melee'),
      size: nonnegative.default(0),
      shortRange: z.string().default(''),
      longRange: z.string().default(''),
      availability: z.string().default(''),
      attackSourceId: z.string().nullable().default(null),
      attackMode: z.enum(['melee', 'missile', 'throwing']).default('melee'),
      modifiers: z
        .array(
          z.object({
            id: uuid,
            target: z.string(),
            label: z.string(),
            value: z.number().int(),
          }),
        )
        .default([]),
      metadataOverrides: z.array(z.string()).default([]),
      notes: z.string(),
      creationOwned: z.boolean().optional(),
      creationAcquisition: z
        .enum(['purchase', 'starting-kit'])
        .nullable()
        .optional(),
      creationPriceCopper: nonnegative.nullable().optional(),
      creationFitting: z
        .enum(['standard', 'tail-opening', 'full-tail', 'windling-balanced'])
        .nullable()
        .optional(),
    }),
  ),
  wealth: z.object({
    copper: z.number().int(),
    silver: z.number(),
    gold: z.number().int(),
    other: z.string(),
    startingSilver: z.number(),
  }),
  activity: z
    .object({
      tracking: z.boolean(),
      ledger: z.array(
        z.object({
          id: uuid,
          createdAt: z.string().datetime(),
          type: z.enum([
            'tracking',
            'currency',
            'equipment',
            'race',
            'correction',
          ]),
          description: z.string(),
          copperDelta: z.number().int(),
          targetId: z.string().nullable(),
          targetName: z.string(),
          quantityDelta: z.number().int(),
          locked: z.boolean(),
          reversesId: z.string().nullable(),
          reversedAt: z.string().datetime().nullable(),
          before: z.string(),
          after: z.string(),
        }),
      ),
    })
    .default({ tracking: true, ledger: [] }),
  reputation: z.object({
    legendaryStatus: z.string(),
    renown: z.string(),
    reputation: z.string(),
  }),
  health: z.object({
    basicMode: z.boolean(),
    damage: nonnegative,
    wounds: nonnegative,
    bloodMagicDamage: nonnegative,
    unconsciousnessBonus: z.number().int(),
    deathBonus: z.number().int(),
    recoveryUsed: nonnegative,
    karmaCurrent: nonnegative,
    karmaMaximum: nonnegative,
    devotionPoints: nonnegative,
    karmaAdjustment: z.number().int(),
    lastKarmaRitualAt: z.string().datetime().nullable(),
    lastRecoveryRoll: roll.nullable(),
    lastWoundBalanceRoll: roll.nullable(),
    conditions: z.object({
      stance: z.enum(['normal', 'aggressive', 'defensive']),
      knockedDown: z.boolean(),
      knockedDownSocial: z.boolean(),
      harried: z.boolean(),
      surprised: z.boolean(),
      surprisedSocial: z.boolean(),
      darkness: z.number().int().min(0).max(10),
    }),
    modifiers: z.array(
      z.object({
        id: uuid,
        name: z.string(),
        target: z.string(),
        value: z.number().int(),
        active: z.boolean(),
      }),
    ),
  }),
  advancement: z.object({
    ledger: z.array(
      z.object({
        id: uuid,
        date: z.string(),
        type: z.enum([
          'opening',
          'award',
          'talent',
          'skill',
          'attribute',
          'circle',
          'discipline',
          'knack',
          'spell',
          'thread',
          'questor',
          'path',
          'refund',
          'adjustment',
        ]),
        amount: z.number().int(),
        earnedAmount: nonnegative,
        targetId: z.string().nullable(),
        targetName: z.string(),
        beforeRating: z.number().int().nullable(),
        afterRating: z.number().int().nullable(),
        silverCost: z.number(),
        training: z.string(),
        sourceCitation: z.string(),
        description: z.string(),
        reversesId: z.string().nullable(),
        definitionId: z.string().nullable().default(null),
        variantKey: z.string().nullable().default(null),
        formKey: z.string().nullable().default(null),
        origin: z
          .enum([
            'discipline',
            'versatility',
            'path',
            'catalog',
            'custom',
            'override',
          ])
          .nullable()
          .default(null),
        originDisciplineId: z.string().nullable().default(null),
        costCircle: z.number().int().min(1).max(15).nullable().default(null),
        dependsOnEntryIds: z.array(z.string()).default([]),
        manual: z.boolean(),
        voidedAt: z.string().datetime().nullable(),
        voidReason: z.string(),
        createdAt: z.string().datetime(),
      }),
    ),
  }),
  dice: z.object({
    step: z.number().int().min(1).max(105),
    modifier: z.number().int().min(-50).max(50),
    targetNumber: nonnegative,
    context: z.string(),
    tracking: z.boolean(),
    historyLimit: z.number().int().min(1).max(1000).nullable(),
    lastRoll: roll.nullable(),
    history: z.array(roll),
  }),
  notes: z.object({
    log: z.string(),
    notes: z.string(),
    entries: z.array(
      z.object({
        id: uuid,
        kind: z.enum(['general', 'campaign']),
        title: z.string(),
        body: z.string(),
        sessionDate: z.string(),
        createdAt: z.string().datetime(),
        updatedAt: z.string().datetime(),
        collapsed: z.boolean(),
      }),
    ),
    importReview: z
      .object({
        mapped: z.array(z.string()),
        customized: z.array(z.string()),
        ignored: z.array(z.string()),
        unresolved: z.array(z.string()),
      })
      .nullable(),
  }),
  sheetLayout: z.object({ mode: z.enum(['edit', 'play']), groupOrder }),
});

export type Earthdawn4eCharacter = z.infer<typeof earthdawn4eCharacterSchema>;

const legacyPrice = (costSilver: number) =>
  costSilver > 0 && costSilver < 1
    ? { amount: Math.round(costSilver * 100), denomination: 'cp' as const }
    : { amount: Math.round(costSilver), denomination: 'sp' as const };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const legacyMagicEffectTarget = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const normalized = value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z]/g, '');
  const targets = Object.fromEntries(
    magicEffectTarget.options.map((target) => [
      target.toLocaleLowerCase().replace(/[^a-z]/g, ''),
      target,
    ]),
  ) as Record<string, z.infer<typeof magicEffectTarget>>;
  return targets[normalized] ?? null;
};

export function migrateEarthdawn4eCharacter(data: unknown) {
  const parsedCurrent = earthdawn4eCharacterSchema.safeParse(data);
  if (parsedCurrent.success) {
    const migratedPaths = [...parsedCurrent.data.mysticPaths];
    for (const ability of parsedCurrent.data.abilities) {
      const pathId = ability.definitionId?.startsWith('creator-path:')
        ? ability.definitionId.slice('creator-path:'.length)
        : null;
      const profile = pathId ? earthdawnPathById.get(pathId) : null;
      if (
        !profile ||
        migratedPaths.some(({ definitionId }) => definitionId === pathId)
      )
        continue;
      const rank = Math.max(
        1,
        Math.min(
          profile.maximumRank,
          Number(ability.notes.match(/Rank\s+(\d+)/i)?.[1] ?? 1),
        ),
      );
      migratedPaths.push({
        id: ability.id,
        definitionId: profile.id,
        name: profile.name,
        rank,
        active: true,
        suspendedReason: '',
        initiationEntryId: null,
        bloodMagicDamage: profile.bloodMagicDamage,
        sourceId: profile.sourceId,
        source: profile.citation,
        page: profile.page,
        pageEnd: profile.pageEnd,
        unresolved: !profile.verified,
        overrideReason: 'Migrated from the guided creator Path record.',
        optionTalentIds: [],
      });
    }
    const normalized = earthdawn4eCharacterSchema.parse({
      ...parsedCurrent.data,
      mysticPaths: migratedPaths,
      abilities: parsedCurrent.data.abilities.filter(
        ({ definitionId }) => !definitionId?.startsWith('creator-path:'),
      ),
      sources:
        parsedCurrent.data.sources.defaultsVersion < 2
          ? {
              ...parsedCurrent.data.sources,
              enabledSourceIds: [
                ...new Set([
                  ...parsedCurrent.data.sources.enabledSourceIds,
                  ...earthdawnSources.map(({ id }) => id),
                ]),
              ],
              defaultsVersion: 2,
            }
          : parsedCurrent.data.sources,
      equipment: parsedCurrent.data.equipment.map((item) => ({
        ...item,
        price:
          item.price.amount === 0 && item.costSilver > 0
            ? legacyPrice(item.costSilver)
            : item.price,
      })),
      weapons: parsedCurrent.data.weapons.map((item) => ({
        ...item,
        price:
          item.price.amount === 0 && item.costSilver > 0
            ? legacyPrice(item.costSilver)
            : item.price,
      })),
      knacks: parsedCurrent.data.knacks.map((knack) => {
        if (!knack.definitionId || knack.variantKey) return knack;
        const variants =
          earthdawnDefinitionById.get(knack.definitionId)?.knackMetadata
            ?.variants ?? [];
        const variant =
          variants.find(
            (candidate) =>
              candidate.sourceId === knack.sourceId &&
              (!knack.association ||
                candidate.association === knack.association),
          ) ?? (variants.length === 1 ? variants[0] : undefined);
        if (!variant) return knack;
        return {
          ...knack,
          sourceId: variant.sourceId,
          source:
            earthdawnSources.find(({ id }) => id === variant.sourceId)?.title ??
            knack.source,
          page: variant.page,
          variantKey: variant.key,
          association: variant.association,
          description: variant.description,
          mechanicsText: variant.mechanicsText,
          action: variant.actionText,
          actionText: variant.actionText,
          strain: variant.strainValue ?? 0,
          strainText: variant.strainText,
          minimumRank: variant.minimumRank ?? 0,
          minimumRankKnown: variant.minimumRank != null,
        };
      }),
      magic: {
        ...parsedCurrent.data.magic,
        effects: parsedCurrent.data.magic.effects.map((effect) => ({
          ...effect,
          modifierTarget:
            effect.modifierTarget ?? legacyMagicEffectTarget(effect.target),
        })),
        spells: parsedCurrent.data.magic.spells.map((spell) => {
          if (!spell.definitionId || spell.variantKey) return spell;
          const definition = earthdawnDefinitionById.get(spell.definitionId);
          const metadata = definition?.spellMetadata;
          if (!metadata) return spell;
          const variant =
            metadata.variants.find(
              (candidate) =>
                candidate.discipline === spell.discipline &&
                spell.circle >= candidate.circleMin &&
                spell.circle <= candidate.circleMax &&
                (!spell.sourceId || candidate.sourceId === spell.sourceId),
            ) ?? metadata.variants[0];
          if (!variant) return spell;
          return {
            ...spell,
            variantKey: `${variant.sourceId}|${variant.discipline}|${spell.circle}`,
            variantSourceId: variant.sourceId,
            variantPageEnd: variant.pageEnd,
            description: metadata.description,
            threadsText: metadata.threadsText,
            difficultyText: metadata.difficultyText,
            weavingDifficulty: metadata.weavingDifficulty ?? null,
            reattuningDifficulty: metadata.reattuningDifficulty ?? null,
            castingDifficulty: metadata.castingDifficulty ?? null,
            effect: spell.effect || metadata.effectText,
            threads: metadata.threadsValue ?? spell.threads,
            weaving: spell.weaving || metadata.difficultyText,
            casting: spell.casting || metadata.difficultyText,
          };
        }),
      },
    });
    if (
      !normalized.creation.enforceRules &&
      !normalized.creation.overrides.some(
        ({ code }) => code === 'creator-global-override',
      )
    )
      return earthdawn4eCharacterSchema.parse({
        ...normalized,
        creation: {
          ...normalized.creation,
          overrides: [
            ...normalized.creation.overrides,
            {
              id: crypto.randomUUID(),
              code: 'creator-global-override',
              reason: 'Legacy GM override retained during migration.',
              createdAt: new Date().toISOString(),
            },
          ],
        },
      });
    return normalized;
  }
  if (!isRecord(data)) return earthdawn4eCharacterSchema.parse(data);
  const now = new Date().toISOString();
  const identity = isRecord(data.identity) ? data.identity : {};
  const creation = isRecord(data.creation) ? data.creation : {};
  const magic = isRecord(data.magic) ? data.magic : {};
  const health = isRecord(data.health) ? data.health : {};
  const oldAdvancement = isRecord(data.advancement) ? data.advancement : {};
  const oldLegend = isRecord(oldAdvancement.legend)
    ? oldAdvancement.legend
    : {};
  const oldLedger = Array.isArray(oldAdvancement.ledger)
    ? oldAdvancement.ledger
    : [];
  const total = Number(oldLegend.total ?? 0);
  const current = Number(oldLegend.current ?? 0);
  const migratedLedger = oldLedger.map((entry) => {
    const value = isRecord(entry) ? entry : {};
    const amount = Number(value.amount ?? 0);
    return {
      id: typeof value.id === 'string' ? value.id : crypto.randomUUID(),
      date: typeof value.date === 'string' ? value.date : now.slice(0, 10),
      type: [
        'opening',
        'award',
        'talent',
        'skill',
        'attribute',
        'circle',
        'discipline',
        'knack',
        'spell',
        'thread',
        'questor',
        'path',
        'refund',
        'adjustment',
      ].includes(String(value.type))
        ? value.type
        : 'adjustment',
      amount,
      earnedAmount: Number(value.earnedAmount ?? (amount > 0 ? amount : 0)),
      targetId: typeof value.targetId === 'string' ? value.targetId : null,
      targetName: typeof value.targetName === 'string' ? value.targetName : '',
      beforeRating:
        typeof value.beforeRating === 'number' ? value.beforeRating : null,
      afterRating:
        typeof value.afterRating === 'number' ? value.afterRating : null,
      silverCost: Number(value.silverCost ?? 0),
      training: typeof value.training === 'string' ? value.training : '',
      sourceCitation:
        typeof value.sourceCitation === 'string' ? value.sourceCitation : '',
      description:
        typeof value.description === 'string' ? value.description : '',
      reversesId:
        typeof value.reversesId === 'string' ? value.reversesId : null,
      definitionId:
        typeof value.definitionId === 'string' ? value.definitionId : null,
      variantKey:
        typeof value.variantKey === 'string' ? value.variantKey : null,
      formKey: typeof value.formKey === 'string' ? value.formKey : null,
      origin: [
        'discipline',
        'versatility',
        'path',
        'catalog',
        'custom',
        'override',
      ].includes(String(value.origin))
        ? value.origin
        : null,
      originDisciplineId:
        typeof value.originDisciplineId === 'string'
          ? value.originDisciplineId
          : null,
      costCircle:
        typeof value.costCircle === 'number' ? value.costCircle : null,
      dependsOnEntryIds: Array.isArray(value.dependsOnEntryIds)
        ? value.dependsOnEntryIds.filter(
            (item): item is string => typeof item === 'string',
          )
        : [],
      manual: Boolean(value.manual),
      voidedAt: typeof value.voidedAt === 'string' ? value.voidedAt : null,
      voidReason: typeof value.voidReason === 'string' ? value.voidReason : '',
      createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    };
  });
  if (migratedLedger.length === 0 && total > 0) {
    migratedLedger.push({
      id: crypto.randomUUID(),
      date: now.slice(0, 10),
      type: 'adjustment',
      amount: total,
      earnedAmount: total,
      targetId: null,
      targetName: 'Legacy opening balance',
      beforeRating: null,
      afterRating: null,
      silverCost: 0,
      training: '',
      sourceCitation: '',
      description: 'Preserved Total Legend Points from the prior schema.',
      reversesId: null,
      definitionId: null,
      variantKey: null,
      formKey: null,
      origin: null,
      originDisciplineId: null,
      costCircle: null,
      dependsOnEntryIds: [],
      manual: true,
      voidedAt: null,
      voidReason: '',
      createdAt: now,
    });
    if (current !== total)
      migratedLedger.push({
        id: crypto.randomUUID(),
        date: now.slice(0, 10),
        type: 'adjustment',
        amount: current - total,
        earnedAmount: 0,
        targetId: null,
        targetName: 'Legacy current balance',
        beforeRating: null,
        afterRating: null,
        silverCost: 0,
        training: '',
        sourceCitation: '',
        description: 'Preserved Current Legend Points from the prior schema.',
        reversesId: null,
        definitionId: null,
        variantKey: null,
        formKey: null,
        origin: null,
        originDisciplineId: null,
        costCircle: null,
        dependsOnEntryIds: [],
        manual: true,
        voidedAt: null,
        voidReason: '',
        createdAt: now,
      });
  }
  const oldDice = isRecord(data.dice) ? data.dice : {};
  const history = Array.isArray(oldDice.history) ? oldDice.history : [];
  const next = {
    ...data,
    sources: {
      ...(isRecord(data.sources) ? data.sources : {}),
      enabledSourceIds: [
        ...new Set([
          ...(isRecord(data.sources) &&
          Array.isArray(data.sources.enabledSourceIds)
            ? data.sources.enabledSourceIds.filter(
                (id): id is string => typeof id === 'string',
              )
            : []),
          ...earthdawnSources.map(({ id }) => id),
        ]),
      ],
      showUnavailable:
        isRecord(data.sources) &&
        typeof data.sources.showUnavailable === 'boolean'
          ? data.sources.showUnavailable
          : false,
      defaultsVersion: 2,
    },
    identity: {
      ...identity,
      height: identity.height ?? '',
      weight: identity.weight ?? '',
    },
    portrait: isRecord(data.portrait) ? data.portrait : null,
    creation: {
      ...creation,
      currentStep: Math.min(7, Number(creation.currentStep ?? 0)),
      profile: creation.profile ?? 'adept',
      specializedPathId:
        typeof creation.specializedPathId === 'string'
          ? creation.specializedPathId
          : null,
      specializedPathRank: Number(creation.specializedPathRank ?? 0),
      overrides:
        creation.enforceRules === false &&
        !(
          Array.isArray(creation.overrides) &&
          creation.overrides.some(
            (entry) =>
              isRecord(entry) && entry.code === 'creator-global-override',
          )
        )
          ? [
              ...(Array.isArray(creation.overrides) ? creation.overrides : []),
              {
                id: crypto.randomUUID(),
                code: 'creator-global-override',
                reason: 'Legacy GM override retained during migration.',
                createdAt: now,
              },
            ]
          : creation.overrides,
      skillPoints: {
        ...(isRecord(creation.skillPoints) ? creation.skillPoints : {}),
        language: isRecord(creation.skillPoints)
          ? Number(creation.skillPoints.language ?? 3)
          : 3,
      },
    },
    disciplines: (Array.isArray(data.disciplines) ? data.disciplines : []).map(
      (entry) => ({
        ...(isRecord(entry) ? entry : {}),
        custom: isRecord(entry) ? entry.disciplineId == null : true,
      }),
    ),
    questor: isRecord(data.questor)
      ? data.questor
      : {
          patronId: null,
          patronName:
            typeof identity.passion === 'string' ? identity.passion : '',
          rank: 0,
          tier: 'none',
          outOfFavor: false,
          notes: '',
        },
    questorPaths: Array.isArray(data.questorPaths)
      ? data.questorPaths
      : (() => {
          const legacy = isRecord(data.questor) ? data.questor : null;
          const patronName =
            legacy && typeof legacy.patronName === 'string'
              ? legacy.patronName
              : typeof identity.passion === 'string'
                ? identity.passion
                : '';
          return patronName
            ? [
                {
                  id: crypto.randomUUID(),
                  patronId:
                    legacy && typeof legacy.patronId === 'string'
                      ? legacy.patronId
                      : null,
                  patronName,
                  rank: legacy ? Number(legacy.rank ?? 0) : 0,
                  tier:
                    legacy && typeof legacy.tier === 'string'
                      ? legacy.tier
                      : 'none',
                  outOfFavor: legacy ? Boolean(legacy.outOfFavor) : false,
                  gmOverride: false,
                  notes:
                    legacy && typeof legacy.notes === 'string'
                      ? legacy.notes
                      : '',
                },
              ]
            : [];
        })(),
    mysticPaths: [],
    talents: (Array.isArray(data.talents) ? data.talents : []).map((entry) => ({
      ...(isRecord(entry) ? entry : {}),
      originCircle: null,
      originDisciplineId: null,
      creationOwned: false,
    })),
    skills: (Array.isArray(data.skills) ? data.skills : []).map((entry) => ({
      ...(isRecord(entry) ? entry : {}),
      creationOwned: false,
    })),
    magic: {
      ...magic,
      spells: (Array.isArray(magic.spells) ? magic.spells : []).map(
        (entry) => ({
          ...(isRecord(entry) ? entry : {}),
          threads: isRecord(entry) ? Number(entry.threads ?? 0) : 0,
          weaving:
            isRecord(entry) && typeof entry.weaving === 'string'
              ? entry.weaving
              : '',
          casting:
            isRecord(entry) && typeof entry.casting === 'string'
              ? entry.casting
              : '',
          range:
            isRecord(entry) && typeof entry.range === 'string'
              ? entry.range
              : '',
          duration:
            isRecord(entry) && typeof entry.duration === 'string'
              ? entry.duration
              : '',
          effect:
            isRecord(entry) && typeof entry.effect === 'string'
              ? entry.effect
              : '',
        }),
      ),
      effects: (Array.isArray(magic.effects) ? magic.effects : []).map(
        (entry) => ({
          ...(isRecord(entry) ? entry : {}),
          rank: isRecord(entry) ? Number(entry.rank ?? 0) : 0,
          modifierTarget: isRecord(entry)
            ? legacyMagicEffectTarget(entry.modifierTarget ?? entry.target)
            : null,
          modifierValue: isRecord(entry) ? Number(entry.modifierValue ?? 0) : 0,
        }),
      ),
      matrices: (Array.isArray(magic.matrices) ? magic.matrices : []).map(
        (entry) => {
          const value = isRecord(entry) ? entry : {};
          const type = typeof value.type === 'string' ? value.type : 'standard';
          const defaultDeath =
            type === 'armored'
              ? 25
              : type === 'shared'
                ? 20
                : type === 'enhanced'
                  ? 15
                  : 10;
          return {
            ...value,
            name: typeof value.name === 'string' ? value.name : 'Spell Matrix',
            spellIds: Array.isArray(value.spellIds)
              ? value.spellIds
              : typeof value.spellId === 'string'
                ? [value.spellId]
                : [],
            prewovenThreads: Number(value.prewovenThreads ?? 0),
            damage: Number(value.damage ?? 0),
            deathRating: Number(value.deathRating ?? defaultDeath),
            active: value.active !== false,
            temporaryUntil:
              typeof value.temporaryUntil === 'string'
                ? value.temporaryUntil
                : '',
            restriction:
              typeof value.restriction === 'string' ? value.restriction : '',
            reattuning: isRecord(value.reattuning)
              ? value.reattuning
              : { inProgress: false, difficulty: 0, strainPaid: 0 },
          };
        },
      ),
    },
    equipment: (Array.isArray(data.equipment) ? data.equipment : []).map(
      (entry) => ({
        ...(isRecord(entry) ? entry : {}),
        costSilver: isRecord(entry) ? Number(entry.costSilver ?? 0) : 0,
        price:
          isRecord(entry) && isRecord(entry.price)
            ? entry.price
            : legacyPrice(isRecord(entry) ? Number(entry.costSilver ?? 0) : 0),
        physicalDefense: isRecord(entry)
          ? Number(entry.physicalDefense ?? 0)
          : 0,
        mysticDefense: isRecord(entry) ? Number(entry.mysticDefense ?? 0) : 0,
        shatterThreshold: isRecord(entry)
          ? Number(entry.shatterThreshold ?? 0)
          : 0,
      }),
    ),
    weapons: (Array.isArray(data.weapons) ? data.weapons : []).map((entry) => ({
      ...(isRecord(entry) ? entry : {}),
      price:
        isRecord(entry) && isRecord(entry.price)
          ? entry.price
          : legacyPrice(isRecord(entry) ? Number(entry.costSilver ?? 0) : 0),
    })),
    wealth: isRecord(data.wealth)
      ? data.wealth
      : { copper: 0, silver: 0, gold: 0, other: '', startingSilver: 0 },
    reputation: isRecord(data.reputation)
      ? data.reputation
      : { legendaryStatus: '', renown: '', reputation: '' },
    health: {
      ...health,
      basicMode: true,
      bloodMagicDamage: health.bloodMagicDamage ?? 0,
      karmaAdjustment: health.karmaAdjustment ?? 0,
      lastKarmaRitualAt: health.lastKarmaRitualAt ?? null,
      lastRecoveryRoll: health.lastRecoveryRoll ?? null,
      lastWoundBalanceRoll: health.lastWoundBalanceRoll ?? null,
    },
    advancement: { ledger: migratedLedger },
    dice: {
      ...oldDice,
      tracking: oldDice.tracking ?? true,
      historyLimit:
        oldDice.historyLimit === undefined ? 10 : oldDice.historyLimit,
      lastRoll: oldDice.lastRoll ?? history[0] ?? null,
      history,
    },
    notes: {
      ...(isRecord(data.notes) ? data.notes : {}),
      log:
        isRecord(data.notes) && typeof data.notes.log === 'string'
          ? data.notes.log
          : '',
      notes:
        isRecord(data.notes) && typeof data.notes.notes === 'string'
          ? data.notes.notes
          : '',
      entries: Array.isArray(isRecord(data.notes) ? data.notes.entries : null)
        ? (data.notes as Record<string, unknown>).entries
        : isRecord(data.notes) &&
            typeof data.notes.log === 'string' &&
            data.notes.log.trim()
          ? [
              {
                id: crypto.randomUUID(),
                kind: 'campaign',
                title: 'Migrated campaign log',
                body: data.notes.log,
                sessionDate: '',
                createdAt: now,
                updatedAt: now,
                collapsed: false,
              },
            ]
          : [],
      importReview: isRecord(data.notes)
        ? (data.notes.importReview ?? null)
        : null,
    },
  };
  return earthdawn4eCharacterSchema.parse(next);
}
