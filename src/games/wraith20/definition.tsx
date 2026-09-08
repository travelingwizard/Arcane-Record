import type { GameSystemDefinition } from '../game-system';
import { createWr20Character, createWr20Shadow } from './create-character';
import { Wr20Editor, Wr20ShadowEditor } from './Wr20Editor';
import {
  WR20_SCHEMA_VERSION,
  WR20_SHADOW_SCHEMA_VERSION,
  WR20_SHADOW_SYSTEM_ID,
  WR20_SYSTEM_ID,
  shadowGroups,
  shadowSections,
  wr20SectionGroups,
  wr20Sections,
} from './definitions';
import {
  migrateWr20Character,
  migrateWr20Shadow,
  wr20CharacterSchema,
  wr20ShadowSchema,
  type Wr20Character,
  type Wr20Shadow,
} from './schema';
const variant = (
  id: Wr20Character['characterType'],
  name: string,
  description: string,
) => ({
  id,
  name,
  shortName: name,
  description,
  createInitialCharacter: () => createWr20Character({ characterType: id }),
  createManualInitialCharacter: () =>
    createWr20Character({ characterType: id, status: 'manual' }),
});
export const wr20Definition: GameSystemDefinition<Wr20Character> = {
  id: WR20_SYSTEM_ID,
  name: 'Wraith: The Oblivion 20th Anniversary',
  shortName: 'Wraith 20',
  sheetChoiceLabel: 'Psyche sheet',
  description:
    'Guided Wraith and Medium creation, linked Shadows, Haunts, Risen state, and restricted Spectres.',
  currentSchemaVersion: WR20_SCHEMA_VERSION,
  characterSchema: wr20CharacterSchema,
  createInitialCharacter: createWr20Character,
  variants: [
    variant(
      'wraith',
      'Wraith',
      'Build a Restless character and separately linked Shadow.',
    ),
    variant(
      'medium',
      'Medium',
      'Build a living speaker with the dead using the optional source.',
    ),
    variant(
      'spectre',
      'Spectre',
      'Build a restricted Oblivion-aligned character with approval.',
    ),
  ],
  migrateCharacter: migrateWr20Character,
  getDisplayName: (c) => c.name || 'Untitled Wraith',
  getSummary: (c) =>
    `${c.characterType} · ${c.concept || 'Unspecified concept'}`,
  getSearchText: (c) =>
    [c.name, c.player, c.concept, c.life, c.death, c.regret, c.circleName].join(
      ' ',
    ),
  renameCharacter: (c, name) => ({ ...c, name }),
  duplicateCharacter: (c) => ({
    ...structuredClone(c),
    name: c.name ? `${c.name} (Copy)` : 'Untitled Wraith (Copy)',
    shadow: { kind: 'none' },
  }),
  CharacterEditor: Wr20Editor,
  sections: wr20Sections,
  sectionGroups: wr20SectionGroups,
  appearance: {
    label: 'Wraith 20 sheet settings',
    description:
      'Appearance, sources, linked Shadow, dice, and local file settings.',
  },
};
export const wr20ShadowDefinition: GameSystemDefinition<Wr20Shadow> = {
  id: WR20_SHADOW_SYSTEM_ID,
  parentSystemId: WR20_SYSTEM_ID,
  sheetChoiceLabel: 'Shadow sheet',
  name: 'Wraith 20 Shadow',
  shortName: 'Shadow',
  description: 'A separately persisted Shadow linked to a Wraith Psyche.',
  currentSchemaVersion: WR20_SHADOW_SCHEMA_VERSION,
  characterSchema: wr20ShadowSchema,
  createInitialCharacter: createWr20Shadow,
  migrateCharacter: migrateWr20Shadow,
  getDisplayName: (s) => s.name || 'Untitled Shadow',
  getSummary: (s) =>
    `${s.archetype || 'Unspecified archetype'} · Angst ${s.permanentAngst}`,
  getSearchText: (s) =>
    [s.name, s.psycheName, s.shadowguidePlayer, s.archetype, s.notes].join(' '),
  renameCharacter: (s, name) => ({ ...s, name }),
  duplicateCharacter: (s) => ({
    ...structuredClone(s),
    name: s.name ? `${s.name} (Copy)` : 'Untitled Shadow (Copy)',
    psycheCharacterId: null,
  }),
  CharacterEditor: Wr20ShadowEditor,
  sections: shadowSections,
  sectionGroups: shadowGroups,
};
