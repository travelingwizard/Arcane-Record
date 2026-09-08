import type { GameSystemDefinition } from '../game-system';
import { Changeling20Editor } from './Changeling20Editor';
import { createChangeling20Character } from './create-character';
import {
  CHANGELING20_SCHEMA_VERSION,
  CHANGELING20_SYSTEM_ID,
  changeling20SectionGroups,
  changeling20Sections,
} from './definitions';
import {
  changeling20CharacterSchema,
  migrateChangeling20Character,
  type Changeling20Character,
} from './schema';

export const changeling20Definition: GameSystemDefinition<Changeling20Character> =
  {
    id: CHANGELING20_SYSTEM_ID,
    name: 'Changeling: The Dreaming 20th Anniversary',
    shortName: 'Changeling 20',
    description:
      'An adaptive C20 creator and local-first sheet for Kithain and other verified changeling families.',
    currentSchemaVersion: CHANGELING20_SCHEMA_VERSION,
    characterSchema: changeling20CharacterSchema,
    createInitialCharacter: createChangeling20Character,
    creationActions: [
      {
        id: 'build',
        name: 'Build Character',
        description: 'Use the adaptive, source-cited C20 creator.',
        createInitialCharacter: () =>
          createChangeling20Character({ status: 'draft', mode: 'build' }),
      },
      {
        id: 'blank',
        name: 'Open Blank Sheet',
        description:
          'Start a manual character record without inferred creation history.',
        createInitialCharacter: () =>
          createChangeling20Character({ status: 'manual', mode: 'build' }),
      },
    ],
    migrateCharacter: migrateChangeling20Character,
    getDisplayName: (c) => c.name || 'Untitled Changeling',
    getSummary: (c) =>
      `${c.profile.replace(/-/g, ' ')} · ${c.concept || 'Unspecified concept'}`,
    getSearchText: (c) =>
      [
        c.name,
        c.player,
        c.concept,
        c.profile,
        c.motley,
        ...c.abilities.map(({ name }) => name),
      ].join(' '),
    renameCharacter: (c, name) => ({ ...c, name }),
    duplicateCharacter: (c) => ({
      ...structuredClone(c),
      name: c.name ? `${c.name} (Copy)` : 'Untitled Changeling (Copy)',
    }),
    CharacterEditor: Changeling20Editor,
    sections: changeling20Sections,
    sectionGroups: changeling20SectionGroups,
    appearance: {
      label: 'Changeling 20 sheet settings',
      description:
        'Appearance, source ownership, and character-sheet preferences.',
    },
  };
