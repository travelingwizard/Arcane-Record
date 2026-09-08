import type { GameSystemDefinition } from '../game-system';
import { createMmCampaign, createMmCharacter } from './create-character';
import {
  MM_CAMPAIGN_SYSTEM_ID,
  MM_SCHEMA_VERSION,
  MM_SYSTEM_ID,
  campaignGroups,
  campaignSections,
  characterGroups,
  characterSections,
} from './definitions';
import { MmCampaignEditor, MmCharacterEditor } from './MmEditors';
import { MmCampaignLinkService } from './link-service';
import {
  migrateMmCampaign,
  migrateMmCharacter,
  mmCampaignSchema,
  mmCharacterSchema,
  type MmCampaign,
  type MmCharacter,
} from './schema';
export const mmDefinition: GameSystemDefinition<MmCharacter> = {
  id: MM_SYSTEM_ID,
  name: 'Miseries & Misfortunes',
  shortName: 'Miseries & Misfortunes',
  sheetChoiceLabel: 'Protagonist',
  description:
    'Create and play a seventeenth-century protagonist through birth, lifepaths, fortune, and misfortune.',
  currentSchemaVersion: MM_SCHEMA_VERSION,
  characterSchema: mmCharacterSchema,
  createInitialCharacter: createMmCharacter,
  creationActions: [
    {
      id: 'build',
      name: 'Build Protagonist',
      description:
        'Use the complete guided birth, ability, mentality, lifepath, measure, and experience workflow.',
      createInitialCharacter: () => createMmCharacter('draft'),
    },
    {
      id: 'blank',
      name: 'Open Blank Sheet',
      description: 'Open a manual Build-mode protagonist.',
      createInitialCharacter: () => createMmCharacter('manual'),
    },
  ],
  migrateCharacter: migrateMmCharacter,
  getDisplayName: (c) => c.name || 'Untitled Protagonist',
  getSummary: (c) =>
    `${c.birth.quality || 'Unknown birth'} · ${c.lifepaths.at(-1)?.name || 'No lifepath'}`,
  getSearchText: (c) =>
    [
      c.name,
      c.player,
      c.birth.quality,
      c.birth.station,
      c.notes,
      ...c.lifepaths.map((x) => x.name),
    ].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled Protagonist (Copy)',
    campaign: { kind: 'none' },
  }),
  prepareExport: (c, r) => new MmCampaignLinkService(r).prepareExport(c),
  CharacterEditor: MmCharacterEditor,
  sections: characterSections,
  sectionGroups: characterGroups,
  appearance: {
    label: 'Miseries & Misfortunes settings',
    description:
      'Appearance, sources, creator, campaign link, and local files.',
  },
};
export const mmCampaignDefinition: GameSystemDefinition<MmCampaign> = {
  id: MM_CAMPAIGN_SYSTEM_ID,
  parentSystemId: MM_SYSTEM_ID,
  sheetChoiceLabel: 'Campaign & motif',
  name: 'Miseries & Misfortunes Campaign',
  shortName: 'M&M Campaign',
  description:
    'A private browser-local motif, protagonist, moment, faction, favor, and campaign record.',
  currentSchemaVersion: MM_SCHEMA_VERSION,
  characterSchema: mmCampaignSchema,
  createInitialCharacter: createMmCampaign,
  creationActions: [
    {
      id: 'create',
      name: 'Start Campaign',
      description:
        'Create the shared motif, historical frame, source set, protagonists, and private GM records.',
      createInitialCharacter: createMmCampaign,
    },
  ],
  migrateCharacter: migrateMmCampaign,
  getDisplayName: (c) => c.name || 'Untitled Campaign',
  getSummary: (c) => `${c.location} · ${c.year}`,
  getSearchText: (c) =>
    [c.name, c.gm, c.location, c.motif.name, c.notes].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled Campaign (Copy)',
    revision: 0,
    protagonists: c.protagonists.map((x) => ({ ...x, characterId: null })),
  }),
  getDeleteWarning: async (id, r) => {
    const refs = await new MmCampaignLinkService(r).references(id);
    return refs.length
      ? `This campaign is linked to ${refs.length} protagonist record${refs.length === 1 ? '' : 's'}. Deleting it leaves those links unavailable.`
      : null;
  },
  CharacterEditor: MmCampaignEditor,
  sections: campaignSections,
  sectionGroups: campaignGroups,
};
