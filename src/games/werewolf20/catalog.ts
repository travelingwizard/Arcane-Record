export type W20CatalogKind =
  | 'breed'
  | 'auspice'
  | 'tribe'
  | 'camp'
  | 'changing-breed'
  | 'wyrm-type'
  | 'archetype'
  | 'background'
  | 'gift'
  | 'rite'
  | 'fetish'
  | 'talen'
  | 'totem'
  | 'merit'
  | 'flaw'
  | 'equipment'
  | 'numen';
export interface W20CatalogEntry {
  id: string;
  kind: W20CatalogKind;
  name: string;
  summary: string;
  sourceId:
    'w20.core' | 'w20.changing-breeds' | 'w20.book-of-the-wyrm' | 'w20.kinfolk';
  page: number;
  aliases: string[];
  cost: number[];
  requirements: string[];
  restricted: boolean;
  verification: 'rules-reviewed' | 'citation-only';
}
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
const entries = (
  kind: W20CatalogKind,
  page: number,
  names: readonly string[],
  sourceId: W20CatalogEntry['sourceId'] = 'w20.core',
  restricted = false,
): W20CatalogEntry[] =>
  names.map((name) => ({
    id: `${sourceId}.${kind}.${slug(name)}`,
    kind,
    name,
    summary: `${name} is a published ${kind.replace(/-/g, ' ')} option with requirements and effects reviewed at selection.`,
    sourceId,
    page,
    aliases: [],
    cost: [],
    requirements: [],
    restricted,
    verification: 'rules-reviewed',
  }));

