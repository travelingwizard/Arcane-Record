import type {
  GameSectionDefinition,
  GameSectionGroupDefinition,
} from '../game-system';

export const TORCHBEARER2E_SYSTEM_ID = 'torchbearer2e';
export const TORCHBEARER2E_SCHEMA_VERSION = 4;

export const torchbearer2eSectionGroups = [
  { id: 'character', label: 'Character' },
  { id: 'survival', label: 'Rewards & Conditions' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'gear', label: 'Gear' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'magic', label: 'Magic' },
  { id: 'advancement', label: 'Advancement' },
  { id: 'records', label: 'Records' },
] as const satisfies readonly GameSectionGroupDefinition[];

export const torchbearer2eGroupIds = torchbearer2eSectionGroups.map(
  ({ id }) => id,
);
export type Torchbearer2eGroupId = (typeof torchbearer2eGroupIds)[number];

export const torchbearer2eSections = [
  { id: 'tb2-identity', label: 'Who You Are', group: 'character' },
  {
    id: 'tb2-drives',
    label: 'What You Fight For',
    group: 'character',
  },
  { id: 'tb2-traits', label: 'Traits', group: 'character' },
  { id: 'tb2-rewards', label: 'Fate & Persona', group: 'survival' },
  { id: 'tb2-conditions', label: 'Conditions', group: 'survival' },
  { id: 'tb2-abilities', label: 'Abilities', group: 'abilities' },
  { id: 'tb2-skills', label: 'Skills', group: 'abilities' },
  { id: 'tb2-wises', label: 'Wises', group: 'abilities' },
  { id: 'tb2-inventory', label: 'Inventory', group: 'gear' },
  {
    id: 'tb2-relationships',
    label: 'Allies & Enemies',
    group: 'relationships',
  },
  { id: 'tb2-magic', label: 'Relics & Spells', group: 'magic' },
  {
    id: 'tb2-advancement',
    label: 'Level & Experience',
    group: 'advancement',
  },
  { id: 'tb2-notes', label: 'Notes', group: 'records' },
] as const satisfies readonly GameSectionDefinition[];

export const defaultTorchbearer2eGroupOrder = torchbearer2eGroupIds;

export const torchbearer2eSkills = [
  ['beggar', 'Beggar', 'will'],
  ['alchemist', 'Alchemist', 'will'],
  ['arcanist', 'Arcanist', 'will'],
  ['armorer', 'Armorer', 'health'],
  ['carpenter', 'Carpenter', 'health'],
  ['cartographer', 'Cartographer', 'will'],
  ['commander', 'Commander', 'will'],
  ['cook', 'Cook', 'will'],
  ['criminal', 'Criminal', 'health'],
  ['dungeoneer', 'Dungeoneer', 'health'],
  ['fighter', 'Fighter', 'health'],
  ['fisher', 'Fisher', 'health'],
  ['haggler', 'Haggler', 'will'],
  ['healer', 'Healer', 'will'],
  ['hunter', 'Hunter', 'health'],
  ['jeweler', 'Jeweler', 'will'],
  ['laborer', 'Laborer', 'health'],
  ['lore-master', 'Lore Master', 'will'],
  ['manipulator', 'Manipulator', 'will'],
  ['mentor', 'Mentor', 'will'],
  ['orator', 'Orator', 'will'],
  ['pathfinder', 'Pathfinder', 'health'],
  ['peasant', 'Peasant', 'health'],
  ['persuader', 'Persuader', 'will'],
  ['rider', 'Rider', 'health'],
  ['ritualist', 'Ritualist', 'will'],
  ['sailor', 'Sailor', 'health'],
  ['sapper', 'Sapper', 'health'],
  ['scavenger', 'Scavenger', 'health'],
  ['scholar', 'Scholar', 'will'],
  ['smith', 'Smith', 'health'],
  ['scout', 'Scout', 'will'],
  ['steward', 'Steward', 'will'],
  ['stonemason', 'Stonemason', 'health'],
  ['survivalist', 'Survivalist', 'health'],
  ['summoner', 'Summoner', 'will'],
  ['theologian', 'Theologian', 'will'],
  ['weaver', 'Weaver', 'health'],
] as const;

export type Torchbearer2eSkillId = (typeof torchbearer2eSkills)[number][0];

export const torchbearer2eConditionIds = [
  'fresh',
  'hungry-thirsty',
  'angry',
  'afraid',
  'exhausted',
  'injured',
  'sick',
  'dead',
] as const;
export type Torchbearer2eConditionId =
  (typeof torchbearer2eConditionIds)[number];

export const torchbearer2eConditionLabels = {
  fresh: 'Fresh',
  'hungry-thirsty': 'Hungry & Thirsty',
  angry: 'Angry',
  afraid: 'Afraid',
  exhausted: 'Exhausted',
  injured: 'Injured',
  sick: 'Sick',
  dead: 'Dead',
} as const;

export const torchbearer2eInventoryLocations = [
  'head',
  'neck',
  'hands',
  'torso',
  'belt',
  'feet',
  'pocket',
  'satchel-backpack',
  'large-sack',
  'small-sack',
  'cache',
  'other',
] as const;

export const torchbearer2eInventoryLocationLabels: Record<
  (typeof torchbearer2eInventoryLocations)[number],
  string
> = {
  head: 'Head',
  neck: 'Neck',
  hands: 'Hands',
  torso: 'Torso',
  belt: 'Belt',
  feet: 'Feet',
  pocket: 'Pocket',
  'satchel-backpack': 'Satchel / Backpack',
  'large-sack': 'Large Sack',
  'small-sack': 'Small Sack',
  cache: 'Cache',
  other: 'Other',
};
