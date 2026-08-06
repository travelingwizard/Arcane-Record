import { dump, load } from 'js-yaml';
import { z } from 'zod';
import type { GameSystemRegistry } from '../../games/game-system-registry';
import {
  mageToStoredCharacter,
  storedCharacterToMage,
} from '../../games/mage20/character-adapter';
import { migrateMageCharacter } from '../../systems/mage-m20/character-schema';
import { MAGE_SYSTEM_ID } from '../../systems/mage-m20/definitions';
import type { StoredCharacter } from '../../storage/stored-character';
import type { MageCharacter } from '../../types/character';

export type CharacterFileFormat = 'json' | 'yaml';

const characterFileSchema = z.object({
  format: z.literal('arcane-record-character'),
  formatVersion: z.literal(1),
  systemId: z.string().min(1),
  systemVersion: z.number().int().nonnegative(),
  id: z.string().min(1),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  character: z.unknown(),
});

function asStoredCharacter(
  character: StoredCharacter | MageCharacter,
): StoredCharacter {
  return 'data' in character ? character : mageToStoredCharacter(character);
}

function toFileEnvelope(record: StoredCharacter) {
  return {
    format: 'arcane-record-character' as const,
    formatVersion: 1 as const,
    systemId: record.systemId,
    systemVersion: record.systemVersion,
    id: record.id,
    name: record.name,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    character: record.data,
  };
}

export function serializeCharacter(
  character: StoredCharacter | MageCharacter,
  format: CharacterFileFormat,
) {
  const envelope = characterFileSchema.parse(
    toFileEnvelope(asStoredCharacter(character)),
  );
  return format === 'json'
    ? `${JSON.stringify(envelope, null, 2)}\n`
    : dump(envelope, {
        noRefs: true,
        lineWidth: 100,
        noCompatMode: true,
      });
}

export function createCharacterFileName(
  character: StoredCharacter | MageCharacter,
  format: CharacterFileFormat,
) {
  const record = asStoredCharacter(character);
  const baseName =
    record.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'untitled-character';
  const extension = format === 'json' ? 'json' : 'yaml';
  return `${baseName}.${extension}`;
}

function parseContents(contents: string, fileName: string): unknown {
  return /\.ya?ml$/i.test(fileName) ? load(contents) : JSON.parse(contents);
}

function isPositiveLegacyMageFile(
  input: unknown,
): input is Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return false;
  }
  const record = input as Record<string, unknown>;
  const identity = record.identity as Record<string, unknown> | undefined;
  return (
    record.systemId === MAGE_SYSTEM_ID &&
    typeof record.schemaVersion === 'number' &&
    Boolean(identity && typeof identity.name === 'string') &&
    typeof record.attributes === 'object' &&
    typeof record.spheres === 'object' &&
    typeof record.repeatableEntries === 'object'
  );
}

export function prepareImportedRecord(
  contents: string,
  fileName: string,
  registry: GameSystemRegistry,
  now = new Date(),
  id = crypto.randomUUID(),
): StoredCharacter {
  const parsed = parseContents(contents, fileName);
  const timestamp = now.toISOString();
  const envelope = characterFileSchema.safeParse(parsed);

  if (envelope.success) {
    const system = registry.get(envelope.data.systemId);
    if (!system) {
      throw new Error(
        `Game system "${envelope.data.systemId}" is unavailable.`,
      );
    }
    const migrated = system.migrateCharacter(
      envelope.data.character,
      envelope.data.systemVersion,
      { id, createdAt: timestamp, updatedAt: timestamp },
    );
    const validated = system.characterSchema.parse(migrated);
    return {
      id,
      systemId: system.id,
      systemVersion: system.currentSchemaVersion,
      name: `${system.getDisplayName(validated)} (Imported)`,
      createdAt: timestamp,
      updatedAt: timestamp,
      data: system.renameCharacter(
        validated,
        `${system.getDisplayName(validated)} (Imported)`,
      ),
    };
  }

  if (!isPositiveLegacyMageFile(parsed)) {
    throw new Error('The file is not a recognized Arcane Record character.');
  }

  const migrated = migrateMageCharacter(parsed);
  const imported = {
    ...structuredClone(migrated),
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
    identity: {
      ...migrated.identity,
      name: migrated.identity.name
        ? `${migrated.identity.name} (Imported)`
        : 'Imported mage',
    },
  };
  return mageToStoredCharacter(imported);
}

/** Compatibility helper for the Mage sheet's embedded Save section. */
export function prepareImportedCharacter(
  contents: string,
  fileName: string,
  now = new Date(),
  id = crypto.randomUUID(),
): MageCharacter {
  const parsed = parseContents(contents, fileName);
  const envelope = characterFileSchema.safeParse(parsed);
  if (envelope.success) {
    const record: StoredCharacter = {
      id,
      systemId: envelope.data.systemId,
      systemVersion: envelope.data.systemVersion,
      name: envelope.data.name,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      data: envelope.data.character,
    };
    const source = storedCharacterToMage(record);
    source.identity.name = source.identity.name
      ? `${source.identity.name} (Imported)`
      : 'Imported mage';
    return source;
  }
  if (!isPositiveLegacyMageFile(parsed)) {
    throw new Error('The file is not a recognized Mage character.');
  }
  const source = migrateMageCharacter(parsed);
  const timestamp = now.toISOString();
  return {
    ...structuredClone(source),
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
    identity: {
      ...source.identity,
      name: source.identity.name
        ? `${source.identity.name} (Imported)`
        : 'Imported mage',
    },
  };
}
