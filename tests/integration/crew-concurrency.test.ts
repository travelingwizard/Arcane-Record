import { it, expect } from 'vitest';
import { MageDatabase } from '../../src/storage/mage-database';
import { DexieStoredCharacterRepository } from '../../src/storage/dexie-stored-character-repository';
import { CityCrewService } from '../../src/games/city-of-mist/crew-service';
import { createCityCrew } from '../../src/games/city-of-mist/schema';

it('atomically allows one of two stale crew writers and prevents resurrection after deletion', async () => {
  const db = new MageDatabase(`crew-concurrency-${crypto.randomUUID()}`);
  try {
    const repository = new DexieStoredCharacterRepository(db);
    const record = await new CityCrewService(repository).create('Crew');
    const expected = JSON.stringify(record.data);
    const outcomes = await Promise.allSettled([
      repository.saveIfUnchanged(
        { ...record, data: { ...createCityCrew('Crew'), notes: 'First' } },
        expected,
      ),
      repository.saveIfUnchanged(
        { ...record, data: { ...createCityCrew('Crew'), notes: 'Second' } },
        expected,
      ),
    ]);
    expect(outcomes.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((r) => r.status === 'rejected')).toHaveLength(1);
    const saved = await repository.get(record.id);
    await repository.delete(record.id);
    await expect(
      repository.saveIfUnchanged(record, JSON.stringify(saved!.data)),
    ).rejects.toThrow('deleted');
    expect(await repository.get(record.id)).toBeNull();
  } finally {
    await db.delete();
  }
});
