import { z } from 'zod';
import wonderData from './wonders.data.json' with { type: 'json' };
import { magickReferenceDefinitionSchema, uniqueCatalogSchema } from './magick';

export const wonderDefinitionSchema = magickReferenceDefinitionSchema.extend({
  family: z.enum(['mystic', 'technocratic', 'malign']),
  typeLabel: z.string(),
});

export const wonderCatalogSchema = uniqueCatalogSchema(
  wonderDefinitionSchema,
  'Wonder',
);

export type WonderDefinition = z.infer<typeof wonderDefinitionSchema>;

export const wonderCatalog = wonderCatalogSchema.parse(wonderData);
export const wonderById = new Map(
  wonderCatalog.map((definition) => [definition.id, definition]),
);
