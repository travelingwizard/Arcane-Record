import { z } from 'zod';

export const diceSystemDefinitionSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/),
  name: z.string().min(1).max(160),
  sides: z.number().int().min(2).max(100),
  maximumDice: z.number().int().min(1).max(100),
});

export type DiceSystemDefinition = z.infer<typeof diceSystemDefinitionSchema>;

export function rollDice(
  definition: DiceSystemDefinition,
  count: number,
  random: () => number = Math.random,
) {
  if (!Number.isInteger(count) || count < 1 || count > definition.maximumDice) {
    throw new Error('Dice count exceeds the declared system budget.');
  }
  return Array.from(
    { length: count },
    () =>
      Math.floor(
        Math.min(0.999999999, Math.max(0, random())) * definition.sides,
      ) + 1,
  );
}
