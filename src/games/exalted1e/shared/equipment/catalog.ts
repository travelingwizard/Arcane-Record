import type {
  AmmunitionDefinition,
  ArmorDefinition,
  ArmorProfileStats,
  CombatProfile,
  DamageType,
  SourceReference,
  WeaponDefinition,
  WeaponProfileStats,
} from './types';

const coreWeapons: SourceReference = {
  book: 'Exalted First Edition Core Rulebook',
  page: 327,
};
const powerWeapons: SourceReference = {
  book: "Exalted Player's Guide",
  page: 210,
  note: 'Power Combat profile',
};

type WeaponRow = [
  id: string,
  name: string,
  ability: 'brawl' | 'martialArts' | 'melee' | 'thrown',
  classic: [number, number, number, DamageType, number, number],
  power: [number, number, number, DamageType, number, number],
  minimumStrength?: number,
];

const weaponRows: WeaponRow[] = [
  [
    'fist',
    'Fist',
    'brawl',
    [0, 0, 0, 'bashing', 0, 1],
    [0, 1, 0, 'bashing', 2, 5],
    1,
  ],
  [
    'kick',
    'Kick',
    'brawl',
    [-3, -1, 2, 'bashing', -1, 1],
    [-3, 1, 3, 'bashing', -3, 3],
    1,
  ],
  [
    'axe',
    'Axe / Hatchet',
    'melee',
    [0, 0, 5, 'lethal', 0, 1],
    [2, 1, 5, 'lethal', -2, 2],
    2,
  ],
  [
    'cestus',
    'Cestus',
    'brawl',
    [-3, 0, 0, 'lethal', 0, 1],
    [0, 0, 0, 'lethal', 2, 4],
    1,
  ],
  [
    'chopping-sword',
    'Chopping Sword',
    'melee',
    [0, 1, 4, 'lethal', 0, 1],
    [3, 2, 4, 'lethal', -1, 3],
    2,
  ],
  [
    'club',
    'Club / Baton',
    'melee',
    [0, 0, 2, 'lethal', -1, 1],
    [4, 1, 6, 'bashing', 0, 2],
    1,
  ],
  [
    'fighting-gauntlet',
    'Fighting Gauntlet',
    'brawl',
    [0, 0, 1, 'lethal', 0, 1],
    [-6, 0, 5, 'lethal', 2, 2],
    2,
  ],
  [
    'great-axe',
    'Great Axe',
    'melee',
    [0, 0, 7, 'lethal', -1, 1],
    [4, 1, 6, 'lethal', -2, 2],
    3,
  ],
  [
    'great-sword',
    'Great Sword',
    'melee',
    [0, 2, 6, 'lethal', -1, 1],
    [7, 2, 6, 'lethal', -1, 2],
    3,
  ],
  [
    'hook-sword',
    'Hook Sword',
    'martialArts',
    [0, -1, 3, 'lethal', 3, 1],
    [4, -1, 3, 'lethal', 3, 4],
    1,
  ],
  [
    'javelin',
    'Javelin',
    'melee',
    [1, 1, 2, 'lethal', 0, 1],
    [1, 1, 3, 'lethal', 1, 3],
    1,
  ],
  [
    'khatar',
    'Khatar',
    'brawl',
    [-3, 0, 2, 'lethal', -1, 1],
    [0, 0, 2, 'lethal', 3, 4],
    1,
  ],
  [
    'knife',
    'Knife',
    'melee',
    [3, 0, 1, 'lethal', 2, 1],
    [0, 1, 2, 'lethal', -2, 4],
    1,
  ],
  [
    'lance',
    'Lance',
    'melee',
    [10, 0, 7, 'lethal', -3, 1],
    [10, -1, 7, 'lethal', -3, 1],
    3,
  ],
  [
    'mace',
    'Mace / Hammer',
    'melee',
    [-3, 1, 5, 'lethal', 0, 1],
    [4, 1, 8, 'bashing', 1, 2],
    2,
  ],
  [
    'poleaxe',
    'Poleaxe',
    'melee',
    [-3, -1, 8, 'lethal', 0, 1],
    [5, -1, 6, 'lethal', 0, 2],
    3,
  ],
  [
    'seven-section-staff',
    'Seven-Section Staff',
    'martialArts',
    [3, -2, 2, 'lethal', 2, 1],
    [2, -2, 3, 'lethal', 3, 2],
    1,
  ],
  [
    'short-spear',
    'Short Spear',
    'melee',
    [1, 1, 3, 'lethal', 0, 1],
    [5, 2, 4, 'lethal', 1, 2],
    1,
  ],
  [
    'short-sword',
    'Short Sword',
    'melee',
    [0, 1, 2, 'lethal', 1, 1],
    [2, 1, 3, 'lethal', 0, 3],
    1,
  ],
  [
    'slashing-sword',
    'Slashing Sword',
    'melee',
    [3, 1, 2, 'lethal', 1, 1],
    [6, 1, 4, 'lethal', 0, 2],
    1,
  ],
  [
    'sledge',
    'Sledge / Tetsubo',
    'melee',
    [-6, -1, 10, 'lethal', -1, 1],
    [3, -1, 12, 'bashing', -3, 1],
    4,
  ],
  [
    'spear',
    'Spear',
    'melee',
    [3, 1, 3, 'lethal', 0, 1],
    [10, 1, 4, 'lethal', 2, 2],
    2,
  ],
  [
    'staff',
    'Staff',
    'martialArts',
    [0, 0, 2, 'lethal', -1, 1],
    [8, 3, 7, 'bashing', 2, 2],
    1,
  ],
  [
    'straight-sword',
    'Straight Sword',
    'melee',
    [0, 1, 3, 'lethal', 1, 1],
    [4, 3, 3, 'lethal', 1, 3],
    2,
  ],
  [
    'tiger-claws',
    'Tiger Claws',
    'brawl',
    [-3, -1, 2, 'lethal', 0, 1],
    [-3, 1, 3, 'lethal', 0, 3],
    2,
  ],
  [
    'wind-fire-wheel',
    'Wind-Fire Wheel / War Fan',
    'martialArts',
    [0, -2, 0, 'lethal', 2, 1],
    [0, 2, 0, 'lethal', 2, 4],
    1,
  ],
];

