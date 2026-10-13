import type { MageCharacter } from '../types/character';

export interface CharacterRepository {
  list(): Promise<MageCharacter[]>;
  get(id: string): Promise<MageCharacter | null>;
  create(character?: MageCharacter): Promise<MageCharacter>;
  save(character: MageCharacter): Promise<MageCharacter>;
  /**
   * Optimistic-concurrency save: write `character` only if the stored
   * record's data still matches `expectedData` (a JSON-stringified
   * comparable snapshot, e.g. from `getMageCharacterData`). Rejects
   * instead of overwriting if the record changed elsewhere since
   * `expectedData` was captured. Optional because not every
   * `CharacterRepository` implementation wraps a backing store that
   * supports it; callers should fall back to plain `save` when absent.
   */
  saveIfUnchanged?(
    character: MageCharacter,
    expectedData: string,
  ): Promise<MageCharacter>;
  duplicate(id: string): Promise<MageCharacter>;
  delete(id: string): Promise<void>;
}
