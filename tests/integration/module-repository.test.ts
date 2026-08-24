import { afterEach, describe, expect, it } from 'vitest';
import {
  stageModuleFile,
  installStagedModule,
} from '../../src/modules/interchange/module-files';
import { DexieModuleRepository } from '../../src/modules/repository/dexie-module-repository';
import { MageDatabase } from '../../src/storage/mage-database';
import { createSyntheticModule } from '../fixtures/synthetic-module';

describe('module repository', () => {
  let database: MageDatabase | undefined;

  afterEach(async () => {
    await database?.delete();
  });

  it('installs a staged package, activation record, and exact lock atomically', async () => {
    database = new MageDatabase(`arcane-modules-${crypto.randomUUID()}`);
    const repository = new DexieModuleRepository(database);
    const staged = await stageModuleFile(
      JSON.stringify(createSyntheticModule()),
      'synthetic.json',
    );
    const installed = await installStagedModule(staged, repository);

    expect(installed).toMatchObject({
      moduleId: 'net.example.arcane-test',
      moduleVersion: '1.0.0',
      origin: 'local',
    });
    expect(await repository.listPackages()).toHaveLength(1);
    expect(await repository.listInstallations()).toEqual([
      expect.objectContaining({
        moduleId: 'net.example.arcane-test',
        activeVersion: '1.0.0',
        enabled: true,
      }),
    ]);
    expect(await database.moduleLocks.count()).toBe(1);

    await repository.setInstallationEnabled('net.example.arcane-test', false);
    expect((await repository.listInstallations())[0]?.enabled).toBe(false);
    await repository.activateVersion('net.example.arcane-test', '1.0.0');
    expect(await repository.listInstallations()).toEqual([
      expect.objectContaining({ activeVersion: '1.0.0', enabled: true }),
    ]);
    await installStagedModule(staged, repository);
    expect(await repository.listPackages()).toHaveLength(1);
    expect(await database.moduleLocks.count()).toBe(1);

    const draft = await repository.saveDraft({
      id: crypto.randomUUID(),
      moduleId: 'net.example.arcane-test',
      name: 'Test draft',
      updatedAt: new Date().toISOString(),
      draft: { incomplete: true },
      diagnostics: [{ code: 'expected-draft-error' }],
    });
    expect(await repository.getDraft(draft.id)).toEqual(draft);
  });

  it('rejects immutable-version checksum conflicts without replacing the package', async () => {
    database = new MageDatabase(
      `arcane-module-conflict-${crypto.randomUUID()}`,
    );
    const repository = new DexieModuleRepository(database);
    const staged = await stageModuleFile(
      JSON.stringify(createSyntheticModule()),
      'synthetic.json',
    );
    const original = await installStagedModule(staged, repository);

    await expect(
      repository.install({
        envelope: staged.envelope!,
        checksum: 'different-checksum',
        origin: 'local',
        installedAt: new Date().toISOString(),
        lock: {
          id: crypto.randomUUID(),
          moduleId: staged.envelope!.moduleId,
          moduleVersion: staged.envelope!.moduleVersion,
          dependencies: [],
          createdAt: new Date().toISOString(),
        },
      }),
    ).rejects.toThrow(/different checksum/i);
    expect(await repository.listPackages()).toEqual([original]);
    expect(await database.moduleLocks.count()).toBe(1);
  });
});
