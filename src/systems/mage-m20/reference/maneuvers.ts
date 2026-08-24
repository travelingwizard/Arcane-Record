import { z } from 'zod';
import combatData from './combat-maneuvers.data.json' with { type: 'json' };
import doData from './do-maneuvers.data.json' with { type: 'json' };
import { reviewStatusSchema, uniqueCatalogSchema } from './magick';

const maneuverReferenceFields = {
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  summary: z.string().min(1),
  source: z.string().min(1),
  page: z.string().min(1),
  citation: z.string().min(1),
  reviewStatus: reviewStatusSchema,
};

export const combatManeuverCategorySchema = z.enum([
  'general',
  'defensive',
  'close-combat',
  'ranged',
]);

export const combatManeuverDefinitionSchema = z.object({
  ...maneuverReferenceFields,
  category: combatManeuverCategorySchema,
});

export const doManeuverDefinitionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1),
    alternateNames: z.array(z.string().min(1)).default([]),
    summary: z.string().min(1),
    roll: z.string().min(1).optional(),
    difficulty: z.string().min(1).optional(),
    damage: z.string().min(1).optional(),
    actions: z.string().min(1).optional(),
    details: z.array(z.string().min(1)).default([]),
    sourceTitle: z.string().min(1),
    sourcePage: z.string().min(1),
    sourcePageStart: z.number().int().positive(),
    sourcePageEnd: z.number().int().positive().optional(),
    category: z.literal('special-do-technique'),
    official: z.boolean(),
    legacy: z.boolean(),
    reviewStatus: reviewStatusSchema,
  })
  .superRefine((definition, context) => {
    if (definition.official === definition.legacy) {
      context.addIssue({
        code: 'custom',
        path: ['official'],
        message: 'A Do technique must be either Official or Legacy.',
      });
    }
    if (
      definition.official &&
      (!definition.roll ||
        !definition.difficulty ||
        !definition.damage ||
        !definition.actions)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['roll'],
        message: 'Official techniques require every mechanical field.',
      });
    }
    if (
      definition.sourcePageEnd !== undefined &&
      definition.sourcePageEnd < definition.sourcePageStart
    ) {
      context.addIssue({
        code: 'custom',
        path: ['sourcePageEnd'],
        message: 'The ending page cannot precede the starting page.',
      });
    }
  })
  .transform((definition) => ({
    ...definition,
    source: definition.sourceTitle,
    page: definition.sourcePage,
    citation: `${definition.sourceTitle}, p${
      definition.sourcePage.includes('-') ? 'p' : ''
    }. ${definition.sourcePage}`,
    version: definition.official ? ('official' as const) : ('legacy' as const),
  }));

export const combatManeuverCatalogSchema = uniqueCatalogSchema(
  combatManeuverDefinitionSchema,
  'Combat maneuver',
);
export const doManeuverCatalogSchema = uniqueCatalogSchema(
  doManeuverDefinitionSchema,
  'Do maneuver',
);

export type CombatManeuverCategory = z.infer<
  typeof combatManeuverCategorySchema
>;
export type CombatManeuverDefinition = z.infer<
  typeof combatManeuverDefinitionSchema
>;
export type DoManeuverDefinition = z.infer<typeof doManeuverDefinitionSchema>;

export const combatManeuverCatalog =
  combatManeuverCatalogSchema.parse(combatData);
export const doManeuverCatalog = doManeuverCatalogSchema.parse(doData);
export const combatManeuverById = new Map(
  combatManeuverCatalog.map((definition) => [definition.id, definition]),
);
export const doManeuverById = new Map(
  doManeuverCatalog.map((definition) => [definition.id, definition]),
);

export const officialDoTechniqueCatalog = doManeuverCatalog.filter(
  (definition) => definition.official,
);

export function getSpecialDoTechniqueAllowance(doRating: number) {
  return Math.max(0, Math.min(4, Math.trunc(doRating) - 1));
}

export function matchesManeuverSearch(
  entry: {
    name: string;
    summary: string;
    alternateNames?: string[];
    source?: string;
    page?: string;
    notes?: string;
    roll?: string;
    difficulty?: string;
    damage?: string;
    actions?: string;
  },
  search: string,
) {
  const query = search.trim().toLocaleLowerCase();
  if (!query) {
    return true;
  }
  return [
    entry.name,
    ...(entry.alternateNames ?? []),
    entry.summary,
    entry.source,
    entry.page,
    entry.notes,
    entry.roll,
    entry.difficulty,
    entry.damage,
    entry.actions,
  ].some((value) => value?.toLocaleLowerCase().includes(query));
}
