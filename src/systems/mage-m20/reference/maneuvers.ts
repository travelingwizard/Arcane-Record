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

export const doManeuverVersionSchema = z.enum(['revised', 'legacy']);

export const doManeuverDefinitionSchema = z.object({
  ...maneuverReferenceFields,
  version: doManeuverVersionSchema,
});

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

export function matchesManeuverSearch(
  entry: {
    name: string;
    summary: string;
    source?: string;
    page?: string;
    notes?: string;
  },
  search: string,
) {
  const query = search.trim().toLocaleLowerCase();
  if (!query) {
    return true;
  }
  return [
    entry.name,
    entry.summary,
    entry.source,
    entry.page,
    entry.notes,
  ].some((value) => value?.toLocaleLowerCase().includes(query));
}
