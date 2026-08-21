import { describe, expect, it } from 'vitest';
import {
  burningWheelCatalog,
  burningWheelLifepaths,
  burningWheelSkills,
  burningWheelTraits,
  lifepathsForStock,
} from '../../src/games/burning-wheel/catalog';

describe('Burning Wheel Gold + Codex catalog', () => {
  it('contains all normalized Charred Black catalogs with stable unique IDs', () => {
    expect(burningWheelCatalog.stocks.map(({ id }) => id)).toEqual([
      'man',
      'dwarf',
      'elf',
      'orc',
      'roden',
      'wolf',
      'troll',
    ]);
    expect(burningWheelLifepaths).toHaveLength(613);
    expect(burningWheelSkills).toHaveLength(493);
    expect(burningWheelTraits).toHaveLength(863);
    for (const entries of [
      burningWheelLifepaths,
      burningWheelSkills,
      burningWheelTraits,
    ]) {
      expect(new Set(entries.map(({ id }) => id)).size).toBe(entries.length);
    }
  });

  it('merges Wizard, Dark Elf, Troll, Roden, and Great Wolf material', () => {
    expect(
      lifepathsForStock('man').some(
        ({ setting }) => setting === 'College of Magic Setting',
      ),
    ).toBe(true);
    expect(
      lifepathsForStock('elf').some(
        ({ setting }) => setting === 'Path Of Spite Subsetting',
      ),
    ).toBe(true);
    expect(lifepathsForStock('troll').length).toBeGreaterThan(0);
    expect(lifepathsForStock('roden').length).toBeGreaterThan(0);
    expect(lifepathsForStock('wolf').length).toBeGreaterThan(0);
  });

  it('retains upstream provenance and rule expressions', () => {
    expect(burningWheelCatalog.provenance).toMatchObject({
      project: 'Charred Black',
      license: 'GPL-3.0',
    });
    const elder = burningWheelLifepaths.find(
      ({ stock, name }) => stock === 'man' && name === 'Elder',
    );
    expect(elder?.definition.requires_expr).toEqual([
      '+and',
      ['+has_n_lifepaths_or_more', 4],
      ['+age_greater_than', 35],
    ]);
  });
});
