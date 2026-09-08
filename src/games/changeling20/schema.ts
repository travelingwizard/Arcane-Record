import { z } from 'zod';
import {
  CHANGELING20_SCHEMA_VERSION,
  changeling20GroupIds,
  defaultChangeling20Order,
} from './definitions';

const uuid = z.string().uuid();
const rating = z.number().int().min(0).max(10);
const sourceRecord = z.object({
  definitionId: z.string().nullable(),
  sourceId: z.string(),
  page: z.number().int().positive().nullable(),
  custom: z.boolean(),
});
const ratedTrait = sourceRecord.extend({
  id: uuid,
  kind: z.enum([
    'attribute',
    'ability',
    'background',
    'art',
    'realm',
    'merit',
    'flaw',
    'power',
  ]),
  name: z.string(),
  category: z.string(),
  rating,
  cost: z.number().int(),
  specialty: z.string(),
  notes: z.string(),
  origin: z.enum(['creator', 'manual', 'advancement', 'import']),
});
const namedRecord = sourceRecord.extend({
  id: uuid,
  name: z.string(),
  category: z.string(),
  rating,
  state: z.string(),
  notes: z.string(),
});
const damageRecord = z.object({
  id: uuid,
  track: z.enum(['real', 'chimerical']),
  type: z.enum(['bashing', 'lethal', 'aggravated', 'chimerical']),
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
const approval = z.object({
  id: uuid,
  ruleId: z.string(),
  reason: z.string(),
  approvedAt: z.string().datetime(),
});
const ledgerEntry = z.object({
  id: uuid,
  date: z.string(),
  kind: z.enum(['award', 'purchase', 'refund', 'adjustment', 'story']),
  amount: z.number().int(),
  targetKind: z
    .enum(['attribute', 'ability', 'art', 'realm', 'willpower', 'glamour'])
    .nullable(),
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
  .array(z.enum(changeling20GroupIds as [string, ...string[]]))
  .length(changeling20GroupIds.length)
  .refine((value) => new Set(value).size === value.length);

export const changeling20CharacterSchema = z.object({
  schemaVersion: z.literal(CHANGELING20_SCHEMA_VERSION),
  name: z.string(),
  player: z.string(),
  chronicle: z.string(),
  concept: z.string(),
  mortalIdentity: z.string(),
  faeMien: z.string(),
  seeming: z.enum(['childling', 'wilder', 'grump']),
  profile: z.enum([
    'kithain',
    'other-kith',
    'nunnehi',
    'menehune',
    'hsien',
    'inanimae',
    'adhene',
    'kinain',
    'enchanted',
    'dauntain',
    'thallain',
  ]),
  kithId: z.string().nullable(),
  court: z.enum(['seelie', 'unseelie', 'none']),
  seelieLegacyId: z.string().nullable(),
  unseelieLegacyId: z.string().nullable(),
  houseId: z.string().nullable(),
  motley: z.string(),
  thresholdId: z.string().nullable(),
  antithesis: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({ build: order, play: order }),
  enabledSources: z.array(z.string()),
  showUnavailableSources: z.boolean(),
  creation: z.object({
    status: z.enum(['draft', 'manual', 'finalized']),
    step: z.number().int().min(1).max(10),
    attributePriorities: z
      .array(z.enum(['physical', 'social', 'mental']))
      .length(3),
    abilityPriorities: z
      .array(z.enum(['talents', 'skills', 'knowledges']))
      .length(3),
    freebieSpent: z.number().int().nonnegative(),
    flawCredit: z.number().int().nonnegative(),
    matureContent: z.boolean(),
    approvals: z.array(approval),
    finalizedAt: z.string().datetime().nullable(),
    baseline: z.unknown().nullable(),
    rebuildDraft: z.unknown().nullable(),
  }),
  attributes: z.array(ratedTrait),
  abilities: z.array(ratedTrait),
  backgrounds: z.array(ratedTrait),
  arts: z.array(ratedTrait),
  realms: z.array(ratedTrait),
  merits: z.array(ratedTrait),
  flaws: z.array(ratedTrait),
  birthrights: z.array(namedRecord),
  frailties: z.array(namedRecord),
  alternatePowers: z.array(namedRecord),
  tempers: z.object({
    willpower: z.object({ permanent: rating, current: rating }),
    glamour: z.object({ permanent: rating, current: rating }),
    banality: z.object({ permanent: rating, current: rating }),
    nightmare: z.object({ permanent: rating, current: rating }),
  }),
  damage: z.array(damageRecord),
  society: z.array(namedRecord),
  possessions: z.array(namedRecord),
  combat: z.array(namedRecord),
  cantripNotes: z.string(),
  temporaryEffects: z.string(),
  history: z.string(),
  motivations: z.string(),
  goals: z.string(),
  notes: z.string(),
  experienceLedger: z.array(ledgerEntry),
  sessionNotes: z.string(),
});

export type Changeling20Character = z.infer<typeof changeling20CharacterSchema>;
export type C20RatedTrait = z.infer<typeof ratedTrait>;

export const changeling20DefaultLayout = {
  build: [...defaultChangeling20Order],
  play: [
    'conditions',
    'magic',
    'combat',
    'traits',
    'advantages',
    'possessions',
    'society',
    'character',
    'advancement',
    'records',
  ],
};

export function migrateChangeling20Character(
  data: unknown,
): Changeling20Character {
  const parsed = changeling20CharacterSchema.safeParse(data);
  if (parsed.success) return parsed.data;
  throw new Error('This Changeling character cannot be migrated safely.');
}
