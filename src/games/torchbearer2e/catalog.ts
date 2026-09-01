export const TORCHBEARER_CORE_SOURCE_ID = 'tb2.core.dungeoneers-handbook';
export const TORCHBEARER_CORE_SOURCE = 'Torchbearer 2e: Dungeoneer’s Handbook';

export type TorchbearerCatalogKind =
  | 'class'
  | 'home'
  | 'skill'
  | 'wise'
  | 'trait'
  | 'gear'
  | 'weapon'
  | 'spell'
  | 'invocation'
  | 'relic'
  | 'level-benefit';

export interface TorchbearerReferenceDefinition {
  id: string;
  kind: TorchbearerCatalogKind;
  name: string;
  category: string;
  summary: string;
  mechanics: string;
  requirements: string[];
  aliases: string[];
  sourceId: string;
  source: string;
  page: number;
}

const slug = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

const reference = (
  kind: TorchbearerCatalogKind,
  name: string,
  category: string,
  page: number,
  mechanics: string,
  requirements: string[] = [],
): TorchbearerReferenceDefinition => ({
  id: `tb2.core.${kind}.${slug(name)}`,
  kind,
  name,
  category,
  summary: `${name} is a core Torchbearer Second Edition ${kind.replace('-', ' ')} entry.`,
  mechanics,
  requirements,
  aliases: [],
  sourceId: TORCHBEARER_CORE_SOURCE_ID,
  source: TORCHBEARER_CORE_SOURCE,
  page,
});

export type TorchbearerClassId =
  'burglar' | 'magician' | 'outcast' | 'ranger' | 'theurge' | 'warrior';
export type TorchbearerStockId = 'halfling' | 'human' | 'dwarf' | 'elf';

export interface TorchbearerClassDefinition extends TorchbearerReferenceDefinition {
  classId: TorchbearerClassId;
  stockId: TorchbearerStockId;
  fixedWill: number | null;
  fixedHealth: number | null;
  skillRatings: Record<string, number>;
  traitId: string;
  allowedWeaponIds: string[];
  forbiddenWeaponIds: string[];
  startingArmorId: string | null;
  mayTakeShield: boolean;
  mayTakeHelmet: boolean;
  requiresMentor: boolean;
  startingMemoryPalace: number;
  startingUrdr: number;
}

const skillId = (name: string) => `tb2.core.skill.${slug(name)}`;
const traitId = (name: string) => `tb2.core.trait.${slug(name)}`;
const gearId = (name: string) => `tb2.core.gear.${slug(name)}`;
const weaponId = (name: string) => `tb2.core.weapon.${slug(name)}`;

const allStartingWeapons = [
  'Battle Axe',
  'Bow',
  'Crossbow',
  'Dagger',
  'Flail',
  'Great Sword',
  'Halberd',
  'Hand Axe',
  'Mace',
  'Polearm',
  'Shield',
  'Sling',
  'Spear',
  'Staff',
  'Sword',
  'Warhammer',
].map(weaponId);

const classDefinition = (
  value: Omit<TorchbearerClassDefinition, keyof TorchbearerReferenceDefinition>,
): TorchbearerClassDefinition => ({
  ...reference(
    'class',
    value.classId[0]!.toUpperCase() + value.classId.slice(1),
    value.stockId,
    value.classId === 'burglar' ||
      value.classId === 'magician' ||
      value.classId === 'outcast'
      ? 26
      : 27,
    'Select this class to apply its stock, starting abilities, Skills, Trait, equipment permissions, and level-one benefit.',
  ),
  ...value,
});

export const torchbearerClasses: TorchbearerClassDefinition[] = [
  classDefinition({
    classId: 'burglar',
    stockId: 'halfling',
    fixedWill: 5,
    fixedHealth: 3,
    skillRatings: {
      [skillId('Cook')]: 3,
      [skillId('Criminal')]: 3,
      [skillId('Fighter')]: 3,
      [skillId('Hunter')]: 2,
      [skillId('Scout')]: 2,
      [skillId('Scavenger')]: 2,
    },
    traitId: traitId('Hidden Depths'),
    allowedWeaponIds: allStartingWeapons.filter(
      (id) =>
        !['crossbow', 'great-sword', 'halberd', 'polearm'].some((name) =>
          id.endsWith(name),
        ),
    ),
    forbiddenWeaponIds: ['Crossbow', 'Great Sword', 'Halberd', 'Polearm'].map(
      weaponId,
    ),
    startingArmorId: gearId('Leather Armor'),
    mayTakeShield: false,
    mayTakeHelmet: false,
    requiresMentor: false,
    startingMemoryPalace: 0,
    startingUrdr: 0,
  }),
  classDefinition({
    classId: 'magician',
    stockId: 'human',
    fixedWill: null,
    fixedHealth: null,
    skillRatings: {
      [skillId('Arcanist')]: 4,
      [skillId('Lore Master')]: 3,
      [skillId('Alchemist')]: 2,
      [skillId('Cartographer')]: 2,
      [skillId('Scholar')]: 2,
    },
    traitId: traitId('Wizard’s Sight'),
    allowedWeaponIds: ['Dagger', 'Staff'].map(weaponId),
    forbiddenWeaponIds: [],
    startingArmorId: null,
    mayTakeShield: false,
    mayTakeHelmet: false,
    requiresMentor: true,
    startingMemoryPalace: 1,
    startingUrdr: 0,
  }),
  classDefinition({
    classId: 'outcast',
    stockId: 'dwarf',
    fixedWill: 3,
    fixedHealth: 5,
    skillRatings: {
      [skillId('Fighter')]: 4,
      [skillId('Dungeoneer')]: 3,
      [skillId('Armorer')]: 2,
      [skillId('Sapper')]: 2,
      [skillId('Orator')]: 2,
      [skillId('Scout')]: 2,
    },
    traitId: traitId('Born of Earth and Stone'),
    allowedWeaponIds: allStartingWeapons.filter(
      (id) => !id.endsWith('great-sword'),
    ),
    forbiddenWeaponIds: [weaponId('Great Sword')],
    startingArmorId: gearId('Leather Armor'),
    mayTakeShield: true,
    mayTakeHelmet: true,
    requiresMentor: false,
    startingMemoryPalace: 0,
    startingUrdr: 0,
  }),
  classDefinition({
    classId: 'ranger',
    stockId: 'elf',
    fixedWill: 4,
    fixedHealth: 4,
    skillRatings: {
      [skillId('Fighter')]: 3,
      [skillId('Pathfinder')]: 3,
      [skillId('Scout')]: 3,
      [skillId('Hunter')]: 2,
      [skillId('Lore Master')]: 2,
      [skillId('Survivalist')]: 2,
    },
    traitId: traitId('First Born'),
    allowedWeaponIds: ['Bow', 'Sword', 'Spear', 'Dagger'].map(weaponId),
    forbiddenWeaponIds: [],
    startingArmorId: gearId('Leather Armor'),
    mayTakeShield: false,
    mayTakeHelmet: false,
    requiresMentor: false,
    startingMemoryPalace: 0,
    startingUrdr: 0,
  }),
  classDefinition({
    classId: 'theurge',
    stockId: 'human',
    fixedWill: null,
    fixedHealth: null,
    skillRatings: {
      [skillId('Fighter')]: 3,
      [skillId('Ritualist')]: 3,
      [skillId('Orator')]: 3,
      [skillId('Healer')]: 2,
      [skillId('Theologian')]: 2,
    },
    traitId: traitId('Touched by the Gods'),
    allowedWeaponIds: allStartingWeapons.filter(
      (id) => !id.endsWith('bow') && !id.endsWith('crossbow'),
    ),
    forbiddenWeaponIds: ['Bow', 'Crossbow'].map(weaponId),
    startingArmorId: null,
    mayTakeShield: true,
    mayTakeHelmet: false,
    requiresMentor: false,
    startingMemoryPalace: 0,
    startingUrdr: 1,
  }),
  classDefinition({
    classId: 'warrior',
    stockId: 'human',
    fixedWill: null,
    fixedHealth: null,
    skillRatings: {
      [skillId('Fighter')]: 4,
      [skillId('Hunter')]: 3,
      [skillId('Commander')]: 2,
      [skillId('Mentor')]: 2,
      [skillId('Rider')]: 2,
    },
    traitId: traitId('Heart of Battle'),
    allowedWeaponIds: allStartingWeapons,
    forbiddenWeaponIds: [],
    startingArmorId: gearId('Leather Armor'),
    mayTakeShield: true,
    mayTakeHelmet: true,
    requiresMentor: false,
    startingMemoryPalace: 0,
    startingUrdr: 0,
  }),
];

