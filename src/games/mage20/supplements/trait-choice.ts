import { z } from 'zod';

export const mageTraitChoiceSchema = z.object({
  sphere: z.enum([
    'correspondence',
    'entropy',
    'forces',
    'life',
    'matter',
    'mind',
    'prime',
    'spirit',
    'time',
  ]),
  pricing: z.enum(['printed-table', 'percentage']),
  reason: z.string().min(1),
  approvedAt: z.string().datetime(),
});
export type MageTraitChoice = z.infer<typeof mageTraitChoiceSchema>;

export function sphereTraitPrice(
  kind: 'sphere-natural' | 'sphere-inept',
  current: number,
  affinity: boolean,
  choice: MageTraitChoice,
) {
  if (!Number.isInteger(current) || current < 0 || current > 4)
    throw new Error('No verified advancement cost above Sphere 5.');
  const base = current === 0 ? 10 : current * (affinity ? 7 : 8);
  const tables = {
    'sphere-natural': affinity ? [7, 5, 10, 15, 20] : [7, 6, 11, 17, 23],
    'sphere-inept': affinity ? [13, 9, 19, 28, 37] : [13, 11, 21, 32, 42],
  };
  const rate = kind === 'sphere-natural' ? 70 : 130;
  const cost =
    choice.pricing === 'printed-table'
      ? tables[kind][current]
      : Math.ceil((base * rate) / 100);
  return {
    cost,
    explanation: `Base ${base} XP; ${kind === 'sphere-natural' ? 'Sphere Natural' : 'Sphere Inept'}: ${choice.pricing === 'printed-table' ? 'printed table' : `${rate}% rounded up`} → ${cost} XP. GM ruling: ${choice.reason}. Book of Secrets, p. ${kind === 'sphere-natural' ? 79 : 94}.`,
  };
}
