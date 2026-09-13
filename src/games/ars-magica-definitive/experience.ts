/** Definitive Edition, printed pp. 375–376 (PDF pp. 383–384).
 * Earned experience only: effective-score bonuses are deliberately excluded.
 */
export type ExperienceScale = 'art' | 'ability';

function natural(value: number) {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error('Experience and scores must be nonnegative safe integers.');
  return value;
}

export function experienceForScore(score: number, scale: ExperienceScale) {
  natural(score);
  const result = ((score * (score + 1)) / 2) * (scale === 'ability' ? 5 : 1);
  return natural(result);
}

export function scoreFromExperience(
  experience: number,
  scale: ExperienceScale,
) {
  natural(experience);
  const units = Math.floor(experience / (scale === 'ability' ? 5 : 1));
  return Math.floor((Math.sqrt(1 + 8 * units) - 1) / 2);
}

/** A source's Gain Limit cannot remove existing XP or grant progress beyond its level. */
export function applyExperienceGain(
  current: number,
  awarded: number,
  scale: ExperienceScale,
  gainLimit?: number,
) {
  natural(current);
  natural(awarded);
  const limit =
    gainLimit === undefined ? undefined : experienceForScore(gainLimit, scale);
  const applied =
    limit === undefined
      ? awarded
      : Math.min(awarded, Math.max(0, limit - current));
  const total = natural(current + applied);
  return {
    total,
    applied,
    unspent: awarded - applied,
    score: scoreFromExperience(total, scale),
  };
}