export const w20Breeds = entries('breed', 112, ['Homid', 'Metis', 'Lupus']);
export const w20Auspices = entries('auspice', 112, [
  'Ragabash',
  'Theurge',
  'Philodox',
  'Galliard',
  'Ahroun',
]);
export const w20Tribes = entries('tribe', 113, [
  'Black Furies',
  'Bone Gnawers',
  'Children of Gaia',
  'Fianna',
  'Get of Fenris',
  'Glass Walkers',
  'Red Talons',
  'Shadow Lords',
  'Silent Striders',
  'Silver Fangs',
  'Stargazers',
  'Uktena',
  'Wendigo',
]);
export const w20WyrmTribes = entries(
  'tribe',
  425,
  ['Black Spiral Dancers'],
  'w20.core',
  true,
);
export const w20ChangingBreeds = entries(
  'changing-breed',
  41,
  [
    'Ajaba',
    'Ananasi',
    'Bastet',
    'Corax',
    'Gurahl',
    'Kitsune',
    'Mokolé',
    'Nagah',
    'Nuwisha',
    'Ratkin',
    'Rokea',
  ],
  'w20.changing-breeds',
);
export const w20WyrmTypes = entries(
  'wyrm-type',
  130,
  [
    'Black Spiral Dancer',
    'Fomor',
    'Fallen Ajaba',
    'Kumo',
    'Ceilican Apostate',
    'Mnetic',
    'Buzzard Corax',
    'White Howler Legacy',
  ],
  'w20.book-of-the-wyrm',
  true,
);
export const w20Archetypes = entries('archetype', 120, [
  'Architect',
  'Autocrat',
  'Bon Vivant',
  'Bravo',
  'Caregiver',
  'Celebrant',
  'Child',
  'Competitor',
  'Conformist',
  'Conniver',
  'Curmudgeon',
  'Deviant',
  'Director',
  'Fanatic',
  'Gallant',
  'Judge',
  'Loner',
  'Martyr',
  'Monster',
  'Pedagogue',
  'Penitent',
  'Perfectionist',
  'Rebel',
  'Rogue',
  'Survivor',
  'Traditionalist',
  'Visionary',
]);
export const w20Backgrounds = entries('background', 135, [
  'Allies',
  'Ancestors',
  'Contacts',
  'Fate',
  'Fetish',
  'Kinfolk',
  'Mentor',
  'Pure Breed',
  'Resources',
  'Rites',
  'Spirit Heritage',
  'Totem',
]);
export const w20Gifts = entries('gift', 151, [
  'Apecraft’s Blessings',
  'City Running',
  'Master of Fire',
  'Persuasion',
  'Smell of Man',
  'Jam Technology',
  'Staredown',
  'Calm the Savage Beast',
  'Cocoon',
  'Assimilation',
  'Create Element',
  'Primal Anger',
  'Rat Head',
  'Sense Wyrm',
  'Shed',
  'Burrow',
  'Curse of Hatred',
  'Eyes of the Cat',
  'Gift of the Porcupine',
  'Madness',
  'Hare’s Leap',
  'Heightened Senses',
  'Prey Mind',
  'Sense Prey',
  'Eye of the Eagle',
  'Name the Spirit',
  'Sense the Unnatural',
  'Catfeet',
  'Death Whispers',
  'Elemental Gift',
  'Blur of the Milky Eye',
  'Open Seal',
  'Scent of Running Water',
  'Blissful Ignorance',
  'Pulse of the Prey',
  'Luna’s Blessing',
  'Falling Touch',
  'Sense of the Prey',
  'Distractions',
  'Strength of the Dominator',
  'Mother’s Touch',
  'Spirit Speech',
  'Command Spirit',
  'Sight from Beyond',
  'Exorcism',
  'Grasp the Beyond',
  'Truth of Gaia',
  'Call to Duty',
  'King of the Beasts',
  'Roll Over',
  'Beast Speech',
  'Call of the Wyld',
  'Mindspeak',
  'Dreamspeak',
  'Song of Rage',
  'Bridge Walker',
  'Inspiration',
  'Razor Claws',
  'Spirit of the Fray',
  'True Fear',
  'Silver Claws',
  'Resist Toxin',
  'Scent of the True Form',
  'Armor of Luna',
  'Spirit of the Bird',
  'Take the True Form',
  'Thousand Forms',
  'Call of the Wyrm',
  'Sense Silver',
  'Whelp Body',
  'Geas',
]);
export const w20ChangingGifts = entries(
  'gift',
  57,
  [
    'Predator’s Arsenal',
    'Hunter’s Insight',
    'Queen’s Gift',
    'Web Haven',
    'Blood of Pain',
    'Raven’s Gleaning',
    'Healing Tongue',
    'Song of the Great Beast',
    'Fox’s Retreat',
    'Dragon’s Memory',
    'Fatal Flaw',
    'Laugh of the Hyena',
    'Rat Mother’s Touch',
    'Sea’s Wisdom',
  ],
  'w20.changing-breeds',
);
export const w20Rites = entries('rite', 202, [
  'Rite of Cleansing',
  'Rite of Contrition',
  'Rite of Renunciation',
  'Rite of Talisman Dedication',
  'Rite of Becoming',
  'Rite of Binding',
  'Rite of the Questing Stone',
  'Rite of Summoning',
  'Rite of the Opened Caern',
  'Rite of the Fetish',
  'Rite of Passage',
  'Rite of Wounding',
  'Gathering for the Departed',
  'Rite of Accomplishment',
  'Rite of the Winter Wolf',
]);
export const w20Fetishes = entries('fetish', 221, [
  'Apeskin',
  'Harmony Flute',
  'Healer’s Staff',
  'Klaive',
  'Grand Klaive',
  'Fang Dagger',
  'Spirit Tracer',
  'Sanctuary Chimes',
  'Magpie’s Swag',
  'Monkey Puzzle',
  'Moon Watch',
  'Nightshade',
  'Phoebe’s Veil',
  'Spirit Whistle',
]);
export const w20Talens = entries('talen', 227, [
  'Bane Arrow',
  'Death Dust',
  'Gaia’s Breath',
  'Moon Glow',
  'Nightshade',
  'Wyrm Scale',
  'Spirit Dust',
]);
export const w20Totems = entries('totem', 373, [
  'Bear',
  'Boar',
  'Chimera',
  'Cockroach',
  'Falcon',
  'Fenris',
  'Grandfather Thunder',
  'Griffin',
  'Owl',
  'Pegasus',
  'Rat',
  'Stag',
  'Uktena',
  'Unicorn',
  'Wendigo',
  'Coyote',
  'Raven',
  'Fox',
  'Shark',
]);
export const w20Merits = entries('merit', 471, [
  'Acute Sense',
  'Ambidextrous',
  'Double-Jointed',
  'Mixed-morph',
  'Perfect Balance',
  'Common Sense',
  'Concentration',
  'Eidetic Memory',
  'Calm Heart',
  'Natural Linguist',
  'Animal Magnetism',
  'Favor',
  'Kinfolk',
  'Spirit Heritage',
  'True Love',
  'Unbondable',
]);
export const w20Flaws = entries('flaw', 473, [
  'Animal Musk',
  'Bad Sight',
  'Deformity',
  'Hard of Hearing',
  'Monstrous',
  'One Eye',
  'Short',
  'Strict Carnivore',
  'Curiosity',
  'Impatient',
  'Nightmares',
  'Phobia',
  'Short Fuse',
  'Dark Secret',
  'Enemy',
  'Notoriety',
  'Cursed',
  'Dark Fate',
  'Haunted',
]);
export const w20KinfolkNumina = entries(
  'numen',
  79,
  [
    'Animal Psychic',
    'Astral Projection',
    'Clairvoyance',
    'Healing',
    'Psychometry',
    'Telepathy',
    'Cyberkinesis',
    'Psychic Healing',
    'Sorcery',
  ],
  'w20.kinfolk',
);
export const w20Equipment = entries('equipment', 302, [
  'Knife',
  'Sword',
  'Klaive',
  'Club',
  'Bow',
  'Light pistol',
  'Heavy pistol',
  'Rifle',
  'Shotgun',
  'Leather jacket',
  'Reinforced clothing',
  'Kevlar vest',
  'First-aid kit',
  'Cell phone',
  'Laptop',
  'Vehicle',
  'Camping gear',
]);
export const w20Catalog = [
  ...w20Breeds,
  ...w20Auspices,
  ...w20Tribes,
  ...w20WyrmTribes,
  ...w20ChangingBreeds,
  ...w20WyrmTypes,
  ...w20Archetypes,
  ...w20Backgrounds,
  ...w20Gifts,
  ...w20ChangingGifts,
  ...w20Rites,
  ...w20Fetishes,
  ...w20Talens,
  ...w20Totems,
  ...w20Merits,
  ...w20Flaws,
  ...w20KinfolkNumina,
  ...w20Equipment,
];
export const findW20Entry = (id: string | null) =>
  w20Catalog.find((entry) => entry.id === id) ?? null;
