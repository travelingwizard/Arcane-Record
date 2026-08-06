import type { StoredCharacter } from './stored-character';

export interface StoredCharacterRepository {
  list(): Promise<StoredCharacter[]>;
  get(id: string): Promise<StoredCharacter | null>;
  create(record: StoredCharacter): Promise<StoredCharacter>;
  save(record: StoredCharacter): Promise<StoredCharacter>;
  delete(id: string): Promise<void>;
}
