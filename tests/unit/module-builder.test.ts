import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createModuleDraft } from '../../src/features/module-builder/create-module-draft';
import { validateModuleEnvelope } from '../../src/modules/registry/module-validation';
import { MageDatabase } from '../../src/storage/mage-database';
import { DexieModuleRepository } from '../../src/modules/repository/dexie-module-repository';

const databases: MageDatabase[] = [];
afterEach(async () => {
  await Promise.all(databases.map((database) => database.delete()));
  databases.length = 0;
});

describe('local module builder drafts', () => {
  it('creates an installable safe starter module', () => {
    const module = validateModuleEnvelope(createModuleDraft('Test Project'));
    expect(module.name).toBe('Test Project');
    expect(module.gameNodes).toHaveLength(1);
    expect(module.sheetTemplates[0]?.sections[0]?.componentIds).toEqual([
      'character-name',
    ]);
    expect(module.sheetTemplates[0]?.navigationGroups).toEqual([
      { id: 'character', label: 'Character', order: 0 },
    ]);
    expect(module.sheetTemplates[0]?.modes.map(({ id }) => id)).toEqual([
      'build',
      'play',
    ]);
    expect(module.reusableComponents[0]?.layout).toEqual({ width: 'full' });
    expect(module.themes).toEqual([]);
  });

  it('stores invalid and valid drafts separately from characters', async () => {
    const database = new MageDatabase(`module-builder-${crypto.randomUUID()}`);
    databases.push(database);
    const repository = new DexieModuleRepository(database);
    const valid = createModuleDraft();
    const base = {
      id: crypto.randomUUID(),
      name: valid.name,
      updatedAt: new Date().toISOString(),
      diagnostics: [],
    };
    await repository.saveDraft({
      ...base,
      moduleId: valid.moduleId,
      draft: valid,
    });
    await repository.saveDraft({
      ...base,
      id: crypto.randomUUID(),
      draft: '{',
    });
    expect(await repository.listDrafts()).toHaveLength(2);
    expect(await database.characters.count()).toBe(0);
    await repository.deleteDraft(base.id);
    expect(await repository.getDraft(base.id)).toBeNull();
  });
});
