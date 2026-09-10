import type { GameSystemDefinition } from '../game-system';
import { Coc7eEditor } from './Coc7eEditor';
import { createCoc7eInvestigator } from './create-character';
import {
  COC7E_SCHEMA_VERSION,
  COC7E_SYSTEM_ID,
  coc7eGroups,
  coc7eSections,
} from './definitions';
import {
  coc7eInvestigatorSchema,
  migrateCoc7eInvestigator,
  type Coc7eInvestigator,
} from './schema';
export const coc7eDefinition: GameSystemDefinition<Coc7eInvestigator> = {
  id: COC7E_SYSTEM_ID,
  name: 'Call of Cthulhu Seventh Edition',
  shortName: 'Call of Cthulhu 7E',
  familyId: 'call-of-cthulhu',
  editionChoiceLabel: 'Seventh Edition',
  sheetChoiceLabel: 'Investigator',
  description:
    'Build and play a Seventh Edition investigator using the player-facing Investigator’s Handbook.',
  currentSchemaVersion: COC7E_SCHEMA_VERSION,
  characterSchema: coc7eInvestigatorSchema,
  createInitialCharacter: createCoc7eInvestigator,
  unavailableSheetChoices: [
    {
      id: 'keeper',
      name: 'Keeper workspace',
      description: 'A rules-complete 7E Keeper workspace is not installed.',
      requirement:
        'Supply an authoritative Call of Cthulhu Seventh Edition Keeper Rulebook.',
    },
  ],
  creationActions: [
    {
      id: 'build',
      name: 'Build Investigator',
      description: 'Use the complete guided standard creation workflow.',
      createInitialCharacter: () =>
        createCoc7eInvestigator('draft', 'standard'),
    },
    {
      id: 'quick-fire',
      name: 'Quick-Fire Investigator',
      description:
        'Use the published array and abbreviated Quick-Fire workflow.',
      createInitialCharacter: () =>
        createCoc7eInvestigator('draft', 'quick-fire'),
    },
    {
      id: 'blank',
      name: 'Open Blank Sheet',
      description: 'Open a manual Build-mode Seventh Edition sheet.',
      createInitialCharacter: () => createCoc7eInvestigator('manual', 'custom'),
    },
  ],
  migrateCharacter: migrateCoc7eInvestigator,
  getDisplayName: (c) => c.name || 'Untitled 7E Investigator',
  getSummary: (c) =>
    `${c.occupationName || 'No occupation'} · SAN ${c.resources.sanityCurrent}`,
  getSearchText: (c) =>
    [c.name, c.player, c.occupationName, c.concept, c.notes].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled 7E Investigator (Copy)',
  }),
  CharacterEditor: Coc7eEditor,
  sections: coc7eSections,
  sectionGroups: coc7eGroups,
  appearance: {
    label: 'Call of Cthulhu 7E settings',
    description:
      'Appearance, creator options, local files, and player-facing rules.',
  },
};
