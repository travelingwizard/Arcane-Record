import { z } from 'zod';

export const cityStatusSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    spectrum: z.string(),
    tier: z.number().int().min(1).max(6),
    pips: z.number().int().nonnegative(),
    duration: z.enum(['temporary', 'ongoing', 'permanent']),
    relevance: z.enum(['neutral', 'helpful', 'hindering']),
    active: z.boolean(),
    notes: z.string(),
  })
  .refine(
    (s) => s.pips < s.tier && (s.tier !== 6 || s.pips === 0),
    'Pips must fit below the next tier.',
  );
export const cityBatchSchema = z
  .object({
    id: z.string().uuid(),
    kind: z.enum(['clue', 'juice']),
    method: z.string(),
    source: z.string(),
    expires: z.string(),
    amount: z.number().int().nonnegative(),
    spent: z.number().int().nonnegative(),
    expired: z.boolean(),
    notes: z.string(),
  })
  .refine(
    (b) => b.spent <= b.amount,
    'Cannot spend more than this batch contains.',
  );
export const cityStoryTagSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  duration: z.enum(['temporary', 'ongoing', 'permanent']),
  state: z.enum(['active', 'burnt', 'expired']),
  notes: z.string(),
});
export const cityPlayRecordsSchema = z.object({
  statuses: z.array(cityStatusSchema),
  batches: z.array(cityBatchSchema),
  tags: z.array(cityStoryTagSchema),
  events: z.array(
    z.object({
      id: z.string().uuid(),
      date: z.string(),
      description: z.string(),
    }),
  ),
});
export type CityStatus = z.infer<typeof cityStatusSchema>;
export type CityBatch = z.infer<typeof cityBatchSchema>;
export type CityPlayRecords = z.infer<typeof cityPlayRecordsSchema>;

/** Player's Guide pp. 223–224. Caller must confirm spectrum and duration match. */
export function stackCityStatus(
  current: CityStatus,
  incomingTier: number,
): CityStatus {
  cityStatusSchema.parse(current);
  if (!Number.isInteger(incomingTier) || incomingTier < 1 || incomingTier > 6)
    throw new Error('Status tier must be 1–6.');
  let { tier, pips } = current;
  if (incomingTier > tier) {
    tier = incomingTier;
    pips = 0;
  } else if (incomingTier === tier) {
    tier = Math.min(6, tier + 1);
    pips = 0;
  } else {
    pips += incomingTier;
    while (tier < 6 && pips >= tier) {
      pips -= tier;
      tier += 1;
    }
  }
  if (tier === 6) pips = 0;
  return { ...current, tier, pips };
}

/** Tier 5/6 affects fictional permission, not numeric Power (p. 219). */
export function cityStatusPower(statuses: readonly CityStatus[]) {
  const relevant = statuses.filter((s) => s.active && s.tier <= 4);
  const helpful = Math.max(
    0,
    ...relevant.filter((s) => s.relevance === 'helpful').map((s) => s.tier),
  );
  const hindering = Math.max(
    0,
    ...relevant.filter((s) => s.relevance === 'hindering').map((s) => s.tier),
  );
  return { helpful, hindering, modifier: helpful - hindering };
}

export function spendCityBatch(batch: CityBatch, amount: number): CityBatch {
  cityBatchSchema.parse(batch);
  if (
    !Number.isInteger(amount) ||
    amount < 1 ||
    batch.expired ||
    amount > batch.amount - batch.spent
  )
    throw new Error('Not enough available points in this batch.');
  return { ...batch, spent: batch.spent + amount };
}
