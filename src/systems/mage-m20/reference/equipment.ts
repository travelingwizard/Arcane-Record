import { z } from 'zod';
import equipmentData from './equipment.data.json' with { type: 'json' };
import {
  contentLabelSchema,
  reviewStatusSchema,
  uniqueCatalogSchema,
} from './magick';

export const equipmentCategorySchema = z.enum([
  'melee',
  'ranged',
  'armor',
  'gear',
]);

export const equipmentFamilySchema = z.enum([
  'mundane',
  'military',
  'technocratic',
  'mystic',
  'malign',
]);

export const equipmentDefinitionSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  category: equipmentCategorySchema,
  family: equipmentFamilySchema,
  statistics: z.string(),
  summary: z.string().min(1),
  citation: z.string().min(1),
  reviewStatus: reviewStatusSchema,
  contentLabel: contentLabelSchema,
});

export const equipmentCatalogSchema = uniqueCatalogSchema(
  equipmentDefinitionSchema,
  'Equipment',
);

export type EquipmentCategory = z.infer<typeof equipmentCategorySchema>;
export type EquipmentDefinition = z.infer<typeof equipmentDefinitionSchema>;

export const equipmentCatalog = equipmentCatalogSchema.parse(equipmentData);
export const equipmentById = new Map(
  equipmentCatalog.map((definition) => [definition.id, definition]),
);
