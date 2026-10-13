import type { StoredCharacterRepository } from '../../storage/stored-character-repository';
import { WR20_SHADOW_SYSTEM_ID, WR20_SYSTEM_ID } from './definitions';
import type { Wr20Character, Wr20Shadow } from './schema';

/**
 * Game-owned adapter for the Wraith (psyche) <-> Shadow link. Mirrors the
 * `BitdCrewLinkService` / `BobLegionLinkService` pattern used by the other
 * linked-record games: the link is a plain foreign ID, it never silently
 * travels across browsers on import, `prepareExport` only guards that the
 * link still resolves before export, and a manual link/unlink control lets
 * the user re-establish the pair after both halves have been imported
 * separately into the same browser.
 */
export class Wr20ShadowLinkService {
  constructor(private readonly repository: StoredCharacterRepository) {}

  async list() {
    return (await this.repository.list()).filter(
      (record) => record.systemId === WR20_SHADOW_SYSTEM_ID,
    );
  }

  async resolve(shadowId: string) {
    const record = await this.repository.get(shadowId);
    if (!record || record.systemId !== WR20_SHADOW_SYSTEM_ID) return null;
    return { record, shadow: record.data as Wr20Shadow };
  }

  /** Wraith/Medium/Spectre records whose `shadow` links to this Shadow record. */
  async references(shadowId: string) {
    return (await this.repository.list()).filter((record) => {
      if (record.systemId !== WR20_SYSTEM_ID) return false;
      const character = record.data as Wr20Character;
      return (
        character.shadow.kind === 'linked' &&
        character.shadow.shadowId === shadowId
      );
    });
  }

  async link(value: Wr20Character, shadowId: string): Promise<Wr20Character> {
    const found = await this.resolve(shadowId);
    if (!found) throw new Error('Choose an available Shadow record.');
    return { ...value, shadow: { kind: 'linked', shadowId } };
  }

  async unlink(value: Wr20Character): Promise<Wr20Character> {
    return { ...value, shadow: { kind: 'none' } };
  }

  /** Refuse to export a Wraith whose linked Shadow is no longer available. */
  async prepareExport(value: Wr20Character): Promise<Wr20Character> {
    if (value.shadow.kind !== 'linked') return structuredClone(value);
    const found = await this.resolve(value.shadow.shadowId);
    if (!found) {
      throw new Error(
        'The linked Shadow is unavailable. Unlink it, or restore the Shadow record, before exporting.',
      );
    }
    return structuredClone(value);
  }
}
