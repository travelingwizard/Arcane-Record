import type { GameSystemDefinition } from '../game-system';
import { ArsMagicaEditor, arsSections } from './ArsMagicaEditor';
import { CovenantEditor, covenantSections } from './CovenantEditor';
import { createArsCharacter } from './create-character';
import { createCovenant } from './create-covenant';
import { createFromMechanicalTemplate } from './templates';
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
    'Guided and manual Magus, Companion, and Grog records using the Definitive Edition rules and sheet hierarchy.',
  currentSchemaVersion: 2,
  characterSchema: arsCharacterSchema,
  createInitialCharacter: () => createArsCharacter('magus', 'manual'),
  creationActions: [
    {
      id: 'build-magus',
      name: 'Build Magus',
      description: 'Create a Hermetic magus with the guided ten-stage creator.',
      createInitialCharacter: () => createArsCharacter('magus', 'draft'),
    },
    {
      id: 'build-companion',
      name: 'Build Companion',
      description:
        'Create a central non-magus character with guided validation.',
      createInitialCharacter: () => createArsCharacter('companion', 'draft'),
    },
    {
      id: 'build-grog',
      name: 'Build Grog',
      description: 'Create a supporting character with the Grog restrictions.',
      createInitialCharacter: () => createArsCharacter('grog', 'draft'),
    },
    {
      id: 'template-magus',
      name: 'Use Magus Template',
      description:
        'Start from an editable generalist magus mechanical template.',
      createInitialCharacter: () =>
        createFromMechanicalTemplate('ars.template.magus-generalist'),
    },
    {
      id: 'template-companion',
      name: 'Use Companion Template',
      description:
        'Start from an editable companion envoy mechanical template.',
      createInitialCharacter: () =>
        createFromMechanicalTemplate('ars.template.companion-envoy'),
    },
    {
      id: 'template-grog',
      name: 'Use Grog Template',
      description: 'Start from an editable covenant guard mechanical template.',
      createInitialCharacter: () =>
        createFromMechanicalTemplate('ars.template.grog-guard'),
    },
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
