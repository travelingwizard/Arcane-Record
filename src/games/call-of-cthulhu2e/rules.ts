import type { Coc2eInvestigator } from './schema';
export const derivedValues = (c: Coc2eInvestigator) => {
  const mythos =
    c.skills.find((x) => x.definitionId === 'coc2e.core.skill.cthulhu-mythos')
      ?.rating ?? 0;
  const educationBonus = Math.max(0, Math.floor((c.age - 20) / 10));
  const education = c.characteristics.edu + educationBonus;
  return {
    education,
    educationBonus,
    idea: c.characteristics.int * 5,
    know: education * 5,
    luck: c.characteristics.pow * 5,
    sanityMaximum: Math.max(0, 99 - mythos),
    magicPointsMaximum: c.characteristics.pow,
    hitPointsMaximum: Math.ceil(
      (c.characteristics.siz + c.characteristics.con) / 2,
    ),
    damageBonus: damageBonus(c.characteristics.str + c.characteristics.siz),
  };
};
export function damageBonus(total: number) {
  if (total <= 12) return '-1D6';
  if (total <= 16) return '-1D4';
  if (total <= 24) return 'None';
  if (total <= 32) return '+1D4';
  if (total <= 40) return '+1D6';
  return `+${Math.ceil((total - 40) / 16) + 1}D6`;
}
export const resistanceTarget = (active: number, passive: number) =>
  Math.max(0, Math.min(100, 50 + active * 5 - passive * 5));
export const rollPercentile = (roll: number, target: number) => ({
  roll,
  target,
  success: roll <= target,
});
export const isImpale = (roll: number, target: number, eligible: boolean) =>
  eligible && roll <= Math.floor(target / 5);
export const creationBudgets = (c: Coc2eInvestigator) => ({
  occupation: derivedValues(c).education * 15,
  personal: c.characteristics.int * 5,
});
export function creationIssues(c: Coc2eInvestigator) {
  const b = creationBudgets(c),
    issues: string[] = [];
  if (!c.name.trim()) issues.push('Enter the investigator’s name.');
  if (!c.creation.occupationId && !c.occupationName.trim())
    issues.push('Choose or describe an occupation.');
  if (Object.values(c.characteristics).some((x) => x <= 0))
    issues.push('Complete every characteristic.');
  if (c.creation.occupationPointsSpent > b.occupation)
    issues.push('Occupation points exceed EDU × 15.');
  if (c.creation.personalPointsSpent > b.personal)
    issues.push('Personal-interest points exceed INT × 5.');
  if (
    c.creation.previousExperience &&
    !c.enabledSources.includes('coc2e.1920s')
  )
    issues.push('Previous Experience requires the 1920s Sourcebook.');
  return issues;
}
export function rollCharacteristic(
  key: keyof Coc2eInvestigator['characteristics'],
  dice: number[],
) {
  const modifier = key === 'siz' || key === 'int' ? 6 : key === 'edu' ? 3 : 0;
  return dice.reduce((a, b) => a + b, 0) + modifier;
}
export function applyImprovement(
  rating: number,
  percentile: number,
  increase: number,
) {
  if (percentile <= rating) return { eligible: false, rating };
  return { eligible: true, rating: Math.min(100, rating + increase) };
}
export function parseDiceExpression(
  expression: string,
  randomDie: (sides: number) => number,
) {
  const match = expression.trim().match(/^(\d+)?d(\d+)([+-]\d+)?$/i);
  if (!match) {
    const fixed = Number(expression);
    if (!Number.isInteger(fixed)) throw new Error('Use a number or NdS dice.');
    return { dice: [] as number[], modifier: 0, total: fixed };
  }
  const count = Number(match[1] ?? 1),
    sides = Number(match[2]),
    modifier = Number(match[3] ?? 0);
  if (count < 1 || count > 20 || sides < 2 || sides > 100)
    throw new Error('Dice expression is outside supported limits.');
  const dice = Array.from({ length: count }, () => randomDie(sides));
  return { dice, modifier, total: dice.reduce((a, b) => a + b, modifier) };
}
