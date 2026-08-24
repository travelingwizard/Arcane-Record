import { describe, expect, it } from 'vitest';
import { ModuleValidationError } from '../../src/modules/diagnostics/module-diagnostic';
import { ModuleRegistry } from '../../src/modules/registry/module-registry';
import { validateModuleEnvelope } from '../../src/modules/registry/module-validation';
import { coreModuleComponentRegistry } from '../../src/modules/renderer/component-registry';
import { createSyntheticModule } from '../fixtures/synthetic-module';
import { migrateModuleCharacter } from '../../src/modules/migrations/module-migrations';

describe('Arcane module runtime', () => {
  it('validates and resolves a root, child game, and sheet', () => {
    const module = validateModuleEnvelope(createSyntheticModule());
    const resolved = new ModuleRegistry()
      .register(module)
      .resolve(
        module.moduleId,
        module.moduleVersion,
        'test-variant',
        'test-sheet',
        1,
      );

    expect(resolved.inheritedGameNodes.map(({ id }) => id)).toEqual([
      'test-game',
      'test-variant',
    ]);
    expect(resolved.resolvedDefinitionRefs).toEqual([
      'catalog/traits/test-entry',
    ]);
    expect(resolved.resolvedOverrides).toEqual([
      expect.objectContaining({ target: 'catalog/traits/test-entry' }),
    ]);
    expect(resolved.characterSchema.parse(resolved.template.defaults)).toEqual(
      resolved.template.defaults,
    );
  });

  it('rejects duplicate IDs, circular hierarchy, missing dependencies, and unknown paths', () => {
    const duplicate = createSyntheticModule();
    duplicate.gameNodes.push({ ...duplicate.gameNodes[0]! });
    expect(() => validateModuleEnvelope(duplicate)).toThrow(
      ModuleValidationError,
    );

    const circular = createSyntheticModule();
    circular.gameNodes[0]!.parentId = 'test-variant';
    expect(() => validateModuleEnvelope(circular)).toThrow(
      ModuleValidationError,
    );

    const badPath = createSyntheticModule();
    const name = badPath.reusableComponents.find(({ id }) => id === 'name')!;
    if ('dataPath' in name && name.dataPath) {
      name.dataPath.segments = ['missing'];
    }
    expect(() => validateModuleEnvelope(badPath)).toThrow(
      ModuleValidationError,
    );

    const dependent = createSyntheticModule({
      dependencies: [
        {
          moduleId: 'net.example.missing',
          version: '1.0.0',
          required: true,
          purpose: 'Test dependency',
        },
      ],
    });
    const registry = new ModuleRegistry().register(dependent);
    expect(() =>
      registry.resolve(
        dependent.moduleId,
        dependent.moduleVersion,
        'test-variant',
        'test-sheet',
        1,
      ),
    ).toThrow(ModuleValidationError);
  });

  it('registers only the approved safe component types', () => {
    expect(coreModuleComponentRegistry.list().map(({ type }) => type)).toEqual([
      'heading',
      'static-text',
      'text',
      'number',
      'dot-rating',
      'field-grid',
      'grouped-dot-ratings',
      'sphere-rating-wheel',
      'permanent-temporary-rating',
      'opposed-wheel-20',
      'cycling-damage-track',
      'mage20-background-catalog',
      'mage20-merits-flaws-catalog',
      'mage20-collection',
      'validation-summary',
    ]);
  });

  it('rejects deferred executable capabilities during activation', () => {
    expect(() =>
      validateModuleEnvelope(
        createSyntheticModule({
          actions: [{ id: 'unsafe-action', kind: 'deferred' }],
        }),
      ),
    ).toThrow(ModuleValidationError);
    expect(() =>
      validateModuleEnvelope(
        createSyntheticModule({ minimumCoreVersion: '99.0.0' }),
      ),
    ).toThrow(ModuleValidationError);
    const scripted = createSyntheticModule();
    Object.assign(scripted.reusableComponents[0]!, {
      script: 'alert(1)',
    });
    expect(() => validateModuleEnvelope(scripted)).toThrow(
      ModuleValidationError,
    );
    const unknownNestedField = createSyntheticModule();
    Object.assign(unknownNestedField.reusableComponents[0]!, {
      unsupportedDecoration: 'unknown',
    });
    expect(() => validateModuleEnvelope(unknownNestedField)).toThrow(
      ModuleValidationError,
    );
  });

  it('preserves missing catalog identity as an unresolved result', () => {
    const registry = new ModuleRegistry().register(createSyntheticModule());
    expect(
      registry.resolveCatalogDefinition(
        'net.example.arcane-test',
        '1.0.0',
        'merits',
        'unknown-merit',
      ),
    ).toMatchObject({
      status: 'unresolved',
      catalogId: 'merits',
      definitionId: 'unknown-merit',
    });
  });

  it('detects circular package dependencies', () => {
    const first = createSyntheticModule({
      moduleId: 'net.example.first',
      dependencies: [
        {
          moduleId: 'net.example.second',
          version: '1.0.0',
          required: true,
        },
      ],
    });
    const second = createSyntheticModule({
      moduleId: 'net.example.second',
      dependencies: [
        {
          moduleId: 'net.example.first',
          version: '1.0.0',
          required: true,
        },
      ],
    });
    const registry = new ModuleRegistry().register(first).register(second);
    expect(() =>
      registry.resolve(
        'net.example.first',
        '1.0.0',
        'test-variant',
        'test-sheet',
        1,
      ),
    ).toThrow(ModuleValidationError);
  });

  it('verifies exact dependency locks and installed checksums', () => {
    const dependency = validateModuleEnvelope(
      createSyntheticModule({ moduleId: 'net.example.dependency' }),
    );
    const root = validateModuleEnvelope(
      createSyntheticModule({
        moduleId: 'net.example.root',
        dependencies: [
          {
            moduleId: 'net.example.dependency',
            version: '1.0.0',
            required: true,
          },
        ],
      }),
    );
    const registry = new ModuleRegistry().replaceInstalled(
      [
        {
          moduleId: dependency.moduleId,
          moduleVersion: dependency.moduleVersion,
          checksum: 'installed-dependency-checksum',
          origin: 'local',
          installedAt: '2026-08-24T12:00:00.000Z',
          envelope: dependency,
        },
        {
          moduleId: root.moduleId,
          moduleVersion: root.moduleVersion,
          checksum: 'root-checksum',
          origin: 'local',
          installedAt: '2026-08-24T12:00:00.000Z',
          envelope: root,
        },
      ],
      [
        {
          id: 'd20608cc-58c9-4836-84ba-6a3ba0947237',
          moduleId: root.moduleId,
          moduleVersion: root.moduleVersion,
          dependencies: [
            {
              moduleId: dependency.moduleId,
              moduleVersion: dependency.moduleVersion,
              checksum: 'wrong-checksum',
            },
          ],
          createdAt: '2026-08-24T12:00:00.000Z',
        },
      ],
    );
    expect(() =>
      registry.resolve(
        root.moduleId,
        root.moduleVersion,
        'test-variant',
        'test-sheet',
        1,
        'd20608cc-58c9-4836-84ba-6a3ba0947237',
      ),
    ).toThrow(ModuleValidationError);
  });

  it('runs declarative migrations on a clone and validates the result', () => {
    const input = createSyntheticModule({
      moduleVersion: '2.0.0',
      migrations: [
        {
          id: 'add-resource',
          fromVersion: '1.0.0',
          toVersion: '2.0.0',
          operations: [
            {
              type: 'set-default-if-missing',
              path: {
                root: 'character',
                segments: ['traits', 'resource'],
              },
              value: 3,
            },
          ],
        },
      ],
    });
    const registry = new ModuleRegistry().register(input);
    const resolved = registry.resolve(
      'net.example.arcane-test',
      '2.0.0',
      'test-variant',
      'test-sheet',
      1,
    );
    const legacy = structuredClone(resolved.template.defaults) as {
      traits: { resource?: number };
    };
    delete legacy.traits.resource;
    const migrated = migrateModuleCharacter(resolved, '1.0.0', legacy);

    expect(migrated).toMatchObject({ traits: { resource: 3 } });
    expect(legacy.traits).not.toHaveProperty('resource');
  });
});
