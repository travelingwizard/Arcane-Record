import {
  storedCharacterSchema,
  type StoredCharacter,
} from './stored-character';
import type { StoredCharacterRepository } from './stored-character-repository';
import type { MageDatabase } from './mage-database';

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
}
