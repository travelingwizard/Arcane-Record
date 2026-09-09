import type { StoredCharacterRepository } from '../../storage/stored-character-repository';
import { MOTW_KEEPER_SYSTEM_ID, MOTW_SYSTEM_ID } from './definitions';
import type { MotwHunter, MotwKeeper } from './schema';
export class MotwCampaignLinkService {
  constructor(private repository: StoredCharacterRepository) {}
  async list() {
    return (await this.repository.list()).filter(
      (x) => x.systemId === MOTW_KEEPER_SYSTEM_ID,
    );
  }
  async resolve(id: string) {
    const record = await this.repository.get(id);
    if (!record || record.systemId !== MOTW_KEEPER_SYSTEM_ID) return null;
    return { record, campaign: record.data as MotwKeeper };
  }
  async references(id: string) {
    return (await this.repository.list()).filter(
      (r) =>
        r.systemId === MOTW_SYSTEM_ID &&
        (r.data as MotwHunter).campaign.kind === 'linked' &&
        (
          r.data as MotwHunter & {
            campaign: { kind: 'linked'; campaignId: string };
          }
        ).campaign.campaignId === id,
    );
  }
  async link(value: MotwHunter, id: string) {
    const found = await this.resolve(id);
    if (!found)
      throw new Error('Choose an available Monster of the Week campaign.');
    return {
      ...value,
      campaign: {
        kind: 'linked' as const,
        campaignId: id,
        snapshot: {
          campaignId: id,
          name: found.campaign.name,
          revision: found.campaign.revision,
          teamConcept: found.campaign.teamConcept,
          capturedAt: new Date().toISOString(),
        },
      },
    };
  }
  async prepareExport(value: MotwHunter) {
    return value.campaign.kind === 'linked'
      ? this.link(structuredClone(value), value.campaign.campaignId)
      : structuredClone(value);
  }
}
