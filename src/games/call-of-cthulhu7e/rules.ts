import type { Coc7eInvestigator } from './schema';
import type { OccupationFormula } from './catalog';
export const half = (value: number) => Math.floor(value / 2);
export const fifth = (value: number) => Math.floor(value / 5);
export function movement(c: Coc7eInvestigator['characteristics'], age: number) {
  let value =
    c.str < c.siz && c.dex < c.siz ? 7 : c.str > c.siz && c.dex > c.siz ? 9 : 8;
  if (age >= 40) value -= Math.min(5, Math.floor(age / 10) - 3);
  return Math.max(1, value);
}
export function damageBuild(str: number, siz: number) {
  const total = str + siz;
  if (total < 65) return { damageBonus: '-2', build: -2 };
  if (total < 85) return { damageBonus: '-1', build: -1 };
  if (total < 125) return { damageBonus: 'None', build: 0 };
  if (total < 165) return { damageBonus: '+1d4', build: 1 };
  const dice = Math.floor((total - 165) / 80) + 1;
  return { damageBonus: `+${dice}d6`, build: dice + 1 };
}
export function derived(c: Coc7eInvestigator) {
  const db = damageBuild(c.characteristics.str, c.characteristics.siz);
  return {
    hp: Math.floor((c.characteristics.con + c.characteristics.siz) / 10),
    mp: fifth(c.characteristics.pow),
    san: c.characteristics.pow,
    maxSan: Math.max(
      0,
      99 -
        (c.skills.find((s) => s.definitionId?.endsWith('cthulhu-mythos'))
          ?.rating ?? 0),
    ),
    mov: movement(c.characteristics, c.age),
    ...db,
  };
}
export function occupationBudget(
  c: Coc7eInvestigator,
  formula: OccupationFormula,
) {
  const x = c.characteristics;
  if (formula === 'edu4') return x.edu * 4;
  const other =
    formula === 'edu2-app2'
      ? x.app
      : formula === 'edu2-dex2'
        ? x.dex
        : formula === 'edu2-pow2'
          ? x.pow
          : formula === 'edu2-str2'
            ? x.str
            : Math.max(x.app, x.dex, x.str, x.pow);
  return x.edu * 2 + other * 2;
}
export function ageRequirements(age: number) {
  if (age < 20)
    return {
      physical: 5,
      edu: 5,
      app: 0,
      mov: 0,
      eduChecks: 0,
      luckTwice: true,
    };
  if (age < 40)
    return {
      physical: 0,
      edu: 0,
      app: 0,
      mov: 0,
      eduChecks: 1,
      luckTwice: false,
    };
  const decade = Math.min(8, Math.floor(age / 10));
  const physical = [0, 0, 0, 0, 5, 10, 20, 40, 80][decade] ?? 80;
  const app = [0, 0, 0, 0, 5, 10, 15, 20, 25][decade] ?? 25;
  return {
    physical,
    edu: 0,
    app,
    mov: decade - 3,
    eduChecks: Math.min(4, decade - 2),
    luckTwice: false,
  };
}
export type RollLevel =
  'critical' | 'extreme' | 'hard' | 'regular' | 'failure' | 'fumble';
export function percentileLevel(roll: number, target: number): RollLevel {
  if (roll === 1) return 'critical';
  if (roll >= 96 && (target < 50 || roll === 100)) return 'fumble';
  if (roll <= fifth(target)) return 'extreme';
  if (roll <= half(target)) return 'hard';
  if (roll <= target) return 'regular';
  return 'failure';
}
export function selectPercentile(
  ones: number,
  tens: number[],
  bonusPenalty: number,
) {
  const values = tens.map((ten) => {
    const n = ten * 10 + ones;
    return n === 0 ? 100 : n;
  });
  return bonusPenalty > 0
    ? Math.min(...values)
    : bonusPenalty < 0
      ? Math.max(...values)
      : values[0]!;
}

export function appendRoll(
  history: Coc7eInvestigator['rollHistory'],
  roll: Coc7eInvestigator['rollHistory'][number],
  settings: Coc7eInvestigator['rollerSettings'],
) {
  const next = [...history, roll];
  return settings.historyMode === 'continuous'
    ? next
    : next.slice(-settings.historyLimit);
}

export function canPushRoll(
  roll: Coc7eInvestigator['rollHistory'][number],
  history: Coc7eInvestigator['rollHistory'],
) {
  return (
    !roll.pushed &&
    roll.pushedFromRollId === null &&
    ['skill', 'characteristic'].includes(roll.kind) &&
    ['failure', 'fumble'].includes(roll.level) &&
    !history.some((entry) => entry.pushedFromRollId === roll.id)
  );
}
export function creationIssues(
  c: Coc7eInvestigator,
  budget: number,
  creditRange?: readonly [number, number],
) {
  const issues: string[] = [];
  const age = ageRequirements(c.age);
  if (
    c.creation.ageDeductions.physical < age.physical ||
    c.creation.ageDeductions.education < age.edu ||
    c.creation.ageDeductions.appearance < age.app
  )
    issues.push('Complete the published age adjustments.');
  if (!c.creation.occupationId) issues.push('Choose an occupation.');
  if (c.creation.occupationPointsSpent > budget)
    issues.push('Occupation points exceed the available budget.');
  if (c.creation.personalPointsSpent > c.characteristics.int * 2)
    issues.push('Personal-interest points exceed INT × 2.');
  if (
    creditRange &&
    (c.creditRating < creditRange[0] || c.creditRating > creditRange[1])
  )
    issues.push(
      `Credit Rating must be ${creditRange[0]}–${creditRange[1]} for this occupation.`,
    );
  if (
    c.creation.optionalRules.startingSkillCap &&
    c.skills.some((s) => s.rating > c.creation.optionalRules.skillCap)
  )
    issues.push(
      `A Skill exceeds the optional ${c.creation.optionalRules.skillCap}% starting cap.`,
    );
  return issues;
}
