import type { GameSystemDefinition } from '../game-system';
import { createKultCharacter } from './create-character';
import {
  KULT_SCHEMA_VERSION,
  KULT_SYSTEM_ID,
  kultSectionGroups,
  kultSections,
} from './definitions';
import { KultEditor } from './KultEditor';
import {
  kultCharacterSchema,
  migrateKultCharacter,
  type KultCharacter,
} from './schema';

const variant = (
  id: KultCharacter['sheetType'],
  name: string,
  description: string,
) => ({
  id,
  name,
  shortName: name,
  description,
  createInitialCharacter: () => createKultCharacter(id),
  createManualInitialCharacter: () => createKultCharacter(id),
});

export const kultDefinition: GameSystemDefinition<KultCharacter> = {
  id: KULT_SYSTEM_ID,
  name: 'KULT: Divinity Lost',
  shortName: 'KULT: Divinity Lost',
  sheetChoiceLabel: 'Character sheet',
  description:
    'Manual General, Sleeper, Aware, and Enlightened sheets with source-backed inspiration and structured play records.',
  currentSchemaVersion: KULT_SCHEMA_VERSION,
  characterSchema: kultCharacterSchema,
  createInitialCharacter: () => createKultCharacter('general'),
  variants: [
    variant(
      'general',
      'General',
      'An unrestricted manual KULT character sheet.',
    ),
    variant(
      'sleeper',
      'Sleeper',
      'A Sleeper sheet with remembrance and awakening records.',
    ),
    variant(
      'aware',
      'Aware',
      'An Aware sheet with its structured advancement options.',
    ),
    variant(
      'enlightened',
      'Enlightened',
      'An Enlightened sheet with Abilities, Limitations, and Awakening progression notes.',
    ),
  ],
  migrateCharacter: migrateKultCharacter,
  getDisplayName: (character) => character.name || 'Untitled KULT Character',
  getSummary: (character) =>
    `${character.sheetType} · ${character.archetype || 'Unspecified archetype'}`,
  getSearchText: (character) =>
    [
      character.name,
      character.player,
      character.archetype,
      character.occupation,
      character.concept,
      ...character.darkSecrets.map(({ name }) => name),
      ...character.advantages.map(({ name }) => name),
      ...character.disadvantages.map(({ name }) => name),
    ].join(' '),
  renameCharacter: (character, name) => ({ ...character, name }),
  duplicateCharacter: (character) => ({
    ...structuredClone(character),
    name: character.name
      ? `${character.name} (Copy)`
      : 'Untitled KULT Character (Copy)',
    transitionDraft: null,
  }),
  CharacterEditor: KultEditor,
  sections: kultSections,
  sectionGroups: kultSectionGroups,
  appearance: {
    label: 'KULT sheet settings',
    description: 'Appearance and per-character suggestion visibility controls.',
  },
};
