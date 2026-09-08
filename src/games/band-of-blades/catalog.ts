export interface BobDefinition {
  id: string;
  name: string;
  kind: string;
  summary: string;
  sourceId: 'bob.core';
  page: number;
  requirements?: string[];
  tags?: string[];
}
const d = (
  kind: string,
  page: number,
  name: string,
  summary: string,
  extra: Partial<BobDefinition> = {},
): BobDefinition => ({
  id: `bob.core.${kind}.${name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`,
  name,
  kind,
  summary,
  sourceId: 'bob.core',
  page,
  ...extra,
});

export const playbooks = [
  d(
    'playbook',
    79,
    'Heavy',
    'A resilient front-line Specialist who protects the squad and confronts superior foes.',
  ),
  d(
    'playbook',
    83,
    'Medic',
    'A combat physician who keeps Legionnaires alive and supports them under pressure.',
  ),
  d(
    'playbook',
    87,
    'Officer',
    'A battlefield leader whose authority and planning coordinate the squad.',
  ),
  d(
    'playbook',
    91,
    'Scout',
    'A stealth and reconnaissance Specialist who finds threats before they strike.',
  ),
  d(
    'playbook',
    95,
    'Sniper',
    'A patient ranged Specialist built around observation, positioning, and decisive shots.',
  ),
  d(
    'playbook',
    99,
    'Rookie',
    'An untested recruit who survives, learns, and earns promotion to Soldier.',
  ),
  d(
    'playbook',
    105,
    'Soldier',
    'A hardened veteran who anchors the Legion and may promote into a Specialist.',
  ),
];
export const actionNames = [
  'Consort',
  'Discipline',
  'Maneuver',
  'Marshal',
  'Research',
  'Rig',
  'Scout',
  'Shoot',
  'Skirmish',
  'Sway',
  'Wreck',
];
export const actions = actionNames.map((x) =>
  d(
    'action',
    70,
    x,
    `Use ${x.toLowerCase()} when that approach matches the fiction; position and effect remain table decisions.`,
  ),
);
export const specialistActions = [
  ['Heavy', 'Anchor', 72],
  ['Medic', 'Doctor', 72],
  ['Officer', 'Channels', 72],
  ['Scout', 'Scrounge', 72],
  ['Sniper', 'Aim', 72],
  ['Soldier', 'Grit', 72],
].map(([pb, n, p]) =>
  d(
    'specialist-action',
    p as number,
    n as string,
    `The ${pb} Specialist resource action. Uses refresh when its published trigger occurs.`,
    { requirements: [pb as string] },
  ),
);
export const heritages = [
  d(
    'heritage',
    63,
    'Bartan',
    'Close-knit and devout; choose two of the published Bartan cultural traits.',
  ),
  d(
    'heritage',
    64,
    'Orite',
    'Cosmopolitan and technically accomplished; choose two Orite cultural traits.',
  ),
  d(
    'heritage',
    65,
    'Panyar',
    'Forest travelers shaped by mobility and craft; choose two Panyar cultural traits.',
  ),
  d(
    'heritage',
    66,
    'Zemyati',
    'Resolute oathkeepers; choose two Zemyati cultural traits.',
  ),
  d(
    'heritage',
    67,
    'Unique Heritage',
    'Replace listed heritage traits with two additional action ranks and describe the upbringing.',
    { requirements: ['GM approval'] },
  ),
];
export const heritageTraits: Record<string, string[]> = {
  Bartan: ['Devout', 'Agrarian', 'Family', 'Token-Bearer'],
  Orite: ['Noble', 'Connected', 'Alchemist', 'Cosmopolitan'],
  Panyar: ['Artisan', 'Traveler', 'Forest-Born', 'Animal-Touched'],
  Zemyati: ['Tough', 'Bold', 'Loyal', 'Stubborn'],
};
export const standardAbilities = [
  'Elite',
  'Hardened',
  'Survivor',
  'Vigorous',
  'Veteran',
];
export const playbookAbilities: Record<string, string[]> = {
  Heavy: [
    'Bulwark',
    'Backup',
    'Vigorous',
    'Against the Darkness',
    'Weaponmaster',
  ],
  Medic: ['Attaché', 'First Aid', 'Chemist', 'Moral Support', 'Field Dressing'],
  Officer: [
    'Tactician',
    'Lead from the Front',
    'Strategist',
    'Officer School',
    'Stand Fast',
  ],
  Scout: [
    'Ghost',
    'Panther-Like Grace',
    'Ready for Anything',
    'Daredevil',
    'Pathfinder',
  ],
  Sniper: ['One Eye', 'Ambush', 'Cover Fire', 'Crimson Shot', 'Sharpshooter'],
  Rookie: [
    "Devil's Own Luck",
    'Every Inch a...',
    'Home Cooking',
    'Jack of All Trades',
    'Not as Bad as It Looked',
  ],
  Soldier: ['Relentless', 'Over the Top', 'Iron Will', 'Grenadier', 'Cavalry'],
};
export const items = [
  'Ammo',
  'Armor',
  'Black Shot',
  'Climbing Kit',
  'Cooking Kit',
  'Hand Weapon',
  'Medic Kit',
  'Musket',
  'Pistol',
  'Reliquary',
  'Repair Kit',
  'Shield',
  'Soldier Kit',
  'Supplies',
  'Winter Clothing',
  'Wrecking Kit',
  'Fine Armor',
  'Fine Hand Weapon',
  'Fine Kit',
  'Fine Musket',
  'Alchemical Bandolier',
].map((x) =>
  d(
    'item',
    74,
    x,
    'Mission equipment with load or uses tracked on the character sheet.',
  ),
);
export const missionTypes = ['Assault', 'Recon', 'Religious', 'Supply'].map(
  (x) =>
    d(
      'mission-type',
      121,
      x,
      `${x} mission with user-recorded objective, reward, penalty, and outcome.`,
    ),
);
export const commandRoles = [
  'Commander',
  'Marshal',
  'Quartermaster',
  'Lorekeeper',
  'Spymaster',
].map((x, i) =>
  d(
    'command-role',
    [117, 125, 135, 143, 149][i]!,
    x,
    'A campaign role that controls its published Legion responsibilities.',
  ),
);
export const campaignActions = [
  'Acquire Assets',
  'Liberty',
  'Long-Term Project',
  'Recruit',
  'Rest and Recuperation',
  'Train',
  'Labor',
].map((x) =>
  d(
    'campaign-action',
    136,
    x,
    'A Quartermaster campaign action with cost, roll, and result recorded explicitly.',
  ),
);
export const materiel = [
  'Black Shot',
  'Horses',
  'Religious Supplies',
  'Siege Weapons',
  'Supply Cart',
  'Alchemy Lab',
].map((x) =>
  d(
    'materiel',
    139,
    x,
    'Legion materiel with availability and uses tracked by the Quartermaster.',
  ),
);
export const chosen = [
  d(
    'chosen',
    165,
    'Shreya',
    'A Chosen whose favor and abilities advance through published triggers.',
  ),
  d(
    'chosen',
    171,
    'The Horned One',
    'A Chosen whose favor and abilities advance through published triggers.',
  ),
  d(
    'chosen',
    177,
    'Zora',
    'A Chosen whose favor and abilities advance through published triggers.',
  ),
];
export const broken = [
  d(
    'broken',
    187,
    'Blighter',
    'Broken reference: alchemy, plague, and undead forces.',
  ),
  d(
    'broken',
    195,
    'Breaker',
    'Broken reference: hexes, witches, and controlled forces.',
  ),
  d(
    'broken',
    203,
    'Render',
    'Broken reference: brutal champions and sworn forces.',
  ),
];
export const spies = [
  'Antoinette',
  'Bortis',
  'Crimson Vexing Gale',
  'Igrid',
  'Liya',
  'Onyetin',
].map((x) =>
  d(
    'spy',
    152,
    x,
    'A recruitable spy with training state, specialty, wounds, and assignments.',
  ),
);
export const spyAssignments = [
  'Recover',
  'Interrogate',
  'Blackmail',
  'Help',
  'Augment Mission',
  'Expand Network',
  'Lay Trap',
  'Recruit',
  'Research',
].map((x) =>
  d(
    'spy-assignment',
    154,
    x,
    'A simple or long-term Spymaster assignment with explicit progress and consequences.',
  ),
);
