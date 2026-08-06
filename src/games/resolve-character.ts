import type { GameSystemRegistry } from './game-system-registry';
import type { StoredCharacter } from '../storage/stored-character';

export function resolveCharacter(
  record: StoredCharacter,
  registry: GameSystemRegistry,
) {
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
    return { status: 'available' as const, record, system, character };
  } catch {
    return {
      status: 'invalid' as const,
      record,
      system,
      message: 'This character could not be validated by its game module.',
    };
  }
}
