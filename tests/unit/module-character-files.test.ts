import { describe, expect, it } from 'vitest';
import {
  prepareImportedRecord,
  serializeCharacter,
} from '../../src/features/import-export/character-files';
import { gameSystemRegistry } from '../../src/games/registry';
import { ModuleRegistry } from '../../src/modules/registry/module-registry';
import type { StoredCharacter } from '../../src/storage/stored-character';
import { createSyntheticModule } from '../fixtures/synthetic-module';

describe('module-backed character files', () => {
  it('uses format version 2 and round-trips module provenance without catalogs', () => {
    const module = new ModuleRegistry().register(createSyntheticModule());
    const envelope = module.list()[0]!;
    const record: StoredCharacter = {
      id: 'source-character',
      systemId: 'arcane-module',
      systemVersion: 1,
      name: 'Test Character',
      createdAt: '2026-08-24T12:00:00.000Z',
      updatedAt: '2026-08-24T12:00:00.000Z',
      moduleRef: {
        moduleId: envelope.moduleId,
        moduleVersion: envelope.moduleVersion,
        gameNodeId: 'test-variant',
        sheetTemplateId: 'test-sheet',
        sheetTemplateVersion: 1,
        dependencyLockId: '21f2e76d-d718-433d-b836-8dd35f455c84',
        enabledOverlayRefs: [],
      },
      data: structuredClone(envelope.sheetTemplates[0]!.defaults),
    };

    const serialized = serializeCharacter(record, 'json');
    expect(JSON.parse(serialized)).toMatchObject({
      formatVersion: 2,
      moduleRef: record.moduleRef,
    });
    expect(serialized).not.toContain('reusableComponents');
    expect(serialized).not.toContain('Synthetic Test Reference');

    const imported = prepareImportedRecord(
      serialized,
      'test-character.json',
      gameSystemRegistry,
      new Date('2026-08-25T12:00:00.000Z'),
      'imported-character',
      module,
    );
    expect(imported).toMatchObject({
      id: 'imported-character',
      name: 'Test Character (Imported)',
      moduleRef: record.moduleRef,
      data: record.data,
    });
  });

  it('preserves a character whose module is unavailable for later recovery', () => {
    const module = new ModuleRegistry()
      .register(createSyntheticModule())
      .list()[0]!;
    const record: StoredCharacter = {
      id: 'missing-source',
      systemId: 'arcane-module',
      systemVersion: 1,
      name: 'Missing Module Character',
      createdAt: '2026-08-24T12:00:00.000Z',
      updatedAt: '2026-08-24T12:00:00.000Z',
      moduleRef: {
        moduleId: module.moduleId,
        moduleVersion: module.moduleVersion,
        gameNodeId: 'test-variant',
        sheetTemplateId: 'test-sheet',
        sheetTemplateVersion: 1,
        dependencyLockId: 'd98de47b-5b26-4d8f-9852-2877492d45c2',
        enabledOverlayRefs: [],
      },
      data: { preserve: 'exactly' },
    };
    const imported = prepareImportedRecord(
      serializeCharacter(record, 'yaml'),
      'missing.yaml',
      gameSystemRegistry,
      new Date('2026-08-25T12:00:00.000Z'),
      'missing-import',
      new ModuleRegistry(),
    );
    expect(imported.data).toEqual({ preserve: 'exactly' });
    expect(imported.moduleRef).toEqual(record.moduleRef);
  });
});
