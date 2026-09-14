import { z } from 'zod';
import {
  characterGroupIds,
  DITV_SCHEMA_VERSION,
  townGroupIds,
} from './definitions';

const uuid = z.string().uuid();
export const dicePoolSchema = z.object({
  d4: z.number().int().nonnegative(),
  d6: z.number().int().nonnegative(),
  d8: z.number().int().nonnegative(),
  d10: z.number().int().nonnegative(),
});
export type DicePool = z.infer<typeof dicePoolSchema>;
const layout = (ids: readonly string[]) =>
  z
    .array(z.enum(ids as [string, ...string[]]))
    .length(ids.length)
    .refine((x) => new Set(x).size === x.length);
const cited = z.object({
  sourceId: z.string(),
  page: z.number().int().positive().nullable(),
});
const approval = z.object({
  id: uuid,
  ruleId: z.string(),
  reason: z.string(),
  approvedAt: z.string().datetime(),
});
const history = z.object({
  id: uuid,
  kind: z.string(),
  title: z.string(),
  description: z.string(),
  createdAt: z.string().datetime(),
});
const dieRecord = z.object({
  id: uuid,
  size: z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(10)]),
  value: z.number().int().positive().max(10),
  sourceType: z.enum([
    'stat',
    'trait',
    'relationship',
    'belonging',
    'ceremony',
    'influence',
    'improvised',
    'follow-up',
  ]),
  sourceId: z.string().nullable(),
  state: z.enum(['available', 'spent', 'fallout', 'reserved']),
});
const conflictEvent = z.object({
  id: uuid,
  kind: z.enum([
    'raise',
    'see',
    'escalate',
    'help',
    'give',
    'trait',
    'belonging',
    'ceremony',
    'resolve',
  ]),
  actorId: z.string(),
  affectedIds: z.array(z.string()),
  diceIds: z.array(z.string()),
  narration: z.string(),
  falloutSize: z
    .union([z.literal(4), z.literal(6), z.literal(8), z.literal(10)])
    .nullable(),
  createdAt: z.string().datetime(),
});
export const conflictSchema = z.object({
  id: uuid,
  title: z.string(),
  stakes: z.string(),
  stage: z.string(),
  status: z.enum(['setup', 'active', 'fallout', 'resolved']),
  openingArena: z.enum(['talking', 'physical', 'fighting', 'gunfighting']),
  activeArena: z.enum(['talking', 'physical', 'fighting', 'gunfighting']),
  participants: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      side: z.string(),
      statKeysRolled: z.array(z.enum(['acuity', 'body', 'heart', 'will'])),
      usedTraitIds: z.array(z.string()),
      usedRelationshipIds: z.array(z.string()),
      usedBelongingIds: z.array(z.string()),
      helpedSinceGo: z.boolean(),
      gave: z.boolean(),
      fallout: dicePoolSchema,
    }),
  ),
  activeParticipantId: z.string().nullable(),
  dice: z.array(dieRecord),
  events: z.array(conflictEvent),
  resolution: z.string(),
  followUpDie: dieRecord.nullable(),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
});
export type DitvConflict = z.infer<typeof conflictSchema>;

const ratedRecord = cited.extend({
  id: uuid,
  name: z.string(),
  dice: dicePoolSchema,
  notes: z.string(),
  origin: z.enum([
    'creation',
    'initiation',
    'fallout',
    'reflection',
    'custom',
    'import',
  ]),
  temporaryUntilConflict: z.boolean(),
});
const belonging = ratedRecord.extend({
  kind: z.enum(['coat', 'horse', 'book', 'earth', 'gun', 'other']),
  quality: z.enum([
    'crap',
    'normal',
    'excellent',
    'big',
    'excellent-big',
    'custom',
  ]),
  state: z.enum(['carried', 'ready', 'damaged', 'lost']),
});
const falloutRecord = z.object({
  id: uuid,
  conflictId: z.string(),
  dice: dicePoolSchema,
  results: z.array(z.number().int().min(1).max(10)),
  sum: z.number().int().nonnegative(),
  ones: z.number().int().nonnegative(),
  consequence: z.string(),
  experienceChoice: z.string(),
  applied: z.boolean(),
  createdAt: z.string().datetime(),
});
const townSnapshot = z.object({
  townId: z.string(),
  name: z.string(),
  revision: z.number().int().nonnegative(),
  assignment: z.string(),
  capturedAt: z.string().datetime(),
});
const townLink = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none'), snapshot: townSnapshot.nullable() }),
  z.object({
    kind: z.literal('linked'),
    townId: z.string(),
    snapshot: townSnapshot,
  }),
]);
const creation = z.object({
  status: z.enum(['draft', 'manual', 'finalized']),
  step: z.number().int().min(1).max(6),
  backgroundId: z.string(),
  hopedAccomplishment: z.string(),
  initiationConflictId: z.string().nullable(),
  initiationTraitId: z.string().nullable(),
  approvals: z.array(approval),
  baseline: z.unknown().nullable(),
  rebuildDraft: z.unknown().nullable(),
  finalizedAt: z.string().datetime().nullable(),
});