export const humanUpbringingSkillIds = [
  'Criminal',
  'Laborer',
  'Haggler',
  'Pathfinder',
  'Peasant',
  'Survivalist',
].map(skillId);
export const socialGraceSkillIds = [
  'Haggler',
  'Manipulator',
  'Orator',
  'Persuader',
].map(skillId);
export const specialtySkillIds = [
  'Cartographer',
  'Cook',
  'Criminal',
  'Dungeoneer',
  'Haggler',
  'Healer',
  'Hunter',
  'Manipulator',
  'Pathfinder',
  'Persuader',
  'Orator',
  'Rider',
  'Sapper',
  'Scavenger',
  'Scout',
  'Survivalist',
].map(skillId);

export interface TorchbearerHomeDefinition extends TorchbearerReferenceDefinition {
  skillIds: string[];
  traitIds: string[];
  allowedStocks: TorchbearerStockId[];
}

const home = (
  name: string,
  skills: string[],
  traits: string[],
  allowedStocks: TorchbearerStockId[] = ['halfling', 'human', 'dwarf', 'elf'],
): TorchbearerHomeDefinition => ({
  ...reference(
    'home',
    name,
    'settlement',
    30,
    'Choose one listed Skill at rating 2 (or increase an existing rating by one, maximum 4) and one listed Trait at level 1.',
  ),
  skillIds: skills.map(skillId),
  traitIds: traits.map(traitId),
  allowedStocks,
});

export const torchbearerHomes = [
  home(
    'Elfhome',
    ['Healer', 'Mentor', 'Pathfinder'],
    ['Calm', 'Quiet'],
    ['elf'],
  ),
  home(
    'Dwarven Halls',
    ['Armorer', 'Laborer', 'Stonemason'],
    ['Cunning', 'Fiery'],
  ),
  home(
    'Religious Bastion',
    ['Cartographer', 'Scholar', 'Theologian'],
    ['Defender', 'Scarred'],
  ),
  home(
    'Bustling Metropolis',
    ['Haggler', 'Sailor', 'Steward'],
    ['Extravagant', 'Jaded'],
  ),
  home(
    'Wizard’s Tower',
    ['Alchemist', 'Lore Master', 'Scholar'],
    ['Skeptical', 'Thoughtful'],
  ),
  home(
    'Remote Village',
    ['Carpenter', 'Peasant', 'Weaver'],
    ['Early Riser', 'Rough Hands'],
  ),
  home(
    'Busy Crossroads',
    ['Cook', 'Haggler', 'Rider'],
    ['Foolhardy', 'Quick-Witted'],
  ),
];

const skillRows = [
  ['Alchemist', 'will', 160],
  ['Arcanist', 'will', 161],
  ['Armorer', 'health', 161],
  ['Carpenter', 'health', 161],
  ['Cartographer', 'will', 162],
  ['Commander', 'will', 162],
  ['Cook', 'will', 163],
  ['Criminal', 'health', 163],
  ['Dungeoneer', 'health', 164],
  ['Fighter', 'health', 164],
  ['Haggler', 'will', 165],
  ['Healer', 'will', 165],
  ['Hunter', 'health', 165],
  ['Laborer', 'health', 166],
  ['Lore Master', 'will', 167],
  ['Manipulator', 'will', 167],
  ['Mentor', 'will', 168],
  ['Orator', 'will', 168],
  ['Pathfinder', 'health', 168],
  ['Peasant', 'health', 169],
  ['Persuader', 'will', 169],
  ['Rider', 'health', 169],
  ['Ritualist', 'will', 170],
  ['Sailor', 'health', 171],
  ['Sapper', 'health', 171],
  ['Scavenger', 'health', 172],
  ['Scholar', 'will', 172],
  ['Scout', 'will', 173],
  ['Steward', 'will', 174],
  ['Stonemason', 'health', 174],
  ['Survivalist', 'health', 175],
  ['Theologian', 'will', 176],
  ['Weaver', 'health', 176],
] as const;

export const torchbearerSkills = skillRows.map(([name, root, page]) => ({
  ...reference(
    'skill',
    name,
    root,
    page,
    `Untrained tests use Beginner’s Luck rooted in ${root === 'will' ? 'Will' : 'Health'}. The expanded card summarizes the core use and directs the player to its cited factor list.`,
  ),
  beginnersLuckRoot: root,
}));

const wiseRows = [
  ['Dwarven Chronicles-wise', 'dwarf stock'],
  ['Shrewd Appraisal-wise', 'dwarf stock'],
  ['Elven Lore-wise', 'elf stock'],
  ['Folly of Humanity-wise', 'elf stock'],
  ['Folly of Dwarves-wise', 'elf stock'],
  ['Home-wise', 'halfling stock'],
  ['Needs a Little Salt-wise', 'halfling stock'],
  ['Ironwold-wise', 'specific location'],
  ['Temple of Black Skulls-wise', 'specific location'],
  ['Dragon-wise', 'specific monster'],
  ['Ghoul-wise', 'specific monster'],
  ['Barbarian-wise', 'specific group'],
  ['Bjorning-wise', 'specific group'],
  ['Gott-wise', 'specific group'],
  ['Armorer-wise', 'specific group'],
  ['Apiarist-wise', 'specific group'],
  ['Bandit-wise', 'specific group'],
  ['Book-wise', 'specific thing'],
  ['Ice Storm-wise', 'specific thing'],
  ['Trap-wise', 'specific thing'],
  ['Ugly Truth-wise', 'specific thing'],
  ['War-wise', 'specific thing'],
] as const;

export const torchbearerWises = wiseRows.map(([name, category]) =>
  reference(
    'wise',
    name,
    category,
    category.includes('stock') ? 31 : 32,
    'Wises are not rolled. They augment related tests and may establish knowledge of an associated language. Custom specific Wises are allowed.',
  ),
);

