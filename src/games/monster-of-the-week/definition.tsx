import type { GameSystemDefinition } from '../game-system';
import { createMotwHunter, createMotwKeeper } from './create-character';
import {
  MOTW_KEEPER_SYSTEM_ID,
  MOTW_SCHEMA_VERSION,
  MOTW_SYSTEM_ID,
  hunterGroups,
  hunterSections,
  keeperGroups,
  keeperSections,
} from './definitions';
import { MotwHunterEditor, MotwKeeperEditor } from './MotwEditors';
import { MotwCampaignLinkService } from './link-service';
import {
  migrateMotwHunter,
  migrateMotwKeeper,
  motwHunterSchema,
  motwKeeperSchema,
  type MotwHunter,
  type MotwKeeper,
} from './schema';

export const motwDefinition: GameSystemDefinition<MotwHunter> = {
  id: MOTW_SYSTEM_ID,
  name: 'Monster of the Week',
  shortName: 'MotW',
  sheetChoiceLabel: 'Hunter',
  description:
    'Build and play a Hunter linked to a browser-local Keeper campaign.',
  currentSchemaVersion: MOTW_SCHEMA_VERSION,
  characterSchema: motwHunterSchema,
  createInitialCharacter: createMotwHunter,
  creationActions: [
    {
      id: 'build',
      name: 'Build Hunter',
      description:
        'Use the guided playbook, ratings, moves, gear, and history workflow.',
      createInitialCharacter: () => createMotwHunter('draft'),
    },
    {
      id: 'blank',
      name: 'Open Blank Hunter',
      description: 'Open a manual Build-mode Hunter sheet.',
      createInitialCharacter: () => createMotwHunter('manual'),
    },
  ],
  migrateCharacter: migrateMotwHunter,
  getDisplayName: (c) => c.name || 'Untitled Hunter',
  getSummary: (c) =>
    `${c.playbookId.split('.').at(-1) || 'No playbook'} · Harm ${c.harm.current}/7`,
  getSearchText: (c) =>
    [c.name, c.player, c.look, c.concept, c.playbookId, c.notes].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled Hunter (Copy)',
    campaign: { kind: 'none', snapshot: c.campaign.snapshot },
  }),
  prepareExport: (c, r) => new MotwCampaignLinkService(r).prepareExport(c),
  CharacterEditor: MotwHunterEditor,
  sections: hunterSections,
  sectionGroups: hunterGroups,
  appearance: {
    label: 'Monster of the Week settings',
    description:
      'Appearance, sources, creator, campaign link, and local files.',
  },
};
export const motwKeeperDefinition: GameSystemDefinition<MotwKeeper> = {
  id: MOTW_KEEPER_SYSTEM_ID,
  parentSystemId: MOTW_SYSTEM_ID,
  sheetChoiceLabel: 'Keeper campaign',
  name: 'Monster of the Week Keeper',
  shortName: 'MotW Keeper',
  description:
    'Authoritative local campaign, Mystery, threat, arc, and award workspace.',
  currentSchemaVersion: MOTW_SCHEMA_VERSION,
  characterSchema: motwKeeperSchema,
  createInitialCharacter: createMotwKeeper,
  creationActions: [
    {
      id: 'start',
      name: 'Start Keeper Campaign',
      description: 'Create a guided campaign and its first Mystery.',
      createInitialCharacter: () => createMotwKeeper('draft'),
    },
    {
      id: 'blank',
      name: 'Open Blank Keeper Workspace',
      description: 'Open a manual browser-local Keeper workspace.',
      createInitialCharacter: () => createMotwKeeper('manual'),
    },
  ],
  migrateCharacter: migrateMotwKeeper,
  getDisplayName: (c) => c.name || 'Untitled Keeper Campaign',
  getSummary: (c) =>
    `${c.mysteries.length} mysteries · ${c.roster.length} Hunters`,
  getSearchText: (c) => [c.name, c.keeper, c.teamConcept, c.notes].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled Campaign (Copy)',
    revision: 0,
  }),
  getDeleteWarning: async (id, r) => {
    const refs = await new MotwCampaignLinkService(r).references(id);
    return refs.length
      ? `This campaign is linked to ${refs.length} Hunter record${refs.length === 1 ? '' : 's'}. Deleting it leaves those links unavailable.`
      : null;
  },
  CharacterEditor: MotwKeeperEditor,
  sections: keeperSections,
  sectionGroups: keeperGroups,
};
