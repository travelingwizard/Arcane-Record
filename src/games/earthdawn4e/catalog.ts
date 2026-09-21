export type EarthdawnCatalogKind =
  | 'race'
  | 'discipline'
  | 'talent'
  | 'skill'
  | 'knack'
  | 'spell'
  | 'equipment'
  | 'weapon'
  | 'thread-item'
  | 'path'
  | 'devotion'
  | 'ability';

export interface EarthdawnSource {
  id: string;
  title: string;
  shortTitle: string;
  required: boolean;
}
export interface EarthdawnDefinition {
  id: string;
  kind: EarthdawnCatalogKind;
  name: string;
  summary: string;
  mechanics: string;
  requirements: string[];
  aliases: string[];
  sourceId: string;
  source: string;
  page: number;
  verification: 'verified' | 'reference-only' | 'unresolved';
  costSilver?: number;
}
export interface EarthdawnRace extends EarthdawnDefinition {
  attributes: Record<EarthdawnAttributeId, number>;
  movement: string;
  karmaModifier: number;
  abilities: string[];
}
export interface EarthdawnDiscipline extends EarthdawnDefinition {
  importantAttributes: EarthdawnAttributeId[];
  durability: number;
  noviceTalents: string[];
  optionalTalents: string[];
  spellcaster: boolean;
  circles: import('./discipline-progressions').DisciplineCircle[];
  talentOptions: Record<
    'novice' | 'journeyman' | 'warden' | 'master',
    string[]
  >;
}
export type EarthdawnAttributeId =
  | 'dexterity'
  | 'strength'
  | 'toughness'
  | 'perception'
  | 'willpower'
  | 'charisma';

export const earthdawnSources: EarthdawnSource[] = [
  {
    id: 'ed4.players-guide',
    title: 'Earthdawn Fourth Edition Player’s Guide',
    shortTitle: 'Player’s Guide',
    required: true,
  },
  {
    id: 'ed4.gamemasters-guide',
    title: 'Earthdawn Fourth Edition Gamemaster’s Guide',
    shortTitle: 'GM Guide',
    required: false,
  },
  {
    id: 'ed4.companion',
    title: 'Earthdawn Fourth Edition Companion',
    shortTitle: 'Companion',
    required: false,
  },
  {
    id: 'ed4.travar',
    title: 'Travar: The Merchant City',
    shortTitle: 'Travar',
    required: false,
  },
  {
    id: 'ed4.questors',
    title: 'Questors',
    shortTitle: 'Questors',
    required: false,
  },
  {
    id: 'ed4.deeper-secrets',
    title: 'Deeper Secrets',
    shortTitle: 'Deeper Secrets',
    required: false,
  },
  { id: 'ed4.iopos', title: 'Iopos', shortTitle: 'Iopos', required: false },
  {
    id: 'ed4.vasgothia',
    title: 'Vasgothia',
    shortTitle: 'Vasgothia',
    required: false,
  },
  {
    id: 'ed4.mystic-paths',
    title: 'The Adept’s Journey: Mystic Paths',
    shortTitle: 'Mystic Paths',
    required: false,
  },
  {
    id: 'ed4.elven-nations',
    title: 'Elven Nations',
    shortTitle: 'Elven Nations',
    required: false,
  },
];
const slug = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
const entry = (
  kind: EarthdawnCatalogKind,
  name: string,
  sourceId: string,
  page: number,
  summary: string,
  requirements: string[] = [],
): EarthdawnDefinition => ({
  id: `${sourceId}.${kind}.${slug(name)}`,
  kind,
  name,
  summary,
  mechanics: summary,
  requirements,
  aliases: [],
  sourceId,
  source: earthdawnSources.find(({ id }) => id === sourceId)!.title,
  page,
  verification: 'verified',
});

import {
  coreDisciplineProgressions,
  coreTalentOptions,
} from './discipline-progressions';

