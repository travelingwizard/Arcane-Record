import Dexie, { type EntityTable } from 'dexie';
import type { MageCharacter } from '../types/character';

export class MageDatabase extends Dexie {
  characters!: EntityTable<MageCharacter, 'id'>;

  constructor(name = 'arcane-ledger') {
    super(name);
    this.version(1).stores({
      characters: 'id, systemId, updatedAt, createdAt',
    });
  }
}
