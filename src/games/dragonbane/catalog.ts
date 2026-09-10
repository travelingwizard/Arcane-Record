export interface DragonbaneDefinition {
  id: string;
  name: string;
  sourceId: 'dragonbane.core';
  page: number;
  summary: string;
  verified: boolean;
  aliases?: readonly string[];
}
export interface DragonbaneKin extends DragonbaneDefinition {
  movement: number;
  innateAbilities: readonly string[];
}
export interface DragonbaneProfession extends DragonbaneDefinition {
  keyAttribute: AttributeKey;
  skills: readonly string[];
  heroicAbility: string | null;
  gearPackages: readonly [string, string, string];
}
export type AttributeKey = 'str' | 'con' | 'agl' | 'int' | 'wil' | 'cha';
const def = (
  kind: string,
  name: string,
  page: number,
  summary: string,
): DragonbaneDefinition => ({
  id: `dragonbane.core.${kind}.${name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`,
  name,
  sourceId: 'dragonbane.core',
  page,
  summary,
  verified: true,
});

export const dragonbaneKin: readonly DragonbaneKin[] = [
  ['Human', 10, ['Adaptive']],
  ['Halfling', 8, ['Hard to Catch']],
  ['Dwarf', 8, ['Unforgiving']],
  ['Elf', 10, ['Inner Peace']],
  ['Mallard', 8, ['Ill-Tempered', 'Webbed Feet']],
  ['Wolfkin', 12, ['Hunting Instincts']],
].map(([name, movement, innateAbilities], index) => ({
  ...def(
    'kin',
    name as string,
    10 + Math.floor(index / 2),
    `${name} adventurers have a distinct movement rating and innate ability.`,
  ),
  movement: movement as number,
  innateAbilities: innateAbilities as string[],
}));

