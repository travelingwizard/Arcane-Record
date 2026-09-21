import type { GameSystemDefinition } from '../game-system';
import { createBlankEarthdawn4eCharacter } from './create-character';
import { Earthdawn4eEditor } from './Earthdawn4eEditor';
import {
  EARTHDAWN4E_SCHEMA_VERSION,
  EARTHDAWN4E_SYSTEM_ID,
  earthdawn4eSectionGroups,
  earthdawn4eSections,
} from './definitions';
import {
  earthdawn4eCharacterSchema,
  migrateEarthdawn4eCharacter,
  type Earthdawn4eCharacter,
} from './schema';
import { importStepsCharacter } from './steps-import';

export const earthdawn4eDefinition: GameSystemDefinition<Earthdawn4eCharacter> =
  {
    id: EARTHDAWN4E_SYSTEM_ID,
    name: 'Earthdawn Fourth Edition',
    shortName: 'Earthdawn 4e',
    description:
      'A guided local-first Earthdawn Fourth Edition adept builder and play sheet.',
    currentSchemaVersion: EARTHDAWN4E_SCHEMA_VERSION,
    characterSchema: earthdawn4eCharacterSchema,
    createInitialCharacter: createBlankEarthdawn4eCharacter,
    creationActions: [
      {
        id: 'build',
        name: 'Build Character',
        description:
          'Create a First Circle adept with official-source guidance.',
        createInitialCharacter: () =>
          createBlankEarthdawn4eCharacter({ status: 'draft', mode: 'edit' }),
      },
      {
        id: 'play',
        name: 'Open Blank Sheet',
        description: 'Open a manual Earthdawn sheet in Build mode.',
        createInitialCharacter: () =>
          createBlankEarthdawn4eCharacter({ status: 'manual', mode: 'edit' }),
      },
    ],
    migrateCharacter: (data) => migrateEarthdawn4eCharacter(data),
    importLegacyCharacter: importStepsCharacter,
    getDisplayName: (c) => c.identity.name.trim() || 'Untitled Earthdawn Adept',
    getSummary: (c) =>
      [
        c.identity.raceName,
        c.disciplines.map((d) => `${d.name} ${d.circle}`).join(', '),
      ]
        .filter(Boolean)
        .join(' · ') || 'Earthdawn 4e adept',
    getSearchText: (c) =>
      [
        ...Object.values(c.identity),
        ...c.disciplines.map((d) => d.name),
        ...c.talents.map((d) => d.name),
        ...c.skills.map((d) => d.name),
      ].join(' '),
    renameCharacter: (c, name) => ({ ...c, identity: { ...c.identity, name } }),
    duplicateCharacter: (c) => ({
      ...structuredClone(c),
      identity: {
        ...c.identity,
        name: c.identity.name
          ? `${c.identity.name} (Copy)`
          : 'Untitled Earthdawn Adept (Copy)',
      },
    }),
    CharacterEditor: Earthdawn4eEditor,
    sections: earthdawn4eSections,
    sectionGroups: earthdawn4eSectionGroups,
    appearance: {
      label: 'Earthdawn Fourth Edition sheet settings',
      description:
        'Appearance and official-source controls for this Earthdawn character.',
    },
  };