const raceData: Array<[string, number[], string, number, string[]]> = [
  ['Dwarf', [9, 10, 12, 11, 11, 10], '10', 4, ['Heat Sight']],
  ['Elf', [12, 10, 8, 11, 11, 11], '14', 4, ['Low-Light Vision']],
  ['Human', [10, 10, 10, 10, 10, 10], '12', 5, ['Versatility']],
  [
    'Obsidiman',
    [8, 18, 13, 9, 10, 9],
    '10',
    3,
    ['Increased Wound Threshold', 'Natural Armor'],
  ],
  ['Ork', [10, 13, 11, 10, 8, 9], '12', 5, ['Gahad', 'Low-Light Vision']],
  ['Troll', [10, 14, 12, 9, 11, 10], '14', 3, ['Heat Sight']],
  ['T’skrang', [11, 10, 11, 10, 10, 11], '12', 4, ['Tail Combat']],
  [
    'Windling',
    [11, 4, 8, 11, 10, 12],
    '6 / 16 flying',
    6,
    ['Astral Sight', 'Flight', 'Increased Physical Defense'],
  ],
];
const attrs: EarthdawnAttributeId[] = [
  'dexterity',
  'strength',
  'toughness',
  'perception',
  'willpower',
  'charisma',
];
export const earthdawnRaces: EarthdawnRace[] = raceData.map(
  ([name, values, movement, karmaModifier, abilities], index) => ({
    ...entry(
      'race',
      name,
      'ed4.players-guide',
      43 + index * 2,
      `${name} starting attributes, movement, Karma modifier, and racial abilities.`,
    ),
    attributes: Object.fromEntries(
      attrs.map((id, i) => [id, values[i]]),
    ) as Record<EarthdawnAttributeId, number>,
    movement,
    karmaModifier,
    abilities,
  }),
);

const disciplineRows: Array<
  [string, number, EarthdawnAttributeId[], boolean, string[]]
> = [
  [
    'Air Sailor',
    88,
    ['dexterity', 'willpower', 'charisma'],
    false,
    ['Air Sailing', 'Avoid Blow', 'Climbing', 'Melee Weapons', 'Wind Catcher'],
  ],
  [
    'Archer',
    90,
    ['dexterity', 'perception'],
    false,
    ['Awareness', 'Missile Weapons', 'Mystic Aim', 'Navigation', 'True Shot'],
  ],
  [
    'Beastmaster',
    92,
    ['willpower', 'charisma'],
    false,
    [
      'Animal Bond',
      'Animal Training',
      'Claw Shape',
      'Creature Analysis',
      'Unarmed Combat',
    ],
  ],
  [
    'Cavalryman',
    94,
    ['dexterity', 'perception', 'charisma'],
    false,
    ['Animal Bond', 'Charge', 'Melee Weapons', 'Mount Attack', 'Trick Riding'],
  ],
  [
    'Elementalist',
    96,
    ['perception', 'willpower'],
    true,
    [
      'Elementalism',
      'Patterncraft',
      'Spellcasting',
      'Spell Matrix',
      'Thread Weaving',
    ],
  ],
  [
    'Illusionist',
    98,
    ['perception', 'willpower', 'charisma'],
    true,
    [
      'Illusionism',
      'Patterncraft',
      'Spellcasting',
      'Spell Matrix',
      'Thread Weaving',
    ],
  ],
  [
    'Nethermancer',
    100,
    ['perception', 'willpower', 'charisma'],
    true,
    [
      'Nethermancy',
      'Patterncraft',
      'Spellcasting',
      'Spell Matrix',
      'Thread Weaving',
    ],
  ],
  [
    'Scout',
    102,
    ['dexterity', 'perception'],
    false,
    ['Awareness', 'Climbing', 'Navigation', 'Tracking', 'Wilderness Survival'],
  ],
  [
    'Sky Raider',
    104,
    ['dexterity', 'strength', 'charisma'],
    false,
    [
      'Air Sailing',
      'Battle Shout',
      'Melee Weapons',
      'Unarmed Combat',
      'Wind Catcher',
    ],
  ],
  [
    'Swordmaster',
    106,
    ['dexterity', 'charisma'],
    false,
    ['Avoid Blow', 'First Impression', 'Maneuver', 'Melee Weapons', 'Taunt'],
  ],
  [
    'Thief',
    108,
    ['dexterity', 'perception', 'charisma'],
    false,
    [
      'Awareness',
      'Lock Picking',
      'Melee Weapons',
      'Picking Pockets',
      'Trap Initiative',
    ],
  ],
  [
    'Troubadour',
    110,
    ['perception', 'charisma'],
    false,
    [
      'Emotion Song',
      'First Impression',
      'Item History',
      'Knowledge Is Power',
      'Speak Language',
    ],
  ],
  [
    'Warrior',
    112,
    ['dexterity', 'strength', 'toughness'],
    false,
    [
      'Avoid Blow',
      'Melee Weapons',
      'Unarmed Combat',
      'Weapon Training',
      'Wood Skin',
    ],
  ],
  [
    'Weaponsmith',
    114,
    ['perception', 'willpower', 'charisma'],
    false,
    [
      'Forge Weapon',
      'Haggle',
      'Melee Weapons',
      'Steel Thought',
      'Weapon History',
    ],
  ],
  [
    'Wizard',
    116,
    ['perception', 'willpower', 'charisma'],
    true,
    [
      'Patterncraft',
      'Spellcasting',
      'Spell Matrix',
      'Thread Weaving',
      'Wizardry',
    ],
  ],
];
export const earthdawnDisciplines: EarthdawnDiscipline[] = disciplineRows.map(
  ([name, page, importantAttributes, spellcaster, noviceTalents]) => ({
    ...entry(
      'discipline',
      name,
      'ed4.players-guide',
      page,
      `${name} is an official adept Discipline with its own philosophy, talent progression, and Circle abilities.`,
    ),
    importantAttributes,
    durability: 5,
    noviceTalents,
    optionalTalents: [],
    spellcaster,
    circles: coreDisciplineProgressions[name] ?? [],
    talentOptions: coreTalentOptions[name] ?? {
      novice: [],
      journeyman: [],
      warden: [],
      master: [],
    },
  }),
);

