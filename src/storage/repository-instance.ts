import { DexieCharacterRepository } from './dexie-character-repository';
import { MageDatabase } from './mage-database';

export const characterRepository = new DexieCharacterRepository(
  new MageDatabase(),
);
