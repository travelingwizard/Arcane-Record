import { z } from 'zod';
import {
  W20_SCHEMA_VERSION,
  defaultW20Order,
  w20GroupIds,
} from './definitions';

const uuid = z.string().uuid();
const rating = z.number().int().min(0).max(10);
const source = z.object({
  definitionId: z.string().nullable(),
  sourceId: z.string(),
  page: z.number().int().positive().nullable(),
  custom: z.boolean(),
});
const rated = source.extend({
  id: uuid,
  name: z.string(),
  kind: z.enum([
    'attribute',
    'ability',
    'background',
    'gift',
    'rite',
    'fetish',
    'talen',
    'merit',
    'flaw',
    'renown',
    'numen',
    'other',
  ]),
  category: z.string(),
  rating,
  cost: z.number().int(),
  specialty: z.string(),
  notes: z.string(),
  origin: z.enum(['creator', 'freebie', 'manual', 'advancement', 'import']),
});
const record = source.extend({
  id: uuid,
  name: z.string(),
  category: z.string(),
  rating,
  state: z.string(),
  quantity: z.number().int().nonnegative(),
  notes: z.string(),
});
const approval = z.object({
  id: uuid,
  ruleId: z.string(),
  reason: z.string(),
  approvedAt: z.string().datetime(),
});
const damage = z.object({
  id: uuid,
  type: z.enum(['bashing', 'lethal', 'aggravated']),
  level: z.enum([
    'bruised',
    'hurt',
    'injured',
    'wounded',
    'mauled',
    'crippled',
    'incapacitated',
  ]),
  notes: z.string(),
  createdAt: z.string().datetime(),
});
const ledger = z.object({
  id: uuid,
  date: z.string(),
  storyId: z.string(),
  kind: z.enum(['award', 'purchase', 'refund', 'adjustment', 'story']),
  amount: z.number().int(),
  targetKind: z.string().nullable(),
  targetId: z.string().nullable(),
  targetName: z.string(),
  previousRating: z.number().int().nullable(),
  newRating: z.number().int().nullable(),
  description: z.string(),
  justification: z.string(),
  approvalId: z.string().nullable(),
  reversedEntryId: z.string().nullable(),
  createdAt: z.string().datetime(),
});
const roll = z.object({
  id: uuid,
  pool: z.number().int().min(0).max(100),
  difficulty: z.number().int().min(2).max(10),
  specialty: z.boolean(),
  rageRoll: z.boolean(),
  dice: z.array(z.number().int().min(1).max(10)),
  successes: z.number().int(),
  result: z.enum(['botch', 'failure', 'success']),
  context: z.string(),
  createdAt: z.string().datetime(),
});
const order = z
  .array(z.enum(w20GroupIds as [string, ...string[]]))
  .length(w20GroupIds.length)
  .refine((ids) => new Set(ids).size === ids.length);

export const w20CharacterSchema = z.object({
  schemaVersion: z.literal(W20_SCHEMA_VERSION),
  characterType: z.enum(['garou', 'changing-breed', 'kinfolk', 'wyrm-aligned']),
  changingBreedId: z.string().nullable(),
  wyrmTypeId: z.string().nullable(),
  kinfolkType: z.enum(['human', 'wolf']).nullable(),
  name: z.string(),
  player: z.string(),
  chronicle: z.string(),
  concept: z.string(),
  natureId: z.string().nullable(),
  demeanorId: z.string().nullable(),
  breedId: z.string().nullable(),
  auspiceId: z.string().nullable(),
  tribeId: z.string().nullable(),
  campId: z.string().nullable(),
  deedName: z.string(),
  packName: z.string(),
  packTotemId: z.string().nullable(),
  age: z.string(),
  gender: z.string(),
  description: z.string(),
  goals: z.string(),
  history: z.string(),
  notes: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({ build: order, play: order }),
  enabledSources: z.array(z.string()),
  showUnavailableSources: z.boolean(),
  creation: z.object({
    status: z.enum(['draft', 'manual', 'finalized']),
    step: z.number().int().min(1).max(12),
    attributePriorities: z
      .array(z.enum(['physical', 'social', 'mental']))
      .length(3),
    abilityPriorities: z
      .array(z.enum(['talents', 'skills', 'knowledges']))
      .length(3),
    freebieSpent: z.number().int().nonnegative(),
    flawCredit: z.number().int().nonnegative(),
    matureContent: z.boolean(),
    restrictedSelection: z.boolean(),
    approvals: z.array(approval),
    finalizedAt: z.string().datetime().nullable(),
    baseline: z.unknown().nullable(),
    rebuildDraft: z.unknown().nullable(),
  }),
  attributes: z.array(rated),
  abilities: z.array(rated),
  backgrounds: z.array(rated),
  gifts: z.array(rated),
  rites: z.array(rated),
  fetishes: z.array(rated),
  talens: z.array(rated),
  merits: z.array(rated),
  flaws: z.array(rated),
  numina: z.array(rated),
  otherTraits: z.array(rated),
  forms: z.array(record),
  currentFormId: z.string().nullable(),
  renown: z.object({
    glory: rating,
    honor: rating,
    wisdom: rating,
    otherName: z.string(),
    other: rating,
    rank: z.number().int().min(0).max(6),
  }),
  rage: z.object({ permanent: rating, current: rating }),
  gnosis: z.object({ permanent: rating, current: rating }),
  willpower: z.object({ permanent: rating, current: rating }),
  states: z.object({
    frenzy: z.boolean(),
    foxFrenzy: z.boolean(),
    harano: rating,
    hauglosk: rating,
    temporaryEffects: z.string(),
  }),
  health: z.array(damage),
  battleScars: z.array(record),
  pack: z.object({
    role: z.string(),
    members: z.array(record),
    relationships: z.array(record),
    pooledBackgrounds: z.array(record),
    totemNotes: z.string(),
    obligations: z.string(),
  }),
  possessions: z.array(record),
  weapons: z.array(record),
  armor: z.array(record),
  experienceLedger: z.array(ledger),
  rollHistory: z.array(roll),
  sessionNotes: z.string(),
});

export type W20Character = z.infer<typeof w20CharacterSchema>;
export type W20RatedTrait = z.infer<typeof rated>;
export const w20DefaultLayout = {
  build: [...defaultW20Order],
  play: [
    'resources',
    'conditions',
    'traits',
    'gifts',
    'possessions',
    'renown',
    'society',
    'advantages',
    'character',
    'advancement',
    'records',
  ],
};
export function migrateW20Character(data: unknown): W20Character {
  const parsed = w20CharacterSchema.safeParse(data);
  if (parsed.success) return parsed.data;
  throw new Error('This Werewolf 20 character cannot be migrated safely.');
}
