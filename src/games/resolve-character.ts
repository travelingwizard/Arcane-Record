import type { GameSystemRegistry } from './game-system-registry';
import type { StoredCharacter } from '../storage/stored-character';
import type { ModuleRegistry } from '../modules/registry/module-registry';
import { ModuleValidationError } from '../modules/diagnostics/module-diagnostic';
import { z } from 'zod';

export function resolveCharacter(
  record: StoredCharacter,
  registry: GameSystemRegistry,
  moduleRegistry?: ModuleRegistry,
) {
  if (record.moduleRef) {
    try {
      if (!moduleRegistry) {
        throw new Error('The module library has not been loaded.');
      }
      if (record.moduleRef.enabledOverlayRefs.length > 0) {
        throw new ModuleValidationError(
          'Homebrew overlays are not available in the Phase 1 runtime.',
          [
            {
              code: 'deferred-overlay-runtime',
              severity: 'error',
              path: '/moduleRef/enabledOverlayRefs',
              message:
                'This character references homebrew overlays that cannot yet be resolved safely.',
            },
          ],
        );
      }
      const resolved = moduleRegistry.resolve(
        record.moduleRef.moduleId,
        record.moduleRef.moduleVersion,
        record.moduleRef.gameNodeId,
        record.moduleRef.sheetTemplateId,
        record.moduleRef.sheetTemplateVersion,
        record.moduleRef.dependencyLockId,
      );
      const character = resolved.characterSchema.parse(record.data);
      return {
        status: 'available' as const,
        interpreter: 'module' as const,
        record,
        resolved,
        character,
        system: {
          id: record.systemId,
          name: resolved.module.name,
          shortName: resolved.gameNode.name,
          currentSchemaVersion: record.systemVersion,
          getDisplayName: () => record.name,
          getSummary: () =>
            `${resolved.gameNode.name} · ${resolved.template.name}`,
          getSearchText: () =>
            `${record.name} ${resolved.module.name} ${resolved.gameNode.name}`,
          renameCharacter: (data: unknown) => data,
          duplicateCharacter: (data: unknown) => structuredClone(data),
        },
      };
    } catch (error) {
      const message =
        error instanceof ModuleValidationError
          ? error.diagnostics.map(({ message }) => message).join(' ')
          : error instanceof Error
            ? error.message
            : 'The declarative module is unavailable.';
      return {
        status:
          error instanceof z.ZodError
            ? ('invalid' as const)
            : ('unavailable' as const),
        interpreter: 'module' as const,
        record,
        message,
      };
    }
  }
  const system = registry.get(record.systemId);
  if (!system) {
    return {
      status: 'unavailable' as const,
      record,
      message: `The game module “${record.systemId}” is not installed.`,
    };
  }
  try {
    const character = system.characterSchema.parse(
      system.migrateCharacter(record.data, record.systemVersion, record),
    );
    return {
      status: 'available' as const,
      interpreter: 'legacy' as const,
      record,
      system,
      character,
    };
  } catch {
    return {
      status: 'invalid' as const,
      record,
      system,
      message: 'This character could not be validated by its game module.',
    };
  }
}
