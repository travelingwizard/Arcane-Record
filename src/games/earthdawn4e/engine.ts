import type { EarthdawnAttributeId } from './catalog';

export const attributeModifierCosts: Record<number, number> = {
  [-2]: -2,
  [-1]: -1,
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 5,
  5: 7,
  6: 9,
  7: 12,
  8: 15,
};
export function attributeStep(value: number) {
  return Math.max(1, Math.floor((Math.max(1, value) - 1) / 3) + 2);
}
export const characteristicRows = [
  [1, 2, 2, 10, 2, 4, 3, 1],
  [2, 2, 2, 15, 4, 6, 3, 1],
  [3, 2, 3, 20, 6, 8, 4, 1],
  [4, 3, 3, 25, 8, 11, 4, 1],
  [5, 3, 4, 30, 10, 13, 5, 1],
  [6, 3, 4, 40, 12, 15, 5, 1],
  [7, 4, 5, 50, 14, 18, 6, 2],
  [8, 4, 5, 60, 16, 20, 6, 2],
  [9, 4, 6, 70, 18, 22, 7, 2],
  [10, 5, 6, 80, 20, 25, 7, 2],
  [11, 5, 7, 95, 22, 27, 8, 2],
  [12, 5, 7, 110, 24, 29, 8, 2],
  [13, 6, 8, 125, 26, 32, 9, 3],
  [14, 6, 8, 140, 28, 34, 9, 3],
  [15, 6, 9, 155, 30, 36, 10, 3],
  [16, 7, 9, 175, 32, 39, 10, 3],
  [17, 7, 10, 195, 34, 41, 11, 3],
  [18, 7, 10, 215, 36, 43, 11, 3],
  [19, 8, 11, 235, 38, 46, 12, 4],
  [20, 8, 11, 255, 40, 48, 12, 4],
  [21, 8, 12, 280, 42, 50, 13, 4],
  [22, 9, 12, 305, 44, 53, 13, 4],
  [23, 9, 13, 330, 46, 55, 14, 4],
  [24, 9, 13, 355, 48, 57, 14, 4],
  [25, 10, 14, 380, 50, 60, 15, 5],
  [26, 10, 14, 410, 52, 62, 15, 5],
  [27, 10, 15, 440, 54, 64, 16, 5],
  [28, 11, 15, 470, 56, 67, 16, 5],
  [29, 11, 16, 500, 58, 69, 17, 5],
  [30, 11, 16, 530, 60, 71, 17, 5],
] as const;
export function characteristics(value: number) {
  const row = characteristicRows[Math.min(29, Math.max(0, value - 1))]!;
  return {
    value: row[0],
    step: row[1],
    defense: row[2],
    carrying: row[3],
    unconsciousness: row[4],
    death: row[5],
    wound: row[6],
    recovery: row[7],
  };
}
const baseDice = [
  '2d6',
  '1d8+1d6',
  '2d8',
  '1d10+1d8',
  '2d10',
  '1d12+1d10',
  '2d12',
  '1d12+2d6',
  '1d12+1d8+1d6',
  '1d12+2d8',
  '1d12+1d10+1d8',
];
export function stepDice(step: number) {
  if (step <= 1) return '1d4-2';
  if (step === 2) return '1d4-1';
  if (step === 3) return '1d4';
  if (step === 4) return '1d6';
  if (step === 5) return '1d8';
  if (step === 6) return '1d10';
  if (step === 7) return '1d12';
  const offset = step - 8;
  const d20 = Math.floor(offset / 11);
  const expression = baseDice[offset % 11]!;
  return `${d20 ? `${d20}d20+` : ''}${expression}`;
}
export const stepDiceChart = Array.from({ length: 105 }, (_, i) => ({
  step: i + 1,
  dice: stepDice(i + 1),
}));
export function deriveCharacter(
  attributes: Record<EarthdawnAttributeId, number>,
  circle = 1,
) {
  const dex = characteristics(attributes.dexterity),
    str = characteristics(attributes.strength),
    tou = characteristics(attributes.toughness),
    per = characteristics(attributes.perception),
    cha = characteristics(attributes.charisma);
  return {
    physicalDefense: dex.defense,
    mysticDefense: per.defense,
    socialDefense: cha.defense,
    initiative: dex.step,
    carryingCapacity: str.carrying,
    unconsciousness: tou.unconsciousness,
    death: tou.death + circle,
    woundThreshold: tou.wound,
    recoveryTests: tou.recovery,
    recoveryStep: tou.step,
    mysticArmor: Math.floor(attributes.willpower / 5),
  };
}
export interface RollResult {
  id: string;
  step: number;
  modifier: number;
  targetNumber: number;
  context: string;
  dice: string;
  rolls: Array<{ sides: number; values: number[] }>;
  total: number;
  successLevel: number;
  createdAt: string;
}
export function rollStep(
  step: number,
  modifier = 0,
  targetNumber = 0,
  context = '',
): RollResult {
  const dice = stepDice(Math.max(1, step + modifier));
  const rolls: Array<{ sides: number; values: number[] }> = [];
  let total = 0;
  for (const match of dice.matchAll(/(\d+)d(\d+)/g)) {
    const count = Number(match[1]),
      sides = Number(match[2]);
    for (let i = 0; i < count; i++) {
      const values: number[] = [];
      let value = sides;
      while (value === sides) {
        value = (crypto.getRandomValues(new Uint32Array(1))[0]! % sides) + 1;
        values.push(value);
        total += value;
      }
      rolls.push({ sides, values });
    }
  }
  const penalty = Number(dice.match(/-(\d+)/)?.[1] ?? 0);
  total -= penalty;
  return {
    id: crypto.randomUUID(),
    step,
    modifier,
    targetNumber,
    context,
    dice,
    rolls,
    total,
    successLevel:
      targetNumber > 0 && total >= targetNumber
        ? 1 + Math.floor((total - targetNumber) / 5)
        : 0,
    createdAt: new Date().toISOString(),
  };
}

export function addKarmaDie(result: RollResult, sides: 6 | 8): RollResult {
  const values: number[] = [];
  let value = sides;
  let karmaTotal = 0;
  while (value === sides) {
    value = (crypto.getRandomValues(new Uint32Array(1))[0]! % sides) + 1;
    values.push(value);
    karmaTotal += value;
  }
  const total = result.total + karmaTotal;
  return {
    ...result,
    dice: `${result.dice}+1d${sides} Karma`,
    rolls: [...result.rolls, { sides, values }],
    total,
    successLevel:
      result.targetNumber > 0 && total >= result.targetNumber
        ? 1 + Math.floor((total - result.targetNumber) / 5)
        : 0,
  };
}
