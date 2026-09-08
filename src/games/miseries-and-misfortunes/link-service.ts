import type { StoredCharacterRepository } from '../../storage/stored-character-repository';
import { MM_CAMPAIGN_SYSTEM_ID, MM_SYSTEM_ID } from './definitions';
import type { MmCampaign, MmCharacter } from './schema';
export class MmCampaignLinkService {
  constructor(private r: StoredCharacterRepository) {}
  async list() {
    return (await this.r.list()).filter(
      (x) => x.systemId === MM_CAMPAIGN_SYSTEM_ID,
    );
  }
  async resolve(id: string) {
    const record = await this.r.get(id);
    return record?.systemId === MM_CAMPAIGN_SYSTEM_ID
      ? { record, campaign: record.data as MmCampaign }
      : null;
  }
  async references(id: string) {
    return (await this.r.list()).filter((x) => {
      if (x.systemId !== MM_SYSTEM_ID) return false;
      const c = x.data as MmCharacter;
      return c.campaign.kind === 'linked' && c.campaign.campaignId === id;
    });
  }
  async link(c: MmCharacter, id: string) {
    const x = await this.resolve(id);
    if (!x) throw new Error('Choose an available campaign.');
    return {
      ...c,
      campaign: {
        kind: 'linked' as const,
        campaignId: id,
        snapshot: {
          campaignId: id,
          name: x.campaign.name,
          revision: x.campaign.revision,
          capturedAt: new Date().toISOString(),
        },
      },
    };
  }
  async prepareExport(c: MmCharacter) {
    return c.campaign.kind === 'linked'
      ? this.link(structuredClone(c), c.campaign.campaignId)
      : structuredClone(c);
  }
}
