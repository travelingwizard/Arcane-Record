import type { StoredCharacterRepository } from '../../storage/stored-character-repository';
import { BITD_CREW_SYSTEM_ID, BITD_SYSTEM_ID } from './definitions';
import type { BitdCharacter, BitdCrew } from './schema';
export class BitdCrewLinkService {
  constructor(private repository: StoredCharacterRepository) {}
  async list() {
    return (await this.repository.list()).filter(
      (x) => x.systemId === BITD_CREW_SYSTEM_ID,
    );
  }
  async resolve(id: string) {
    const record = await this.repository.get(id);
    if (!record || record.systemId !== BITD_CREW_SYSTEM_ID) return null;
    return { record, crew: record.data as BitdCrew };
  }
  async references(id: string) {
    return (await this.repository.list()).filter((r) => {
      if (r.systemId !== BITD_SYSTEM_ID) return false;
      const character = r.data as BitdCharacter;
      return character.crew.kind === 'linked' && character.crew.crewId === id;
    });
  }
  async link(value: BitdCharacter, id: string) {
    const found = await this.resolve(id);
    if (!found) throw new Error('Choose an available Blades crew.');
    return {
      ...value,
      crew: {
        kind: 'linked' as const,
        crewId: id,
        snapshot: {
          crewId: id,
          name: found.crew.name,
          revision: found.crew.revision,
          capturedAt: new Date().toISOString(),
        },
      },
    };
  }
  async prepareExport(value: BitdCharacter) {
    if (value.crew.kind !== 'linked') return structuredClone(value);
    const crewId = value.crew.crewId;
    return this.link(structuredClone(value), crewId);
  }
}
