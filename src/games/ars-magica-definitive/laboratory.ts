const safe = (n: number) => {
  if (!Number.isSafeInteger(n))
    throw new Error('Laboratory values must be integers.');
  return n;
};
export function laboratoryTotal(input: {
  technique: number;
  form: number;
  intelligence: number;
  magicTheory: number;
  aura: number;
  laboratory: number;
  assistants: number;
  specialization: number;
  requisites?: number[];
}) {
  Object.values(input)
    .filter((x): x is number => typeof x === 'number')
    .forEach(safe);
  (input.requisites ?? []).forEach(safe);
  const art = Math.min(
    input.technique,
    input.form,
    ...(input.requisites ?? []),
  );
  return (
    art +
    input.intelligence +
    input.magicTheory +
    input.aura +
    input.laboratory +
    input.assistants +
    input.specialization
  );
}
export function projectProgress(input: {
  labTotal: number;
  effectLevel: number;
  current: number;
  kind:
    | 'invent-spell'
    | 'lesser-enchantment'
    | 'invested-effect'
    | 'familiar-bond'
    | 'longevity-ritual';
}) {
  Object.values(input)
    .filter((x): x is number => typeof x === 'number')
    .forEach(safe);
  if (input.effectLevel < 1 || input.current < 0)
    throw new Error('Invalid project state.');
  const gained = Math.max(0, input.labTotal - input.effectLevel);
  const required =
    input.kind === 'lesser-enchantment' ? input.effectLevel : input.effectLevel;
  const after = input.current + gained;
  return { gained, after, required, complete: after >= required };
}
export function extractionPawns(creoVimLabTotal: number) {
  safe(creoVimLabTotal);
  return Math.max(0, Math.floor(creoVimLabTotal / 10));
}
export function longevityBonus(labTotal: number) {
  safe(labTotal);
  return Math.floor(labTotal / 5);
}

export function covenantBuildPointCost(
  input:
    | { kind: 'art-summa'; level: number; quality: number }
    | { kind: 'ability-summa'; level: number; quality: number }
    | { kind: 'tractatus'; quality: number }
    | { kind: 'lab-text'; levels: number }
    | { kind: 'casting-tablet'; levels: number }
    | { kind: 'vis-income'; pawnsPerYear: number }
    | { kind: 'vis-stock'; pawns: number }
    | { kind: 'enchanted-item'; effectLevels: number },
) {
  Object.values(input)
    .filter((x): x is number => typeof x === 'number')
    .forEach(safe);
  if (input.kind === 'art-summa') {
    if (input.level > 20 || input.quality > Math.min(11 + 20 - input.level, 22))
      throw new Error('Art summa exceeds the core quality/level limit.');
    return input.level + input.quality;
  }
  if (input.kind === 'ability-summa') {
    if (
      input.level > 8 ||
      input.quality > Math.min(11 + 3 * (8 - input.level), 22)
    )
      throw new Error('Ability summa exceeds the core quality/level limit.');
    return input.level * 3 + input.quality;
  }
  if (input.kind === 'tractatus') {
    if (input.quality > 11)
      throw new Error('Tractatus quality exceeds the core limit.');
    return input.quality;
  }
  if (input.kind === 'lab-text') return Math.ceil(input.levels / 5);
  if (input.kind === 'casting-tablet') return Math.ceil(input.levels / 5) * 2;
  if (input.kind === 'vis-income') return input.pawnsPerYear * 5;
  if (input.kind === 'vis-stock') return Math.ceil(input.pawns / 5);
  return Math.ceil(input.effectLevels / 5) * 2;
}