const gear = {
  artisan: [
    'Light warhammer, leather armor, smith tools and supplies',
    'Handaxe, leather armor, carpentry tools and supplies',
    'Knife, leather armor, tanning tools and supplies',
  ],
  bard: [
    'Lyre, knife, lamp and supplies',
    'Flute, dagger, rope and supplies',
    'Horn, knife and supplies',
  ],
  fighter: [
    'Heavy one-handed weapon, shield and chainmail',
    'Light weapon, light crossbow and leather armor',
    'Long spear, studded leather and open helmet',
  ],
  hunter: [
    'Dagger, short bow, leather armor and field gear',
    'Knife, longbow, leather armor and field gear',
    'Dagger, sling, leather armor and field gear',
  ],
  knight: [
    'Heavy weapon, shield, plate and great helm',
    'Heavy weapon, shield, chainmail and open helmet',
    'Short sword, lance, shield, chainmail, helmet and horse',
  ],
  mage: [
    'Staff, orbuculum, grimoire and supplies',
    'Knife, wand, grimoire and supplies',
    'Amulet, grimoire, sleeping pelt and supplies',
  ],
  mariner: [
    'Dagger, short bow, rope and shipboard supplies',
    'Scimitar, leather armor, rope and supplies',
    'Trident, spyglass, rope and supplies',
  ],
  merchant: [
    'Dagger, field gear and donkey',
    'Knife, field kitchen, donkey and cart',
    'Dagger, tent, backpack and field gear',
  ],
  scholar: [
    'Staff, notebook, quill and field gear',
    'Knife, specialist book and field gear',
    'Short sword, bandages, sleeping poison and field gear',
  ],
  thief: [
    'Dagger, sling, rope and grappling hook',
    'Knife, lockpicks and field gear',
    'Two daggers, marbles, rope and field gear',
  ],
} as const;
const profession = (
  name: string,
  page: number,
  keyAttribute: AttributeKey,
  skills: string[],
  heroicAbility: string | null,
  gearPackages: readonly [string, string, string],
): DragonbaneProfession => ({
  ...def(
    'profession',
    name,
    page,
    `${name}s begin with six professional Skill choices and a characteristic starting package.`,
  ),
  keyAttribute,
  skills,
  heroicAbility,
  gearPackages,
});
export const dragonbaneProfessions = [
  profession(
    'Artisan',
    14,
    'str',
    [
      'Axes',
      'Brawling',
      'Crafting',
      'Hammers',
      'Knives',
      'Sleight of Hand',
      'Spot Hidden',
      'Swords',
    ],
    'Master craftsperson',
    gear.artisan,
  ),
  profession(
    'Bard',
    15,
    'cha',
    [
      'Acrobatics',
      'Bluffing',
      'Evade',
      'Knives',
      'Languages',
      'Myths & Legends',
      'Performance',
      'Persuasion',
    ],
    'Musician',
    gear.bard,
  ),
  profession(
    'Fighter',
    16,
    'str',
    [
      'Axes',
      'Bows',
      'Brawling',
      'Crossbows',
      'Evade',
      'Hammers',
      'Spears',
      'Swords',
    ],
    'Veteran',
    gear.fighter,
  ),
  profession(
    'Hunter',
    17,
    'agl',
    [
      'Acrobatics',
      'Awareness',
      'Bows',
      'Bushcraft',
      'Hunting & Fishing',
      'Knives',
      'Slings',
      'Sneaking',
    ],
    'Companion',
    gear.hunter,
  ),
  profession(
    'Knight',
    18,
    'str',
    [
      'Beast Lore',
      'Hammers',
      'Myths & Legends',
      'Performance',
      'Persuasion',
      'Riding',
      'Spears',
      'Swords',
    ],
    'Guardian',
    gear.knight,
  ),
  profession(
    'Mage',
    19,
    'wil',
    [
      'Animism',
      'Elementalism',
      'Mentalism',
      'Awareness',
      'Beast Lore',
      'Bushcraft',
      'Evade',
      'Healing',
      'Languages',
      'Myths & Legends',
      'Sneaking',
      'Spot Hidden',
      'Staves',
    ],
    null,
    gear.mage,
  ),
  profession(
    'Mariner',
    20,
    'agl',
    [
      'Acrobatics',
      'Awareness',
      'Hunting & Fishing',
      'Knives',
      'Languages',
      'Seamanship',
      'Swimming',
      'Swords',
    ],
    'Sea Legs',
    gear.mariner,
  ),
  profession(
    'Merchant',
    21,
    'cha',
    [
      'Awareness',
      'Bartering',
      'Bluffing',
      'Evade',
      'Knives',
      'Persuasion',
      'Sleight of Hand',
      'Spot Hidden',
    ],
    'Treasure Hunter',
    gear.merchant,
  ),
  profession(
    'Scholar',
    22,
    'int',
    [
      'Awareness',
      'Beast Lore',
      'Bushcraft',
      'Evade',
      'Healing',
      'Languages',
      'Myths & Legends',
      'Spot Hidden',
    ],
    'Intuition',
    gear.scholar,
  ),
  profession(
    'Thief',
    23,
    'agl',
    [
      'Acrobatics',
      'Awareness',
      'Bluffing',
      'Evade',
      'Knives',
      'Sleight of Hand',
      'Sneaking',
      'Spot Hidden',
    ],
    'Backstabbing',
    gear.thief,
  ),
] as const;

