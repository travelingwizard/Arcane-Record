import type { GameSystemDefinition } from '../game-system';
import { BitdCharacterEditor, BitdCrewEditor } from './BitdEditors';
import { createBitdCharacter, createBitdCrew } from './create-character';
import {
  BITD_CREW_SYSTEM_ID,
  BITD_SCHEMA_VERSION,
  BITD_SYSTEM_ID,
  characterGroups,
  characterSections,
  crewGroups,
  crewSections,
} from './definitions';
import { BitdCrewLinkService } from './link-service';
import {
  bitdCharacterSchema,
  bitdCrewSchema,
  migrateBitdCharacter,
  migrateBitdCrew,
  type BitdCharacter,
  type BitdCrew,
} from './schema';
export const bitdDefinition: GameSystemDefinition<BitdCharacter> = {
  id: BITD_SYSTEM_ID,
  name: 'Blades in the Dark',
  shortName: 'Blades',
  sheetChoiceLabel: 'Scoundrel',
  description: 'Build and play a scoundrel linked to a browser-local Crew.',
  currentSchemaVersion: BITD_SCHEMA_VERSION,
  characterSchema: bitdCharacterSchema,
  createInitialCharacter: createBitdCharacter,
  creationActions: [
    {
      id: 'build',
      name: 'Build Scoundrel',
      description:
        'Use guided playbook, identity, vice, ability, action, and relationship creation.',
      createInitialCharacter: () => createBitdCharacter('draft'),
    },
    {
      id: 'blank',
      name: 'Open Blank Sheet',
      description: 'Open a manual Build-mode Scoundrel sheet.',
      createInitialCharacter: () => createBitdCharacter('manual'),
    },
  ],
  migrateCharacter: migrateBitdCharacter,
  getDisplayName: (c) => c.name || 'Untitled Scoundrel',
  getSummary: (c) =>
    `${c.playbookId ? c.playbookId.split('.').at(-1) : 'No playbook'} · stress ${c.stress}/9`,
  getSearchText: (c) =>
    [c.name, c.alias, c.player, c.look, c.playbookId, c.notes].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled Scoundrel (Copy)',
    crew: { kind: 'none' },
  }),
  prepareExport: (c, r) => new BitdCrewLinkService(r).prepareExport(c),
  CharacterEditor: BitdCharacterEditor,
  sections: characterSections,
  sectionGroups: characterGroups,
  appearance: {
    label: 'Blades settings',
    description: 'Appearance, sources, creator, Crew link, and local files.',
  },
};
export const bitdCrewDefinition: GameSystemDefinition<BitdCrew> = {
  id: BITD_CREW_SYSTEM_ID,
  parentSystemId: BITD_SYSTEM_ID,
  sheetChoiceLabel: 'Crew & campaign',
  name: 'Blades in the Dark Crew',
  shortName: 'Blades Crew',
  description:
    'Authoritative local Crew, score, faction, downtime, clock, and GM workspace.',
  currentSchemaVersion: BITD_SCHEMA_VERSION,
  characterSchema: bitdCrewSchema,
  createInitialCharacter: createBitdCrew,
  creationActions: [
    {
      id: 'create',
      name: 'Create Crew',
      description:
        'Guide Crew type, reputation, lair, operation, advances, contacts, and factions.',
      createInitialCharacter: () => createBitdCrew('draft'),
    },
    {
      id: 'blank',
      name: 'Open Blank Crew',
      description: 'Open a manual browser-local Crew sheet.',
      createInitialCharacter: () => createBitdCrew('manual'),
    },
  ],
  migrateCharacter: migrateBitdCrew,
  getDisplayName: (c) => c.name || 'Untitled Crew',
  getSummary: (c) => `Tier ${c.tier} ${c.hold} · Heat ${c.heat}`,
  getSearchText: (c) =>
    [c.name, c.gm, c.typeId, c.reputationId, c.lair, c.notes].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled Crew (Copy)',
    revision: 0,
  }),
  getDeleteWarning: async (id, r) => {
    const refs = await new BitdCrewLinkService(r).references(id);
    return refs.length
      ? `This Crew is linked to ${refs.length} Scoundrel record${refs.length === 1 ? '' : 's'}. Deleting it leaves those links unavailable.`
      : null;
  },
  CharacterEditor: BitdCrewEditor,
  sections: crewSections,
  sectionGroups: crewGroups,
};
