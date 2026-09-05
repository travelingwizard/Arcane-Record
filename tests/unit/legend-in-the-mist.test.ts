import { describe, expect, it } from 'vitest';
import {
  legendCatalogCounts,
  legendMagicWays,
  legendThemebooks,
  legendThemeKits,
  legendTropes,
} from '../../src/games/legend-in-the-mist/catalog';
import { createLegendHero } from '../../src/games/legend-in-the-mist/create-character';
import {
  calculateLegendRoll,
  currentStatusTier,
  reduceLegendStatus,
  stackLegendStatus,
} from '../../src/games/legend-in-the-mist/rules';

describe('Legend in the Mist catalogs', () => {
  it('contains the source-audited character catalogs with stable unique ids', () => {
    expect(legendCatalogCounts).toMatchObject({
      themebooks: 20,
      coreThemeKits: 120,
      magicWays: 8,
    });
    expect(legendTropes).toHaveLength(30);
    const entries = [
      ...legendThemebooks,
      ...legendThemeKits,
      ...legendTropes,
      ...legendMagicWays,
    ];
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length);
    expect(entries.every((entry) => entry.source && entry.page > 0)).toBe(true);
  });
});

describe('Legend in the Mist objective rules', () => {
  it('stacks and reduces status tier marks', () => {
    const status = {
      id: crypto.randomUUID(),
      name: 'weary',
      markedTiers: [2],
      limit: 5,
      polarity: '',
      directive: '',
      category: 'hero' as const,
      duration: 'ongoing' as const,
      notes: '',
    };
    const stacked = stackLegendStatus(status, 2);
    expect(stacked.markedTiers).toEqual([2, 3]);
    expect(currentStatusTier(stacked)).toBe(3);
    expect(reduceLegendStatus(stacked, 1).markedTiers).toEqual([1, 2]);
  });
  it('honors double ones and double sixes', () => {
    const base = {
      kind: 'quick' as const,
      context: '',
      helpfulTags: [],
      hinderingTags: [],
      helpfulStatuses: [],
      hinderingStatuses: [],
      burnedTagId: null,
      mightModifier: 0 as const,
    };
    expect(calculateLegendRoll({ ...base, dice: [1, 1] }).outcome).toBe(
      'consequences',
    );
    expect(calculateLegendRoll({ ...base, dice: [6, 6] }).outcome).toBe(
      'success',
    );
  });
  it('creates separate manual and guided heroes', () => {
    expect(createLegendHero({ creationStatus: 'manual' }).creation.status).toBe(
      'manual',
    );
    expect(createLegendHero({ creationStatus: 'draft' }).themes).toHaveLength(
      4,
    );
  });
});
