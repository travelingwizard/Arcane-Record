export type V20CatalogKind =
  | 'lineage'
  | 'road'
  | 'archetype'
  | 'background'
  | 'discipline'
  | 'merit'
  | 'flaw'
  | 'equipment'
  | 'revenant-family'
  | 'organization'
  | 'title';

export interface V20CatalogEntry {
  id: string;
  kind: V20CatalogKind;
  name: string;
  summary: string;
  sourceId: 'v20.core' | 'v20.companion' | 'v20.ghouls-revenants';
  page: number;
  aliases: string[];
  cost: number[];
  requirements: string[];
  restricted: boolean;
  verification: 'rules-reviewed' | 'citation-only';
}

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
const entries = (
  kind: V20CatalogKind,
  page: number,
  names: readonly string[],
  summary: (name: string) => string,
  options: Partial<
    Pick<V20CatalogEntry, 'cost' | 'restricted' | 'verification' | 'sourceId'>
  > = {},
): V20CatalogEntry[] =>
  names.map((name) => ({
    id: `${options.sourceId === 'v20.core' || !options.sourceId ? 'v20' : options.sourceId}.${kind}.${slug(name)}`,
    kind,
    name,
    summary: summary(name),
    sourceId: options.sourceId ?? 'v20.core',
    page,
    aliases: [],
    cost: options.cost ?? [],
    requirements: [],
    restricted: options.restricted ?? false,
    verification: options.verification ?? 'rules-reviewed',
  }));

export const v20Clans = entries(
  'lineage',
  40,
  [
    'Assamite',
    'Brujah',
    'Giovanni',
    'Gangrel',
    'Lasombra',
    'Malkavian',
    'Nosferatu',
    'Ravnos',
    'Follower of Set',
    'Toreador',
    'Tremere',
    'Tzimisce',
    'Ventrue',
    'Caitiff',
  ],
  (name) =>
    `${name} defines inherited Disciplines, weakness, social context, and lineage expectations in the modern World of Darkness world.`,
);

export const v20Bloodlines = entries(
  'lineage',
  388,
  [
    'Assamite Antitribu',
    'Baali',
    'Blood Brothers',
    'Daughters of Cacophony',
    'Gargoyle',
    'Harbingers of Skulls',
    'Kiasyd',
    'Nagaraja',
    'Old Clan Tzimisce',
    'Salubri',
    'Samedi',
    'True Brujah',
  ],
  (name) =>
    `${name} is a published bloodline with distinct Disciplines, weakness, and cultural requirements.`,
);
v20Bloodlines.find(({ name }) => name === 'Baali')!.restricted = true;

export const v20Roads = entries(
  'road',
  309,
  [
    'Humanity',
    'Path of Blood',
    'Path of Bones',
    'Path of Caine',
    'Path of Cathari',
    'Path of Death and the Soul',
    'Path of Entelechy',
    'Path of Honorable Accord',
    'Path of Lilith',
    'Path of Metamorphosis',
    'Path of Night',
    'Path of Paradox',
    'Path of Power and the Inner Voice',
    'Path of Typhon',
  ],
  (name) =>
    `${name} supplies ethics, sins, Aura, and the pair of Virtues used to calculate the character's Road rating.`,
);
for (const road of v20Roads.filter(({ name }) => name !== 'Humanity'))
  road.restricted = true;

export const v20Archetypes = entries(
  'archetype',
  87,
  [
    'Architect',
    'Autocrat',
    'Bon Vivant',
    'Bravo',
    'Caregiver',
    'Celebrant',
    'Chameleon',
    'Capitalist',
    'Competitor',
    'Conformist',
    'Conniver',
    'Curmudgeon',
    'Defender',
    'Deviant',
    'Enigma',
    'Eye of the Storm',
    'Fanatic',
    'Gallant',
    'Guru',
    'Idealist',
    'Jester',
    'Judge',
    'Loner',
    'Martyr',
    'Masochist',
    'Monster',
    'Pedagogue',
    'Penitent',
    'Perfectionist',
    'Philosopher',
    'Rebel',
    'Rogue',
    'Sadist',
    'Soldier',
    'Survivor',
    'Thrill Seeker',
    'Traditionalist',
    'Tyrant',
    'Visionary',
  ],
  (name) =>
    `${name} is usable as Nature or Demeanor; satisfying Nature can restore Willpower.`,
);