function stats(row: WeaponRow, profile: CombatProfile): WeaponProfileStats {
  const values = profile === 'classic' ? row[3] : row[4];
  return {
    speed: values[0],
    accuracy: values[1],
    damage: { attribute: 'strength', modifier: values[2], type: values[3] },
    defense: values[4],
    rate: values[5],
    range: null,
    minimumStrength: row[5],
    notes: [],
  };
}

const meleeWeapons: WeaponDefinition[] = weaponRows.map((row) => ({
  id: row[0],
  name: row[1],
  category: row[0] === 'fist' || row[0] === 'kick' ? 'natural' : 'melee',
  resourceCost: null,
  modes: [
    {
      id: 'melee',
      label: 'Hand-to-hand',
      abilityId: row[2],
      profiles: {
        classic: stats(row, 'classic'),
        'power-combat': stats(row, 'power-combat'),
      },
    },
  ],
  source: {
    ...coreWeapons,
    note: `Power Combat statistics: ${powerWeapons.book}, p. ${powerWeapons.page}`,
  },
}));

const ranged = (
  id: string,
  name: string,
  abilityId: 'archery' | 'thrown',
  classic: [number, number, DamageType, number, number],
  power: [number, number, DamageType, number, number],
  source: SourceReference,
): WeaponDefinition => ({
  id,
  name,
  category: abilityId,
  resourceCost: null,
  modes: [
    {
      id: 'ranged',
      label: 'Ranged',
      abilityId,
      profiles: {
        classic: {
          speed: null,
          accuracy: classic[0],
          damage: {
            attribute: abilityId === 'archery' ? 'strength' : null,
            modifier: classic[1],
            type: classic[2],
          },
          defense: null,
          rate: classic[3],
          range: classic[4],
          notes: [],
        },
        'power-combat': {
          speed: null,
          accuracy: power[0],
          damage: {
            attribute: abilityId === 'archery' ? 'strength' : null,
            modifier: power[1],
            type: power[2],
          },
          defense: null,
          rate: power[3],
          range: power[4],
          notes: [],
        },
      },
    },
  ],
  source,
});

