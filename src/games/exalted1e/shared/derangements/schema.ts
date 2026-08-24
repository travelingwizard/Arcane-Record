import { z } from 'zod';
import { unresolvedExaltedReferenceSchema } from '../unresolved-reference';

export const exaltedDerangementSchema = z.object({
  id: z.string().uuid(),
  definitionId: z.string().nullable(),
  unresolvedReference: unresolvedExaltedReferenceSchema,
  customName: z.string(),
  description: z.string(),
  mechanics: z.string(),
  duration: z.enum(['temporary', 'indefinite', 'permanent', 'custom']),
  customDuration: z.string(),
  status: z.enum(['active', 'suppressed', 'dormant', 'resolved']),
  sourceType: z.enum(['flaw', 'charm', 'spell', 'trauma', 'custom']),
  trigger: z.string(),
  suppressionRules: z.string(),
  recoveryRules: z.string(),
  notes: z.string(),
  linkedMeritFlawId: z.string().uuid().nullable(),
});

export type ExaltedDerangement = z.infer<typeof exaltedDerangementSchema>;
