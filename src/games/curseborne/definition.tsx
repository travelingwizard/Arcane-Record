import type { GameSystemDefinition } from '../game-system';
import { CurseEditor, curseSections } from './CurseEditor';
import {
  createCurseCharacter,
  curseCharacterSchema,
  type CurseCharacter,
  migrateCurseCharacter,
} from './schema';
export const curseDefinition: GameSystemDefinition<CurseCharacter> = {
  id: 'curseborne',
  name: 'Curseborne',
  shortName: 'Curseborne',
  description:
    'Editable sheet preview with curse resources, injuries and manual EXP. Guided creation is in development.',
  currentSchemaVersion: 2,
  characterSchema: curseCharacterSchema,
  createInitialCharacter: createCurseCharacter,
  migrateCharacter: migrateCurseCharacter,
  getDisplayName: (c) => c.name || 'Untitled Accursed',
  getSummary: (c) => `${c.lineage || 'Accursed'} · ${c.family}`,
  getSearchText: (c) => [c.name, c.lineage, c.family, c.role].join(' '),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: `${c.name} (Copy)`,
  }),
  CharacterEditor: CurseEditor,
  sections: curseSections,
  sectionGroups: curseSections.map((s) => ({ id: s.group, label: s.label })),
};