export const v20Backgrounds = entries(
  'background',
  110,
  [
    'Allies',
    'Alternate Identity',
    'Black Hand Membership',
    'Contacts',
    'Domain',
    'Fame',
    'Generation',
    'Herd',
    'Influence',
    'Mentor',
    'Resources',
    'Retainers',
    'Status',
  ],
  (name) =>
    `${name} represents an external advantage. Some Backgrounds may be pooled by a coterie and normally change through the story.`,
  { cost: [1, 2, 3, 4, 5] },
);

export const v20Disciplines = entries(
  'discipline',
  127,
  [
    'Animalism',
    'Auspex',
    'Celerity',
    'Chimerstry',
    'Daimonion',
    'Dementation',
    'Dominate',
    'Fortitude',
    'Obfuscate',
    'Obtenebration',
    'Potence',
    'Presence',
    'Protean',
    'Quietus',
    'Serpentis',
    'Temporis',
    'Valeren',
    'Vicissitude',
    'Necromancy',
    'Thaumaturgy',
  ],
  (name) =>
    `${name} is a supernatural Discipline or sorcerous practice. Individual levels remain gated by lineage and prerequisites.`,
);
for (const discipline of v20Disciplines.filter(
  ({ name }) => name === 'Daimonion',
))
  discipline.restricted = true;

export const v20Merits = [
  ...entries(
    'merit',
    479,
    ['Ambidextrous', 'Blush of Health', 'Efficient Digestion', 'Eat Food'],
    (name) => `${name} is a Physical Merit purchased with creation freebies.`,
    { cost: [1, 2, 3, 4] },
  ),
  ...entries(
    'merit',
    480,
    ['Common Sense', 'Eidetic Memory', 'Light Sleeper', 'Calm Heart'],
    (name) => `${name} is a Mental Merit purchased with creation freebies.`,
    { cost: [1, 2] },
  ),
  ...entries(
    'merit',
    481,
    ['Prestigious Sire', 'Debt of Gratitude', 'Natural Leader'],
    (name) => `${name} is a Social Merit purchased with creation freebies.`,
    { cost: [1, 3, 5] },
  ),
  ...entries(
    'merit',
    482,
    [
      'Inoffensive to Animals',
      'Lucky',
      'Medium',
      'Oracular Ability',
      'Unbondable',
      'True Love',
      'Nine Lives',
      'Weak Aura',
      'Potent Aura',
    ],
    (name) =>
      `${name} is a Supernatural Merit whose story impact should be reviewed before selection.`,
    { cost: [1, 2, 3, 4, 5, 6] },
  ),
];

