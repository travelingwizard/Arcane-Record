import { afterEach, describe, expect, it } from 'vitest';
import { MageDatabase } from '../../src/storage/mage-database';
import { DexieStoredCharacterRepository } from '../../src/storage/dexie-stored-character-repository';
import type { StoredCharacter } from '../../src/storage/stored-character';

describe('atomic linked-record updates', () => {
  let database: MageDatabase;
  afterEach(async () => database?.delete());

  async function setup() {
    database = new MageDatabase(`atomic-${crypto.randomUUID()}`);
    const repository = new DexieStoredCharacterRepository(database);
    const row = (id: string): StoredCharacter => ({
      id,
      systemId: 'test-system',
      systemVersion: 1,
      name: id,
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
      data: { value: 10 },
    });
    const hero = await repository.create(row('hero'));
    const covenant = await repository.create(row('covenant'));
    const updates = [hero, covenant].map((expected) => ({
      expected,
      record: { ...expected, data: { value: 9 } },
    }));
    return { repository, hero, covenant, updates };
  }

  it('commits both records and rejects replay', async () => {
    const { repository, updates } = await setup();
    await repository.saveAtomicallyIfUnchanged(updates);
    expect((await repository.get('hero'))?.data).toEqual({ value: 9 });
    expect((await repository.get('covenant'))?.data).toEqual({ value: 9 });
    await expect(repository.saveAtomicallyIfUnchanged(updates)).rejects.toThrow(
      'changed',
    );
  });

  it('does not save the first record if the second is stale', async () => {
    const { repository, updates, hero, covenant } = await setup();
    await repository.save({ ...covenant, name: 'Renamed elsewhere' });
    await expect(repository.saveAtomicallyIfUnchanged(updates)).rejects.toThrow(
      'changed',
    );
    expect(await repository.get(hero.id)).toEqual(hero);
  });

  it('rejects deleted records, duplicate targets, and invalid output', async () => {
    const { repository, updates, hero, covenant } = await setup();
    await expect(
      repository.saveAtomicallyIfUnchanged([updates[0], updates[0]]),
    ).rejects.toThrow('distinct');
    await expect(repository.saveAtomicallyIfUnchanged([])).rejects.toThrow(
      'distinct',
    );
    await expect(
      repository.saveAtomicallyIfUnchanged([
        updates[0],
        { ...updates[1], record: { ...updates[1].record, systemVersion: -1 } },
      ]),
    ).rejects.toThrow();
    expect(await repository.get(hero.id)).toEqual(hero);
    await repository.delete(covenant.id);
    await expect(repository.saveAtomicallyIfUnchanged(updates)).rejects.toThrow(
      'deleted',
    );
    expect(await repository.get(hero.id)).toEqual(hero);
  });

  it('allows only one concurrent confirmation', async () => {
    const { repository, updates } = await setup();
    const results = await Promise.allSettled([
      repository.saveAtomicallyIfUnchanged(updates),
      repository.saveAtomicallyIfUnchanged(updates),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
  });
});
