import { z } from 'zod';
import {
  BITD_SCHEMA_VERSION,
  characterGroupIds,
  crewGroupIds,
} from './definitions';

const uuid = z.string().uuid();
const cited = z.object({
  definitionId: z.string().nullable(),
  name: z.string(),
  sourceId: z.string(),
  page: z.number().int().positive().nullable(),
  notes: z.string(),
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
const roll = z.object({
  id: uuid,
  kind: z.enum([
    'action',
    'resistance',
    'fortune',
    'engagement',
    'downtime',
    'healing',
    'cohort',
    'incarceration',
    'faction',
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
  createdAt: z.string().datetime(),
});
const layout = (ids: readonly string[]) =>
  z
    .array(z.enum(ids as [string, ...string[]]))
    .length(ids.length)
    .refine((x) => new Set(x).size === x.length);
const creation = z.object({
  status: z.enum(['draft', 'manual', 'finalized']),
  step: z.number().int().min(1).max(7),
  approvals: z.array(approval),
  baseline: z.unknown().nullable(),
  rebuildDraft: z.unknown().nullable(),
  finalizedAt: z.string().datetime().nullable(),
});
const crewLink = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({
    kind: z.literal('linked'),
    crewId: z.string(),
    snapshot: z.object({
      crewId: z.string(),
      name: z.string(),
      revision: z.number().int().nonnegative(),
      capturedAt: z.string().datetime(),
    }),
  }),
]);

export const bitdCharacterSchema = z.object({
  schemaVersion: z.literal(BITD_SCHEMA_VERSION),
  name: z.string(),
  player: z.string(),
  alias: z.string(),
  look: z.string(),
  heritageId: z.string(),
  backgroundId: z.string(),
  playbookId: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({
    build: layout(characterGroupIds),
    play: layout(characterGroupIds),
  }),
  enabledSources: z.array(z.string()),
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
  coin: z.number().int().min(0).max(4),
  stash: z.number().int().min(0).max(40),
  score: z.object({
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
  retirement: z.string(),
  rollHistory: z.array(roll),
  history: z.array(history),
  notes: z.string(),
  crew: crewLink,
});
export type BitdCharacter = z.infer<typeof bitdCharacterSchema>;

const score = z.object({
  id: uuid,
  type: z.string(),
  target: z.string(),
  location: z.string(),
  payoff: z.number().int().nonnegative(),
  rep: z.number().int(),
  heat: z.number().int(),
  entanglement: z.string(),
  factionChanges: z.string(),
  status: z.enum(['planned', 'active', 'resolved']),
  notes: z.string(),
  createdAt: z.string().datetime(),
});
export const bitdCrewSchema = z.object({
  schemaVersion: z.literal(BITD_SCHEMA_VERSION),
  name: z.string(),
  gm: z.string(),
  typeId: z.string(),
  reputationId: z.string(),
  lair: z.string(),
  huntingGrounds: z.string(),
  mode: z.enum(['build', 'play']),
  layout: z.object({ build: layout(crewGroupIds), play: layout(crewGroupIds) }),
  enabledSources: z.array(z.string()),
  showUnavailableSources: z.boolean(),
  gmToolsEnabled: z.boolean(),
  revision: z.number().int().nonnegative(),
  creation,
  abilities: z.array(cited),
  upgrades: z.array(cited),
  favoriteContact: z.string(),
  contacts: z.array(cited),
  cohorts: z.array(
    cited.extend({
      kind: z.enum(['gang', 'expert']),
      quality: z.number().int().min(0).max(6),
      scale: z.number().int().min(0).max(6),
      edges: z.array(z.string()),
      flaws: z.array(z.string()),
      harm: z.number().int().min(0).max(4),
    }),
  ),
  claims: z.array(cited),
  factions: z.array(
    z.object({
      id: uuid,
      name: z.string(),
      status: z.number().int().min(-3).max(3),
      atWar: z.boolean(),
      notes: z.string(),
    }),
  ),
  tier: z.number().int().min(0).max(6),
  hold: z.enum(['weak', 'strong']),
  rep: z.number().int().min(0).max(12),
  turf: z.number().int().min(0).max(12),
  heat: z.number().int().min(0).max(9),
  wanted: z.number().int().min(0).max(4),
  coin: z.number().int().min(0).max(4),
  vaults: z.number().int().min(0).max(4),
  war: z.boolean(),
  incarceration: z.array(history),
  scores: z.array(score),
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
  history: z.array(history),
  gmSavedPrompts: z.array(history),
  rollHistory: z.array(roll),
  notes: z.string(),
});
export type BitdCrew = z.infer<typeof bitdCrewSchema>;

export const migrateBitdCharacter = (data: unknown) =>
  bitdCharacterSchema.parse(data);
export const migrateBitdCrew = (data: unknown) => bitdCrewSchema.parse(data);
