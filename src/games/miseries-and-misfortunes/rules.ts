import type { MmCharacter } from './schema';
export const abilityModifier = (n: number) =>
  n <= 2
    ? -3
    : n === 3
      ? -2
      : n <= 5
        ? -1
        : n <= 8
          ? 0
          : n <= 12
            ? 1
            : n <= 15
              ? 2
              : n <= 17
                ? 3
                : 4;
export const skillStep = (
  r: { numerator: number; die: '6' | '8' | '10' | '12' | '20' },
  delta: number,
) => {
  const order = [6, 8, 10, 12, 20] as const;
  let n = r.numerator + delta,
    d = Number(r.die);
  while (n >= d && d < 20) {
    const i = order.indexOf(d as (typeof order)[number]);
    d = order[i + 1]!;
    n = d === 20 ? 13 : d - 1;
  }
  while (n < 1 && d > 6) {
    const i = order.indexOf(d as (typeof order)[number]);
    d = order[i - 1]!;
    n = Math.max(1, d - 1);
  }
  return {
    numerator: Math.max(0, Math.min(n, 19)),
    die: String(d) as '6' | '8' | '10' | '12' | '20',
  };
};
export const rollDice = (count: number, sides: number) =>
  Array.from(
    { length: count },
    () => (crypto.getRandomValues(new Uint32Array(1))[0]! % sides) + 1,
  );
export const derivedMeasures = (c: MmCharacter) => ({
  defense: c.abilities.Strength ?? 0,
  dodge: c.abilities.Dexterity ?? 0,
  morale:
    [3, 4, 5, 6, 7, 8, 9, 10, 10][
      Math.min(8, Math.max(0, abilityModifier(c.abilities.Charisma ?? 9) + 3))
    ] ?? 7,
});
export function creationIssues(c: MmCharacter) {
  const x: string[] = [];
  if (!c.name.trim()) x.push('Enter a name.');
  if (!c.birth.quality) x.push('Determine quality of birth.');
  if (!c.birth.incomeSource) x.push('Determine an income source.');
  if (c.lifepaths.length === 0) x.push('Choose at least one lifepath.');
  if (c.languages.length === 0) x.push('Record a native language.');
  if (Object.values(c.abilities).some((v) => v < 0 || v > 19))
    x.push('Abilities must be between 0 and 19.');
  return x;
}