export const ditvCharacterSchema = z.object({
  schemaVersion: z.literal(DITV_SCHEMA_VERSION),
  name: z.string(),
  player: z.string(),
  pronouns: z.string(),
  background: z.string(),
  homeBranch: z.string(),
  route: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({
    build: layout(characterGroupIds),
    play: layout(characterGroupIds),
  }),
  creation,
  stats: z.object({
    acuity: z.number().int().nonnegative(),
    body: z.number().int().nonnegative(),
    heart: z.number().int().nonnegative(),
    will: z.number().int().nonnegative(),
  }),
  traits: z.array(ratedRecord),
  relationships: z.array(
    ratedRecord.extend({
      kind: z.enum(['person', 'blood', 'institution', 'place', 'sin', 'demon']),
    }),
  ),
  availableRelationshipDice: dicePoolSchema,
  belongings: z.array(belonging),
  coatDescription: z.string(),
  conflicts: z.array(conflictSchema),
  fallout: z.array(falloutRecord),
  temporaryStatPenalties: z.object({
    acuity: z.number().int().nonnegative(),
    body: z.number().int().nonnegative(),
    heart: z.number().int().nonnegative(),
    will: z.number().int().nonnegative(),
  }),
  betweenTowns: z.object({
    reflection: z.string(),
    falloutChoice: z.string(),
    relationshipChoice: z.string(),
    direction: z.string(),
    applied: z.boolean(),
  }),
  retired: z.boolean(),
  deceased: z.boolean(),
  history: z.array(history),
  town: townLink,
  notes: z.string(),
});
export type DitvCharacter = z.infer<typeof ditvCharacterSchema>;

const wrongness = z.object({
  id: uuid,
  label: z.string(),
  pride: z.string(),
  injustice: z.string(),
  sin: z.string(),
  demonicAttacks: z.string(),
  falseDoctrine: z.string(),
  corruptWorship: z.string(),
  falsePriesthood: z.string(),
  sorcery: z.string(),
  hateMurder: z.string(),
});
const npc = z.object({
  id: uuid,
  name: z.string(),
  status: z.enum(['proto', 'assigned', 'retired']),
  kind: z.enum(['ordinary', 'group', 'possessed', 'sorcerer']),
  stats: z.object({
    acuity: z.number().int().nonnegative(),
    body: z.number().int().nonnegative(),
    heart: z.number().int().nonnegative(),
    will: z.number().int().nonnegative(),
  }),
  traits: z.array(ratedRecord),
  relationships: z.array(ratedRecord),
  belongings: z.array(belonging),
  wants: z.string(),
  manifestations: z.array(z.string()),
  powers: z.array(
    z.enum(['cunning', 'ferocity', 'preservation', 'viciousness']),
  ),
  groupSize: z.number().int().positive(),
  notes: z.string(),
});
export type DitvNpc = z.infer<typeof npc>;
export const ditvTownSchema = z.object({
  schemaVersion: z.literal(DITV_SCHEMA_VERSION),
  name: z.string(),
  gm: z.string(),
  assignment: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({ build: layout(townGroupIds), play: layout(townGroupIds) }),
  revision: z.number().int().nonnegative(),
  problems: z.array(wrongness),
  townspeople: z.array(
    z.object({
      id: uuid,
      name: z.string(),
      role: z.string(),
      wants: z.string(),
      npcId: z.string().nullable(),
      notes: z.string(),
    }),
  ),
  demonWants: z.string(),
  demonWantsFromDogs: z.string(),
  withoutDogs: z.string(),
  demonicInfluence: dicePoolSchema,
  npcs: z.array(npc),
  freeDice: dicePoolSchema,
  conflicts: z.array(conflictSchema),
  privateNotes: z.string(),
  history: z.array(history),
  notes: z.string(),
});
export type DitvTown = z.infer<typeof ditvTownSchema>;

export const migrateDitvCharacter = (data: unknown) =>
  ditvCharacterSchema.parse(data);
export const migrateDitvTown = (data: unknown) => ditvTownSchema.parse(data);
