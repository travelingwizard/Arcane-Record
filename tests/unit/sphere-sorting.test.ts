import { describe, expect, it } from 'vitest';
import {
  sortSpheres,
  spheres,
  type SphereId,
} from '../../src/systems/mage-m20/definitions';

const blankRatings = Object.fromEntries(
  spheres.map(({ id }) => [id, 0]),
) as Record<SphereId, number>;

describe('sortSpheres', () => {
  it('sorts strictly by name A-Z', () => {
    expect(
      sortSpheres(blankRatings, 'time', 'name-asc').map(({ label }) => label),
    ).toEqual([
      'Correspondence',
      'Entropy',
      'Forces',
      'Life',
      'Matter',
      'Mind',
      'Prime',
      'Spirit',
      'Time',
    ]);
  });

  it('sorts strictly by name Z-A', () => {
    expect(
      sortSpheres(blankRatings, 'correspondence', 'name-desc').map(
        ({ label }) => label,
      ),
    ).toEqual([
      'Time',
      'Spirit',
      'Prime',
      'Mind',
      'Matter',
      'Life',
      'Forces',
      'Entropy',
      'Correspondence',
    ]);
  });

  it('sorts rating highest to lowest and keeps affinity inside its group', () => {
    const ratings = {
      ...blankRatings,
      prime: 5,
      forces: 3,
      life: 3,
      time: 1,
    };

    expect(
      sortSpheres(ratings, 'life', 'rating-desc')
        .slice(0, 4)
        .map(({ id }) => id),
    ).toEqual(['prime', 'life', 'forces', 'time']);
  });

  it('sorts rating lowest to highest with affinity first only on ties', () => {
    const ratings = {
      ...blankRatings,
      entropy: 1,
      forces: 2,
      life: 2,
      prime: 4,
    };

    const sorted = sortSpheres(ratings, 'life', 'rating-asc');
    const twoPointGroup = sorted
      .filter(({ rating }) => rating === 2)
      .map(({ id }) => id);

    expect(sorted.at(-1)?.id).toBe('prime');
    expect(twoPointGroup).toEqual(['life', 'forces']);
  });

  it('does not mutate or reorder stored ratings', () => {
    const ratings = { ...blankRatings, forces: 4, spirit: 2 };
    const snapshot = structuredClone(ratings);

    sortSpheres(ratings, 'spirit', 'rating-desc');

    expect(ratings).toEqual(snapshot);
    expect(ratings.forces).toBe(4);
    expect(ratings.spirit).toBe(2);
  });
});
