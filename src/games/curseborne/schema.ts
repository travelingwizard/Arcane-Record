import { z } from 'zod';
import { curseRollSchema } from './dice';
import { buildReviewSchema } from '../shared/reviewed-build';
import {
  readSourceDefaults,
  sourceSelectionSchema,
} from '../shared/catalog-sources';
import { curseSources } from './sources';
export const curseAttributes = [
  'Intellect',
  'Cunning',
  'Resolve',
  'Might',
  'Dexterity',
  'Stamina',
  'Presence',
  'Manipulation',
  'Composure',
] as const;
export const curseSkills = [
  'Artistry',
  'Athletics',
  'Close Combat',
  'Culture',
  'Empathy',
  'Enigmas',
  'Esoterica',
  'Larceny',
  'Leadership',
  'Medicine',
  'Persuasion',
  'Pilot',
  'Ranged Combat',
  'Science',
  'Survival',
  'Technology',
] as const;
const entry = z.object({
  definitionId: z.string().nullable().default(null),
  sourceId: z.string().nullable().default(null),
  id: z.string().uuid(),
  kind: z.enum(['edge', 'spell', 'contact', 'equipment', 'bond']),
  name: z.string(),
  rating: z.number().int().nonnegative(),
  notes: z.string(),
  source: z.string(),
  page: z.number().int().nonnegative(),
  active: z.boolean(),
});
const citationFields = {
  definitionId: z.string().nullable().default(null),
  sourceId: z.string().nullable().default(null),
  source: z.string().default('Curseborne'),
  page: z.number().int().nonnegative().default(0),
  legacyEntryId: z.string().uuid().nullable().default(null),
};
const aspirationRecord = z.object({
  id: z.string().uuid(),
  horizon: z.enum(['short', 'long']),
  text: z.string(),
  completed: z.boolean().default(false),
});
const tormentRecord = z.object({
  description: z.string(),
  trigger: z.string(),
});
const connectionRecord = z.object({
  ...citationFields,
  id: z.string().uuid(),
  name: z.string(),
  rating: z.number().int().min(0).max(5),
  tags: z.array(z.string()).default([]),
  notes: z.string(),
  active: z.boolean(),
});
const edgeRecord = z.object({
  ...citationFields,
  id: z.string().uuid(),
  name: z.string(),
  rating: z.number().int().min(0).max(5),
  notes: z.string(),
});
const gearRecord = z.object({
  ...citationFields,
  id: z.string().uuid(),
  name: z.string(),
  tags: z.array(z.string()).max(4),
  state: z.enum(['carried', 'equipped', 'stored', 'lost', 'consumed']),
  notes: z.string(),
});
const spellRecord = z.object({
  ...citationFields,
  id: z.string().uuid(),
  name: z.string(),
  cost: z.string(),
  attunements: z.string(),
  effect: z.string(),
  advances: z.string(),
  state: z.enum(['ready', 'active', 'spent']),
  notes: z.string(),
});
export const curseCharacterSchema = z.object({
  buildReview: buildReviewSchema.default({ draft: null, history: [] }),
  schemaVersion: z.literal(4),
  enabledSources: sourceSelectionSchema(curseSources),
  name: z.string(),
  concept: z.string(),
  lineage: z.enum(['', 'dead', 'hungry', 'outcast', 'primal', 'sorcerer']),
  family: z.string(),
  role: z.string(),
  majorPath: z.enum(['lineage', 'family']),
  attributes: z.record(
    z.enum(curseAttributes),
    z.number().int().min(1).max(10),
  ),
  skills: z.record(z.enum(curseSkills), z.number().int().min(0).max(10)),
  mode: z.enum(['build', 'play']),
  layout: z.object({ build: z.array(z.string()), play: z.array(z.string()) }),
  entanglement: z.number().int().min(1).max(10),
  curseDice: z.number().int().nonnegative(),
  temporaryCurseDice: z.number().int().nonnegative(),
  injuries: z.number().int().min(0).max(7),
  armor: z.number().int().nonnegative(),
  armorSpent: z.number().int().nonnegative(),
  takenOut: z.boolean(),
  conditions: z.string(),
  damnation: z.string(),
  inheritance: z.string(),
  motif: z.string(),
  lineageTorment: z.string(),
  personalTorment: z.string(),
  aspirations: z.string(),
  aspirationRecords: z.array(aspirationRecord).default([]),
  accursedTorment: tormentRecord.default({ description: '', trigger: '' }),
  personalTormentRecord: tormentRecord.default({
    description: '',
    trigger: '',
  }),
  edges: z.array(edgeRecord).default([]),
  contacts: z.array(connectionRecord).default([]),
  bonds: z.array(connectionRecord).default([]),
  gear: z.array(gearRecord).default([]),
  spells: z.array(spellRecord).default([]),
  notes: z.string(),
  entries: z.array(entry),
  experience: z.array(
    z.object({
      id: z.string().uuid(),
      kind: z.enum(['award', 'purchase', 'refund', 'adjustment']),
      amount: z.number().int(),
      date: z.string(),
      description: z.string(),
      target: z
        .object({
          category: z.enum(['attribute', 'skill']),
          id: z.string(),
          previous: z.number().int().nonnegative(),
          next: z.number().int().nonnegative(),
        })
        .optional(),
      refundOf: z.string().uuid().optional(),
    }),
  ),
  rolls: z.array(curseRollSchema).default([]),
  temporaryDiceRisk: z.boolean().default(false),
  resourceHistory: z
    .array(
      z.object({
        id: z.string().uuid(),
        date: z.string(),
        description: z.string(),
      }),
    )
    .default([]),
});
export type CurseCharacter = z.infer<typeof curseCharacterSchema>;
export function migrateCurseCharacter(
  data: unknown,
  fromVersion: number,
): CurseCharacter {
  if (![1, 2, 3, 4].includes(fromVersion))
    throw new Error('Unsupported Curseborne character version.');
  const versioned = z
    .object({ schemaVersion: z.literal(fromVersion) })
    .passthrough()
    .parse(data);
  if (fromVersion === 4) return curseCharacterSchema.parse(versioned);
  const old = versioned as z.infer<typeof curseCharacterSchema> & {
    entries?: z.infer<typeof entry>[];
  };
  const entries = old.entries ?? [];
  const common = (item: z.infer<typeof entry>) => ({
    id: item.id,
    definitionId: item.definitionId,
    sourceId: item.sourceId,
    source: item.source,
    page: item.page,
    legacyEntryId: item.id,
    name: item.name,
  });
  const migrateLayout = (order: string[]) => {
    const result: string[] = [];
    for (const id of order) {
      if (id === 'entries') result.push('connections', 'gear', 'spells');
      else if (!result.includes(id)) result.push(id);
    }
    for (const id of ['connections', 'gear', 'spells'])
      if (!result.includes(id)) result.push(id);
    return result;
  };
  return curseCharacterSchema.parse({
    ...versioned,
    schemaVersion: 4,
    layout: {
      build: migrateLayout(old.layout?.build ?? []),
      play: migrateLayout(old.layout?.play ?? []),
    },
    aspirationRecords: [],
    accursedTorment: { description: old.lineageTorment ?? '', trigger: '' },
    personalTormentRecord: {
      description: old.personalTorment ?? '',
      trigger: '',
    },
    edges: entries
      .filter((v) => v.kind === 'edge')
      .map((v) => ({
        ...common(v),
        rating: v.rating,
        notes: v.notes,
      })),
    contacts: entries
      .filter((v) => v.kind === 'contact')
      .map((v) => ({
        ...common(v),
        rating: v.rating,
        tags: [],
        notes: v.notes,
        active: v.active,
      })),
    bonds: entries
      .filter((v) => v.kind === 'bond')
      .map((v) => ({
        ...common(v),
        rating: v.rating,
        tags: [],
        notes: v.notes,
        active: v.active,
      })),
    gear: entries
      .filter((v) => v.kind === 'equipment')
      .map((v) => ({
        ...common(v),
        tags: [],
        state: v.active ? 'equipped' : 'carried',
        notes: v.notes,
      })),
    spells: entries
      .filter((v) => v.kind === 'spell')
      .map((v) => ({
        ...common(v),
        cost: '',
        attunements: '',
        effect: '',
        advances: '',
        state: v.active ? 'active' : 'ready',
        notes: v.notes,
      })),
  });
}
export function createCurseCharacter(): CurseCharacter {
  return curseCharacterSchema.parse({
    schemaVersion: 4,
    enabledSources: readSourceDefaults('curseborne', curseSources),
    name: '',
    concept: '',
    lineage: '',
    family: '',
    role: '',
    majorPath: 'lineage',
    attributes: Object.fromEntries(curseAttributes.map((id) => [id, 1])),
    skills: Object.fromEntries(curseSkills.map((id) => [id, 0])),
    mode: 'build',
    layout: {
      build: [
        'identity',
        'traits',
        'curse',
        'connections',
        'health',
        'gear',
        'spells',
        'experience',
        'records',
      ],
      play: [
        'health',
        'curse',
        'traits',
        'connections',
        'gear',
        'spells',
        'experience',
        'identity',
        'records',
      ],
    },
    entanglement: 1,
    curseDice: 1,
    temporaryCurseDice: 0,
    injuries: 0,
    armor: 0,
    armorSpent: 0,
    takenOut: false,
    conditions: '',
    damnation: '',
    inheritance: '',
    motif: '',
    lineageTorment: '',
    personalTorment: '',
    aspirations: '',
    aspirationRecords: [],
    accursedTorment: { description: '', trigger: '' },
    personalTormentRecord: { description: '', trigger: '' },
    edges: [],
    contacts: [],
    bonds: [],
    gear: [],
    spells: [],
    notes: '',
    entries: [],
    experience: [],
  });
}
