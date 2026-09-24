import { z } from 'zod';
import { earthdawn4eGroupIds } from './definitions';

const uuid = z.string().uuid();
const nonnegative = z.number().int().nonnegative();
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
  creation: z.object({
    status: z.enum(['draft', 'finalized', 'manual']),
    currentStep: z.number().int().min(0).max(7),
    profile: z.enum(['adept', 'adept-questor', 'questor']),
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
  }),
  disciplines: z.array(
    nullableSource.extend({
      id: uuid,
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
      actionText: z.string().default(''),
      strainText: z.string().default(''),
      citationText: z.string().default(''),
      metadataOverrides: z.array(z.string()).default([]),
      disciplineSources: z.array(z.string()),
      optional: z.boolean(),
      originCircle: z.number().int().min(1).max(15).nullable(),
      originDisciplineId: z.string().nullable(),
      creationOwned: z.boolean(),
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
      }),
    ),
  }),
  equipment: z.array(
    nullableSource.extend({
      id: uuid,
      name: z.string(),
      type: z.string(),
      description: z.string(),
      quantity: z.number().int().min(1),
      value: z.string(),
      costSilver: z.number(),
      weight: z.number().nonnegative(),
      inUse: z.boolean(),
      physicalArmor: nonnegative,
      mysticArmor: nonnegative,
      physicalDefense: nonnegative,
      mysticDefense: nonnegative,
      initiativePenalty: nonnegative,
      shatterThreshold: nonnegative,
      forgedBonus: nonnegative,
      notes: z.string(),
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
      inUse: z.boolean(),
      notes: z.string(),
    }),
  ),
  wealth: z.object({
    copper: z.number().int(),
    silver: z.number(),
    gold: z.number().int(),
    other: z.string(),
    startingSilver: z.number(),
  }),
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function migrateEarthdawn4eCharacter(data: unknown) {
  const parsedCurrent = earthdawn4eCharacterSchema.safeParse(data);
  if (parsedCurrent.success) {
    if (
      !parsedCurrent.data.creation.enforceRules &&
      !parsedCurrent.data.creation.overrides.some(
        ({ code }) => code === 'creator-global-override',
      )
    )
      return earthdawn4eCharacterSchema.parse({
        ...parsedCurrent.data,
        creation: {
          ...parsedCurrent.data.creation,
          overrides: [
            ...parsedCurrent.data.creation.overrides,
            {
              id: crypto.randomUUID(),
              code: 'creator-global-override',
              reason: 'Legacy GM override retained during migration.',
              createdAt: new Date().toISOString(),
            },
          ],
        },
      });
    return parsedCurrent.data;
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
        createdAt: now,
      });
  }
  const oldDice = isRecord(data.dice) ? data.dice : {};
  const history = Array.isArray(oldDice.history) ? oldDice.history : [];
  const next = {
    ...data,
    identity: {
      ...identity,
      height: identity.height ?? '',
      weight: identity.weight ?? '',
    },
    creation: {
      ...creation,
      currentStep: Math.min(7, Number(creation.currentStep ?? 0)),
      profile: creation.profile ?? 'adept',
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
          ? Number(creation.skillPoints.language ?? 0)
          : 0,
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
        physicalDefense: isRecord(entry)
          ? Number(entry.physicalDefense ?? 0)
          : 0,
        mysticDefense: isRecord(entry) ? Number(entry.mysticDefense ?? 0) : 0,
        shatterThreshold: isRecord(entry)
          ? Number(entry.shatterThreshold ?? 0)
          : 0,
      }),
    ),
    weapons: Array.isArray(data.weapons) ? data.weapons : [],
    wealth: isRecord(data.wealth)
      ? data.wealth
      : { copper: 0, silver: 0, gold: 0, other: '', startingSilver: 0 },
    reputation: isRecord(data.reputation)
      ? data.reputation
      : { legendaryStatus: '', renown: '', reputation: '' },
    health: {
      ...health,
      basicMode: health.basicMode ?? false,
      bloodMagicDamage: health.bloodMagicDamage ?? 0,
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
  };
  return earthdawn4eCharacterSchema.parse(next);
}
