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
  freeRank: z.number().int().min(0).max(3),
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
        type: z.enum(['standard', 'enhanced', 'armored', 'shared']),
        source: z.string(),
        rank: nonnegative,
        spellId: z.string().nullable(),
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
      initiativePenalty: nonnegative,
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
      type:
        value.type === 'refund' ? ('refund' as const) : ('adjustment' as const),
      amount,
      earnedAmount: amount > 0 ? amount : 0,
      targetId: typeof value.targetId === 'string' ? value.targetId : null,
      targetName: typeof value.targetName === 'string' ? value.targetName : '',
      beforeRating: null,
      afterRating: null,
      silverCost: 0,
      training: '',
      sourceCitation: '',
      description:
        typeof value.description === 'string' ? value.description : '',
      reversesId: null,
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
    },
    equipment: (Array.isArray(data.equipment) ? data.equipment : []).map(
      (entry) => ({
        ...(isRecord(entry) ? entry : {}),
        costSilver: isRecord(entry) ? Number(entry.costSilver ?? 0) : 0,
      }),
    ),
    weapons: Array.isArray(data.weapons) ? data.weapons : [],
    wealth: isRecord(data.wealth)
      ? data.wealth
      : { copper: 0, silver: 0, gold: 0, other: '', startingSilver: 0 },
    reputation: isRecord(data.reputation)
      ? data.reputation
      : { legendaryStatus: '', renown: '', reputation: '' },
    health: { ...health, bloodMagicDamage: health.bloodMagicDamage ?? 0 },
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