export const exaltedWeaponCatalog: WeaponDefinition[] = [
  ...meleeWeapons,
  ranged(
    'throwing-axe',
    'Thrown Axe / Hatchet',
    'thrown',
    [-1, 3, 'lethal', 2, 10],
    [-1, 3, 'lethal', 2, 10],
    { ...coreWeapons, page: 331 },
  ),
  ranged(
    'chakram',
    'Chakram / Shuriken',
    'thrown',
    [0, 1, 'lethal', 3, 20],
    [0, 1, 'lethal', 3, 20],
    { ...coreWeapons, page: 331 },
  ),
  ranged(
    'throwing-knife',
    'Throwing Knife',
    'thrown',
    [0, 2, 'lethal', 3, 15],
    [0, 2, 'lethal', 3, 15],
    { ...coreWeapons, page: 331 },
  ),
  ranged(
    'self-bow',
    'Self Bow',
    'archery',
    [0, 0, 'lethal', 2, 150],
    [0, 0, 'lethal', 2, 150],
    { ...coreWeapons, page: 330 },
  ),
  ranged(
    'long-bow',
    'Long Bow',
    'archery',
    [1, 0, 'lethal', 3, 200],
    [1, 0, 'lethal', 3, 200],
    { ...coreWeapons, page: 330 },
  ),
  ranged(
    'composite-bow',
    'Composite Bow',
    'archery',
    [0, 0, 'lethal', 3, 250],
    [0, 0, 'lethal', 3, 250],
    { ...coreWeapons, page: 330 },
  ),
  ...(
    [
      ['daiklave', 'Daiklave', [3, 2, 6, 2, 1], [7, 3, 6, 2, 5], 2],
      [
        'grand-daiklave',
        'Grand Daiklave',
        [3, 2, 11, 0, 1],
        [10, 2, 12, -1, 3],
        3,
      ],
      [
        'reaver-daiklave',
        'Reaver Daiklave',
        [0, 2, 8, 0, 1],
        [7, 3, 9, 0, 4],
        2,
      ],
      ['dire-lance', 'Dire Lance', [6, 2, 5, 0, 1], [12, 2, 9, 3, 3], 2],
      ['goremaul', 'Goremaul', [0, 1, 6, 1, 1], [7, 1, 6, 1, 4], 2],
      ['grimcleaver', 'Grimcleaver', [0, 1, 7, 0, 1], [5, 2, 8, -1, 4], 2],
      [
        'serpent-sting-staff',
        'Serpent-Sting Staff',
        [3, 0, 3, 3, 1],
        [3, 0, 5, 3, 4],
        2,
      ],
      ['smashfist', 'Smashfist', [3, 1, 3, 1, 1], [-3, 1, 5, 3, 7], 1],
    ] as const
  ).map(([id, name, classic, power, artifactRating]) => ({
    id,
    name,
    category: 'artifact' as const,
    resourceCost: null,
    artifactRating,
    modes: [
      {
        id: 'melee',
        label: 'Hand-to-hand',
        abilityId:
          id === 'smashfist'
            ? ('brawl' as const)
            : id === 'serpent-sting-staff'
              ? ('martialArts' as const)
              : ('melee' as const),
        profiles: {
          classic: {
            speed: classic[0],
            accuracy: classic[1],
            damage: {
              attribute: 'strength' as const,
              modifier: classic[2],
              type: 'lethal' as const,
            },
            defense: classic[3],
            rate: classic[4],
            range: null,
            notes: [],
          },
          'power-combat': {
            speed: power[0],
            accuracy: power[1],
            damage: {
              attribute: 'strength' as const,
              modifier: power[2],
              type: 'lethal' as const,
            },
            defense: power[3],
            rate: power[4],
            range: null,
            notes: [],
          },
        },
      },
    ],
    source: {
      book: 'Exalted First Edition Core Rulebook',
      page: 342,
      note: "Power Combat statistics: Exalted Player's Guide, p. 211",
    },
  })),
];

exaltedWeaponCatalog
  .find(({ id }) => id === 'javelin')
  ?.modes.push({
    id: 'thrown',
    label: 'Thrown',
    abilityId: 'thrown',
    profiles: {
      classic: {
        speed: null,
        accuracy: 1,
        damage: { attribute: null, modifier: 3, type: 'lethal' },
        defense: null,
        rate: 2,
        range: 30,
        notes: [],
      },
      'power-combat': {
        speed: null,
        accuracy: 1,
        damage: { attribute: null, modifier: 3, type: 'lethal' },
        defense: null,
        rate: 2,
        range: 30,
        notes: [],
      },
    },
  });