export const earthdawnPassions = [
  ['Astendar', 18, false, 'Love, art, beauty, and creative expression.'],
  ['Chorrolis', 28, false, 'Trade, wealth, and fair exchange.'],
  ['Dis', 38, true, 'Bureaucracy, slavery, and oppressive order.'],
  ['Floranuus', 48, false, 'Energy, motion, victory, and perseverance.'],
  ['Garlen', 58, false, 'Home, healing, protection, and community.'],
  ['Jaspree', 68, false, 'Nature, growth, and the wilderness.'],
  ['Lochost', 78, false, 'Freedom, rebellion, and liberation.'],
  ['Mynbruje', 88, false, 'Justice, truth, compassion, and empathy.'],
  ['Raggok', 98, true, 'Vengeance, pain, jealousy, and corruption.'],
  ['Thystonius', 108, false, 'Conflict, courage, and physical challenge.'],
  ['Upandal', 118, false, 'Building, planning, and cooperation.'],
  [
    'Vestrial',
    124,
    true,
    'Deception and manipulation in his corrupted aspect.',
  ],
] as const;

export const earthdawnQuestorDefinitions: EarthdawnDefinition[] =
  earthdawnPassions.map(([name, page, mature, summary]) => ({
    ...entry('devotion', name, 'ed4.questors', page, summary),
    requirements: mature ? ['GM approval for a Mad Passion'] : [],
  }));

const spellRows: Array<[string, string, number, number]> = [
  ['Air Armor', 'Elementalist', 1, 271],
  ['Earth Darts', 'Elementalist', 1, 272],
  ['Flameweapon', 'Elementalist', 1, 272],
  ['Purify Water', 'Elementalist', 1, 274],
  ['Shelter', 'Elementalist', 1, 274],
  ['Assuring Touch', 'Illusionist', 1, 294],
  ['Best Face', 'Illusionist', 1, 295],
  ['Cloak', 'Illusionist', 1, 295],
  ['Ephemeral Bolt', 'Illusionist', 1, 296],
  ['Trust', 'Illusionist', 1, 299],
  ['Astral Spear', 'Nethermancer', 1, 317],
  ['Bone Circle', 'Nethermancer', 1, 318],
  ['Ethereal Darkness', 'Nethermancer', 1, 319],
  ['Soul Armor', 'Nethermancer', 1, 321],
  ['Spirit Dart', 'Nethermancer', 1, 322],
  ['Astral Sense', 'Wizard', 1, 342],
  ['Catseyes', 'Wizard', 1, 343],
  ['Flame Flash', 'Wizard', 1, 344],
  ['Mage Armor', 'Wizard', 1, 344],
  ['Mind Dagger', 'Wizard', 1, 345],
];

