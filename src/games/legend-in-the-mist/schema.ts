import { z } from 'zod';

export const LEGEND_SYSTEM_ID = 'legend-in-the-mist';
export const LEGEND_FELLOWSHIP_SYSTEM_ID = 'legend-in-the-mist-fellowship';
export const LEGEND_SCHEMA_VERSION = 1;
export const LEGEND_FELLOWSHIP_SCHEMA_VERSION = 1;

const uuid = z.string().uuid();
const citationSchema = z.object({
  definitionId: z.string().nullable(),
  source: z.string(),
  page: z.number().int().nonnegative(),
});

export const legendTagSchema = z.object({
  id: uuid,
  name: z.string(),
  kind: z.enum(['power', 'weakness', 'story']),
  questionId: z.string().nullable(),
  usage: z.enum([
    'permanent',
    'standard',
    'single-use',
    'consumable',
    'fellowship',
  ]),
  scratched: z.boolean(),
  burned: z.boolean(),
  broad: z.boolean(),
  notes: z.string(),
  origin: z.enum(['creator', 'development', 'story', 'manual', 'import']),
  ...citationSchema.shape,
});

const questSchema = z.object({
  text: z.string(),
  kind: z.enum(['wish', 'truth', 'home', 'question', 'custom']),
  plannedMilestones: z.array(z.string()).max(3),
});

const themeImprovementSchema = z.object({
  id: uuid,
  definitionId: z.string().nullable(),
  name: z.string(),
  summary: z.string(),
  usedThisScene: z.boolean(),
  usedThisSession: z.boolean(),
  notes: z.string(),
  source: z.string(),
  page: z.number().int().nonnegative(),
});

export const legendThemeSchema = z.object({
  id: uuid,
  definitionId: z.string().nullable(),
  themebookId: z.string().nullable(),
  kitId: z.string().nullable(),
  creationMethod: z.enum([
    'freeform',
    'trope',
    'themebook',
    'manual',
    'development',
  ]),
  state: z.enum(['nascent', 'standard', 'archived']),
  name: z.string(),
  might: z.enum(['origin', 'adventure', 'greatness']),
  powerTags: z.array(legendTagSchema),
  weaknessTags: z.array(legendTagSchema),
  quest: questSchema,
  improve: z.number().int().min(0).max(5),
  abandon: z.number().int().min(0).max(3),
  milestone: z.number().int().min(0).max(3),
  improvements: z.array(themeImprovementSchema),
  notes: z.string(),
});

export const legendStatusSchema = z
  .object({
    id: uuid,
    name: z.string(),
    markedTiers: z.array(z.number().int().min(1).max(6)).max(6),
    limit: z.number().int().min(1).max(6),
    polarity: z.string(),
    directive: z.string(),
    category: z.enum(['hero', 'scene', 'progress', 'other']),
    duration: z.enum(['scene', 'session', 'ongoing', 'permanent', 'custom']),
    notes: z.string(),
  })
  .superRefine(({ markedTiers }, context) => {
    if (new Set(markedTiers).size !== markedTiers.length)
      context.addIssue({
        code: 'custom',
        path: ['markedTiers'],
        message: 'A status may mark each tier box only once.',
      });
  });

const approvalSchema = z.object({
  id: uuid,
  ruleId: z.string(),
  reason: z.string().min(1),
  approvedAt: z.string().datetime(),
});

export const legendRollSchema = z.object({
  id: uuid,
  kind: z.enum(['quick', 'detailed', 'reaction']),
  context: z.string(),
  dice: z.tuple([
    z.number().int().min(1).max(6),
    z.number().int().min(1).max(6),
  ]),
  helpfulTagIds: z.array(uuid),
  hinderingTagIds: z.array(uuid),
  helpfulStatusIds: z.array(uuid),
  hinderingStatusIds: z.array(uuid),
  burnedTagId: uuid.nullable(),
  mightModifier: z.enum(['-6', '-3', '0', '3', '6']),
  power: z.number().int(),
  total: z.number().int(),
  outcome: z.enum(['success', 'mixed', 'consequences']),
  effectBudget: z.number().int().nonnegative(),
  notes: z.string(),
  createdAt: z.string().datetime(),
});

const relationshipSchema = z.object({
  id: uuid,
  companionName: z.string(),
  tag: z.string(),
  scratched: z.boolean(),
  notes: z.string(),
});

const fulfillmentSchema = z.object({
  id: uuid,
  type: z.enum([
    'journeys-end',
    'reforged',
    'quintessence',
    'foundations-of-magic',
    'words-eternal',
    'lost-truths',
  ]),
  title: z.string(),
  details: z.string(),
  themeId: uuid.nullable(),
  createdAt: z.string().datetime(),
});