export const v20Flaws = [
  ...entries(
    'flaw',
    479,
    [
      'Short',
      'Addiction',
      'Monstrous',
      'Permanent Wound',
      'Slow Healing',
      'Child',
      'Impaired Sense',
      'Mute',
      'Flesh of the Corpse',
    ],
    (name) =>
      `${name} is a Physical Flaw; no more than seven Flaw points provide creation credit.`,
    { cost: [1, 2, 3, 4, 5] },
  ),
  ...entries(
    'flaw',
    480,
    [
      'Deep Sleeper',
      'Nightmares',
      'Prey Exclusion',
      'Amnesia',
      'Vengeful',
      'Soft-Hearted',
    ],
    (name) =>
      `${name} is a Mental Flaw; no more than seven Flaw points provide creation credit.`,
    { cost: [1, 2, 4] },
  ),
  ...entries(
    'flaw',
    481,
    [
      'Dark Secret',
      'Infamous Sire',
      'Mistaken Identity',
      "Sire's Resentment",
      'Enemy',
      'Hunted',
      'Probationary Sect Member',
    ],
    (name) =>
      `${name} is a Social Flaw whose recurring consequence belongs in the chronicle.`,
    { cost: [1, 2, 3, 4, 5] },
  ),
  ...entries(
    'flaw',
    483,
    [
      'Cast No Reflection',
      'Repulsed by Garlic',
      'Touch of Frost',
      'Cursed',
      'Beacon of the Unholy',
      'Unlucky',
      'Fourteenth Generation',
      'Cannot Embrace',
      'Eerie Presence',
      'Repulsive to Animals',
      'Haunted',
      "Can't Cross Running Water",
      'Grip of the Damned',
      'Dark Fate',
      'Light-Sensitive',
      'Weak Blood',
      'Weak Aura',
      'Potent Aura',
    ],
    (name) =>
      `${name} is a Supernatural Flaw; verify requirements and chronicle impact with the Storyteller.`,
    { cost: [1, 2, 3, 4, 5] },
  ),
];
for (const flaw of v20Flaws.filter(
  ({ name }) => name === 'Beacon of the Unholy',
))
  flaw.restricted = true;

export const v20Equipment = entries(
  'equipment',
  280,
  [
    'Dagger',
    'Stake',
    'Sword',
    'Baseball bat',
    'Light pistol',
    'Heavy pistol',
    'Rifle',
    'Shotgun',
    'Submachine gun',
    'Leather jacket',
    'Reinforced clothing',
    'Kevlar vest',
    'Tactical armor',
    'Cell phone',
    'Laptop',
    'Vehicle',
    'Medical kit',
  ],
  (name) =>
    `${name} is a character-facing weapon, armor, mount, or carried possession suitable for the modern World of Darkness setting.`,
);

export const v20RevenantFamilies = entries(
  'revenant-family',
  86,
  [
    'Bratovich',
    "D'Habi",
    'Ducheski',
    'Enrathi',
    'Grimaldi',
    'Kairouan Brotherhood',
    'Marijava',
    'Obertus',
    'Oprichniki',
    'Rafastio',
    'Rossellini',
    'Servants of Anushin-Rawan',
    'Zantosa',
  ],
  (name) =>
    `${name} supplies a revenant family affinity, weakness, and social context.`,
  { sourceId: 'v20.ghouls-revenants' },
);

export const v20Organizations = entries(
  'organization',
  80,
  [
    'Arcane Historical Society',
    'Disciples of Set',
    'Sacrament of Caine',
    'The Sanguinaries',
    'Talons of the Black Rage',
    'The Unmastered',
  ],
  (name) =>
    `${name} is a ghoul organization that can shape contacts, duties, and access.`,
  { sourceId: 'v20.ghouls-revenants' },
);

export const v20Titles = entries(
  'title',
  14,
  [
    'Prince',
    'Seneschal',
    'Primogen',
    'Sheriff',
    'Keeper of Elysium',
    'Harpy',
    'Scourge',
    'Archbishop',
    'Bishop',
    'Ductus',
    'Pack Priest',
  ],
  (name) =>
    `${name} is a formal Kindred title with local responsibilities and standing.`,
  { sourceId: 'v20.companion' },
);

export const v20Catalog = [
  ...v20Clans,
  ...v20Bloodlines,
  ...v20Roads,
  ...v20Archetypes,
  ...v20Backgrounds,
  ...v20Disciplines,
  ...v20Merits,
  ...v20Flaws,
  ...v20Equipment,
  ...v20RevenantFamilies,
  ...v20Organizations,
  ...v20Titles,
] as const;

export const findV20Entry = (id: string | null) =>
  v20Catalog.find((entry) => entry.id === id) ?? null;
