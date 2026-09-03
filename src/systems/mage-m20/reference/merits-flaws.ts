import { z } from 'zod';
import catalogData from './merits-flaws.data.json' with { type: 'json' };

export const meritFlawKindSchema = z.enum(['merit', 'flaw']);
export const meritFlawCategorySchema = z.enum([
  'physical',
  'mental',
  'social',
  'supernatural',
  'nephandic',
  'companion',
  'other',
]);

export const meritFlawSourceSchema = z.object({
  bookId: z.string().min(1),
  bookLabel: z.string().min(1),
  page: z.union([z.number().int().positive(), z.string().min(1)]),
});

export const meritFlawDefinitionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1),
    aliases: z.array(z.string().min(1)),
    kind: meritFlawKindSchema,
    category: meritFlawCategorySchema,
    allowedCosts: z.array(z.number().int().positive()),
    description: z.string().min(1),
    sources: z.array(meritFlawSourceSchema).min(1),
    requiresReview: z.boolean(),
    verificationStatus: z
      .enum(['unverified', 'verified'])
      .default('unverified'),
    playerSelectable: z.boolean().default(true),
    eligibility: z.string().default(''),
    reviewNote: z.string(),
    sourceLine: z.number().int().positive(),
  })
  .superRefine((definition, context) => {
    if (
      new Set(definition.allowedCosts).size !== definition.allowedCosts.length
    ) {
      context.addIssue({
        code: 'custom',
        path: ['allowedCosts'],
        message: 'Allowed costs must be unique.',
      });
    }
    if (definition.allowedCosts.length === 0 && !definition.requiresReview) {
      context.addIssue({
        code: 'custom',
        path: ['requiresReview'],
        message: 'Definitions without a cost must require review.',
      });
    }
  });

export const meritFlawCatalogSchema = z
  .array(meritFlawDefinitionSchema)
  .superRefine((definitions, context) => {
    const ids = new Set<string>();
    for (const [index, definition] of definitions.entries()) {
      if (ids.has(definition.id)) {
        context.addIssue({
          code: 'custom',
          path: [index, 'id'],
          message: `Duplicate definition ID: ${definition.id}`,
        });
      }
      ids.add(definition.id);
    }
  });

export type MeritFlawKind = z.infer<typeof meritFlawKindSchema>;
export type MeritFlawCategory = z.infer<typeof meritFlawCategorySchema>;
export type MeritFlawDefinition = z.infer<typeof meritFlawDefinitionSchema>;

export const meritFlawCatalog = meritFlawCatalogSchema.parse(catalogData);
export const meritFlawById = new Map(
  meritFlawCatalog.map((definition) => [definition.id, definition]),
);

export const meritFlawCategories = meritFlawCategorySchema.options;
export const meritFlawBooks = Array.from(
  new Map(
    meritFlawCatalog.flatMap((definition) =>
      definition.sources.map((source) => [
        source.bookId,
        { id: source.bookId, label: source.bookLabel },
      ]),
    ),
  ).values(),
).sort((left, right) => left.label.localeCompare(right.label));

export const meritFlawCosts = Array.from(
  new Set(meritFlawCatalog.flatMap((definition) => definition.allowedCosts)),
).sort((left, right) => left - right);

export function formatMeritFlawSources(definition: MeritFlawDefinition) {
  return definition.sources
    .map((source) => `${source.bookLabel}, p. ${source.page}`)
    .join(' · ');
}

export function formatAllowedCosts(definition: MeritFlawDefinition) {
  if (definition.allowedCosts.length === 0) {
    return 'Cost requires review';
  }
  if (definition.allowedCosts.length === 1) {
    return `${definition.allowedCosts[0]} point${
      definition.allowedCosts[0] === 1 ? '' : 's'
    }`;
  }
  return definition.allowedCosts.join(', ');
}
