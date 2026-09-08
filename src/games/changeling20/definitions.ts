import type {
  GameSectionDefinition,
  GameSectionGroupDefinition,
} from '../game-system';

export const CHANGELING20_SYSTEM_ID = 'changeling20';
export const CHANGELING20_SCHEMA_VERSION = 1;

export const changeling20SectionGroups = [
  { id: 'character', label: 'Character' },
  { id: 'traits', label: 'Traits' },
  { id: 'advantages', label: 'Advantages' },
  { id: 'magic', label: 'Magic' },
  { id: 'conditions', label: 'Conditions' },
  { id: 'society', label: 'Society' },
  { id: 'possessions', label: 'Possessions' },
  { id: 'combat', label: 'Combat' },
  { id: 'advancement', label: 'Advancement' },
  { id: 'records', label: 'Records' },
] as const satisfies readonly GameSectionGroupDefinition[];

export const changeling20GroupIds = changeling20SectionGroups.map(
  ({ id }) => id,
);

export const changeling20Sections = [
  { id: 'c20-identity', label: 'Identity', group: 'character' },
  { id: 'c20-creator', label: 'Character Creator', group: 'character' },
  { id: 'c20-attributes', label: 'Attributes', group: 'traits' },
  { id: 'c20-abilities', label: 'Abilities', group: 'traits' },
  { id: 'c20-backgrounds', label: 'Backgrounds', group: 'advantages' },
  { id: 'c20-merits-flaws', label: 'Merits & Flaws', group: 'advantages' },
  { id: 'c20-arts-realms', label: 'Arts & Realms', group: 'magic' },
  { id: 'c20-tempers', label: 'Tempers', group: 'conditions' },
  { id: 'c20-health', label: 'Health', group: 'conditions' },
  { id: 'c20-society', label: 'Society & Oaths', group: 'society' },
  { id: 'c20-possessions', label: 'Possessions', group: 'possessions' },
  { id: 'c20-combat', label: 'Combat', group: 'combat' },
  { id: 'c20-experience', label: 'Experience', group: 'advancement' },
  { id: 'c20-sources', label: 'Sources', group: 'records' },
  { id: 'c20-notes', label: 'History & Notes', group: 'records' },
] as const satisfies readonly GameSectionDefinition[];

export const defaultChangeling20Order = changeling20GroupIds;
