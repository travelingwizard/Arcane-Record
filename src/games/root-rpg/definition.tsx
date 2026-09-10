import type { GameSystemDefinition } from '../game-system';
import { createRootCampaign, createRootVagabond } from './create-character';
import {
  campaignGroups,
  campaignSections,
  ROOT_CAMPAIGN_SYSTEM_ID,
  ROOT_SCHEMA_VERSION,
  ROOT_SYSTEM_ID,
  vagabondGroups,
  vagabondSections,
} from './definitions';
import { RootCampaignEditor, RootVagabondEditor } from './RootEditors';
import { RootCampaignLinkService } from './link-service';
import {
  migrateRootCampaign,
  migrateRootVagabond,
  rootCampaignSchema,
  rootVagabondSchema,
  type RootCampaign,
  type RootVagabond,
} from './schema';
export const rootDefinition: GameSystemDefinition<RootVagabond> = {
  id: ROOT_SYSTEM_ID,
  name: 'Root: The Roleplaying Game',
  shortName: 'Root',
  sheetChoiceLabel: 'Vagabond',
  description:
    'Build and play a Woodland vagabond linked to a browser-local campaign.',
  currentSchemaVersion: ROOT_SCHEMA_VERSION,
  characterSchema: rootVagabondSchema,
  createInitialCharacter: createRootVagabond,
  creationActions: [
    {
      id: 'build',
      name: 'Build Vagabond',
      description:
        'Use guided playbook, Nature, Drives, equipment, and reputation creation.',
      createInitialCharacter: () => createRootVagabond('draft'),
    },
    {
      id: 'blank',
      name: 'Open Blank Vagabond',
      description: 'Open a manual Build-mode Vagabond sheet.',
      createInitialCharacter: () => createRootVagabond('manual'),
    },
  ],
  migrateCharacter: migrateRootVagabond,
  getDisplayName: (c) => c.name || 'Untitled Vagabond',
  getSummary: (c) =>
    `${c.playbookId.split('.').at(-1) || 'No playbook'} · Injury ${c.harm.injury}/${c.harm.injuryMaximum}`,
  getSearchText: (c) =>
    [c.name, c.player, c.species, c.playbookId, c.concept, c.notes].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled Vagabond (Copy)',
    campaign: { kind: 'none', snapshot: c.campaign.snapshot },
  }),
  prepareExport: (c, r) => new RootCampaignLinkService(r).prepareExport(c),
  CharacterEditor: RootVagabondEditor,
  sections: vagabondSections,
  sectionGroups: vagabondGroups,
  appearance: {
    label: 'Root settings',
    description:
      'Appearance, sources, creator, campaign link, and local files.',
  },
};
export const rootCampaignDefinition: GameSystemDefinition<RootCampaign> = {
  id: ROOT_CAMPAIGN_SYSTEM_ID,
  parentSystemId: ROOT_SYSTEM_ID,
  sheetChoiceLabel: 'Woodland campaign',
  name: 'Root Woodland Campaign',
  shortName: 'Root Campaign',
  description:
    'Authoritative local band, clearing, faction, job, and session workspace.',
  currentSchemaVersion: ROOT_SCHEMA_VERSION,
  characterSchema: rootCampaignSchema,
  createInitialCharacter: createRootCampaign,
  creationActions: [
    {
      id: 'start',
      name: 'Start Woodland Campaign',
      description: 'Create a guided local band and Woodland workspace.',
      createInitialCharacter: () => createRootCampaign('draft'),
    },
    {
      id: 'blank',
      name: 'Open Blank Campaign',
      description: 'Open a manual browser-local campaign workspace.',
      createInitialCharacter: () => createRootCampaign('manual'),
    },
  ],
  migrateCharacter: migrateRootCampaign,
  getDisplayName: (c) => c.name || 'Untitled Woodland Campaign',
  getSummary: (c) =>
    `${c.roster.length} vagabonds · ${c.clearings.length} clearings`,
  getSearchText: (c) => [c.name, c.gm, c.bandName, c.notes].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled Woodland Campaign (Copy)',
    revision: 0,
  }),
  getDeleteWarning: async (id, r) => {
    const refs = await new RootCampaignLinkService(r).references(id);
    return refs.length
      ? `This campaign is linked to ${refs.length} Vagabond record${refs.length === 1 ? '' : 's'}. Deleting it leaves those links unavailable.`
      : null;
  },
  CharacterEditor: RootCampaignEditor,
  sections: campaignSections,
  sectionGroups: campaignGroups,
};
