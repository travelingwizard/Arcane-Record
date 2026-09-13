import type { StoredCharacter } from './stored-character';

export interface AtomicRecordUpdate {
  record: StoredCharacter;
  /** Exact previously read envelope, not just its character data. */
  expected: StoredCharacter;
}

export interface StoredCharacterRepository {
  list(): Promise<StoredCharacter[]>;
  get(id: string): Promise<StoredCharacter | null>;
  create(record: StoredCharacter): Promise<StoredCharacter>;
  save(record: StoredCharacter): Promise<StoredCharacter>;
  saveIfUnchanged?(
    record: StoredCharacter,
    expectedData: string,
  ): Promise<StoredCharacter>;
  delete(id: string): Promise<void>;
  /** All-or-nothing updates. Callers must not fall back to sequential saves. */
  saveAtomicallyIfUnchanged?(
    updates: readonly AtomicRecordUpdate[],
  ): Promise<StoredCharacter[]>;
}