const traitRows = [
  ['Adventurous', 177],
  ['Bitter', 177],
  ['Bold', 177],
  ['Born of Earth and Stone', 178],
  ['Brave', 178],
  ['Calm', 178],
  ['Cunning', 178],
  ['Curious', 178],
  ['Defender', 178],
  ['Early Riser', 178],
  ['Extravagant', 178],
  ['Extrovert', 179],
  ['Fearless', 179],
  ['Fiery', 179],
  ['First Born', 179],
  ['Foolhardy', 179],
  ['Generous', 179],
  ['Heart of Battle', 179],
  ['Hidden Depths', 179],
  ['Honorable', 180],
  ['Jaded', 180],
  ['Loner', 180],
  ['Lost', 180],
  ['Quick-Witted', 180],
  ['Quiet', 180],
  ['Rough Hands', 180],
  ['Restless', 181],
  ['Scarred', 181],
  ['Sharp-Eyed', 181],
  ['Skeptical', 181],
  ['Skinny', 181],
  ['Steady Hands', 181],
  ['Stoic', 181],
  ['Tall', 181],
  ['Thoughtful', 182],
  ['Touched by the Gods', 182],
  ['Wizard’s Sight', 182],
] as const;

export const torchbearerTraits = traitRows.map(([name, page]) =>
  reference(
    'trait',
    name,
    'core trait',
    page,
    'Use this quality to help appropriate tests or invoke it against the character to earn checks, following its level and the core Trait rules.',
  ),
);

export interface TorchbearerGearDefinition extends TorchbearerReferenceDefinition {
  cost: number;
  slotText: string;
  capacity: number;
  startingEligible: boolean;
  startingQuantity: number;
}

const gear = (
  name: string,
  category: string,
  page: number,
  cost: number,
  slotText: string,
  capacity = 0,
  startingEligible = true,
  startingQuantity = 1,
): TorchbearerGearDefinition => ({
  ...reference(
    category === 'weapon' ? 'weapon' : 'gear',
    name,
    category,
    page,
    `Resources Ob ${cost}; inventory ${slotText}. Use the expanded reference for the item’s concise core effect.`,
  ),
  cost,
  slotText,
  capacity,
  startingEligible,
  startingQuantity,
});

export const torchbearerGear: TorchbearerGearDefinition[] = [
  gear('Chain Armor', 'armor', 148, 3, 'worn/torso 1'),
  gear('Helmet', 'armor', 148, 2, 'worn/head'),
  gear('Leather Armor', 'armor', 148, 2, 'worn/torso 1'),
  gear('Plate Armor', 'armor', 148, 4, 'worn/torso 2'),
  gear('Belt', 'clothing', 148, 1, 'worn/special', 3),
  gear('Cloak', 'clothing', 148, 2, 'worn/torso 1, carried 1, or pack 2'),
  gear('Finery', 'clothing', 148, 4, 'worn/torso 3 or pack 4'),
  gear('Shoes', 'clothing', 148, 1, 'worn/feet'),
  gear('Backpack', 'container', 148, 2, 'worn/torso 2', 6),
  gear('Bottle', 'container', 148, 1, 'carried 1 or pack 2', 2),
  gear('Jug', 'container', 148, 1, 'carried 1 or pack 3', 3),
  gear('Pouch, Belt', 'container', 148, 1, 'belt 1 or pack 1', 1),
  gear('Quiver', 'container', 148, 2, 'worn/torso 1 or belt 2', 1),
  gear('Sack, Large', 'container', 148, 1, 'carried 2 or pack 1', 6),
  gear('Sacks, Small', 'container', 148, 1, 'carried 1 or pack 1', 2),
  gear('Satchel', 'container', 148, 1, 'worn/torso 1', 3),
  gear('Waterskin/Wineskin', 'container', 148, 1, 'belt 1 or pack 1', 1),
  gear('Flasks of Oil', 'equipment', 148, 2, 'carried 1 or pack 1', 0, true, 2),
  gear('Garlic', 'equipment', 148, 1, 'carried 1, worn/neck 1, or pack 1'),
  gear('Grappling Hook', 'equipment', 148, 3, 'carried 1, belt 1, or pack 2'),
  gear('Hammer', 'equipment', 149, 2, 'carried 1 or pack 1'),
  gear('Iron Spikes', 'equipment', 149, 1, 'pack 1', 0, true, 6),
  gear('Mirror', 'equipment', 149, 4, 'carried 1 or pack 1'),
  gear('Pole, 10 Foot', 'equipment', 149, 1, 'carried 2'),
  gear('Rope', 'equipment', 149, 2, 'worn/torso 1 or pack 2'),
  gear('Thieves’ Tools', 'equipment', 149, 4, 'pack 1'),
  gear('Tinderbox', 'equipment', 149, 1, 'pack 1'),
  gear('Rations, Fresh', 'food', 149, 1, 'pack 1', 0, true, 2),
  gear('Rations, Preserved', 'food', 149, 2, 'pack 1', 0, true, 3),
  gear('Water', 'food', 149, 0, 'skin/bottle/jug 1'),
  gear('Wine', 'food', 149, 1, 'skin/bottle/jug 1'),
  gear('Candles', 'light', 149, 1, 'carried 1 or pack 1', 0, true, 4),
  gear('Lantern', 'light', 149, 3, 'carried 1 or pack 2'),
  gear('Torches', 'light', 149, 2, 'carried 1 or pack 1', 0, true, 4),
  gear(
    'Holy Water Flasks',
    'religious',
    149,
    3,
    'carried 1 or pack 1',
    0,
    true,
    3,
  ),
  gear('Sacramentals', 'religious', 149, 1, 'worn/hand, worn/neck, or pack 1'),
  gear('Spell Book', 'magic', 149, 4, 'pack 2'),
  gear('Spell Materials', 'magic', 149, 1, 'worn/hand, worn/neck, or pack 1'),
  gear('Stakes and Mallet', 'religious', 149, 2, 'pack 1', 0, true, 3),
  gear('Wolfsbane', 'religious', 149, 2, 'pack 1'),
  gear('Writing Kit', 'equipment', 149, 3, 'skill equipment'),
  gear(
    'Parents’ Keepsake',
    'creation reward',
    36,
    0,
    'worn/neck 1 or worn/hand 1',
    0,
    false,
  ),
  gear('Pouch of Gold Coins', 'creation reward', 37, 0, 'belt 1', 0, false),
];

const weaponRows = [
  ['Battle Axe', 3, 'carried 1; wielded 2'],
  ['Bow', 3, 'quiver 1 or carried 1; wielded 2'],
  ['Crossbow', 4, 'carried 2 and belt 1; wielded 2'],
  ['Dagger', 1, 'carried 1 or belt 1; wielded 1'],
  ['Flail', 2, 'carried 1; wielded 1'],
  ['Great Sword', 3, 'carried 1; wielded 2'],
  ['Halberd', 3, 'carried 1; wielded 2'],
  ['Hand Axe', 1, 'belt 1, pack 2, or carried 1; wielded 1'],
  ['Mace', 2, 'carried 1 or belt 1; wielded 1'],
  ['Polearm', 3, 'carried 1; wielded 2'],
  ['Shield', 1, 'carried 1 or worn/torso 1; wielded 1'],
  ['Sling', 1, 'pouch 1; wielded 1'],
  ['Spear', 1, 'carried 1; wielded 1'],
  ['Staff', 1, 'carried 1; wielded 2'],
  ['Sword', 3, 'carried 1 or belt 1; wielded 1'],
  ['Warhammer', 3, 'carried 1; wielded 2'],
] as const;

