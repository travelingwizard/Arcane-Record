import type {
  GameSectionDefinition,
  GameSectionGroupDefinition,
} from '../game-system';

export const BURNING_WHEEL_SYSTEM_ID = 'burning-wheel';
export const BURNING_WHEEL_SCHEMA_VERSION = 1;

export const burningWheelSectionGroups = [
  { id: 'character', label: 'Character' },
  { id: 'burning', label: 'Burning' },
  { id: 'traits-abilities', label: 'Traits & Abilities' },
  { id: 'connections', label: 'Connections' },
  { id: 'conflict-health', label: 'Conflict & Health' },
  { id: 'gear', label: 'Gear' },
  { id: 'advancement', label: 'Advancement' },
  { id: 'records', label: 'Records' },
] as const satisfies readonly GameSectionGroupDefinition[];

export const burningWheelGroupIds = burningWheelSectionGroups.map(
  ({ id }) => id,
);
export type BurningWheelGroupId = (typeof burningWheelGroupIds)[number];

export const burningWheelSections = [
  { id: 'bw-character', label: 'Character', group: 'character' },
  { id: 'bw-beliefs', label: 'Beliefs & Instincts', group: 'character' },
  { id: 'bw-lifepaths', label: 'Lifepaths', group: 'burning' },
  { id: 'bw-stats', label: 'Stats & Attributes', group: 'burning' },
  { id: 'bw-skills', label: 'Skills', group: 'traits-abilities' },
  { id: 'bw-traits', label: 'Traits', group: 'traits-abilities' },
  { id: 'bw-connections', label: 'Connections', group: 'connections' },
  { id: 'bw-health', label: 'Health & Wounds', group: 'conflict-health' },
  { id: 'bw-artha', label: 'Artha', group: 'conflict-health' },
  { id: 'bw-gear', label: 'Gear & Property', group: 'gear' },
  { id: 'bw-advancement', label: 'Advancement', group: 'advancement' },
  { id: 'bw-records', label: 'Records & Save', group: 'records' },
] as const satisfies readonly GameSectionDefinition[];

export const defaultBurningWheelGroupOrder = burningWheelGroupIds;
