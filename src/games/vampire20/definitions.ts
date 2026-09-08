import type {
  GameSectionDefinition,
  GameSectionGroupDefinition,
} from '../game-system';

export const V20_SYSTEM_ID = 'vampire20';
export const V20_SCHEMA_VERSION = 1;

export const v20SectionGroups = [
  { id: 'character', label: 'Character' },
  { id: 'traits', label: 'Traits' },
  { id: 'advantages', label: 'Advantages' },
  { id: 'roads', label: 'Roads & Virtues' },
  { id: 'disciplines', label: 'Disciplines & Sorcery' },
  { id: 'conditions', label: 'Blood & Conditions' },
  { id: 'society', label: 'Society & Coterie' },
  { id: 'possessions', label: 'Possessions' },
  { id: 'combat', label: 'Combat' },
  { id: 'advancement', label: 'Advancement' },
  { id: 'records', label: 'Records' },
] as const satisfies readonly GameSectionGroupDefinition[];

export const v20GroupIds = v20SectionGroups.map(({ id }) => id);

export const v20Sections = [
  { id: 'v20-identity', label: 'Identity', group: 'character' },
  { id: 'v20-creator', label: 'Character Creator', group: 'character' },
  { id: 'v20-attributes', label: 'Attributes', group: 'traits' },
  { id: 'v20-abilities', label: 'Abilities', group: 'traits' },
  { id: 'v20-backgrounds', label: 'Backgrounds', group: 'advantages' },
  { id: 'v20-merits-flaws', label: 'Merits & Flaws', group: 'advantages' },
  { id: 'v20-road', label: 'Road & Virtues', group: 'roads' },
  { id: 'v20-disciplines', label: 'Disciplines', group: 'disciplines' },
  { id: 'v20-sorcery', label: 'Sorcery & Rituals', group: 'disciplines' },
  { id: 'v20-blood', label: 'Blood & Willpower', group: 'conditions' },
  { id: 'v20-health', label: 'Health & States', group: 'conditions' },
  { id: 'v20-coterie', label: 'Coterie', group: 'society' },
  {
    id: 'v20-possessions',
    label: 'Possessions & Haven',
    group: 'possessions',
  },
  { id: 'v20-combat', label: 'Weapons & Armor', group: 'combat' },
  { id: 'v20-experience', label: 'Experience', group: 'advancement' },
  { id: 'v20-maturation', label: 'Maturation', group: 'advancement' },
  { id: 'v20-sources', label: 'Sources', group: 'records' },
  { id: 'v20-history', label: 'History & Description', group: 'records' },
] as const satisfies readonly GameSectionDefinition[];

export const defaultV20Order = v20GroupIds;
