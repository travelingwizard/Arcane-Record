import {
  ModuleValidationError,
  type ModuleDiagnostic,
} from '../diagnostics/module-diagnostic';
import type {
  ArcaneModuleEnvelope,
  GameNodeDefinition,
  SheetTemplateDefinition,
} from '../schema/module-envelope';
import { buildModuleCharacterSchema } from '../schema/character-schema';
import { validateModuleEnvelope } from './module-validation';
import {
  moduleLockRecordSchema,
  modulePackageRecordSchema,
  type ModuleLockRecord,
  type ModulePackageRecord,
} from '../repository/module-records';

export interface ResolvedModuleSheet {
  module: ArcaneModuleEnvelope;
  template: SheetTemplateDefinition;
  gameNode: GameNodeDefinition;
  inheritedGameNodes: GameNodeDefinition[];
  resolvedDefinitionRefs: string[];
  resolvedOverrides: GameNodeDefinition['overrides'];
  characterSchema: ReturnType<typeof buildModuleCharacterSchema>;
}

const keyFor = (moduleId: string, moduleVersion: string) =>
  `${moduleId}@${moduleVersion}`;

export class ModuleRegistry {
  private readonly packages = new Map<string, ArcaneModuleEnvelope>();
  private readonly packageChecksums = new Map<string, string>();
  private readonly locks = new Map<string, ModuleLockRecord>();
  private registryRevision = 0;

  register(input: unknown) {
    const module = validateModuleEnvelope(input);
    const key = keyFor(module.moduleId, module.moduleVersion);
    if (this.packages.has(key)) {
      throw new ModuleValidationError(
        'The module version is already registered.',
        [
          {
            code: 'duplicate-module-version',
            severity: 'error',
            path: '/moduleVersion',
            message: `Module “${key}” is already registered.`,
          },
        ],
      );
    }
    this.packages.set(key, module);
    this.registryRevision += 1;
    return this;
  }

  replace(packages: readonly unknown[]) {
    const next = new ModuleRegistry();
    packages.forEach((module) => next.register(module));
    this.packages.clear();
    this.packageChecksums.clear();
    this.locks.clear();
    next.list().forEach((module) => {
      this.packages.set(keyFor(module.moduleId, module.moduleVersion), module);
    });
    this.registryRevision += 1;
    return this;
  }

  replaceInstalled(
    packages: readonly ModulePackageRecord[],
    locks: readonly ModuleLockRecord[],
  ) {
    const next = new ModuleRegistry();
    packages.forEach((input) => {
      const record = modulePackageRecordSchema.parse(input);
      next.register(record.envelope);
      next.packageChecksums.set(
        keyFor(record.moduleId, record.moduleVersion),
        record.checksum,
      );
    });
    locks.forEach((lock) => next.registerLock(lock));
    this.packages.clear();
    this.packageChecksums.clear();
    this.locks.clear();
    next.list().forEach((module) => {
      const key = keyFor(module.moduleId, module.moduleVersion);
      this.packages.set(key, module);
      const checksum = next.packageChecksums.get(key);
      if (checksum) this.packageChecksums.set(key, checksum);
    });
    next.locks.forEach((lock, id) => this.locks.set(id, lock));
    this.registryRevision += 1;
    return this;
  }

  registerLock(input: ModuleLockRecord) {
    const lock = moduleLockRecordSchema.parse(input);
    const existing = this.locks.get(lock.id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(lock)) {
      throw new ModuleValidationError('The dependency lock ID is immutable.', [
        {
          code: 'dependency-lock-conflict',
          severity: 'error',
          path: '/dependencyLockId',
          message: `Dependency lock “${lock.id}” is already registered with different content.`,
        },
      ]);
    }
    this.locks.set(lock.id, lock);
    this.registryRevision += 1;
    return this;
  }

  findCompatibleLock(moduleId: string, moduleVersion: string) {
    return [...this.locks.values()].find(
      (lock) =>
        lock.moduleId === moduleId && lock.moduleVersion === moduleVersion,
    );
  }

  get(moduleId: string, moduleVersion: string) {
    return this.packages.get(keyFor(moduleId, moduleVersion));
  }

  list() {
    return [...this.packages.values()];
  }

  get revision() {
    return this.registryRevision;
  }

