import type { GameSystemDefinition } from '../game-system';
import { BurningWheelEditor } from './BurningWheelEditor';
import {
  burningWheelStockIds,
  stockLabel,
  type BurningWheelStock,
} from './catalog';
import { importCharredCharacter } from './charred-file';
import { createBlankBurningWheelCharacter } from './create-character';
import {
  BURNING_WHEEL_SCHEMA_VERSION,
  BURNING_WHEEL_SYSTEM_ID,
  burningWheelSectionGroups,
  burningWheelSections,
} from './definitions';
import {
  burningWheelCharacterSchema,
  migrateBurningWheelCharacter,
  type BurningWheelCharacter,
} from './schema';

const variants = burningWheelStockIds.map((stock) => ({
  id: stock,
  name: stockLabel(stock),
  shortName: stockLabel(stock),
  description:
    stock === 'man'
      ? 'Mannish lifepaths, including Wizard Burner material.'
      : stock === 'elf'
        ? 'Elven lifepaths, including the Dark Elf Path of Spite.'
        : stock === 'roden' || stock === 'wolf'
          ? 'Revised-edition stock adapted to Burning Wheel Gold by Charred Black.'
          : `${stockLabel(stock)} lifepaths and stock-specific resources.`,
  createInitialCharacter: () =>
    createBlankBurningWheelCharacter(stock as BurningWheelStock),
}));

export const burningWheelDefinition: GameSystemDefinition<BurningWheelCharacter> =
  {
    id: BURNING_WHEEL_SYSTEM_ID,
    name: 'Burning Wheel Gold + Codex',
    shortName: 'Burning Wheel',
    description:
      'A local-first character burner and play record for seven Burning Wheel stocks.',
    currentSchemaVersion: BURNING_WHEEL_SCHEMA_VERSION,
    characterSchema: burningWheelCharacterSchema,
    createInitialCharacter: () => createBlankBurningWheelCharacter('man'),
    migrateCharacter: (data, fromVersion) =>
      migrateBurningWheelCharacter(data, fromVersion),
    getDisplayName: (character) =>
      character.identity.name.trim() ||
      `Untitled ${stockLabel(character.stock)}`,
    getSummary: (character) =>
      `${stockLabel(character.stock)} · ${character.mode} mode`,
    getSearchText: (character) =>
      [
        stockLabel(character.stock),
        character.identity.name,
        character.identity.player,
        character.identity.concept,
        ...character.beliefs,
        ...character.instincts,
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
          : `Untitled ${stockLabel(character.stock)} (Copy)`,
      },
    }),
    CharacterEditor: BurningWheelEditor,
    appearance: {
      label: 'Burning Wheel sheet settings',
      description:
        'Cross-game appearance and Burning Wheel burner preferences.',
    },
    sections: burningWheelSections,
    sectionGroups: burningWheelSectionGroups,
    variants,
    importLegacyCharacter: importCharredCharacter,
  };
