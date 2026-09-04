import { z } from 'zod';
import { curseRollSchema } from './dice';
import { buildReviewSchema } from '../shared/reviewed-build';
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
  id: z.string().uuid(),
  kind: z.enum(['edge', 'spell', 'contact', 'equipment', 'bond']),
  name: z.string(),
  rating: z.number().int().nonnegative(),
  notes: z.string(),
  source: z.string(),
  page: z.number().int().nonnegative(),
  active: z.boolean(),
});
export const curseCharacterSchema = z.object({
  buildReview: buildReviewSchema.default({ draft: null, history: [] }),
  schemaVersion: z.literal(2),
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
  if (fromVersion !== 1 && fromVersion !== 2)
    throw new Error('Unsupported Curseborne character version.');
  const versioned = z
    .object({ schemaVersion: z.literal(fromVersion) })
    .passthrough()
    .parse(data);
  return curseCharacterSchema.parse({ ...versioned, schemaVersion: 2 });
}
export function createCurseCharacter(): CurseCharacter {
  return curseCharacterSchema.parse({
    schemaVersion: 2,
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
        'entries',
        'health',
        'experience',
        'records',
      ],
      play: [
        'health',
        'curse',
        'traits',
        'entries',
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
    notes: '',
    entries: [],
    experience: [],
  });
}
