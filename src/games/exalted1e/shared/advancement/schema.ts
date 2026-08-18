import { z } from 'zod';

export const experienceLedgerEntrySchema = z.object({
  id: z.string().uuid(),
  date: z.string(),
  session: z.string(),
  type: z.enum(['award', 'purchase', 'refund', 'adjustment']),
  amount: z.number().int(),
  category: z.string(),
  targetId: z.string().nullable(),
  targetName: z.string(),
  previousRating: z.number().int().nonnegative().nullable(),
  newRating: z.number().int().nonnegative().nullable(),
  description: z.string(),
  notes: z.string(),
  createdAt: z.string().datetime(),
});

export const downtimeAdvancementSchema = z.object({
  id: z.string().uuid(),
  startYear: z.string(),
  endYear: z.string(),
  yearsElapsed: z.number().nonnegative(),
  attributesWillpowerGained: z.string(),
  abilitiesVirtuesGained: z.string(),
  backgroundsGained: z.string(),
  essenceIncrease: z.number().int().nonnegative(),
  charmsLearned: z.string(),
  comboLearned: z.string(),
  notes: z.string(),
  createdAt: z.string().datetime(),
});

export type ExperienceLedgerEntry = z.infer<typeof experienceLedgerEntrySchema>;
export type DowntimeAdvancement = z.infer<typeof downtimeAdvancementSchema>;
