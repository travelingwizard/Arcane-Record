import type { StoredCharacterRepository } from '../../storage/stored-character-repository';
import { SANDV_SHIP_SYSTEM_ID, SANDV_SYSTEM_ID } from './definitions';
import type { SandvCharacter, SandvShip } from './schema';
export class SandvShipLinkService {
  constructor(private repository: StoredCharacterRepository) {}
  async list() {
    return (await this.repository.list()).filter(
      (x) => x.systemId === SANDV_SHIP_SYSTEM_ID,
    );
  }
  async resolve(id: string) {
    const record = await this.repository.get(id);
    if (!record || record.systemId !== SANDV_SHIP_SYSTEM_ID) return null;
    return { record, ship: record.data as SandvShip };
  }
  async references(id: string) {
    return (await this.repository.list()).filter((r) => {
      if (r.systemId !== SANDV_SYSTEM_ID) return false;
      const c = r.data as SandvCharacter;
      return c.ship.kind === 'linked' && c.ship.shipId === id;
    });
  }
  async link(value: SandvCharacter, id: string) {
    const found = await this.resolve(id);
    if (!found) throw new Error('Choose an available Scum and Villainy ship.');
    return {
      ...value,
      ship: {
        kind: 'linked' as const,
        shipId: id,
        snapshot: {
          shipId: id,
          name: found.ship.name,
          revision: found.ship.revision,
          capturedAt: new Date().toISOString(),
        },
      },
    };
  }
  async prepareExport(value: SandvCharacter) {
    return value.ship.kind === 'linked'
      ? this.link(structuredClone(value), value.ship.shipId)
      : structuredClone(value);
  }
}
