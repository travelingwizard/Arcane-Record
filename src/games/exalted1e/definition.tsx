import type {
  GameSystemDefinition,
  UnavailableSheetChoice,
} from '../game-system';
import { createBlankExaltedCharacter } from './create-character';
import {
  EXALTED1E_SCHEMA_VERSION,
  EXALTED1E_SYSTEM_ID,
  exaltedSectionGroups,
  exaltedSections,
  plannedExaltedFamilies,
  plannedExaltedFamilyLabels,
  type ExaltedSheetType,
} from './definitions';
import { Exalted1eEditor } from './Exalted1eEditor';
import {
  exalted1eCharacterSchema,
  migrateExalted1eCharacter,
  type Exalted1eCharacter,
} from './schema';
import { getFamilyCertificationStatus } from './verification';

/**
 * Human-readable label per stored `sheetType`. Previously a binary
 * `sheetType === 'solar' ? 'Solar' : 'Dragon-Blooded'` check, which silently
 * mislabeled Abyssal characters as "Dragon-Blooded" (only reachable via
 * `createBlankExaltedCharacter('abyssal')`, since Abyssal has no
 * user-facing `variants` entry yet — see the module doc comment below).
 * `sidereal` was added for the same reason once it became a legal stored
 * `sheetType` too (`createBlankExaltedCharacter('sidereal')`); it remains
 * absent from `variants` below just like `abyssal`.
 */
const sheetTypeLabels: Record<ExaltedSheetType, string> = {
  solar: 'Solar',
  'dragon-blooded': 'Dragon-Blooded',
  abyssal: 'Abyssal',
  sidereal: 'Sidereal',
};

function sheetLabel(character: Exalted1eCharacter) {
  return sheetTypeLabels[character.sheetType];
}

/**
 * One "Unavailable" card per planned splat. The requirement text is
 * generated from the checked-in certification evidence in
 * `./certification/*.json` (via `verification.ts`) rather than hand-written,
 * so it changes only when real evidence changes. No planned family can
 * currently pass certification because none has a schema, catalog, or
 * editor yet — see `docs/18-exalted1e-splat-release.md`.
 */
function buildUnavailableSheetChoices(): UnavailableSheetChoice[] {
  return plannedExaltedFamilies
    .map((family) => getFamilyCertificationStatus(family))
    .filter((status) => !status.available)
    .map((status) => ({
      id: status.family,
      name: `${plannedExaltedFamilyLabels[status.family]} Exalted`,
      description: `A rules-complete ${plannedExaltedFamilyLabels[status.family]} character record is not installed.`,
      requirement: `Locked pending certification: ${status.blockReason}`,
    }));
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
  unavailableSheetChoices: buildUnavailableSheetChoices(),
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
