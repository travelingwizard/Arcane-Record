import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import { EXALTED1E_SCHEMA_VERSION } from '../../src/games/exalted1e/definitions';
import { DexieStoredCharacterRepository } from '../../src/storage/dexie-stored-character-repository';
import { MageDatabase } from '../../src/storage/mage-database';

describe('generic stored character repository', () => {
  let database: MageDatabase | undefined;

  afterEach(async () => {
    await database?.delete();
  });

  it('upgrades an existing Mage row in place without changing its identity', async () => {
    const name = `arcane-record-envelope-${crypto.randomUUID()}`;
    const legacyDatabase = new Dexie(name);
    legacyDatabase.version(1).stores({
      characters: 'id, systemId, updatedAt, createdAt',
    });
    const legacy = createBlankMageCharacter(
      new Date('2026-07-01T12:00:00.000Z'),
      '49e1ebbb-ded1-458e-81c2-680918479336',
    );
    legacy.identity.name = 'Mara Voss';
    await legacyDatabase.table('characters').add(legacy);
    legacyDatabase.close();

    database = new MageDatabase(name);
    const repository = new DexieStoredCharacterRepository(database);
    const migrated = await repository.get(legacy.id);

    expect(migrated).toMatchObject({
      id: legacy.id,
      systemId: 'mage20',
      systemVersion: 12,
      name: 'Mara Voss',
      createdAt: legacy.createdAt,
      updatedAt: legacy.updatedAt,
    });
    expect(migrated?.data).toMatchObject({
      identity: { name: 'Mara Voss' },
      spheres: legacy.spheres,
    });
    expect(migrated?.data).not.toHaveProperty('systemId');
  });

  it('keeps unrecognized stored content recoverable', async () => {
    const name = `arcane-record-unknown-${crypto.randomUUID()}`;
    const legacyDatabase = new Dexie(name);
    legacyDatabase.version(1).stores({
      characters: 'id, systemId, updatedAt, createdAt',
    });
    const timestamp = '2026-07-01T12:00:00.000Z';
    await legacyDatabase.table('characters').add({
      id: 'unknown-1',
      systemId: 'future-game',
      schemaVersion: 3,
      createdAt: timestamp,
      updatedAt: timestamp,
      secretField: 'preserve me',
    });
    legacyDatabase.close();

    database = new MageDatabase(name);
    const repository = new DexieStoredCharacterRepository(database);
    const migrated = await repository.get('unknown-1');

    expect(migrated?.systemId).toBe('future-game');
    expect(migrated?.data).toMatchObject({ secretField: 'preserve me' });
  });

  it('persists Dragon-Blooded Merit and Flaw selections unchanged', async () => {
    const name = `arcane-record-exalted-traits-${crypto.randomUUID()}`;
    database = new MageDatabase(name);
    const repository = new DexieStoredCharacterRepository(database);
    const character = createBlankExaltedCharacter('dragon-blooded');
    character.meritsFlaws.merits.push({
      id: '4b64669d-1a0f-442d-8aca-aa3b197f4b2c',
      definitionId: 'acute-sense',
      chosenCost: 3,
      choiceLabel: 'Sight',
      notes: 'Reads banners over great distances.',
    });
    await repository.create({
      id: 'db-traits',
      systemId: 'exalted1e',
      systemVersion: EXALTED1E_SCHEMA_VERSION,
      name: 'Tepet Arada',
      createdAt: '2026-08-07T12:00:00.000Z',
      updatedAt: '2026-08-07T12:00:00.000Z',
      data: character,
    });

    expect((await repository.get('db-traits'))?.data).toMatchObject({
      meritsFlaws: {
        merits: [
          {
            definitionId: 'acute-sense',
            chosenCost: 3,
            choiceLabel: 'Sight',
          },
        ],
        flaws: [],
      },
    });
  });
});
