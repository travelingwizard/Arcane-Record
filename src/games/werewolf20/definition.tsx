import type { GameSystemDefinition } from '../game-system';
import { createW20Character } from './create-character';
import { W20Editor } from './W20Editor';
import {
  W20_SCHEMA_VERSION,
  W20_SYSTEM_ID,
  w20SectionGroups,
  w20Sections,
} from './definitions';
import {
  migrateW20Character,
  w20CharacterSchema,
  type W20Character,
} from './schema';
const variant = (
  id: W20Character['characterType'],
  name: string,
  description: string,
) => ({
  id,
  name,
  shortName: name,
  description,
  createInitialCharacter: () => createW20Character({ characterType: id }),
  createManualInitialCharacter: () =>
    createW20Character({ characterType: id, status: 'manual' }),
});
export const w20Definition: GameSystemDefinition<W20Character> = {
  id: W20_SYSTEM_ID,
  name: 'Werewolf: The Apocalypse 20th Anniversary',
  shortName: 'Werewolf 20',
  description:
    'Guided Garou, Changing Breed, Kinfolk, and Wyrm-aligned creation with local play and advancement tools.',
  currentSchemaVersion: W20_SCHEMA_VERSION,
  characterSchema: w20CharacterSchema,
  createInitialCharacter: createW20Character,
  variants: [
    variant(
      'garou',
      'Garou',
      'Build a newly Changed Garou by breed, auspice, and tribe.',
    ),
    variant(
      'changing-breed',
      'Changing Breed',
      'Build one of the eleven supported Fera breeds.',
    ),
    variant(
      'kinfolk',
      'Kinfolk',
      'Build human or wolf Kinfolk with their published mortal rules.',
    ),
    variant(
      'wyrm-aligned',
      'Wyrm-Aligned',
      'Build a restricted Black Spiral, fomor, or fallen Changing Breed character.',
    ),
  ],
  migrateCharacter: migrateW20Character,
  getDisplayName: (c) => c.name || 'Untitled W20 character',
  getSummary: (c) =>
    `${c.characterType.replace('-', ' ')} · ${c.concept || 'Unspecified concept'}`,
  getSearchText: (c) =>
    [c.name, c.player, c.concept, c.deedName, c.packName, c.history].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled W20 character (Copy)',
  }),
  CharacterEditor: W20Editor,
  sections: w20Sections,
  sectionGroups: w20SectionGroups,
  appearance: {
    label: 'Werewolf 20 sheet settings',
    description:
      'Appearance, sources, creator, dice, and local file settings for this W20 character.',
  },
};
