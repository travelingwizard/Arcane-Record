import { describe, expect, it } from 'vitest';
import {
  getOrderedNavigationGroups,
  getSheetSectionFromHash,
  moveOrderedId,
} from '../../src/components/navigation/sheet-navigation';

const groups = [
  { id: 'character', label: 'Character' },
  { id: 'traits', label: 'Traits' },
  { id: 'records', label: 'Records' },
];
const sections = [
  { id: 'identity', label: 'Identity', group: 'character' },
  { id: 'attributes', label: 'Attributes', group: 'traits' },
];

describe('shared sheet navigation', () => {
  it('orders groups and moves stable IDs without mutating the source', () => {
    const source = ['character', 'traits', 'records'] as const;
    const moved = moveOrderedId(source, 'character', 'later');

    expect(moved).toEqual(['traits', 'character', 'records']);
    expect(source).toEqual(['character', 'traits', 'records']);
    expect(
      getOrderedNavigationGroups(groups, moved).map(({ id }) => id),
    ).toEqual(moved);
  });

  it('resolves only registered section hashes', () => {
    expect(getSheetSectionFromHash(sections, '#attributes')).toBe('attributes');
    expect(getSheetSectionFromHash(sections, '#unknown')).toBeNull();
  });
});