const magicPracticeSchema = z.object({
  id: uuid,
  wayId: z.string(),
  themeId: uuid.nullable(),
  enabled: z.boolean(),
  track: z.number().int().min(0).max(6),
  knownItems: z.array(
    z.object({
      id: uuid,
      name: z.string(),
      notes: z.string(),
      prepared: z.boolean(),
      consumed: z.boolean(),
    }),
  ),
  enabledVariants: z.array(z.string()),
  notes: z.string(),
});

const developmentEventSchema = z.object({
  id: uuid,
  type: z.enum([
    'improvement',
    'evolution',
    'expansion',
    'replacement',
    'promise',
    'fulfillment',
    'rebuild',
    'manual',
  ]),
  themeId: uuid.nullable(),
  summary: z.string(),
  before: z.string(),
  after: z.string(),
  notes: z.string(),
  createdAt: z.string().datetime(),
});

const heroLayoutSchema = z.object({
  build: z.array(z.string()),
  play: z.array(z.string()),
});

const fellowshipSnapshotSchema = z.object({
  id: z.string(),
  name: z.string(),
  capturedAt: z.string().datetime(),
  revision: z.string(),
  data: z.unknown(),
});

export const legendHeroSchema = z.object({
  schemaVersion: z.literal(LEGEND_SCHEMA_VERSION),
  name: z.string(),
  player: z.string(),
  pronouns: z.string(),
  description: z.string(),
  notes: z.string(),
  mode: z.enum(['build', 'play']),
  layout: heroLayoutSchema,
  creation: z.object({
    status: z.enum(['draft', 'manual', 'finalized']),
    method: z.enum(['freeform', 'trope', 'themebook', 'mixed']),
    step: z.string(),
    selectedTropeId: z.string().nullable(),
    approvals: z.array(approvalSchema),
    finalizedAt: z.string().datetime().nullable(),
    baselineThemes: z.array(legendThemeSchema),
    rebuildDraft: z
      .object({
        id: uuid,
        createdAt: z.string().datetime(),
        baseThemes: z.array(legendThemeSchema),
        proposedThemes: z.array(legendThemeSchema),
      })
      .nullable(),
  }),
  themes: z.array(legendThemeSchema),
  backpack: z.array(legendTagSchema),
  statuses: z.array(legendStatusSchema),
  relationships: z.array(relationshipSchema),
  fellowship: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('none') }),
    z.object({ kind: z.literal('linked'), fellowshipId: z.string().min(1) }),
  ]),
  fellowshipSnapshot: fellowshipSnapshotSchema.nullable(),
  promise: z.number().int().min(0).max(5),
  quintessences: z.array(
    z.object({
      id: uuid,
      definitionId: z.string().nullable(),
      name: z.string(),
      notes: z.string(),
      uses: z.number().int().nonnegative(),
    }),
  ),
  fulfillments: z.array(fulfillmentSchema),
  magicPractices: z.array(magicPracticeSchema),
  camp: z.object({
    phase: z.enum(['adventure', 'camp', 'sojourn']),
    activitiesRemaining: z.number().int().min(0).max(3),
    notes: z.string(),
  }),
  rolls: z.array(legendRollSchema),
  developmentHistory: z.array(developmentEventSchema),
});

export type LegendHero = z.infer<typeof legendHeroSchema>;
export type LegendTheme = z.infer<typeof legendThemeSchema>;
export type LegendTag = z.infer<typeof legendTagSchema>;
export type LegendStatus = z.infer<typeof legendStatusSchema>;
export type LegendRoll = z.infer<typeof legendRollSchema>;

export const legendFellowshipSchema = z.object({
  schemaVersion: z.literal(LEGEND_FELLOWSHIP_SCHEMA_VERSION),
  name: z.string(),
  concept: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({ build: z.array(z.string()), play: z.array(z.string()) }),
  theme: legendThemeSchema,
  memberIds: z.array(z.string()),
  memberNames: z.array(z.string()),
  specialImprovements: z.array(themeImprovementSchema),
  notes: z.string(),
});

export type LegendFellowship = z.infer<typeof legendFellowshipSchema>;

export function migrateLegendHero(data: unknown, fromVersion: number) {
  if (fromVersion !== LEGEND_SCHEMA_VERSION)
    throw new Error('Unsupported Legend in the Mist Hero version.');
  return legendHeroSchema.parse(data);
}

export function migrateLegendFellowship(data: unknown, fromVersion: number) {
  if (fromVersion !== LEGEND_FELLOWSHIP_SCHEMA_VERSION)
    throw new Error('Unsupported Legend in the Mist Fellowship version.');
  return legendFellowshipSchema.parse(data);
}