export const torchbearerWeapons = weaponRows.map(([name, cost, slots]) =>
  gear(
    name,
    'weapon',
    name === 'Battle Axe' || name === 'Bow' || name === 'Crossbow'
      ? 156
      : name === 'Dagger'
        ? 158
        : 157,
    cost,
    slots,
  ),
);

const conflictWeaponRows = [
  [
    'Camouflage',
    'capture',
    234,
    '+1D to Feint when appropriate camouflage or a blind is prepared.',
  ],
  [
    'Lures',
    'capture',
    234,
    '+1D to Maneuver; creating a lure may require Hunter.',
  ],
  [
    'Nets or Traps',
    'capture',
    234,
    '+1s to Attack when built for the quarry’s type and Might.',
  ],
  [
    'Blackmail',
    'convince',
    235,
    '+1D to one chosen action type when credible leverage exists.',
  ],
  [
    'Deception',
    'convince',
    235,
    '+1s to Feint when the lie engages real facts.',
  ],
  [
    'Evidence',
    'convince',
    235,
    '+1s to Attack when pre-established evidence is presented.',
  ],
  [
    'Finery',
    'convince',
    235,
    'Clean and fashionable finery grants +1 Precedence.',
  ],
  [
    'Intimidation',
    'convince',
    235,
    '+1s to Maneuver when a real threat is played out.',
  ],
  [
    'Promises',
    'convince',
    235,
    '+1D to Defend; promises may return in the compromise.',
  ],
  [
    'Elevated Position',
    'convince crowd',
    236,
    '+1s to Attack when the speaker can be seen from an elevated position.',
  ],
  [
    'Playing to the Mood',
    'convince crowd',
    236,
    '+1s to Feint when the address engages the crowd’s present mood.',
  ],
  [
    'Uniform of Authority',
    'convince crowd',
    236,
    '+1D to Defend with suitable finery or disguise.',
  ],
  [
    'Caltrops or Oil',
    'pursue or flee',
    236,
    '+1s to Feint in a flee conflict; the item is expended.',
  ],
  [
    'Locals',
    'pursue or flee',
    236,
    '+1D to one action type when aided by local knowledge.',
  ],
  [
    'Maps',
    'pursue or flee',
    236,
    '+1D to the disposition roll with an accurate map.',
  ],
  [
    'Right Tools',
    'pursue or flee',
    237,
    '+1s to Attack when proper tools address the terrain.',
  ],
  [
    'Answers',
    'riddle',
    237,
    '+2s to Defend when the answer or truth is known.',
  ],
  [
    'Material Clue',
    'riddle',
    237,
    '+2D to Maneuver with a person, object, or terrain clue.',
  ],
  [
    'Riddle',
    'riddle',
    237,
    '+1D and +1s to Attack when an actual riddle is posed.',
  ],
  [
    'Truth',
    'trick',
    238,
    '+1D to Attack when the trickster tells the victim a truth.',
  ],
  ['Distraction', 'trick', 238, '+1D to Maneuver with a prepared diversion.'],
  [
    'Prop',
    'trick',
    238,
    '+1D to Feint with a convincing prop prepared in advance.',
  ],
] as const;

export const torchbearerOtherWeapons = conflictWeaponRows.map(
  ([name, category, page, mechanics]) =>
    reference('weapon', name, category, page, mechanics),
);

const conflictArmorRows = [
  [
    'Authority',
    'convince',
    238,
    'Once per conflict, may absorb 1 point on a 4–6 roll.',
  ],
  [
    'Precedence',
    'convince',
    238,
    'May absorb 1 point per hit; check after each hit to retain the effect.',
  ],
  [
    'Title or Office',
    'convince crowd',
    239,
    'May absorb 1 point per hit; check after each hit to retain the effect.',
  ],
  [
    'Shoes',
    'pursue',
    239,
    'Once per conflict, good shoes may absorb 1 point on a 4–6 roll.',
  ],
  [
    'Darkness',
    'flee',
    239,
    'May absorb 1 point per hit; check after each hit to retain the effect.',
  ],
  [
    'Knowledge of Nature',
    'trick or riddle',
    239,
    'Knowing a target Nature descriptor may absorb 1 point per hit; check after each hit.',
  ],
] as const;

export const torchbearerConflictArmor = conflictArmorRows.map(
  ([name, category, page, mechanics]) => ({
    ...reference('gear', name, `${category} conflict armor`, page, mechanics),
    id: `tb2.core.conflict-armor.${slug(name)}`,
  }),
);

const spellRows = [
  ['Aetheric Appendage', 183],
  ['Aetherial Premonition', 184],
  ['Arcane Semblance', 184],
  ['Celestial Music', 185],
  ['Dæmonic Stupefaction', 185],
  ['Dweomercraft', 186],
  ['Lightness of Being', 187],
  ['Mystic Porter', 187],
  ['Supernal Vision', 188],
  ['Swarm', 188],
  ['Thread of Friendship', 189],
  ['Wayfinder’s Friend', 190],
  ['Wisdom of the Sages', 191],
  ['Wizard’s Ægis', 191],
  ['Word of Binding', 192],
  ['Wyrd Lights', 192],
  ['Destiny of Heroes', 193],
  ['Eye of Omens', 193],
  ['Eyes of the Bat', 194],
  ['Flames of the Shroud', 194],
  ['Numinous Sigil', 195],
  ['Phantasmal Vision', 196],
  ['Rhyme of Opening', 196],
  ['Somnific Trance', 197],
  ['Shroud of Shadows', 198],
  ['Veil of the Chameleon', 198],
  ['Water Lung', 199],
  ['Wizard’s Bane', 199],
  ['Apotropaic Circle', 200],
  ['Balefire', 201],
  ['Beast Cloak', 202],
  ['Conference of Birds', 202],
  ['Devilish Laughter', 203],
  ['Empyreal Messenger', 203],
  ['Eye of the Overworld', 204],
  ['Incandescent Beacon', 204],
  ['Lightning Step', 205],
  ['Sign of Abrogation', 205],
  ['Sorcerous Suggestion', 206],
  ['Simulacrum', 206],
  ['Stormcrow', 207],
  ['Tangletongue', 207],
] as const;

export const torchbearerSpells = spellRows.map(([name, page]) => {
  const circle = page < 193 ? 1 : page < 200 ? 2 : 3;
  return {
    ...reference(
      'spell',
      name,
      `circle ${circle}`,
      page,
      `A circle ${circle} Arcanist spell. Its expanded card records casting guidance, effect summary, and carried components without reproducing the source text.`,
    ),
    circle,
  };
});

