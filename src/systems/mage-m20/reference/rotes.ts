import { z } from 'zod';
import roteData from './rotes.data.json' with { type: 'json' };
import { magickReferenceDefinitionSchema, uniqueCatalogSchema } from './magick';

export const roteDefinitionSchema = magickReferenceDefinitionSchema.extend({
  family: z.enum(['mystic', 'technocratic', 'malign', 'indexed']),
  requirements: z.string(),
});

export const roteCatalogSchema = uniqueCatalogSchema(
  roteDefinitionSchema,
  'Rote',
);

export type RoteDefinition = z.infer<typeof roteDefinitionSchema>;

export const roteCatalog = roteCatalogSchema.parse(roteData);
export const roteById = new Map(
  roteCatalog.map((definition) => [definition.id, definition]),
);
