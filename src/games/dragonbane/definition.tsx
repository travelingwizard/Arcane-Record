import type { GameSystemDefinition } from '../game-system';
import { createDragonbaneCharacter } from './create-character';
import { DragonbaneEditor } from './DragonbaneEditor';
import {
  DRAGONBANE_SCHEMA_VERSION,
  DRAGONBANE_SYSTEM_ID,
  dragonbaneGroups,
  dragonbaneSections,
} from './definitions';
import {
  dragonbaneCharacterSchema,
  migrateDragonbaneCharacter,
  type DragonbaneCharacter,
} from './schema';
export const dragonbaneDefinition: GameSystemDefinition<DragonbaneCharacter> = {
  id: DRAGONBANE_SYSTEM_ID,
  name: 'Dragonbane',
  shortName: 'Dragonbane',
  description: 'Build and play an adventurer using the Dragonbane core rules.',
  currentSchemaVersion: DRAGONBANE_SCHEMA_VERSION,
  characterSchema: dragonbaneCharacterSchema,
  createInitialCharacter: createDragonbaneCharacter,
  creationActions: [
    {
      id: 'build',
      name: 'Build Adventurer',
      description:
        'Use guided Kin, profession, Attributes, Skills, magic, and gear creation.',
      createInitialCharacter: () => createDragonbaneCharacter('draft'),
    },
    {
      id: 'blank',
      name: 'Open Blank Sheet',
      description: 'Open a manual Build-mode adventurer sheet.',
      createInitialCharacter: () => createDragonbaneCharacter('manual'),
    },
  ],
  migrateCharacter: migrateDragonbaneCharacter,
  getDisplayName: (c) => c.name || 'Untitled Adventurer',
  getSummary: (c) =>
    `${c.professionId.split('.').at(-1) || 'No profession'} · HP ${c.resources.hpCurrent}/${c.resources.hpMaximum}`,
  getSearchText: (c) =>
    [c.name, c.player, c.concept, c.kinId, c.professionId, c.notes].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled Adventurer (Copy)',
  }),
  CharacterEditor: DragonbaneEditor,
  sections: dragonbaneSections,
  sectionGroups: dragonbaneGroups,
  appearance: {
    label: 'Dragonbane settings',
    description:
      'Appearance, creator controls, local files, and player-facing rules.',
  },
};
