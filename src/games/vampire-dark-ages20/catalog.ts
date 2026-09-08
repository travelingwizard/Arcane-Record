export type Dav20CatalogKind =
  | 'lineage'
  | 'road'
  | 'archetype'
  | 'background'
  | 'discipline'
  | 'merit'
  | 'flaw'
  | 'equipment';

export interface Dav20CatalogEntry {
  id: string;
  kind: Dav20CatalogKind;
  name: string;
  summary: string;
  sourceId: 'dav20.core';
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
  kind: Dav20CatalogKind,
  page: number,
  names: readonly string[],
  summary: (name: string) => string,
  options: Partial<
    Pick<Dav20CatalogEntry, 'cost' | 'restricted' | 'verification'>
  > = {},
): Dav20CatalogEntry[] =>
  names.map((name) => ({
    id: `dav20.${kind}.${slug(name)}`,
    kind,
    name,
    summary: summary(name),
    sourceId: 'dav20.core',
    page,
    aliases: [],
    cost: options.cost ?? [],
    requirements: [],
    restricted: options.restricted ?? false,
    verification: options.verification ?? 'rules-reviewed',
  }));

export const dav20Clans = entries(
  'lineage',
  40,
  [
    'Assamite',
    'Brujah',
    'Cappadocian',
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
    `${name} defines inherited Disciplines, weakness, social context, and lineage expectations in the Dark Medieval world.`,
);

export const dav20Bloodlines = entries(
  'lineage',
  68,
  [
    'Ahrimane',
    'Anda',
    'Baali',
    'Bonsam',
    'Child of Osiris',
    'Danava',
    'Gargoyle',
    'Giovani',
    'Impundulu',
    'Kiasyd',
    'Lamia',
    'Lhiannan',
    'Nagaraja',
    'Niktuku',
    'Ramanga',
    'Salubri Healer',
    'Salubri Warrior',
    'Salubri Watcher',
    'True Brujah',
  ],
  (name) =>
    `${name} is a published bloodline with distinct Disciplines, weakness, and cultural requirements.`,
);
dav20Bloodlines.find(({ name }) => name === 'Baali')!.restricted = true;

export const dav20Roads = entries(
  'road',
  110,
  [
    'Road of the Beast',
    'Path of the Hunter',
    'Path of Journeys',
    'Path of Liberation',
    'Road of Heaven',
    'Road of Humanity',
    'Path of Breath',
    'Path of Community',
    'Path of Illumination',
    'Road of Kings',
    'Road of Lilith',
    'Path of Thorns',
    'Path of Veils',
    'Path of Making',
    'Road of Metamorphosis',
    'Road of Sin',
    'Path of Pleasure',
    'Path of the Devil',
    'Path of Screams',
    'Road of Bones',
    'Road of Yasa',
    'Road of Blood',
    'Road of the Abyss',
    'Road of Paradox',
    'Code of Samiel',
    'Road of Set',
  ],
  (name) =>
    `${name} supplies ethics, sins, Aura, and the pair of Virtues used to calculate the character's Road rating.`,
);
for (const road of dav20Roads.filter(({ name }) =>
  ['Path of the Devil', 'Path of Screams'].includes(name),
))
  road.restricted = true;

export const dav20Archetypes = entries(
  'archetype',
  175,
  [
    'Architect',
    'Autocrat',
    'Bon Vivant',
    'Bravo',
    'Caregiver',
    'Celebrant',
    'Chameleon',
    'Child',
    'Competitor',
    'Conformist',
    'Conniver',
    'Creep Show',
    'Curmudgeon',
    'Dabbler',
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
    'Mercenary',
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

export const dav20Backgrounds = entries(
  'background',
  179,
  [
    'Allies',
    'Alternate Identity',
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

export const dav20Disciplines = entries(
  'discipline',
  188,
  [
    'Abombwe',
    'Animalism',
    'Auspex',
    'Bardo',
    'Celerity',
    'Chimerstry',
    'Daimonion',
    'Dementation',
    'Dominate',
    'Flight',
    'Fortitude',
    'Mytherceria',
    'Obfuscate',
    'Obtenebration',
    'Ogham',
    'Potence',
    'Presence',
    'Protean',
    'Quietus Cruscitus',
    'Quietus Hematus',
    'Serpentis',
    'Spiritus',
    'Temporis',
    'Valeren Healer',
    'Valeren Warrior',
    'Valeren Watcher',
    'Vicissitude',
    'Abyss Mysticism',
    'Koldunic Sorcery',
    'Necromancy',
    'Thaumaturgy',
  ],
  (name) =>
    `${name} is a supernatural Discipline or sorcerous practice. Individual levels remain gated by lineage and prerequisites.`,
);
for (const discipline of dav20Disciplines.filter(
  ({ name }) => name === 'Daimonion',
))
  discipline.restricted = true;

export const dav20Merits = [
  ...entries(
    'merit',
    420,
    [
      'Ambidextrous',
      'Deceptive Eating',
      'Blush of Health',
      'Without a Trace',
      'Efficient Digestion',
      'Sturdy',
    ],
    (name) => `${name} is a Physical Merit purchased with creation freebies.`,
    { cost: [1, 2, 3, 4] },
  ),
  ...entries(
    'merit',
    422,
    [
      'Celestial Attunement',
      'Common Sense',
      'Literacy',
      'Eidetic Memory',
      'Light Sleeper',
      'Multi-Lingual',
    ],
    (name) => `${name} is a Mental Merit purchased with creation freebies.`,
    { cost: [1, 2] },
  ),
  ...entries(
    'merit',
    423,
    [
      'Company of Saints and Heroes',
      'Prestigious Sire',
      'Debt of Gratitude',
      'Lingua Franca',
      'Patron',
    ],
    (name) => `${name} is a Social Merit purchased with creation freebies.`,
    { cost: [1, 3, 5] },
  ),
  ...entries(
    'merit',
    425,
    [
      'Darksight',
      'Inoffensive to Animals',
      'Lucky',
      'Clan Apostate',
      'Medium',
      'Oracular Ability',
      'Spirit Mentor',
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
dav20Merits.find(({ name }) => name === 'Clan Apostate')!.restricted = true;

export const dav20Flaws = [
  ...entries(
    'flaw',
    421,
    [
      'Odd Gait',
      'Ragged Bite',
      'Unclean',
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
    422,
    [
      'Deep Sleeper',
      'Nightmares',
      'Prey Exclusion',
      'Amnesia',
      'Vengeful',
      'Flesh Eater',
      'Ethical Prohibition',
    ],
    (name) =>
      `${name} is a Mental Flaw; no more than seven Flaw points provide creation credit.`,
    { cost: [1, 2, 4] },
  ),
  ...entries(
    'flaw',
    423,
    [
      'Dark Secret',
      'Infamous Sire',
      'Mistaken Identity',
      'Outsider',
      "Sire's Resentment",
      'Enemy',
      'Hunted',
      'Nameless',
    ],
    (name) =>
      `${name} is a Social Flaw whose recurring consequence belongs in the chronicle.`,
    { cost: [1, 2, 3, 4, 5] },
  ),
  ...entries(
    'flaw',
    426,
    [
      'Cast No Reflection',
      'Initiate of the Road',
      'Repulsed by Garlic',
      'Touch of Frost',
      'Cursed',
      'Demon-Hounded',
      'Unlucky',
      'Thirteenth Generation',
      'Cannot Embrace',
      'Eerie Presence',
      'Repulsive to Animals',
      'Permanent Third Eye',
      'Animate Shadow',
      'Cloaked in Shadow',
      'Haunted',
      "Can't Cross Running Water",
      'Grip of the Damned',
      'Dark Fate',
      'Harbinger of the Abyss',
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
for (const flaw of dav20Flaws.filter(({ name }) => name === 'Demon-Hounded'))
  flaw.restricted = true;

export const dav20Equipment = entries(
  'equipment',
  345,
  [
    'Dagger',
    'Sword',
    'Great sword',
    'Axe',
    'Mace',
    'Spear',
    'Staff',
    'Bow',
    'Crossbow',
    'Sling',
    'Leather armor',
    'Reinforced leather',
    'Chain mail',
    'Plate armor',
    'Shield',
    'Horse',
    'Pack animal',
    'Travel supplies',
    'Artisan tools',
    'Writing kit',
  ],
  (name) =>
    `${name} is a character-facing weapon, armor, mount, or carried possession suitable for the Dark Medieval setting.`,
);

export const dav20Catalog = [
  ...dav20Clans,
  ...dav20Bloodlines,
  ...dav20Roads,
  ...dav20Archetypes,
  ...dav20Backgrounds,
  ...dav20Disciplines,
  ...dav20Merits,
  ...dav20Flaws,
  ...dav20Equipment,
] as const;

export const findDav20Entry = (id: string | null) =>
  dav20Catalog.find((entry) => entry.id === id) ?? null;
