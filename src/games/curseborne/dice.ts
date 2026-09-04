import { z } from 'zod';

export const curseRollInputSchema = z.object({
  pool: z.number().int().min(1).max(10),
  held: z.number().int().nonnegative(),
  difficulty: z.number().int().min(0).max(100),
  doubleNines: z.boolean(),
  enhancement: z.number().int().min(0).max(3),
  stackingEnhancement: z.number().int().min(0).max(5),
  preRollHits: z.number().int().min(0).max(100),
  checkAltered: z.boolean(),
  context: z.string(),
});
export const curseRollSchema = z.object({
  id: z.string().uuid(),
  date: z.string(),
  input: curseRollInputSchema,
  dice: z.array(
    z.object({ face: z.number().int().min(1).max(10), curse: z.boolean() }),
  ),
  rolledHits: z.number().int().nonnegative(),
  curseHits: z.number().int().nonnegative(),
  appliedEnhancement: z.number().int().min(0).max(5),
  total: z.number().int().nonnegative(),
  success: z.boolean(),
  remainingHits: z.number().int().nonnegative(),
});
export type CurseRollInput = z.infer<typeof curseRollInputSchema>;
export type CurseRoll = z.infer<typeof curseRollSchema>;

/** Rejection sampling avoids modulo bias. Randomness never leaves the browser. */
export function randomD10(): number {
  const words = new Uint32Array(1);
  do {
    crypto.getRandomValues(words);
  } while (words[0]! >= 4294967290);
  return (words[0]! % 10) + 1;
}

/** Core pp. 178–179, 243–245. Does not adjudicate Tricks or narrative consequences. */
export function rollCurseDice(
  input: CurseRollInput,
  die: () => number = randomD10,
): CurseRoll {
  const checked = curseRollInputSchema.parse(input);
  const dice = Array.from({ length: checked.pool }, (_, i) => {
    const face = die();
    if (!Number.isInteger(face) || face < 1 || face > 10)
      throw new Error('Invalid d10 result.');
    return { face, curse: i < Math.min(checked.held, checked.pool) };
  });
  const hits = (face: number) =>
    face === 10 || (checked.doubleNines && face === 9) ? 2 : face >= 8 ? 1 : 0;
  const rolledHits = dice.reduce((n, d) => n + hits(d.face), 0);
  const curseHits = dice.reduce((n, d) => n + (d.curse ? hits(d.face) : 0), 0);
  const appliedEnhancement =
    rolledHits + checked.preRollHits > 0
      ? Math.min(5, checked.enhancement + checked.stackingEnhancement)
      : 0;
  const total = rolledHits + checked.preRollHits + appliedEnhancement;
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    input: checked,
    dice,
    rolledHits,
    curseHits,
    appliedEnhancement,
    total,
    success: total >= checked.difficulty,
    remainingHits: Math.max(0, total - checked.difficulty),
  };
}

export function curseDiceLimit(entanglement: number): number | null {
  return (
    ({ 1: 5, 2: 7, 3: 7, 4: 9 } as Record<number, number>)[entanglement] ?? null
  );
}