const armorSource: SourceReference = {
  book: 'Exalted First Edition Core Rulebook',
  page: 332,
};
const armor = (
  id: string,
  name: string,
  category: ArmorDefinition['category'],
  values: [number, number, number, number, number],
  resourceCost: number | null,
  artifactRating?: number,
): ArmorDefinition => {
  const profile: ArmorProfileStats = {
    lethalSoak: values[0],
    bashingSoak: values[1],
    mobilityPenalty: values[2],
    fatigue: values[3],
    commitment: values[4],
  };
  return {
    id,
    name,
    category,
    resourceCost,
    artifactRating,
    profiles: { classic: profile, 'power-combat': { ...profile } },
    source:
      category === 'artifact' ? { ...armorSource, page: 346 } : armorSource,
  };
};

export const exaltedArmorCatalog: ArmorDefinition[] = [
  armor('breastplate', 'Breastplate', 'light', [4, 2, -1, 1, 0], 2),
  armor('buff-jacket', 'Buff Jacket', 'light', [3, 4, -1, 2, 0], 2),
  armor('chain-shirt', 'Chain Shirt', 'light', [3, 1, 0, 1, 0], 2),
  armor('chain-hauberk', 'Chain Hauberk', 'medium', [6, 7, -3, 2, 0], 3),
  armor('lamellar', 'Lamellar', 'medium', [6, 8, -2, 1, 0], 3),
  armor(
    'reinforced-buff-jacket',
    'Reinforced Buff Jacket',
    'medium',
    [5, 6, -2, 2, 0],
    3,
  ),
  armor('concealed-plates', 'Concealed Plates', 'medium', [5, 6, -2, 3, 0], 3),
  armor('articulated-plate', 'Articulated Plate', 'heavy', [9, 9, -3, 2, 0], 5),
  armor('plate-and-chain', 'Plate-and-Chain', 'heavy', [9, 10, -4, 3, 0], 4),
  armor(
    'reinforced-breastplate',
    'Reinforced Breastplate',
    'heavy',
    [7, 6, -2, 1, 0],
    4,
  ),
  armor(
    'chain-swathing',
    'Chain Swathing',
    'superheavy',
    [11, 14, -6, 5, 0],
    5,
  ),
  armor(
    'superheavy-plate',
    'Superheavy Plate',
    'superheavy',
    [12, 12, -4, 3, 0],
    5,
  ),
  armor(
    'artifact-breastplate',
    'Artifact Breastplate',
    'artifact',
    [6, 4, 0, 0, 2],
    null,
    1,
  ),
  armor(
    'artifact-reinforced-buff-jacket',
    'Artifact Reinforced Buff Jacket',
    'artifact',
    [7, 10, -1, 0, 3],
    null,
    2,
  ),
  armor(
    'artifact-reinforced-breastplate',
    'Artifact Reinforced Breastplate',
    'artifact',
    [10, 9, -1, 1, 4],
    null,
    3,
  ),
  armor(
    'artifact-articulated-plate',
    'Artifact Articulated Plate',
    'artifact',
    [12, 14, -2, 1, 6],
    null,
    4,
  ),
  armor(
    'artifact-superheavy-plate',
    'Artifact Superheavy Plate',
    'artifact',
    [15, 15, -2, 2, 8],
    null,
    5,
  ),
];

export const exaltedAmmunitionCatalog: AmmunitionDefinition[] = [
  {
    id: 'broadhead-arrow',
    name: 'Broadhead Arrow',
    damageModifier: 2,
    damageType: 'lethal',
    notes: [],
    source: { ...coreWeapons, page: 330 },
  },
  {
    id: 'fowling-arrow',
    name: 'Fowling Arrow',
    damageModifier: 2,
    damageType: 'bashing',
    notes: ['May stun as bashing damage.'],
    source: { ...coreWeapons, page: 330 },
  },
  {
    id: 'frog-crotch-arrow',
    name: 'Frog Crotch Arrow',
    damageModifier: 4,
    damageType: 'lethal',
    notes: ["Double the target's armor lethal soak before applying damage."],
    source: { ...coreWeapons, page: 330 },
  },
  {
    id: 'target-arrow',
    name: 'Target Arrow',
    damageModifier: 0,
    damageType: 'lethal',
    notes: ["Halve the target's armor lethal soak before applying damage."],
    source: { ...coreWeapons, page: 330 },
  },
];

export const weaponById = new Map(
  exaltedWeaponCatalog.map((item) => [item.id, item]),
);
export const armorById = new Map(
  exaltedArmorCatalog.map((item) => [item.id, item]),
);
export const ammunitionById = new Map(
  exaltedAmmunitionCatalog.map((item) => [item.id, item]),
);