const invocationRows = [
  ['Blessing of the Lord of Labor', 209],
  ['Bone Knitter', 209],
  ['Breath of the Burning Lord', 210],
  ['Forge Rites', 210],
  ['Gift of Hospitality', 210],
  ['Hallraiser’s Call', 211],
  ['Hearth Rune', 211],
  ['Inspiring Aura', 211],
  ['Loom of the Disir', 211],
  ['Merciful Balm', 212],
  ['Mudra of Fate', 212],
  ['Plow Blessing', 212],
  ['Reaper’s Round', 213],
  ['Shipwright’s Chant', 213],
  ['Sigrun’s Voice of Thunder', 213],
  ['Sigtyr’s Arresting Speech', 214],
  ['Wisdom of the Mother', 214],
  ['Balm of the Lords of Serenity', 214],
  ['Benediction of the Lords of Creation', 215],
  ['Blood Vow to the Lords of Creation', 215],
  ['Catholicon of the Lord of Plagues', 216],
  ['Chant of the Lords of Valor', 216],
  ['Cloak of the Lords of Forges', 217],
  ['Evocation of the Lords of Battle', 217],
  ['Fury of the Lords of Life and Death', 218],
  ['Grace of the Lords of Plenty', 219],
  ['Guidance of the Lord of Paths and Ways', 219],
  ['Interlocution of the Lords of Law', 220],
  ['Invocation to the Immortal Waters', 220],
  ['Prayer to the Lords of Silence', 221],
  ['Spring of the Eternal', 221],
  ['Supplication to the Burning Lord', 222],
  ['Vision of the Lords of Chaos and Law', 222],
  ['Wrath of the Lords of Law', 223],
  ['Absolution of the Lord of Endings', 223],
  ['Apotheosis of the Lords of Law', 224],
  ['Blessing of the Lord of Winds', 224],
  ['Byrnie of the Disir', 225],
  ['Chariot of the Lord of Labor', 225],
  ['Exaltation of the Lords of Battle', 226],
  ['Extirpation', 226],
  ['Foundation of the Lords of Law', 227],
  ['Malison of the Lords of Terror', 227],
  ['Sanction of the Lady of Valor', 228],
  ['Sanctuary of the Vår Maiden', 228],
  ['Twist of the Skein of Fate', 229],
  ['Visage of the Lord of Victory', 229],
  ['Benison of Hlin Hearthmistress', 230],
  ['Blessing of the Ancestors', 230],
  ['Celestial Ship of the Lord of Winds', 231],
  ['Horn of the Valkyrja', 231],
] as const;

export const torchbearerInvocations = invocationRows.map(([name, page]) => {
  const circle = page < 214 ? 1 : page < 223 ? 2 : page < 230 ? 3 : 4;
  return {
    ...reference(
      'invocation',
      name,
      `circle ${circle}`,
      page,
      `A circle ${circle} Ritualist invocation. Its expanded card summarizes the divine effect, burden, and sacramental reference.`,
    ),
    circle,
  };
});

export const torchbearerStartingMagicSchools = [
  {
    id: 'necromancy',
    range: [2, 3],
    spellNames: [
      'Dæmonic Stupefaction',
      'Supernal Vision',
      'Wisdom of the Sages',
    ],
  },
  {
    id: 'divination',
    range: [4, 4],
    spellNames: [
      'Aetherial Premonition',
      'Wayfinder’s Friend',
      'Supernal Vision',
    ],
  },
  {
    id: 'abjuration',
    range: [5, 5],
    spellNames: ['Wayfinder’s Friend', 'Wizard’s Ægis', 'Word of Binding'],
  },
  {
    id: 'conjuration',
    range: [6, 6],
    spellNames: ['Aetheric Appendage', 'Dæmonic Stupefaction', 'Wyrd Lights'],
  },
  {
    id: 'transmutation',
    range: [7, 7],
    spellNames: ['Dweomercraft', 'Lightness of Being', 'Word of Binding'],
  },
  {
    id: 'illusion',
    range: [8, 8],
    spellNames: ['Arcane Semblance', 'Celestial Music', 'Wyrd Lights'],
  },
  {
    id: 'enchantment',
    range: [9, 9],
    spellNames: [
      'Celestial Music',
      'Dæmonic Stupefaction',
      'Thread of Friendship',
    ],
  },
  {
    id: 'evocation',
    range: [10, 10],
    spellNames: ['Swarm', 'Lightness of Being', 'Mystic Porter'],
  },
  { id: 'choose', range: [11, 12], spellNames: [] },
].map((entry) => ({
  ...entry,
  spellIds: entry.spellNames.map((name) => `tb2.core.spell.${slug(name)}`),
}));

export interface TorchbearerNatureAnswerDefinition {
  id: string;
  stockId: TorchbearerStockId;
  question: number;
  label: string;
  natureDelta: number;
  resourcesMinimum: number;
  descriptorReplacement: [string, string] | null;
  classTraitLevel2: boolean;
  replacementHomeTraitId: string | null;
  grantedWise: string | null;
  page: number;
}

const natureAnswer = (
  stockId: TorchbearerStockId,
  question: number,
  key: string,
  label: string,
  effects: Partial<
    Pick<
      TorchbearerNatureAnswerDefinition,
      | 'natureDelta'
      | 'resourcesMinimum'
      | 'descriptorReplacement'
      | 'classTraitLevel2'
      | 'replacementHomeTraitId'
      | 'grantedWise'
    >
  > = {},
): TorchbearerNatureAnswerDefinition => ({
  id: `tb2.core.nature.${stockId}-q${question}-${key}`,
  stockId,
  question,
  label,
  natureDelta: effects.natureDelta ?? 0,
  resourcesMinimum: effects.resourcesMinimum ?? 0,
  descriptorReplacement: effects.descriptorReplacement ?? null,
  classTraitLevel2: effects.classTraitLevel2 ?? false,
  replacementHomeTraitId: effects.replacementHomeTraitId ?? null,
  grantedWise: effects.grantedWise ?? null,
  page:
    stockId === 'dwarf'
      ? question === 1
        ? 33
        : 34
      : stockId === 'elf'
        ? 34
        : stockId === 'halfling'
          ? 35
          : question < 3
            ? 35
            : 36,
});

