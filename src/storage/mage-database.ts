import Dexie, { type EntityTable, type Table } from 'dexie';
import {
  MAGE20_SYSTEM_ID,
  migrateLegacyMageRecord,
} from '../games/mage20/character-adapter';
import { migrateMageCharacter } from '../systems/mage-m20/character-schema';
import { MAGE_SYSTEM_ID } from '../systems/mage-m20/definitions';
import {
  storedCharacterSchema,
  type StoredCharacter,
} from './stored-character';
import type {
  ModuleDraftRecord,
  ModuleInstallationRecord,
  ModuleLockRecord,
  ModulePackageRecord,
} from '../modules/repository/module-records';

function replaceRecord(
  target: Record<string, unknown>,
  source: StoredCharacter,
) {
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  Object.assign(target, source);
}

function tryMigrateLegacyMageInPlace(record: unknown) {
  try {
    Object.assign(
      record as Record<string, unknown>,
      migrateMageCharacter(record),
    );
  } catch {
    // Version 10 preserves unknown or invalid records in a recovery envelope.
  }
}

function preserveTimestamp(value: unknown, fallback: string) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
    ? new Date(value).toISOString()
    : fallback;
}

function preserveAsEnvelope(input: unknown): StoredCharacter {
  const parsed = storedCharacterSchema.safeParse(input);
  if (parsed.success) {
    return parsed.data;
  }

  try {
    return migrateLegacyMageRecord(input);
  } catch {
    const record = (input ?? {}) as Record<string, unknown>;
    const timestamp = new Date(0).toISOString();
    const legacySystemId =
      typeof record.systemId === 'string' ? record.systemId : 'unknown';
    return {
      id:
        typeof record.id === 'string' && record.id
          ? record.id
          : crypto.randomUUID(),
      systemId:
        legacySystemId === MAGE_SYSTEM_ID ? MAGE20_SYSTEM_ID : legacySystemId,
      systemVersion:
        typeof record.schemaVersion === 'number' ? record.schemaVersion : 0,
      name:
        typeof (record.identity as { name?: unknown } | undefined)?.name ===
        'string'
          ? ((record.identity as { name: string }).name ?? '')
          : '',
      createdAt: preserveTimestamp(record.createdAt, timestamp),
      updatedAt: preserveTimestamp(record.updatedAt, timestamp),
      data: structuredClone(input),
    };
  }
}

export class MageDatabase extends Dexie {
  characters!: EntityTable<StoredCharacter, 'id'>;
  modulePackages!: Table<ModulePackageRecord, [string, string]>;
  moduleInstallations!: EntityTable<ModuleInstallationRecord, 'moduleId'>;
  moduleDrafts!: EntityTable<ModuleDraftRecord, 'id'>;
  moduleLocks!: EntityTable<ModuleLockRecord, 'id'>;

  constructor(name = 'arcane-ledger') {
    super(name);
    this.version(1).stores({
      characters: 'id, systemId, updatedAt, createdAt',
    });
    this.version(2)
      .stores({
        characters: 'id, systemId, updatedAt, createdAt',
      })
      .upgrade((transaction) =>
        transaction
          .table('characters')
          .toCollection()
          .modify((record: unknown) => {
            tryMigrateLegacyMageInPlace(record);
          }),
      );
    this.version(3)
      .stores({
        characters: 'id, systemId, updatedAt, createdAt',
      })
      .upgrade((transaction) =>
        transaction
          .table('characters')
          .toCollection()
          .modify((record: unknown) => {
            tryMigrateLegacyMageInPlace(record);
          }),
      );
    this.version(4)
      .stores({
        characters: 'id, systemId, updatedAt, createdAt',
      })
      .upgrade((transaction) =>
        transaction
          .table('characters')
          .toCollection()
          .modify((record: unknown) => {
            tryMigrateLegacyMageInPlace(record);
          }),
      );
    this.version(5)
      .stores({
        characters: 'id, systemId, updatedAt, createdAt',
      })
      .upgrade((transaction) =>
        transaction
          .table('characters')
          .toCollection()
          .modify((record: unknown) => {
            tryMigrateLegacyMageInPlace(record);
          }),
      );
    this.version(10)
      .stores({
        characters: 'id, systemId, updatedAt, createdAt, name',
      })
      .upgrade((transaction) =>
        transaction
          .table('characters')
          .toCollection()
          .modify((record: unknown) => {
            replaceRecord(
              record as Record<string, unknown>,
              preserveAsEnvelope(record),
            );
          }),
      );
    this.version(11).stores({
      characters: 'id, systemId, updatedAt, createdAt, name',
      modulePackages:
        '[moduleId+moduleVersion], moduleId, moduleVersion, origin, installedAt',
      moduleInstallations: 'moduleId, activeVersion, origin, updatedAt',
      moduleDrafts: 'id, moduleId, updatedAt',
      moduleLocks: 'id, moduleId, moduleVersion, createdAt',
    });
  }
}

export { MageDatabase as ArcaneRecordDatabase };
