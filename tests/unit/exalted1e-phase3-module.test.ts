import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import { EXALTED1E_SCHEMA_VERSION } from '../../src/games/exalted1e/definitions';
import { getBundledExalted1eModuleRecords } from '../../src/games/exalted1e/module/bundled-module';
import { convertExaltedCharacterToModuleCopy } from '../../src/games/exalted1e/module/convert-character';
import { exalted1ePhase3Module } from '../../src/games/exalted1e/module/exalted1e-phase3-module';
import {
  EXALTED1E_DRAGON_BLOODED_NODE_ID,
  EXALTED1E_DRAGON_BLOODED_SHEET_ID,
  EXALTED1E_MODULE_ID,
  EXALTED1E_MODULE_VERSION,
  EXALTED1E_SOLAR_NODE_ID,
  EXALTED1E_SOLAR_SHEET_ID,
} from '../../src/games/exalted1e/module/id-map';
import { dragonBloodedTraits } from '../../src/games/exalted1e/reference/dragonblooded-merits-flaws';
import {
  dragonBloodedCharms,
  dragonBloodedSpells,
} from '../../src/games/exalted1e/reference/dragonblooded-powers';
import { ModuleRegistry } from '../../src/modules/registry/module-registry';
import { validateModuleEnvelope } from '../../src/modules/registry/module-validation';
import { ARCANE_MODULE_SYSTEM_ID } from '../../src/storage/stored-character';

const timestamp = '2026-08-24T12:00:00.000Z';

function source(sheetType: 'solar' | 'dragon-blooded', version = 6) {
  const data = createBlankExaltedCharacter(sheetType);
  data.identity.name = sheetType === 'solar' ? 'Aurelia' : 'Mnemon Ragara';
  return {
    id: `source-${sheetType}-${version}`,
    systemId: 'exalted1e',
    systemVersion: version,
    name: data.identity.name,
    createdAt: timestamp,
    updatedAt: timestamp,
    data,
  };
}

