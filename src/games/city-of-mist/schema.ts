import { z } from 'zod';
import { cityPlayRecordsSchema } from './play';
import { buildReviewSchema } from '../shared/reviewed-build';
import {
  readSourceDefaults,
  sourceSelectionSchema,
} from '../shared/catalog-sources';
import { citySources } from './sources';

export const CITY_OF_MIST_SYSTEM_ID = 'city-of-mist';
export const CITY_OF_MIST_CREW_SYSTEM_ID = 'city-of-mist-crew';

const tagSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  kind: z.enum(['power', 'weakness']),
  questionId: z.string().nullable(),
  burnt: z.boolean(),
  invoked: z.boolean().default(false),
  broad: z.boolean(),
});

export const cityThemeSchema = z.object({
  id: z.string().uuid(),
  definitionId: z.string().nullable(),
  name: z.string(),
  kind: z.enum(['mythos', 'logos', 'mist', 'crew', 'extra']),
  state: z.enum(['nascent', 'standard', 'archived']),
  statement: z.string(),
  statementKind: z.enum(['mystery', 'identity', 'directive', 'custom']),
  tags: z.array(tagSchema),
  attention: z.number().int().min(0).max(3),
  strain: z.number().int().min(0).max(3),
  strainKind: z.enum(['fade', 'crack', 'strikes', 'custom']),
  improvements: z.array(
    z.object({
      id: z.string().uuid(),
      definitionId: z.string().nullable(),
      name: z.string(),
      notes: z.string(),
    }),
  ),
  flipside: z.string(),
  notes: z.string(),
});

export const cityLayoutSchema = z.object({
  build: z
    .array(z.string())
    .default([
      'identity',
      'themes',
      'crew',
      'story',
      'development',
      'play',
      'records',
    ]),
  play: z
    .array(z.string())
    .default([
      'play',
      'themes',
      'story',
      'crew',
      'development',
      'identity',
      'records',
    ]),
});

const crewDataSchema = z.object({
  schemaVersion: z.literal(2),
  enabledSources: sourceSelectionSchema(citySources),
  name: z.string(),
  concept: z.string(),
  city: z.string(),
  layout: cityLayoutSchema.default({
    build: ['identity', 'themes', 'records'],
    play: ['themes', 'identity', 'records'],
  }),
  mode: z.enum(['build', 'play']).default('build'),
  themes: z.array(cityThemeSchema),
  notes: z.string(),
});

// Embedded and exported legacy snapshots pass through the same migration boundary.
export const cityCrewSchema = z.preprocess((data) => {
  if (
    data &&
    typeof data === 'object' &&
    'schemaVersion' in data &&
    data.schemaVersion === 1
  ) {
    return { ...data, schemaVersion: 2 };
  }
  return data;
}, crewDataSchema);

/** Embedded crews belong to this sheet. Linked crews have one authoritative record. */
export const cityCrewBindingSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({ kind: z.literal('embedded'), crew: cityCrewSchema }),
  z.object({ kind: z.literal('linked'), crewId: z.string().min(1) }),
]);