const skillData: readonly [string, AttributeKey][] = [
  ['Acrobatics', 'agl'],
  ['Awareness', 'int'],
  ['Bartering', 'cha'],
  ['Beast Lore', 'int'],
  ['Bluffing', 'cha'],
  ['Bushcraft', 'int'],
  ['Crafting', 'str'],
  ['Evade', 'agl'],
  ['Healing', 'int'],
  ['Hunting & Fishing', 'agl'],
  ['Languages', 'int'],
  ['Myths & Legends', 'int'],
  ['Performance', 'cha'],
  ['Persuasion', 'cha'],
  ['Riding', 'agl'],
  ['Seamanship', 'int'],
  ['Sleight of Hand', 'agl'],
  ['Sneaking', 'agl'],
  ['Spot Hidden', 'int'],
  ['Swimming', 'agl'],
  ['Axes', 'str'],
  ['Bows', 'agl'],
  ['Brawling', 'str'],
  ['Crossbows', 'agl'],
  ['Hammers', 'str'],
  ['Knives', 'agl'],
  ['Slings', 'agl'],
  ['Spears', 'str'],
  ['Staves', 'str'],
  ['Swords', 'str'],
];
export const dragonbaneSkills = skillData.map(([name, attribute]) => ({
  ...def(
    'skill',
    name,
    30,
    `${name} is a ${attribute.toUpperCase()}-based core Skill.`,
  ),
  attribute,
}));
export const dragonbaneMagicSchools = [
  'Animism',
  'Elementalism',
  'Mentalism',
].map((name) => ({
  ...def(
    'magic-school',
    name,
    57,
    `${name} is a distinct secondary Skill and school of magic.`,
  ),
  attribute: 'int' as AttributeKey,
}));
export const dragonbaneHeroicAbilities = [
  'Assassin',
  'Backstabbing',
  'Battle Cry',
  'Berserker',
  'Catlike',
  'Companion',
  'Contortionist',
  'Defensive',
  'Deflect Arrow',
  'Disguise',
  'Double Slash',
  'Dragonslayer',
  'Dual Wield',
  'Eagle Eye',
  'Fast Footwork',
  'Fast Healer',
  'Fearless',
  'Focused',
  'Guardian',
  'Insight',
  'Intuition',
  'Iron Fist',
  'Iron Grip',
  'Lightning Fast',
  'Lone Wolf',
  'Magic Talent',
  'Massive Blow',
  'Master Blacksmith',
  'Master Carpenter',
  'Master Chef',
  'Master Spellcaster',
  'Master Tanner',
  'Monster Hunter',
  'Musician',
  'Pathfinder',
  'Quartermaster',
  'Robust',
  'Sea Legs',
  'Shield Block',
  'Throwing Arm',
  'Treasure Hunter',
  'Twin Shot',
  'Veteran',
  'Weasel',
].map((name) =>
  def(
    'heroic-ability',
    name,
    36,
    `${name} is a heroic ability with its own trigger, WP cost, and prerequisites.`,
  ),
);
const spellGroup = (
  school: 'general' | 'animism' | 'elementalism' | 'mentalism',
  page: number,
  rows: readonly [string, number, string | null][],
) =>
  rows.map(([name, rank, prerequisite]) => ({
    ...def(
      'spell',
      name,
      page,
      `${name} is a rank ${rank} ${school} spell${prerequisite ? ` requiring ${prerequisite}` : ''}.`,
    ),
    rank,
    school,
    prerequisite,
  }));
