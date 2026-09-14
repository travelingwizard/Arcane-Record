import { afterEach, describe, expect, it } from 'vitest';
import {
  createDitvCharacter,
  createDitvTown,
} from '../../src/games/dogs-in-the-vineyard/create-character';
import {
  DITV_SYSTEM_ID,
  DITV_TOWN_SYSTEM_ID,
} from '../../src/games/dogs-in-the-vineyard/definitions';
import { DitvTownLinkService } from '../../src/games/dogs-in-the-vineyard/link-service';
import { DexieStoredCharacterRepository } from '../../src/storage/dexie-stored-character-repository';
import { MageDatabase } from '../../src/storage/mage-database';

const databases: MageDatabase[] = [];
afterEach(async () =>
  Promise.all(databases.splice(0).map((db) => db.delete())),
);

describe('Dogs Town links', () => {
  it('exports only the player-safe Town snapshot and reports linked records', async () => {
    const db = new MageDatabase(`ditv-links-${crypto.randomUUID()}`);
    databases.push(db);
    const repository = new DexieStoredCharacterRepository(db);
    const createdAt = new Date().toISOString();
    const town = createDitvTown();
    town.name = 'Dry Creek';
    town.assignment = 'Deliver mail and meet the Steward.';
    town.privateNotes = 'The Steward is the sorcerer.';
    const townRecord = await repository.create({
      id: crypto.randomUUID(),
      systemId: DITV_TOWN_SYSTEM_ID,
      systemVersion: 1,
      name: town.name,
      createdAt,
      updatedAt: createdAt,
      data: town,
    });
    const service = new DitvTownLinkService(repository);
    const linked = await service.link(
      createDitvCharacter('manual'),
      townRecord.id,
    );
    const characterRecord = await repository.create({
      id: crypto.randomUUID(),
      systemId: DITV_SYSTEM_ID,
      systemVersion: 1,
      name: 'Sister Mercy',
      createdAt,
      updatedAt: createdAt,
      data: linked,
    });
    const exported = await service.prepareExport(linked);
    expect(exported.town.kind).toBe('linked');
    expect(JSON.stringify(exported.town)).toContain('Deliver mail');
    expect(JSON.stringify(exported.town)).not.toContain('sorcerer');
    expect((await service.references(townRecord.id)).map((x) => x.id)).toEqual([
      characterRecord.id,
    ]);
  });
});
