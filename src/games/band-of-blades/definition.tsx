import type { GameSystemDefinition } from '../game-system';
import {
  BobCharacterEditor,
  BobChosenEditor,
  BobLegionEditor,
} from './BandOfBladesEditors';
import {
  createBobCharacter,
  createBobChosen,
  createBobLegion,
} from './create-character';
import {
  BOB_CHOSEN_SYSTEM_ID,
  BOB_LEGION_SYSTEM_ID,
  BOB_SCHEMA_VERSION,
  BOB_SYSTEM_ID,
  characterGroups,
  characterSections,
  chosenGroups,
  chosenSections,
  legionGroups,
  legionSections,
} from './definitions';
import { BobLegionLinkService } from './link-service';
import {
  bobCharacterSchema,
  bobChosenSchema,
  bobLegionSchema,
  migrateBobCharacter,
  migrateBobChosen,
  migrateBobLegion,
  type BobCharacter,
  type BobChosen,
  type BobLegion,
} from './schema';
export const bobDefinition: GameSystemDefinition<BobCharacter> = {
  id: BOB_SYSTEM_ID,
  name: 'Band of Blades',
  shortName: 'Band of Blades',
  sheetChoiceLabel: 'Legionnaire',
  description: 'Build and play Legionnaires linked to a local Legion campaign.',
  currentSchemaVersion: BOB_SCHEMA_VERSION,
  characterSchema: bobCharacterSchema,
  createInitialCharacter: createBobCharacter,
  creationActions: [
    {
      id: 'build',
      name: 'Build Legionnaire',
      description:
        'Use guided playbook, ability, heritage, action, and identity creation.',
      createInitialCharacter: () => createBobCharacter('draft'),
    },
    {
      id: 'blank',
      name: 'Open Blank Sheet',
      description: 'Open a manual Build-mode Legionnaire.',
      createInitialCharacter: () => createBobCharacter('manual'),
    },
  ],
  migrateCharacter: migrateBobCharacter,
  getDisplayName: (c) => c.name || 'Untitled Legionnaire',
  getSummary: (c) =>
    `${c.playbookId.split('.').at(-1) || 'No playbook'} · ${c.heritageName || 'No heritage'}`,
  getSearchText: (c) =>
    [
      c.name,
      c.player,
      c.background,
      c.playbookId,
      c.heritageName,
      c.bonds,
    ].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled Legionnaire (Copy)',
    legion: { kind: 'none' },
  }),
  prepareExport: (c, r) => new BobLegionLinkService(r).prepareExport(c),
  CharacterEditor: BobCharacterEditor,
  sections: characterSections,
  sectionGroups: characterGroups,
  appearance: {
    label: 'Band of Blades settings',
    description: 'Appearance, linked Legion, creator, and local file settings.',
  },
};
export const bobLegionDefinition: GameSystemDefinition<BobLegion> = {
  id: BOB_LEGION_SYSTEM_ID,
  parentSystemId: BOB_SYSTEM_ID,
  sheetChoiceLabel: 'Legion campaign',
  name: 'Band of Blades Legion',
  shortName: 'Legion',
  description:
    'Authoritative local campaign, command-role, mission, squad, and resource record.',
  currentSchemaVersion: BOB_SCHEMA_VERSION,
  characterSchema: bobLegionSchema,
  createInitialCharacter: createBobLegion,
  creationActions: [
    {
      id: 'start',
      name: 'Start Campaign',
      description:
        'Guide initial Legion, Chosen, Broken, personnel, roles, resources, and mission setup.',
      createInitialCharacter: () => createBobLegion('draft'),
    },
    {
      id: 'blank',
      name: 'Open Blank Legion',
      description: 'Open a manual Legion campaign record.',
      createInitialCharacter: () => createBobLegion('manual'),
    },
  ],
  migrateCharacter: migrateBobLegion,
  getDisplayName: (c) => c.name || 'Untitled Legion',
  getSummary: (c) => `${c.location} · Morale ${c.morale} · Supply ${c.supply}`,
  getSearchText: (c) =>
    [c.name, c.gm, c.location, c.notes, ...c.personnel.map((x) => x.name)].join(
      ' ',
    ),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: `${c.name} (Copy)`,
    revision: 0,
    personnel: c.personnel.map((p) => ({ ...p, characterId: null })),
    chosenRecordId: null,
  }),
  getDeleteWarning: async (id, r) => {
    const refs = await new BobLegionLinkService(r).references(id);
    return refs.length
      ? `This Legion is linked to ${refs.length} character record${refs.length === 1 ? '' : 's'}. Deleting it will leave those links unavailable.`
      : null;
  },
  CharacterEditor: BobLegionEditor,
  sections: legionSections,
  sectionGroups: legionGroups,
};
export const bobChosenDefinition: GameSystemDefinition<BobChosen> = {
  id: BOB_CHOSEN_SYSTEM_ID,
  parentSystemId: BOB_SYSTEM_ID,
  sheetChoiceLabel: 'Chosen',
  name: 'Band of Blades Chosen',
  shortName: 'Chosen',
  description:
    'A Chosen linked to a Legion campaign, with favor and advancement.',
  currentSchemaVersion: BOB_SCHEMA_VERSION,
  characterSchema: bobChosenSchema,
  createInitialCharacter: createBobChosen,
  variants: ['Shreya', 'The Horned One', 'Zora'].map((name) => ({
    id: name.toLowerCase().replaceAll(' ', '-'),
    name,
    shortName: name,
    description: `Create a ${name} Chosen record.`,
    createInitialCharacter: () => createBobChosen(name),
  })),
  migrateCharacter: migrateBobChosen,
  getDisplayName: (c) => c.name || 'Untitled Chosen',
  getSummary: (c) => `Favor ${c.favor} · ${c.abilities.length} abilities`,
  getSearchText: (c) =>
    [c.name, c.player, c.relationships, c.startingMission, c.notes].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: `${c.name} (Copy)`,
    legion: { kind: 'none' },
  }),
  prepareExport: (c, r) => new BobLegionLinkService(r).prepareExport(c),
  CharacterEditor: BobChosenEditor,
  sections: chosenSections,
  sectionGroups: chosenGroups,
};
