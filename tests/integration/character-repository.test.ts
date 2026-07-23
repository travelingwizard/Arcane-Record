import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';
import { DexieCharacterRepository } from '../../src/storage/dexie-character-repository';
import { MageDatabase } from '../../src/storage/mage-database';

describe('DexieCharacterRepository', () => {
  let database: MageDatabase;
  let repository: DexieCharacterRepository;

  beforeEach(() => {
    database = new MageDatabase(`arcane-ledger-test-${crypto.randomUUID()}`);
    repository = new DexieCharacterRepository(database);
  });

  afterEach(async () => {
    await database.delete();
  });

  it('creates and reopens a stored character', async () => {
    const created = await repository.create();
    const reopened = await repository.get(created.id);

    expect(reopened).toEqual(created);
    expect(await repository.list()).toHaveLength(1);
  });

  it('renames a character', async () => {
    const created = await repository.create();
    const renamed = await repository.save({
      ...created,
      identity: { ...created.identity, name: 'Mara Voss' },
    });

    expect((await repository.get(created.id))?.identity.name).toBe('Mara Voss');
    expect(renamed.updatedAt >= created.updatedAt).toBe(true);
  });

  it('duplicates a character with a new UUID', async () => {
    const source = createBlankMageCharacter();
    source.identity.name = 'Mara Voss';
    source.spheres.forces = 3;
    await repository.create(source);

    const duplicate = await repository.duplicate(source.id);

    expect(duplicate.id).not.toBe(source.id);
    expect(duplicate.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(duplicate.identity.name).toBe('Mara Voss (Copy)');
    expect(duplicate.spheres.forces).toBe(3);
    expect(await repository.list()).toHaveLength(2);
  });

  it('deletes a character', async () => {
    const created = await repository.create();

    await repository.delete(created.id);

    expect(await repository.get(created.id)).toBeNull();
    expect(await repository.list()).toEqual([]);
  });

  it('migrates a stored schema-version-one character', async () => {
    await database.delete();
    const databaseName = `arcane-ledger-migration-${crypto.randomUUID()}`;
    const legacyDatabase = new Dexie(databaseName);
    legacyDatabase.version(1).stores({
      characters: 'id, systemId, updatedAt, createdAt',
    });

    const current = createBlankMageCharacter();
    const legacy = structuredClone(current) as unknown as Record<
      string,
      unknown
    >;
    legacy.schemaVersion = 1;
    delete legacy.abilities;
    delete legacy.enlightenment;

    await legacyDatabase.table('characters').add(legacy);
    legacyDatabase.close();

    database = new MageDatabase(databaseName);
    repository = new DexieCharacterRepository(database);
    const migrated = await repository.get(current.id);

    expect(migrated?.schemaVersion).toBe(3);
    expect(migrated?.abilities.talents.alertness).toBe(0);
    expect(migrated?.enlightenment).toEqual({
      arete: 1,
      willpower: 5,
      willpowerTemporary: 5,
      quintessence: 0,
      paradox: 0,
    });
    expect(migrated?.identity).toEqual(current.identity);
  });

  it('migrates schema-version-two Willpower into a temporary track', async () => {
    await database.delete();
    const databaseName = `arcane-ledger-migration-${crypto.randomUUID()}`;
    const legacyDatabase = new Dexie(databaseName);
    legacyDatabase.version(2).stores({
      characters: 'id, systemId, updatedAt, createdAt',
    });

    const current = createBlankMageCharacter();
    current.enlightenment.willpower = 7;
    const legacy = structuredClone(current) as unknown as Record<
      string,
      unknown
    >;
    legacy.schemaVersion = 2;
    delete (
      legacy.enlightenment as {
        willpowerTemporary?: number;
      }
    ).willpowerTemporary;

    await legacyDatabase.table('characters').add(legacy);
    legacyDatabase.close();

    database = new MageDatabase(databaseName);
    repository = new DexieCharacterRepository(database);
    const migrated = await repository.get(current.id);

    expect(migrated?.schemaVersion).toBe(3);
    expect(migrated?.enlightenment.willpower).toBe(7);
    expect(migrated?.enlightenment.willpowerTemporary).toBe(7);
  });
});
