import { describe, it, expect } from 'vitest';
import {
  stackCityStatus,
  cityStatusPower,
  spendCityBatch,
  cityPlayRecordsSchema,
  type CityStatus,
} from '../../src/games/city-of-mist/play';
import {
  createCityCharacter,
  cityCharacterSchema,
} from '../../src/games/city-of-mist/schema';

const status = (tier = 3): CityStatus => ({
  id: crypto.randomUUID(),
  name: 'injured',
  spectrum: 'harm',
  tier,
  pips: 0,
  duration: 'ongoing',
  relevance: 'neutral',
  active: true,
  notes: '',
});
describe('City of Mist structured play', () => {
  it('replaces higher tiers and increments equal tiers', () => {
    expect(stackCityStatus(status(2), 4).tier).toBe(4);
    expect(stackCityStatus(status(3), 3).tier).toBe(4);
    expect(stackCityStatus(status(6), 6).tier).toBe(6);
  });
  it('carries lower-tier pips through the next tier', () => {
    const first = stackCityStatus(status(4), 3);
    expect(first.pips).toBe(3);
    expect(first.tier).toBe(4);
    const second = stackCityStatus(first, 3);
    expect(second.pips).toBe(2);
    expect(second.tier).toBe(5);
  });
  it('uses only highest helpful and hindering statuses, not OUT or resolved records', () => {
    expect(
      cityStatusPower([
        { ...status(2), relevance: 'helpful' },
        { ...status(3), relevance: 'helpful' },
        { ...status(1), relevance: 'hindering' },
        { ...status(5), relevance: 'hindering' },
        { ...status(4), relevance: 'hindering', active: false },
      ]),
    ).toEqual({ helpful: 3, hindering: 1, modifier: 2 });
  });
  it('spends from individual batches and prevents overspending or expired use', () => {
    const batch = {
      id: crypto.randomUUID(),
      kind: 'juice' as const,
      method: 'Healing',
      source: 'Change the Game',
      expires: '',
      amount: 3,
      spent: 0,
      expired: false,
      notes: '',
    };
    expect(spendCityBatch(batch, 2).spent).toBe(2);
    expect(batch.spent).toBe(0);
    expect(() => spendCityBatch(batch, 4)).toThrow();
    expect(() => spendCityBatch({ ...batch, expired: true }, 1)).toThrow();
  });
  it('retains legacy notes without inferring amounts and round trips structured records', () => {
    const c = createCityCharacter();
    c.playState.statuses = 'badly hurt';
    const migrated = cityCharacterSchema.parse({
      ...c,
      playRecords: undefined,
    });
    expect(migrated.playState.statuses).toBe('badly hurt');
    expect(migrated.playRecords.statuses).toEqual([]);
    c.playRecords.statuses.push(status());
    c.playRecords.spends.push({
      id: crypto.randomUUID(),
      batchId: crypto.randomUUID(),
      kind: 'juice',
      amount: 1,
      outcome: 'Created safe-passage',
      createdAt: new Date().toISOString(),
    });
    expect(cityCharacterSchema.parse(JSON.parse(JSON.stringify(c)))).toEqual(c);
    expect(
      cityPlayRecordsSchema.safeParse({
        ...c.playRecords,
        statuses: [{ ...status(3), pips: 4 }],
      }).success,
    ).toBe(false);
  });
});
