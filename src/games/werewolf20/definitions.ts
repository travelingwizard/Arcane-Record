import type {
  GameSectionDefinition,
  GameSectionGroupDefinition,
} from '../game-system';

export const W20_SYSTEM_ID = 'werewolf20';
export const W20_SCHEMA_VERSION = 1;
export const w20SectionGroups = [
  { id: 'character', label: 'Character' },
  { id: 'traits', label: 'Traits & Forms' },
  { id: 'advantages', label: 'Advantages' },
  { id: 'gifts', label: 'Gifts & Rites' },
  { id: 'renown', label: 'Renown & Rank' },
  { id: 'resources', label: 'Rage, Gnosis & Willpower' },
  { id: 'society', label: 'Pack & Society' },
  { id: 'conditions', label: 'Conditions' },
  { id: 'possessions', label: 'Possessions & Combat' },
  { id: 'advancement', label: 'Advancement' },
  { id: 'records', label: 'Records' },
] as const satisfies readonly GameSectionGroupDefinition[];
export const w20GroupIds = w20SectionGroups.map(({ id }) => id);
export const defaultW20Order = [...w20GroupIds];
export const w20Sections = [
  { id: 'w20-identity', label: 'Identity', group: 'character' },
  { id: 'w20-creator', label: 'Character Creator', group: 'character' },
  { id: 'w20-attributes', label: 'Attributes', group: 'traits' },
  { id: 'w20-abilities', label: 'Abilities', group: 'traits' },
  { id: 'w20-forms', label: 'Forms', group: 'traits' },
  { id: 'w20-backgrounds', label: 'Backgrounds', group: 'advantages' },
  { id: 'w20-merits-flaws', label: 'Merits & Flaws', group: 'advantages' },
  { id: 'w20-gifts', label: 'Gifts', group: 'gifts' },
  { id: 'w20-rites', label: 'Rites, Fetishes & Talens', group: 'gifts' },
  { id: 'w20-renown', label: 'Renown & Rank', group: 'renown' },
  {
    id: 'w20-resources',
    label: 'Rage, Gnosis & Willpower',
    group: 'resources',
  },
  { id: 'w20-pack', label: 'Pack & Society', group: 'society' },
  { id: 'w20-health', label: 'Health & States', group: 'conditions' },
  { id: 'w20-possessions', label: 'Possessions', group: 'possessions' },
  { id: 'w20-combat', label: 'Weapons, Armor & Dice', group: 'possessions' },
  { id: 'w20-experience', label: 'Experience', group: 'advancement' },
  { id: 'w20-sources', label: 'Sources', group: 'records' },
  { id: 'w20-history', label: 'History & Notes', group: 'records' },
] as const satisfies readonly GameSectionDefinition[];
