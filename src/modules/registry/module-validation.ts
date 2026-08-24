import { z } from 'zod';
import {
  ModuleValidationError,
  type ModuleDiagnostic,
} from '../diagnostics/module-diagnostic';
import { dataPathKey, readDataPath, type DataPath } from '../schema/data-path';
import { buildModuleCharacterSchema } from '../schema/character-schema';
import {
  arcaneModuleEnvelopeSchema,
  type ArcaneModuleEnvelope,
  type ModuleComponentDefinition,
  type ModuleCondition,
  type ModuleValueSchemaDefinition,
  type SheetTemplateDefinition,
} from '../schema/module-envelope';

const issuePath = (path: PropertyKey[]) =>
  `/${path.map((value) => String(value).replaceAll('~', '~0').replaceAll('/', '~1')).join('/')}`;

export const ARCANE_CORE_VERSION = '0.1.0';

function compareVersions(left: string, right: string) {
  const leftParts = left.split('-', 1)[0]!.split('.').map(Number);
  const rightParts = right.split('-', 1)[0]!.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference) return difference;
  }
  return 0;
}

function findExecutableContent(input: unknown) {
  const prohibited = new Set([
    'script',
    'javascript',
    'html',
    'css',
    'stylesheet',
    'onclick',
    'network',
    'endpoint',
    'fetch',
  ]);
  const found: string[] = [];
  const visit = (value: unknown, path: string) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}/${index}`));
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}/${key}`;
      if (prohibited.has(key.toLowerCase())) found.push(childPath);
      visit(child, childPath);
    }
  };
  visit(input, '');
  return found;
}

function duplicateDiagnostics(
  values: readonly { id: string }[],
  path: string,
): ModuleDiagnostic[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value.id)) duplicates.add(value.id);
    seen.add(value.id);
  }
  return [...duplicates].map((id) => ({
    code: 'duplicate-id',
    severity: 'error',
    path,
    message: `The stable ID “${id}” is duplicated.`,
    relatedIds: [id],
    remediation:
      'Assign a unique stable ID without renaming existing published IDs.',
  }));
}

function schemaAtPath(
  schema: ModuleValueSchemaDefinition,
  path: DataPath,
): ModuleValueSchemaDefinition | null {
  let current = schema;
  for (const segment of path.segments) {
    if (current.type !== 'object') return null;
    const next = current.properties[segment];
    if (!next) return null;
    current = next;
  }
  return current;
}

function validateComponentPath(
  component: ModuleComponentDefinition,
  template: SheetTemplateDefinition,
  componentIndex: number,
): ModuleDiagnostic[] {
  const paths: Array<{
    dataPath: DataPath;
    expected: 'string' | 'integer';
    suffix: string;
  }> = [];
  if ('dataPath' in component) {
    paths.push({
      dataPath: component.dataPath,
      expected: component.type === 'text' ? 'string' : 'integer',
      suffix: 'dataPath',
    });
  } else if (component.type === 'field-grid') {
    component.fields.forEach((field, index) =>
      paths.push({
        dataPath: field.dataPath,
        expected: 'string',
        suffix: `fields/${index}/dataPath`,
      }),
    );
  } else if (component.type === 'grouped-dot-ratings') {
    component.groups.forEach((group, groupIndex) =>
      group.ratings.forEach((rating, ratingIndex) =>
        paths.push({
          dataPath: rating.dataPath,
          expected: 'integer',
          suffix: `groups/${groupIndex}/ratings/${ratingIndex}/dataPath`,
        }),
      ),
    );
  }
  return paths.flatMap(({ dataPath, expected, suffix }) => {
    const target = schemaAtPath(template.characterSchema, dataPath);
    const path = `/reusableComponents/${componentIndex}/${suffix}`;
    if (!target) {
      return [
        {
          code: 'unknown-data-path',
          severity: 'error' as const,
          path,
          message: `Data path “${dataPathKey(dataPath)}” is not declared by sheet “${template.id}”.`,
          relatedIds: [component.id, template.id],
        },
      ];
    }
    return target.type === expected
      ? []
      : [
          {
            code: 'component-path-type',
            severity: 'error' as const,
            path,
            message: `Component “${component.id}” requires ${expected} data, but its path resolves to ${target.type}.`,
            relatedIds: [component.id, template.id],
          },
        ];
  });
}

