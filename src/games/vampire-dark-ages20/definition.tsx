import type { GameSystemDefinition } from '../game-system';
import { createDav20Character } from './create-character';
import { Dav20Editor } from './Dav20Editor';
import {
  DAV20_SCHEMA_VERSION,
  DAV20_SYSTEM_ID,
  dav20SectionGroups,
  dav20Sections,
} from './definitions';
import {
  dav20CharacterSchema,
  migrateDav20Character,
  type Dav20Character,
} from './schema';

export const dav20Definition: GameSystemDefinition<Dav20Character> = {
  id: DAV20_SYSTEM_ID,
  name: 'Vampire: The Dark Ages 20th Anniversary',
  shortName: 'Vampire Dark Ages 20',
  description:
    'A source-cited fledgling creator, maturation workflow, and local-first Dark Medieval vampire sheet.',
  currentSchemaVersion: DAV20_SCHEMA_VERSION,
  characterSchema: dav20CharacterSchema,
  createInitialCharacter: createDav20Character,
  creationActions: [
    {
      id: 'build',
      name: 'Build Character',
      description:
        'Create a standard fledgling and optionally apply reviewed maturation.',
      createInitialCharacter: () =>
        createDav20Character({ status: 'draft', mode: 'build' }),
    },
    {
      id: 'blank',
      name: 'Open Blank Sheet',
      description:
        'Start a manual Dark Ages vampire without inferred creation history.',
      createInitialCharacter: () =>
        createDav20Character({ status: 'manual', mode: 'build' }),
    },
  ],
  migrateCharacter: migrateDav20Character,
  getDisplayName: (character) => character.name || 'Untitled Cainite',
  getSummary: (character) =>
    `${character.generation}th Generation · ${character.concept || 'Unspecified concept'}`,
  getSearchText: (character) =>
    [
      character.name,
      character.player,
      character.concept,
      character.sire,
      character.history,
      ...character.abilities.map(({ name }) => name),
    ].join(' '),
  renameCharacter: (character, name) => ({ ...character, name }),
  duplicateCharacter: (character) => ({
    ...structuredClone(character),
    name: character.name
      ? `${character.name} (Copy)`
      : 'Untitled Cainite (Copy)',
  }),
  CharacterEditor: Dav20Editor,
  sections: dav20Sections,
  sectionGroups: dav20SectionGroups,
  appearance: {
    label: 'Vampire Dark Ages 20 sheet settings',
    description:
      'Appearance, source, creator, and local file settings for this Cainite.',
  },
};
