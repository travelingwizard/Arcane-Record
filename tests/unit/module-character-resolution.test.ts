import { describe, expect, it } from 'vitest';
import { resolveCharacter } from '../../src/games/resolve-character';
import { gameSystemRegistry } from '../../src/games/registry';
import { ModuleRegistry } from '../../src/modules/registry/module-registry';
import type { StoredCharacter } from '../../src/storage/stored-character';
import { createSyntheticModule } from '../fixtures/synthetic-module';

function moduleCharacter(data: unknown): StoredCharacter {
  return {
    id: 'module-character',
    systemId: 'arcane-module',
    systemVersion: 1,
    name: 'Module Character',
    createdAt: '2026-08-24T12:00:00.000Z',
    updatedAt: '2026-08-24T12:00:00.000Z',
    moduleRef: {
      moduleId: 'net.example.arcane-test',
      moduleVersion: '1.0.0',
      gameNodeId: 'test-variant',
      sheetTemplateId: 'test-sheet',
      sheetTemplateVersion: 1,
      dependencyLockId: '4d3cb12a-e094-4794-adb8-87c9fd051944',
      enabledOverlayRefs: [],
    },
    data,
  };
}

describe('module-backed character resolution', () => {
  it('coexists with legacy interpreters and resolves an installed module', () => {
    const moduleRegistry = new ModuleRegistry()
      .register(createSyntheticModule())
      .registerLock({
        id: '4d3cb12a-e094-4794-adb8-87c9fd051944',
        moduleId: 'net.example.arcane-test',
        moduleVersion: '1.0.0',
        dependencies: [],
        createdAt: '2026-08-24T12:00:00.000Z',
      });
    const data = moduleRegistry.list()[0]!.sheetTemplates[0]!.defaults;
    const resolved = resolveCharacter(
      moduleCharacter(data),
      gameSystemRegistry,
      moduleRegistry,
    );
    expect(resolved).toMatchObject({
      status: 'available',
      interpreter: 'module',
      system: { shortName: 'Test Variant' },
    });
  });

  it('distinguishes a missing module from invalid module-owned data', () => {
    expect(
      resolveCharacter(
        moduleCharacter({ preserve: 'raw' }),
        gameSystemRegistry,
        new ModuleRegistry(),
      ),
    ).toMatchObject({
      status: 'unavailable',
      record: { data: { preserve: 'raw' } },
    });

    const moduleRegistry = new ModuleRegistry()
      .register(createSyntheticModule())
      .registerLock({
        id: '4d3cb12a-e094-4794-adb8-87c9fd051944',
        moduleId: 'net.example.arcane-test',
        moduleVersion: '1.0.0',
        dependencies: [],
        createdAt: '2026-08-24T12:00:00.000Z',
      });
    expect(
      resolveCharacter(
        moduleCharacter({ preserve: 'invalid but recoverable' }),
        gameSystemRegistry,
        moduleRegistry,
      ),
    ).toMatchObject({ status: 'invalid' });
  });

  it('does not silently ignore deferred homebrew overlays', () => {
    const moduleRegistry = new ModuleRegistry()
      .register(createSyntheticModule())
      .registerLock({
        id: '4d3cb12a-e094-4794-adb8-87c9fd051944',
        moduleId: 'net.example.arcane-test',
        moduleVersion: '1.0.0',
        dependencies: [],
        createdAt: '2026-08-24T12:00:00.000Z',
      });
    const record = moduleCharacter(
      moduleRegistry.list()[0]!.sheetTemplates[0]!.defaults,
    );
    record.moduleRef!.enabledOverlayRefs = [
      { moduleId: 'net.example.overlay', moduleVersion: '1.0.0' },
    ];
    expect(
      resolveCharacter(record, gameSystemRegistry, moduleRegistry),
    ).toMatchObject({
      status: 'unavailable',
      message: expect.stringMatching(/overlays/i),
    });
  });
});
