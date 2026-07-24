import { z } from 'zod';
import instrumentData from './instruments.data.json' with { type: 'json' };
import paradigmData from './paradigms.data.json' with { type: 'json' };
import practiceData from './practices.data.json' with { type: 'json' };
import { magickReferenceDefinitionSchema, uniqueCatalogSchema } from './magick';

export const focusDefinitionSchema = magickReferenceDefinitionSchema.extend({
  family: z.enum(['common', 'expanded', 'tradition-specific', 'fallen']),
});

const focusCatalogSchema = (name: string) =>
  uniqueCatalogSchema(focusDefinitionSchema, name);

export type FocusDefinition = z.infer<typeof focusDefinitionSchema>;
export type FocusKind = 'paradigm' | 'practice' | 'instrument';

export const paradigmCatalog =
  focusCatalogSchema('Paradigm').parse(paradigmData);
export const practiceCatalog =
  focusCatalogSchema('Practice').parse(practiceData);
export const instrumentCatalog =
  focusCatalogSchema('Instrument').parse(instrumentData);

export const paradigmById = new Map(
  paradigmCatalog.map((definition) => [definition.id, definition]),
);
export const practiceById = new Map(
  practiceCatalog.map((definition) => [definition.id, definition]),
);
export const instrumentById = new Map(
  instrumentCatalog.map((definition) => [definition.id, definition]),
);

export const focusCatalogs = {
  paradigm: paradigmCatalog,
  practice: practiceCatalog,
  instrument: instrumentCatalog,
} as const;

export const focusDefinitionsByKind = {
  paradigm: paradigmById,
  practice: practiceById,
  instrument: instrumentById,
} as const;
