import { describe, expect, it } from 'vitest';
import {
  applyExperienceGain,
  experienceForScore,
  scoreFromExperience,
} from '../../src/games/ars-magica-definitive/experience';

describe('Ars Magica earned experience', () => {
  it('uses separate Art and Ability scales', () => {
    expect(experienceForScore(5, 'art')).toBe(15);
    expect(experienceForScore(5, 'ability')).toBe(75);
    expect(scoreFromExperience(74, 'ability')).toBe(4);
    expect(scoreFromExperience(75, 'ability')).toBe(5);
  });
  it('round-trips every ordinary threshold and its preceding point', () => {
    for (const scale of ['art', 'ability'] as const) {
      for (let score = 1; score <= 100; score++) {
        const xp = experienceForScore(score, scale);
        expect(scoreFromExperience(xp, scale)).toBe(score);
        expect(scoreFromExperience(xp - 1, scale)).toBe(score - 1);
      }
    }
  });
  it('caps gains at the source level without removing existing experience', () => {
    expect(applyExperienceGain(70, 20, 'ability', 5)).toEqual({
      total: 75,
      applied: 5,
      unspent: 15,
      score: 5,
    });
    expect(applyExperienceGain(80, 20, 'ability', 5).total).toBe(80);
    expect(applyExperienceGain(0, 75, 'ability').score).toBe(5);
  });
  it('rejects malformed values rather than silently rounding them', () => {
    for (const value of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => scoreFromExperience(value, 'art')).toThrow();
      expect(() => experienceForScore(value, 'ability')).toThrow();
    }
  });
});
