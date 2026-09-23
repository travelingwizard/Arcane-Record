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
import { coreSpellRows } from './core-spells';
import { companionKnackRows } from './companion-knacks';
import {
  questorDevotionProgressions,
  questorTierMinimumRank,
} from './questor-devotions';
import { companionThreadItemRows } from './companion-thread-items';

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

const devotionNames = [
  ...new Set(questorDevotionProgressions.flatMap(({ names }) => names)),
];
export const earthdawnQuestorDefinitions: EarthdawnDefinition[] =
  devotionNames.map((name) => {
    const eligibility = questorDevotionProgressions
      .filter(({ names }) => names.includes(name))
      .map(({ passion, tier, page }) => ({
        passion,
        tier,
        minimumQuestorRank: questorTierMinimumRank[tier],
        page,
      }));
    const passionList = eligibility.map(({ passion }) => passion).join(', ');
    const first = eligibility[0]!;
    return {
      ...entry(
        'devotion',
        name,
        'ed4.questors',
        first.page,
        `${name} is a verified Questor devotion available to ${passionList}.`,
        eligibility.map(({ passion, tier }) => `${passion} ${tier} devotion`),
      ),
      mechanics: JSON.stringify({ eligibility }),
    };
  });

export const earthdawnSpells: EarthdawnDefinition[] = coreSpellRows.map(
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
const referenced = (
  kind: EarthdawnCatalogKind,
  names: string[],
  sourceId: string,
  page: number,
) =>
  named(kind, names, sourceId, page).map((definition) => ({
    ...definition,
    verification: 'reference-only' as const,
    summary: `${definition.name} is indexed as player-facing reference material, but its complete selectable mechanics have not been certified.`,
  }));
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
const weaponEntries = (
  rows: Array<[string, number, number, number, string, number, number, string]>,
) =>
  rows.map(
    ([
      name,
      damageStep,
      strengthMinimum,
      size,
      range,
      cost,
      weight,
      availability,
    ]) => ({
      ...entry(
        'weapon',
        name,
        'ed4.players-guide',
        range ? 434 : 433,
        `${name} is a verified Player’s Guide weapon (${availability} availability).`,
      ),
      costSilver: cost,
      mechanics: JSON.stringify({
        damageStep,
        strengthMinimum,
        size,
        range,
        weight,
        availability,
      }),
    }),
  );
const armorEntries = (
  rows: Array<[string, number, number, number, number, number, string]>,
) =>
  rows.map(
    ([
      name,
      physicalArmor,
      mysticArmor,
      initiativePenalty,
      cost,
      weight,
      availability,
    ]) => ({
      ...entry(
        'equipment',
        name,
        'ed4.players-guide',
        435,
        `${name} is verified Player’s Guide armor or a shield (${availability} availability).`,
      ),
      costSilver: cost,
      mechanics: JSON.stringify({
        weight,
        physicalArmor,
        mysticArmor,
        initiativePenalty,
        availability,
      }),
    }),
  );
const shieldEntries = (
  rows: Array<[string, number, number, number, number, number, number, string]>,
) =>
  rows.map(
    ([
      name,
      physicalDefense,
      mysticDefense,
      initiativePenalty,
      shatterThreshold,
      cost,
      weight,
      availability,
    ]) => ({
      ...entry(
        'equipment',
        name,
        'ed4.players-guide',
        435,
        `${name} is a verified Player’s Guide shield (${availability} availability).`,
      ),
      costSilver: cost,
      mechanics: JSON.stringify({
        weight,
        physicalDefense,
        mysticDefense,
        initiativePenalty,
        shatterThreshold,
        availability,
      }),
    }),
  );
export const earthdawnKnacks: EarthdawnDefinition[] = companionKnackRows.map(
  ([name, talents, minimumRank, page]) => ({
    ...entry(
      'knack',
      name,
      'ed4.companion',
      page,
      `${name} is a verified knack for ${talents}, requiring rank ${minimumRank}.`,
      [`${talents} rank ${minimumRank}`],
    ),
    mechanics: JSON.stringify({
      talents: talents.split(', '),
      minimumRank,
    }),
  }),
);
export const earthdawnThreadItems: EarthdawnDefinition[] =
  companionThreadItemRows.map(([name, page]) => ({
    ...entry(
      'thread-item',
      name,
      'ed4.companion',
      page,
      `${name} is a verified Companion thread item. Record key knowledges, deeds, and unlocked rank effects on the character’s editable thread record.`,
    ),
    mechanics: JSON.stringify({ rankType: 'normal' }),
  }));
export const earthdawnCatalog: EarthdawnDefinition[] = [
  ...earthdawnRaces,
  ...earthdawnDisciplines,
  ...earthdawnQuestorDefinitions,
  ...earthdawnSpells,
  ...earthdawnKnacks,
  ...earthdawnThreadItems,
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
      'Acting',
      'Alchemy',
      'Acrobatic Defense',
      'Air Sailing',
      'Animal Bond',
      'Animal Handling',
      'Animal Training',
      'Anticipate Blow',
      'Arcane Mutterings',
      'Avoid Blow',
      'Awareness',
      'Battle Shout',
      'Bribery',
      'Charge',
      'Climbing',
      'Conversation',
      'Danger Sense',
      'Diplomacy',
      'Disarm Trap',
      'Distract',
      'Emotion Song',
      'Engaging Banter',
      'Etiquette',
      'First Impression',
      'Flirting',
      'Graceful Exit',
      'Great Leap',
      'Haggle',
      'Heartening Laugh',
      'Lock Picking',
      'Maneuver',
      'Melee Weapons',
      'Mimic Voice',
      'Missile Weapons',
      'Navigation',
      'Picking Pockets',
      'Research',
      'Seduction',
      'Shield Bash',
      'Speak Language',
      'Read and Write Language',
      'Stealthy Stride',
      'Streetwise',
      'Sure Mount',
      'Surprise Strike',
      'Swift Kick',
      'Taunt',
      'Throwing Weapons',
      'Tracking',
      'Trick Riding',
      'Unarmed Combat',
      'Wilderness Survival',
      'Wound Balance',
      'Battle Bellow',
      'Blade Juggle',
      'Conceal Object',
      'Disarm',
      'Down Strike',
      'Evidence Analysis',
      'Fast Hand',
      'Hypnotize',
      'Impressive Display',
      'Leadership',
      'Mount Attack',
      'Resist Taunt',
      'Riposte',
      'Second Attack',
      'Second Shot',
      'Second Weapon',
      'Slough Blame',
      'Tactics',
      'Wheeling Attack',
      'Wheeling Defense',
      'Artisan',
      'Craft Armor',
      'Craft Weapon',
      'Disguise',
    ],
    'ed4.players-guide',
    185,
  ),
  ...priced(
    'equipment',
    [
      ['Adventurer’s Kit', 15, 14],
      ['Adventurer’s Kit with Tent', 40, 34],
      ['Backpack', 5, 3],
      ['Climbing Kit', 36, 19],
      ['Healing Potion', 300, 2],
      ['Leather Armor', 10, 15],
      ['Chain Mail', 180, 40],
      ['Padded Cloth', 2, 5],
      ['Padded Leather', 20, 20],
      ['Ring Mail', 110, 30],
    ],
    433,
  ),
  ...weaponEntries([
    ['Battle Axe', 7, 13, 5, '', 35, 6, 'Average'],
    ['Broadsword', 5, 12, 3, '', 25, 4, 'Average'],
    ['Club', 3, 7, 2, '', 2, 3, 'Average'],
    ['Dagger', 2, 4, 1, '2–10 / 11–20', 0.08, 1, 'Average'],
    ['Dwarf Sword', 4, 12, 2, '', 6, 2, 'Average'],
    ['Flail', 5, 10, 3, '', 35, 5, 'Average'],
    ['Hand Axe', 4, 8, 2, '', 15, 3, 'Average'],
    ['Knife', 1, 3, 1, '2–8 / 9–16', 0.03, 0.625, 'Everyday'],
    ['Lance', 6, 14, 6, '', 150, 10, 'Unusual'],
    ['Long Spear', 5, 13, 5, '', 15, 7, 'Average'],
    ['Mace', 4, 13, 3, '', 20, 5, 'Average'],
    ['Pole Axe', 8, 16, 6, '', 150, 10, 'Unusual'],
    ['Quarterstaff', 4, 6, 5, '', 5, 4, 'Average'],
    ['Sap', 1, 3, 1, '', 3, 2, 'Average'],
    ['Short Sword', 4, 8, 2, '', 16, 3, 'Average'],
    ['Spear', 4, 9, 3, '2–10 / 11–20', 9, 3, 'Average'],
    ['Spiked Mace', 6, 13, 4, '', 40, 7, 'Average'],
    ['Trispear', 5, 11, 4, '', 25, 4, 'Average'],
    ['Troll Axe', 8, 17, 6, '', 45, 8, 'Unusual'],
    ['Troll Sword', 6, 13, 4, '', 50, 6, 'Average'],
    ['Two-Handed Sword', 8, 15, 6, '', 125, 7, 'Unusual'],
    ['Warhammer', 7, 15, 5, '', 95, 8, 'Unusual'],
    ['Whip', 3, 7, 3, '3 yards', 10, 2, 'Average'],
    ['Windling Spear', 2, 4, 1, '2–8 / 9–16', 25, 0.5, 'Unusual'],
    ['Windling Sword', 3, 6, 1, '', 45, 1, 'Unusual'],
    ['Blowgun', 1, 3, 1, '2–8 / 9–16', 2, 0.625, 'Unusual'],
    ['Elven Warbow', 5, 12, 5, '2–48 / 49–96', 200, 4, 'Rare'],
    ['Light Crossbow', 4, 9, 3, '2–32 / 33–64', 50, 5, 'Average'],
    ['Longbow', 4, 11, 5, '2–40 / 41–80', 60, 4, 'Average'],
    ['Medium Crossbow', 5, 12, 4, '2–40 / 41–80', 100, 7, 'Unusual'],
    ['Shortbow', 3, 8, 3, '2–30 / 31–60', 15, 3, 'Average'],
    ['Sling', 2, 5, 2, '2–20 / 21–40', 3, 1, 'Average'],
    ['Troll Sling', 4, 10, 4, '2–30 / 31–60', 15, 4, 'Average'],
    ['Windling Bow', 3, 5, 2, '2–24 / 25–48', 25, 0.875, 'Average'],
    ['Bola', 3, 6, 2, '2–12 / 13–24', 10, 2, 'Average'],
    ['Dart', 1, 4, 1, '2–18 / 19–36', 0.03, 0.5, 'Average'],
    ['Flight Dagger', 2, 4, 1, '2–20 / 21–40', 25, 0.75, 'Unusual'],
    ['Hawk Hatchet', 4, 8, 3, '2–24 / 25–48', 75, 2, 'Unusual'],
    ['Throwing Axe', 3, 7, 3, '2–12 / 13–24', 25, 2, 'Average'],
    ['Throwing Dagger', 2, 4, 1, '2–16 / 17–32', 2, 0.75, 'Average'],
  ]),
  ...armorEntries([
    ['Blood Pebble', 5, 3, 1, 300, 0, 'Rare'],
    ['Crystal Plate', 7, 7, 5, 12000, 90, 'Rare'],
    ['Crystal Ringlet', 4, 4, 2, 500, 45, 'Rare'],
    ['Espagra Cloak', 3, 1, 0, 200, 10, 'Rare'],
    ['Fernweave', 2, 3, 0, 125, 15, 'Unusual'],
    ['Hardened Leather', 5, 0, 1, 40, 20, 'Average'],
    ['Hide Armor', 5, 1, 1, 50, 25, 'Average'],
    ['Living Crystal', 6, 3, 2, 1100, 0, 'Rare'],
    ['Obsidiman Skin', 3, 1, 0, 100, 20, 'Rare'],
    ['Plate Armor', 9, 0, 4, 3000, 60, 'Unusual'],
    ['Wyvern Skin', 8, 1, 3, 2000, 50, 'Rare'],
  ]),
  ...shieldEntries([
    ['Body Shield', 3, 0, 2, 21, 50, 15, 'Unusual'],
    ['Buckler', 1, 0, 0, 17, 5, 3, 'Average'],
    ['Crystal Buckler', 1, 1, 0, 17, 50, 5, 'Rare'],
    ['Crystal Raider Shield', 2, 2, 2, 18, 150, 15, 'Rare'],
    ['Ferndask Shield', 1, 2, 2, 16, 22, 5, 'Unusual'],
    ['Footman’s Shield', 2, 0, 1, 19, 15, 10, 'Average'],
    ['Rider’s Shield', 2, 0, 1, 19, 20, 8, 'Average'],
  ]),
  ...priced(
    'equipment',
    [
      ['Bedroll of Comfort', 340, 2],
      ['Boots, Dry', 250, 2],
      ['Boots, Huntsman', 700, 2],
      ['Cleaning Broom', 25, 2],
      ['Dwarf Winternight Cloak', 275, 2],
      ['Everclean Cloak', 275, 1],
      ['Warm Cloak', 300, 2],
      ['Divining Rod', 75, 1],
      ['Elfweave Robe', 80, 2],
      ['Fire Starter', 100, 2],
      ['Firefly Chalk', 12, 0],
      ['Heat Stone', 100, 3],
      ['Hot Pot', 100, 8],
      ['Small Light Quartz', 75, 2],
      ['Medium Light Quartz', 125, 6],
      ['Large Light Quartz', 200, 20],
      ['Light Quartz Weapon', 100, 1],
      ['Message Stone', 300, 2],
      ['Warded Message Stone', 600, 2],
      ['One-Size Hat', 35, 1],
      ['Orichalcum Container', 5000, 1],
      ['Small Pot of Grumbah', 75, 2],
      ['Large Pot of Grumbah', 200, 5],
      ['Pure Water Pot', 150, 2],
      ['Quiet Fingers Gloves', 140, 1],
      ['Quiet Pouch', 65, 2],
      ['Season Lamp', 350, 0],
      ['Traveler’s Mug', 350, 1],
      ['Upandal’s Blessings', 275, 3],
      ['Wind Instrument', 250, 2],
    ],
    436,
  ),
  ...priced(
    'equipment',
    [
      ['Absorb Blow Charm', 100, 1],
      ['Astral-Sensitive Eye', 325, 1],
      ['Bone Charm', 175, 1],
      ['Darksight Eye', 200, 1],
      ['Death Cheat Charm', 450, 1],
      ['Desperate Blow Charm', 275, 1],
      ['Desperate Spell Charm', 300, 1],
      ['Garlen Stone', 250, 1],
      ['Horn Needle', 450, 1],
      ['Horror Fend', 500, 1],
      ['Initiative Booster', 600, 1],
      ['Strength Booster', 300, 1],
      ['Targeting Eye', 450, 1],
      ['Wound Balance Charm', 200, 1],
      ['Booster Potion', 50, 2],
      ['Cure Disease Potion', 500, 2],
      ['Halt Illness Potion', 100, 1],
      ['Kelia’s Antidote', 125, 2],
      ['Kelix’s Poultice', 50, 1],
      ['Last Chance Salve', 600, 1],
      ['Salve of Closure', 200, 1],
    ],
    437,
  ),
  ...priced(
    'equipment',
    [
      ['Alchemist’s Kit', 500, 15],
      ['Carving Tools', 15, 3],
      ['Embroidery and Sewing Tools', 25, 1],
      ['Forge Tools', 100, 20],
      ['Painting Tools', 45, 2],
      ['Sculpting Tools', 30, 3],
      ['Bedroll', 5, 4],
      ['Belt Pouch', 0.08, 1],
      ['Blanket', 0.15, 2],
      ['Heavy Chain, 10 feet', 50, 9],
      ['Light Chain, 10 feet', 10, 6],
      ['Craftsman Tools', 25, 5],
      ['Disguise Kit', 50, 6],
      ['Fishing Kit', 20, 14],
      ['Fishing Net', 15, 10],
      ['Flint and Steel', 1, 0.5],
      ['Grappling Hook', 10, 5],
      ['Basic Healing Kit', 75, 5],
      ['Healing Kit Refill', 50, 0],
      ['Iron Pot', 20, 8],
      ['Hooded Lantern', 9, 3],
      ['Bullseye Lantern', 27, 3],
      ['Light Quartz Lantern', 85, 5],
      ['Map or Scroll Case', 0.08, 1],
    ],
    438,
  ),
  ...priced(
    'equipment',
    [
      ['Drum', 7, 5],
      ['Flute', 2, 2],
      ['Horn', 70, 7],
      ['Lute', 25, 6],
      ['Whistle', 0.02, 1],
      ['Navigation Charts', 15, 2],
      ['Oil Flask', 6, 1],
      ['Basic Physician’s Kit', 50, 3],
      ['Physician’s Kit Refill', 25, 1],
      ['Paper or Parchment', 1, 0],
      ['Quill Pen', 1, 0],
      ['Rope, per yard', 3, 1],
      ['Sack', 2, 2],
      ['Tent', 30, 20],
      ['Thieves’ Picks and Tools', 100, 1],
      ['Torch', 0.05, 1],
      ['Whetstone', 0.02, 1],
      ['Water or Wine Skin', 2, 4],
      ['Writing Ink', 10, 0.5],
      ['Writing Kit', 23, 2],
    ],
    439,
  ),
  ...named(
    'thread-item',
    ['Thread Item', 'Group True Pattern', 'Pattern Item'],
    'ed4.gamemasters-guide',
    197,
  ),
  ...referenced(
    'equipment',
    ['Blood Ink', 'Blood Charm', 'The Edge of Travar'],
    'ed4.travar',
    273,
  ),
  ...referenced('path', ['Marauder', 'Avowed'], 'ed4.vasgothia', 183),
  ...referenced(
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
