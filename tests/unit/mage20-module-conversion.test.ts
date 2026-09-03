import { describe, expect, it } from 'vitest';
import { createMageStoredCharacter } from '../../src/games/mage20/character-adapter';
import { convertMageCharacterToModuleCopy } from '../../src/games/mage20/module/convert-character';
import { mage20Phase2Module } from '../../src/games/mage20/module/mage20-phase2-module';
import { validateModuleEnvelope } from '../../src/modules/registry/module-validation';
import {
  prepareImportedRecord,
  serializeCharacter,
} from '../../src/features/import-export/character-files';
import { gameSystemRegistry } from '../../src/games/registry';
import { ModuleRegistry } from '../../src/modules/registry/module-registry';
import { MAGE20_BUNDLED_LOCK_ID } from '../../src/games/mage20/module/bundled-module';
import { mageCharacterDataSchema } from '../../src/systems/mage-m20/character-schema';

describe('Mage 20 declarative module parity', () => {
  it('validates complete defaults and carries every legacy data family', () => {
    const module = validateModuleEnvelope(mage20Phase2Module);
    expect(module.catalogs.map(({ id }) => id)).toEqual([
      'backgrounds',
      'merits-flaws',
      'focus',
      'wonders',
      'rotes',
      'equipment',
      'maneuvers',
    ]);
    expect(module.sheetTemplates[0]?.sections.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        'maneuvers',
        'backgrounds',
        'merits-flaws',
        'focus',
        'wonders',
        'rotes',
        'equipment',
        'experience',
      ]),
    );
  });

  it('creates a copy, preserves source data, and records provenance', () => {
    const source = createMageStoredCharacter(
      new Date('2026-08-24T12:00:00.000Z'),
      '11111111-1111-4111-8111-111111111111',
    );
    const sourceBefore = structuredClone(source);
    const copy = convertMageCharacterToModuleCopy(
      source,
      new Date('2026-08-24T13:00:00.000Z'),
      '22222222-2222-4222-8222-222222222222',
    );
    expect(source).toEqual(sourceBefore);
    expect(copy.id).toBe('22222222-2222-4222-8222-222222222222');
    expect(copy.moduleRef).toMatchObject({
      dependencyLockId: MAGE20_BUNDLED_LOCK_ID,
      convertedFromCharacterId: '11111111-1111-4111-8111-111111111111',
    });
    const expected = Object.fromEntries(
      Object.entries(mageCharacterDataSchema.parse(source.data)).filter(
        ([key]) => key !== 'development' && key !== 'sourcePreferences',
      ),
    );
    expect(copy.data).toEqual(expected);
  });

  it('converts the oldest supported Mage schema through the existing migration path', () => {
    const current = createMageStoredCharacter();
    const data = current.data as Record<string, unknown>;
    const legacy = {
      ...current,
      systemVersion: 1,
      data: {
        identity: data.identity,
        attributes: data.attributes,
        spheres: data.spheres,
        affinitySphere: data.affinitySphere,
        health: data.health,
        repeatableEntries: {
          backgrounds: [],
          merits: [],
          flaws: [],
          focus: [],
          wonders: [],
          rotes: [],
        },
      },
    };
    const copy = convertMageCharacterToModuleCopy(legacy);
    expect(copy.data).toMatchObject({
      abilities: { skills: { do: 0 } },
      experience: { total: 0, current: 0 },
      repeatableEntries: {
        backgrounds: [],
        merits: [],
        flaws: [],
        equipment: [],
      },
    });
  });

  it.each(['json', 'yaml'] as const)(
    'round-trips module characters through %s',
    (format) => {
      const module = validateModuleEnvelope(mage20Phase2Module);
      const registry = new ModuleRegistry().register(module).registerLock({
        id: MAGE20_BUNDLED_LOCK_ID,
        moduleId: module.moduleId,
        moduleVersion: module.moduleVersion,
        dependencies: [],
        createdAt: '2026-08-24T00:00:00.000Z',
      });
      const copy = convertMageCharacterToModuleCopy(
        createMageStoredCharacter(),
      );
      const imported = prepareImportedRecord(
        serializeCharacter(copy, format),
        `mage.${format}`,
        gameSystemRegistry,
        undefined,
        undefined,
        registry,
      );
      expect(imported.data).toEqual(copy.data);
      expect(imported.moduleRef).toEqual(copy.moduleRef);
    },
  );
});