export const dragonbaneSpells = [
  ...spellGroup('general', 61, [
    ['Dispel', 1, 'Any School of Magic'],
    ['Protector', 1, 'Any School of Magic'],
    ['Magic Shield', 2, 'Protector or Dispel'],
    ['Transfer', 3, 'Magic Shield'],
    ['Magic Seal', 4, 'Transfer'],
    ['Charge', 4, 'Transfer'],
    ['Permanence', 5, 'Magic Seal'],
  ]),
  ...spellGroup('animism', 63, [
    ['Animal Whisperer', 1, 'Animism'],
    ['Banish', 1, 'Animism'],
    ['Ensnaring Roots', 1, 'Animism'],
    ['Lightning Flash', 1, 'Animism'],
    ['Treat Wound', 1, 'Animism'],
    ['Engulfing Forest', 2, 'Ensnaring Roots'],
    ['Lightning Bolt', 2, 'Lightning Flash'],
    ['Heal Wound', 2, 'Treat Wound'],
    ['Purge', 2, 'Treat Wound'],
    ['Sleep', 2, 'Treat Wound'],
    ['Restoration', 3, 'Heal Wound'],
    ['Resurrection', 3, 'Heal Wound'],
    ['Thunderbolt', 3, 'Lightning Bolt'],
  ]),
  ...spellGroup('elementalism', 66, [
    ['Fireball', 1, 'Elementalism'],
    ['Frost', 1, 'Elementalism'],
    ['Gust of Wind', 1, 'Elementalism'],
    ['Pillar', 1, 'Elementalism'],
    ['Shatter', 1, 'Elementalism'],
    ['Fire Blast', 2, 'Fireball'],
    ['Stone Shield', 2, 'Pillar'],
    ['Stonewall', 2, 'Pillar'],
    ['Tidal Wave', 2, 'Frost'],
    ['Whirlwind', 2, 'Gust of Wind'],
    ['Firebird', 3, 'Fire Blast'],
    ['Sylph', 3, 'Whirlwind'],
    ['Firestorm', 3, 'Fire Blast and Whirlwind'],
    ['Gnome', 3, 'Stonewall'],
    ['Salamander', 3, 'Fire Blast'],
    ['Undine', 3, 'Tidal Wave'],
  ]),
  ...spellGroup('mentalism', 69, [
    ['Farsight', 1, 'Mentalism'],
    ['Levitate', 1, 'Mentalism'],
    ['Longstrider', 1, 'Mentalism'],
    ['Power Fist', 1, 'Mentalism'],
    ['Stone Skin', 1, 'Mentalism'],
    ['Divination', 2, 'Farsight'],
    ['Enchant Weapon', 2, 'Power Fist'],
    ['Mental Strike', 2, 'Power Fist'],
    ['Scrying', 2, 'Farsight'],
    ['Telepathy', 2, 'Farsight'],
    ['Dominate', 3, 'Telepathy'],
  ]),
];
export const dragonbaneTricks = (
  [
    [
      'general',
      [
        'Fetch',
        'Flick',
        'Light',
        'Open/Close',
        'Repair Clothes',
        'Sense Magic',
      ],
    ],
    [
      'animism',
      ['Birdsong', 'Clean', 'Cook Food', 'Floral Trail', 'Hairstyle'],
    ],
    ['elementalism', ['Heat/Chill', 'Ignite', 'Puff of Smoke']],
    ['mentalism', ['Lock/Unlock', 'Magic Stool', 'Slow Fall']],
  ] as const
).flatMap(([school, names]) =>
  names.map((name) => ({
    ...def(
      'magic-trick',
      name,
      school === 'general'
        ? 61
        : school === 'animism'
          ? 63
          : school === 'elementalism'
            ? 65
            : 69,
      `${name} is a minor ${school} magical effect.`,
    ),
    school,
  })),
);
export const dragonbaneEquipment = [
  'Backpack',
  'Bandages',
  'Blanket',
  'Field Kitchen',
  'Field Ration',
  'Flint & Tinder',
  'Grappling Hook',
  'Lantern',
  'Lamp Oil',
  'Lockpicks, Simple',
  'Map',
  'Rope, Hemp',
  'Sleeping Fur',
  'Spyglass',
  'Tent, Small',
  'Torch',
  'Quiver of Arrows',
].map((name) => ({
  ...def(
    'equipment',
    name,
    76,
    `${name} is a character-facing item with its published weight and effect.`,
  ),
  weight: name === 'Tent, Small' ? 2 : name === 'Field Ration' ? 0.25 : 1,
}));
export const dragonbaneWeapons = [
  'Knife',
  'Dagger',
  'Short Sword',
  'Broadsword',
  'Longsword',
  'Greatsword',
  'Handaxe',
  'Battleaxe',
  'Mace',
  'Morningstar',
  'Warhammer, Light',
  'Warhammer, Heavy',
  'Staff',
  'Short Spear',
  'Long Spear',
  'Lance',
  'Sling',
  'Short Bow',
  'Longbow',
  'Crossbow, Light',
  'Crossbow, Heavy',
].map((name, i) => ({
  ...def(
    'weapon',
    name,
    i < 16 ? 74 : 75,
    `${name} uses its published grip, range, damage, durability, and features.`,
  ),
  damage: i < 2 ? 'D8' : i < 6 ? '2D6' : '2D8',
  durability: i < 2 ? 6 : 12,
}));