export const cityCharacterSchema = z.object({
  buildReview: buildReviewSchema.default({ draft: null, history: [] }),
  schemaVersion: z.literal(4),
  enabledSources: sourceSelectionSchema(citySources),
  profile: z.enum(['rift', 'gatekeeper']),
  name: z.string(),
  player: z.string().default(''),
  mythos: z.string(),
  logos: z.string(),
  notes: z.string(),
  playRecords: cityPlayRecordsSchema.default({
    statuses: [],
    batches: [],
    tags: [],
    events: [],
    spends: [],
  }),
  creation: z.object({
    status: z.enum(['draft', 'manual', 'finalized']),
    step: z.string(),
    approvals: z.array(
      z.object({
        ruleId: z.string(),
        reason: z.string().min(1),
        approvedAt: z.string().datetime(),
      }),
    ),
  }),
  mode: z.enum(['build', 'play']),
  layout: cityLayoutSchema.default({
    build: [
      'identity',
      'themes',
      'crew',
      'story',
      'development',
      'play',
      'records',
    ],
    play: [
      'play',
      'themes',
      'story',
      'crew',
      'development',
      'identity',
      'records',
    ],
  }),
  gatekeeper: z
    .object({
      role: z.string(),
      clearance: z.number().int().min(1).max(9),
      outlook: z.string(),
    })
    .default({ role: '', clearance: 9, outlook: '' }),
  playState: z
    .object({
      clues: z.string(),
      juice: z.string(),
      statuses: z.string(),
      storyTags: z.string(),
      buildUp: z.number().int().nonnegative(),
      history: z.string(),
    })
    .default({
      clues: '',
      juice: '',
      statuses: '',
      storyTags: '',
      buildUp: 0,
      history: '',
    }),
  themes: z.array(cityThemeSchema),
  crew: cityCrewBindingSchema,
  crewTransfer: z
    .object({
      sourceCrewId: z.string(),
      capturedAt: z.string().datetime(),
      snapshot: cityCrewSchema,
    })
    .nullable()
    .default(null),
  development: z
    .object({
      pendingMoments: z.number().int().nonnegative(),
      state: z.enum(['normal', 'sleeper', 'avatar', 'fired', 'bigwig']),
      nemeses: z.array(
        z.object({
          id: z.string().uuid(),
          lostThemeId: z.string().uuid(),
          description: z.string(),
        }),
      ),
      history: z.array(
        z.object({
          id: z.string().uuid(),
          date: z.string().datetime(),
          themeId: z.string().uuid(),
          reason: z.string(),
          before: cityThemeSchema,
          after: cityThemeSchema.nullable(),
        }),
      ),
      claimedMoments: z
        .array(
          z.object({
            id: z.string().uuid(),
            definitionId: z.string(),
            name: z.string(),
            notes: z.string(),
            claimedAt: z.string().datetime(),
          }),
        )
        .default([]),
    })
    .default({
      pendingMoments: 0,
      state: 'normal',
      nemeses: [],
      history: [],
      claimedMoments: [],
    }),
  relationships: z.array(
    z.object({
      id: z.string().uuid(),
      characterId: z.string().nullable(),
      name: z.string(),
      help: z.number().int().nonnegative(),
      hurt: z.number().int().nonnegative(),
      notes: z.string(),
    }),
  ),
});

export type CityCrew = z.infer<typeof cityCrewSchema>;
export type CityCharacter = z.infer<typeof cityCharacterSchema>;
export function migrateCityCharacter(
  data: unknown,
  fromVersion: number,
): CityCharacter {
  if (![1, 2, 3, 4].includes(fromVersion))
    throw new Error('Unsupported City of Mist character version.');
  const versioned = z
    .object({ schemaVersion: z.literal(fromVersion) })
    .passthrough()
    .parse(data);
  if (fromVersion === 4) return cityCharacterSchema.parse(versioned);
  const old = versioned as { layout?: { build?: string[]; play?: string[] } };
  const migrateOrder = (
    order: string[] | undefined,
    mode: 'build' | 'play',
  ) => {
    const result: string[] = [];
    for (const id of order ?? []) {
      if (id === 'play')
        result.push(
          ...(mode === 'build'
            ? ['story', 'development', 'play']
            : ['play', 'story', 'development']),
        );
      else if (!result.includes(id)) result.push(id);
    }
    for (const id of [
      'identity',
      'themes',
      'crew',
      'story',
      'development',
      'play',
      'records',
    ])
      if (!result.includes(id)) result.push(id);
    return result;
  };
  return cityCharacterSchema.parse({
    ...versioned,
    schemaVersion: 4,
    layout: {
      build: migrateOrder(old.layout?.build, 'build'),
      play: migrateOrder(old.layout?.play, 'play'),
    },
  });
}
export type CityCrewBinding = z.infer<typeof cityCrewBindingSchema>;

export function createCityCrew(name = ''): CityCrew {
  return {
    schemaVersion: 2,
    enabledSources: readSourceDefaults('city-of-mist', citySources),
    name,
    concept: '',
    city: '',
    mode: 'build',
    layout: {
      build: ['identity', 'themes', 'records'],
      play: ['themes', 'identity', 'records'],
    },
    themes: [],
    notes: '',
  };
}

export function createCityCharacter(
  profile: CityCharacter['profile'] = 'rift',
): CityCharacter {
  return cityCharacterSchema.parse({
    schemaVersion: 4,
    enabledSources: readSourceDefaults('city-of-mist', citySources),
    profile,
    name: '',
    player: '',
    mythos: '',
    logos: '',
    notes: '',
    creation: { status: 'draft', step: 'concept', approvals: [] },
    mode: 'build',
    themes: [],
    crew: { kind: 'none' },
    relationships: [],
  });
}
