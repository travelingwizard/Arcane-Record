import { describe, expect, it } from 'vitest';
import {
  allDefinitions,
  playbooks,
  threatTypes,
} from '../src/games/monster-of-the-week/catalog';
import {
  createMotwHunter,
  createMotwKeeper,
} from '../src/games/monster-of-the-week/create-character';
import {
  applyRatingPackage,
  hunterCreationIssues,
  rollMotw,
} from '../src/games/monster-of-the-week/rules';
import {
  motwHunterSchema,
  motwKeeperSchema,
} from '../src/games/monster-of-the-week/schema';

describe('Monster of the Week module', () => {
  it('has 12 core and four optional Tome playbooks with stable unique IDs', () => {
    expect(playbooks.filter((x) => x.sourceId === 'motw.core')).toHaveLength(
      12,
    );
    expect(playbooks.filter((x) => x.sourceId === 'motw.tome')).toHaveLength(4);
    expect(new Set(allDefinitions.map((x) => x.id)).size).toBe(
      allDefinitions.length,
    );
    expect(
      allDefinitions.every((x) => x.page > 0 && x.summary && x.verified),
    ).toBe(true);
  });
  it('applies a package and validates required creation choices', () => {
    let hunter = createMotwHunter();
    expect(hunter.enabledSources).toEqual(['motw.core']);
    expect(hunterCreationIssues(hunter)).toHaveLength(3);
    hunter = { ...hunter, name: 'Sam', playbookId: playbooks[0]!.id };
    hunter = applyRatingPackage(hunter, 0);
    expect(hunter.ratings).toEqual({
      charm: 2,
      cool: -1,
      sharp: 1,
      tough: 2,
      weird: -1,
    });
    expect(hunterCreationIssues(hunter)).toEqual([]);
    expect(motwHunterSchema.parse(hunter)).toEqual(hunter);
  });
  it('resolves all result bands including advanced moves', () => {
    expect(rollMotw([1, 1], 0, 0, 0).outcome).toBe('miss');
    expect(rollMotw([3, 4], 0, 0, 0).outcome).toBe('mixed');
    expect(rollMotw([5, 5], 0, 0, 0).outcome).toBe('full');
    expect(rollMotw([6, 6], 0, 0, 0).outcome).toBe('advanced');
  });
  it('creates a valid local Keeper workspace with all threat families', () => {
    expect(Object.keys(threatTypes)).toEqual([
      'monster',
      'minion',
      'bystander',
      'location',
      'phenomenon',
    ]);
    expect(motwKeeperSchema.parse(createMotwKeeper()).enabledSources).toEqual([
      'motw.core',
    ]);
  });
});
