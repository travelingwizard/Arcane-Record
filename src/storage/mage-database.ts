import Dexie, { type EntityTable } from 'dexie';
import { migrateMageCharacter } from '../systems/mage-m20/character-schema';
import type { MageCharacter } from '../types/character';

export class MageDatabase extends Dexie {
  characters!: EntityTable<MageCharacter, 'id'>;

  constructor(name = 'arcane-ledger') {
    super(name);
    this.version(1).stores({
      characters: 'id, systemId, updatedAt, createdAt',
    });
    this.version(2)
      .stores({
        characters: 'id, systemId, updatedAt, createdAt',
      })
      .upgrade((transaction) =>
        transaction
          .table('characters')
          .toCollection()
          .modify((record: unknown) => {
            Object.assign(
              record as Record<string, unknown>,
              migrateMageCharacter(record),
            );
          }),
      );
    this.version(3)
      .stores({
        characters: 'id, systemId, updatedAt, createdAt',
      })
      .upgrade((transaction) =>
        transaction
          .table('characters')
          .toCollection()
          .modify((record: unknown) => {
            Object.assign(
              record as Record<string, unknown>,
              migrateMageCharacter(record),
            );
          }),
      );
    this.version(4)
      .stores({
        characters: 'id, systemId, updatedAt, createdAt',
      })
      .upgrade((transaction) =>
        transaction
          .table('characters')
          .toCollection()
          .modify((record: unknown) => {
            Object.assign(
              record as Record<string, unknown>,
              migrateMageCharacter(record),
            );
          }),
      );
  }
}
