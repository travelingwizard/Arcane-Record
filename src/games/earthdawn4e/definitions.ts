import type {
  GameSectionDefinition,
  GameSectionGroupDefinition,
} from '../game-system';

export const EARTHDAWN4E_SYSTEM_ID = 'earthdawn4e';
export const EARTHDAWN4E_SCHEMA_VERSION = 20;

export const earthdawn4eSectionGroups = [
  { id: 'character', label: 'Character' },
  { id: 'disciplines', label: 'Disciplines' },
  { id: 'attributes', label: 'Attributes, Characteristics & Health' },
  { id: 'talents', label: 'Talents & Skills' },
  { id: 'magic', label: 'Magic' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'combat', label: 'Health & Combat' },
  { id: 'advancement', label: 'Advancement' },
  { id: 'records', label: 'Records' },
] as const satisfies readonly GameSectionGroupDefinition[];

export const earthdawn4eGroupIds = earthdawn4eSectionGroups.map(({ id }) => id);
export type Earthdawn4eGroupId = (typeof earthdawn4eGroupIds)[number];

export const earthdawn4eSections = [
  { id: 'ed4-identity', label: 'Identity', group: 'character' },
  { id: 'ed4-attributes', label: 'Attributes', group: 'attributes' },
  {
    id: 'ed4-characteristics',
    label: 'Characteristics & Health',
    group: 'attributes',
  },
  { id: 'ed4-talents', label: 'Talents', group: 'talents' },
  { id: 'ed4-skills', label: 'Skills & Knacks', group: 'talents' },
  { id: 'ed4-magic', label: 'Spells & Matrices', group: 'magic' },
  { id: 'ed4-patterns', label: 'Thread & Blood Magic', group: 'magic' },
  { id: 'ed4-equipment', label: 'Equipment', group: 'equipment' },
  {
    id: 'ed4-health',
    label: 'Health, Conditions & Combat',
    group: 'attributes',
  },
  {
    id: 'ed4-advancement',
    label: 'Legend & Advancement',
    group: 'advancement',
  },
  { id: 'ed4-notes', label: 'Description & Notes', group: 'records' },
] as const satisfies readonly GameSectionDefinition[];

export const defaultEarthdawn4eGroupOrder = earthdawn4eGroupIds;
