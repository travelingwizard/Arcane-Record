import type { ArcaneModuleEnvelope } from '../schema/module-envelope';

export interface OverlayConflict {
  target: string;
  field: string;
  overlayModuleIds: string[];
}

export function previewOverlayConflicts(
  overlays: readonly ArcaneModuleEnvelope[],
) {
  const owners = new Map<string, string[]>();
  for (const overlay of overlays)
    for (const node of overlay.gameNodes)
      for (const override of node.overrides)
        for (const field of Object.keys(override.fields)) {
          const key = `${override.target}#${field}`;
          owners.set(key, [...(owners.get(key) ?? []), overlay.moduleId]);
        }
  return [...owners.entries()]
    .filter(([, ids]) => new Set(ids).size > 1)
    .map(([key, ids]): OverlayConflict => {
      const [target, field] = key.split('#');
      return {
        target: target!,
        field: field!,
        overlayModuleIds: [...new Set(ids)],
      };
    });
}

export function resolveModuleOverlays(
  base: ArcaneModuleEnvelope,
  overlays: readonly ArcaneModuleEnvelope[],
) {
  const conflicts = previewOverlayConflicts(overlays);
  if (conflicts.length) {
    throw new Error(
      `Overlay conflicts must be resolved: ${conflicts.map(({ target, field }) => `${target}#${field}`).join(', ')}`,
    );
  }
  const resolved = structuredClone(base);
  for (const overlay of overlays) {
    for (const node of overlay.gameNodes) {
      for (const override of node.overrides) {
        const [kind, catalogId, entryId] = override.target.split('/');
        if (kind !== 'catalog' || !catalogId || !entryId) {
          throw new Error(
            `Overlay target “${override.target}” is unsupported.`,
          );
        }
        const entry = resolved.catalogs
          .find(({ id }) => id === catalogId)
          ?.entries.find(({ id }) => id === entryId);
        if (!entry) {
          throw new Error(
            `Overlay target “${override.target}” is unavailable.`,
          );
        }
        if ('id' in override.fields) {
          throw new Error('Overlays cannot change stable definition IDs.');
        }
        Object.assign(entry, structuredClone(override.fields));
      }
    }
  }
  return resolved;
}

export function createModuleFork(
  source: ArcaneModuleEnvelope,
  moduleId: string,
  name = `${source.name} Fork`,
): ArcaneModuleEnvelope {
  const fork = structuredClone(source);
  fork.forkedFrom = {
    moduleId: source.moduleId,
    moduleVersion: source.moduleVersion,
  };
  fork.moduleId = moduleId;
  fork.moduleVersion = '0.1.0';
  fork.name = name;
  fork.description = `${source.description}\n\nLocal fork of ${source.moduleId}@${source.moduleVersion}.`;
  return fork;
}

export interface SemanticDifference {
  path: string;
  before: unknown;
  after: unknown;
}
export function compareModules(
  left: ArcaneModuleEnvelope,
  right: ArcaneModuleEnvelope,
  maximum = 500,
): SemanticDifference[] {
  const differences: SemanticDifference[] = [];
  const visit = (before: unknown, after: unknown, path: string) => {
    if (differences.length >= maximum || Object.is(before, after)) return;
    if (
      !before ||
      !after ||
      typeof before !== 'object' ||
      typeof after !== 'object' ||
      Array.isArray(before) !== Array.isArray(after)
    ) {
      differences.push({ path, before, after });
      return;
    }
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of [...keys].sort())
      visit(
        (before as Record<string, unknown>)[key],
        (after as Record<string, unknown>)[key],
        `${path}/${key}`,
      );
  };
  visit(left, right, '');
  return differences;
}
