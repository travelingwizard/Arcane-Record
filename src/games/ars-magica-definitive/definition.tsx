import type { GameSystemDefinition } from '../game-system';
import { ArsMagicaEditor, arsSections } from './ArsMagicaEditor';
import { CovenantEditor, covenantSections } from './CovenantEditor';
import { createArsCharacter } from './create-character';
import { createCovenant } from './create-covenant';
import {
  arsCharacterSchema,
  covenantSchema,
  migrateArsCharacter,
  migrateArsCovenant,
  type ArsCharacter,
  type ArsCovenant,
} from './schema';

const groups = (sections: readonly { group: string; label: string }[]) =>
  sections.map((section) => ({ id: section.group, label: section.label }));

export const arsMagicaDefinition: GameSystemDefinition<ArsCharacter> = {
  id: 'ars-magica-definitive',
  name: 'Ars Magica Definitive Edition',
  shortName: 'Ars Magica',
  sheetChoiceLabel: 'Character',
  description:
    'Manual Magus, Companion, and Grog records using the Definitive Edition sheet hierarchy.',
  currentSchemaVersion: 1,
  characterSchema: arsCharacterSchema,
  createInitialCharacter: () => createArsCharacter('magus', 'manual'),
  creationActions: [
    {
      id: 'blank-magus',
      name: 'Open Blank Magus',
      description:
        'Open a manual Magus sheet without invented creation history.',
      createInitialCharacter: () => createArsCharacter('magus', 'manual'),
    },
    {
      id: 'blank-companion',
      name: 'Open Blank Companion',
      description:
        'Open a manual Companion sheet without Hermetic-only sections.',
      createInitialCharacter: () => createArsCharacter('companion', 'manual'),
    },
    {
      id: 'blank-grog',
      name: 'Open Blank Grog',
      description: 'Open a manual Grog sheet without Hermetic-only sections.',
      createInitialCharacter: () => createArsCharacter('grog', 'manual'),
    },
  ],
  migrateCharacter: migrateArsCharacter,
  getDisplayName: (character) =>
    character.name || 'Untitled Ars Magica Character',
  getSummary: (character) =>
    `${character.definition.role} · Age ${character.definition.age}`,
  getSearchText: (character) =>
    [
      character.name,
      character.definition.player,
      character.definition.concept,
      character.definition.saga,
      character.definition.titleProfession,
      character.notes,
    ].join(' '),
  renameCharacter: (character, name) => ({
    ...character,
    name,
    definition: { ...character.definition, name },
  }),
  duplicateCharacter: (character) => ({
    ...structuredClone(character),
    name: character.name
      ? `${character.name} (Copy)`
      : 'Untitled Ars Magica Character (Copy)',
    covenantId: null,
  }),
  CharacterEditor: ArsMagicaEditor,
  sections: arsSections,
  sectionGroups: groups(arsSections),
  appearance: {
    label: 'Ars Magica settings',
    description:
      'Appearance, manual records, local files, and rules references.',
  },
};

export const arsCovenantDefinition: GameSystemDefinition<ArsCovenant> = {
  id: 'ars-magica-definitive-covenant',
  parentSystemId: 'ars-magica-definitive',
  name: 'Ars Magica Covenant',
  shortName: 'Ars Covenant',
  sheetChoiceLabel: 'Covenant',
  description:
    'Browser-local Covenant resources, library, vis, labs, and history.',
  currentSchemaVersion: 1,
  characterSchema: covenantSchema,
  createInitialCharacter: () => createCovenant(),
  creationActions: [
    {
      id: 'blank',
      name: 'Open Blank Covenant',
      description: 'Open a manual Covenant workspace.',
      createInitialCharacter: () => createCovenant(),
    },
  ],
  migrateCharacter: migrateArsCovenant,
  getDisplayName: (covenant) => covenant.name || 'Untitled Covenant',
  getSummary: (covenant) =>
    `${covenant.covenantSeason} · Aura ${covenant.aura} · ${covenant.memberIds.length} members`,
  getSearchText: (covenant) =>
    [covenant.name, covenant.saga, covenant.location, covenant.notes].join(' '),
  renameCharacter: (covenant, name) => ({ ...covenant, name }),
  duplicateCharacter: (covenant) => ({
    ...structuredClone(covenant),
    name: covenant.name
      ? `${covenant.name} (Copy)`
      : 'Untitled Covenant (Copy)',
    memberIds: [],
  }),
  CharacterEditor: CovenantEditor,
  sections: covenantSections,
  sectionGroups: groups(covenantSections),
};