  resolve(
    moduleId: string,
    moduleVersion: string,
    gameNodeId: string,
    sheetTemplateId: string,
    sheetTemplateVersion: number,
    dependencyLockId?: string,
  ): ResolvedModuleSheet {
    const diagnostics: ModuleDiagnostic[] = [];
    const root = this.get(moduleId, moduleVersion);
    if (!root) {
      throw new ModuleValidationError('The required module is unavailable.', [
        {
          code: 'missing-module',
          severity: 'error',
          path: '/moduleRef',
          message: `Module “${moduleId}@${moduleVersion}” is not installed.`,
        },
      ]);
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (module: ArcaneModuleEnvelope) => {
      const key = keyFor(module.moduleId, module.moduleVersion);
      if (visiting.has(key)) {
        diagnostics.push({
          code: 'circular-module-dependency',
          severity: 'error',
          path: '/dependencies',
          message: `Circular module dependency includes “${key}”.`,
        });
        return;
      }
      if (visited.has(key)) return;
      visiting.add(key);
      for (const dependency of module.dependencies) {
        const target = this.get(dependency.moduleId, dependency.version);
        if (!target) {
          if (dependency.required) {
            diagnostics.push({
              code: 'missing-module-dependency',
              severity: 'error',
              path: '/dependencies',
              message: `Required dependency “${dependency.moduleId}@${dependency.version}” is not installed.`,
            });
          }
          continue;
        }
        visit(target);
      }
      visiting.delete(key);
      visited.add(key);
    };
    visit(root);

    if (dependencyLockId) {
      const lock = this.locks.get(dependencyLockId);
      if (
        !lock ||
        lock.moduleId !== moduleId ||
        lock.moduleVersion !== moduleVersion
      ) {
        diagnostics.push({
          code: 'missing-dependency-lock',
          severity: 'error',
          path: '/moduleRef/dependencyLockId',
          message: `Dependency lock “${dependencyLockId}” is unavailable or belongs to another module version.`,
        });
      } else {
        const required = root.dependencies.filter(({ required }) => required);
        for (const dependency of required) {
          const locked = lock.dependencies.find(
            (candidate) => candidate.moduleId === dependency.moduleId,
          );
          if (!locked || locked.moduleVersion !== dependency.version) {
            diagnostics.push({
              code: 'dependency-lock-mismatch',
              severity: 'error',
              path: '/moduleRef/dependencyLockId',
              message: `Dependency lock does not pin “${dependency.moduleId}@${dependency.version}”.`,
            });
            continue;
          }
          const installedChecksum = this.packageChecksums.get(
            keyFor(locked.moduleId, locked.moduleVersion),
          );
          if (installedChecksum && installedChecksum !== locked.checksum) {
            diagnostics.push({
              code: 'dependency-checksum-mismatch',
              severity: 'error',
              path: '/moduleRef/dependencyLockId',
              message: `Installed dependency “${locked.moduleId}@${locked.moduleVersion}” does not match its locked checksum.`,
            });
          }
        }
      }
    }

    const gameNodes = new Map(root.gameNodes.map((node) => [node.id, node]));
    const gameNode = gameNodes.get(gameNodeId);
    if (!gameNode) {
      diagnostics.push({
        code: 'missing-game-node',
        severity: 'error',
        path: '/moduleRef/gameNodeId',
        message: `Game node “${gameNodeId}” is unavailable.`,
      });
    }
    const template = root.sheetTemplates.find(
      (candidate) =>
        candidate.id === sheetTemplateId &&
        candidate.templateVersion === sheetTemplateVersion,
    );
    if (!template) {
      diagnostics.push({
        code: 'missing-sheet-template',
        severity: 'error',
        path: '/moduleRef/sheetTemplateId',
        message: `Sheet “${sheetTemplateId}” version ${sheetTemplateVersion} is unavailable.`,
      });
    } else if (template.gameNodeId !== gameNodeId) {
      diagnostics.push({
        code: 'sheet-game-node-mismatch',
        severity: 'error',
        path: '/moduleRef',
        message: `Sheet “${sheetTemplateId}” does not belong to game node “${gameNodeId}”.`,
      });
    }

    if (diagnostics.length || !gameNode || !template) {
      throw new ModuleValidationError(
        'The module-backed character is unavailable.',
        diagnostics,
      );
    }

    const inheritedGameNodes: GameNodeDefinition[] = [];
    let current: GameNodeDefinition | undefined = gameNode;
    while (current) {
      inheritedGameNodes.unshift(current);
      current = current.parentId ? gameNodes.get(current.parentId) : undefined;
    }
    const resolvedDefinitionRefs: string[] = [];
    const resolvedOverrides: GameNodeDefinition['overrides'] = [];
    for (const node of inheritedGameNodes) {
      for (const addition of node.additions) {
        if (!resolvedDefinitionRefs.includes(addition)) {
          resolvedDefinitionRefs.push(addition);
        }
      }
      for (const override of node.overrides) {
        if (!resolvedDefinitionRefs.includes(override.target)) {
          diagnostics.push({
            code: 'unknown-override-target',
            severity: 'error',
            path: `/gameNodes/${node.id}/overrides`,
            message: `Game node “${node.id}” overrides unavailable definition “${override.target}”.`,
          });
        } else {
          resolvedOverrides.push(override);
        }
      }
    }
    if (diagnostics.length) {
      throw new ModuleValidationError(
        'The module hierarchy cannot be resolved.',
        diagnostics,
      );
    }
    return {
      module: root,
      template,
      gameNode,
      inheritedGameNodes,
      resolvedDefinitionRefs,
      resolvedOverrides,
      characterSchema: buildModuleCharacterSchema(template.characterSchema),
    };
  }

  resolveCatalogDefinition(
    moduleId: string,
    moduleVersion: string,
    catalogId: string,
    definitionId: string,
  ) {
    const module = this.get(moduleId, moduleVersion);
    const catalog = module?.catalogs.find(({ id }) => id === catalogId);
    const definition = catalog?.entries.find(({ id }) => id === definitionId);
    return definition
      ? { status: 'available' as const, definition }
      : {
          status: 'unresolved' as const,
          catalogId,
          definitionId,
          message: `Definition “${catalogId}/${definitionId}” is unavailable; character-owned data is preserved.`,
        };
  }
}