export const torchbearerNatureAnswers: TorchbearerNatureAnswerDefinition[] = [
  natureAnswer('dwarf', 1, 'revenge', 'Avenge my kin at any cost.', {
    natureDelta: 1,
  }),
  natureAnswer(
    'dwarf',
    1,
    'negotiate',
    'Counsel restraint and demand a blood price.',
    {
      descriptorReplacement: ['Avenging Grudges', 'Negotiating'],
    },
  ),
  natureAnswer('dwarf', 2, 'deeper', 'Delve ever deeper for treasure.', {
    natureDelta: 1,
  }),
  natureAnswer('dwarf', 2, 'fear-below', 'Fear what waits beneath.', {
    classTraitLevel2: true,
  }),
  natureAnswer('dwarf', 3, 'craft', 'Craft wonders from silver and gold.', {
    natureDelta: 1,
  }),
  natureAnswer('dwarf', 3, 'spend', 'Prefer to spend gold.', {
    resourcesMinimum: 1,
  }),
  natureAnswer('elf', 1, 'sing', 'Sing the ancient songs of creation.', {
    natureDelta: 1,
  }),
  natureAnswer('elf', 1, 'enchant', 'Craft artifacts of unparalleled beauty.', {
    descriptorReplacement: ['Singing', 'Enchanting'],
  }),
  natureAnswer(
    'elf',
    2,
    'confront',
    'Confront evil when it stalks the world.',
    {
      classTraitLevel2: true,
    },
  ),
  natureAnswer('elf', 2, 'retreat', 'Retreat and let time defeat my enemies.', {
    natureDelta: 1,
  }),
  natureAnswer('elf', 3, 'west', 'Journey west beyond all knowledge.', {
    natureDelta: 1,
  }),
  ...['Fiery', 'Curious', 'Restless'].map((name) =>
    natureAnswer(
      'elf',
      3,
      `struggle-${slug(name)}`,
      `Live a life of struggle: replace my home Trait with ${name}.`,
      {
        replacementHomeTraitId: traitId(name),
      },
    ),
  ),
  natureAnswer('halfling', 1, 'feast', 'Make the most of every meal.', {
    natureDelta: 1,
  }),
  natureAnswer('halfling', 1, 'hoard', 'Tighten my belt and lock the doors.', {
    descriptorReplacement: ['Merrymaking', 'Hoarding'],
  }),
  natureAnswer(
    'halfling',
    2,
    'riddle',
    'Answer bullies with a clever riddle.',
    {
      natureDelta: 1,
    },
  ),
  natureAnswer(
    'halfling',
    2,
    'fight',
    'Roll up my sleeves and teach them a lesson.',
    {
      classTraitLevel2: true,
    },
  ),
  natureAnswer('halfling', 3, 'sneak', 'Sneak into a dragon’s lair.', {
    natureDelta: 1,
  }),
  natureAnswer(
    'halfling',
    3,
    'demand',
    'Announce my intentions and speak frankly.',
    {
      descriptorReplacement: ['Sneaking', 'Demanding'],
    },
  ),
  natureAnswer('human', 1, 'boast', 'Boast of my great deeds by the hearth.', {
    natureDelta: 1,
  }),
  natureAnswer('human', 1, 'prepare', 'Quietly prepare for dark times.', {
    classTraitLevel2: true,
  }),
  natureAnswer('human', 2, 'demand', 'Demand to be heard as an equal.', {
    natureDelta: 1,
  }),
  ...['Elf-wise', 'Dwarf-wise', 'Politics-wise'].map((name) =>
    natureAnswer(
      'human',
      2,
      `listen-${slug(name)}`,
      `Listen to my elders and take ${name}.`,
      {
        grantedWise: name,
      },
    ),
  ),
  natureAnswer('human', 3, 'flee', 'Flee and hide inside tall citadels.', {
    natureDelta: 1,
  }),
  ...['Loner', 'Foolhardy', 'Defender'].map((name) =>
    natureAnswer(
      'human',
      3,
      `glory-${slug(name)}`,
      `Quest for glory: replace my home Trait with ${name}.`,
      {
        replacementHomeTraitId: traitId(name),
      },
    ),
  ),
];

export interface TorchbearerStartingRelicResult {
  id: string;
  range: [number, number];
  relicNames: [string, string];
  invocationNames: [string, string];
  page: number;
}

export const torchbearerStartingRelicResults: TorchbearerStartingRelicResult[] =
  [
    {
      id: 'thunder',
      range: [3, 4],
      relicNames: ['Iron Shield', 'Consecrated Banner'],
      invocationNames: [
        'Sigrun’s Voice of Thunder',
        'Chant of the Lords of Valor',
      ],
      page: 42,
    },
    {
      id: 'battle',
      range: [5, 5],
      relicNames: ['Hero’s Mantle', 'Anointed Weapon'],
      invocationNames: ['Inspiring Aura', 'Evocation of the Lords of Battle'],
      page: 42,
    },
    {
      id: 'life-death',
      range: [6, 6],
      relicNames: ['Pearl of Mercy', 'Funerary Vestments'],
      invocationNames: ['Merciful Balm', 'Fury of the Lords of Life and Death'],
      page: 42,
    },
    {
      id: 'creation',
      range: [7, 7],
      relicNames: ['Oath Pearl', 'Ritual Chalice'],
      invocationNames: ['Merciful Balm', 'Blood Vow to the Lords of Creation'],
      page: 42,
    },
    {
      id: 'healing',
      range: [8, 8],
      relicNames: ['Bone Needles', 'Silver Skull'],
      invocationNames: ['Bone Knitter', 'Catholicon of the Lord of Plagues'],
      page: 42,
    },
    {
      id: 'labor',
      range: [9, 9],
      relicNames: ['Oxen Charm', 'Sacred Lancet'],
      invocationNames: [
        'Blessing of the Lord of Labor',
        'Balm of the Lords of Serenity',
      ],
      page: 42,
    },
    {
      id: 'hospitality',
      range: [10, 10],
      relicNames: ['Welcome Horn', 'Consecrated Perfume'],
      invocationNames: [
        'Benediction of the Lords of Creation',
        'Gift of Hospitality',
      ],
      page: 42,
    },
    {
      id: 'plenty',
      range: [11, 11],
      relicNames: ['Sea Salt', 'Harvest Sickle'],
      invocationNames: ['Shipwright’s Chant', 'Grace of the Lords of Plenty'],
      page: 42,
    },
    {
      id: 'fate-paths',
      range: [12, 12],
      relicNames: ['Bone Shuttlecock', 'Dowsing Rod'],
      invocationNames: ['Loom of the Disir', 'Spring of the Eternal'],
      page: 42,
    },
    {
      id: 'fire',
      range: [13, 13],
      relicNames: ['Sacred Coal', 'Cinder Gloves'],
      invocationNames: [
        'Breath of the Burning Lord',
        'Cloak of the Lords of Forges',
      ],
      page: 42,
    },
    {
      id: 'forge',
      range: [14, 14],
      relicNames: ['Forge Ruby', 'Burning Amulet'],
      invocationNames: ['Forge Rites', 'Supplication to the Burning Lord'],
      page: 42,
    },
    {
      id: 'law',
      range: [15, 15],
      relicNames: ['Orator’s Scepter', 'Iron Crown'],
      invocationNames: [
        'Sigtyr’s Arresting Speech',
        'Wrath of the Lords of Law',
      ],
      page: 42,
    },
    {
      id: 'vision',
      range: [16, 16],
      relicNames: ['Tally Sticks', 'All-Seeing Eye'],
      invocationNames: [
        'Wisdom of the Mother',
        'Vision of the Lords of Chaos and Law',
      ],
      page: 42,
    },
    {
      id: 'fate',
      range: [17, 18],
      relicNames: ['Silver Spindle', 'Guiding Disc'],
      invocationNames: [
        'Mudra of Fate',
        'Guidance of the Lord of Paths and Ways',
      ],
      page: 42,
    },
  ];

export const torchbearerRelics = Array.from(
  new Map(
    torchbearerStartingRelicResults.flatMap((result) =>
      result.relicNames.map((name, index) => {
        const definition = reference(
          'relic',
          name,
          'starting relic',
          result.page,
          `A first-level theurge relic associated with ${result.invocationNames[index]}. Record its inventory form and invocation on the character sheet.`,
          ['Theurge'],
        );
        return [definition.id, definition] as const;
      }),
    ),
  ).values(),
);

export interface TorchbearerLevelBenefitDefinition extends TorchbearerReferenceDefinition {
  classId: TorchbearerClassId;
  level: number;
}

type LevelBenefitRow = readonly [
  level: number,
  name: string,
  page: number,
  mechanics: string,
];

