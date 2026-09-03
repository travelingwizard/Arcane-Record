import {
  characterSectionGroups,
  characterSections,
} from '../../systems/mage-m20/character-sections';
import {
  mageCharacterDataSchema,
  migrateMageCharacter,
} from '../../systems/mage-m20/character-schema';
import { createBlankMageCharacter } from '../../systems/mage-m20/create-character';
import {
  MAGE_SCHEMA_VERSION,
  MAGE_SYSTEM_ID,
} from '../../systems/mage-m20/definitions';
import type { MageCharacterData } from '../../types/character';
import type { GameSystemDefinition } from '../game-system';
import { Mage20Editor } from './Mage20Editor';
import { getMageCharacterData, MAGE20_SYSTEM_ID } from './character-adapter';
import { developmentFor, newCreationDraft } from './development/rules';

export const mage20Definition: GameSystemDefinition<MageCharacterData> = {
  id: MAGE20_SYSTEM_ID,
  name: 'Mage: The Ascension 20th Anniversary Edition',
  shortName: 'Mage 20',
  description:
    'A local character record for mages, their Spheres, Focus, Advantages, and chronicles.',
  currentSchemaVersion: MAGE_SCHEMA_VERSION,
  characterSchema: mageCharacterDataSchema,
  createInitialCharacter: () =>
    getMageCharacterData(createBlankMageCharacter()),
  creationActions: [
    {
      id: 'build',
      name: 'Build Character',
      description:
        'Guided M20 creation with point budgets and GM-approved exceptions.',
      createInitialCharacter: () => {
        const c = createBlankMageCharacter();
        c.development = {
          ...developmentFor(c),
          status: 'draft',
          draft: newCreationDraft(c),
        };
        return getMageCharacterData(c);
      },
    },
    {
      id: 'manual',
      name: 'Open Blank Sheet',
      description:
        'Use the existing editable Mage sheet without guided creation.',
      createInitialCharacter: () =>
        getMageCharacterData(createBlankMageCharacter()),
    },
  ],
  migrateCharacter: (data, fromVersion, metadata) => {
    return getMageCharacterData(
      migrateMageCharacter({
        ...(data as object),
        ...metadata,
        systemId: MAGE_SYSTEM_ID,
        schemaVersion: fromVersion,
      }),
    );
  },
  getDisplayName: (character) =>
    character.identity.name.trim() || 'Untitled mage',
  getSummary: (character) =>
    character.identity.concept.trim() || 'Concept unrecorded',
  getSearchText: (character) =>
    [
      character.identity.name,
      character.identity.concept,
      character.identity.affiliation,
      character.identity.chronicle,
      character.identity.player,
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
        : 'Untitled mage (Copy)',
    },
  }),
  CharacterEditor: Mage20Editor,
  sections: characterSections.map(({ id, label, group, ...section }) => ({
    id,
    label,
    group,
    ...('shortLabel' in section ? { shortLabel: section.shortLabel } : {}),
  })),
  sectionGroups: characterSectionGroups,
  appearance: {
    label: 'Mage 20 sheet settings',
    description: 'Cross-game appearance plus Mage-specific Sphere controls.',
  },
};
