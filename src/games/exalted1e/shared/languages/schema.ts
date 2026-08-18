import { z } from 'zod';

export const exaltedLanguageSchema = z.object({
  id: z.string().uuid(),
  definitionId: z.string().nullable(),
  customName: z.string(),
  proficiency: z.enum(['native', 'fluent', 'limited', 'temporary']),
  spoken: z.boolean(),
  written: z.boolean(),
  notes: z.string(),
  sourceType: z.enum(['linguistics', 'charm', 'spell', 'artifact', 'custom']),
  sourceId: z.string().nullable(),
});

export type ExaltedLanguage = z.infer<typeof exaltedLanguageSchema>;
