import { DexieCharacterRepository } from './dexie-character-repository';
import { DexieStoredCharacterRepository } from './dexie-stored-character-repository';
import { MageDatabase } from './mage-database';
import { DexieModuleRepository } from '../modules/repository/dexie-module-repository';

export const characterDatabase = new MageDatabase();
export const storedCharacterRepository = new DexieStoredCharacterRepository(
  characterDatabase,
);
export const characterRepository = new DexieCharacterRepository(
  characterDatabase,
);
export const moduleRepository = new DexieModuleRepository(characterDatabase);
