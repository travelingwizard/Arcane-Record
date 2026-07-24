import { z } from 'zod';

export const referenceFamilySchema = z.enum([
  'common',
  'expanded',
  'tradition-specific',
  'fallen',
  'mystic',
  'technocratic',
  'malign',
  'indexed',
]);

export const reviewStatusSchema = z.enum(['unverified', 'verified']);
export const contentLabelSchema = z.enum(['standard', 'mature']);

export const magickReferenceDefinitionSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  family: referenceFamilySchema,
  summary: z.string().min(1),
  citation: z.string().min(1),
  reviewStatus: reviewStatusSchema,
  contentLabel: contentLabelSchema,
});

export function uniqueCatalogSchema<
  Schema extends z.ZodType<{ id: string; name: string }>,
>(definitionSchema: Schema, catalogName: string) {
  return z.array(definitionSchema).superRefine((definitions, context) => {
    const ids = new Set<string>();
    const names = new Set<string>();
    definitions.forEach((definition, index) => {
      if (ids.has(definition.id)) {
        context.addIssue({
          code: 'custom',
          path: [index, 'id'],
          message: `Duplicate ${catalogName} ID: ${definition.id}`,
        });
      }
      const normalizedName = definition.name.trim().toLocaleLowerCase();
      if (names.has(normalizedName)) {
        context.addIssue({
          code: 'custom',
          path: [index, 'name'],
          message: `Duplicate ${catalogName} name: ${definition.name}`,
        });
      }
      ids.add(definition.id);
      names.add(normalizedName);
    });
  });
}

export function matchesReferenceSearch(
  definition: {
    name: string;
    summary: string;
    citation: string;
  },
  search: string,
) {
  const query = search.trim().toLocaleLowerCase();
  if (!query) {
    return true;
  }
  return [definition.name, definition.summary, definition.citation].some(
    (value) => value.toLocaleLowerCase().includes(query),
  );
}
