import type { StoredCharacterRepository } from '../../storage/stored-character-repository';
import { COC2E_KEEPER_SYSTEM_ID, COC2E_SYSTEM_ID } from './definitions';
import {
  coc2eInvestigatorSchema,
  coc2eKeeperSchema,
  type Coc2eKeeper,
  type Coc2eInvestigator,
} from './schema';
export class Coc2eCampaignLinkService {
  constructor(private repository: StoredCharacterRepository) {}
  async list() {
    const records = await this.repository.list();
    return records
      .filter((x) => x.systemId === COC2E_KEEPER_SYSTEM_ID)
      .flatMap((record) => {
        const parsed = coc2eKeeperSchema.safeParse(record.data);
        return parsed.success
          ? [
              {
                id: record.id,
                name: parsed.data.name || 'Untitled campaign',
                revision: parsed.data.revision,
                era: parsed.data.era,
              },
            ]
          : [];
      });
  }
  async references(campaignId: string) {
    const records = await this.repository.list();
    return records
      .filter((x) => x.systemId === COC2E_SYSTEM_ID)
      .filter((x) => {
        const p = coc2eInvestigatorSchema.safeParse(x.data);
        return (
          p.success &&
          p.data.campaign.kind === 'linked' &&
          p.data.campaign.campaignId === campaignId
        );
      });
  }
  async link(c: Coc2eInvestigator, campaignId: string) {
    const record = await this.repository.get(campaignId);
    if (!record) throw new Error('Campaign not found.');
    const campaign = coc2eKeeperSchema.parse(record.data);
    return {
      ...c,
      campaign: {
        kind: 'linked' as const,
        campaignId,
        snapshot: {
          campaignId,
          name: campaign.name,
          revision: campaign.revision,
          era: campaign.era,
          capturedAt: new Date().toISOString(),
        },
      },
    };
  }
  async prepareExport(c: Coc2eInvestigator) {
    if (c.campaign.kind !== 'linked') return c;
    try {
      return await this.link(c, c.campaign.campaignId);
    } catch {
      return c;
    }
  }
  async grant(
    keeper: Coc2eKeeper,
    investigatorId: string,
    mythosRecordId: string,
  ) {
    const stored = await this.repository.get(investigatorId);
    const record = keeper.mythos.find((x) => x.id === mythosRecordId);
    if (!stored || !record) throw new Error('Grant target was not found.');
    const investigator = coc2eInvestigatorSchema.parse(stored.data);
    const granted = {
      id: crypto.randomUUID(),
      definitionId: record.definitionId,
      name: record.name,
      sourceId: record.sourceId,
      page: record.page,
      notes: record.notes,
      custom: record.custom,
    };
    const data = {
      ...investigator,
      spells:
        record.kind === 'spell'
          ? [...investigator.spells, granted]
          : investigator.spells,
      tomes:
        record.kind === 'tome'
          ? [...investigator.tomes, granted]
          : investigator.tomes,
      mythosDiscoveries:
        record.kind !== 'spell' && record.kind !== 'tome'
          ? [...investigator.mythosDiscoveries, granted]
          : investigator.mythosDiscoveries,
      history: [
        {
          id: crypto.randomUUID(),
          kind: 'keeper-grant',
          title: `Keeper granted ${record.name}`,
          description: `Shared from ${keeper.name || 'the linked campaign'}.`,
          createdAt: new Date().toISOString(),
        },
        ...investigator.history,
      ],
    };
    const saved = await this.repository.save({
      ...stored,
      name: investigator.name,
      updatedAt: new Date().toISOString(),
      data,
    });
    return saved;
  }
}
