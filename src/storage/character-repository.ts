import type { MageCharacter } from '../types/character';

export interface CharacterRepository {
  list(): Promise<MageCharacter[]>;
  get(id: string): Promise<MageCharacter | null>;
  create(character?: MageCharacter): Promise<MageCharacter>;
  save(character: MageCharacter): Promise<MageCharacter>;
  duplicate(id: string): Promise<MageCharacter>;
  delete(id: string): Promise<void>;
}