export const earthdawnSpells: EarthdawnDefinition[] = spellRows.map(
  ([name, discipline, circle, page]) => ({
    ...entry(
      'spell',
      name,
      'ed4.players-guide',
      page,
      `${discipline} Circle ${circle} spell. Add it to the grimoire for editable casting details.`,
      [`${discipline} Circle ${circle}`],
    ),
    mechanics: JSON.stringify({ discipline, circle }),
  }),
);

const named = (
  kind: EarthdawnCatalogKind,
  names: string[],
  sourceId: string,
  page: number,
) =>
  names.map((name) =>
    entry(
      kind,
      name,
      sourceId,
      page,
      `${name} is official ${earthdawnSources.find(({ id }) => id === sourceId)!.shortTitle} character content. Consult the cited page for its complete rules.`,
    ),
  );
const priced = (
  kind: 'equipment' | 'weapon',
  rows: Array<[string, number, number]>,
  page: number,
) =>
  rows.map(([name, costSilver, weight]) => ({
    ...entry(
      kind,
      name,
      'ed4.players-guide',
      page,
      `${name} is verified Player’s Guide equipment. Price is recorded in silver-piece equivalents.`,
    ),
    costSilver,
    mechanics: JSON.stringify({ weight }),
  }));
export const earthdawnCatalog: EarthdawnDefinition[] = [
  ...earthdawnRaces,
  ...earthdawnDisciplines,
  ...earthdawnQuestorDefinitions,
  ...earthdawnSpells,
  ...named(
    'talent',
    [
      ...new Set(
        Object.values(coreDisciplineProgressions)
          .flatMap((circles) =>
            circles.flatMap(({ requiredTalents }) => requiredTalents),
          )
          .concat(
            Object.values(coreTalentOptions).flatMap((tiers) =>
              Object.values(tiers).flat(),
            ),
          )
          .concat([
            'Astral Sight',
            'Versatility',
            'Karma Ritual',
            'Durability',
            'Thread Weaving',
          ]),
      ),
    ],
    'ed4.players-guide',
    119,
  ),
  ...named(
    'skill',
    [
      'Alchemy',
      'Artisan',
      'Craft Armor',
      'Craft Weapon',
      'Disguise',
      'Etiquette',
      'Research',
      'Speak Language',
      'Read and Write Language',
      'Streetwise',
      'Wilderness Survival',
    ],
    'ed4.players-guide',
    183,
  ),
  ...priced(
    'equipment',
    [
      ['Adventurer’s Kit', 0, 0],
      ['Backpack', 2, 2],
      ['Climbing Kit', 25, 10],
      ['Healing Potion', 25, 0],
      ['Leather Armor', 10, 15],
      ['Chain Mail', 180, 40],
      ['Padded Cloth', 2, 5],
      ['Padded Leather', 20, 20],
      ['Ring Mail', 110, 30],
      ['Buckler', 5, 3],
      ['Footman’s Shield', 15, 10],
    ],
    433,
  ),
  ...priced(
    'weapon',
    [
      ['Battle Axe', 35, 6],
      ['Broadsword', 25, 4],
      ['Club', 2, 3],
      ['Dagger', 0.8, 1],
      ['Hand Axe', 15, 3],
      ['Long Spear', 15, 7],
      ['Mace', 20, 5],
      ['Short Sword', 16, 3],
      ['Spear', 9, 3],
      ['Two-Handed Sword', 125, 7],
      ['Longbow', 60, 4],
      ['Shortbow', 15, 3],
    ],
    433,
  ),
  ...named(
    'thread-item',
    ['Thread Item', 'Group True Pattern', 'Pattern Item'],
    'ed4.gamemasters-guide',
    197,
  ),
  ...named(
    'equipment',
    ['Blood Ink', 'Blood Charm', 'The Edge of Travar'],
    'ed4.travar',
    273,
  ),
  ...named('path', ['Marauder', 'Avowed'], 'ed4.vasgothia', 183),
  ...named(
    'path',
    [
      'Brother of Stone',
      'Fire Eater',
      'Horror Stalker',
      'Journeyman',
      'Liberator',
      'Messenger',
      'Outcast',
      'Purifier',
      'Scholar',
      'Tail Dancer',
      'Windmaster',
      'Woodsman',
      'Boatman',
      'Gauntlet',
      'Shaman',
    ],
    'ed4.mystic-paths',
    11,
  ),
];
export const earthdawnDefinitionById = new Map(
  earthdawnCatalog.map((value) => [value.id, value]),
);
