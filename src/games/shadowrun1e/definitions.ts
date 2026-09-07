import type {
  GameSectionDefinition,
  GameSectionGroupDefinition,
} from '../game-system';

export const SHADOWRUN1E_SYSTEM_ID = 'shadowrun1e';
export const SHADOWRUN1E_SCHEMA_VERSION = 1;

export const shadowrun1eSectionGroups = [
  { id: 'character', label: 'Character' },
  { id: 'creation', label: 'Creation' },
  { id: 'traits', label: 'Attributes & Skills' },
  { id: 'magic', label: 'Magic & Matrix' },
  { id: 'resources', label: 'Resources' },
  { id: 'combat', label: 'Combat' },
  { id: 'advancement', label: 'Advancement' },
  { id: 'records', label: 'Records' },
] as const satisfies readonly GameSectionGroupDefinition[];

export const shadowrun1eGroupIds = shadowrun1eSectionGroups.map(({ id }) => id);

export const shadowrun1eSections = [
  { id: 'sr1-identity', label: 'Identity', group: 'character' },
  { id: 'sr1-creation', label: 'Priority Build', group: 'creation' },
  { id: 'sr1-attributes', label: 'Attributes', group: 'traits' },
  { id: 'sr1-skills', label: 'Skills', group: 'traits' },
  { id: 'sr1-magic', label: 'Magic', group: 'magic' },
  { id: 'sr1-matrix', label: 'Matrix', group: 'magic' },
  { id: 'sr1-cyberware', label: 'Cyberware', group: 'resources' },
  { id: 'sr1-gear', label: 'Gear & Contacts', group: 'resources' },
  { id: 'sr1-combat', label: 'Combat & Condition', group: 'combat' },
  { id: 'sr1-experience', label: 'Karma & Experience', group: 'advancement' },
  { id: 'sr1-sources', label: 'Owned Sources', group: 'records' },
  { id: 'sr1-notes', label: 'Description & Notes', group: 'records' },
] as const satisfies readonly GameSectionDefinition[];

export const defaultShadowrun1eOrder = shadowrun1eGroupIds;
