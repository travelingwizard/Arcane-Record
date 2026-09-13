import {
  storedCharacterSchema,
  type StoredCharacter,
} from './stored-character';
import type { StoredCharacterRepository } from './stored-character-repository';
import type { MageDatabase } from './mage-database';
import type { AtomicRecordUpdate } from './stored-character-repository';

export class DexieStoredCharacterRepository implements StoredCharacterRepository {
  constructor(private readonly database: MageDatabase) {}

  async list() {
    return this.database.characters.orderBy('updatedAt').reverse().toArray();
  }

  async get(id: string) {
    return (await this.database.characters.get(id)) ?? null;
  }

  async create(record: StoredCharacter) {
    const validated = storedCharacterSchema.parse(record);
    await this.database.characters.add(validated);
    return validated;
  }

  async save(record: StoredCharacter) {
    const validated = storedCharacterSchema.parse({
      ...record,
      updatedAt: new Date().toISOString(),
    });
    await this.database.characters.put(validated);
    return validated;
  }

  async delete(id: string) {
    await this.database.characters.delete(id);
  }

  async saveAtomicallyIfUnchanged(updates: readonly AtomicRecordUpdate[]) {
    const ids = updates.map(({ record }) => record.id);
    if (!updates.length || new Set(ids).size !== ids.length)
      throw new Error('Atomic updates require distinct records.');
    const timestamp = new Date().toISOString();
    const validated = updates.map(({ record, expected }) => {
      if (record.id !== expected.id || record.systemId !== expected.systemId)
        throw new Error('Atomic updates cannot change record identity.');
      return storedCharacterSchema.parse({ ...record, updatedAt: timestamp });
    });
    return this.database.transaction(
      'rw',
      this.database.characters,
      async () => {
        for (const { record, expected } of updates) {
          const current = await this.database.characters.get(record.id);
          if (!current || JSON.stringify(current) !== JSON.stringify(expected))
            throw new Error(
              'A linked record changed or was deleted. Reload and review before confirming again.',
            );
        }
        await this.database.characters.bulkPut(validated);
        return validated;
      },
    );
  }

  async saveIfUnchanged(record: StoredCharacter, expectedData: string) {
    return this.database.transaction(
      'rw',
      this.database.characters,
      async () => {
        const current = await this.database.characters.get(record.id);
        if (!current || JSON.stringify(current.data) !== expectedData)
          throw new Error(
            'This character changed or was deleted in another editor. Save a file copy before reloading.',
          );
        return this.save(record);
      },
    );
  }
}
