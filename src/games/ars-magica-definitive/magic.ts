export interface CastingScoreInput {
  technique: number;
  form: number;
  stamina: number;
  encumbrance: number;
  aura: number;
  voice: number;
  gestures: number;
  visBoostPawns: number;
}
const integer = (n: number) => {
  if (!Number.isSafeInteger(n))
    throw new Error('Casting values must be integers.');
  return n;
};
export function castingScore(input: CastingScoreInput) {
  Object.values(input).forEach(integer);
  if (input.visBoostPawns < 0) throw new Error('Vis cannot be negative.');
  return (
    input.technique +
    input.form +
    input.stamina -
    input.encumbrance +
    input.aura +
    input.voice +
    input.gestures +
    input.visBoostPawns * 2
  );
}
export function formulaicResult(score: number, die: number, level: number) {
  [score, die, level].forEach(integer);
  if (level < 1) throw new Error('Spell level must be positive.');
  const total = score + die,
    difference = total - level;
  return {
    total,
    cast: difference >= -10,
    fatigueLost: difference >= 0 ? 0 : 1,
    penetrationBase: total - level,
  };
}
export function ritualResult(input: {
  score: number;
  artesLiberales: number;
  philosophiae: number;
  die: number;
  level: number;
  availableFatigue: number;
}) {
  Object.values(input).forEach(integer);
  if (input.level < 1 || input.availableFatigue < 0)
    throw new Error('Invalid ritual values.');
  const total =
    input.score + input.artesLiberales + input.philosophiae + input.die;
  const difference = total - input.level;
  const fatigueLost =
    difference >= 0
      ? 1
      : difference >= -5
        ? 2
        : difference >= -10
          ? 3
          : difference >= -15
            ? 4
            : 5;
  const deficit = Math.max(0, fatigueLost - input.availableFatigue);
  return {
    total,
    cast: difference >= -10,
    fatigueLost,
    wound:
      deficit === 0
        ? null
        : deficit === 1
          ? 'light'
          : deficit === 2
            ? 'medium'
            : deficit === 3
              ? 'heavy'
              : 'incapacitating',
    visRequired: Math.ceil(input.level / 5),
  };
}
export function spontaneousResult(
  score: number,
  die: number,
  fatiguing: boolean,
) {
  [score, die].forEach(integer);
  return Math.floor(fatiguing ? (score + die) / 2 : score / 5);
}
export function penetrationTotal(
  castingTotal: number,
  penetrationBonus: number,
  spellLevel: number,
) {
  [castingTotal, penetrationBonus, spellLevel].forEach(integer);
  return castingTotal + penetrationBonus - spellLevel;
}
export function validateVisUse(input: {
  techniqueScore: number;
  formScore: number;
  techniquePawns: number;
  formPawns: number;
  ritualRequired?: number;
}) {
  Object.values(input)
    .filter((x): x is number => typeof x === 'number')
    .forEach(integer);
  if (
    input.techniquePawns < 0 ||
    input.formPawns < 0 ||
    input.techniquePawns > input.techniqueScore ||
    input.formPawns > input.formScore
  )
    throw new Error('Vis use exceeds an Art score or is negative.');
  const total = input.techniquePawns + input.formPawns;
  if (input.ritualRequired !== undefined && total < input.ritualRequired)
    throw new Error('The ritual requires more vis.');
  return { total, additionalBotchDice: total };
}
