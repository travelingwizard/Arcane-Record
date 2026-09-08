import { z } from 'zod';
import {
  MM_SCHEMA_VERSION,
  characterGroupIds,
  campaignGroupIds,
} from './definitions';
const uuid = z.string().uuid();
const rating = z.object({
  numerator: z.number().int().min(0).max(19),
  die: z.enum(['6', '8', '10', '12', '20']),
});
const history = z.object({
  id: uuid,
  kind: z.string(),
  title: z.string(),
  description: z.string(),
  createdAt: z.string().datetime(),
});
const roll = z.object({
  id: uuid,
  label: z.string(),
  method: z.enum(['rolled', 'manual']),
  dice: z.array(z.number().int().positive()),
  modifier: z.number().int(),
  total: z.number().int(),
  resultId: z.string(),
  createdAt: z.string().datetime(),
});
const cited = z.object({
  id: uuid,
  definitionId: z.string().nullable(),
  name: z.string(),
  rating: rating.nullable(),
  sourceId: z.string(),
  page: z.number().int().positive().nullable(),
  notes: z.string(),
});
const layout = (ids: readonly string[]) =>
  z
    .array(z.enum(ids as [string, ...string[]]))
    .length(ids.length)
    .refine((x) => new Set(x).size === x.length);
const creation = z.object({
  status: z.enum(['draft', 'manual', 'finalized']),
  step: z.number().int().min(1).max(12),
  startingLevel: z.number().int().min(1).max(20),
  approvals: z.array(history),
  baseline: z.unknown().nullable(),
  rebuildDraft: z.unknown().nullable(),
  finalizedAt: z.string().datetime().nullable(),
});
const campaignLink = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({
    kind: z.literal('linked'),
    campaignId: z.string(),
    snapshot: z.object({
      campaignId: z.string(),
      name: z.string(),
      revision: z.number().int().nonnegative(),
      capturedAt: z.string().datetime(),
    }),
  }),
]);
export const mmCharacterSchema = z.object({
  schemaVersion: z.literal(MM_SCHEMA_VERSION),
  name: z.string(),
  player: z.string(),
  pronouns: z.string(),
  appearance: z.string(),
  experiences: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({
    build: layout(characterGroupIds),
    play: layout(characterGroupIds),
  }),
  enabledSources: z.array(z.string()),
  creation,
  birth: z.object({
    quality: z.string(),
    incomeSource: z.string(),
    incomeRoll: z.number().int(),
    property: z.string(),
    lifestyle: z.string(),
    dependents: z.array(cited),
    debts: z.string(),
    wealth: rating,
    obligations: z.number().int().nonnegative(),
    assets: z.number().int().nonnegative(),
    station: z.string(),
  }),
  abilities: z.record(z.string(), z.number().int().min(0).max(19)),
  skills: z.array(cited),
  mentalities: z.array(cited),
  languages: z.array(
    cited.extend({ native: z.boolean(), literate: z.boolean() }),
  ),
  lifepaths: z.array(
    cited.extend({
      level: z.number().int().min(1).max(20),
      completedConditions: z.array(z.string()),
    }),
  ),
  age: z.number().int().nonnegative(),
  reputation: z.number().int(),
  precedence: z.number().int().min(0).max(10),
  fortune: z.number().int().nonnegative(),
  mortalCoil: z.number().int().nonnegative(),
  will: z.number().int().nonnegative(),
  hitPoints: z.object({ current: z.number().int(), maximum: z.number().int() }),
  defense: z.number().int(),
  dodge: z.number().int(),
  morale: z.number().int(),
  saves: z.object({
    terror: z.number().int(),
    poison: z.number().int(),
    magic: z.number().int(),
    fortune: z.number().int(),
  }),
  virtues: z.array(cited),
  flaws: z.array(cited),
  gnosis: z.number().int().nonnegative(),
  practices: z.array(cited),
  grimoires: z.array(cited),
  spells: z.array(cited),
  equipment: z.array(
    cited.extend({
      quantity: z.number().int().nonnegative(),
      state: z.enum(['carried', 'stored', 'spent', 'lost', 'broken']),
    }),
  ),
  wounds: z.array(cited),
  advancement: z.array(history),
  rollHistory: z.array(roll),
  history: z.array(history),
  notes: z.string(),
  campaign: campaignLink,
});
export type MmCharacter = z.infer<typeof mmCharacterSchema>;
export const mmCampaignSchema = z.object({
  schemaVersion: z.literal(MM_SCHEMA_VERSION),
  name: z.string(),
  gm: z.string(),
  year: z.number().int(),
  location: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({
    build: layout(campaignGroupIds),
    play: layout(campaignGroupIds),
  }),
  enabledSources: z.array(z.string()),
  revision: z.number().int().nonnegative(),
  motif: z.object({
    name: z.string(),
    purpose: z.string(),
    values: z.string(),
  }),
  protagonists: z.array(
    z.object({
      id: uuid,
      characterId: z.string().nullable(),
      name: z.string(),
      lifeExpectancy: z.number().int().nullable(),
      notes: z.string(),
    }),
  ),
  moments: z.array(history),
  plots: z.array(history),
  factions: z.array(
    cited.extend({ status: z.number().int().min(-5).max(5), goal: z.string() }),
  ),
  favor: z.array(cited),
  patrons: z.array(cited),
  history: z.array(history),
  notes: z.string(),
});
export type MmCampaign = z.infer<typeof mmCampaignSchema>;
export const migrateMmCharacter = (x: unknown) => mmCharacterSchema.parse(x);
export const migrateMmCampaign = (x: unknown) => mmCampaignSchema.parse(x);
