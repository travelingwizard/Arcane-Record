import type { GameSystemDefinition } from '../game-system';
import {
  createMouseGuardCharacter,
  createMouseGuardPatrol,
} from './create-character';
import {
  MOUSE_GUARD_PATROL_SCHEMA_VERSION,
  MOUSE_GUARD_PATROL_SYSTEM_ID,
  MOUSE_GUARD_SCHEMA_VERSION,
  MOUSE_GUARD_SYSTEM_ID,
  mouseGuardGroups,
  mouseGuardSections,
  patrolGroups,
  patrolSections,
} from './definitions';
import { MouseGuardEditor, MouseGuardPatrolEditor } from './MouseGuardEditor';
import {
  migrateMouseGuardCharacter,
  migrateMouseGuardPatrol,
  mouseGuardCharacterSchema,
  mouseGuardPatrolSchema,
  type MouseGuardCharacter,
  type MouseGuardPatrol,
} from './schema';
export const mouseGuardDefinition: GameSystemDefinition<MouseGuardCharacter> = {
  id: MOUSE_GUARD_SYSTEM_ID,
  name: 'Mouse Guard Second Edition',
  shortName: 'Mouse Guard 2e',
  sheetChoiceLabel: 'Guardmouse',
  description:
    'Recruit a guardmouse, manage missions, roll tests, and advance through play.',
  currentSchemaVersion: MOUSE_GUARD_SCHEMA_VERSION,
  characterSchema: mouseGuardCharacterSchema,
  createInitialCharacter: createMouseGuardCharacter,
  creationActions: [
    {
      id: 'recruit',
      name: 'Recruit a Guardmouse',
      description: 'Use the complete guided Recruitment process.',
      createInitialCharacter: () => createMouseGuardCharacter(),
    },
    {
      id: 'template',
      name: 'Use Rank Template',
      description:
        'Begin with an official rank package and finish the personal choices.',
      createInitialCharacter: () =>
        createMouseGuardCharacter({ status: 'template', method: 'template' }),
    },
    {
      id: 'blank',
      name: 'Open Blank Sheet',
      description:
        'Open a manual Build-mode character without invented history.',
      createInitialCharacter: () =>
        createMouseGuardCharacter({ status: 'manual', method: 'manual' }),
    },
  ],
  migrateCharacter: migrateMouseGuardCharacter,
  getDisplayName: (c) => c.name || 'Untitled guardmouse',
  getSummary: (c) => `${c.rankId} · ${c.homeId || 'No hometown'}`,
  getSearchText: (c) =>
    [
      c.name,
      c.player,
      c.concept,
      c.rankId,
      c.homeId,
      c.belief,
      c.goal,
      c.instinct,
    ].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled guardmouse (Copy)',
    patrol: { kind: 'none' },
  }),
  CharacterEditor: MouseGuardEditor,
  sections: mouseGuardSections,
  sectionGroups: mouseGuardGroups,
  appearance: {
    label: 'Mouse Guard sheet settings',
    description: 'Appearance, sources, Recruitment, and local file settings.',
  },
};
export const mouseGuardPatrolDefinition: GameSystemDefinition<MouseGuardPatrol> =
  {
    id: MOUSE_GUARD_PATROL_SYSTEM_ID,
    parentSystemId: MOUSE_GUARD_SYSTEM_ID,
    sheetChoiceLabel: 'Patrol / GM record',
    name: 'Mouse Guard Patrol',
    shortName: 'Patrol',
    description: 'A shared browser-local patrol and mission record.',
    currentSchemaVersion: MOUSE_GUARD_PATROL_SCHEMA_VERSION,
    characterSchema: mouseGuardPatrolSchema,
    createInitialCharacter: createMouseGuardPatrol,
    migrateCharacter: migrateMouseGuardPatrol,
    getDisplayName: (p) => p.name || 'Untitled patrol',
    getSummary: (p) => `${p.season} ${p.year} · ${p.members.length} members`,
    getSearchText: (p) =>
      [p.name, p.gm, p.location, p.mission.title, p.notes].join(' '),
    renameCharacter: (p, name) => ({ ...p, name }),
    duplicateCharacter: (p) => ({
      ...structuredClone(p),
      name: p.name ? `${p.name} (Copy)` : 'Untitled patrol (Copy)',
      members: p.members.map((m) => ({ ...m, characterId: null })),
      revision: 0,
    }),
    CharacterEditor: MouseGuardPatrolEditor,
    sections: patrolSections,
    sectionGroups: patrolGroups,
  };
