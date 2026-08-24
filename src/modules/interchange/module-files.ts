import { dump, load } from 'js-yaml';
import {
  ModuleValidationError,
  type ModuleDiagnostic,
} from '../diagnostics/module-diagnostic';
import type { ModuleRepository } from '../repository/module-repository';
import type { ModulePackageRecord } from '../repository/module-records';
import type { ArcaneModuleEnvelope } from '../schema/module-envelope';
import { ModuleRegistry } from '../registry/module-registry';
import { validateModuleEnvelope } from '../registry/module-validation';

export type ModuleFileFormat = 'json' | 'yaml';

const MAX_MODULE_FILE_BYTES = 5 * 1024 * 1024;
const MAX_DEPTH = 32;
const MAX_NODES = 100_000;
const MAX_KEYS = 20_000;

export interface StagedModule {
  canInstall: boolean;
  envelope: ArcaneModuleEnvelope | null;
  checksum: string | null;
  diagnostics: ModuleDiagnostic[];
  summary: {
    name: string;
    description: string;
    moduleId: string;
    moduleVersion: string;
    authors: string[];
    license: string;
    minimumCoreVersion: string;
    gameCount: number;
    sheetCount: number;
    catalogCount: number;
    componentCount: number;
    dependencies: string[];
    assetCount: number;
    permissions: string[];
  } | null;
}

function parseModuleContents(contents: string, fileName: string) {
  if (new TextEncoder().encode(contents).byteLength > MAX_MODULE_FILE_BYTES) {
    throw new ModuleValidationError('The module file is too large.', [
      {
        code: 'module-file-too-large',
        severity: 'error',
        path: '/',
        message: `Module files may not exceed ${MAX_MODULE_FILE_BYTES} bytes.`,
      },
    ]);
  }
  try {
    return /\.ya?ml$/i.test(fileName)
      ? load(contents, { json: true })
      : JSON.parse(contents);
  } catch {
    throw new ModuleValidationError('The module file could not be parsed.', [
      {
        code: 'module-parse-failed',
        severity: 'error',
        path: '/',
        message: 'The file is not valid JSON or safe YAML.',
      },
    ]);
  }
}

function normalizePlainJson(input: unknown) {
  let nodes = 0;
  let keys = 0;
  const seen = new WeakSet<object>();
  const visit = (value: unknown, depth: number): unknown => {
    nodes += 1;
    if (nodes > MAX_NODES || depth > MAX_DEPTH) {
      throw new Error('Module structure exceeds the permitted complexity.');
    }
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'boolean'
    ) {
      return value;
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new Error('Numbers must be finite.');
      return value;
    }
    if (typeof value !== 'object') {
      throw new Error('Only plain JSON values are permitted.');
    }
    if (seen.has(value)) {
      throw new Error('YAML aliases and circular values are not permitted.');
    }
    seen.add(value);
    if (Array.isArray(value)) {
      return value.map((item) => visit(item, depth + 1));
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error('Only plain objects are permitted.');
    }
    const result: Record<string, unknown> = Object.create(null);
    for (const [key, child] of Object.entries(value)) {
      keys += 1;
      if (keys > MAX_KEYS) throw new Error('Module contains too many keys.');
      if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
        throw new Error(`Unsafe property “${key}” is not permitted.`);
      }
      result[key] = visit(child, depth + 1);
    }
    return result;
  };
  return visit(input, 0);
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, child]) => [key, sortJson(child)]),
    );
  }
  return value;
}

export function canonicalizeModule(module: ArcaneModuleEnvelope) {
  return `${JSON.stringify(sortJson(module))}\n`;
}

