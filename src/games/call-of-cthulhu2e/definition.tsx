import type { GameSystemDefinition } from '../game-system';
import { createCoc2eInvestigator, createCoc2eKeeper } from './create-character';
import {
  COC2E_KEEPER_SYSTEM_ID,
  COC2E_SCHEMA_VERSION,
  COC2E_SYSTEM_ID,
  investigatorGroups,
  investigatorSections,
  keeperGroups,
  keeperSections,
} from './definitions';
import { Coc2eInvestigatorEditor, Coc2eKeeperEditor } from './Coc2eEditors';
import { Coc2eCampaignLinkService } from './link-service';
import {
  coc2eInvestigatorSchema,
  coc2eKeeperSchema,
  migrateCoc2eInvestigator,
  migrateCoc2eKeeper,
  type Coc2eInvestigator,
  type Coc2eKeeper,
} from './schema';

export const coc2eDefinition: GameSystemDefinition<Coc2eInvestigator> = {
  id: COC2E_SYSTEM_ID,
  name: 'Call of Cthulhu Second Edition',
  shortName: 'Call of Cthulhu 2E',
  sheetChoiceLabel: 'Investigator',
  description:
    'Build and play a classic percentile investigator linked to a browser-local Keeper campaign.',
  currentSchemaVersion: COC2E_SCHEMA_VERSION,
  characterSchema: coc2eInvestigatorSchema,
  createInitialCharacter: createCoc2eInvestigator,
  creationActions: [
    {
      id: 'build',
      name: 'Build Investigator',
      description:
        'Use guided characteristics, occupation, Skills, equipment, and review.',
      createInitialCharacter: () => createCoc2eInvestigator('draft'),
    },
    {
      id: 'blank',
      name: 'Open Blank Sheet',
      description: 'Open a manual Build-mode Investigator sheet.',
      createInitialCharacter: () => createCoc2eInvestigator('manual'),
    },
  ],
  migrateCharacter: migrateCoc2eInvestigator,
  getDisplayName: (c) => c.name || 'Untitled Investigator',
  getSummary: (c) =>
    `${c.occupationName || 'No occupation'} · SAN ${c.resources.sanityCurrent}`,
  getSearchText: (c) =>
    [
      c.name,
      c.player,
      c.occupationName,
      c.nationality,
      c.residence,
      c.concept,
      c.notes,
    ].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled Investigator (Copy)',
    campaign: { kind: 'none', snapshot: c.campaign.snapshot },
  }),
  prepareExport: (c, r) => new Coc2eCampaignLinkService(r).prepareExport(c),
  CharacterEditor: Coc2eInvestigatorEditor,
  sections: investigatorSections,
  sectionGroups: investigatorGroups,
  appearance: {
    label: 'Call of Cthulhu settings',
    description:
      'Appearance, sources, creator, campaign link, and local files.',
  },
};
export const coc2eKeeperDefinition: GameSystemDefinition<Coc2eKeeper> = {
  id: COC2E_KEEPER_SYSTEM_ID,
  parentSystemId: COC2E_SYSTEM_ID,
  sheetChoiceLabel: 'Keeper campaign',
  name: 'Call of Cthulhu Keeper',
  shortName: 'CoC Keeper',
  description:
    'Authoritative local campaign, investigation, clue, Mythos, and session workspace.',
  currentSchemaVersion: COC2E_SCHEMA_VERSION,
  characterSchema: coc2eKeeperSchema,
  createInitialCharacter: createCoc2eKeeper,
  creationActions: [
    {
      id: 'start',
      name: 'Start Keeper Campaign',
      description: 'Start a guided campaign and investigation workspace.',
      createInitialCharacter: () => createCoc2eKeeper('draft'),
    },
    {
      id: 'blank',
      name: 'Open Blank Keeper Workspace',
      description: 'Open a manual browser-local Keeper workspace.',
      createInitialCharacter: () => createCoc2eKeeper('manual'),
    },
  ],
  migrateCharacter: migrateCoc2eKeeper,
  getDisplayName: (c) => c.name || 'Untitled Keeper Campaign',
  getSummary: (c) =>
    `${c.investigations.length} investigations · ${c.roster.length} investigators`,
  getSearchText: (c) => [c.name, c.keeper, c.era, c.privateNotes].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled Keeper Campaign (Copy)',
    revision: 0,
  }),
  getDeleteWarning: async (id, r) => {
    const refs = await new Coc2eCampaignLinkService(r).references(id);
    return refs.length
      ? `This campaign is linked to ${refs.length} Investigator record${refs.length === 1 ? '' : 's'}. Deleting it leaves those links unavailable.`
      : null;
  },
  CharacterEditor: Coc2eKeeperEditor,
  sections: keeperSections,
  sectionGroups: keeperGroups,
};
