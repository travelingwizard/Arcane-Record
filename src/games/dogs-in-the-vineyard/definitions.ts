import type {
  GameSectionDefinition,
  GameSectionGroupDefinition,
} from '../game-system';

export const DITV_SYSTEM_ID = 'dogs-in-the-vineyard';
export const DITV_TOWN_SYSTEM_ID = 'dogs-in-the-vineyard-town';
export const DITV_SCHEMA_VERSION = 1;
export const DITV_SOURCE_ID = 'ditv.core';

export const characterGroups = [
  { id: 'character', label: 'Character' },
  { id: 'traits', label: 'Traits' },
  { id: 'possessions', label: 'Possessions' },
  { id: 'play', label: 'Play' },
  { id: 'growth', label: 'Growth' },
  { id: 'records', label: 'Records' },
] as const satisfies readonly GameSectionGroupDefinition[];

export const characterSections = [
  { id: 'character', label: 'Character', group: 'character' },
  { id: 'stats', label: 'Stats', group: 'traits' },
  { id: 'traits', label: 'Traits', group: 'traits' },
  { id: 'relationships', label: 'Relationships', group: 'traits' },
  { id: 'available', label: 'Available Dice', group: 'traits' },
  { id: 'belongings', label: 'Belongings & Coat', group: 'possessions' },
  { id: 'initiation', label: 'Initiation', group: 'play' },
  { id: 'conflicts', label: 'Conflicts', group: 'play' },
  { id: 'fallout', label: 'Fallout', group: 'play' },
  { id: 'between-towns', label: 'Between Towns', group: 'growth' },
  { id: 'records', label: 'Records', group: 'records' },
] as const satisfies readonly GameSectionDefinition[];

export const townGroups = [
  { id: 'town', label: 'Town' },
  { id: 'people', label: 'People' },
  { id: 'play', label: 'Play' },
  { id: 'records', label: 'Records' },
] as const satisfies readonly GameSectionGroupDefinition[];

export const townSections = [
  { id: 'town', label: 'Town', group: 'town' },
  { id: 'wrongness', label: "Something's Wrong", group: 'town' },
  { id: 'wants', label: 'What They Want', group: 'town' },
  { id: 'townspeople', label: 'Townspeople', group: 'people' },
  { id: 'npcs', label: 'NPCs & Groups', group: 'people' },
  { id: 'influence', label: 'Demonic Influence', group: 'play' },
  { id: 'conflicts', label: 'Conflicts', group: 'play' },
  { id: 'records', label: 'Records', group: 'records' },
] as const satisfies readonly GameSectionDefinition[];

export const characterGroupIds = characterGroups.map((x) => x.id);
export const townGroupIds = townGroups.map((x) => x.id);
