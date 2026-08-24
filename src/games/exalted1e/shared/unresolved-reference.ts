import { z } from 'zod';

export const unresolvedExaltedReferenceSchema = z
  .object({
    definitionId: z.string(),
    label: z.string(),
    summary: z.string(),
    source: z.string(),
    page: z.string(),
    repairNotes: z.string(),
    ownedDataJson: z.string(),
  })
  .nullable()
  .optional();
