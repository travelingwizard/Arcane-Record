import { z } from 'zod';
import catalogData from './backgrounds.data.json' with { type: 'json' };

export const backgroundRestrictionSchema = z.enum([
  'technocracy-only',
  'shamanic-character',
  'storyteller-approval',
  'other',
]);

export const backgroundSourceSchema = z.object({
  bookId: z.string().min(1),
  bookLabel: z.string().min(1),
  page: z.union([z.number().int().positive(), z.string().min(1)]),
});

export const backgroundDefinitionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1),
    aliases: z.array(z.string().min(1)),
    mysticName: z.string(),
    technocraticName: z.string(),
    description: z.string().min(1),
    minimumRating: z.number().int().positive(),
    standardMaximumRating: z.number().int().positive(),
    supportsRatingsAboveFive: z.boolean(),
    creationPointCostPerDot: z.union([z.literal(1), z.literal(2)]),
    restrictions: z.array(backgroundRestrictionSchema),
    canBeSelectedMultipleTimes: z.boolean(),
    canBePooled: z.boolean(),
    sources: z.array(backgroundSourceSchema).min(1),
    sourceLine: z.number().int().positive(),
  })
  .superRefine((definition, context) => {
    if (definition.minimumRating > definition.standardMaximumRating) {
      context.addIssue({
        code: 'custom',
        path: ['minimumRating'],
        message: 'Minimum rating must not exceed the standard maximum.',
      });
    }
    if (new Set(definition.aliases).size !== definition.aliases.length) {
      context.addIssue({
        code: 'custom',
        path: ['aliases'],
        message: 'Aliases must be unique.',
      });
    }
    if (
      new Set(definition.restrictions).size !== definition.restrictions.length
    ) {
      context.addIssue({
        code: 'custom',
        path: ['restrictions'],
        message: 'Restrictions must be unique.',
      });
    }
  });

export const backgroundCatalogSchema = z
  .array(backgroundDefinitionSchema)
  .superRefine((definitions, context) => {
    const ids = new Set<string>();
    for (const [index, definition] of definitions.entries()) {
      if (ids.has(definition.id)) {
        context.addIssue({
          code: 'custom',
          path: [index, 'id'],
          message: `Duplicate Background definition ID: ${definition.id}`,
        });
      }
      ids.add(definition.id);
    }
  });

export type BackgroundRestriction = z.infer<typeof backgroundRestrictionSchema>;
export type BackgroundDefinition = z.infer<typeof backgroundDefinitionSchema>;

export const backgroundCatalog = backgroundCatalogSchema.parse(catalogData);
export const backgroundById = new Map(
  backgroundCatalog.map((definition) => [definition.id, definition]),
);

export const backgroundBooks = Array.from(
  new Map(
    backgroundCatalog.flatMap((definition) =>
      definition.sources.map((source) => [
        source.bookId,
        { id: source.bookId, label: source.bookLabel },
      ]),
    ),
  ).values(),
).sort((left, right) => left.label.localeCompare(right.label));

export function formatBackgroundSources(definition: BackgroundDefinition) {
  return definition.sources
    .map((source) => `${source.bookLabel}, p. ${source.page}`)
    .join(' · ');
}

export function formatBackgroundRatingRange(definition: BackgroundDefinition) {
  return `${definition.minimumRating}–${definition.standardMaximumRating}${
    definition.supportsRatingsAboveFive ? '+' : ''
  } dots`;
}

export function formatBackgroundRestriction(
  restriction: BackgroundRestriction,
) {
  const labels: Record<BackgroundRestriction, string> = {
    'technocracy-only': 'Technocracy characters only',
    'shamanic-character': 'Intended for suitable shamanic characters',
    'storyteller-approval': 'Storyteller approval recommended',
    other: 'Special restriction',
  };
  return labels[restriction];
}
