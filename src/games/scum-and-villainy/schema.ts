import { z } from 'zod';
import {
  SANDV_SCHEMA_VERSION,
  characterGroupIds,
  shipGroupIds,
} from './definitions';
const uuid = z.string().uuid(),
  dt = z.string().datetime(),
  layout = (ids: readonly string[]) =>
    z
      .array(z.enum(ids as [string, ...string[]]))
      .length(ids.length)
      .refine((x) => new Set(x).size === x.length);
const cited = z.object({
  id: uuid,
  definitionId: z.string().nullable(),
  name: z.string(),
  sourceId: z.string(),
  page: z.number().int().positive().nullable(),
  notes: z.string(),
  custom: z.boolean(),
});
const history = z.object({
  id: uuid,
  kind: z.string(),
  title: z.string(),
  description: z.string(),
  createdAt: dt,
});
const roll = z.object({
  id: uuid,
  kind: z.enum([
    'action',
    'resistance',
    'fortune',
    'engagement',
    'downtime',
    'acquire-asset',
    'recover',
    'ship',
    'gambit',
  ]),
  pool: z.number().int(),
  dice: z.array(z.number().int().min(1).max(6)),
  kept: z.array(z.number().int().min(1).max(6)),
  highest: z.number().int().min(1).max(6),
  outcome: z.enum(['critical', 'full', 'partial', 'bad']),
  position: z.enum(['controlled', 'risky', 'desperate']).nullable(),
  effect: z
    .enum(['zero', 'limited', 'standard', 'great', 'extreme'])
    .nullable(),
  stressCost: z.number().int().nonnegative().nullable(),
  context: z.string(),
  consequence: z.string(),
  createdAt: dt,
});
const creation = z.object({
  status: z.enum(['draft', 'manual', 'finalized']),
  step: z.number().int().min(1).max(8),
  approvals: z.array(
    z.object({
      id: uuid,
      ruleId: z.string(),
      reason: z.string(),
      approvedAt: dt,
    }),
  ),
  baseline: z.unknown().nullable(),
  rebuildDraft: z.unknown().nullable(),
  finalizedAt: dt.nullable(),
});
const shipLink = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({
    kind: z.literal('linked'),
    shipId: z.string(),
    snapshot: z.object({
      shipId: z.string(),
      name: z.string(),
      revision: z.number().int().nonnegative(),
      capturedAt: dt,
    }),
  }),
]);
export const sandvCharacterSchema = z.object({
  schemaVersion: z.literal(SANDV_SCHEMA_VERSION),
  name: z.string(),
  player: z.string(),
  alias: z.string(),
  pronouns: z.string(),
  look: z.string(),
  heritageId: z.string(),
  backgroundId: z.string(),
  playbookId: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({
    build: layout(characterGroupIds),
    play: layout(characterGroupIds),
  }),
  creation,
  actions: z.array(
    cited.extend({
      rating: z.number().int().min(0).max(4),
      xp: z.number().int().min(0).max(6),
    }),
  ),
  abilities: z.array(cited),
  vice: z.object({
    typeId: z.string(),
    purveyor: z.string(),
    notes: z.string(),
  }),
  friend: z.string(),
  rival: z.string(),
  stress: z.number().int().min(0).max(9),
  trauma: z.array(z.string()).max(4),
  harm: z.array(
    z.object({
      id: uuid,
      level: z.number().int().min(1).max(3),
      description: z.string(),
      treated: z.boolean(),
    }),
  ),
  healing: z.number().int().min(0).max(4),
  armor: z.object({
    normal: z.boolean(),
    heavy: z.boolean(),
    special: z.boolean(),
  }),
  load: z.enum(['light', 'normal', 'heavy']),
  items: z.array(
    cited.extend({
      load: z.number().int().min(0).max(2),
      state: z.enum(['available', 'carried', 'spent', 'lost']),
    }),
  ),
  cred: z.number().int().min(0).max(4),
  stash: z.number().int().min(0).max(40),
  job: z.object({
    plan: z.string(),
    detail: z.string(),
    target: z.string(),
    position: z.string(),
    effect: z.string(),
    notes: z.string(),
  }),
  downtime: z.array(history),
  projects: z.array(cited.extend({ clock: z.number().int().min(0).max(12) })),
  xp: z.object({
    playbook: z.number().int().nonnegative(),
    insight: z.number().int().nonnegative(),
    prowess: z.number().int().nonnegative(),
    resolve: z.number().int().nonnegative(),
  }),
  rollHistory: z.array(roll),
  history: z.array(history),
  notes: z.string(),
  totalExperience: z.number().int().nonnegative(),
  currentExperience: z.number().int().nonnegative(),
  ship: shipLink,
});
export type SandvCharacter = z.infer<typeof sandvCharacterSchema>;
export const sandvShipSchema = z.object({
  schemaVersion: z.literal(SANDV_SCHEMA_VERSION),
  name: z.string(),
  gm: z.string(),
  typeId: z.string(),
  callsign: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({ build: layout(shipGroupIds), play: layout(shipGroupIds) }),
  creation,
  revision: z.number().int().nonnegative(),
  crew: z.array(
    z.object({
      id: uuid,
      characterId: z.string().nullable(),
      name: z.string(),
      playbookId: z.string(),
      status: z.enum(['active', 'retired', 'missing', 'dead']),
      notes: z.string(),
    }),
  ),
  systems: z.record(
    z.enum(['comms', 'engines', 'hull', 'weapons']),
    z.object({
      rating: z.number().int().min(0).max(6),
      damage: z.number().int().min(0).max(4),
    }),
  ),
  abilities: z.array(cited),
  upgrades: z.array(
    cited.extend({ active: z.boolean(), damaged: z.boolean() }),
  ),
  gambits: z.object({
    current: z.number().int().min(0).max(12),
    maximum: z.number().int().min(0).max(12),
  }),
  cred: z.number().int().min(0).max(8),
  debt: z.number().int().min(0).max(8),
  heat: z.number().int().min(0).max(9),
  wanted: z.number().int().min(0).max(4),
  crewXp: z.number().int().nonnegative(),
  jobs: z.array(
    z.object({
      id: uuid,
      name: z.string(),
      client: z.string(),
      target: z.string(),
      plan: z.string(),
      payoff: z.number().int(),
      heat: z.number().int(),
      status: z.enum(['offered', 'active', 'resolved', 'failed']),
      notes: z.string(),
      createdAt: dt,
    }),
  ),
  factions: z.array(
    z.object({
      id: uuid,
      definitionId: z.string().nullable(),
      name: z.string(),
      tier: z.number().int().min(0).max(6),
      status: z.number().int().min(-3).max(3),
      atWar: z.boolean(),
      notes: z.string(),
    }),
  ),
  downtime: z.array(history),
  clocks: z.array(
    z.object({
      id: uuid,
      name: z.string(),
      segments: z.number().int().min(2).max(24),
      filled: z.number().int().nonnegative(),
      notes: z.string(),
    }),
  ),
  rollHistory: z.array(roll),
  history: z.array(history),
  notes: z.string(),
});
export type SandvShip = z.infer<typeof sandvShipSchema>;
export const migrateSandvCharacter = (x: unknown) =>
    sandvCharacterSchema.parse(x),
  migrateSandvShip = (x: unknown) => sandvShipSchema.parse(x);
