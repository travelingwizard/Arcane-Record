import { describe, expect, it } from 'vitest';
import { Wr20ShadowLinkService } from '../../src/games/wraith20/link-service';
import {
  wr20Definition,
  wr20ShadowDefinition,
} from '../../src/games/wraith20/definition';
import {
  WR20_SHADOW_SYSTEM_ID,
  WR20_SYSTEM_ID,
} from '../../src/games/wraith20/definitions';
import {
  createWr20Character,
  createWr20Shadow,
} from '../../src/games/wraith20/create-character';
import type { StoredCharacterRepository } from '../../src/storage/stored-character-repository';
import type { StoredCharacter } from '../../src/storage/stored-character';
import type { Wr20Character } from '../../src/games/wraith20/schema';

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
  return { repository, service: new Wr20ShadowLinkService(repository) };
}

function shadowRecord(name: string): StoredCharacter {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    systemId: WR20_SHADOW_SYSTEM_ID,
    systemVersion: 1,
    name,
    createdAt: now,
    updatedAt: now,
    data: { ...createWr20Shadow(), name },
  };
}

function wraithRecord(name: string): StoredCharacter {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    systemId: WR20_SYSTEM_ID,
    systemVersion: 1,
    name,
    createdAt: now,
    updatedAt: now,
    data: { ...createWr20Character(), name },
  };
}

describe('Wraith/Shadow link service', () => {
  it('links to an existing Shadow and unlinks without deleting it', async () => {
    const { service, repository } = fixture();
    const shadow = shadowRecord('A Shadow');
    await repository.create(shadow);
    let character = createWr20Character();
    character = await service.link(character, shadow.id);
    expect(character.shadow).toEqual({ kind: 'linked', shadowId: shadow.id });
    character = await service.unlink(character);
    expect(character.shadow).toEqual({ kind: 'none' });
    expect(await repository.get(shadow.id)).not.toBeNull();
  });

  it('refuses to link an unknown or wrong-system record', async () => {
    const { service } = fixture();
    const character = createWr20Character();
    await expect(service.link(character, 'missing-id')).rejects.toThrow();
  });

  it('lists only Shadow records and resolves a linked one', async () => {
    const { service, repository } = fixture();
    const shadow = shadowRecord('Listed Shadow');
    await repository.create(shadow);
    await repository.create(wraithRecord('Not a Shadow'));
    expect((await service.list()).map((r) => r.id)).toEqual([shadow.id]);
    const resolved = await service.resolve(shadow.id);
    expect(resolved?.shadow.name).toBe('Listed Shadow');
    expect(await service.resolve('missing-id')).toBeNull();
  });

  it('finds every Wraith that references a given Shadow', async () => {
    const { service, repository } = fixture();
    const shadow = shadowRecord('Shared Shadow');
    await repository.create(shadow);
    const a = wraithRecord('Psyche A');
    a.data = {
      ...(a.data as Wr20Character),
      shadow: { kind: 'linked', shadowId: shadow.id },
    };
    const b = wraithRecord('Psyche B');
    await repository.create(a);
    await repository.create(b);
    expect((await service.references(shadow.id)).map((r) => r.name)).toEqual([
      'Psyche A',
    ]);
  });

  it('exports unchanged when there is no link', async () => {
    const { service } = fixture();
    const character = createWr20Character();
    expect(await service.prepareExport(character)).toEqual(character);
  });

  it('refuses to export a Wraith whose linked Shadow is gone', async () => {
    const { service, repository } = fixture();
    const shadow = shadowRecord('Gone Shadow');
    await repository.create(shadow);
    let character = createWr20Character();
    character = await service.link(character, shadow.id);
    await repository.delete(shadow.id);
    await expect(service.prepareExport(character)).rejects.toThrow(
      /unavailable/i,
    );
  });

  it('exports successfully while the linked Shadow is still available', async () => {
    const { service, repository } = fixture();
    const shadow = shadowRecord('Still here');
    await repository.create(shadow);
    let character = createWr20Character();
    character = await service.link(character, shadow.id);
    const exported = await service.prepareExport(character);
    expect(exported.shadow).toEqual({ kind: 'linked', shadowId: shadow.id });
  });
});

describe('Wraith definition delete warnings', () => {
  it('warns when deleting a Wraith with a linked Shadow, but not an unlinked one', async () => {
    const { repository } = fixture();
    const shadow = shadowRecord('Linked Shadow');
    await repository.create(shadow);
    const linkedWraith = wraithRecord('Linked Psyche');
    linkedWraith.data = {
      ...(linkedWraith.data as Wr20Character),
      shadow: { kind: 'linked', shadowId: shadow.id },
    };
    await repository.create(linkedWraith);
    const unlinkedWraith = wraithRecord('Solo Psyche');
    await repository.create(unlinkedWraith);
    expect(
      await wr20Definition.getDeleteWarning?.(linkedWraith.id, repository),
    ).toMatch(/linked Shadow/i);
    expect(
      await wr20Definition.getDeleteWarning?.(unlinkedWraith.id, repository),
    ).toBeNull();
  });

  it('warns when deleting a Shadow that a Wraith still links to', async () => {
    const { repository } = fixture();
    const shadow = shadowRecord('Referenced Shadow');
    await repository.create(shadow);
    const wraith = wraithRecord('Dependent Psyche');
    wraith.data = {
      ...(wraith.data as Wr20Character),
      shadow: { kind: 'linked', shadowId: shadow.id },
    };
    await repository.create(wraith);
    const warning = await wr20ShadowDefinition.getDeleteWarning?.(
      shadow.id,
      repository,
    );
    expect(warning).toMatch(/Dependent Psyche/);
    const orphanShadow = shadowRecord('Unreferenced Shadow');
    await repository.create(orphanShadow);
    expect(
      await wr20ShadowDefinition.getDeleteWarning?.(
        orphanShadow.id,
        repository,
      ),
    ).toBeNull();
  });
});
