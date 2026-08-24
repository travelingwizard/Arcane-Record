import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RegistryClient } from '../../src/modules/registry/registry-client';
import { calculateModuleChecksum } from '../../src/modules/interchange/module-files';
import { DexieModuleRepository } from '../../src/modules/repository/dexie-module-repository';
import { ModuleRegistry } from '../../src/modules/registry/module-registry';
import { MageDatabase } from '../../src/storage/mage-database';
import { createSyntheticModule } from '../fixtures/synthetic-module';
import { validateModuleEnvelope } from '../../src/modules/registry/module-validation';

let database: MageDatabase | undefined;
afterEach(async () => {
  vi.unstubAllGlobals();
  await database?.delete();
  database = undefined;
});

describe('hosted registry client', () => {
  it('downloads, verifies, and installs without sending credentials', async () => {
    const module = validateModuleEnvelope(createSyntheticModule());
    const checksum = await calculateModuleChecksum(module);
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(module), { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    database = new MageDatabase(`registry-client-${crypto.randomUUID()}`);
    const repository = new DexieModuleRepository(database);
    await new RegistryClient('https://registry.example').downloadAndInstall(
      {
        moduleId: module.moduleId,
        moduleVersion: module.moduleVersion,
        checksum,
        publishedAt: new Date().toISOString(),
        recommended: true,
      },
      repository,
      new ModuleRegistry(),
    );
    expect((await repository.listPackages())[0]?.origin).toBe('published');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/modules/'),
      expect.objectContaining({ credentials: 'omit' }),
    );
  });

  it('rejects tampered bytes before IndexedDB installation', async () => {
    const module = validateModuleEnvelope(createSyntheticModule());
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(module), { status: 200 }),
        ),
    );
    database = new MageDatabase(`registry-client-${crypto.randomUUID()}`);
    const repository = new DexieModuleRepository(database);
    await expect(
      new RegistryClient('https://registry.example').downloadAndInstall(
        {
          moduleId: module.moduleId,
          moduleVersion: module.moduleVersion,
          checksum: '0'.repeat(64),
          publishedAt: new Date().toISOString(),
          recommended: true,
        },
        repository,
        new ModuleRegistry(),
      ),
    ).rejects.toThrow(/checksum/i);
    expect(await repository.listPackages()).toEqual([]);
  });
});
