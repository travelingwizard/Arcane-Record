import type { GameSystemDefinition } from '../game-system';
import { createDitvCharacter, createDitvTown } from './create-character';
import { DitvCharacterEditor } from './DitvCharacterEditor';
import { DitvTownEditor } from './DitvTownEditor';
import {
  characterGroups,
  characterSections,
  DITV_SCHEMA_VERSION,
  DITV_SYSTEM_ID,
  DITV_TOWN_SYSTEM_ID,
  townGroups,
  townSections,
} from './definitions';
import { DitvTownLinkService } from './link-service';
import {
  ditvCharacterSchema,
  ditvTownSchema,
  migrateDitvCharacter,
  migrateDitvTown,
  type DitvCharacter,
  type DitvTown,
} from './schema';

export const ditvDefinition: GameSystemDefinition<DitvCharacter> = {
  id: DITV_SYSTEM_ID,
  name: 'Dogs in the Vineyard',
  shortName: 'Dogs in the Vineyard',
  sheetChoiceLabel: 'Dog character',
  description: 'Build and play a Dog linked to a browser-local Town workspace.',
  currentSchemaVersion: DITV_SCHEMA_VERSION,
  characterSchema: ditvCharacterSchema,
  createInitialCharacter: createDitvCharacter,
  creationActions: [
    {
      id: 'build',
      name: 'Build a Dog',
      description:
        'Use the guided Background, dice-allocation, belongings, and initiation workflow.',
      createInitialCharacter: () => createDitvCharacter('draft'),
    },
    {
      id: 'blank',
      name: 'Open Blank Character',
      description:
        'Open a manual Build-mode character without invented creation history.',
      createInitialCharacter: () => createDitvCharacter('manual'),
    },
  ],
  migrateCharacter: migrateDitvCharacter,
  getDisplayName: (c) => c.name || 'Untitled Dog',
  getSummary: (c) =>
    `${c.creation.status} · ${c.traits.length} Traits · ${c.relationships.length} Relationships`,
  getSearchText: (c) =>
    [c.name, c.player, c.background, c.homeBranch, c.route, c.notes].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled Dog (Copy)',
    town: { kind: 'none', snapshot: c.town.snapshot },
  }),
  prepareExport: (c, r) => new DitvTownLinkService(r).prepareExport(c),
  CharacterEditor: DitvCharacterEditor,
  sections: characterSections,
  sectionGroups: characterGroups,
  appearance: {
    label: 'Dogs in the Vineyard settings',
    description: 'Appearance, character workflow, Town link, and local files.',
  },
};

export const ditvTownDefinition: GameSystemDefinition<DitvTown> = {
  id: DITV_TOWN_SYSTEM_ID,
  parentSystemId: DITV_SYSTEM_ID,
  sheetChoiceLabel: 'Town & NPC workspace',
  name: 'Dogs in the Vineyard Town',
  shortName: 'Dogs Town',
  description:
    'Authoritative local Town, NPC, demonic influence, and conflict workspace.',
  currentSchemaVersion: DITV_SCHEMA_VERSION,
  characterSchema: ditvTownSchema,
  createInitialCharacter: createDitvTown,
  creationActions: [
    {
      id: 'create',
      name: 'Create Town',
      description:
        'Prepare one or more problem chains, townspeople, wants, and proto-NPCs.',
      createInitialCharacter: createDitvTown,
    },
    {
      id: 'blank',
      name: 'Open Blank Town',
      description: 'Open a manual Town and NPC workspace.',
      createInitialCharacter: createDitvTown,
    },
  ],
  migrateCharacter: migrateDitvTown,
  getDisplayName: (t) => t.name || 'Untitled Town',
  getSummary: (t) =>
    `${t.problems.length} problem chain(s) · ${t.npcs.length} NPC records`,
  getSearchText: (t) => [t.name, t.gm, t.assignment, t.notes].join(' '),
  renameCharacter: (t, name) => ({ ...t, name }),
  duplicateCharacter: (t) => ({
    ...structuredClone(t),
    name: t.name ? `${t.name} (Copy)` : 'Untitled Town (Copy)',
    revision: 0,
  }),
  getDeleteWarning: async (id, r) => {
    const refs = await new DitvTownLinkService(r).references(id);
    return refs.length
      ? `This Town is linked to ${refs.length} Dog character record${refs.length === 1 ? '' : 's'}. Deleting it leaves those links unavailable.`
      : null;
  },
  CharacterEditor: DitvTownEditor,
  sections: townSections,
  sectionGroups: townGroups,
};
