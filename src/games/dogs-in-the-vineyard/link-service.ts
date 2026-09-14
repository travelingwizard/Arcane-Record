import type { StoredCharacterRepository } from '../../storage/stored-character-repository';
import { DITV_SYSTEM_ID, DITV_TOWN_SYSTEM_ID } from './definitions';
import type { DitvCharacter, DitvTown } from './schema';

export class DitvTownLinkService {
  constructor(private repository: StoredCharacterRepository) {}
  async list() {
    return (await this.repository.list()).filter(
      (x) => x.systemId === DITV_TOWN_SYSTEM_ID,
    );
  }
  async resolve(id: string) {
    const record = await this.repository.get(id);
    if (!record || record.systemId !== DITV_TOWN_SYSTEM_ID) return null;
    return { record, town: record.data as DitvTown };
  }
  async references(id: string) {
    return (await this.repository.list()).filter((r) => {
      if (r.systemId !== DITV_SYSTEM_ID) return false;
      const c = r.data as DitvCharacter;
      return c.town.kind === 'linked' && c.town.townId === id;
    });
  }
  async link(value: DitvCharacter, id: string) {
    const found = await this.resolve(id);
    if (!found)
      throw new Error('Choose an available Dogs in the Vineyard Town.');
    return {
      ...value,
      town: {
        kind: 'linked' as const,
        townId: id,
        snapshot: {
          townId: id,
          name: found.town.name,
          revision: found.town.revision,
          assignment: found.town.assignment,
          capturedAt: new Date().toISOString(),
        },
      },
    };
  }
  async prepareExport(value: DitvCharacter) {
    return value.town.kind === 'linked'
      ? this.link(structuredClone(value), value.town.townId)
      : structuredClone(value);
  }
}
