import type { GameSystemDefinition } from '../game-system';
import { createBlankExaltedCharacter } from './create-character';
import {
  EXALTED1E_SCHEMA_VERSION,
  EXALTED1E_SYSTEM_ID,
  exaltedSectionGroups,
  exaltedSections,
} from './definitions';
import { Exalted1eEditor } from './Exalted1eEditor';
import {
  exalted1eCharacterSchema,
  migrateExalted1eCharacter,
  type Exalted1eCharacter,
} from './schema';

function sheetLabel(character: Exalted1eCharacter) {
  return character.sheetType === 'solar' ? 'Solar' : 'Dragon-Blooded';
}

export const exalted1eDefinition: GameSystemDefinition<Exalted1eCharacter> = {
  id: EXALTED1E_SYSTEM_ID,
  name: 'Exalted First Edition',
  shortName: 'Exalted 1e',
  description:
    'Dot-based character records for Solar and Dragon-Blooded Exalted.',
  currentSchemaVersion: EXALTED1E_SCHEMA_VERSION,
  characterSchema: exalted1eCharacterSchema,
  createInitialCharacter: () => createBlankExaltedCharacter('solar'),
  migrateCharacter: (data, fromVersion) =>
    migrateExalted1eCharacter(data, fromVersion),
  getDisplayName: (character) =>
    character.identity.name.trim() || `Untitled ${sheetLabel(character)}`,
  getSummary: (character) => {
    const concept = character.identity.concept.trim();
    return `${sheetLabel(character)}${concept ? ` · ${concept}` : ''}`;
  },
  getSearchText: (character) =>
    [
      sheetLabel(character),
      character.identity.name,
      character.identity.player,
      character.identity.concept,
      character.identity.nature,
      character.identity.caste,
      character.identity.aspect,
      character.identity.house,
    ].join(' '),
  renameCharacter: (character, name) => ({
    ...character,
    identity: { ...character.identity, name },
  }),
  duplicateCharacter: (character) => ({
    ...structuredClone(character),
    identity: {
      ...character.identity,
      name: character.identity.name
        ? `${character.identity.name} (Copy)`
        : `Untitled ${sheetLabel(character)} (Copy)`,
    },
  }),
  CharacterEditor: Exalted1eEditor,
  appearance: {
    label: 'Exalted First Edition sheet settings',
    description: 'Cross-game appearance for Solar and Dragon-Blooded sheets.',
  },
  sections: exaltedSections,
  sectionGroups: exaltedSectionGroups,
  variants: [
    {
      id: 'solar',
      name: 'Solar Exalted',
      shortName: 'Solar',
      description:
        'Uses Caste-based Ability groupings, Limit Break, and the Solar Background list.',
      createInitialCharacter: () => createBlankExaltedCharacter('solar'),
    },
    {
      id: 'dragon-blooded',
      name: 'Dragon-Blooded',
      shortName: 'Dragon-Blooded',
      description:
        'Uses Aspect and House identity fields, elemental Ability groupings, and Dragon-Blooded Backgrounds.',
      createInitialCharacter: () =>
        createBlankExaltedCharacter('dragon-blooded'),
    },
  ],
};
