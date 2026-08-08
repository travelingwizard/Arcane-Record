import { z } from 'zod';

export const exaltedComboSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  charmIds: z.array(z.string()),
  description: z.string(),
  tacticalSummary: z.string(),
  notes: z.string(),
  createdAt: z.string().datetime(),
});
