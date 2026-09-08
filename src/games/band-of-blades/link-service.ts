import type { StoredCharacterRepository } from '../../storage/stored-character-repository';
import type { BobCharacter, BobChosen, BobLegion } from './schema';
import {
  BOB_CHOSEN_SYSTEM_ID,
  BOB_LEGION_SYSTEM_ID,
  BOB_SYSTEM_ID,
} from './definitions';
export class BobLegionLinkService {
  constructor(private repository: StoredCharacterRepository) {}
  async list() {
    return (await this.repository.list()).filter(
      (x) => x.systemId === BOB_LEGION_SYSTEM_ID,
    );
  }
  async resolve(id: string) {
    const record = await this.repository.get(id);
    if (!record || record.systemId !== BOB_LEGION_SYSTEM_ID) return null;
    return { record, legion: record.data as BobLegion };
  }
  async references(id: string) {
    return (await this.repository.list()).filter((r) => {
      if (![BOB_SYSTEM_ID, BOB_CHOSEN_SYSTEM_ID].includes(r.systemId))
        return false;
      const d = r.data as BobCharacter | BobChosen;
      return d.legion.kind === 'linked' && d.legion.legionId === id;
    });
  }
  async link<T extends BobCharacter | BobChosen>(
    value: T,
    id: string,
  ): Promise<T> {
    const found = await this.resolve(id);
    if (!found) throw new Error('Choose an available Band of Blades Legion.');
    return {
      ...value,
      legion: {
        kind: 'linked',
        legionId: id,
        snapshot: {
          legionId: id,
          name: found.legion.name,
          revision: found.legion.revision,
          capturedAt: new Date().toISOString(),
        },
      },
    } as T;
  }
  async prepareExport<T extends BobCharacter | BobChosen>(
    value: T,
  ): Promise<T> {
    if (value.legion.kind !== 'linked') return structuredClone(value);
    const found = await this.resolve(value.legion.legionId);
    if (!found) throw new Error('The linked Legion is unavailable.');
    return {
      ...structuredClone(value),
      legion: {
        kind: 'linked',
        legionId: value.legion.legionId,
        snapshot: {
          legionId: value.legion.legionId,
          name: found.legion.name,
          revision: found.legion.revision,
          capturedAt: new Date().toISOString(),
        },
      },
    } as T;
  }
}