function conditionPaths(condition: ModuleCondition | undefined): DataPath[] {
  if (!condition) return [];
  if (condition.op === 'equals' || condition.op === 'truthy') {
    return [condition.path];
  }
  if (condition.op === 'not') return conditionPaths(condition.condition);
  return condition.conditions.flatMap(conditionPaths);
}

function validateHierarchy(module: ArcaneModuleEnvelope): ModuleDiagnostic[] {
  const diagnostics: ModuleDiagnostic[] = [];
  const nodes = new Map(module.gameNodes.map((node) => [node.id, node]));
  const roots = module.gameNodes.filter((node) => node.parentId === null);
  if (roots.length !== 1) {
    diagnostics.push({
      code: 'game-root-count',
      severity: 'error',
      path: '/gameNodes',
      message: `A module must contain exactly one root game node; found ${roots.length}.`,
    });
  }
  for (const node of module.gameNodes) {
    if (node.parentId && !nodes.has(node.parentId)) {
      diagnostics.push({
        code: 'unknown-game-parent',
        severity: 'error',
        path: `/gameNodes/${node.id}/parentId`,
        message: `Game node “${node.id}” references missing parent “${node.parentId}”.`,
        relatedIds: [node.id, node.parentId],
      });
    }
    const visited = new Set<string>();
    let current: typeof node | undefined = node;
    while (current?.parentId) {
      if (visited.has(current.id)) {
        diagnostics.push({
          code: 'circular-game-inheritance',
          severity: 'error',
          path: `/gameNodes/${node.id}/parentId`,
          message: `Game node “${node.id}” participates in circular inheritance.`,
          relatedIds: [...visited],
        });
        break;
      }
      visited.add(current.id);
      current = nodes.get(current.parentId);
    }
  }
  const resolvedDefinitions = new Map<string, Set<string>>();
  const resolveDefinitions = (nodeId: string): Set<string> => {
    const cached = resolvedDefinitions.get(nodeId);
    if (cached) return cached;
    const node = nodes.get(nodeId);
    if (!node) return new Set();
    const inherited = node.parentId
      ? new Set(resolveDefinitions(node.parentId))
      : new Set<string>();
    for (const override of node.overrides) {
      if (!inherited.has(override.target)) {
        diagnostics.push({
          code: 'unknown-override-target',
          severity: 'error',
          path: `/gameNodes/${node.id}/overrides`,
          message: `Game node “${node.id}” overrides unavailable inherited definition “${override.target}”.`,
          relatedIds: [node.id, override.target],
        });
      }
    }
    node.additions.forEach((definition) => inherited.add(definition));
    resolvedDefinitions.set(nodeId, inherited);
    return inherited;
  };
  if (!diagnostics.some(({ code }) => code === 'circular-game-inheritance')) {
    module.gameNodes.forEach(({ id }) => resolveDefinitions(id));
  }
  return diagnostics;
}

