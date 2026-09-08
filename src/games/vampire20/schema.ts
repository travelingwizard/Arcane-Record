import { z } from 'zod';
import {
  V20_SCHEMA_VERSION,
  v20GroupIds,
  defaultV20Order,
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
    'discipline',
    'virtue',
    'merit',
    'flaw',
    'path',
    'ritual',
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
const roll = z.object({
  id: uuid,
  kind: z.enum(['starting-blood', 'maturation']),
  method: z.enum(['rolled', 'manual']),
  dice: z.array(z.number().int().min(1).max(10)),
  modifier: z.number().int(),
  total: z.number().int(),
  resultId: z.string().nullable(),
  createdAt: z.string().datetime(),
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
    'torpor',
    'final-death',
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
const order = z
  .array(z.enum(v20GroupIds as [string, ...string[]]))
  .length(v20GroupIds.length)
  .refine((ids) => new Set(ids).size === ids.length);

export const v20CharacterSchema = z.object({
  schemaVersion: z.literal(V20_SCHEMA_VERSION),
  characterType: z.enum(['vampire', 'ghoul', 'revenant']),
  ghoulType: z.enum(['vassal', 'independent']).nullable(),
  revenantFamilyId: z.string().nullable(),
  domitor: z.object({
    name: z.string(),
    clanId: z.string().nullable(),
    generation: z.number().int().min(4).max(16).nullable(),
    bondLevel: z.number().int().min(0).max(3),
    notes: z.string(),
  }),
  name: z.string(),
  player: z.string(),
  chronicle: z.string(),
  natureId: z.string().nullable(),
  demeanorId: z.string().nullable(),
  concept: z.string(),
  lineageId: z.string().nullable(),
  sire: z.string(),
  mortalLife: z.string(),
  embrace: z.string(),
  currentUnlife: z.string(),
  age: z.string(),
  apparentAge: z.string(),
  birthDate: z.string(),
  deathDate: z.string(),
  gender: z.string(),
  nationality: z.string(),
  description: z.string(),
  goals: z.string(),
  history: z.string(),
  notes: z.string(),
  roadId: z.string().nullable(),
  roadRating: rating,
  aura: z.string(),
  clanWeakness: z.string(),
  generation: z.number().int().min(4).max(13),
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
    rolls: z.array(roll),
    finalizedAt: z.string().datetime().nullable(),
    baseline: z.unknown().nullable(),
    rebuildDraft: z.unknown().nullable(),
  }),
  attributes: z.array(rated),
  abilities: z.array(rated),
  backgrounds: z.array(rated),
  disciplines: z.array(rated),
  virtues: z.array(rated),
  merits: z.array(rated),
  flaws: z.array(rated),
  paths: z.array(rated),
  rituals: z.array(rated),
  otherTraits: z.array(rated),
  willpower: z.object({ permanent: rating, current: rating }),
  blood: z.object({ current: rating, maximum: rating, perTurn: rating }),
  health: z.array(damage),
  states: z.object({
    frenzy: z.boolean(),
    rotschreck: z.boolean(),
    torpor: z.boolean(),
    finalDeath: z.boolean(),
    temporaryEffects: z.string(),
  }),
  derangements: z.array(record),
  coterie: z.object({
    name: z.string(),
    anchorBackgroundId: z.string().nullable(),
    members: z.array(record),
    relationships: z.array(record),
    pooledBackgrounds: z.array(record),
    notes: z.string(),
  }),
  society: z.object({
    titles: z.array(record),
    boons: z.array(record),
    relationships: z.array(record),
    organizations: z.array(record),
    technologyComplications: z.array(record),
  }),
  possessions: z.array(record),
  weapons: z.array(record),
  armor: z.array(record),
  haven: z.object({
    location: z.string(),
    description: z.string(),
    feedingGrounds: z.string(),
  }),
  experienceLedger: z.array(ledger),
  maturation: z.object({
    enabled: z.boolean(),
    years: z.number().int().nonnegative(),
    grantedExperience: z.number().int().nonnegative(),
    notes: z.string(),
    completedAt: z.string().datetime().nullable(),
  }),
  sessionNotes: z.string(),
});

export type V20Character = z.infer<typeof v20CharacterSchema>;
export type V20RatedTrait = z.infer<typeof rated>;
export const v20DefaultLayout = {
  build: [...defaultV20Order],
  play: [
    'conditions',
    'disciplines',
    'combat',
    'roads',
    'traits',
    'advantages',
    'possessions',
    'society',
    'character',
    'advancement',
    'records',
  ],
};
export function migrateV20Character(data: unknown): V20Character {
  const parsed = v20CharacterSchema.safeParse(data);
  if (parsed.success) return parsed.data;
  throw new Error('This Vampire 20 character cannot be migrated safely.');
}
