export function advancementPipeline(input: {
  sourceQuality: number;
  sourceModifiers: number[];
  advancementModifiers: number[];
}) {
  const values = [
    input.sourceQuality,
    ...input.sourceModifiers,
    ...input.advancementModifiers,
  ];
  if (values.some((n) => !Number.isSafeInteger(n)))
    throw new Error('Advancement modifiers must be integers.');
  const advancementTotal = Math.max(
    0,
    input.sourceQuality + input.sourceModifiers.reduce((a, b) => a + b, 0),
  );
  const awarded = Math.max(
    0,
    advancementTotal + input.advancementModifiers.reduce((a, b) => a + b, 0),
  );
  return { sourceQuality: input.sourceQuality, advancementTotal, awarded };
}
export function teachingQuality(input: {
  communication: number;
  teaching: number;
  students: number;
  goodTeacher: number;
}) {
  Object.values(input).forEach((n) => {
    if (!Number.isSafeInteger(n))
      throw new Error('Teaching values must be integers.');
  });
  if (input.students < 1)
    throw new Error('Teaching requires at least one student.');
  const groupBonus =
    input.students === 1
      ? 6
      : input.students === 2
        ? 3
        : input.students <= 5
          ? 0
          : input.students <= 10
            ? -3
            : -6;
  return Math.max(
    0,
    input.communication + input.teaching + 3 + groupBonus + input.goodTeacher,
  );
}
export function trainingQuality(trainerScore: number) {
  if (!Number.isSafeInteger(trainerScore) || trainerScore < 1)
    throw new Error('Trainer score must be positive.');
  return trainerScore + 3;
}
export function visStudyCost(artScore: number) {
  if (!Number.isSafeInteger(artScore) || artScore < 0)
    throw new Error('Art score must be nonnegative.');
  return Math.max(1, Math.ceil(artScore / 5));
}
