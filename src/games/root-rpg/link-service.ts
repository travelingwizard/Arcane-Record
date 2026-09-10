import type { StoredCharacterRepository } from '../../storage/stored-character-repository';
import { ROOT_CAMPAIGN_SYSTEM_ID, ROOT_SYSTEM_ID } from './definitions';
import type { RootCampaign, RootVagabond } from './schema';
export class RootCampaignLinkService {
  constructor(private repository: StoredCharacterRepository) {}
  async list() {
    return (await this.repository.list()).filter(
      (x) => x.systemId === ROOT_CAMPAIGN_SYSTEM_ID,
    );
  }
  async resolve(id: string) {
    const record = await this.repository.get(id);
    if (!record || record.systemId !== ROOT_CAMPAIGN_SYSTEM_ID) return null;
    return { record, campaign: record.data as RootCampaign };
  }
  async references(id: string) {
    return (await this.repository.list()).filter(
      (r) =>
        r.systemId === ROOT_SYSTEM_ID &&
        (r.data as RootVagabond).campaign.kind === 'linked' &&
        (
          r.data as RootVagabond & {
            campaign: { kind: 'linked'; campaignId: string };
          }
        ).campaign.campaignId === id,
    );
  }
  async link(value: RootVagabond, id: string) {
    const found = await this.resolve(id);
    if (!found) throw new Error('Choose an available Root campaign.');
    return {
      ...value,
      campaign: {
        kind: 'linked' as const,
        campaignId: id,
        snapshot: {
          campaignId: id,
          name: found.campaign.name,
          revision: found.campaign.revision,
          bandName: found.campaign.bandName,
          capturedAt: new Date().toISOString(),
        },
      },
    };
  }
  async prepareExport(value: RootVagabond) {
    return value.campaign.kind === 'linked'
      ? this.link(structuredClone(value), value.campaign.campaignId)
      : structuredClone(value);
  }
}
