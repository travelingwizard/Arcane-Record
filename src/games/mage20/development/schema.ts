import { z } from 'zod';

const points = z.number().int().min(0).max(10000);
const ratings = z.record(z.string(), points);
const selection = z.object({
  id: z.string().uuid(),
  definitionId: z.string(),
  displayName: z.string(),
  rating: z.number().int().min(0).max(10),
  notes: z.string(),
  addedAt: z.string(),
  pooled: z.boolean(),
});
const merit = z.object({
  id: z.string().uuid(),
  definitionId: z.string(),
  chosenCost: points,
  notes: z.string(),
  addedAt: z.string(),
});
const focusEntry = z.object({
  id: z.string().uuid(),
  definitionId: z.string().optional(),
  customName: z.string().optional(),
  notes: z.string(),
  addedAt: z.string(),
  significant: z.boolean().default(false),
});
export const mageCreationDraftSchema = z.object({
  profile: z.enum(['standard', 'experienced', 'custom']),
  step: z.number().int().min(0).max(9),
  identity: z.record(z.string(), z.string()),
  attributePriorities: z
    .array(z.enum(['physical', 'social', 'mental']))
    .length(3),
  abilityPriorities: z
    .array(z.enum(['talents', 'skills', 'knowledges']))
    .length(3),
  budgets: z.object({
    attributes: z.array(points).length(3),
    abilities: z.array(points).length(3),
    backgrounds: points,
    spheres: points,
    freebies: points,
    areteCap: z.number().int().min(1).max(10),
  }),
  base: ratings,
  freebies: ratings,
  affinity: z.string().nullable(),
  backgrounds: z.array(selection),
  merits: z.array(merit),
  flaws: z.array(merit),
  focus: z.object({
    paradigms: z.array(focusEntry),
    practices: z.array(focusEntry),
    instruments: z.array(focusEntry),
  }),
  details: z.record(z.string(), z.string()),
  startingXp: points,
  approvals: z.record(
    z.string(),
    z.object({ reason: z.string().min(1), at: z.string().datetime() }),
  ),
});
export const mageLedgerEntrySchema = z.object({
  id: z.string().uuid(),
  date: z.string(),
  kind: z.enum([
    'opening',
    'award',
    'purchase',
    'refund',
    'adjustment',
    'story',
  ]),
  amount: z.number().int(),
  earned: z.number().int(),
  target: z.string(),
  previous: points.nullable(),
  next: points.nullable(),
  description: z.string(),
  approved: z.boolean(),
  createdAt: z.string().datetime(),
  reverses: z.string().uuid().nullable(),
});
export const mageDevelopmentSchema = z.object({
  version: z.literal(1),
  status: z.enum(['manual', 'draft', 'finalized']),
  draft: mageCreationDraftSchema.nullable(),
  baseline: mageCreationDraftSchema.nullable(),
  finalizedAt: z.string().datetime().nullable(),
  ledger: z.array(mageLedgerEntrySchema),
  backgroundXp: z.boolean(),
  extraAbilities: z.array(
    z.object({
      id: z.string().uuid(),
      definitionId: z.string().nullable(),
      name: z.string().min(1),
      group: z.enum(['talents', 'skills', 'knowledges']),
      rating: z.number().int().min(0).max(5),
      source: z.string(),
      notes: z.string(),
    }),
  ),
  specialties: z.record(z.string(), z.string()),
  details: z.record(z.string(), z.string()),
});
export type MageDevelopment = z.infer<typeof mageDevelopmentSchema>;
export type MageCreationDraft = z.infer<typeof mageCreationDraftSchema>;
export type MageLedgerEntry = z.infer<typeof mageLedgerEntrySchema>;
