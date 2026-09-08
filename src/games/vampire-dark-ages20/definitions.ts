import type {
  GameSectionDefinition,
  GameSectionGroupDefinition,
} from '../game-system';

export const DAV20_SYSTEM_ID = 'vampire-dark-ages20';
export const DAV20_SCHEMA_VERSION = 1;

export const dav20SectionGroups = [
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

export const dav20GroupIds = dav20SectionGroups.map(({ id }) => id);

export const dav20Sections = [
  { id: 'dav20-identity', label: 'Identity', group: 'character' },
  { id: 'dav20-creator', label: 'Character Creator', group: 'character' },
  { id: 'dav20-attributes', label: 'Attributes', group: 'traits' },
  { id: 'dav20-abilities', label: 'Abilities', group: 'traits' },
  { id: 'dav20-backgrounds', label: 'Backgrounds', group: 'advantages' },
  { id: 'dav20-merits-flaws', label: 'Merits & Flaws', group: 'advantages' },
  { id: 'dav20-road', label: 'Road & Virtues', group: 'roads' },
  { id: 'dav20-disciplines', label: 'Disciplines', group: 'disciplines' },
  { id: 'dav20-sorcery', label: 'Sorcery & Rituals', group: 'disciplines' },
  { id: 'dav20-blood', label: 'Blood & Willpower', group: 'conditions' },
  { id: 'dav20-health', label: 'Health & States', group: 'conditions' },
  { id: 'dav20-coterie', label: 'Coterie', group: 'society' },
  {
    id: 'dav20-possessions',
    label: 'Possessions & Haven',
    group: 'possessions',
  },
  { id: 'dav20-combat', label: 'Weapons & Armor', group: 'combat' },
  { id: 'dav20-experience', label: 'Experience', group: 'advancement' },
  { id: 'dav20-maturation', label: 'Maturation', group: 'advancement' },
  { id: 'dav20-sources', label: 'Sources', group: 'records' },
  { id: 'dav20-history', label: 'History & Description', group: 'records' },
] as const satisfies readonly GameSectionDefinition[];

export const defaultDav20Order = dav20GroupIds;