const levelBenefitRows: Record<TorchbearerClassId, LevelBenefitRow[]> = {
  burglar: [
    [
      1,
      'Burglar',
      113,
      'Core burglar weapon, armor, helmet, and shield permissions.',
    ],
    [
      2,
      'Soft Step',
      113,
      'Concealment in underbrush or scrub penalizes attempts to detect you.',
    ],
    [
      2,
      'Abstemious',
      113,
      'Trade hungry and thirsty for angry at a moment you choose.',
    ],
    [
      3,
      'Second Breakfast',
      113,
      'An extra ration protects against one future hungry and thirsty condition.',
    ],
    [
      3,
      'Mathom',
      113,
      'A sincere gift can clear one eligible condition once per giver.',
    ],
    [4, 'Plucky', 113, 'Use Hidden Depths beneficially while angry.'],
    [
      4,
      'Oft-Overlooked',
      113,
      'Halfling obscurity changes who captors and employers notice first.',
    ],
    [5, 'Vest Pockets', 114, 'Gain three torso slots limited to pack-1 items.'],
    [
      5,
      'Clever',
      114,
      'Add team disposition in riddle, flee, and sneak conflicts.',
    ],
    [
      6,
      'Companion',
      114,
      'A companion helps default class Skills and carries three slots.',
    ],
    [6, 'Helpful', 114, 'Help for a goal with +2D instead of +1D.'],
    [
      7,
      'It Could Be Worse',
      114,
      'Once per session, test as though free of conditions other than dead.',
    ],
    [
      7,
      'Shoulder the Burden',
      114,
      'Take a newly suffered condition from a friend.',
    ],
    [
      8,
      'Supreme Confidence',
      114,
      'Use level for disposition in riddling, sneaking, and fleeing conflicts.',
    ],
    [
      8,
      'Friend of the Powerful',
      114,
      'Charm a neutral or allied potentate into becoming a friend.',
    ],
    [9, 'Heroic Ability', 115, 'Make Will, Scout, or Cook heroic.'],
    [
      9,
      'Transformed',
      115,
      'Replace a Nature descriptor with Cooking, Eating, or Adventuring.',
    ],
    [
      10,
      'Stalwart',
      115,
      'Once per session, step into a failed test made by someone you helped.',
    ],
    [
      10,
      'Humble Home',
      115,
      'Gain a hometown home, Precedence, and improved hometown bonuses.',
    ],
  ],
  magician: [
    [
      1,
      'Magician',
      115,
      'Gain Memory Palace 1, three circle-one spells, and magician permissions.',
    ],
    [
      2,
      'Gifted',
      115,
      'Once per session, substitute Arcanist for another ability with added risk.',
    ],
    [
      2,
      'Needful Things',
      115,
      'Temporarily turn scraps into tools with an Arcanist test.',
    ],
    [
      3,
      'Sorcerer',
      116,
      'Add one Memory Palace spell slot; also receive a mentor scroll.',
    ],
    [
      3,
      'Bind Familiar',
      116,
      'Gain a growing animal familiar; also receive a mentor scroll.',
    ],
    [4, 'Mage Light', 116, 'Conjure a scaling magical light with Arcanist.'],
    [
      4,
      'Inhuman Endurance',
      117,
      'Ignore exhausted, injured, or sick for one turn each session.',
    ],
    [
      5,
      'Adept',
      117,
      'Add one Memory Palace spell slot; also receive a mentor scroll.',
    ],
    [
      5,
      'Apprentice',
      117,
      'Gain an apprentice helper with three inventory slots.',
    ],
    [
      6,
      'Magister',
      117,
      'Provide +2D when helping another magician in listed disciplines.',
    ],
    [
      6,
      'Unbridled Power',
      117,
      'Gain +1s with destructive spells but risk magical side effects.',
    ],
    [
      7,
      'Magus',
      117,
      'Add one Memory Palace spell slot; also receive a final mentor scroll.',
    ],
    [7, 'True Nature Unfolds', 117, 'Increase Might by one.'],
    [8, 'Master', 118, 'Raise one listed magical Skill cap to 7.'],
    [
      8,
      'Transformed',
      118,
      'Replace a Nature descriptor with Creating, Destroying, or Preserving.',
    ],
    [9, 'Wizard', 118, 'Add one Memory Palace spell slot.'],
    [9, 'Heroic Ability', 118, 'Make one listed magical Skill or Will heroic.'],
    [
      10,
      'Ageless',
      118,
      'Stop aging and gain protection from grind death and poison.',
    ],
    [10, 'The Lawbreaker', 118, 'Animate inanimate matter through Arcanist.'],
  ],
  outcast: [
    [
      1,
      'Outcast',
      119,
      'Core outcast permissions and a dungeon camp-event bonus.',
    ],
    [2, 'Hauberk', 119, 'Improve chain armor durability and coverage.'],
    [
      2,
      'Shrewd',
      119,
      'Haggle without lifestyle cost or Precedence restrictions.',
    ],
    [3, 'Hardy Stock', 119, 'Gain +1D against sickness, poison, and drugs.'],
    [
      3,
      'Miner',
      119,
      'Gain +1D to Delving Nature for underground hazards and structures.',
    ],
    [
      4,
      'Greed',
      120,
      'Turn anger and a treasure-related drive into a free pursuit test.',
    ],
    [
      4,
      'Stubborn',
      120,
      'Remain at 1 disposition while a teammate still stands.',
    ],
    [
      5,
      'Cousin',
      120,
      'Gain a cousin helper with default Skills and three slots.',
    ],
    [5, 'Tinker', 120, 'Reduce specified Peasant and Armorer factors.'],
    [
      6,
      'Great Endurance',
      120,
      'Ignore hungry disposition loss and most exhausted results.',
    ],
    [
      6,
      'Secret Destiny',
      121,
      'Find a destined weapon, hauberk, or priceless jewel.',
    ],
    [
      7,
      'Troll Slayer',
      121,
      'Increase Might by one against troll-type opponents.',
    ],
    [
      7,
      'War Captain',
      121,
      'Double the front-line hero Attack bonus in battles.',
    ],
    [8, 'Make Light of Heavy Burdens', 121, 'Raise the Health cap to 7.'],
    [
      8,
      'Strength',
      121,
      'Use level for disposition in kill, capture, and drive off.',
    ],
    [
      9,
      'Heroic Ability',
      121,
      'Make Fighter, Health, Orator, or Armorer heroic.',
    ],
    [
      9,
      'Transformed',
      121,
      'Replace a Nature descriptor with Hoarding, Boasting, or Ruling.',
    ],
    [10, 'Made of Sterner Stuff', 121, 'Increase Might by one.'],
    [10, 'The Madness Within', 121, 'Expand and intensify the Greed benefit.'],
  ],
  ranger: [
    [
      1,
      'Ranger',
      122,
      'Core ranger permissions and a wilderness camp-event bonus.',
    ],
    [
      2,
      'Born Under Silver Stars',
      122,
      'Gain +1D to Pathfinder, Navigator, and Sailor.',
    ],
    [2, 'Essence of the Earth', 122, 'Gain +1D to recover from exhaustion.'],
    [
      3,
      'Remember the Ancient Forms',
      122,
      'Use Remembering Nature to repair inherited crafts.',
    ],
    [
      3,
      'Song of Soothing',
      122,
      'Use Singing or Enchanting Nature with Healer factors.',
    ],
    [
      4,
      'Fearless',
      122,
      'Ignore assigned afraid, though the grind still applies it.',
    ],
    [
      4,
      'Athelas',
      122,
      'Attempt sickness recovery without check or lifestyle cost.',
    ],
    [
      5,
      'Burning Bright',
      122,
      'Once per session, use Nature to frighten bounded targets.',
    ],
    [
      5,
      'Master of Dreams',
      122,
      'Use Nature to put suitable nearby targets to sleep.',
    ],
    [
      6,
      'Prescience',
      123,
      'Once per phase, swap an unrevealed conflict action.',
    ],
    [
      6,
      'Grief',
      123,
      'Use level for grief conflicts and broaden Nature for grief-driven tests.',
    ],
    [7, 'Elven Steed', 123, 'Gain a summonable Nature 7 elven steed.'],
    [
      7,
      'Shrug It Off',
      123,
      'Remove injured once per adventure before treatment.',
    ],
    [
      8,
      'Sons and Daughters of Arda',
      124,
      'Increase Might, with another increase while using Grief.',
    ],
    [
      8,
      'Transformed',
      124,
      'Replace a Nature descriptor with Avenging, Perceiving, or Judging.',
    ],
    [
      9,
      'Heroic Ability',
      124,
      'Make Scout, Nature, Health, or Survivalist heroic.',
    ],
    [
      9,
      'Voice of Ages',
      124,
      'Question and petition spirits of natural features.',
    ],
    [
      10,
      'Maze of Mists and Shadows',
      124,
      'Ward a region with a persistent Nature-tested maze.',
    ],
    [
      10,
      'Dream Vision',
      125,
      'Use Will for distant sight, auras, truth, and dream interventions.',
    ],
  ],
  theurge: [
    [
      1,
      'Theurge',
      125,
      'Gain Urðr 1, two minor relics, and theurge permissions.',
    ],
    [2, 'Militant', 125, 'Add a weapon type and unlock helmets and armor.'],
    [
      2,
      'Vow to the Lords of Justice',
      125,
      'Once per phase, test Will to reveal a target truth.',
    ],
    [3, 'Acolyte', 125, 'Increase Urðr and receive a matching minor relic.'],
    [
      3,
      'Vow to the Lords of Healing and Fire',
      125,
      'Grant one free sickness or exhaustion recovery each camp or town.',
    ],
    [
      4,
      'Vow to the Lords of Light and Darkness',
      126,
      'Make a weapon shine with scaling holy light.',
    ],
    [
      4,
      'Feared in Hell',
      126,
      'Once per session, turn afraid into angry and terrify dark beings.',
    ],
    [5, 'Exorcist', 126, 'Increase Urðr and receive a matching minor relic.'],
    [
      5,
      'Immortal Incarnation',
      126,
      'Gain a powerful divine mount and companion.',
    ],
    [
      6,
      'Righteous Fury',
      127,
      'While angry, gain conflict successes and inspire afraid allies.',
    ],
    [
      6,
      'Increate',
      127,
      'Gain Precedence and event-roll modifiers tied to allied towns.',
    ],
    [
      7,
      'Grand Master',
      127,
      'Increase Urðr and receive a matching named relic.',
    ],
    [
      7,
      'Demonslayer',
      127,
      'Increase Might against spirits, demons, and undead.',
    ],
    [
      8,
      'Immortal Armor',
      127,
      'Absorb occult damage and penalize dark attackers.',
    ],
    [
      8,
      'Vow to the Lady of Battle',
      128,
      'Raise one listed combat or religious Skill cap to 7.',
    ],
    [
      9,
      'Heroic Ability',
      128,
      'Make Commander, Fighter, Ritualist, or Theologian heroic.',
    ],
    [
      9,
      'Transformed',
      128,
      'Replace a Nature descriptor with Questing, Judging, or Slaying.',
    ],
    [
      10,
      'Cult',
      128,
      'Found a temple and gain followers, Precedence, and cult Circles.',
    ],
    [
      10,
      'Holy Avenger',
      128,
      'Imbue a named weapon with combat, oratory, Might, and fear benefits.',
    ],
  ],
  warrior: [
    [
      1,
      'Warrior',
      129,
      'Core warrior permissions and free healthy camp watch.',
    ],
    [2, 'Brawler', 129, 'Fight unarmed without the standard penalty.'],
    [2, 'Skirmisher', 129, 'Roll an extra armor die while wearing leather.'],
    [
      3,
      'Cool Headed',
      129,
      'Ignore assigned angry, though the grind still applies it.',
    ],
    [3, 'Endurance', 129, 'Gain +1D to recover from injury.'],
    [
      4,
      'Stubborn',
      129,
      'Remain at 1 disposition while a teammate still stands.',
    ],
    [
      4,
      'Duelist',
      129,
      'Reassign sword action and gain off-hand defensive options.',
    ],
    [5, 'Squire', 130, 'Gain a squire helper with three inventory slots.'],
    [5, 'Agile', 130, 'Help in fights and battles with +2D.'],
    [
      6,
      'Shrug It Off',
      130,
      'Remove injured once per adventure before treatment.',
    ],
    [
      6,
      'War Captain',
      130,
      'Double the front-line hero Attack bonus in battles.',
    ],
    [7, 'Focus', 130, 'Gain +1s to one chosen action in martial conflicts.'],
    [7, 'Expert', 130, 'Raise two listed martial Skill caps to 7.'],
    [
      8,
      'Giant Slayer',
      130,
      'Increase Might by one while serving as conflict captain.',
    ],
    [
      8,
      'Veteran',
      130,
      'Use level for disposition in kill, capture, and drive off.',
    ],
    [
      9,
      'Heroic Ability',
      131,
      'Make Fighter, Health, Commander, or Survivalist heroic.',
    ],
    [
      9,
      'Transformed',
      131,
      'Replace a Nature descriptor with Fighting, Drinking, or Looting.',
    ],
    [
      10,
      'Presence',
      131,
      'Add +2 team disposition in kill, drive off, or battle.',
    ],
    [
      10,
      'Fame and Glory',
      131,
      'Gain Precedence, heroic retinue Circles, and an honor guard.',
    ],
  ],
};