export function validateModuleEnvelope(input: unknown): ArcaneModuleEnvelope {
  const executablePaths = findExecutableContent(input);
  if (executablePaths.length) {
    throw new ModuleValidationError(
      'Executable module content is prohibited.',
      executablePaths.map((path) => ({
        code: 'prohibited-executable-content',
        severity: 'error' as const,
        path,
        message:
          'Modules cannot contain JavaScript, HTML, CSS, network, or event-handler content.',
      })),
    );
  }
  const parsed = arcaneModuleEnvelopeSchema.safeParse(input);
  if (!parsed.success) {
    throw new ModuleValidationError(
      'The module envelope is invalid.',
      parsed.error.issues.map((issue) => ({
        code: 'invalid-module-schema',
        severity: 'error' as const,
        path: issuePath(issue.path),
        message: issue.message,
      })),
    );
  }

  const module = parsed.data;
  const diagnostics: ModuleDiagnostic[] = [
    ...duplicateDiagnostics(module.gameNodes, '/gameNodes'),
    ...duplicateDiagnostics(module.sheetTemplates, '/sheetTemplates'),
    ...duplicateDiagnostics(module.reusableComponents, '/reusableComponents'),
    ...duplicateDiagnostics(module.catalogs, '/catalogs'),
    ...duplicateDiagnostics(module.sourceReferences, '/sourceReferences'),
    ...validateHierarchy(module),
  ];
  if (compareVersions(module.minimumCoreVersion, ARCANE_CORE_VERSION) > 0) {
    diagnostics.push({
      code: 'incompatible-core-version',
      severity: 'error',
      path: '/minimumCoreVersion',
      message: `Module requires Arcane Record ${module.minimumCoreVersion}; this runtime is ${ARCANE_CORE_VERSION}.`,
    });
  }
  const components = new Map(
    module.reusableComponents.map((component, index) => [
      component.id,
      { component, index },
    ]),
  );
  const gameNodes = new Set(module.gameNodes.map(({ id }) => id));
  const sourceRefs = new Set(module.sourceReferences.map(({ id }) => id));

  for (const [templateIndex, template] of module.sheetTemplates.entries()) {
    if (!gameNodes.has(template.gameNodeId)) {
      diagnostics.push({
        code: 'unknown-sheet-game-node',
        severity: 'error',
        path: `/sheetTemplates/${templateIndex}/gameNodeId`,
        message: `Sheet “${template.id}” references missing game node “${template.gameNodeId}”.`,
      });
    }
    diagnostics.push(
      ...duplicateDiagnostics(
        template.navigationGroups,
        `/sheetTemplates/${templateIndex}/navigationGroups`,
      ),
      ...duplicateDiagnostics(
        template.sections,
        `/sheetTemplates/${templateIndex}/sections`,
      ),
    );
    const groups = new Set(template.navigationGroups.map(({ id }) => id));
    const modeIds = new Set(template.modes.map(({ id }) => id));
    const templateComponentIds = new Set(template.componentIds);
    for (const componentId of template.componentIds) {
      if (!components.has(componentId)) {
        diagnostics.push({
          code: 'unknown-template-component',
          severity: 'error',
          path: `/sheetTemplates/${templateIndex}/componentIds`,
          message: `Sheet “${template.id}” declares missing component “${componentId}”.`,
        });
      }
    }
    if (!modeIds.has(template.defaultModeId)) {
      diagnostics.push({
        code: 'unknown-default-mode',
        severity: 'error',
        path: `/sheetTemplates/${templateIndex}/defaultModeId`,
        message: `Default mode “${template.defaultModeId}” is not declared.`,
      });
    }
    if (template.modePath) {
      const target = schemaAtPath(template.characterSchema, template.modePath);
      const defaultMode = readDataPath(template.defaults, template.modePath);
      if (target?.type !== 'enum' || !modeIds.has(String(defaultMode))) {
        diagnostics.push({
          code: 'invalid-mode-path',
          severity: 'error',
          path: `/sheetTemplates/${templateIndex}/modePath`,
          message: `Sheet “${template.id}” mode path must target an enum whose default is a declared mode.`,
        });
      }
    }
    for (const [orderMode, orderPath] of [
      ...(template.groupOrderPath
        ? ([['default', template.groupOrderPath]] as const)
        : []),
      ...Object.entries(template.groupOrderPaths),
    ]) {
      const target = schemaAtPath(template.characterSchema, orderPath);
      const defaultOrder = readDataPath(template.defaults, orderPath);
      if (
        target?.type !== 'array' ||
        !Array.isArray(defaultOrder) ||
        defaultOrder.length !== groups.size ||
        new Set(defaultOrder).size !== groups.size ||
        !defaultOrder.every(
          (value) => typeof value === 'string' && groups.has(value),
        )
      ) {
        diagnostics.push({
          code: 'invalid-group-order-path',
          severity: 'error',
          path: `/sheetTemplates/${templateIndex}/groupOrderPaths/${orderMode}`,
          message: `Sheet “${template.id}” ${orderMode} group-order path must contain every navigation group exactly once.`,
        });
      }
    }
    for (const modeId of Object.keys(template.groupOrderPaths)) {
      if (!modeIds.has(modeId)) {
        diagnostics.push({
          code: 'unknown-group-order-mode',
          severity: 'error',
          path: `/sheetTemplates/${templateIndex}/groupOrderPaths/${modeId}`,
          message: `Group order is configured for undeclared mode “${modeId}”.`,
        });
      }
    }
    for (const section of template.sections) {
      if (!groups.has(section.groupId)) {
        diagnostics.push({
          code: 'unknown-section-group',
          severity: 'error',
          path: `/sheetTemplates/${templateIndex}/sections/${section.id}/groupId`,
          message: `Section “${section.id}” references missing group “${section.groupId}”.`,
        });
      }
      for (const componentId of section.componentIds) {
        const entry = components.get(componentId);
        if (!entry) {
          diagnostics.push({
            code: 'unknown-section-component',
            severity: 'error',
            path: `/sheetTemplates/${templateIndex}/sections/${section.id}/componentIds`,
            message: `Section “${section.id}” references missing component “${componentId}”.`,
          });
        } else {
          if (!templateComponentIds.has(componentId)) {
            diagnostics.push({
              code: 'undeclared-section-component',
              severity: 'error',
              path: `/sheetTemplates/${templateIndex}/sections/${section.id}/componentIds`,
              message: `Section component “${componentId}” is not declared by sheet “${template.id}”.`,
            });
          }
          for (const modeId of Object.keys(entry.component.modes)) {
            if (!modeIds.has(modeId)) {
              diagnostics.push({
                code: 'unknown-component-mode',
                severity: 'error',
                path: `/reusableComponents/${entry.index}/modes/${modeId}`,
                message: `Component “${componentId}” configures undeclared mode “${modeId}” for sheet “${template.id}”.`,
              });
            }
          }
          for (const conditionPath of [
            ...conditionPaths(entry.component.visibleWhen),
            ...conditionPaths(entry.component.editableWhen),
          ]) {
            if (!schemaAtPath(template.characterSchema, conditionPath)) {
              diagnostics.push({
                code: 'unknown-condition-path',
                severity: 'error',
                path: `/reusableComponents/${entry.index}`,
                message: `Component “${componentId}” condition references missing path “${dataPathKey(conditionPath)}”.`,
              });
            }
          }
          diagnostics.push(
            ...validateComponentPath(entry.component, template, entry.index),
          );
        }
      }
      const summaryPaths = section.summary
        ? section.summary.type === 'fields'
          ? section.summary.paths.map((dataPath) => ({
              dataPath,
              expected: 'string',
            }))
          : section.summary.type === 'field-slots'
            ? section.summary.slots.flatMap((slot) =>
                slot.paths.map((dataPath) => ({
                  dataPath,
                  expected: 'string',
                })),
              )
            : section.summary.groups.flatMap((group) =>
                group.paths.map((dataPath) => ({
                  dataPath,
                  expected: 'integer',
                })),
              )
        : [];
      for (const { dataPath, expected } of summaryPaths) {
        const target = schemaAtPath(template.characterSchema, dataPath);
        if (!target || target.type !== expected) {
          diagnostics.push({
            code: 'invalid-section-summary-path',
            severity: 'error',
            path: `/sheetTemplates/${templateIndex}/sections/${section.id}/summary`,
            message: `Section “${section.id}” summary path “${dataPathKey(dataPath)}” must resolve to ${expected} data.`,
          });
        }
      }
    }
    try {
      buildModuleCharacterSchema(template.characterSchema).parse(
        template.defaults,
      );
    } catch (error) {
      diagnostics.push({
        code: 'invalid-sheet-defaults',
        severity: 'error',
        path: `/sheetTemplates/${templateIndex}/defaults`,
        message:
          error instanceof z.ZodError
            ? z.prettifyError(error)
            : 'The sheet defaults do not match its character schema.',
        relatedIds: [template.id],
      });
    }
  }
  for (const [index, component] of module.reusableComponents.entries()) {
    for (const sourceRefId of component.sourceRefIds) {
      if (!sourceRefs.has(sourceRefId)) {
        diagnostics.push({
          code: 'unknown-source-reference',
          severity: 'error',
          path: `/reusableComponents/${index}/sourceRefIds`,
          message: `Component “${component.id}” references missing source “${sourceRefId}”.`,
        });
      }
    }
  }
  for (const [nodeIndex, node] of module.gameNodes.entries()) {
    for (const sourceRefId of node.sourceRefIds) {
      if (!sourceRefs.has(sourceRefId)) {
        diagnostics.push({
          code: 'unknown-source-reference',
          severity: 'error',
          path: `/gameNodes/${nodeIndex}/sourceRefIds`,
          message: `Game node “${node.id}” references missing source “${sourceRefId}”.`,
        });
      }
    }
  }
  for (const [catalogIndex, catalog] of module.catalogs.entries()) {
    diagnostics.push(
      ...duplicateDiagnostics(
        catalog.entries,
        `/catalogs/${catalogIndex}/entries`,
      ),
    );
    for (const [entryIndex, entry] of catalog.entries.entries()) {
      for (const sourceRefId of entry.sourceRefIds) {
        if (!sourceRefs.has(sourceRefId)) {
          diagnostics.push({
            code: 'unknown-source-reference',
            severity: 'error',
            path: `/catalogs/${catalogIndex}/entries/${entryIndex}/sourceRefIds`,
            message: `Catalog entry “${entry.id}” references missing source “${sourceRefId}”.`,
          });
        }
      }
    }
  }
  diagnostics.push(...duplicateDiagnostics(module.migrations, '/migrations'));
  const migrationSources = new Set<string>();
  for (const [index, migration] of module.migrations.entries()) {
    if (migrationSources.has(migration.fromVersion)) {
      diagnostics.push({
        code: 'ambiguous-module-migration',
        severity: 'error',
        path: `/migrations/${index}/fromVersion`,
        message: `More than one migration starts at version ${migration.fromVersion}.`,
      });
    }
    migrationSources.add(migration.fromVersion);
    if (migration.fromVersion === migration.toVersion) {
      diagnostics.push({
        code: 'circular-module-migration',
        severity: 'error',
        path: `/migrations/${index}`,
        message: `Migration “${migration.id}” does not advance the module version.`,
      });
    }
  }
  const migrationBySource = new Map(
    module.migrations.map((migration) => [migration.fromVersion, migration]),
  );
  for (const migration of module.migrations) {
    const visited = new Set<string>();
    let version = migration.fromVersion;
    while (version !== module.moduleVersion) {
      if (visited.has(version)) {
        diagnostics.push({
          code: 'circular-module-migration',
          severity: 'error',
          path: `/migrations/${migration.id}`,
          message: `Migration chain from ${migration.fromVersion} is circular.`,
        });
        break;
      }
      visited.add(version);
      const step = migrationBySource.get(version);
      if (!step) {
        diagnostics.push({
          code: 'incomplete-module-migration',
          severity: 'error',
          path: `/migrations/${migration.id}`,
          message: `Migration chain from ${migration.fromVersion} does not reach ${module.moduleVersion}.`,
        });
        break;
      }
      version = step.toVersion;
    }
  }
  for (const [kind, values] of [
    ['dice systems', module.diceSystems],
    ['actions', module.actions],
    ['formulas', module.formulas],
    ['validation rules', module.validationRules],
    ['creation profiles', module.creationProfiles],
    ['creation flows', module.creationFlows],
    ['themes', module.themes],
  ] as const) {
    if (values.length > 0) {
      diagnostics.push({
        code: 'deferred-runtime-capability',
        severity: 'error',
        path: `/${kind.replaceAll(' ', '')}`,
        message: `Phase 1 cannot activate modules containing ${kind}.`,
        remediation:
          'Keep this definition in a draft until its approved runtime phase.',
      });
    }
  }
  if (module.assets.length > 0) {
    diagnostics.push({
      code: 'assets-metadata-only',
      severity: 'error',
      path: '/assets',
      message:
        'Phase 1 records asset metadata but does not activate modules with assets.',
    });
  }

  if (diagnostics.some(({ severity }) => severity === 'error')) {
    throw new ModuleValidationError(
      'The module cannot be activated.',
      diagnostics,
    );
  }
  return module;
}
