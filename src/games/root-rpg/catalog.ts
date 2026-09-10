export interface RootDefinition {
  id: string;
  name: string;
  sourceId: string;
  page: number;
  summary: string;
  verified: boolean;
  referenceOnly?: boolean;
  aliases?: readonly string[];
}
export interface RootPlaybook extends RootDefinition {
  stats: readonly [number, number, number, number, number];
  startingValue: number;
  startingMoves: number;
}
const pb = (
  slug: string,
  name: string,
  sourceId: string,
  page: number,
  stats: RootPlaybook['stats'],
  startingValue: number,
): RootPlaybook => ({
  id: `${sourceId}.playbook.${slug}`,
  name,
  sourceId,
  page,
  stats,
  startingValue,
  startingMoves: 3,
  summary: `${name} frames a distinct style of capable, independent Woodland vagabond.`,
  verified: true,
});
export const rootPlaybooks = [
  pb('adventurer', 'Adventurer', 'root.core', 133, [2, 1, 0, 0, -1], 9),
  pb('arbiter', 'Arbiter', 'root.core', 137, [1, 0, 0, -1, 2], 10),
  pb('harrier', 'Harrier', 'root.core', 141, [0, -1, 2, 1, 0], 9),
  pb('ranger', 'Ranger', 'root.core', 145, [-1, 1, 1, 0, 1], 9),
  pb('ronin', 'Ronin', 'root.core', 149, [0, 1, 0, -1, 2], 11),
  pb('scoundrel', 'Scoundrel', 'root.core', 153, [1, -1, 0, 2, 0], 8),
  pb('thief', 'Thief', 'root.core', 157, [0, 0, 2, 1, -1], 6),
  pb('tinker', 'Tinker', 'root.core', 161, [-1, 2, 1, 0, 0], 8),
  pb('vagrant', 'Vagrant', 'root.core', 165, [2, 1, -1, 0, 0], 9),
  pb('champion', 'Champion', 'root.travelers', 93, [1, -1, -1, 1, 2], 11),
  pb('chronicler', 'Chronicler', 'root.travelers', 97, [-1, 2, 1, 0, 0], 8),
  pb('exile', 'Exile', 'root.travelers', 101, [1, -1, 0, 1, 1], 11),
  pb('envoy', 'Envoy', 'root.travelers', 105, [0, 1, 0, 1, 0], 8),
  pb('heretic', 'Heretic', 'root.travelers', 109, [2, 0, -1, 1, 0], 9),
  pb('pirate', 'Pirate', 'root.travelers', 113, [1, 0, 0, 1, 0], 8),
  pb('prince', 'Prince', 'root.travelers', 117, [-1, 1, 1, 1, 0], 7),
  pb('raconteur', 'Raconteur', 'root.travelers', 121, [2, 1, 1, -1, -1], 8),
  pb('raider', 'Raider', 'root.travelers', 125, [0, -1, 1, 0, 2], 9),
  pb('seeker', 'Seeker', 'root.travelers', 129, [-1, 1, 1, 1, 0], 8),
] as const;
const defs = (
  prefix: string,
  names: readonly string[],
  sourceId: string,
  page: number,
) =>
  names.map(
    (name) =>
      ({
        id: `${sourceId}.${prefix}.${name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`,
        name,
        sourceId,
        page,
        summary: `A published ${prefix.replaceAll('-', ' ')} option for Root vagabonds.`,
        verified: true,
      }) satisfies RootDefinition,
  );
export const natures = defs(
  'nature',
  [
    'Extrovert',
    'Peacemaker',
    'Defender',
    'Punisher',
    'Dutiful',
    'Competitive',
    'Loner',
    'Cynic',
    'Pilgrim',
    'Combative',
    'Rebellious',
    'Hustler',
  ],
  'root.core',
  49,
);
export const drives = defs(
  'drive',
  [
    'Ambition',
    'Clean Paws',
    'Crime',
    'Chaos',
    'Discovery',
    'Freedom',
    'Greed',
    'Justice',
    'Principles',
    'Protection',
    'Revenge',
    'Thrills',
  ],
  'root.core',
  49,
);
export const roguishFeats = defs(
  'roguish-feat',
  [
    'Acrobatics',
    'Blindside',
    'Counterfeit',
    'Disable Device',
    'Hide',
    'Pickpocket',
    'Sneak',
    'Pick Lock',
    'Sleight of Hand',
  ],
  'root.core',
  58,
);
export const weaponSkills = defs(
  'weapon-skill',
  [
    'Cleave',
    'Confuse Senses',
    'Disarm',
    'Harry',
    'Improvise',
    'Parry',
    'Quick Shot',
    'Storm a Group',
    'Trick Shot',
    'Vicious Strike',
  ],
  'root.core',
  59,
);
export const factions = defs(
  'faction',
  ['Marquisate', 'Eyrie Dynasties', 'Woodland Alliance', 'Denizens'],
  'root.core',
  110,
).concat(
  defs(
    'faction',
    ['Riverfolk Company', 'Lizard Cult', 'Grand Duchy', 'Corvid Conspiracy'],
    'root.travelers',
    23,
  ),
  defs(
    'faction',
    ['Lord of the Hundreds', 'Keepers in Iron'],
    'root.re-preview',
    6,
  ),
);
export const basicMoves = defs(
  'move',
  [
    'Attempt a Roguish Feat',
    'Trust Fate',
    'Persuade an NPC',
    'Figure Someone Out',
    'Read a Tense Situation',
    'Trick an NPC',
    'Help or Interfere',
    'Plead with a PC',
  ],
  'root.core',
  68,
);
export const equipmentTags = defs(
  'equipment-tag',
  [
    'Armor',
    'Bulky',
    'Cumbersome',
    'Durable',
    'Fast',
    'Foxfolk Steel',
    'Hair Trigger',
    'Healer’s Kit',
    'Large',
    'Luxury',
    'Mousefolk Steel',
    'Oiled String',
    'Quick',
    'Rabbitfolk Steel',
    'Reach',
    'Sharp',
    'Short Limbs',
    'Thick',
    'Unassuming',
  ],
  'root.core',
  181,
);
export const masteries = defs(
  'mastery',
  ['Move Mastery', 'Weapon Mastery', 'Roguish Mastery', 'Reputation Mastery'],
  'root.travelers',
  69,
);
export const dealerInvestments = defs(
  'dealer-investment',
  [
    'Local Toughs',
    'Endorsement',
    'Eyes & Ears',
    'Fire Sale',
    'Risky Loan',
    'Hardy Enforcers',
    'Know the Territory',
    'Friends in High Places',
    'Brick and Mortar',
    'Lending House',
    'Eager Apprentice',
    'One of Us',
    'A Feast for Crows',
    'Showroom',
  ],
  'root.re-preview',
  1,
).map((x) => ({
  ...x,
  referenceOnly: ![
    'Local Toughs',
    'Endorsement',
    'Eyes & Ears',
    'Fire Sale',
    'Risky Loan',
    'Hardy Enforcers',
    'Know the Territory',
    'Friends in High Places',
    'Brick and Mortar',
    'Lending House',
    'Eager Apprentice',
    'One of Us',
    'A Feast for Crows',
    'Showroom',
  ].includes(x.name),
}));
export const allRootDefinitions = [
  ...rootPlaybooks,
  ...natures,
  ...drives,
  ...roguishFeats,
  ...weaponSkills,
  ...factions,
  ...basicMoves,
  ...equipmentTags,
  ...masteries,
  ...dealerInvestments,
];