export const torchbearerLevelBenefits: TorchbearerLevelBenefitDefinition[] =
  Object.entries(levelBenefitRows).flatMap(([classId, rows]) =>
    rows.map(([level, name, page, mechanics]) => ({
      ...reference('level-benefit', name, classId, page, mechanics, [
        `${classId} level ${level}`,
      ]),
      id: `tb2.core.level-benefit.${classId}-${level}-${slug(name)}`,
      classId: classId as TorchbearerClassId,
      level,
    })),
  );

export const torchbearerCoreCatalog: TorchbearerReferenceDefinition[] = [
  ...torchbearerClasses,
  ...torchbearerHomes,
  ...torchbearerSkills,
  ...torchbearerWises,
  ...torchbearerTraits,
  ...torchbearerGear,
  ...torchbearerWeapons,
  ...torchbearerOtherWeapons,
  ...torchbearerConflictArmor,
  ...torchbearerSpells,
  ...torchbearerInvocations,
  ...torchbearerRelics,
  ...torchbearerLevelBenefits,
];

export const torchbearerReferenceById = new Map(
  torchbearerCoreCatalog.map((entry) => [entry.id, entry]),
);

export function isTorchbearerDefinitionId(id: string) {
  return /^tb2\.[a-z0-9-]+\.[a-z0-9-]+\.[a-z0-9-]+$/.test(id);
}
