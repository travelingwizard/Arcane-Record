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
import type { ModuleRegistry } from '../../modules/registry/module-registry';
import {
  ARCANE_MODULE_SYSTEM_ID,
  characterHomebrewSchema,
  characterModuleRefSchema,
} from '../../storage/stored-character';

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

const moduleCharacterFileSchema = z.strictObject({
  format: z.literal('arcane-record-character'),
  formatVersion: z.literal(2),
  systemId: z.literal(ARCANE_MODULE_SYSTEM_ID),
  systemVersion: z.number().int().nonnegative(),
  id: z.string().min(1),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  moduleRef: characterModuleRefSchema,
  homebrew: characterHomebrewSchema.optional(),
  character: z.unknown(),
});

const supportedCharacterFileSchema = z.discriminatedUnion('formatVersion', [
  characterFileSchema,
  moduleCharacterFileSchema,
]);

function asStoredCharacter(
  character: StoredCharacter | MageCharacter,
): StoredCharacter {
  return 'data' in character ? character : mageToStoredCharacter(character);
}

function toFileEnvelope(record: StoredCharacter) {
  if (record.moduleRef) {
    return {
      format: 'arcane-record-character' as const,
      formatVersion: 2 as const,
      systemId: record.systemId,
      systemVersion: record.systemVersion,
      id: record.id,
      name: record.name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      moduleRef: record.moduleRef,
      homebrew: record.homebrew,
      character: record.data,
    };
  }
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
  const envelope = supportedCharacterFileSchema.parse(
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
  id: string = crypto.randomUUID(),
  moduleRegistry?: ModuleRegistry,
): StoredCharacter {
  const parsed = parseContents(contents, fileName);
  const timestamp = now.toISOString();
  const envelope = supportedCharacterFileSchema.safeParse(parsed);

  if (envelope.success) {
    if (envelope.data.formatVersion === 2) {
      const installed = moduleRegistry?.get(
        envelope.data.moduleRef.moduleId,
        envelope.data.moduleRef.moduleVersion,
      );
      if (installed && moduleRegistry) {
        const resolved = moduleRegistry.resolve(
          envelope.data.moduleRef.moduleId,
          envelope.data.moduleRef.moduleVersion,
          envelope.data.moduleRef.gameNodeId,
          envelope.data.moduleRef.sheetTemplateId,
          envelope.data.moduleRef.sheetTemplateVersion,
        );
        resolved.characterSchema.parse(envelope.data.character);
      }
      const localLock = moduleRegistry?.findCompatibleLock(
        envelope.data.moduleRef.moduleId,
        envelope.data.moduleRef.moduleVersion,
      );
      return {
        id,
        systemId: envelope.data.systemId,
        systemVersion: envelope.data.systemVersion,
        name: `${envelope.data.name || 'Untitled character'} (Imported)`,
        createdAt: timestamp,
        updatedAt: timestamp,
        moduleRef: {
          ...envelope.data.moduleRef,
          dependencyLockId:
            localLock?.id ?? envelope.data.moduleRef.dependencyLockId,
        },
        homebrew: envelope.data.homebrew,
        data: structuredClone(envelope.data.character),
      };
    }
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
    for (const system of registry.list()) {
      const imported = system.importLegacyCharacter?.(contents, fileName);
      if (!imported) continue;
      const validated = system.characterSchema.parse(imported);
      const importedName = `${system.getDisplayName(validated)} (Imported)`;
      return {
        id,
        systemId: system.id,
        systemVersion: system.currentSchemaVersion,
        name: importedName,
        createdAt: timestamp,
        updatedAt: timestamp,
        data: system.renameCharacter(validated, importedName),
      };
    }
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
  const envelope = supportedCharacterFileSchema.safeParse(parsed);
  if (envelope.success) {
    if (envelope.data.formatVersion === 2) {
      throw new Error('The file is not a legacy Mage character.');
    }
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
