import { describe, expect, it } from 'vitest';
import {
  mage20DefinitionIdMap,
  resolveMage20DefinitionId,
} from '../../src/games/mage20/module/id-map';
import { backgroundCatalog } from '../../src/systems/mage-m20/reference/backgrounds';
import { equipmentCatalog } from '../../src/systems/mage-m20/reference/equipment';
import { meritFlawCatalog } from '../../src/systems/mage-m20/reference/merits-flaws';

describe('Mage 20 declarative definition ID map', () => {
  it('freezes unique stable IDs for every existing definition family', () => {
    for (const mapping of Object.values(mage20DefinitionIdMap)) {
      const values = Object.values(mapping);
      expect(Object.isFrozen(mapping)).toBe(true);
      expect(new Set(values).size).toBe(values.length);
      expect(
        values.every((id) => /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id)),
      ).toBe(true);
    }
  });

  it('maps the current selectable catalogs without renaming IDs', () => {
    expect(Object.keys(mage20DefinitionIdMap.backgrounds)).toEqual(
      backgroundCatalog.map(({ id }) => id),
    );
    expect(Object.keys(mage20DefinitionIdMap.merits)).toEqual(
      meritFlawCatalog
        .filter(({ kind }) => kind === 'merit')
        .map(({ id }) => id),
    );
    expect(Object.keys(mage20DefinitionIdMap.flaws)).toEqual(
      meritFlawCatalog
        .filter(({ kind }) => kind === 'flaw')
        .map(({ id }) => id),
    );
    expect(Object.keys(mage20DefinitionIdMap.equipment)).toEqual(
      equipmentCatalog.map(({ id }) => id),
    );
  });

  it('preserves an unresolved ID as a visible fallback', () => {
    expect(resolveMage20DefinitionId('backgrounds', 'allies')).toEqual({
      status: 'available',
      definitionId: 'allies',
      moduleDefinitionId: 'allies',
    });
    expect(resolveMage20DefinitionId('rotes', '108-plum-blossoms')).toEqual({
      status: 'available',
      definitionId: '108-plum-blossoms',
      moduleDefinitionId: 'definition-108-plum-blossoms',
    });
    expect(
      resolveMage20DefinitionId('backgrounds', 'homebrew-network'),
    ).toEqual({
      status: 'unresolved',
      kind: 'backgrounds',
      definitionId: 'homebrew-network',
      fallbackLabel: 'Unknown backgrounds definition (homebrew-network)',
    });
  });
});
