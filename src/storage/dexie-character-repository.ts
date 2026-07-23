import { createBlankMageCharacter } from '../systems/mage-m20/create-character';
import { mageCharacterSchema } from '../systems/mage-m20/character-schema';
import type { MageCharacter } from '../types/character';
import type { CharacterRepository } from './character-repository';
import { MageDatabase } from './mage-database';

export class DexieCharacterRepository implements CharacterRepository {
  constructor(private readonly database: MageDatabase) {}

  async list(): Promise<MageCharacter[]> {
    const records = await this.database.characters
      .orderBy('updatedAt')
      .reverse()
      .toArray();
    return records.map((record) => mageCharacterSchema.parse(record));
  }

  async get(id: string): Promise<MageCharacter | null> {
    const record = await this.database.characters.get(id);
    return record ? mageCharacterSchema.parse(record) : null;
  }

  async create(character = createBlankMageCharacter()): Promise<MageCharacter> {
    const validated = mageCharacterSchema.parse(character);
    await this.database.characters.add(validated);
    return validated;
  }

  async save(character: MageCharacter): Promise<MageCharacter> {
    const candidate = {
      ...character,
      updatedAt: new Date().toISOString(),
    };
    const validated = mageCharacterSchema.parse(candidate);
    await this.database.characters.put(validated);
    return validated;
  }

  async duplicate(id: string): Promise<MageCharacter> {
    const source = await this.get(id);
    if (!source) {
      throw new Error('Character not found.');
    }

    const now = new Date().toISOString();
    const copy = mageCharacterSchema.parse({
      ...structuredClone(source),
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      identity: {
        ...source.identity,
        name: source.identity.name
          ? `${source.identity.name} (Copy)`
          : 'Untitled mage (Copy)',
      },
    });
    await this.database.characters.add(copy);
    return copy;
  }

  async delete(id: string): Promise<void> {
    await this.database.characters.delete(id);
  }
}
