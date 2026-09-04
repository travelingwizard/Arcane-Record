import { describe, expect, it } from 'vitest';
import { CityCrewService } from '../../src/games/city-of-mist/crew-service';
import {
  cityCharacterSchema,
  createCityCharacter,
  createCityCrew,
} from '../../src/games/city-of-mist/schema';
import type { StoredCharacterRepository } from '../../src/storage/stored-character-repository';
import type { StoredCharacter } from '../../src/storage/stored-character';
import {
  serializeCharacter,
  prepareImportedRecord,
} from '../../src/features/import-export/character-files';
import { gameSystemRegistry } from '../../src/games/registry';

function fixture() {
  const records = new Map<string, StoredCharacter>();
  const repository: StoredCharacterRepository = {
    list: async () => [...records.values()].map((r) => structuredClone(r)),
    get: async (id) => structuredClone(records.get(id) ?? null),
    create: async (r) => {
      if (records.has(r.id)) throw new Error('Duplicate ID');
      records.set(r.id, structuredClone(r));
      return r;
    },
    save: async (r) => {
      records.set(r.id, structuredClone(r));
      return r;
    },
    delete: async (id) => {
      records.delete(id);
    },
  };
  return { repository, service: new CityCrewService(repository) };
}

describe('City of Mist crew links', () => {
  it.each(['json', 'yaml'] as const)(
    'keeps snapshot review pending through %s import',
    async (format) => {
      const { service } = fixture();
      const crew = await service.create('Portable crew');
      const character = createCityCharacter();
      character.crew = await service.link(crew.id);
      const data = await service.prepareExport(character);
      const file = serializeCharacter(
        {
          ...crew,
          id: crypto.randomUUID(),
          systemId: 'city-of-mist',
          systemVersion: 2,
          data,
        },
        format,
      );
      const imported = prepareImportedRecord(
        file,
        `sheet.${format}`,
        gameSystemRegistry,
        new Date(),
        crypto.randomUUID(),
      );
      const parsed = cityCharacterSchema.parse(imported.data);
      expect(parsed.crew.kind).toBe('none');
      expect(parsed.crewTransfer?.snapshot.name).toBe('Portable crew');
    },
  );
  it('supports Rift and Gatekeeper drafts without inventing theme choices', () => {
    expect(createCityCharacter().profile).toBe('rift');
    expect(createCityCharacter('gatekeeper').themes).toEqual([]);
  });
  it('resolves changes from one crew for every linked sheet', async () => {
    const { repository, service } = fixture();
    const record = await service.create('Night Shift');
    const a = await service.link(record.id);
    const b = await service.link(record.id);
    await repository.save({
      ...record,
      data: { ...createCityCrew('Night Shift'), notes: 'New shared lead' },
    });
    for (const binding of [a, b]) {
      const result = await service.resolve(binding);
      expect(result.status).toBe('available');
      if (result.status === 'available')
        expect(result.crew.notes).toBe('New shared lead');
    }
  });
  it('makes an independent personal copy without deleting the crew', async () => {
    const { service } = fixture();
    const record = await service.create('Shared');
    const personal = await service.detach(await service.link(record.id));
    if (personal.kind === 'embedded') personal.crew.name = 'Personal';
    const shared = await service.resolve({ kind: 'linked', crewId: record.id });
    if (shared.status === 'available') expect(shared.crew.name).toBe('Shared');
    expect(await service.list()).toHaveLength(1);
  });
  it('retains unavailable links instead of replacing or deleting them', async () => {
    const { repository, service } = fixture();
    const record = await service.create('Gone');
    const binding = await service.link(record.id);
    await repository.delete(record.id);
    expect(await service.resolve(binding)).toMatchObject({
      status: 'unavailable',
      crewId: record.id,
    });
    await expect(service.detach(binding)).rejects.toThrow();
  });
  it('rejects links to another game or a future crew schema', async () => {
    const { repository, service } = fixture();
    const record = await service.create('Crew');
    await repository.save({ ...record, systemId: 'mage20' });
    await expect(service.link(record.id)).rejects.toThrow();
    await repository.save({ ...record, systemVersion: 99 });
    expect(
      await service.resolve({ kind: 'linked', crewId: record.id }),
    ).toMatchObject({ status: 'unavailable' });
  });
  it('round-trips personal crew and character-owned relationships', () => {
    const character = createCityCharacter();
    character.crew = { kind: 'embedded', crew: createCityCrew('Only mine') };
    expect(
      cityCharacterSchema.parse(JSON.parse(JSON.stringify(character))),
    ).toEqual(character);
  });
  it('exports a detached snapshot and requires reviewed relinking without overwriting crews', async () => {
    const { service, repository } = fixture();
    const record = await service.create('Original');
    const character = createCityCharacter();
    character.crew = await service.link(record.id);
    const portable = await service.prepareExport(character);
    expect(portable.crew.kind).toBe('none');
    expect(portable.crewTransfer?.snapshot.name).toBe('Original');
    expect(character.crew.kind).toBe('linked');
    const local = await service.create('Different local crew');
    const linked = await service.acceptTransfer(portable, 'link', local.id);
    expect(linked.crew).toEqual({ kind: 'linked', crewId: local.id });
    expect(linked.crewTransfer).toBeNull();
    expect((await repository.get(local.id))?.name).toBe('Different local crew');
    const personal = await service.acceptTransfer(portable, 'personal');
    expect(personal.crew.kind).toBe('embedded');
    const fresh = await service.acceptTransfer(portable, 'new');
    expect(fresh.crew.kind).toBe('linked');
    if (fresh.crew.kind === 'linked')
      expect(fresh.crew.crewId).not.toBe(record.id);
  });
  it('reports referencing characters and refuses a missing snapshot source', async () => {
    const { service, repository } = fixture();
    const record = await service.create('Crew');
    const c = createCityCharacter();
    c.crew = await service.link(record.id);
    await repository.create({
      ...record,
      id: crypto.randomUUID(),
      systemId: 'city-of-mist',
      systemVersion: 2,
      name: 'Member',
      data: c,
    });
    expect((await service.references(record.id)).map((r) => r.name)).toEqual([
      'Member',
    ]);
    await repository.delete(record.id);
    await expect(service.prepareExport(c)).rejects.toThrow('unavailable');
  });
});
