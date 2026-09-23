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
import {
  exaltedCharacterProfiles,
  exaltedCharacterTypes,
  getExaltedCharacterProfile,
} from './profiles';
import { getExaltedVerificationRequirement } from './verification';

/**
 * Human-readable label per stored `sheetType`, sourced from each family's
 * `ExaltedCharacterProfile` (`./profiles`) rather than a locally
 * hand-maintained `Record`, so this stays exhaustive as new families are
 * added without a second place to update. Every `ExaltedCharacterType`
 * (all seven planned families) can label a stored character correctly,
 * even ones with no `variants` entry of their own yet -- see the
 * `unavailableRequirement`-driven gating below, which is what actually
 * keeps a family locked out of character creation, not the absence of a
 * label here.
 */
function sheetLabel(character: Exalted1eCharacter) {
  return getExaltedCharacterProfile(character.sheetType).shortName;
}

export const exalted1eDefinition: GameSystemDefinition<Exalted1eCharacter> = {
  id: EXALTED1E_SYSTEM_ID,
  name: 'Exalted First Edition',
  shortName: 'Exalted 1e',
  description:
    'Unified First Edition records for the Exalted character family.',
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
    description: 'Shared appearance for every Exalted First Edition family.',
  },
  sections: exaltedSections,
  sectionGroups: exaltedSectionGroups,
  variants: exaltedCharacterTypes.map((id) => {
    const profile = exaltedCharacterProfiles[id];
    return {
      id,
      name: profile.name,
      shortName: profile.shortName,
      description: profile.description,
      createInitialCharacter: () => createBlankExaltedCharacter(id, 'draft'),
      createManualInitialCharacter: () =>
        createBlankExaltedCharacter(id, 'manual'),
      unavailableRequirement: getExaltedVerificationRequirement(id),
    };
  }),
};
