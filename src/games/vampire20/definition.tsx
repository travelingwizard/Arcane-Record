import type { GameSystemDefinition } from '../game-system';
import { createV20Character } from './create-character';
import { V20Editor } from './V20Editor';
import {
  V20_SCHEMA_VERSION,
  V20_SYSTEM_ID,
  v20SectionGroups,
  v20Sections,
} from './definitions';
import {
  v20CharacterSchema,
  migrateV20Character,
  type V20Character,
} from './schema';

export const v20Definition: GameSystemDefinition<V20Character> = {
  id: V20_SYSTEM_ID,
  name: 'Vampire: The Masquerade 20th Anniversary',
  shortName: 'Vampire 20',
  description:
    'A source-cited fledgling creator, maturation workflow, and local-first modern World of Darkness vampire sheet.',
  currentSchemaVersion: V20_SCHEMA_VERSION,
  characterSchema: v20CharacterSchema,
  createInitialCharacter: createV20Character,
  variants: [
    {
      id: 'vampire',
      name: 'Vampire',
      shortName: 'Vampire',
      description: 'Build a modern Kindred neonate from a clan or bloodline.',
      createInitialCharacter: () =>
        createV20Character({ characterType: 'vampire' }),
      createManualInitialCharacter: () =>
        createV20Character({ characterType: 'vampire', status: 'manual' }),
    },
    {
      id: 'ghoul',
      name: 'Ghoul',
      shortName: 'Ghoul',
      description: 'Build a vassal or independent mortal sustained by vitae.',
      createInitialCharacter: () =>
        createV20Character({ characterType: 'ghoul' }),
      createManualInitialCharacter: () =>
        createV20Character({ characterType: 'ghoul', status: 'manual' }),
    },
    {
      id: 'revenant',
      name: 'Revenant',
      shortName: 'Revenant',
      description: 'Build a member of a published revenant family.',
      createInitialCharacter: () =>
        createV20Character({ characterType: 'revenant' }),
      createManualInitialCharacter: () =>
        createV20Character({ characterType: 'revenant', status: 'manual' }),
    },
  ],
  creationActions: [
    {
      id: 'build',
      name: 'Build Character',
      description:
        'Create a standard fledgling and optionally apply reviewed maturation.',
      createInitialCharacter: () =>
        createV20Character({ status: 'draft', mode: 'build' }),
    },
    {
      id: 'blank',
      name: 'Open Blank Sheet',
      description:
        'Start a manual modern vampire without inferred creation history.',
      createInitialCharacter: () =>
        createV20Character({ status: 'manual', mode: 'build' }),
    },
  ],
  migrateCharacter: migrateV20Character,
  getDisplayName: (character) => character.name || 'Untitled Cainite',
  getSummary: (character) =>
    `${character.characterType === 'vampire' ? `${character.generation}th Generation` : character.characterType} · ${character.concept || 'Unspecified concept'}`,
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
  CharacterEditor: V20Editor,
  sections: v20Sections,
  sectionGroups: v20SectionGroups,
  appearance: {
    label: 'Vampire 20 sheet settings',
    description:
      'Appearance, source, creator, and local file settings for this Cainite.',
  },
};
