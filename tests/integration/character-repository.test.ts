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
});
