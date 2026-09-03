import { z } from 'zod';
import { earthdawn4eGroupIds } from './definitions';

const uuid = z.string().uuid(),
  nonnegative = z.number().int().nonnegative();
const source = z.object({
  definitionId: z.string().nullable(),
  sourceId: z.string().nullable(),
  source: z.string().nullable(),
  page: z.number().int().positive().nullable(),
  unresolved: z.boolean(),
});
const ranked = source.extend({
  id: uuid,
  name: z.string(),
  rank: z.number().int().min(0).max(15),
  freeRank: z.number().int().min(0).max(3),
  attribute: z.enum([
    'dexterity',
    'strength',
    'toughness',
    'perception',
    'willpower',
    'charisma',
  ]),
  bonus: z.number().int(),
  notes: z.string(),
});
const groupOrder = z
  .array(z.enum(earthdawn4eGroupIds))
  .length(earthdawn4eGroupIds.length)
  .refine((v) => new Set(v).size === v.length);
export const earthdawn4eCharacterSchema = z.object({
  identity: z.object({
    name: z.string(),
    player: z.string(),
    raceId: z.string().nullable(),
    raceName: z.string(),
    gender: z.string(),
    age: z.string(),
    hair: z.string(),
    skin: z.string(),
    eyes: z.string(),
    passion: z.string(),
    traits: z.string(),
    description: z.string(),
  }),
  creation: z.object({
    status: z.enum(['draft', 'finalized', 'manual']),
    currentStep: z.number().int().min(0).max(9),
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
    }),
    finalizedAt: z.string().datetime().nullable(),
  }),
  sources: z.object({
    enabledSourceIds: z.array(z.string()),
    showUnavailable: z.boolean(),
  }),
  disciplines: z.array(
    source.extend({
      id: uuid,
      disciplineId: z.string().nullable(),
      name: z.string(),
      circle: z.number().int().min(1).max(15),
      startedAtCircle: z.number().int().min(1).max(15),
      questor: z.boolean(),
    }),
  ),
  attributes: z.object({
    dexterity: z.object({
      racial: z.number().int().min(1).max(30),
      purchased: z.number().int().min(-2).max(8),
      increases: nonnegative,
      temporaryBonus: z.number().int().min(-20).max(20),
    }),
    strength: z.object({
      racial: z.number().int().min(1).max(30),
      purchased: z.number().int().min(-2).max(8),
      increases: nonnegative,
      temporaryBonus: z.number().int().min(-20).max(20),
    }),
    toughness: z.object({
      racial: z.number().int().min(1).max(30),
      purchased: z.number().int().min(-2).max(8),
      increases: nonnegative,
      temporaryBonus: z.number().int().min(-20).max(20),
    }),
    perception: z.object({
      racial: z.number().int().min(1).max(30),
      purchased: z.number().int().min(-2).max(8),
      increases: nonnegative,
      temporaryBonus: z.number().int().min(-20).max(20),
    }),
    willpower: z.object({
      racial: z.number().int().min(1).max(30),
      purchased: z.number().int().min(-2).max(8),
      increases: nonnegative,
      temporaryBonus: z.number().int().min(-20).max(20),
    }),
    charisma: z.object({
      racial: z.number().int().min(1).max(30),
      purchased: z.number().int().min(-2).max(8),
      increases: nonnegative,
      temporaryBonus: z.number().int().min(-20).max(20),
    }),
  }),
  talents: z.array(
    ranked.extend({
      action: z.string(),
      strain: nonnegative,
      disciplineSources: z.array(z.string()),
      optional: z.boolean(),
    }),
  ),
  skills: z.array(
    ranked.extend({
      category: z.enum(['general', 'knowledge', 'artisan']),
      action: z.string(),
      strain: nonnegative,
    }),
  ),
  knacks: z.array(
    source.extend({
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
    source.extend({
      id: uuid,
      name: z.string(),
      kind: z.enum(['racial', 'discipline', 'questor', 'path', 'other']),
      notes: z.string(),
    }),
  ),
  magic: z.object({
    spells: z.array(
      source.extend({
        id: uuid,
        name: z.string(),
        discipline: z.string(),
        circle: z.number().int().min(1).max(15),
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
      source.extend({
        id: uuid,
        name: z.string(),
        target: z.string(),
        applicable: z.boolean(),
        effects: z.string(),
        kind: z.enum(['thread', 'blood', 'pattern']),
        notes: z.string(),
      }),
    ),
  }),
  equipment: z.array(
    source.extend({
      id: uuid,
      name: z.string(),
      type: z.string(),
      description: z.string(),
      quantity: z.number().int().min(1),
      value: z.string(),
      weight: z.number().nonnegative(),
      inUse: z.boolean(),
      physicalArmor: nonnegative,
      mysticArmor: nonnegative,
      initiativePenalty: nonnegative,
      forgedBonus: nonnegative,
      notes: z.string(),
    }),
  ),
  health: z.object({
    damage: nonnegative,
    wounds: nonnegative,
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
    legend: z.object({ current: nonnegative, total: nonnegative }),
    ledger: z.array(
      z.object({
        id: uuid,
        date: z.string(),
        type: z.enum([
          'award',
          'talent',
          'skill',
          'attribute',
          'circle',
          'spell',
          'refund',
          'adjustment',
        ]),
        amount: z.number().int(),
        targetId: z.string().nullable(),
        targetName: z.string(),
        description: z.string(),
        createdAt: z.string().datetime(),
      }),
    ),
  }),
  dice: z.object({
    step: z.number().int().min(1).max(105),
    modifier: z.number().int().min(-50).max(50),
    targetNumber: nonnegative,
    context: z.string(),
    history: z.array(
      z.object({
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
      }),
    ),
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
export const migrateEarthdawn4eCharacter = (data: unknown) =>
  earthdawn4eCharacterSchema.parse(data);
