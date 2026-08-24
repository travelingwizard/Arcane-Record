import type { ResolvedModuleSheet } from '../registry/module-registry';
import {
  deleteDataPath,
  readDataPath,
  writeDataPath,
} from '../schema/data-path';

export function migrateModuleCharacter(
  resolved: ResolvedModuleSheet,
  fromModuleVersion: string,
  input: unknown,
) {
  if (fromModuleVersion === resolved.module.moduleVersion) {
    return resolved.characterSchema.parse(structuredClone(input));
  }
  const migrationsBySource = new Map(
    resolved.module.migrations.map((migration) => [
      migration.fromVersion,
      migration,
    ]),
  );
  const visited = new Set<string>();
  let version = fromModuleVersion;
  const next = structuredClone(input) as Record<string, unknown>;
  while (version !== resolved.module.moduleVersion) {
    if (visited.has(version)) {
      throw new Error(`Module migration cycle begins at version ${version}.`);
    }
    visited.add(version);
    const migration = migrationsBySource.get(version);
    if (!migration) {
      throw new Error(
        `No module migration connects version ${version} to ${resolved.module.moduleVersion}.`,
      );
    }
    for (const operation of migration.operations) {
      if (operation.type === 'set-default-if-missing') {
        if (readDataPath(next, operation.path) === undefined) {
          writeDataPath(next, operation.path, structuredClone(operation.value));
        }
      } else {
        const value = readDataPath(next, operation.from);
        if (value !== undefined) {
          writeDataPath(next, operation.to, structuredClone(value));
          deleteDataPath(next, operation.from);
        }
      }
    }
    version = migration.toVersion;
  }
  return resolved.characterSchema.parse(next);
}
