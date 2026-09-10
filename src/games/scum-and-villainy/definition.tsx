import type { GameSystemDefinition } from '../game-system';
import { createSandvCharacter, createSandvShip } from './create-character';
import { SandvCharacterEditor, SandvShipEditor } from './SandvEditors';
import {
  SANDV_SCHEMA_VERSION,
  SANDV_SHIP_SYSTEM_ID,
  SANDV_SYSTEM_ID,
  characterGroups,
  characterSections,
  shipGroups,
  shipSections,
} from './definitions';
import {
  migrateSandvCharacter,
  migrateSandvShip,
  sandvCharacterSchema,
  sandvShipSchema,
  type SandvCharacter,
  type SandvShip,
} from './schema';
import { SandvShipLinkService } from './link-service';
export const sandvDefinition: GameSystemDefinition<SandvCharacter> = {
  id: SANDV_SYSTEM_ID,
  name: 'Scum and Villainy',
  shortName: 'Scum & Villainy',
  sheetChoiceLabel: 'Scoundrel',
  description:
    'Build and play a spacefaring scoundrel linked to a browser-local ship.',
  currentSchemaVersion: SANDV_SCHEMA_VERSION,
  characterSchema: sandvCharacterSchema,
  createInitialCharacter: createSandvCharacter,
  creationActions: [
    {
      id: 'build',
      name: 'Build Scoundrel',
      description:
        'Use guided playbook, identity, action, vice, and relationship creation.',
      createInitialCharacter: () => createSandvCharacter('draft'),
    },
    {
      id: 'blank',
      name: 'Open Blank Sheet',
      description: 'Open a manual Build-mode scoundrel sheet.',
      createInitialCharacter: () => createSandvCharacter('manual'),
    },
  ],
  migrateCharacter: migrateSandvCharacter,
  getDisplayName: (c) => c.name || 'Untitled Scoundrel',
  getSummary: (c) =>
    `${c.playbookId.split('.').at(-1) || 'No playbook'} · Stress ${c.stress}/9`,
  getSearchText: (c) =>
    [c.name, c.alias, c.player, c.playbookId, c.notes].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled Scoundrel (Copy)',
    ship: { kind: 'none' },
  }),
  prepareExport: (c, r) => new SandvShipLinkService(r).prepareExport(c),
  CharacterEditor: SandvCharacterEditor,
  sections: characterSections,
  sectionGroups: characterGroups,
};
export const sandvShipDefinition: GameSystemDefinition<SandvShip> = {
  id: SANDV_SHIP_SYSTEM_ID,
  parentSystemId: SANDV_SYSTEM_ID,
  sheetChoiceLabel: 'Ship & crew',
  name: 'Scum and Villainy Ship',
  shortName: 'S&V Ship',
  description:
    'Authoritative local ship, crew, job, faction, and downtime workspace.',
  currentSchemaVersion: SANDV_SCHEMA_VERSION,
  characterSchema: sandvShipSchema,
  createInitialCharacter: createSandvShip,
  creationActions: [
    {
      id: 'create',
      name: 'Create Ship and Crew',
      description:
        'Choose a ship, initial systems, upgrades, ability, contacts, and starting state.',
      createInitialCharacter: () => createSandvShip('draft'),
    },
    {
      id: 'blank',
      name: 'Open Blank Ship',
      description: 'Open a manual browser-local ship workspace.',
      createInitialCharacter: () => createSandvShip('manual'),
    },
  ],
  migrateCharacter: migrateSandvShip,
  getDisplayName: (c) => c.name || 'Untitled Ship',
  getSummary: (c) =>
    `${c.typeId.split('.').at(-1) || 'No type'} · Gambits ${c.gambits.current}/${c.gambits.maximum}`,
  getSearchText: (c) => [c.name, c.gm, c.callsign, c.typeId, c.notes].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled Ship (Copy)',
    revision: 0,
  }),
  getDeleteWarning: async (id, r) => {
    const refs = await new SandvShipLinkService(r).references(id);
    return refs.length
      ? `This ship is linked to ${refs.length} Scoundrel record${refs.length === 1 ? '' : 's'}. Deleting it leaves those links unavailable.`
      : null;
  },
  CharacterEditor: SandvShipEditor,
  sections: shipSections,
  sectionGroups: shipGroups,
};
