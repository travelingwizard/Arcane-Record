import { z } from 'zod';
import {
  MOUSE_GUARD_PATROL_SCHEMA_VERSION,
  MOUSE_GUARD_SCHEMA_VERSION,
  mouseGuardGroupIds,
} from './definitions';

const uuid = z.string().uuid();
const mark = z.object({
  pass: z.number().int().nonnegative(),
  fail: z.number().int().nonnegative(),
});
const rated = z.object({
  id: uuid,
  definitionId: z.string().nullable(),
  name: z.string(),
  rating: z.number().int().min(0).max(6),
  marks: mark,
  notes: z.string(),
  sourceId: z.string(),
  page: z.number().int().positive().nullable(),
  origin: z.enum(['rank', 'recruitment', 'manual', 'advancement', 'import']),
});
const named = z.object({
  id: uuid,
  definitionId: z.string().nullable(),
  name: z.string(),
  notes: z.string(),
  sourceId: z.string(),
  page: z.number().int().positive().nullable(),
  origin: z.enum(['rank', 'recruitment', 'manual', 'advancement', 'import']),
});
const relationship = z.object({
  id: uuid,
  kind: z.enum([
    'parent',
    'senior-artisan',
    'mentor',
    'friend',
    'enemy',
    'ally',
    'other',
  ]),
  name: z.string(),
  trade: z.string(),
  status: z.string(),
  notes: z.string(),
});
const gear = named.extend({
  quantity: z.number().int().min(0),
  state: z.enum(['ready', 'used', 'damaged', 'lost']),
  equipped: z.boolean(),
});
const roll = z.object({
  id: uuid,
  kind: z.enum(['independent', 'versus', 'conflict']),
  ability: z.string(),
  pool: z.number().int().min(0).max(100),
  obstacle: z.number().int().min(0).max(100),
  dice: z.array(z.number().int().min(1).max(6)),
  successes: z.number().int().nonnegative(),
  margin: z.number().int(),
  outcome: z.enum(['success', 'failure', 'tie']),
  marked: z.enum(['pass', 'fail', 'none']),
  context: z.string(),
  createdAt: z.string().datetime(),
});
const history = z.object({
  id: uuid,
  kind: z.string(),
  title: z.string(),
  description: z.string(),
  createdAt: z.string().datetime(),
});
const override = z.object({
  id: uuid,
  ruleId: z.string(),
  reason: z.string(),
  approvedAt: z.string().datetime(),
});
const order = z
  .array(z.enum(mouseGuardGroupIds as [string, ...string[]]))
  .length(mouseGuardGroupIds.length)
  .refine((x) => new Set(x).size === x.length);
const patrolSnapshot = z.object({
  patrolId: z.string(),
  name: z.string(),
  revision: z.number().int().nonnegative(),
  capturedAt: z.string().datetime(),
});