describe('Exalted First Edition Phase 3 module', () => {
  it('validates one shared root and resolves Solar and Dragon-Blooded children', () => {
    const module = validateModuleEnvelope(exalted1ePhase3Module);
    const registry = new ModuleRegistry().register(module);
    const solar = registry.resolve(
      EXALTED1E_MODULE_ID,
      EXALTED1E_MODULE_VERSION,
      EXALTED1E_SOLAR_NODE_ID,
      EXALTED1E_SOLAR_SHEET_ID,
      1,
    );
    const dragonBlooded = registry.resolve(
      EXALTED1E_MODULE_ID,
      EXALTED1E_MODULE_VERSION,
      EXALTED1E_DRAGON_BLOODED_NODE_ID,
      EXALTED1E_DRAGON_BLOODED_SHEET_ID,
      1,
    );

    expect(solar.inheritedGameNodes.map(({ id }) => id)).toEqual([
      'exalted-first-edition',
      'solar',
    ]);
    expect(dragonBlooded.inheritedGameNodes.map(({ id }) => id)).toEqual([
      'exalted-first-edition',
      'dragon-blooded',
    ]);
    expect(
      solar.resolvedDefinitionRefs.filter((id) =>
        id.includes('shared-advancement'),
      ),
    ).toHaveLength(1);
    expect(dragonBlooded.resolvedOverrides).toEqual([
      expect.objectContaining({
        target: 'catalog/advancement/shared-advancement',
      }),
    ]);
  });

  it('keeps exact catalog counts, unique IDs, and child availability', () => {
    const traits = exalted1ePhase3Module.catalogs.find(
      ({ id }) => id === 'dragon-blooded-traits',
    )!;
    const powers = exalted1ePhase3Module.catalogs.find(
      ({ id }) => id === 'dragon-blooded-powers',
    )!;
    expect(traits.entries).toHaveLength(dragonBloodedTraits.length + 1);
    expect(powers.entries).toHaveLength(
      dragonBloodedCharms.length + dragonBloodedSpells.length + 1,
    );
    expect(new Set(traits.entries.map(({ id }) => id))).toHaveLength(
      traits.entries.length,
    );
    expect(new Set(powers.entries.map(({ id }) => id))).toHaveLength(
      powers.entries.length,
    );
    const solar = exalted1ePhase3Module.sheetTemplates.find(
      ({ id }) => id === EXALTED1E_SOLAR_SHEET_ID,
    )!;
    expect(
      solar.sections.find(({ id }) => id === 'solar-powers')?.description,
    ).toContain('Preview placeholder');
  });

  it.each([1, 2, 3, 4, 5, 6])(
    'converts schema version %s copy-first without changing the source',
    (version) => {
      const legacy = source('dragon-blooded', version);
      const snapshot = structuredClone(legacy);
      const converted = convertExaltedCharacterToModuleCopy(
        legacy,
        new Date(timestamp),
        `converted-${version}`,
      );
      expect(legacy).toEqual(snapshot);
      expect(converted.systemId).toBe(ARCANE_MODULE_SYSTEM_ID);
      expect(converted.systemVersion).toBe(EXALTED1E_SCHEMA_VERSION);
      expect(converted.moduleRef).toMatchObject({
        convertedFromCharacterId: legacy.id,
        gameNodeId: EXALTED1E_DRAGON_BLOODED_NODE_ID,
      });
      expect(converted.data).toMatchObject({
        sheetType: 'dragon-blooded',
        sheetLayout: { mode: 'build' },
      });
    },
  );

  it('preserves unknown owned references as repairable module records', () => {
    const legacy = source('dragon-blooded');
    const data = legacy.data as ReturnType<typeof createBlankExaltedCharacter>;
    data.backgrounds.push({
      id: '688bd0c3-90da-42a7-8576-f9f8efdbeb24',
      definitionId: 'lost-background' as never,
      rating: 4,
      notes: 'Owned notes survive.',
      label: 'The Vanished Archive',
      description: 'A custom legacy record.',
      linkedEntityIds: [],
      createdAt: timestamp,
    });
    data.powers.charms.push({
      id: '42f144f3-2fae-4495-bcff-c9054540e471',
      definitionId: 'lost-charm',
      notes: 'Do not discard.',
    });

    const converted = convertExaltedCharacterToModuleCopy(
      legacy,
      new Date(timestamp),
      'converted-unresolved',
    );
    const convertedData = converted.data as {
      backgrounds: Array<Record<string, unknown>>;
      powers: { charms: Array<Record<string, unknown>> };
    };
    expect(convertedData.backgrounds[0]).toMatchObject({
      definitionId: 'lost-background',
      rating: 4,
      notes: 'Owned notes survive.',
      unresolvedReference: {
        definitionId: 'lost-background',
        label: 'The Vanished Archive',
      },
    });
    expect(convertedData.powers.charms[0]).toMatchObject({
      definitionId: 'lost-charm',
      notes: 'Do not discard.',
      unresolvedReference: { definitionId: 'lost-charm' },
    });
  });

  it('converts Solar records to the Solar child without filling placeholders', () => {
    const legacy = source('solar');
    const converted = convertExaltedCharacterToModuleCopy(
      legacy,
      new Date(timestamp),
      'converted-solar',
    );
    expect(converted.moduleRef).toMatchObject({
      gameNodeId: EXALTED1E_SOLAR_NODE_ID,
      sheetTemplateId: EXALTED1E_SOLAR_SHEET_ID,
    });
    expect(converted.data).toMatchObject({
      sheetType: 'solar',
      meritsFlaws: { merits: [], flaws: [] },
      powers: { charms: [], spells: [] },
    });
  });

  it('provides a deterministic bundled package and dependency lock', async () => {
    const first = await getBundledExalted1eModuleRecords();
    const second = await getBundledExalted1eModuleRecords();
    expect(first).toEqual(second);
    expect(first.packageRecord.origin).toBe('bundled');
    expect(first.lock.dependencies).toEqual([]);
  });
});
