import type { ComponentType } from 'react';
import type { z } from 'zod';
import type { StoredCharacter } from '../storage/stored-character';
import type { StoredCharacterRepository } from '../storage/stored-character-repository';

export interface GameCharacterEditorProps<TCharacter> {
  record: StoredCharacter;
  character: TCharacter;
  repository: StoredCharacterRepository;
  onBack: () => Promise<void>;
  onRecordChanged: (record: StoredCharacter) => void;
}

export interface GameSectionDefinition {
  id: string;
  label: string;
  shortLabel?: string;
  group: string;
}

export interface GameSectionGroupDefinition {
  id: string;
  label: string;
}

export interface GameAppearanceDefinition {
  label: string;
  description: string;
}

export interface GameSystemVariantDefinition<TCharacter> {
  id: string;
  name: string;
  shortName: string;
  description: string;
  createInitialCharacter: () => TCharacter;
}

export interface GameSystemDefinition<TCharacter = unknown> {
  id: string;
  name: string;
  shortName: string;
  description: string;
  currentSchemaVersion: number;
  characterSchema: z.ZodType<TCharacter>;
  createInitialCharacter: () => TCharacter;
  migrateCharacter: (
    data: unknown,
    fromVersion: number,
    metadata: Pick<StoredCharacter, 'id' | 'createdAt' | 'updatedAt'>,
  ) => TCharacter;
  getDisplayName: (character: TCharacter) => string;
  getSummary: (character: TCharacter) => string;
  getSearchText: (character: TCharacter) => string;
  renameCharacter: (character: TCharacter, name: string) => TCharacter;
  duplicateCharacter: (character: TCharacter) => TCharacter;
  CharacterEditor: ComponentType<GameCharacterEditorProps<TCharacter>>;
  sections: readonly GameSectionDefinition[];
  sectionGroups: readonly GameSectionGroupDefinition[];
  variants?: readonly GameSystemVariantDefinition<TCharacter>[];
  appearance?: GameAppearanceDefinition;
  importLegacyCharacter?: (
    contents: string,
    fileName: string,
  ) => TCharacter | null;
}

export type RegisteredGameSystem = GameSystemDefinition<unknown>;