export const mouseGuardCharacterSchema = z.object({
  schemaVersion: z.literal(MOUSE_GUARD_SCHEMA_VERSION),
  name: z.string(),
  player: z.string(),
  chronicle: z.string(),
  concept: z.string(),
  rankId: z.enum([
    'tenderpaw',
    'guardmouse',
    'patrol-guard',
    'patrol-leader',
    'guard-captain',
  ]),
  age: z.number().int().min(0).max(100),
  birthYear: z.number().int().nullable(),
  homeId: z.string(),
  furColor: z.string(),
  description: z.string(),
  cloakColor: z.string(),
  belief: z.string(),
  goal: z.string(),
  instinct: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({ build: order, play: order }),
  enabledSources: z.array(z.string()),
  showUnavailableSources: z.boolean(),
  creation: z.object({
    status: z.enum(['draft', 'template', 'manual', 'finalized']),
    method: z.enum(['recruitment', 'template', 'manual']),
    step: z.number().int().min(1).max(21),
    natureAnswers: z.array(z.string()).length(3),
    gmOverrides: z.array(override),
    finalizedAt: z.string().datetime().nullable(),
    baseline: z.unknown().nullable(),
    rebuildDraft: z.unknown().nullable(),
  }),
  will: rated,
  health: rated,
  nature: rated.extend({
    maximum: z.number().int().min(0).max(7),
    tax: z.number().int().min(0).max(7),
    descriptors: z.array(z.string()),
  }),
  resources: rated,
  circles: rated,
  skills: z.array(rated),
  wises: z.array(named.extend({ used: z.boolean() })),
  traits: z.array(
    named.extend({
      level: z.number().int().min(1).max(3),
      uses: z.number().int().nonnegative(),
      checks: z.number().int().nonnegative(),
    }),
  ),
  relationships: z.array(relationship),
  gear: z.array(gear),
  conditions: z.record(z.string(), z.boolean()),
  checks: z.number().int().nonnegative(),
  fate: z.object({
    current: z.number().int().nonnegative(),
    earned: z.number().int().nonnegative(),
    spent: z.number().int().nonnegative(),
  }),
  persona: z.object({
    current: z.number().int().nonnegative(),
    earned: z.number().int().nonnegative(),
    spent: z.number().int().nonnegative(),
  }),
  mission: z.object({
    title: z.string(),
    patrolGoal: z.string(),
    notes: z.string(),
    tests: z.array(z.string()),
  }),
  conflict: z.object({
    active: z.boolean(),
    type: z.string(),
    goal: z.string(),
    captain: z.string(),
    participants: z.array(z.string()),
    maximumDisposition: z.number().int().nonnegative(),
    currentDisposition: z.number().int().nonnegative(),
    actions: z.array(z.string()),
    result: z.string(),
    compromise: z.string(),
  }),
  rollHistory: z.array(roll),
  advancementHistory: z.array(history),
  sessionNotes: z.string(),
  patrol: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('none') }),
    z.object({
      kind: z.literal('linked'),
      patrolId: z.string(),
      snapshot: patrolSnapshot,
    }),
  ]),
});
export type MouseGuardCharacter = z.infer<typeof mouseGuardCharacterSchema>;
export type MouseGuardRated = z.infer<typeof rated>;
export const mouseGuardPatrolSchema = z.object({
  schemaVersion: z.literal(MOUSE_GUARD_PATROL_SCHEMA_VERSION),
  name: z.string(),
  gm: z.string(),
  year: z.number().int(),
  season: z.string(),
  location: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({ build: z.array(z.string()), play: z.array(z.string()) }),
  enabledSources: z.array(z.string()),
  revision: z.number().int().nonnegative(),
  members: z.array(
    z.object({
      id: uuid,
      characterId: z.string().nullable(),
      name: z.string(),
      rank: z.string(),
      specialty: z.string(),
      belief: z.string(),
      goal: z.string(),
      instinct: z.string(),
      conditions: z.array(z.string()),
    }),
  ),
  mission: z.object({
    title: z.string(),
    goal: z.string(),
    obstacles: z.array(z.string()),
    turns: z.number().int().nonnegative(),
    notes: z.string(),
  }),
  rewards: z.array(
    z.object({
      id: uuid,
      characterName: z.string(),
      category: z.string(),
      nomination: z.string(),
      fate: z.number().int().nonnegative(),
      persona: z.number().int().nonnegative(),
      awarded: z.boolean(),
    }),
  ),
  allies: z.array(z.string()),
  enemies: z.array(z.string()),
  settlements: z.array(z.string()),
  history: z.array(history),
  notes: z.string(),
});
export type MouseGuardPatrol = z.infer<typeof mouseGuardPatrolSchema>;
export const migrateMouseGuardCharacter = (x: unknown) =>
  mouseGuardCharacterSchema.parse(x);
export const migrateMouseGuardPatrol = (x: unknown) =>
  mouseGuardPatrolSchema.parse(x);