export async function calculateModuleChecksum(module: ArcaneModuleEnvelope) {
  const bytes = new TextEncoder().encode(canonicalizeModule(module));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

export async function stageModuleFile(
  contents: string,
  fileName: string,
  installedRegistry = new ModuleRegistry(),
): Promise<StagedModule> {
  try {
    const parsed = normalizePlainJson(parseModuleContents(contents, fileName));
    const envelope = validateModuleEnvelope(parsed);
    const checksum = await calculateModuleChecksum(envelope);
    const registry = new ModuleRegistry();
    installedRegistry.list().forEach((module) => registry.register(module));
    const existing = registry.get(envelope.moduleId, envelope.moduleVersion);
    const diagnostics: ModuleDiagnostic[] = [];
    if (existing) {
      const existingChecksum = await calculateModuleChecksum(existing);
      if (existingChecksum !== checksum) {
        throw new ModuleValidationError(
          'The immutable module version conflicts with the installed package.',
          [
            {
              code: 'immutable-module-version-conflict',
              severity: 'error',
              path: '/moduleVersion',
              message: `Installed module “${envelope.moduleId}@${envelope.moduleVersion}” has different content.`,
            },
          ],
        );
      }
      diagnostics.push({
        code: 'module-already-installed',
        severity: 'information',
        path: '/moduleVersion',
        message: `Module “${envelope.moduleId}@${envelope.moduleVersion}” is already installed with the same checksum.`,
      });
    } else {
      registry.register(envelope);
    }
    for (const template of envelope.sheetTemplates) {
      registry.resolve(
        envelope.moduleId,
        envelope.moduleVersion,
        template.gameNodeId,
        template.id,
        template.templateVersion,
      );
    }
    return {
      canInstall: true,
      envelope,
      checksum,
      diagnostics,
      summary: {
        name: envelope.name,
        description: envelope.description,
        moduleId: envelope.moduleId,
        moduleVersion: envelope.moduleVersion,
        authors: envelope.author.map(({ name }) => name),
        license: envelope.licenseMetadata.spdxExpression,
        minimumCoreVersion: envelope.minimumCoreVersion,
        gameCount: envelope.gameNodes.length,
        sheetCount: envelope.sheetTemplates.length,
        catalogCount: envelope.catalogs.length,
        componentCount: envelope.reusableComponents.length,
        dependencies: envelope.dependencies.map(
          ({ moduleId, version }) => `${moduleId}@${version}`,
        ),
        assetCount: envelope.assets.length,
        permissions: [
          'Character data for this module only',
          'No network access',
          'No executable code',
        ],
      },
    };
  } catch (error) {
    const diagnostics =
      error instanceof ModuleValidationError
        ? error.diagnostics
        : [
            {
              code: 'module-normalization-failed',
              severity: 'error' as const,
              path: '/',
              message:
                error instanceof Error
                  ? error.message
                  : 'The module could not be normalized.',
            },
          ];
    return {
      canInstall: false,
      envelope: null,
      checksum: null,
      diagnostics,
      summary: null,
    };
  }
}

export function serializeModule(
  module: ArcaneModuleEnvelope,
  format: ModuleFileFormat,
) {
  const registry = new ModuleRegistry().register(module);
  const validated = registry.list()[0];
  return format === 'json'
    ? `${JSON.stringify(validated, null, 2)}\n`
    : dump(validated, {
        noRefs: true,
        lineWidth: 100,
        noCompatMode: true,
        sortKeys: true,
      });
}

export async function installStagedModule(
  staged: StagedModule,
  repository: ModuleRepository,
  origin: ModulePackageRecord['origin'] = 'local',
) {
  if (!staged.canInstall || !staged.envelope || !staged.checksum) {
    throw new Error('Only a validated staged module can be installed.');
  }
  const installedAt = new Date().toISOString();
  const dependencies = await Promise.all(
    staged.envelope.dependencies
      .filter(({ required }) => required)
      .map(async ({ moduleId, version }) => {
        const dependency = await repository.getPackage(moduleId, version);
        if (!dependency) {
          throw new Error(
            `Required dependency “${moduleId}@${version}” is unavailable.`,
          );
        }
        return {
          moduleId,
          moduleVersion: version,
          checksum: dependency.checksum,
        };
      }),
  );
  return repository.install({
    envelope: staged.envelope,
    checksum: staged.checksum,
    origin,
    installedAt,
    lock: {
      id: crypto.randomUUID(),
      moduleId: staged.envelope.moduleId,
      moduleVersion: staged.envelope.moduleVersion,
      dependencies,
      createdAt: installedAt,
    },
  });
}
